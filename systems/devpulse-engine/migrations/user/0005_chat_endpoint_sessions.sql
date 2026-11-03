-- Each edit changes the connection generation. Existing conversations cannot
-- silently send their history to a different endpoint or credential identity.
ALTER TABLE ai_connections ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0);

CREATE TABLE chat_endpoint_sessions (
    session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
    connection_id TEXT NOT NULL,
    connection_revision INTEGER NOT NULL CHECK(connection_revision > 0),
    connection_label TEXT NOT NULL,
    model TEXT NOT NULL CHECK(length(trim(model)) > 0)
);
-- No cascading connection foreign key: removing a server retains its transcripts.
CREATE INDEX idx_chat_endpoint_sessions_connection ON chat_endpoint_sessions(connection_id);
