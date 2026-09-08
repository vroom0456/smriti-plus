"""
SMRITI+ — Elders API Router

GET /elders/{id}/home-summary — next-best-action + today's reminders count
"""

from typing import Optional
from uuid import UUID
from datetime import datetime, timezone, date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.db.database import get_db
from app.db.models import User, ElderlyProfile, GameSession, Reminder, ReminderLog, DifficultyState, Game
from app.core.auth import get_current_user, CurrentUser, verify_elder_access
from app.api.schemas import HomeSummaryResponse
from app.ai.difficulty_engine import difficulty_engine, SessionInput

router = APIRouter(tags=["Elders"])


@router.get("/elders/{elder_id}/home-summary", response_model=HomeSummaryResponse)
def get_home_summary(
    elder_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Home screen data for an elderly user:
    - Personalized greeting
    - Next-best-action recommendation
    - Today's reminder counts
    - Current streak
    """
    verify_elder_access(elder_id, current_user, db)

    elder = db.query(User).filter(User.id == elder_id).first()
    if not elder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elder not found")

    # ── Greeting ──
    hour = datetime.now(timezone.utc).hour
    if hour < 12:
        time_greeting = "Good morning"
    elif hour < 17:
        time_greeting = "Good afternoon"
    else:
        time_greeting = "Good evening"
    greeting = f"{time_greeting}, {elder.name}"

    # ── Today's reminders ──
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    today_end = datetime.combine(date.today(), datetime.max.time()).replace(tzinfo=timezone.utc)

    reminders = db.query(Reminder).filter(
        Reminder.elderly_id == elder_id,
        Reminder.is_active == True,
    ).all()

    total_today = len(reminders)
    done_today = 0
    for r in reminders:
        log = db.query(ReminderLog).filter(
            ReminderLog.reminder_id == r.id,
            ReminderLog.responded_at >= today_start,
            ReminderLog.responded_at <= today_end,
            ReminderLog.status == "done",
        ).first()
        if log:
            done_today += 1

    pending_today = total_today - done_today

    # ── Current streak ──
    streak = _calculate_streak(db, elder_id)

    # ── Next best action (personalized recommendation) ──
    next_action = _get_next_action(db, elder_id)

    # ── Care Stage & Assistance Level ──
    profile = db.query(ElderlyProfile).filter(ElderlyProfile.user_id == elder_id).first()
    care_stage = getattr(profile, "care_stage", 1) if profile else 1
    assistance_level = getattr(profile, "current_assistance_level", 1) if profile else 1
    effective_level = assistance_level or care_stage or 1
    stage_labels = {
        1: "Level 1 — Assistant",
        2: "Level 2 — Anchor",
        3: "Level 3 — Window",
    }

    return HomeSummaryResponse(
        greeting=greeting,
        next_action=next_action,
        reminders_today_count=total_today,
        reminders_pending_count=pending_today,
        current_streak=streak,
        care_stage=care_stage,
        assistance_level=assistance_level,
        effective_level=effective_level,
        stage_label=stage_labels.get(effective_level, "Level 1 — Assistant"),
    )


def _calculate_streak(db: Session, elder_id: UUID) -> int:
    """Count consecutive days with at least one game session, ending today."""
    today = date.today()
    streak = 0
    for i in range(60):  # look back up to 60 days
        check_date = today - timedelta(days=i)
        day_start = datetime.combine(check_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        day_end = datetime.combine(check_date, datetime.max.time()).replace(tzinfo=timezone.utc)
        has_session = db.query(GameSession).filter(
            GameSession.elderly_id == elder_id,
            GameSession.created_at >= day_start,
            GameSession.created_at <= day_end,
        ).first()
        if has_session:
            streak += 1
        else:
            if i == 0:
                continue  # today hasn't been played yet, keep checking
            break
    return streak


def _get_next_action(db: Session, elder_id: UUID) -> Optional[dict]:
    """
    Determine the next-best-action for the elder based on their game history.
    Uses the difficulty engine to provide a personalized recommendation.
    """
    # Find the game with the most recent session, or the first game if no sessions
    games = db.query(Game).filter(Game.is_active == True).all()
    if not games:
        return None

    # Find which game the elder should play next (rotate through games)
    game_sessions_counts = {}
    for game in games:
        count = db.query(GameSession).filter(
            GameSession.elderly_id == elder_id,
            GameSession.game_id == game.id,
        ).count()
        game_sessions_counts[game.id] = count

    # Recommend the least-played game
    recommended_game = min(games, key=lambda g: game_sessions_counts.get(g.id, 0))

    # Get difficulty recommendation
    recent = db.query(GameSession).filter(
        GameSession.elderly_id == elder_id,
        GameSession.game_id == recommended_game.id,
    ).order_by(desc(GameSession.created_at)).limit(5).all()

    session_inputs = [
        SessionInput(
            accuracy=s.accuracy,
            response_time_ms=s.response_time_ms,
            completed=s.completed,
            attempts=s.attempts,
            difficulty_level=s.difficulty_level,
        )
        for s in reversed(recent)
    ]

    state = db.query(DifficultyState).filter(
        DifficultyState.elderly_id == elder_id,
        DifficultyState.game_id == recommended_game.id,
    ).first()

    current_diff = state.current_level if state else recommended_game.base_difficulty

    rec = difficulty_engine.recommend(
        session_history=session_inputs,
        current_difficulty=current_diff,
        target_time_ms=recommended_game.target_time_ms,
        min_difficulty=recommended_game.min_difficulty,
        max_difficulty=recommended_game.max_difficulty,
    )

    # Plain-language message for the elder (never "AI" or raw scores)
    if rec.difficulty > rec.previous_difficulty:
        message = f"Your next {recommended_game.name} game is a little harder today — you've been doing great!"
    elif rec.difficulty < rec.previous_difficulty:
        message = f"Your next {recommended_game.name} game is a bit easier — take it at your own pace."
    else:
        message = f"Ready for another round of {recommended_game.name}? Let's go!"

    return {
        "message": message,
        "game_id": str(recommended_game.id),
        "game_name": recommended_game.name,
        "difficulty": rec.difficulty,
        "reason": rec.reason,
    }
