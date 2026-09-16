CREATE TABLE integrations (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                              provider VARCHAR(50) NOT NULL,
                              access_token TEXT,
                              refresh_token TEXT,
                              token_expires_at TIMESTAMP WITH TIME ZONE,
                              is_connected BOOLEAN DEFAULT FALSE,
                              metadata TEXT,
                              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                              UNIQUE(user_id, provider)
);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);