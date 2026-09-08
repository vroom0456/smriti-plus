"""
SMRITI+ — Games API Router

GET  /games                           — list available games
POST /games/{id}/session              — submit a completed session (idempotent)
GET  /elders/{id}/difficulty/{game_id} — current adaptive difficulty + explanation
"""

from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.db.models import Game, GameSession, DifficultyState, AuditLog
from app.core.auth import get_current_user, CurrentUser, require_role, verify_elder_access
from app.api.schemas import (
    GameResponse, GameSessionCreate, GameSessionResponse, DifficultyResponse,
)
from app.ai.difficulty_engine import difficulty_engine, SessionInput

router = APIRouter(tags=["Games"])


@router.get("/games", response_model=list[GameResponse])
def list_games(db: Session = Depends(get_db), _: CurrentUser = Depends(get_current_user)):
    """List all active games."""
    games = db.query(Game).filter(Game.is_active == True).all()
    return [GameResponse.model_validate(g) for g in games]


@router.post("/games/{game_id}/session", response_model=GameSessionResponse, status_code=status.HTTP_201_CREATED)
def submit_game_session(
    game_id: UUID,
    session_data: GameSessionCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("elderly")),
):
    """
    Submit a completed game session. Idempotent on client-generated UUID.
    Creates session, updates difficulty state, and logs audit — transactionally.
    """
    # Idempotency check: if session UUID already exists, return existing
    existing = db.query(GameSession).filter(GameSession.id == session_data.id).first()
    if existing:
        return GameSessionResponse.model_validate(existing)

    # Validate game exists
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

    if session_data.game_id != game_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="game_id in body must match URL")

    # Create session
    session = GameSession(
        id=session_data.id,
        elderly_id=current_user.user_id,
        game_id=game_id,
        accuracy=session_data.accuracy,
        response_time_ms=session_data.response_time_ms,
        completed=session_data.completed,
        attempts=session_data.attempts,
        difficulty_level=session_data.difficulty_level,
        streak_at_time=session_data.streak_at_time,
        device_id=session_data.device_id,
        synced_at=datetime.now(timezone.utc),
    )
    db.add(session)

    # Update difficulty state using the AI engine
    rec = _update_difficulty(db, current_user.user_id, game_id, game)

    # Audit log
    db.add(AuditLog(
        actor_id=current_user.user_id,
        action="game_session_completed",
        target_id=session_data.id,
        details={
            "game_id": str(game_id),
            "accuracy": session_data.accuracy,
            "difficulty": session_data.difficulty_level,
        },
    ))

    db.commit()
    db.refresh(session)

    resp = GameSessionResponse.model_validate(session)
    resp.recommendation = rec
    return resp


@router.get("/elders/{elder_id}/difficulty/{game_id}", response_model=DifficultyResponse)
def get_difficulty(
    elder_id: UUID,
    game_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get current adaptive difficulty level with explanation."""
    verify_elder_access(elder_id, current_user, db)

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

    # Get or create difficulty state
    state = db.query(DifficultyState).filter(
        DifficultyState.elderly_id == elder_id,
        DifficultyState.game_id == game_id,
    ).first()

    current_level = state.current_level if state else game.base_difficulty

    # Get recent sessions for explanation
    recent_sessions = db.query(GameSession).filter(
        GameSession.elderly_id == elder_id,
        GameSession.game_id == game_id,
    ).order_by(desc(GameSession.created_at)).limit(5).all()

    session_inputs = [
        SessionInput(
            accuracy=s.accuracy,
            response_time_ms=s.response_time_ms,
            completed=s.completed,
            attempts=s.attempts,
            difficulty_level=s.difficulty_level,
        )
        for s in reversed(recent_sessions)
    ]

    recommendation = difficulty_engine.recommend(
        session_history=session_inputs,
        current_difficulty=current_level,
        target_time_ms=game.target_time_ms,
        min_difficulty=game.min_difficulty,
        max_difficulty=game.max_difficulty,
    )

    return DifficultyResponse(
        game_id=game_id,
        current_level=recommendation.difficulty,
        previous_level=recommendation.previous_difficulty,
        reason=recommendation.reason,
        encouragement=recommendation.encouragement_message,
        input_metrics=recommendation.input_metrics,
    )


def _update_difficulty(db: Session, elderly_id: UUID, game_id: UUID, game: Game) -> DifficultyResponse:
    """Update difficulty state after a session — called transactionally."""
    recent_sessions = db.query(GameSession).filter(
        GameSession.elderly_id == elderly_id,
        GameSession.game_id == game_id,
    ).order_by(desc(GameSession.created_at)).limit(5).all()

    session_inputs = [
        SessionInput(
            accuracy=s.accuracy,
            response_time_ms=s.response_time_ms,
            completed=s.completed,
            attempts=s.attempts,
            difficulty_level=s.difficulty_level,
        )
        for s in reversed(recent_sessions)
    ]

    state = db.query(DifficultyState).filter(
        DifficultyState.elderly_id == elderly_id,
        DifficultyState.game_id == game_id,
    ).first()

    current_level = state.current_level if state else game.base_difficulty

    recommendation = difficulty_engine.recommend(
        session_history=session_inputs,
        current_difficulty=current_level,
        target_time_ms=game.target_time_ms,
        min_difficulty=game.min_difficulty,
        max_difficulty=game.max_difficulty,
    )

    # Count consecutive failures for state tracking
    consecutive_failures = difficulty_engine._count_consecutive_failures(session_inputs)

    if state:
        state.current_level = recommendation.difficulty
        state.consecutive_failures = consecutive_failures
        state.last_updated = datetime.now(timezone.utc)
    else:
        db.add(DifficultyState(
            elderly_id=elderly_id,
            game_id=game_id,
            current_level=recommendation.difficulty,
            consecutive_failures=consecutive_failures,
        ))

    return DifficultyResponse(
        game_id=game_id,
        current_level=recommendation.difficulty,
        previous_level=recommendation.previous_difficulty,
        reason=recommendation.reason,
        encouragement=recommendation.encouragement_message,
        input_metrics=recommendation.input_metrics,
    )
