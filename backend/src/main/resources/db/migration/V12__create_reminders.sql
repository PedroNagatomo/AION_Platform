CREATE TABLE reminders (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                           title VARCHAR(255) NOT NULL,
                           description TEXT,
                           reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
                           is_completed BOOLEAN DEFAULT FALSE,
                           repeat_type VARCHAR(20) DEFAULT 'NONE',
                           notify_before_minutes INTEGER DEFAULT 0,
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_user_time ON reminders(user_id, reminder_time);
CREATE INDEX idx_reminders_user_completed ON reminders(user_id, is_completed);