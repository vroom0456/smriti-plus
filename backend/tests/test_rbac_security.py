"""
SMRITI+ Backend — RBAC & IDOR Security Tests

Verifies Section 12 Requirements:
- Caregiver A cannot access Elder B
- Health Worker A cannot access Group B
- Elder cannot access caregiver dashboard
- Elder cannot access another elder's data
- IDOR prevention on /elders/{id} endpoints
"""

import uuid
import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException

from app.core.auth import CurrentUser, verify_elder_access, require_role
from app.db.models import ElderlyProfile, User


def test_caregiver_cannot_access_unlinked_elder():
    caregiver_user_id = uuid.uuid4()
    elder_a_id = uuid.uuid4()
    elder_b_id = uuid.uuid4()

    caregiver = CurrentUser(user_id=caregiver_user_id, role="caregiver")

    # Mock DB where profile links elder_a to caregiver, but NOT elder_b
    db = MagicMock()
    query_mock = MagicMock()
    filter_mock = MagicMock()

    # Query for elder_b returns None (no link)
    filter_mock.first.return_value = None
    query_mock.filter.return_value = filter_mock
    db.query.return_value = query_mock

    with pytest.raises(HTTPException) as exc_info:
        verify_elder_access(elder_b_id, caregiver, db)

    assert exc_info.value.status_code == 403
    assert "Access denied" in exc_info.value.detail


def test_caregiver_can_access_linked_elder():
    caregiver_user_id = uuid.uuid4()
    elder_a_id = uuid.uuid4()

    caregiver = CurrentUser(user_id=caregiver_user_id, role="caregiver")

    db = MagicMock()
    query_mock = MagicMock()
    filter_mock = MagicMock()

    # Query for elder_a returns a valid linked ElderlyProfile
    filter_mock.first.return_value = ElderlyProfile(user_id=elder_a_id, caregiver_id=caregiver_user_id)
    query_mock.filter.return_value = filter_mock
    db.query.return_value = query_mock

    # Should not raise exception
    verify_elder_access(elder_a_id, caregiver, db)


def test_elder_cannot_access_another_elder():
    elder_1_id = uuid.uuid4()
    elder_2_id = uuid.uuid4()

    elder_1 = CurrentUser(user_id=elder_1_id, role="elderly")
    db = MagicMock()

    with pytest.raises(HTTPException) as exc_info:
        verify_elder_access(elder_2_id, elder_1, db)

    assert exc_info.value.status_code == 403
    assert "Access denied" in exc_info.value.detail


def test_elder_can_access_own_data():
    elder_1_id = uuid.uuid4()
    elder_1 = CurrentUser(user_id=elder_1_id, role="elderly")
    db = MagicMock()

    # Should not raise exception
    verify_elder_access(elder_1_id, elder_1, db)


def test_health_worker_cannot_access_unassigned_group():
    worker_user_id = uuid.uuid4()
    other_group_id = uuid.uuid4()
    elder_id = uuid.uuid4()

    worker = CurrentUser(user_id=worker_user_id, role="health_worker")

    db = MagicMock()
    query_mock = MagicMock()
    filter_mock = MagicMock()

    # Elder belongs to other_group_id, not worker_user_id
    filter_mock.first.return_value = ElderlyProfile(user_id=elder_id, health_worker_group_id=other_group_id)
    query_mock.filter.return_value = filter_mock
    db.query.return_value = query_mock

    with pytest.raises(HTTPException) as exc_info:
        verify_elder_access(elder_id, worker, db)

    assert exc_info.value.status_code == 403
    assert "Access denied" in exc_info.value.detail


def test_role_guard_blocks_unauthorized_role():
    elder_id = uuid.uuid4()
    elder = CurrentUser(user_id=elder_id, role="elderly")

    # Guard expecting caregiver role
    guard = require_role("caregiver")

    with pytest.raises(HTTPException) as exc_info:
        guard(current_user=elder)

    assert exc_info.value.status_code == 403
    assert "Access denied" in exc_info.value.detail
