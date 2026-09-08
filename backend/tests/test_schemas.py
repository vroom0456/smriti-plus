"""
SMRITI+ Backend — Unit Tests for Pydantic Schemas & Validation
"""

import uuid
import pytest
from pydantic import ValidationError
from app.api.schemas import (
    GameSessionCreate,
    ReminderCreate,
    SyncEvent,
    SyncPushRequest,
)


def test_game_session_validation():
    # Valid game session
    session = GameSessionCreate(
        id=uuid.uuid4(),
        game_id=uuid.uuid4(),
        accuracy=0.85,
        response_time_ms=12000,
        completed=True,
        attempts=1,
        difficulty_level=2,
    )
    assert session.accuracy == 0.85
    assert session.difficulty_level == 2

    # Invalid accuracy (> 1.0)
    with pytest.raises(ValidationError):
        GameSessionCreate(
            id=uuid.uuid4(),
            game_id=uuid.uuid4(),
            accuracy=1.5,
            response_time_ms=1000,
            difficulty_level=1,
        )


def test_reminder_create_validation():
    rem = ReminderCreate(
        elderly_id=uuid.uuid4(),
        category="medicine",
        title="Blood Pressure Tablet",
        scheduled_time="08:30",
        recurrence_rule="daily",
    )
    assert rem.category == "medicine"
    assert rem.title == "Blood Pressure Tablet"


def test_sync_push_request_validation():
    event = SyncEvent(
        client_event_id=uuid.uuid4(),
        entity_type="game_session",
        operation="created",
        entity_id=uuid.uuid4(),
        payload={"game_id": str(uuid.uuid4()), "accuracy": 0.9, "response_time_ms": 5000, "difficulty_level": 1},
    )
    req = SyncPushRequest(events=[event])
    assert len(req.events) == 1
    assert req.events[0].entity_type == "game_session"
