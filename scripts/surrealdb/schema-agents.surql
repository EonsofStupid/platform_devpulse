-- =============================================================================
-- AGENTS NAMESPACE: Per-agent session data
-- Template: run this once per AI agent, replacing DB name
-- Default: claude
-- =============================================================================

DEFINE NAMESPACE IF NOT EXISTS agents;
USE NS agents;
DEFINE DATABASE IF NOT EXISTS claude;
USE DB claude;

-- -----------------------------------------------------------------------------
-- SESSIONS: Session metadata
-- -----------------------------------------------------------------------------

DEFINE TABLE sessions SCHEMAFULL;
DEFINE FIELD session_id ON sessions TYPE string;
DEFINE FIELD project ON sessions TYPE string;
DEFINE FIELD started_at ON sessions TYPE datetime DEFAULT time::now();
DEFINE FIELD ended_at ON sessions TYPE option<datetime>;
DEFINE FIELD summary ON sessions TYPE option<string>;
DEFINE FIELD message_count ON sessions TYPE int DEFAULT 0;
DEFINE INDEX idx_sessions_id ON sessions FIELDS session_id UNIQUE;
DEFINE INDEX idx_sessions_project ON sessions FIELDS project;

-- -----------------------------------------------------------------------------
-- CHAT: Conversation log
-- -----------------------------------------------------------------------------

DEFINE TABLE chat SCHEMAFULL;
DEFINE FIELD role ON chat TYPE string ASSERT $value IN ['user', 'assistant', 'system'];
DEFINE FIELD content ON chat TYPE string;
DEFINE FIELD session_id ON chat TYPE string;
DEFINE FIELD turn ON chat TYPE int DEFAULT 0;
DEFINE FIELD created_at ON chat TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_chat_session ON chat FIELDS session_id;
DEFINE INDEX idx_chat_time ON chat FIELDS created_at;

-- -----------------------------------------------------------------------------
-- FILES_TOUCHED: File operations per session
-- -----------------------------------------------------------------------------

DEFINE TABLE files_touched SCHEMAFULL;
DEFINE FIELD path ON files_touched TYPE string;
DEFINE FIELD action ON files_touched TYPE string ASSERT $value IN ['created', 'modified', 'deleted', 'read'];
DEFINE FIELD session_id ON files_touched TYPE string;
DEFINE FIELD created_at ON files_touched TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_files_path ON files_touched FIELDS path;
DEFINE INDEX idx_files_session ON files_touched FIELDS session_id;

-- -----------------------------------------------------------------------------
-- BLOCKERS: Things that blocked progress
-- -----------------------------------------------------------------------------

DEFINE TABLE blockers SCHEMAFULL;
DEFINE FIELD description ON blockers TYPE string;
DEFINE FIELD category ON blockers TYPE string;
DEFINE FIELD resolved ON blockers TYPE bool DEFAULT false;
DEFINE FIELD resolution ON blockers TYPE option<string>;
DEFINE FIELD created_at ON blockers TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_blockers_resolved ON blockers FIELDS resolved;
