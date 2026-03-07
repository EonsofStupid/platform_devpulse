-- =============================================================================
-- AGENTS NAMESPACE: Per-agent session data
-- SurrealDB 3.0 — Record References, Graph Relations, Computed Fields
-- =============================================================================

DEFINE NAMESPACE IF NOT EXISTS agents;
USE NS agents;
DEFINE DATABASE IF NOT EXISTS claude;
USE DB claude;

-- =============================================================================
-- SESSIONS
-- Typed Record Reference: chat records link back to their session
-- Graph: SELECT <-session<-chat FROM sessions WHERE id = $sid
-- =============================================================================

DEFINE TABLE sessions SCHEMAFULL;
DEFINE FIELD session_id    ON sessions TYPE string;
DEFINE FIELD project       ON sessions TYPE string;
DEFINE FIELD started_at    ON sessions TYPE datetime DEFAULT time::now();
DEFINE FIELD ended_at      ON sessions TYPE option<datetime>;
DEFINE FIELD summary       ON sessions TYPE option<string>;
DEFINE FIELD message_count ON sessions TYPE int DEFAULT 0;

-- Computed: duration in seconds — DB calculates, app reads
DEFINE FIELD duration_s ON sessions VALUE
  IF ended_at { time::unix(ended_at) - time::unix(started_at) } ELSE { NONE };

DEFINE INDEX idx_sessions_id      ON sessions FIELDS session_id UNIQUE;
DEFINE INDEX idx_sessions_project ON sessions FIELDS project;

-- =============================================================================
-- CHAT
-- session: Record Reference back to sessions — typed, traversable graph edge
-- Graph: SELECT ->session->sessions.* FROM chat WHERE id = $id
-- Graph: SELECT <-chat<-chat.* FROM sessions WHERE id = $sid (all messages in session)
-- =============================================================================

DEFINE TABLE chat SCHEMAFULL;
DEFINE FIELD role       ON chat TYPE string
  ASSERT $value IN ['user', 'assistant', 'system'];
DEFINE FIELD content    ON chat TYPE string;
DEFINE FIELD session_id ON chat TYPE string;
DEFINE FIELD session    ON chat TYPE record<sessions>;
DEFINE FIELD turn       ON chat TYPE int DEFAULT 0;
DEFINE FIELD created_at ON chat TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_chat_session ON chat FIELDS session_id;
DEFINE INDEX idx_chat_time    ON chat FIELDS created_at;

-- =============================================================================
-- FILES_TOUCHED
-- session: Record Reference — every file operation linked to its session
-- Graph: which files were touched in session X?
--   SELECT ->session->sessions.session_id, path, action FROM files_touched
--   WHERE session = sessions:$id
-- =============================================================================

DEFINE TABLE files_touched SCHEMAFULL;
DEFINE FIELD path       ON files_touched TYPE string;
DEFINE FIELD action     ON files_touched TYPE string
  ASSERT $value IN ['created', 'modified', 'deleted', 'read'];
DEFINE FIELD session_id ON files_touched TYPE string;
DEFINE FIELD session    ON files_touched TYPE record<sessions>;
DEFINE FIELD created_at ON files_touched TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_files_path    ON files_touched FIELDS path;
DEFINE INDEX idx_files_session ON files_touched FIELDS session_id;

-- =============================================================================
-- BLOCKERS
-- session: Record Reference — every blocker tied to the session it occurred in
-- Resolved blockers queryable via: SELECT * FROM blockers WHERE resolved = true
-- =============================================================================

DEFINE TABLE blockers SCHEMAFULL;
DEFINE FIELD description ON blockers TYPE string;
DEFINE FIELD category    ON blockers TYPE string;
DEFINE FIELD resolved    ON blockers TYPE bool DEFAULT false;
DEFINE FIELD resolution  ON blockers TYPE option<string>;
DEFINE FIELD session_id  ON blockers TYPE string;
DEFINE FIELD session     ON blockers TYPE record<sessions>;
DEFINE FIELD created_at  ON blockers TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_blockers_resolved ON blockers FIELDS resolved;
DEFINE INDEX idx_blockers_category ON blockers FIELDS category;

-- =============================================================================
-- DEFINE API: Agent session management baked into DB
-- GET /api/agents/claude/session/current → active session for context restore
-- POST /api/agents/claude/session/start  → create new session, return id
-- POST /api/agents/claude/session/end    → close session with summary
-- =============================================================================

DEFINE API "/session/current" FOR get
  PERMISSIONS FULL
  THEN {
    LET $session = SELECT * FROM sessions
                   WHERE ended_at = NONE
                   ORDER BY started_at DESC
                   LIMIT 1;
    IF $session {
      LET $s = $session[0];
      LET $recent = SELECT role, content, turn FROM chat
                    WHERE session = $s.id
                    ORDER BY turn DESC LIMIT 10;
      LET $files  = SELECT path, action, created_at FROM files_touched
                    WHERE session = $s.id
                    ORDER BY created_at DESC LIMIT 20;
      RETURN { session: $s, recent_chat: $recent, files_touched: $files };
    } ELSE {
      RETURN { session: NONE };
    }
  };

DEFINE API "/session/start" FOR post
  PERMISSIONS FULL
  THEN {
    LET $project = $request.body.project ?? 'unknown';
    LET $session = CREATE sessions SET
      session_id = rand::uuid(),
      project    = $project,
      started_at = time::now();
    RETURN { session_id: $session.session_id, id: $session.id };
  };

DEFINE API "/session/end" FOR post
  PERMISSIONS FULL
  THEN {
    LET $id      = $request.body.session_id;
    LET $summary = $request.body.summary;
    UPDATE sessions SET ended_at = time::now(), summary = $summary
      WHERE session_id = $id;
    RETURN { closed: $id };
  };
