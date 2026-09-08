"""
SMRITI+ Backend — Unit Tests for Phase 2 Pydantic Schemas & Validation
"""

import uuid
import pytest
from pydantic import ValidationError
from app.api.schemas import (
    FamilyContactCreate,
    FamilyContactUpdate,
    MemoryItemCreate,
    FamilyVoiceMessageCreate,
    PersonalizationPreferenceUpdate,
)


def test_family_contact_validation():
    contact = FamilyContactCreate(
        name="Priya Barua",
        relationship_label="Daughter",
        phone="+91 98765 43210",
        is_primary=True,
    )
    assert contact.name == "Priya Barua"
    assert contact.relationship_label == "Daughter"
    assert contact.is_primary is True


def test_memory_item_validation():
    item = MemoryItemCreate(
        type="photo",
        title="Rongali Bihu Celebrations",
        description="Dancing the traditional Bihu dance in Guwahati.",
        media_url="https://smriti-assets.local/bihu.jpg",
        category="Celebrations",
    )
    assert item.type == "photo"
    assert item.category == "Celebrations"

    # Invalid type should fail validation
    with pytest.raises(ValidationError):
        MemoryItemCreate(
            type="invalid_type",
            title="Test",
            media_url="https://example.com/test.jpg",
        )


def test_family_voice_message_validation():
    msg = FamilyVoiceMessageCreate(
        title="Afternoon Medicine Reminder",
        audio_url="https://smriti-assets.local/priya_voice_1.m4a",
        message_type="reminder",
    )
    assert msg.message_type == "reminder"
    assert msg.title == "Afternoon Medicine Reminder"


def test_personalization_preference_validation():
    pref = PersonalizationPreferenceUpdate(
        preferred_game="recall",
        preferred_session_length=15,
        preferred_language="as",
        assistance_level="high",
        text_size="large",
        difficulty_preference=2,
    )
    assert pref.assistance_level == "high"
    assert pref.preferred_session_length == 15

    # Invalid assistance_level should fail validation
    with pytest.raises(ValidationError):
        PersonalizationPreferenceUpdate(
            assistance_level="unsupported_level",
        )
