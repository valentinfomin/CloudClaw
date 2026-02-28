CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    payload TEXT, -- JSON string
    scheduled_at DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'processing'
    cron_rule TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_status_scheduled_at ON tasks(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
