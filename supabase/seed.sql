-- ==============================================================================
-- SMRITI+ Seed Data (Demo Profiles, Activities, Games, Reminders)
-- ==============================================================================

-- 1. Users
INSERT INTO users (id, role, name, phone, email, password_hash, language) VALUES
('11111111-1111-1111-1111-111111111111', 'elderly', 'Amit Borah', '9876543210', 'elder.demo@smriti.local', '$2b$12$K8hP9QxYzVw8R4f0.p7x7eR5o7Vw9.8x3.1a2b3c4d5e6f7g8h9i', 'en'),
('22222222-2222-2222-2222-222222222222', 'elderly', 'Kamala Devi', '9876543211', 'kamala.devi@smriti.local', '$2b$12$K8hP9QxYzVw8R4f0.p7x7eR5o7Vw9.8x3.1a2b3c4d5e6f7g8h9i', 'as'),
('33333333-3333-3333-3333-333333333333', 'elderly', 'Bhaben Barua', '9876543212', 'bhaben.barua@smriti.local', '$2b$12$K8hP9QxYzVw8R4f0.p7x7eR5o7Vw9.8x3.1a2b3c4d5e6f7g8h9i', 'en'),
('44444444-4444-4444-4444-444444444444', 'caregiver', 'Priya Borah', '9876543213', 'caregiver.demo@smriti.local', '$2b$12$K8hP9QxYzVw8R4f0.p7x7eR5o7Vw9.8x3.1a2b3c4d5e6f7g8h9i', 'en'),
('66666666-6666-6666-6666-666666666666', 'health_worker', 'Dr. Anjali Saikia', '9876543215', 'worker.demo@smriti.local', '$2b$12$K8hP9QxYzVw8R4f0.p7x7eR5o7Vw9.8x3.1a2b3c4d5e6f7g8h9i', 'en')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    language = EXCLUDED.language;

-- 2. Elderly Profiles with Pairing Code hash for 'SMR-842'
INSERT INTO elderly_profiles (user_id, caregiver_id, text_size, voice_sensitivity, caregiver_link_code_hash, caregiver_link_code_expires_at) VALUES
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'large', 0.5, 'e5cefbbe6587c67c52ee8233075c02ef40bcf00e1cfc5357fe1a5518b43f9a72', NOW() + INTERVAL '30 days'),
('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'large', 0.6, 'e5cefbbe6587c67c52ee8233075c02ef40bcf00e1cfc5357fe1a5518b43f9a72', NOW() + INTERVAL '30 days')
ON CONFLICT (user_id) DO UPDATE SET
    caregiver_id = EXCLUDED.caregiver_id,
    caregiver_link_code_hash = EXCLUDED.caregiver_link_code_hash;

-- 3. Cognitive Games
INSERT INTO games (id, name, category, base_difficulty, description, icon) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Name That Object', 'memory_recall', 1, 'Identify common daily objects to practice vocabulary and visual recognition.', 'camera'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Card Flip Matching', 'memory_matching', 1, 'Flip cards to find matching pairs of culturally familiar items.', 'grid'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Spot the Difference', 'attention', 1, 'Find subtle differences between two images.', 'eye'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Sound Sequence', 'pattern_recognition', 1, 'Listen to a sequence of tones and repeat the pattern.', 'music')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 4. Reminders
INSERT INTO reminders (id, elderly_id, category, title, description, scheduled_time, is_active) VALUES
('ebac4389-dbe0-48a1-b23e-7775e5d957b8', '11111111-1111-1111-1111-111111111111', 'medicine', 'Morning Blood Pressure Medication', 'Take Amlodipine 5mg with a full glass of water.', '09:00', true),
('cbdeb8ea-c390-48af-9d48-574f0080e906', '11111111-1111-1111-1111-111111111111', 'hydration', 'Mid-Morning Water Reminder', 'Drink 1 glass of fresh water to stay hydrated.', '11:30', true),
('d03d53fd-81f4-44aa-a805-a98ef01f54be', '11111111-1111-1111-1111-111111111111', 'activity', 'Afternoon Garden Walk', 'Gentle 15-minute walk in the garden.', '16:00', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Family Contacts
INSERT INTO family_contacts (id, elderly_id, name, relationship_label, phone, is_primary) VALUES
('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Priya Borah', 'Daughter & Caregiver', '+91 98640 12345', true),
('f2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Debojit Borah', 'Grandson', '+91 94350 67890', false),
('f3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Dr. Sarma', 'Family Doctor', '+91 98640 99999', false)
ON CONFLICT (id) DO NOTHING;
