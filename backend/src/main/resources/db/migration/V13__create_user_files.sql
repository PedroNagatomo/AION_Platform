CREATE TABLE user_files (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            file_name VARCHAR(255) NOT NULL,
                            file_type VARCHAR(100) NOT NULL,
                            file_size BIGINT NOT NULL,
                            storage_path VARCHAR(500),
                            folder_name VARCHAR(255),
                            is_favorite BOOLEAN DEFAULT FALSE,
                            thumbnail TEXT,
                            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_files_user_id ON user_files(user_id);
CREATE INDEX idx_user_files_folder ON user_files(user_id, folder_name);