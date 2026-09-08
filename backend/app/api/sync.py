"""
SMRITI+ — Sync API Router

POST /sync/push — batch upload queued offline events (idempotent, per-event results)
GET  /sync/pull  — cursor-based incremental sync
"""

import base64
import json
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import GameSession, ReminderLog, Reminder, AuditLog
from app.core.auth import get_current_user, CurrentUser
from app.api.schemas import (
    SyncPushRequest, SyncPushResponse, SyncEventResult, SyncPullResponse,
)

router = APIRouter(prefix="/sync", tags=["Sync"])

# Entity type → model mapping for validation
ENTITY_MODELS = {
    "game_session": GameSession,
    "reminder_log": ReminderLog,
    "reminder": Reminder,
}

# Required fields per entity type for payload validation
ENTITY_REQUIRED_FIELDS = {
    "game_session": ["game_id", "accuracy", "response_time_ms", "difficulty_level"],
    "reminder_log": ["reminder_id", "status", "responded_via"],
    "reminder": ["elderly_id", "category", "title", "scheduled_time"],
}


@router.post("/push", response_model=SyncPushResponse)
def sync_push(
    request: SyncPushRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Batch upload queued offline events. Per-event results — never all-or-nothing.
    Idempotent: replaying the same client_event_id never creates duplicates.
    """
    results = []

    for event in request.events:
        try:
            result = _process_sync_event(db, event, current_user)
            results.append(result)
        except Exception as e:
            results.append(SyncEventResult(
                client_event_id=event.client_event_id,
                status="rejected",
                error={"code": "processing_error", "message": str(e)},
            ))

    db.commit()
    return SyncPushResponse(results=results)


def _process_sync_event(db: Session, event, current_user: CurrentUser) -> SyncEventResult:
    """Process a single sync event. Returns per-event result."""

    # Validate entity type
    if event.entity_type not in ENTITY_MODELS:
        return SyncEventResult(
            client_event_id=event.client_event_id,
            status="rejected",
            error={"code": "invalid_entity_type", "message": f"Unknown entity type: {event.entity_type}"},
        )

    # Normalize payload fields for robustness across client versions
    payload = dict(event.payload)
    if event.entity_type == "game_session":
        if "accuracy" not in payload and "accuracy_percentage" in payload:
            raw_acc = payload["accuracy_percentage"]
            payload["accuracy"] = raw_acc / 100.0 if raw_acc > 1.0 else float(raw_acc)
    elif event.entity_type == "reminder_log":
        if "status" not in payload and "action" in payload:
            act = payload["action"]
            payload["status"] = "done" if act == "completed" else "missed" if act == "dismissed" else act
        if "responded_via" not in payload and "confirmed_via" in payload:
            payload["responded_via"] = payload["confirmed_via"]

    # Validate required fields in payload
    required = ENTITY_REQUIRED_FIELDS.get(event.entity_type, [])
    missing = [f for f in required if f not in payload]
    if missing:
        return SyncEventResult(
            client_event_id=event.client_event_id,
            status="rejected",
            error={"code": "missing_fields", "message": f"Missing required fields: {missing}"},
        )

    model = ENTITY_MODELS[event.entity_type]

    if event.operation == "created":
        # Idempotency: check if entity already exists
        existing = db.query(model).filter(model.id == event.entity_id).first()
        if existing:
            return SyncEventResult(
                client_event_id=event.client_event_id,
                status="synced",
                server_entity={"id": str(event.entity_id), "note": "already exists"},
            )

        # Create the entity
        if event.entity_type == "game_session":
            entity = GameSession(
                id=event.entity_id,
                elderly_id=current_user.user_id,
                game_id=UUID(payload["game_id"]),
                accuracy=payload["accuracy"],
                response_time_ms=payload["response_time_ms"],
                completed=payload.get("completed", True),
                attempts=payload.get("attempts", 1),
                difficulty_level=payload["difficulty_level"],
                streak_at_time=payload.get("streak_at_time", 0),
                device_id=event.device_id,
                synced_at=datetime.now(timezone.utc),
            )
            db.add(entity)

        elif event.entity_type == "reminder_log":
            entity = ReminderLog(
                id=event.entity_id,
                reminder_id=UUID(payload["reminder_id"]),
                status=payload["status"],
                responded_via=payload["responded_via"],
                device_id=event.device_id,
                responded_at=datetime.now(timezone.utc),
            )
            db.add(entity)

        elif event.entity_type == "reminder":
            entity = Reminder(
                id=event.entity_id,
                elderly_id=UUID(payload["elderly_id"]),
                category=payload["category"],
                title=payload["title"],
                description=payload.get("description"),
                scheduled_time=payload["scheduled_time"],
                recurrence_rule=payload.get("recurrence_rule"),
                created_by=current_user.user_id,
            )
            db.add(entity)

        return SyncEventResult(
            client_event_id=event.client_event_id,
            status="synced",
            server_entity={"id": str(event.entity_id)},
        )

    elif event.operation == "updated":
        existing = db.query(model).filter(model.id == event.entity_id).first()
        if not existing:
            return SyncEventResult(
                client_event_id=event.client_event_id,
                status="rejected",
                error={"code": "not_found", "message": "Entity not found for update"},
            )

        # Last-write-wins using server UTC time
        for key, value in event.payload.items():
            if hasattr(existing, key) and key not in ("id", "created_at"):
                setattr(existing, key, value)
        existing.updated_at = datetime.now(timezone.utc)

        return SyncEventResult(
            client_event_id=event.client_event_id,
            status="synced",
            server_entity={"id": str(event.entity_id)},
        )

    return SyncEventResult(
        client_event_id=event.client_event_id,
        status="rejected",
        error={"code": "invalid_operation", "message": f"Unknown operation: {event.operation}"},
    )


@router.get("/pull", response_model=SyncPullResponse)
def sync_pull(
    cursor: str = Query(default=None, description="Opaque cursor from previous pull"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Cursor-based incremental sync. Returns events changed since the cursor timestamp.
    The cursor is an opaque base64-encoded UTC timestamp.
    """
    PAGE_SIZE = 50

    # Decode cursor to get the since-timestamp
    since = datetime.min.replace(tzinfo=timezone.utc)
    if cursor:
        try:
            decoded = base64.b64decode(cursor).decode()
            since = datetime.fromisoformat(decoded)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cursor")

    events = []

    # Pull game sessions
    sessions = db.query(GameSession).filter(
        GameSession.elderly_id == current_user.user_id,
        GameSession.updated_at > since,
    ).order_by(GameSession.updated_at).limit(PAGE_SIZE).all()

    for s in sessions:
        events.append({
            "entity_type": "game_session",
            "entity_id": str(s.id),
            "operation": "created",
            "data": {
                "id": str(s.id),
                "game_id": str(s.game_id),
                "accuracy": s.accuracy,
                "response_time_ms": s.response_time_ms,
                "completed": s.completed,
                "attempts": s.attempts,
                "difficulty_level": s.difficulty_level,
                "streak_at_time": s.streak_at_time,
                "created_at": s.created_at.isoformat(),
            },
            "updated_at": s.updated_at.isoformat(),
        })

    # Pull reminders
    reminders = db.query(Reminder).filter(
        Reminder.elderly_id == current_user.user_id,
        Reminder.updated_at > since,
    ).order_by(Reminder.updated_at).limit(PAGE_SIZE).all()

    for r in reminders:
        events.append({
            "entity_type": "reminder",
            "entity_id": str(r.id),
            "operation": "created",
            "data": {
                "id": str(r.id),
                "category": r.category,
                "title": r.title,
                "description": r.description,
                "scheduled_time": r.scheduled_time,
                "recurrence_rule": r.recurrence_rule,
                "is_active": r.is_active,
                "created_at": r.created_at.isoformat(),
            },
            "updated_at": r.updated_at.isoformat(),
        })

    # Sort all events by updated_at
    events.sort(key=lambda e: e["updated_at"])

    # Generate next cursor
    has_more = len(events) >= PAGE_SIZE
    next_cursor = None
    if events:
        last_ts = events[-1]["updated_at"]
        next_cursor = base64.b64encode(last_ts.encode()).decode()

    return SyncPullResponse(
        events=events,
        next_cursor=next_cursor,
        has_more=has_more,
    )
