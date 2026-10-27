-- Include the original table definitions for databases created by this
-- build as well as existing installs. Rename in place: all rows, keys,
-- seating, continuation tokens and timestamps stay in the same database.
-- This migration and its schema_migrations row commit in one transaction.
-- No aliases, compatibility views or duplicate conversation records.
CREATE TABLE IF NOT EXISTS agent_threads (
    session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL,
    resume_token TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);
CREATE TABLE IF NOT EXISTS room_threads (
    session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    seating TEXT NOT NULL,
    resume_tokens TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);
ALTER TABLE agent_threads RENAME TO agenthub_threads;
ALTER TABLE room_threads RENAME TO agenthub_room_threads;
