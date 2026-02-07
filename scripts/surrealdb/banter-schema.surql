-- =============================================================================
-- BANTER: Claude Conversation Persistence Schema
-- Namespace: banter | Database: sessions
--
-- PURPOSE: Persistent memory across Claude Code sessions
-- USAGE: After every /compact, Claude MUST read from this to restore context
-- =============================================================================

DEFINE NAMESPACE IF NOT EXISTS banter;
USE NS banter;
DEFINE DATABASE IF NOT EXISTS sessions;
USE DB sessions;

-- =============================================================================
-- COMMITS: Git-style conventional commits for session progress
-- =============================================================================

DEFINE TABLE commits SCHEMAFULL;
DEFINE FIELD type ON commits TYPE string ASSERT $value IN ['feat', 'fix', 'refactor', 'chore', 'docs', 'test', 'style', 'perf', 'breaking', 'revert'];
DEFINE FIELD scope ON commits TYPE option<string>;
DEFINE FIELD message ON commits TYPE string;
DEFINE FIELD body ON commits TYPE option<string>;
DEFINE FIELD breaking ON commits TYPE bool DEFAULT false;
DEFINE FIELD files ON commits TYPE array DEFAULT [];
DEFINE FIELD session_id ON commits TYPE string;
DEFINE FIELD timestamp ON commits TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_commits_session ON commits FIELDS session_id;
DEFINE INDEX idx_commits_type ON commits FIELDS type;
DEFINE INDEX idx_commits_time ON commits FIELDS timestamp;

-- =============================================================================
-- CONTEXT: Active state that MUST be loaded on session start
-- =============================================================================

DEFINE TABLE context SCHEMAFULL;
DEFINE FIELD key ON context TYPE string;
DEFINE FIELD value ON context TYPE any;
DEFINE FIELD priority ON context TYPE int DEFAULT 0;
DEFINE FIELD updated_at ON context TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_context_key ON context FIELDS key UNIQUE;

-- =============================================================================
-- DECISIONS: Key decisions made during conversations
-- =============================================================================

DEFINE TABLE decisions SCHEMAFULL;
DEFINE FIELD topic ON decisions TYPE string;
DEFINE FIELD decision ON decisions TYPE string;
DEFINE FIELD rationale ON decisions TYPE option<string>;
DEFINE FIELD reversible ON decisions TYPE bool DEFAULT true;
DEFINE FIELD timestamp ON decisions TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_decisions_topic ON decisions FIELDS topic;

-- =============================================================================
-- LEARNINGS: Mistakes made + correct approach (CRITICAL for Claude)
-- =============================================================================

DEFINE TABLE learnings SCHEMAFULL;
DEFINE FIELD category ON learnings TYPE string;
DEFINE FIELD trigger ON learnings TYPE string;
DEFINE FIELD wrong_action ON learnings TYPE string;
DEFINE FIELD correct_action ON learnings TYPE string;
DEFINE FIELD severity ON learnings TYPE string ASSERT $value IN ['critical', 'major', 'minor'];
DEFINE FIELD timestamp ON learnings TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_learnings_category ON learnings FIELDS category;
DEFINE INDEX idx_learnings_severity ON learnings FIELDS severity;

-- =============================================================================
-- BLOCKERS: Things that blocked progress
-- =============================================================================

DEFINE TABLE blockers SCHEMAFULL;
DEFINE FIELD description ON blockers TYPE string;
DEFINE FIELD category ON blockers TYPE string;
DEFINE FIELD resolved ON blockers TYPE bool DEFAULT false;
DEFINE FIELD resolution ON blockers TYPE option<string>;
DEFINE FIELD timestamp ON blockers TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_blockers_resolved ON blockers FIELDS resolved;

-- =============================================================================
-- TASKS: Todo items with state tracking
-- =============================================================================

DEFINE TABLE tasks SCHEMAFULL;
DEFINE FIELD content ON tasks TYPE string;
DEFINE FIELD status ON tasks TYPE string ASSERT $value IN ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'];
DEFINE FIELD sprint ON tasks TYPE option<string>;
DEFINE FIELD priority ON tasks TYPE int DEFAULT 0;
DEFINE FIELD created_at ON tasks TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON tasks TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_tasks_status ON tasks FIELDS status;
DEFINE INDEX idx_tasks_sprint ON tasks FIELDS sprint;

-- =============================================================================
-- FILES_TOUCHED: Files modified in sessions
-- =============================================================================

DEFINE TABLE files_touched SCHEMAFULL;
DEFINE FIELD path ON files_touched TYPE string;
DEFINE FIELD action ON files_touched TYPE string ASSERT $value IN ['created', 'modified', 'deleted', 'read'];
DEFINE FIELD session_id ON files_touched TYPE string;
DEFINE FIELD timestamp ON files_touched TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_files_path ON files_touched FIELDS path;
DEFINE INDEX idx_files_session ON files_touched FIELDS session_id;

-- =============================================================================
-- ARCHITECTURE: Project architecture rules (imported from project context)
-- =============================================================================

DEFINE TABLE architecture SCHEMAFULL;
DEFINE FIELD layer ON architecture TYPE string;
DEFINE FIELD rule ON architecture TYPE string;
DEFINE FIELD description ON architecture TYPE string;
DEFINE FIELD examples ON architecture TYPE option<array>;
DEFINE FIELD anti_examples ON architecture TYPE option<array>;
DEFINE INDEX idx_arch_layer ON architecture FIELDS layer;

-- =============================================================================
-- PREFERENCES: User preferences for Claude behavior
-- =============================================================================

DEFINE TABLE preferences SCHEMAFULL;
DEFINE FIELD category ON preferences TYPE string;
DEFINE FIELD key ON preferences TYPE string;
DEFINE FIELD value ON preferences TYPE string;
DEFINE FIELD notes ON preferences TYPE option<string>;
DEFINE INDEX idx_prefs_category ON preferences FIELDS category;
DEFINE INDEX idx_prefs_key ON preferences FIELDS key UNIQUE;

-- =============================================================================
-- CHAT: Conversation log (messages between user and Claude)
-- =============================================================================

DEFINE TABLE chat SCHEMAFULL;
DEFINE FIELD role ON chat TYPE string ASSERT $value IN ['user', 'assistant', 'system'];
DEFINE FIELD content ON chat TYPE string;
DEFINE FIELD session_id ON chat TYPE string;
DEFINE FIELD turn ON chat TYPE int DEFAULT 0;
DEFINE FIELD timestamp ON chat TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_chat_session ON chat FIELDS session_id;
DEFINE INDEX idx_chat_time ON chat FIELDS timestamp;

-- =============================================================================
-- SESSIONS: Session metadata
-- =============================================================================

DEFINE TABLE sessions SCHEMAFULL;
DEFINE FIELD session_id ON sessions TYPE string;
DEFINE FIELD project ON sessions TYPE string;
DEFINE FIELD started_at ON sessions TYPE datetime DEFAULT time::now();
DEFINE FIELD ended_at ON sessions TYPE option<datetime>;
DEFINE FIELD summary ON sessions TYPE option<string>;
DEFINE FIELD message_count ON sessions TYPE int DEFAULT 0;
DEFINE INDEX idx_sessions_id ON sessions FIELDS session_id UNIQUE;
