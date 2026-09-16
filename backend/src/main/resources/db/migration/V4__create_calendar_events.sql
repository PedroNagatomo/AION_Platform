CREATE TABLE calendar_events (
                                 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                 user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 title VARCHAR(255) NOT NULL,
                                 date DATE NOT NULL,
                                 time TIME,
                                 description TEXT,
                                 created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_events_user_date ON calendar_events(user_id, date);