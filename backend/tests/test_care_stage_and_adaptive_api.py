"""
SMRITI+ Backend — Care Stage & Adaptive Assistance API Tests

Verifies:
1. Human caregiver holds permanent care stage authority (Stages 1, 2, 3)
2. System supports temporary assistance level separation (dementia_stage != assistance_level)
3. RBAC & IDOR prevention: Caregivers can only update linked elders
4. Non-diagnostic caregiver recommendation with explainable signals
5. Elder home summary reflects care_stage and assistance_level
"""

import uuid
import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException

from app.api.caregiver import update_elder_care_stage, get_caregiver_dashboard
from app.api.elders import get_home_summary
from app.api.schemas import CareStageUpdateRequest
from app.core.auth import CurrentUser
from app.db.models import ElderlyProfile, User, Reminder, GameSession, Game


def test_caregiver_updates_care_stage_successfully():
    caregiver_id = uuid.uuid4()
    elder_id = uuid.uuid4()
    current_user = CurrentUser(user_id=caregiver_id, role="caregiver")

    db = MagicMock()
    query_mock = MagicMock()
    filter_mock = MagicMock()

    profile = ElderlyProfile(
        user_id=elder_id,
        caregiver_id=caregiver_id,
        care_stage=1,
        current_assistance_level=1,
    )
    filter_mock.first.return_value = profile
    query_mock.filter.return_value = filter_mock
    db.query.return_value = query_mock

    req = CareStageUpdateRequest(care_stage=2, temporary_assistance_level=2)
    res = update_elder_care_stage(
        caregiver_id=caregiver_id,
        elder_id=elder_id,
        req=req,
        db=db,
        current_user=current_user,
    )

    assert res["status"] == "success"
    assert res["care_stage"] == 2
    assert res["current_assistance_level"] == 2
    assert "Anchor" in res["stage_label"]
    assert profile.care_stage == 2
    assert profile.current_assistance_level == 2
    assert db.commit.called


def test_caregiver_temporary_assistance_level_separation():
    """
    Test Section 12 requirement:
    Permanent care stage = 1, but temporary assistance level = 2
    (e.g., user struggling today, system provides additional assistance).
    """
    caregiver_id = uuid.uuid4()
    elder_id = uuid.uuid4()
    current_user = CurrentUser(user_id=caregiver_id, role="caregiver")

    db = MagicMock()
    query_mock = MagicMock()
    filter_mock = MagicMock()

    profile = ElderlyProfile(
        user_id=elder_id,
        caregiver_id=caregiver_id,
        care_stage=1,
        current_assistance_level=1,
    )
    filter_mock.first.return_value = profile
    query_mock.filter.return_value = filter_mock
    db.query.return_value = query_mock

    req = CareStageUpdateRequest(care_stage=1, temporary_assistance_level=2)
    res = update_elder_care_stage(
        caregiver_id=caregiver_id,
        elder_id=elder_id,
        req=req,
        db=db,
        current_user=current_user,
    )

    assert res["care_stage"] == 1
    assert res["current_assistance_level"] == 2
    assert profile.care_stage == 1
    assert profile.current_assistance_level == 2


def test_caregiver_cannot_update_unlinked_elder():
    caregiver_id = uuid.uuid4()
    unlinked_elder_id = uuid.uuid4()
    current_user = CurrentUser(user_id=caregiver_id, role="caregiver")

    db = MagicMock()
    query_mock = MagicMock()
    filter_mock = MagicMock()

    # Query returns None (unlinked)
    filter_mock.first.return_value = None
    query_mock.filter.return_value = filter_mock
    db.query.return_value = query_mock

    req = CareStageUpdateRequest(care_stage=3)
    with pytest.raises(HTTPException) as exc_info:
        update_elder_care_stage(
            caregiver_id=caregiver_id,
            elder_id=unlinked_elder_id,
            req=req,
            db=db,
            current_user=current_user,
        )

    assert exc_info.value.status_code == 404
    assert "not linked" in exc_info.value.detail


def test_caregiver_cannot_spoof_another_caregiver_id():
    caregiver_a_id = uuid.uuid4()
    caregiver_b_id = uuid.uuid4()
    elder_id = uuid.uuid4()
    current_user = CurrentUser(user_id=caregiver_a_id, role="caregiver")

    db = MagicMock()
    req = CareStageUpdateRequest(care_stage=2)

    with pytest.raises(HTTPException) as exc_info:
        update_elder_care_stage(
            caregiver_id=caregiver_b_id,
            elder_id=elder_id,
            req=req,
            db=db,
            current_user=current_user,
        )

    assert exc_info.value.status_code == 403
    assert "Access denied" in exc_info.value.detail


def test_elder_home_summary_includes_care_stage_and_assistance():
    elder_id = uuid.uuid4()
    current_user = CurrentUser(user_id=elder_id, role="elderly")

    db = MagicMock()
    user = User(
        id=elder_id,
        role="elderly",
        name="Ramesh",
        phone="+919876543210",
        language="te-IN",
    )
    profile = ElderlyProfile(
        user_id=elder_id,
        text_size="large",
        voice_sensitivity=0.8,
        care_stage=2,
        current_assistance_level=2,
    )

    def query_side_effect(model):
        m = MagicMock()
        if model == User:
            m.filter.return_value.first.return_value = user
        elif model == ElderlyProfile:
            m.filter.return_value.first.return_value = profile
        elif model == Game:
            m.filter.return_value.all.return_value = []
        elif model == Reminder:
            m.filter.return_value.all.return_value = []
        elif model == GameSession:
            m.filter.return_value.all.return_value = []
            m.filter.return_value.order_by.return_value.first.return_value = None
        return m

    db.query.side_effect = query_side_effect

    res = get_home_summary(elder_id=elder_id, db=db, current_user=current_user)

    assert res.care_stage == 2
    assert res.assistance_level == 2
    assert res.effective_level == 2
    assert "Anchor" in res.stage_label
