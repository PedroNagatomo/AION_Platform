CREATE TABLE workflows (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                           name VARCHAR(255) NOT NULL,
                           description VARCHAR(500),
                           icon VARCHAR(50),
                           is_active BOOLEAN DEFAULT TRUE,
                           trigger_type VARCHAR(50) NOT NULL,
                           trigger_config TEXT,
                           conditions TEXT,
                           actions TEXT NOT NULL,
                           execution_count BIGINT DEFAULT 0,
                           last_executed_at TIMESTAMP WITH TIME ZONE,
                           last_execution_status VARCHAR(20),
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_executions (
                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                     workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
                                     status VARCHAR(20) NOT NULL,
                                     trigger_data TEXT,
                                     execution_log TEXT,
                                     error_message TEXT,
                                     duration_ms BIGINT,
                                     executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_active ON workflows(user_id, is_active);
CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_date ON workflow_executions(executed_at DESC);