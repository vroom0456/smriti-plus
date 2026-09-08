-- Migration 003: Cognitive Games Table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('memory_recall', 'memory_matching', 'attention', 'pattern_recognition')),
    base_difficulty INTEGER NOT NULL DEFAULT 1 CHECK (base_difficulty >= 1),
    description TEXT,
    icon VARCHAR(50),
    target_time_ms INTEGER NOT NULL DEFAULT 60000,
    min_difficulty INTEGER NOT NULL DEFAULT 1 CHECK (min_difficulty >= 1),
    max_difficulty INTEGER NOT NULL DEFAULT 5 CHECK (max_difficulty >= min_difficulty),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
