"""
SMRITI+ — Personalization & Adaptive Assistance API Router

Implements Sections 25, 26, 41, 71 & Phase 2 Requirements:
- GET /elders/{elder_id}/personalization — get elder's settings and preferences
- PATCH /elders/{elder_id}/personalization — human override / caregiver adjustment
- POST /elders/{elder_id}/assistance-check — run adaptive assistance engine for real-time game adaptation
"""

from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import PersonalizationPreference, AuditLog
from app.core.auth import get_current_user, CurrentUser, verify_elder_access
from app.api.schemas import (
    PersonalizationPreferenceUpdate,
    PersonalizationPreferenceResponse,
    AssistanceEvaluationRequest,
    AssistanceEvaluationResponse,
)
from app.ai.assistance_engine import AssistanceEngine, AssistanceInputMetrics

router = APIRouter(tags=["Personalization & Adaptive Assistance"])
assistance_engine = AssistanceEngine()


@router.get("/elders/{elder_id}/personalization", response_model=PersonalizationPreferenceResponse)
def get_personalization(
    elder_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get personalized preferences for game, language, assistance level, and text size."""
    verify_elder_access(elder_id, current_user, db)

    pref = db.query(PersonalizationPreference).filter(PersonalizationPreference.elderly_id == elder_id).first()
    if not pref:
        # Create default preferences
        pref = PersonalizationPreference(elderly_id=elder_id)
        db.add(pref)
        db.commit()
        db.refresh(pref)

    return pref


@router.patch("/elders/{elder_id}/personalization", response_model=PersonalizationPreferenceResponse)
def update_personalization(
    elder_id: UUID,
    req: PersonalizationPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Update personalization preferences (caregiver override or elder preference)."""
    verify_elder_access(elder_id, current_user, db)

    pref = db.query(PersonalizationPreference).filter(PersonalizationPreference.elderly_id == elder_id).first()
    if not pref:
        pref = PersonalizationPreference(elderly_id=elder_id)
        db.add(pref)

    if req.preferred_game is not None:
        pref.preferred_game = req.preferred_game
    if req.preferred_session_length is not None:
        pref.preferred_session_length = req.preferred_session_length
    if req.preferred_language is not None:
        pref.preferred_language = req.preferred_language
    if req.preferred_voice is not None:
        pref.preferred_voice = req.preferred_voice
    if req.assistance_level is not None:
        pref.assistance_level = req.assistance_level
    if req.animation_level is not None:
        pref.animation_level = req.animation_level
    if req.text_size is not None:
        pref.text_size = req.text_size
    if req.difficulty_preference is not None:
        pref.difficulty_preference = req.difficulty_preference

    pref.updated_at = datetime.now(timezone.utc)

    # Audit log
    audit = AuditLog(
        actor_id=current_user.user_id,
        action="update_personalization_preferences",
        target_id=elder_id,
        details=req.model_dump(exclude_unset=True),
    )
    db.add(audit)
    db.commit()
    db.refresh(pref)
    return pref


@router.post("/elders/{elder_id}/assistance-check", response_model=AssistanceEvaluationResponse)
def check_assistance(
    elder_id: UUID,
    req: AssistanceEvaluationRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Evaluate live game metrics and struggle signals to compute adaptive assistance:
    reduced choices, hints, and comfort breaks.
    """
    verify_elder_access(elder_id, current_user, db)

    pref = db.query(PersonalizationPreference).filter(PersonalizationPreference.elderly_id == elder_id).first()
    override = pref.assistance_level if pref else None

    metrics = AssistanceInputMetrics(
        accuracy=req.accuracy,
        response_time_ms=req.response_time_ms,
        target_time_ms=req.target_time_ms,
        attempts=req.attempts,
        hesitation_detected=req.hesitation_detected,
        repeated_help_requests=req.repeated_help_requests,
        consecutive_low_scores=req.consecutive_low_scores,
        session_duration_minutes=req.session_duration_minutes,
        user_override_assistance=override,
    )

    result = assistance_engine.evaluate(metrics)

    return AssistanceEvaluationResponse(
        assistance_level=result.assistance_level,
        num_choices=result.num_choices,
        instruction_mode=result.instruction_mode,
        offer_hint=result.offer_hint,
        allowed_time_multiplier=result.allowed_time_multiplier,
        suggest_break=result.suggest_break,
        break_reason=result.break_reason,
        encouragement_message=result.encouragement_message,
        explanation_for_caregiver=result.explanation_for_caregiver,
        struggle_detected=result.struggle_detected,
        signals=result.signals,
    )
