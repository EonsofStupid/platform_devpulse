-- What you chose for one conversation. A conversation with no row has the
-- defaults, so notes go unless you said otherwise (plan 0001 B4.5).
CREATE TABLE chat_session_settings (
    session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
    notes INTEGER NOT NULL DEFAULT 1 CHECK(notes IN (0, 1))
);
