"""Initial schema — all tables from Section 6

Revision ID: 001
Revises: None
Create Date: 2026-09-08
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── USERS ──
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), unique=True, nullable=True),
        sa.Column("email", sa.String(255), unique=True, nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("role IN ('elderly', 'caregiver', 'health_worker')", name="ck_users_role"),
    )

    # ── ELDERLY PROFILES ──
    op.create_table(
        "elderly_profiles",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("caregiver_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("health_worker_group_id", UUID(as_uuid=True), nullable=True),
        sa.Column("text_size", sa.String(20), nullable=False, server_default="large"),
        sa.Column("voice_sensitivity", sa.Float, nullable=False, server_default="0.5"),
        sa.Column("caregiver_link_code_hash", sa.String(255), nullable=True),
        sa.Column("caregiver_link_code_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("photo_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("text_size IN ('standard', 'large', 'extra_large')", name="ck_elderly_profiles_text_size"),
    )
    op.create_index("ix_elderly_profiles_caregiver_id", "elderly_profiles", ["caregiver_id"])
    op.create_index("ix_elderly_profiles_health_worker_group_id", "elderly_profiles", ["health_worker_group_id"])

    # ── GAMES ──
    op.create_table(
        "games",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("base_difficulty", sa.Integer, nullable=False, server_default="1"),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("icon", sa.String(50), nullable=True),
        sa.Column("target_time_ms", sa.Integer, nullable=False, server_default="60000"),
        sa.Column("min_difficulty", sa.Integer, nullable=False, server_default="1"),
        sa.Column("max_difficulty", sa.Integer, nullable=False, server_default="5"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(
            "category IN ('memory_recall', 'memory_matching', 'attention', 'pattern_recognition')",
            name="ck_games_category",
        ),
        sa.CheckConstraint("min_difficulty >= 1", name="ck_games_min_difficulty"),
        sa.CheckConstraint("max_difficulty >= min_difficulty", name="ck_games_max_difficulty"),
    )

    # ── GAME SESSIONS ──
    op.create_table(
        "game_sessions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),  # client-generated
        sa.Column("elderly_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("game_id", UUID(as_uuid=True), sa.ForeignKey("games.id", ondelete="CASCADE"), nullable=False),
        sa.Column("accuracy", sa.Float, nullable=False),
        sa.Column("response_time_ms", sa.Integer, nullable=False),
        sa.Column("completed", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("attempts", sa.Integer, nullable=False, server_default="1"),
        sa.Column("difficulty_level", sa.Integer, nullable=False),
        sa.Column("streak_at_time", sa.Integer, nullable=False, server_default="0"),
        sa.Column("device_id", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("accuracy >= 0 AND accuracy <= 1", name="ck_game_sessions_accuracy"),
        sa.CheckConstraint("response_time_ms >= 0", name="ck_game_sessions_response_time"),
        sa.CheckConstraint("attempts >= 1", name="ck_game_sessions_attempts"),
        sa.CheckConstraint("difficulty_level >= 1", name="ck_game_sessions_difficulty"),
    )
    op.create_index("ix_game_sessions_elderly_id", "game_sessions", ["elderly_id"])
    op.create_index("ix_game_sessions_created_at", "game_sessions", ["created_at"])
    op.create_index("ix_game_sessions_elderly_game", "game_sessions", ["elderly_id", "game_id"])

    # ── REMINDERS ──
    op.create_table(
        "reminders",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("elderly_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(20), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("scheduled_time", sa.String(5), nullable=False),
        sa.Column("recurrence_rule", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(
            "category IN ('medicine', 'hydration', 'meal', 'activity', 'appointment')",
            name="ck_reminders_category",
        ),
    )
    op.create_index("ix_reminders_elderly_id", "reminders", ["elderly_id"])

    # ── REMINDER LOGS ──
    op.create_table(
        "reminder_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),  # client-generated
        sa.Column("reminder_id", UUID(as_uuid=True), sa.ForeignKey("reminders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(10), nullable=False),
        sa.Column("responded_via", sa.String(10), nullable=False),
        sa.Column("device_id", sa.String(100), nullable=True),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("status IN ('done', 'missed', 'snoozed')", name="ck_reminder_logs_status"),
        sa.CheckConstraint("responded_via IN ('voice', 'touch', 'auto')", name="ck_reminder_logs_responded_via"),
    )
    op.create_index("ix_reminder_logs_reminder_id", "reminder_logs", ["reminder_id"])

    # ── DIFFICULTY STATE ──
    op.create_table(
        "difficulty_state",
        sa.Column("elderly_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("game_id", UUID(as_uuid=True), sa.ForeignKey("games.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("current_level", sa.Integer, nullable=False, server_default="1"),
        sa.Column("consecutive_failures", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_updated", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("current_level >= 1", name="ck_difficulty_state_level"),
    )

    # ── SYNC QUEUE ──
    op.create_table(
        "sync_queue",
        sa.Column("client_event_id", UUID(as_uuid=True), primary_key=True),
        sa.Column("device_id", sa.String(100), nullable=True),
        sa.Column("entity_type", sa.String(20), nullable=False),
        sa.Column("operation", sa.String(10), nullable=False),
        sa.Column("entity_id", UUID(as_uuid=True), nullable=False),
        sa.Column("payload", JSONB, nullable=False),
        sa.Column("sync_state", sa.String(10), nullable=False, server_default="pending"),
        sa.Column("retry_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint(
            "entity_type IN ('game_session', 'reminder_log', 'reminder')",
            name="ck_sync_queue_entity_type",
        ),
        sa.CheckConstraint("operation IN ('created', 'updated')", name="ck_sync_queue_operation"),
        sa.CheckConstraint(
            "sync_state IN ('pending', 'syncing', 'synced', 'failed')",
            name="ck_sync_queue_sync_state",
        ),
    )
    op.create_index("ix_sync_queue_sync_state", "sync_queue", ["sync_state"])
    op.create_index("ix_sync_queue_device_id", "sync_queue", ["device_id"])
    op.create_index("ix_sync_queue_created_at", "sync_queue", ["created_at"])
    op.create_index("ix_sync_queue_entity", "sync_queue", ["entity_type", "entity_id"])

    # ── CONSENT LOGS ──
    op.create_table(
        "consent_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("consent_version", sa.String(20), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── AUDIT LOGS ──
    op.create_table(
        "audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("actor_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target_id", UUID(as_uuid=True), nullable=True),
        sa.Column("details", JSONB, nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("consent_logs")
    op.drop_table("sync_queue")
    op.drop_table("difficulty_state")
    op.drop_table("reminder_logs")
    op.drop_table("reminders")
    op.drop_table("game_sessions")
    op.drop_table("games")
    op.drop_table("elderly_profiles")
    op.drop_table("users")
