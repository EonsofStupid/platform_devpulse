-- Human-created work specifications; execution and acceptance have separate owners.
CREATE TABLE agenthub_tickets (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id),
    title TEXT NOT NULL,
    goal TEXT NOT NULL,
    criteria_json TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'Intake' CHECK (stage = 'Intake'),
    revision INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX agenthub_tickets_project_created ON agenthub_tickets(project_id, created_at DESC);

CREATE TABLE agenthub_events (
    id TEXT PRIMARY KEY NOT NULL,
    ticket_id TEXT NOT NULL REFERENCES agenthub_tickets(id),
    project_id TEXT NOT NULL REFERENCES projects(id),
    kind TEXT NOT NULL,
    revision INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX agenthub_events_ticket ON agenthub_events(ticket_id, created_at);
