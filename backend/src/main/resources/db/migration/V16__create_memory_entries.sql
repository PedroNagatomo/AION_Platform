CREATE TABLE memory_entries (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                category VARCHAR(50) NOT NULL,
                                topic VARCHAR(255) NOT NULL,
                                content TEXT NOT NULL,
                                keywords VARCHAR(500),
                                source_type VARCHAR(50),
                                source_id UUID,
                                importance INTEGER DEFAULT 1,
                                last_accessed_at TIMESTAMP WITH TIME ZONE,
                                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_memory_user_topic ON memory_entries(user_id, topic);
CREATE INDEX idx_memory_user_created ON memory_entries(user_id, created_at);