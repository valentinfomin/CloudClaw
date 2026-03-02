CREATE TABLE IF NOT EXISTS pending_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    payload TEXT,
    start_offset_ms INTEGER,
    interval_ms INTEGER,
    total_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_tasks_user_id ON pending_tasks(user_id);
