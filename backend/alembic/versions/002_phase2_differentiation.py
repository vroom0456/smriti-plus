"""Phase 2 Differentiation — family_contacts, memory_items, family_voice_messages, personalization_preferences

Revision ID: 002
Revises: 001
Create Date: 2026-09-08
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── FAMILY CONTACTS ──
    op.create_table(
        "family_contacts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("elderly_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("relationship_label", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("photo_url", sa.String(1024), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_family_contacts_elderly_id", "family_contacts", ["elderly_id"])

    # ── MEMORY ITEMS ──
    op.create_table(
        "memory_items",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("elderly_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("media_url", sa.String(1024), nullable=False),
        sa.Column("thumbnail_url", sa.String(1024), nullable=True),
        sa.Column("category", sa.String(100), nullable=False, server_default="Family"),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_memory_items_elderly_id", "memory_items", ["elderly_id"])
    op.create_index("ix_memory_items_category", "memory_items", ["category"])

    # ── FAMILY VOICE MESSAGES ──
    op.create_table(
        "family_voice_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("elderly_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("caregiver_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("audio_url", sa.String(1024), nullable=False),
        sa.Column("message_type", sa.String(50), nullable=False, server_default="reminder"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_family_voice_messages_elderly_id", "family_voice_messages", ["elderly_id"])

    # ── PERSONALIZATION PREFERENCES ──
    op.create_table(
        "personalization_preferences",
        sa.Column("elderly_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("preferred_game", sa.String(50), nullable=False, server_default="matching"),
        sa.Column("preferred_session_length", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("preferred_language", sa.String(20), nullable=False, server_default="en"),
        sa.Column("preferred_voice", sa.String(50), nullable=False, server_default="default"),
        sa.Column("assistance_level", sa.String(20), nullable=False, server_default="standard"),
        sa.Column("animation_level", sa.String(20), nullable=False, server_default="calm"),
        sa.Column("text_size", sa.String(20), nullable=False, server_default="large"),
        sa.Column("difficulty_preference", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("personalization_preferences")
    op.drop_table("family_voice_messages")
    op.drop_table("memory_items")
    op.drop_table("family_contacts")
