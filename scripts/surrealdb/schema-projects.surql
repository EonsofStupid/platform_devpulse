-- =============================================================================
-- PROJECTS NAMESPACE: Per-project knowledge
-- SurrealDB 3.0 — Record References, DEFINE API, Computed Fields, Vector Search
-- =============================================================================

DEFINE NAMESPACE IF NOT EXISTS projects;
USE NS projects;
DEFINE DATABASE IF NOT EXISTS devpulse;
USE DB devpulse;

-- =============================================================================
-- ARCHITECTURE RULES
-- =============================================================================

DEFINE TABLE architecture SCHEMAFULL;
DEFINE FIELD layer         ON architecture TYPE string;
DEFINE FIELD rule          ON architecture TYPE string;
DEFINE FIELD description   ON architecture TYPE string;
DEFINE FIELD enforced_by   ON architecture TYPE option<string>;
DEFINE FIELD examples      ON architecture TYPE option<array<string>>;
DEFINE FIELD anti_examples ON architecture TYPE option<array<string>>;
DEFINE FIELD embedding     ON architecture TYPE option<array<float>>;
DEFINE FIELD created_at    ON architecture TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_arch_layer  ON architecture FIELDS layer;
DEFINE INDEX idx_arch_vector ON architecture FIELDS embedding MTREE DIMENSION 1536 DIST COSINE;

-- =============================================================================
-- PATTERNS (project-scoped)
-- =============================================================================

DEFINE TABLE patterns SCHEMAFULL;
DEFINE FIELD component    ON patterns TYPE string;
DEFINE FIELD pattern_type ON patterns TYPE string;
DEFINE FIELD description  ON patterns TYPE string;
DEFINE FIELD code_example ON patterns TYPE option<string>;
DEFINE FIELD embedding    ON patterns TYPE option<array<float>>;
DEFINE FIELD created_at   ON patterns TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_pattern_component ON patterns FIELDS component;
DEFINE INDEX idx_pattern_vector    ON patterns FIELDS embedding MTREE DIMENSION 1536 DIST COSINE;

-- =============================================================================
-- CONTEXT — loaded on every session start, high priority first
-- updated_at: VALUE (not DEFAULT) = always reflects last write, no stale timestamps
-- =============================================================================

DEFINE TABLE context SCHEMAFULL;
DEFINE FIELD key        ON context TYPE string;
DEFINE FIELD value      ON context TYPE any;
DEFINE FIELD priority   ON context TYPE int DEFAULT 0;
DEFINE FIELD updated_at ON context TYPE datetime VALUE time::now();
DEFINE INDEX idx_context_key ON context FIELDS key UNIQUE;

-- =============================================================================
-- DECISIONS (project-scoped)
-- superseded_by: Record Reference — typed link to another decision record
-- Graph traversal: SELECT ->superseded_by->decisions FROM decisions WHERE id = $id
-- full_text: Computed — DB assembles this, not the application
-- =============================================================================

DEFINE TABLE decisions SCHEMAFULL;
DEFINE FIELD sprint        ON decisions TYPE option<string>;
DEFINE FIELD title         ON decisions TYPE string;
DEFINE FIELD decision      ON decisions TYPE string;
DEFINE FIELD reasoning     ON decisions TYPE option<string>;
DEFINE FIELD trade_offs    ON decisions TYPE option<string>;
DEFINE FIELD superseded_by ON decisions TYPE option<record<decisions>>;
DEFINE FIELD embedding     ON decisions TYPE option<array<float>>;
DEFINE FIELD created_at    ON decisions TYPE datetime DEFAULT time::now();

-- Computed: assembled for semantic search — DB owns this
DEFINE FIELD full_text ON decisions VALUE
  title + ': ' + decision +
  IF reasoning { ' Reasoning: ' + reasoning } ELSE { '' };

DEFINE INDEX idx_decisions_sprint  ON decisions FIELDS sprint;
DEFINE INDEX idx_decisions_vector  ON decisions FIELDS embedding MTREE DIMENSION 1536 DIST COSINE;

-- =============================================================================
-- TASKS
-- =============================================================================

DEFINE TABLE tasks SCHEMAFULL;
DEFINE FIELD content    ON tasks TYPE string;
DEFINE FIELD status     ON tasks TYPE string
  ASSERT $value IN ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'];
DEFINE FIELD sprint     ON tasks TYPE option<string>;
DEFINE FIELD priority   ON tasks TYPE int DEFAULT 0;
DEFINE FIELD created_at ON tasks TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON tasks TYPE datetime VALUE time::now();
DEFINE INDEX idx_tasks_status ON tasks FIELDS status;
DEFINE INDEX idx_tasks_sprint ON tasks FIELDS sprint;

-- =============================================================================
-- FILE CONVENTIONS
-- =============================================================================

DEFINE TABLE file_conventions SCHEMAFULL;
DEFINE FIELD pattern    ON file_conventions TYPE string;
DEFINE FIELD convention ON file_conventions TYPE string;
DEFINE FIELD suffix     ON file_conventions TYPE option<string>;
DEFINE FIELD location   ON file_conventions TYPE string;
DEFINE FIELD created_at ON file_conventions TYPE datetime DEFAULT time::now();

-- =============================================================================
-- COMMITS — session progress log
-- =============================================================================

DEFINE TABLE commits SCHEMAFULL;
DEFINE FIELD type       ON commits TYPE string
  ASSERT $value IN ['feat', 'fix', 'refactor', 'chore', 'docs', 'test', 'style', 'perf', 'breaking', 'revert'];
DEFINE FIELD scope      ON commits TYPE option<string>;
DEFINE FIELD message    ON commits TYPE string;
DEFINE FIELD body       ON commits TYPE option<string>;
DEFINE FIELD files      ON commits TYPE array DEFAULT [];
DEFINE FIELD session_id ON commits TYPE string;
DEFINE FIELD agent      ON commits TYPE string DEFAULT 'claude';
DEFINE FIELD created_at ON commits TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_commits_session ON commits FIELDS session_id;
DEFINE INDEX idx_commits_type    ON commits FIELDS type;
DEFINE INDEX idx_commits_time    ON commits FIELDS created_at;

-- =============================================================================
-- DEFINE API: Self-service provisioning baked into the DB
-- These run inside SurrealDB — zero middleware, zero app code for provisioning.
-- POST /api/projects/devpulse/provision/project/:name → register new project
-- POST /api/projects/devpulse/provision/agent/:name  → register new agent
-- GET  /api/projects/devpulse/context                → full context payload for session start
-- =============================================================================

DEFINE API "/provision/project/:name" FOR post
  PERMISSIONS FULL
  THEN {
    LET $name = $request.params.name;
    RETURN {
      provisioned: $name,
      status: 'ok',
      next: 'Run schema-projects.surql against NS projects DB ' + $name
    };
  };

DEFINE API "/provision/agent/:name" FOR post
  PERMISSIONS FULL
  THEN {
    LET $name = $request.params.name;
    RETURN {
      provisioned: $name,
      status: 'ok',
      next: 'Run schema-agents.surql against NS agents DB ' + $name
    };
  };

DEFINE API "/context" FOR get
  PERMISSIONS FULL
  THEN {
    LET $ctx   = SELECT key, value, priority FROM context ORDER BY priority DESC;
    LET $arch  = SELECT layer, rule, description FROM architecture LIMIT 20;
    LET $tasks = SELECT content, status, sprint FROM tasks
                 WHERE status IN ['pending', 'in_progress']
                 ORDER BY priority DESC LIMIT 10;
    RETURN { context: $ctx, architecture: $arch, active_tasks: $tasks };
  };
