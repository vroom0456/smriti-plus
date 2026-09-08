-- Migration 007: Sync Queue & Offline Supporting Tables
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_sync_queue_elderly_status ON sync_queue(elderly_id, status);

CREATE TABLE IF NOT EXISTS family_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship_label VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    photo_url VARCHAR(1024),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_family_contacts_elderly_id ON family_contacts(elderly_id);

CREATE TABLE IF NOT EXISTS memory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_url VARCHAR(1024) NOT NULL,
    thumbnail_url VARCHAR(1024),
    category VARCHAR(100) NOT NULL DEFAULT 'Family',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_memory_items_elderly_id ON memory_items(elderly_id);

CREATE TABLE IF NOT EXISTS family_voice_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    audio_url VARCHAR(1024) NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'reminder',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_family_voice_messages_elderly_id ON family_voice_messages(elderly_id);

CREATE TABLE IF NOT EXISTS personalization_preferences (
    elderly_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_game VARCHAR(50) NOT NULL DEFAULT 'memory_matching',
    preferred_session_length INTEGER NOT NULL DEFAULT 10,
    preferred_language VARCHAR(20) NOT NULL DEFAULT 'en',
    preferred_voice VARCHAR(50) NOT NULL DEFAULT 'default',
    assistance_level VARCHAR(20) NOT NULL DEFAULT 'standard',
    animation_level VARCHAR(20) NOT NULL DEFAULT 'calm',
    text_size VARCHAR(20) NOT NULL DEFAULT 'large',
    difficulty_preference INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
