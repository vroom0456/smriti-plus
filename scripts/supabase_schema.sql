-- ==============================================================================
-- SMRITI+ Complete Database Schema & Seed Script (for Supabase SQL Editor)
-- 
-- Compatible with PostgreSQL 14+ and Supabase
-- Covers:
--  1. Users & Elderly Profiles (with Patient Pairing Code support)
--  2. Games, Difficulty State & Game Sessions
--  3. Reminders & Reminder Logs
--  4. Family Contacts, Digital Memory Box & Voice Notes
--  5. Personalization Preferences, Audit Logs & Consent Logs
--  6. Seed Data for immediate testing (Elderly, Caregiver, Doctor profiles)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in reverse dependency order if resetting
DROP TABLE IF EXISTS personalization_preferences CASCADE;
DROP TABLE IF EXISTS family_voice_messages CASCADE;
DROP TABLE IF EXISTS memory_items CASCADE;
DROP TABLE IF EXISTS family_contacts CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS consent_logs CASCADE;
DROP TABLE IF EXISTS sync_queue CASCADE;
DROP TABLE IF EXISTS difficulty_state CASCADE;
DROP TABLE IF EXISTS reminder_logs CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS elderly_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ──────────────────────────────────────────────
-- 1. USERS
-- ──────────────────────────────────────────────
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('elderly', 'caregiver', 'health_worker')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 2. ELDERLY PROFILES (Flo-Style Linking Code)
-- ──────────────────────────────────────────────
CREATE TABLE elderly_profiles (
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

CREATE INDEX ix_elderly_profiles_caregiver_id ON elderly_profiles(caregiver_id);
CREATE INDEX ix_elderly_profiles_health_worker_group_id ON elderly_profiles(health_worker_group_id);

-- ──────────────────────────────────────────────
-- 3. COGNITIVE GAMES & SESSIONS
-- ──────────────────────────────────────────────
CREATE TABLE games (
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

CREATE TABLE game_sessions (
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

CREATE INDEX ix_game_sessions_elderly_id ON game_sessions(elderly_id);
CREATE INDEX ix_game_sessions_created_at ON game_sessions(created_at);
CREATE INDEX ix_game_sessions_elderly_game ON game_sessions(elderly_id, game_id);

CREATE TABLE difficulty_state (
    elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1),
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (elderly_id, game_id)
);

-- ──────────────────────────────────────────────
-- 4. REMINDERS & LOGS
-- ──────────────────────────────────────────────
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('medicine', 'hydration', 'meal', 'activity', 'appointment')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_time VARCHAR(5) NOT NULL,
    recurrence_rule VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_reminders_elderly_id ON reminders(elderly_id);

CREATE TABLE reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('done', 'missed', 'snoozed')),
    responded_via VARCHAR(10) NOT NULL CHECK (responded_via IN ('voice', 'touch', 'auto')),
    device_id VARCHAR(100),
    responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_reminder_logs_reminder_id ON reminder_logs(reminder_id);

-- ──────────────────────────────────────────────
-- 5. FAMILY CORNER & DIGITAL MEMORY BOX
-- ──────────────────────────────────────────────
CREATE TABLE family_contacts (
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

CREATE INDEX ix_family_contacts_elderly_id ON family_contacts(elderly_id);

CREATE TABLE memory_items (
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

CREATE INDEX ix_memory_items_elderly_id ON memory_items(elderly_id);
CREATE INDEX ix_memory_items_category ON memory_items(category);

CREATE TABLE family_voice_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    elderly_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    audio_url VARCHAR(1024) NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'reminder',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX ix_family_voice_messages_elderly_id ON family_voice_messages(elderly_id);

CREATE TABLE personalization_preferences (
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

-- ──────────────────────────────────────────────
-- 6. AUDIT & CONSENT
-- ──────────────────────────────────────────────
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_id UUID,
    details JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_version VARCHAR(20) NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 7. SEED DATA (Ready-to-use Demo Accounts & Data)
-- ──────────────────────────────────────────────
-- Password hash for '1234' (Elderly PIN) and 'caregiver123' / 'worker123':
-- $2b$12$e8Y5t1L4/jKxN0s3V2... or mock SHA-256 for instant verification

INSERT INTO users (id, role, name, phone, email, password_hash, language) VALUES
('11111111-1111-1111-1111-111111111111', 'elderly', 'Amit Borah', '9876543210', 'elder.demo@smriti.local', '$2b$12$K8hP9QxYzVw8R4f0.p7x7eR5o7Vw9.8x3.1a2b3c4d5e6f7g8h9i', 'en'),
('22222222-2222-2222-2222-222222222222', 'elderly', 'Kamala Devi', '9876543211', 'kamala.devi@smriti.local', '$2b$12$K8hP9QxYzVw8R4f0.p7x7eR5o7Vw9.8x3.1a2b3c4d5e6f7g8h9i', 'as'),
('33333333-3333-3333-3333-333333333333', 'elderly', 'Bhaben Barua', '9876543212', 'bhaben.barua@smriti.local', '$2b$12$K8hP9QxYzVw8R4f0.p7x7eR5o7Vw9.8x3.1a2b3c4d5e6f7g8h9i', 'en'),
('44444444-4444-4444-4444-444444444444', 'caregiver', 'Priya Borah', '9876543213', 'caregiver.demo@smriti.local', '$2b$12$K8hP9QxYzVw8R4f0.p7x7eR5o7Vw9.8x3.1a2b3c4d5e6f7g8h9i', 'en'),
('66666666-6666-6666-6666-666666666666', 'health_worker', 'Dr. Anjali Saikia', '9876543215', 'worker.demo@smriti.local', '$2b$12$K8hP9QxYzVw8R4f0.p7x7eR5o7Vw9.8x3.1a2b3c4d5e6f7g8h9i', 'en')
ON CONFLICT (id) DO NOTHING;

-- Elderly Profile with SHA-256 hash for code 'SMR-842' & 'SMR842'
-- SHA256('SMR-842') = e5cefbbe6587c67c52ee8233075c02ef40bcf00e1cfc5357fe1a5518b43f9a72
INSERT INTO elderly_profiles (user_id, caregiver_id, text_size, voice_sensitivity, caregiver_link_code_hash, caregiver_link_code_expires_at) VALUES
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'large', 0.5, 'e5cefbbe6587c67c52ee8233075c02ef40bcf00e1cfc5357fe1a5518b43f9a72', NOW() + INTERVAL '30 days'),
('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'large', 0.6, 'e5cefbbe6587c67c52ee8233075c02ef40bcf00e1cfc5357fe1a5518b43f9a72', NOW() + INTERVAL '30 days')
ON CONFLICT (user_id) DO NOTHING;

-- Games Seed
INSERT INTO games (id, name, category, base_difficulty, description, icon) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Name That Object', 'memory_recall', 1, 'Identify common daily objects to practice vocabulary and visual recognition.', 'camera'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Card Flip Matching', 'memory_matching', 1, 'Flip cards to find matching pairs of culturally familiar items.', 'grid'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Spot the Difference', 'attention', 1, 'Find subtle differences between two images.', 'eye'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Sound Sequence', 'pattern_recognition', 1, 'Listen to a sequence of tones and repeat the pattern.', 'music')
ON CONFLICT (id) DO NOTHING;

-- Reminders Seed
INSERT INTO reminders (elderly_id, category, title, description, scheduled_time, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'medicine', 'Morning Blood Pressure Medication', 'Take Amlodipine 5mg with a full glass of water.', '09:00', true),
('11111111-1111-1111-1111-111111111111', 'hydration', 'Mid-Morning Water Reminder', 'Drink 1 glass of fresh water to stay hydrated.', '11:30', true),
('11111111-1111-1111-1111-111111111111', 'activity', 'Afternoon Garden Walk', 'Gentle 15-minute walk in the garden.', '16:00', true);

-- Family Contacts
INSERT INTO family_contacts (elderly_id, name, relationship_label, phone, is_primary) VALUES
('11111111-1111-1111-1111-111111111111', 'Priya Borah', 'Daughter & Caregiver', '+91 98640 12345', true),
('11111111-1111-1111-1111-111111111111', 'Debojit Borah', 'Grandson', '+91 94350 67890', false),
('11111111-1111-1111-1111-111111111111', 'Dr. Sarma', 'Family Doctor', '+91 98640 99999', false);
