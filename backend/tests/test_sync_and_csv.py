"""
Tests for SMRITI+ Sync Engine & Health Worker CSV Export

Verifies:
1. POST /sync/push processes game_session and reminder_log
2. POST /sync/push is idempotent on duplicate client_event_id
3. GET /health-worker/{id}/export-csv returns CSV with 200 for assigned worker
4. GET /health-worker/{id}/export-csv returns 403 for unauthorized access
5. POST /games/{id}/session returns explainable recommendation
"""

import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.core.auth import create_access_token

client = TestClient(app)

ELDER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
WORKER_ID = uuid.UUID("66666666-6666-6666-6666-666666666666")
OTHER_WORKER_ID = uuid.UUID("77777777-7777-7777-7777-777777777777")
GAME_MATCHING_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


@pytest.fixture
def elder_token():
    return create_access_token(user_id=ELDER_ID, role="elderly")


@pytest.fixture
def worker_token():
    return create_access_token(user_id=WORKER_ID, role="health_worker")


def test_sync_push_game_session(elder_token):
    """Sync push accepts and saves game_session offline event."""
    client_event_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())

    payload = {
        "events": [
            {
                "client_event_id": client_event_id,
                "device_id": "test-device",
                "entity_type": "game_session",
                "operation": "created",
                "entity_id": session_id,
                "payload": {
                    "game_id": str(GAME_MATCHING_ID),
                    "accuracy": 0.88,
                    "response_time_ms": 32000,
                    "difficulty_level": 2,
                    "completed": True,
                    "attempts": 4,
                },
            }
        ]
    }

    res = client.post(
        "/sync/push",
        json=payload,
        headers={"Authorization": f"Bearer {elder_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) == 1
    assert data["results"][0]["status"] == "synced"
    assert data["results"][0]["client_event_id"] == client_event_id


def test_sync_push_idempotent(elder_token):
    """Replaying the exact same event does not error or duplicate."""
    client_event_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())

    payload = {
        "events": [
            {
                "client_event_id": client_event_id,
                "device_id": "test-device",
                "entity_type": "game_session",
                "operation": "created",
                "entity_id": session_id,
                "payload": {
                    "game_id": str(GAME_MATCHING_ID),
                    "accuracy": 0.75,
                    "response_time_ms": 40000,
                    "difficulty_level": 2,
                },
            }
        ]
    }

    # First push
    res1 = client.post("/sync/push", json=payload, headers={"Authorization": f"Bearer {elder_token}"})
    assert res1.status_code == 200
    assert res1.json()["results"][0]["status"] == "synced"

    # Second push (idempotent replay)
    res2 = client.post("/sync/push", json=payload, headers={"Authorization": f"Bearer {elder_token}"})
    assert res2.status_code == 200
    assert res2.json()["results"][0]["status"] == "synced"
    assert res2.json()["results"][0]["server_entity"]["note"] == "already exists"


def test_health_worker_csv_export_authorized(worker_token):
    """Authorized health worker can export CSV cohort metrics."""
    res = client.get(
        f"/health-worker/{WORKER_ID}/export-csv",
        headers={"Authorization": f"Bearer {worker_token}"},
    )
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert f"smriti_cohort_{WORKER_ID}.csv" in res.headers["content-disposition"]

    csv_text = res.text
    assert "elder_id,name,engagement_score_7d,reminder_adherence_pct" in csv_text


def test_health_worker_csv_export_forbidden(worker_token):
    """Health worker cannot export a different group's CSV (RBAC enforcement)."""
    res = client.get(
        f"/health-worker/{OTHER_WORKER_ID}/export-csv",
        headers={"Authorization": f"Bearer {worker_token}"},
    )
    assert res.status_code == 403


def test_game_session_returns_recommendation(elder_token):
    """Submitting a game session returns an explainable recommendation."""
    session_id = str(uuid.uuid4())
    payload = {
        "id": session_id,
        "game_id": str(GAME_MATCHING_ID),
        "accuracy": 0.95,
        "response_time_ms": 25000,
        "completed": True,
        "attempts": 4,
        "difficulty_level": 2,
        "streak_at_time": 1,
        "device_id": "test-device",
    }

    res = client.post(
        f"/games/{GAME_MATCHING_ID}/session",
        json=payload,
        headers={"Authorization": f"Bearer {elder_token}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert "recommendation" in data
    assert data["recommendation"] is not None
    assert "reason" in data["recommendation"]
    assert "current_level" in data["recommendation"]
