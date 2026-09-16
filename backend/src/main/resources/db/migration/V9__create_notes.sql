CREATE TABLE notes (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                       title VARCHAR(255) NOT NULL,
                       content TEXT,
                       parent_id UUID REFERENCES notes(id) ON DELETE CASCADE,
                       is_folder BOOLEAN DEFAULT FALSE,
                       tags VARCHAR(500),
                       icon VARCHAR(50),
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notes_user_id ON notes(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_parent_id ON notes(parent_id) WHERE deleted_at IS NULL;