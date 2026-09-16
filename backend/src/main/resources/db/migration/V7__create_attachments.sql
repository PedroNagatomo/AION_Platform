CREATE TABLE attachments (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
                             file_name VARCHAR(255) NOT NULL,
                             file_type VARCHAR(100) NOT NULL,
                             file_size BIGINT NOT NULL,
                             content TEXT,
                             storage_path VARCHAR(500),
                             created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_message_id ON attachments(message_id);