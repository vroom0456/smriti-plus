-- Migration 005: Reminders & Reminder Logs
CREATE TABLE IF NOT EXISTS reminders (
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

CREATE INDEX IF NOT EXISTS ix_reminders_elderly_id ON reminders(elderly_id);

CREATE TABLE IF NOT EXISTS reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    status VARCHAR(10) NOT NULL CHECK (status IN ('done', 'missed', 'snoozed')),
    responded_via VARCHAR(10) NOT NULL CHECK (responded_via IN ('voice', 'touch', 'auto')),
    device_id VARCHAR(100),
    responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_reminder_logs_reminder_id ON reminder_logs(reminder_id);
