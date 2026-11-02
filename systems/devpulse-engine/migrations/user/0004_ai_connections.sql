-- Connection configuration only. Credentials stay in the OS vault; live
-- operation evidence is deliberately not carried across application restarts.
CREATE TABLE ai_connections (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL CHECK(length(trim(label)) > 0),
    provider_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    credential_ref TEXT,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX idx_ai_connections_provider ON ai_connections(provider_id);
