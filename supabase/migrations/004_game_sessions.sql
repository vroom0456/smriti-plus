-- Migration 004: Game Sessions
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    accuracy FLOAT NOT NULL CHECK (accuracy >= 0 AND accuracy <= 1),
    response_time_ms INTEGER NOT NULL CHECK (response_time_ms >= 0),
    completed BOOLEAN NOT NULL DEFAULT TRUE,
    attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts >= 1),
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1),
    streak_at_time INTEGER NOT NULL DEFAULT 0,
    device_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_game_sessions_elderly_id ON game_sessions(elderly_id);
CREATE INDEX IF NOT EXISTS ix_game_sessions_created_at ON game_sessions(created_at);
CREATE INDEX IF NOT EXISTS ix_game_sessions_elderly_game ON game_sessions(elderly_id, game_id);
