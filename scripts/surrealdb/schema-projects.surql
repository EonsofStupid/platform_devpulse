-- =============================================================================
-- PROJECTS NAMESPACE: Per-project knowledge
-- Template: run this once per project, replacing DB name
-- Default: devpulse
-- =============================================================================

DEFINE NAMESPACE IF NOT EXISTS projects;
USE NS projects;
DEFINE DATABASE IF NOT EXISTS devpulse;
USE DB devpulse;

-- -----------------------------------------------------------------------------
-- ARCHITECTURE: Project-specific architecture rules + enforcement
-- -----------------------------------------------------------------------------

DEFINE TABLE architecture SCHEMAFULL;
DEFINE FIELD layer ON architecture TYPE string;
DEFINE FIELD rule ON architecture TYPE string;
DEFINE FIELD description ON architecture TYPE string;
DEFINE FIELD enforced_by ON architecture TYPE option<string>;
DEFINE FIELD examples ON architecture TYPE option<array<string>>;
DEFINE FIELD anti_examples ON architecture TYPE option<array<string>>;
DEFINE FIELD created_at ON architecture TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_arch_layer ON architecture FIELDS layer;

-- -----------------------------------------------------------------------------
-- PATTERNS: Project-specific patterns (coldlight, domains, signals, etc.)
-- -----------------------------------------------------------------------------

DEFINE TABLE patterns SCHEMAFULL;
DEFINE FIELD component ON patterns TYPE string;
DEFINE FIELD pattern_type ON patterns TYPE string;
DEFINE FIELD description ON patterns TYPE string;
DEFINE FIELD code_example ON patterns TYPE option<string>;
DEFINE FIELD created_at ON patterns TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_pattern_component ON patterns FIELDS component;

-- -----------------------------------------------------------------------------
-- CONTEXT: Current state — active sprint, blockers, active work
-- Loaded on every session start. High priority items first.
-- -----------------------------------------------------------------------------

DEFINE TABLE context SCHEMAFULL;
DEFINE FIELD key ON context TYPE string;
DEFINE FIELD value ON context TYPE any;
DEFINE FIELD priority ON context TYPE int DEFAULT 0;
DEFINE FIELD updated_at ON context TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_context_key ON context FIELDS key UNIQUE;

-- -----------------------------------------------------------------------------
-- DECISIONS: Project decisions + trade-offs
-- -----------------------------------------------------------------------------

DEFINE TABLE decisions SCHEMAFULL;
DEFINE FIELD sprint ON decisions TYPE option<string>;
DEFINE FIELD title ON decisions TYPE string;
DEFINE FIELD decision ON decisions TYPE string;
DEFINE FIELD reasoning ON decisions TYPE option<string>;
DEFINE FIELD trade_offs ON decisions TYPE option<string>;
DEFINE FIELD created_at ON decisions TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_decisions_sprint ON decisions FIELDS sprint;

-- -----------------------------------------------------------------------------
-- TASKS: Work items with state tracking
-- -----------------------------------------------------------------------------

DEFINE TABLE tasks SCHEMAFULL;
DEFINE FIELD content ON tasks TYPE string;
DEFINE FIELD status ON tasks TYPE string ASSERT $value IN ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'];
DEFINE FIELD sprint ON tasks TYPE option<string>;
DEFINE FIELD priority ON tasks TYPE int DEFAULT 0;
DEFINE FIELD created_at ON tasks TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON tasks TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_tasks_status ON tasks FIELDS status;
DEFINE INDEX idx_tasks_sprint ON tasks FIELDS sprint;

-- -----------------------------------------------------------------------------
-- FILE_CONVENTIONS: Naming patterns, suffixes, locations
-- -----------------------------------------------------------------------------

DEFINE TABLE file_conventions SCHEMAFULL;
DEFINE FIELD pattern ON file_conventions TYPE string;
DEFINE FIELD convention ON file_conventions TYPE string;
DEFINE FIELD suffix ON file_conventions TYPE option<string>;
DEFINE FIELD location ON file_conventions TYPE string;
DEFINE FIELD created_at ON file_conventions TYPE datetime DEFAULT time::now();

-- -----------------------------------------------------------------------------
-- COMMITS: Session progress log (conventional commit format)
-- -----------------------------------------------------------------------------

DEFINE TABLE commits SCHEMAFULL;
DEFINE FIELD type ON commits TYPE string ASSERT $value IN ['feat', 'fix', 'refactor', 'chore', 'docs', 'test', 'style', 'perf', 'breaking', 'revert'];
DEFINE FIELD scope ON commits TYPE option<string>;
DEFINE FIELD message ON commits TYPE string;
DEFINE FIELD body ON commits TYPE option<string>;
DEFINE FIELD files ON commits TYPE array DEFAULT [];
DEFINE FIELD session_id ON commits TYPE string;
DEFINE FIELD agent ON commits TYPE string DEFAULT 'claude';
DEFINE FIELD created_at ON commits TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_commits_session ON commits FIELDS session_id;
DEFINE INDEX idx_commits_type ON commits FIELDS type;
DEFINE INDEX idx_commits_time ON commits FIELDS created_at;
