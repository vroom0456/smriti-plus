"""
SMRITI+ — Family Voice Messages API Router

Implements Section 38 & Phase 2 Requirements:
- Caregiver-recorded warm voice messages attached to reminders or greetings
- GET /elders/{elder_id}/voice-messages — list active family voice messages
- POST /elders/{elder_id}/voice-messages — post family voice message
"""

from uuid import UUID
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import FamilyVoiceMessage, AuditLog
from app.core.auth import get_current_user, CurrentUser, verify_elder_access
from app.api.schemas import (
    FamilyVoiceMessageCreate,
    FamilyVoiceMessageResponse,
)

router = APIRouter(tags=["Family Voice Messages"])


@router.get("/elders/{elder_id}/voice-messages", response_model=List[FamilyVoiceMessageResponse])
def get_voice_messages(
    elder_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Retrieve family voice messages for the elder."""
    verify_elder_access(elder_id, current_user, db)

    now = datetime.now(timezone.utc)
    messages = (
        db.query(FamilyVoiceMessage)
        .filter(
            FamilyVoiceMessage.elderly_id == elder_id,
            (FamilyVoiceMessage.expires_at == None) | (FamilyVoiceMessage.expires_at > now),
        )
        .order_by(FamilyVoiceMessage.created_at.desc())
        .all()
    )
    return messages


@router.post("/elders/{elder_id}/voice-messages", response_model=FamilyVoiceMessageResponse, status_code=status.HTTP_201_CREATED)
def post_voice_message(
    elder_id: UUID,
    req: FamilyVoiceMessageCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Caregiver or family member posts a voice message for the elder."""
    verify_elder_access(elder_id, current_user, db)

    msg = FamilyVoiceMessage(
        elderly_id=elder_id,
        caregiver_id=current_user.user_id,
        title=req.title,
        audio_url=req.audio_url,
        message_type=req.message_type,
        expires_at=req.expires_at,
    )
    db.add(msg)

    # Audit log
    audit = AuditLog(
        actor_id=current_user.user_id,
        action="post_family_voice_message",
        target_id=msg.id,
        details={"elder_id": str(elder_id), "title": req.title, "type": req.message_type},
    )
    db.add(audit)
    db.commit()
    db.refresh(msg)
    return msg
