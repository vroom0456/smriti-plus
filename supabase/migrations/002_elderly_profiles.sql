-- Migration 002: Elderly Profiles (with Flo-Style Pairing Code Support)
CREATE TABLE IF NOT EXISTS elderly_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    health_worker_group_id UUID,
    text_size VARCHAR(20) NOT NULL DEFAULT 'large' CHECK (text_size IN ('standard', 'large', 'extra_large')),
    voice_sensitivity FLOAT NOT NULL DEFAULT 0.5,
    caregiver_link_code_hash VARCHAR(255),
    caregiver_link_code_expires_at TIMESTAMPTZ,
    photo_url VARCHAR(500),
    care_stage INTEGER NOT NULL DEFAULT 1,
    current_assistance_level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_elderly_profiles_caregiver_id ON elderly_profiles(caregiver_id);
CREATE INDEX IF NOT EXISTS ix_elderly_profiles_health_worker_group_id ON elderly_profiles(health_worker_group_id);
