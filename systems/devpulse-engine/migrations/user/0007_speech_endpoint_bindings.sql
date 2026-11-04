-- Which saved connection and model listening (stt) and speaking (tts) use.
-- connection_revision is the generation chosen: an edited server is refused
-- until it is chosen again, exactly as a chat's history is.
-- No cascading connection foreign key: removing a server keeps the binding
-- visible, so speech fails plainly instead of quietly going somewhere else.
CREATE TABLE speech_endpoint_bindings (
    role TEXT PRIMARY KEY CHECK(role IN ('stt', 'tts')),
    connection_id TEXT NOT NULL,
    connection_revision INTEGER NOT NULL CHECK(connection_revision > 0),
    connection_label TEXT NOT NULL,
    model TEXT NOT NULL CHECK(length(trim(model)) > 0),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
