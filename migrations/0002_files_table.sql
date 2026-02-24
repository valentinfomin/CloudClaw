-- Migration 0002: Files Table

CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    r2_key TEXT NOT NULL UNIQUE,
    filename TEXT,
    content_type TEXT,
    size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(chat_id)
);

-- Index for faster lookup by user
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
