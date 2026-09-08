"""
SMRITI+ — Reminders API Router

GET   /elders/{id}/reminders/today — elder's today list
POST  /reminders                   — caregiver creates
PATCH /reminders/{id}              — caregiver edits
POST  /reminders/{id}/log          — elder marks done/missed (idempotent)
"""

from uuid import UUID
from datetime import datetime, timezone, date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.db.database import get_db
from app.db.models import Reminder, ReminderLog, AuditLog
from app.core.auth import (
    get_current_user, CurrentUser, require_role,
    verify_elder_access, verify_caregiver_owns_elder,
)
from app.api.schemas import (
    ReminderCreate, ReminderUpdate, ReminderResponse,
    ReminderLogCreate, ReminderLogResponse,
)

router = APIRouter(tags=["Reminders"])


@router.get("/elders/{elder_id}/reminders/today", response_model=list[ReminderResponse])
def get_today_reminders(
    elder_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get today's active reminders for an elder, with current status."""
    verify_elder_access(elder_id, current_user, db)

    reminders = db.query(Reminder).filter(
        Reminder.elderly_id == elder_id,
        Reminder.is_active == True,
    ).order_by(Reminder.scheduled_time).all()

    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    today_end = datetime.combine(date.today(), datetime.max.time()).replace(tzinfo=timezone.utc)

    results = []
    for r in reminders:
        # Check if there's a log for today
        today_log = db.query(ReminderLog).filter(
            ReminderLog.reminder_id == r.id,
            ReminderLog.responded_at >= today_start,
            ReminderLog.responded_at <= today_end,
        ).first()

        resp = ReminderResponse.model_validate(r)
        resp.today_status = today_log.status if today_log else "pending"
        results.append(resp)

    return results


@router.post("/reminders", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    reminder: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("caregiver", "elderly")),
):
    """Create a reminder. Caregivers can create for their linked elders; elders for themselves."""
    if current_user.role == "caregiver":
        verify_caregiver_owns_elder(reminder.elderly_id, current_user, db)
    elif current_user.role == "elderly" and current_user.user_id != reminder.elderly_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only create reminders for yourself")

    new_reminder = Reminder(
        elderly_id=reminder.elderly_id,
        category=reminder.category,
        title=reminder.title,
        description=reminder.description,
        scheduled_time=reminder.scheduled_time,
        recurrence_rule=reminder.recurrence_rule,
        created_by=current_user.user_id,
    )
    db.add(new_reminder)

    db.add(AuditLog(
        actor_id=current_user.user_id,
        action="reminder_created",
        target_id=new_reminder.id,
        details={"category": reminder.category, "title": reminder.title},
    ))

    db.commit()
    db.refresh(new_reminder)
    resp = ReminderResponse.model_validate(new_reminder)
    resp.today_status = "pending"
    return resp


@router.patch("/reminders/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: UUID,
    updates: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("caregiver")),
):
    """Update a reminder. Only the linked caregiver can edit."""
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    verify_caregiver_owns_elder(reminder.elderly_id, current_user, db)

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reminder, field, value)
    reminder.updated_at = datetime.now(timezone.utc)

    db.add(AuditLog(
        actor_id=current_user.user_id,
        action="reminder_updated",
        target_id=reminder_id,
        details=update_data,
    ))

    db.commit()
    db.refresh(reminder)
    return ReminderResponse.model_validate(reminder)


@router.post("/reminders/{reminder_id}/log", response_model=ReminderLogResponse, status_code=status.HTTP_201_CREATED)
def log_reminder(
    reminder_id: UUID,
    log_data: ReminderLogCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("elderly")),
):
    """
    Elder marks a reminder as done/missed/snoozed. Idempotent on client-generated UUID.
    Append-only — logs are never overwritten.
    """
    # Idempotency check
    existing = db.query(ReminderLog).filter(ReminderLog.id == log_data.id).first()
    if existing:
        return ReminderLogResponse.model_validate(existing)

    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    if reminder.elderly_id != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your reminder")

    log = ReminderLog(
        id=log_data.id,
        reminder_id=reminder_id,
        status=log_data.status,
        responded_via=log_data.responded_via,
        device_id=log_data.device_id,
        responded_at=datetime.now(timezone.utc),
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return ReminderLogResponse.model_validate(log)
