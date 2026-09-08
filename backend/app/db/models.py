"""
SMRITI+ Backend — SQLAlchemy Models

Complete data model matching Section 6 of the build specification.
All constraints, indexes, and relationships defined here.

SMRITI+ supports cognitive engagement and daily assistance;
it does not diagnose or treat dementia.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, CheckConstraint, UniqueConstraint, Index, JSON, Uuid as UUID,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.database import Base

JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


def utcnow():
    return datetime.now(timezone.utc)


def new_uuid():
    return uuid.uuid4()


# ──────────────────────────────────────────────
# USERS
# ──────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    role = Column(String(20), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=True)  # for demo accounts
    password_hash = Column(String(255), nullable=True)  # PIN hash for elderly, password for demo
    language = Column(String(10), nullable=False, default="en")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    elderly_profile = relationship("ElderlyProfile", back_populates="user", uselist=False,
                                   foreign_keys="ElderlyProfile.user_id")
    caregiver_elders = relationship("ElderlyProfile", back_populates="caregiver",
                                    foreign_keys="ElderlyProfile.caregiver_id")

    __table_args__ = (
        CheckConstraint(
            "role IN ('elderly', 'caregiver', 'health_worker')",
            name="ck_users_role"
        ),
    )


# ──────────────────────────────────────────────
# ELDERLY PROFILES
# ──────────────────────────────────────────────

class ElderlyProfile(Base):
    __tablename__ = "elderly_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                     primary_key=True)
    caregiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"),
                          nullable=True)
    health_worker_group_id = Column(UUID(as_uuid=True), nullable=True)
    text_size = Column(String(20), nullable=False, default="large")
    voice_sensitivity = Column(Float, nullable=False, default=0.5)
    caregiver_link_code_hash = Column(String(255), nullable=True)
    caregiver_link_code_expires_at = Column(DateTime(timezone=True), nullable=True)
    photo_url = Column(String(500), nullable=True)
    care_stage = Column(Integer, nullable=False, default=1)  # 1 (Stage 1), 2 (Stage 2), 3 (Stage 3) — Caregiver controlled
    current_assistance_level = Column(Integer, nullable=False, default=1)  # 1 (Assistant), 2 (Anchor), 3 (Window) — Dynamically recommended/temporary
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    user = relationship("User", back_populates="elderly_profile", foreign_keys=[user_id])
    caregiver = relationship("User", back_populates="caregiver_elders", foreign_keys=[caregiver_id])

    __table_args__ = (
        CheckConstraint(
            "text_size IN ('standard', 'large', 'extra_large')",
            name="ck_elderly_profiles_text_size"
        ),
        Index("ix_elderly_profiles_caregiver_id", "caregiver_id"),
        Index("ix_elderly_profiles_health_worker_group_id", "health_worker_group_id"),
    )


# ──────────────────────────────────────────────
# GAMES
# ──────────────────────────────────────────────

class Game(Base):
    __tablename__ = "games"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    name = Column(String(100), nullable=False, unique=True)
    category = Column(String(50), nullable=False)
    base_difficulty = Column(Integer, nullable=False, default=1)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    target_time_ms = Column(Integer, nullable=False, default=60000)  # default 60s
    min_difficulty = Column(Integer, nullable=False, default=1)
    max_difficulty = Column(Integer, nullable=False, default=5)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    __table_args__ = (
        CheckConstraint(
            "category IN ('memory_recall', 'memory_matching', 'attention', 'pattern_recognition')",
            name="ck_games_category"
        ),
        CheckConstraint("min_difficulty >= 1", name="ck_games_min_difficulty"),
        CheckConstraint("max_difficulty >= min_difficulty", name="ck_games_max_difficulty"),
    )


# ──────────────────────────────────────────────
# GAME SESSIONS
# ──────────────────────────────────────────────

class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True)  # client-generated UUID, no default
    elderly_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                        nullable=False)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id", ondelete="CASCADE"),
                     nullable=False)
    accuracy = Column(Float, nullable=False)
    response_time_ms = Column(Integer, nullable=False)
    completed = Column(Boolean, nullable=False, default=True)
    attempts = Column(Integer, nullable=False, default=1)
    difficulty_level = Column(Integer, nullable=False)
    streak_at_time = Column(Integer, nullable=False, default=0)
    device_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)
    synced_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    elderly = relationship("User", foreign_keys=[elderly_id])
    game = relationship("Game", foreign_keys=[game_id])

    __table_args__ = (
        CheckConstraint("accuracy >= 0 AND accuracy <= 1", name="ck_game_sessions_accuracy"),
        CheckConstraint("response_time_ms >= 0", name="ck_game_sessions_response_time"),
        CheckConstraint("attempts >= 1", name="ck_game_sessions_attempts"),
        CheckConstraint("difficulty_level >= 1", name="ck_game_sessions_difficulty"),
        Index("ix_game_sessions_elderly_id", "elderly_id"),
        Index("ix_game_sessions_created_at", "created_at"),
        Index("ix_game_sessions_elderly_game", "elderly_id", "game_id"),
    )


# ──────────────────────────────────────────────
# REMINDERS
# ──────────────────────────────────────────────

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    elderly_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                        nullable=False)
    category = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_time = Column(String(5), nullable=False)  # "HH:MM" format
    recurrence_rule = Column(String(50), nullable=True)  # "daily", "weekdays", "weekly", etc.
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"),
                        nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    elderly = relationship("User", foreign_keys=[elderly_id])
    creator = relationship("User", foreign_keys=[created_by])
    logs = relationship("ReminderLog", back_populates="reminder")

    __table_args__ = (
        CheckConstraint(
            "category IN ('medicine', 'hydration', 'meal', 'activity', 'appointment')",
            name="ck_reminders_category"
        ),
        Index("ix_reminders_elderly_id", "elderly_id"),
    )


# ──────────────────────────────────────────────
# REMINDER LOGS (append-only)
# ──────────────────────────────────────────────

class ReminderLog(Base):
    __tablename__ = "reminder_logs"

    id = Column(UUID(as_uuid=True), primary_key=True)  # client-generated UUID
    reminder_id = Column(UUID(as_uuid=True), ForeignKey("reminders.id", ondelete="CASCADE"),
                         nullable=False)
    status = Column(String(10), nullable=False)
    responded_via = Column(String(10), nullable=False)
    device_id = Column(String(100), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    # Relationships
    reminder = relationship("Reminder", back_populates="logs")

    __table_args__ = (
        CheckConstraint(
            "status IN ('done', 'missed', 'snoozed')",
            name="ck_reminder_logs_status"
        ),
        CheckConstraint(
            "responded_via IN ('voice', 'touch', 'auto')",
            name="ck_reminder_logs_responded_via"
        ),
        Index("ix_reminder_logs_reminder_id", "reminder_id"),
    )


# ──────────────────────────────────────────────
# DIFFICULTY STATE
# ──────────────────────────────────────────────

class DifficultyState(Base):
    __tablename__ = "difficulty_state"

    elderly_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                        primary_key=True)
    game_id = Column(UUID(as_uuid=True), ForeignKey("games.id", ondelete="CASCADE"),
                     primary_key=True)
    current_level = Column(Integer, nullable=False, default=1)
    consecutive_failures = Column(Integer, nullable=False, default=0)
    last_updated = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    elderly = relationship("User", foreign_keys=[elderly_id])
    game = relationship("Game", foreign_keys=[game_id])

    __table_args__ = (
        CheckConstraint("current_level >= 1", name="ck_difficulty_state_level"),
    )


# ──────────────────────────────────────────────
# SYNC QUEUE
# ──────────────────────────────────────────────

class SyncQueueEntry(Base):
    __tablename__ = "sync_queue"

    client_event_id = Column(UUID(as_uuid=True), primary_key=True)
    device_id = Column(String(100), nullable=True)
    entity_type = Column(String(20), nullable=False)
    operation = Column(String(10), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    payload = Column(JSON_TYPE, nullable=False)
    sync_state = Column(String(10), nullable=False, default="pending")
    retry_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        CheckConstraint(
            "entity_type IN ('game_session', 'reminder_log', 'reminder')",
            name="ck_sync_queue_entity_type"
        ),
        CheckConstraint(
            "operation IN ('created', 'updated')",
            name="ck_sync_queue_operation"
        ),
        CheckConstraint(
            "sync_state IN ('pending', 'syncing', 'synced', 'failed')",
            name="ck_sync_queue_sync_state"
        ),
        Index("ix_sync_queue_sync_state", "sync_state"),
        Index("ix_sync_queue_device_id", "device_id"),
        Index("ix_sync_queue_created_at", "created_at"),
        Index("ix_sync_queue_entity", "entity_type", "entity_id"),
    )


# ──────────────────────────────────────────────
# CONSENT LOGS
# ──────────────────────────────────────────────

class ConsentLog(Base):
    __tablename__ = "consent_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False)
    consent_version = Column(String(20), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])


# ──────────────────────────────────────────────
# AUDIT LOGS
# ──────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"),
                      nullable=True)
    action = Column(String(100), nullable=False)
    target_id = Column(UUID(as_uuid=True), nullable=True)
    details = Column(JSON_TYPE, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    # Relationships
    actor = relationship("User", foreign_keys=[actor_id])


# ──────────────────────────────────────────────
# PHASE 2: FAMILY CONTACTS
# ──────────────────────────────────────────────

class FamilyContact(Base):
    __tablename__ = "family_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    elderly_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    relationship_label = Column(String(100), nullable=False)  # Daughter, Son, Spouse, Grandchild, Doctor
    phone = Column(String(20), nullable=False)
    photo_url = Column(String(1024), nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    elderly = relationship("User", foreign_keys=[elderly_id])

    __table_args__ = (
        Index("ix_family_contacts_elderly_id", "elderly_id"),
    )


# ──────────────────────────────────────────────
# PHASE 2: MEMORY ITEMS (DIGITAL MEMORY BOX)
# ──────────────────────────────────────────────

class MemoryItem(Base):
    __tablename__ = "memory_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    elderly_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)  # photo, audio, video, story, person, place, music
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    media_url = Column(String(1024), nullable=False)
    thumbnail_url = Column(String(1024), nullable=True)
    category = Column(String(100), nullable=False, default="Family")  # Family, Friends, Places, Celebrations, Memories, Music, Important People
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    elderly = relationship("User", foreign_keys=[elderly_id])
    creator = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        Index("ix_memory_items_elderly_id", "elderly_id"),
        Index("ix_memory_items_category", "category"),
    )


# ──────────────────────────────────────────────
# PHASE 2: FAMILY VOICE MESSAGES
# ──────────────────────────────────────────────

class FamilyVoiceMessage(Base):
    __tablename__ = "family_voice_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    elderly_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    caregiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    audio_url = Column(String(1024), nullable=False)
    message_type = Column(String(50), nullable=False, default="reminder")  # reminder, greeting, comfort, story
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    elderly = relationship("User", foreign_keys=[elderly_id])
    caregiver = relationship("User", foreign_keys=[caregiver_id])

    __table_args__ = (
        Index("ix_family_voice_messages_elderly_id", "elderly_id"),
    )


# ──────────────────────────────────────────────
# PHASE 2: PERSONALIZATION PREFERENCES
# ──────────────────────────────────────────────

class PersonalizationPreference(Base):
    __tablename__ = "personalization_preferences"

    elderly_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    preferred_game = Column(String(50), nullable=False, default="matching")
    preferred_session_length = Column(Integer, nullable=False, default=10)  # in minutes
    preferred_language = Column(String(20), nullable=False, default="en")
    preferred_voice = Column(String(50), nullable=False, default="default")
    assistance_level = Column(String(20), nullable=False, default="standard")  # minimal, standard, high, maximum
    animation_level = Column(String(20), nullable=False, default="calm")  # none, calm, standard
    text_size = Column(String(20), nullable=False, default="large")  # standard, large, extra_large
    difficulty_preference = Column(Integer, nullable=False, default=1)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    elderly = relationship("User", foreign_keys=[elderly_id])

