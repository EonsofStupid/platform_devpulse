//! Graph service wrapper (`SurrealDB`).
//!
//! The graph layer is a pure WS client to the managed Surreal child
//! — see [`crate::platform::services::surreal`] for the process
//! lifecycle. Each `GraphService` holds a `ScopedGraphHandle` that
//! prefixes every query with `USE NS {ns} DB {db};`, so namespace
//! isolation is enforced at the query level.
//!
//! Three scoped schemas:
//! - **System**: FSM state machine, thinking state, quality check outputs.
//! - **User**: knowledge graph, memory with staging, corrections.
//! - **Global**: cross-project concepts, shared learnings, dev profile.

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_clyffy::cortex::persistence::{ScopedGraphHandle, SurrealAdapter};
use std::sync::Arc;

/// Graph store backed by `SurrealDB` with explicit namespace scoping.
///
/// Every operation goes through `ScopedGraphHandle` which prefixes
/// queries with `USE NS {ns} DB {db};`. Namespace isolation is real.
pub struct GraphService {
    handle: ScopedGraphHandle,
    /// Scoped name for health checks (e.g., "System graph", "User graph").
    label: &'static str,
}

impl GraphService {
    /// Create a graph service from a shared `SurrealAdapter` client.
    ///
    /// All graph scopes (system, user, global) share a single WS client
    /// to the sidecar — the adapter must already have the target
    /// namespace initialized via `init_namespace()` before this call.
    pub fn from_shared(
        adapter: &Arc<SurrealAdapter>,
        namespace: &str,
        database: &str,
        label: &'static str,
    ) -> Self {
        let handle = adapter.scoped_handle(namespace, database);
        Self { handle, label }
    }

    /// Get the scoped handle for typed graph operations.
    pub fn handle(&self) -> &ScopedGraphHandle {
        &self.handle
    }

    /// Get the underlying adapter (shared WS client).
    pub fn adapter(&self) -> &Arc<SurrealAdapter> {
        self.handle.adapter()
    }
}

impl Service for GraphService {
    fn name(&self) -> &'static str {
        self.label
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Graph
    }

    async fn ping(&self) -> Result<()> {
        self.handle.ping().await
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        tracing::info!(
            service = self.label,
            namespace = self.handle.namespace(),
            database = self.handle.database(),
            "Shutting down graph service"
        );
        self.handle.adapter().quiesce().await;
        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════
// System scope schema — uses PUBLIC equivalents only
// ═══════════════════════════════════════════════════════════════

/// Schema for the system-scoped graph store.
///
/// Contains FSM state machine, reasoning nodes/edges, state transitions,
/// quality check outputs, prompt builder tracking, thinking state.
///
/// All table/field names use PUBLIC equivalents per ip-protection rules.
pub const SYSTEM_GRAPH_SCHEMA: &str = r"
-- Key-value store for signal-based access
DEFINE TABLE IF NOT EXISTS kv SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS key ON kv TYPE string;
DEFINE FIELD IF NOT EXISTS value ON kv TYPE bytes;
DEFINE INDEX IF NOT EXISTS kv_key ON kv FIELDS key UNIQUE;

-- Reasoning nodes (concepts, facts, decisions)
DEFINE TABLE IF NOT EXISTS nodes SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS node_type ON nodes TYPE string;
DEFINE FIELD IF NOT EXISTS content ON nodes TYPE string;
DEFINE FIELD IF NOT EXISTS metadata ON nodes TYPE object;
DEFINE FIELD IF NOT EXISTS created_at ON nodes TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS nodes_type ON nodes FIELDS node_type;

-- Reasoning edges (relationships between nodes)
DEFINE TABLE IF NOT EXISTS relates SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS relation_type ON relates TYPE string;
DEFINE FIELD IF NOT EXISTS weight ON relates TYPE float DEFAULT 1.0;
DEFINE FIELD IF NOT EXISTS created_at ON relates TYPE datetime DEFAULT time::now();

-- Context switching states
DEFINE TABLE IF NOT EXISTS states SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON states TYPE string;
DEFINE FIELD IF NOT EXISTS probability ON states TYPE float;
DEFINE FIELD IF NOT EXISTS emissions ON states TYPE array;
DEFINE INDEX IF NOT EXISTS states_name ON states FIELDS name UNIQUE;

-- State transitions
DEFINE TABLE IF NOT EXISTS transitions SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS from_state ON transitions TYPE record(states);
DEFINE FIELD IF NOT EXISTS to_state ON transitions TYPE record(states);
DEFINE FIELD IF NOT EXISTS probability ON transitions TYPE float;
DEFINE FIELD IF NOT EXISTS trigger ON transitions TYPE string;

-- Quality check outputs (memory, quality_check, etc.)
DEFINE TABLE IF NOT EXISTS check_outputs SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS check_type ON check_outputs TYPE string;
DEFINE FIELD IF NOT EXISTS layer ON check_outputs TYPE string;
DEFINE FIELD IF NOT EXISTS output ON check_outputs TYPE object;
DEFINE FIELD IF NOT EXISTS confidence ON check_outputs TYPE float;
DEFINE FIELD IF NOT EXISTS session_id ON check_outputs TYPE string;
DEFINE FIELD IF NOT EXISTS trace_id ON check_outputs TYPE string;
DEFINE FIELD IF NOT EXISTS triggered_at ON check_outputs TYPE datetime;
DEFINE FIELD IF NOT EXISTS completed_at ON check_outputs TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS check_outputs_type ON check_outputs FIELDS check_type;
DEFINE INDEX IF NOT EXISTS check_outputs_session ON check_outputs FIELDS session_id;

-- Prompt builder tracking
DEFINE TABLE IF NOT EXISTS prompt_templates SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS session_id ON prompt_templates TYPE string;
DEFINE FIELD IF NOT EXISTS context_summary ON prompt_templates TYPE string;
DEFINE FIELD IF NOT EXISTS objective ON prompt_templates TYPE string;
DEFINE FIELD IF NOT EXISTS style ON prompt_templates TYPE string;
DEFINE FIELD IF NOT EXISTS tone ON prompt_templates TYPE string;
DEFINE FIELD IF NOT EXISTS audience ON prompt_templates TYPE string;
DEFINE FIELD IF NOT EXISTS response_format ON prompt_templates TYPE string;
DEFINE FIELD IF NOT EXISTS completeness_score ON prompt_templates TYPE float;
DEFINE FIELD IF NOT EXISTS total_tokens ON prompt_templates TYPE int;
DEFINE FIELD IF NOT EXISTS created_at ON prompt_templates TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS prompt_session ON prompt_templates FIELDS session_id;

-- Thinking state per session
DEFINE TABLE IF NOT EXISTS thinking_state SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS session_id ON thinking_state TYPE string;
DEFINE FIELD IF NOT EXISTS rolling_summary ON thinking_state TYPE string;
DEFINE FIELD IF NOT EXISTS rolling_summary_tokens ON thinking_state TYPE int;
DEFINE FIELD IF NOT EXISTS current_phase ON thinking_state TYPE string DEFAULT 'idle';
DEFINE FIELD IF NOT EXISTS is_processing ON thinking_state TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS updated_at ON thinking_state TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS thinking_session ON thinking_state FIELDS session_id UNIQUE;

-- Constrained decoding service (system-owned mirror of LibSQL grammar tables)
DEFINE TABLE IF NOT EXISTS grammar_service SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS singleton_key ON grammar_service TYPE string;
DEFINE FIELD IF NOT EXISTS enabled ON grammar_service TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS service_kind ON grammar_service TYPE string;
DEFINE FIELD IF NOT EXISTS last_boot_ok ON grammar_service TYPE option<bool>;
DEFINE FIELD IF NOT EXISTS last_error ON grammar_service TYPE option<string>;
DEFINE FIELD IF NOT EXISTS runtime ON grammar_service TYPE option<object>;
DEFINE FIELD IF NOT EXISTS updated_at ON grammar_service TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS grammar_service_singleton ON grammar_service FIELDS singleton_key UNIQUE;

DEFINE TABLE IF NOT EXISTS grammar_defaults SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS logical_id ON grammar_defaults TYPE string;
DEFINE FIELD IF NOT EXISTS payload ON grammar_defaults TYPE object;
DEFINE FIELD IF NOT EXISTS schema_version ON grammar_defaults TYPE int DEFAULT 1;
DEFINE FIELD IF NOT EXISTS source ON grammar_defaults TYPE string DEFAULT 'system';
DEFINE FIELD IF NOT EXISTS updated_at ON grammar_defaults TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS grammar_defaults_id ON grammar_defaults FIELDS logical_id UNIQUE;

DEFINE TABLE IF NOT EXISTS grammar_baselines SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS label ON grammar_baselines TYPE string;
DEFINE FIELD IF NOT EXISTS captured_at ON grammar_baselines TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS context ON grammar_baselines TYPE object;
DEFINE FIELD IF NOT EXISTS fingerprint ON grammar_baselines TYPE option<string>;
DEFINE FIELD IF NOT EXISTS promoted ON grammar_baselines TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS notes ON grammar_baselines TYPE option<string>;
DEFINE INDEX IF NOT EXISTS grammar_baselines_time ON grammar_baselines FIELDS captured_at;
";

// ═══════════════════════════════════════════════════════════════
// User scope schema
// ═══════════════════════════════════════════════════════════════

/// Schema for the user-scoped graph store.
///
/// Contains user knowledge relationships, memory graph with staging,
/// learning patterns, and concept mastery connections.
pub const USER_GRAPH_SCHEMA: &str = r"
-- Key-value store for signal-based access
DEFINE TABLE IF NOT EXISTS kv SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS key ON kv TYPE string;
DEFINE FIELD IF NOT EXISTS value ON kv TYPE bytes;
DEFINE INDEX IF NOT EXISTS kv_key ON kv FIELDS key UNIQUE;

-- Memory nodes with staging (hot/warm/cold/frozen)
DEFINE TABLE IF NOT EXISTS memories SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS content ON memories TYPE string;
DEFINE FIELD IF NOT EXISTS content_hash ON memories TYPE string;
DEFINE FIELD IF NOT EXISTS memory_type ON memories TYPE string;
DEFINE FIELD IF NOT EXISTS stage ON memories TYPE string DEFAULT 'hot';
DEFINE FIELD IF NOT EXISTS ttl_expires_at ON memories TYPE datetime;
DEFINE FIELD IF NOT EXISTS access_count ON memories TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS last_accessed_at ON memories TYPE datetime;
DEFINE FIELD IF NOT EXISTS source_type ON memories TYPE string;
DEFINE FIELD IF NOT EXISTS source_id ON memories TYPE string;
DEFINE FIELD IF NOT EXISTS project_id ON memories TYPE string;
DEFINE FIELD IF NOT EXISTS created_at ON memories TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON memories TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS memories_stage ON memories FIELDS stage;
DEFINE INDEX IF NOT EXISTS memories_type ON memories FIELDS memory_type;
DEFINE INDEX IF NOT EXISTS memories_project ON memories FIELDS project_id;

-- Memory relationships (connects memories to form knowledge graph)
DEFINE TABLE IF NOT EXISTS remembers SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS relation_type ON remembers TYPE string;
DEFINE FIELD IF NOT EXISTS weight ON remembers TYPE float DEFAULT 1.0;
DEFINE FIELD IF NOT EXISTS created_at ON remembers TYPE datetime DEFAULT time::now();

-- Knowledge concepts (nodes the user has learned)
DEFINE TABLE IF NOT EXISTS concepts SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON concepts TYPE string;
DEFINE FIELD IF NOT EXISTS category ON concepts TYPE string;
DEFINE FIELD IF NOT EXISTS mastery_level ON concepts TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS current_depth ON concepts TYPE int DEFAULT 3;
DEFINE FIELD IF NOT EXISTS times_referenced ON concepts TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS last_referenced ON concepts TYPE datetime;
DEFINE FIELD IF NOT EXISTS created_at ON concepts TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON concepts TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS concepts_name ON concepts FIELDS name UNIQUE;
DEFINE INDEX IF NOT EXISTS concepts_category ON concepts FIELDS category;
DEFINE INDEX IF NOT EXISTS concepts_mastery ON concepts FIELDS mastery_level;

-- Concept relationships (prerequisite, related, builds_on)
DEFINE TABLE IF NOT EXISTS relates_to SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS relation_type ON relates_to TYPE string;
DEFINE FIELD IF NOT EXISTS weight ON relates_to TYPE float DEFAULT 1.0;
DEFINE FIELD IF NOT EXISTS created_at ON relates_to TYPE datetime DEFAULT time::now();

-- Correction patterns (user corrections form their own graph)
DEFINE TABLE IF NOT EXISTS corrections SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS original_claim ON corrections TYPE string;
DEFINE FIELD IF NOT EXISTS correction ON corrections TYPE string;
DEFINE FIELD IF NOT EXISTS implied_rule ON corrections TYPE string;
DEFINE FIELD IF NOT EXISTS severity ON corrections TYPE string DEFAULT 'normal';
DEFINE FIELD IF NOT EXISTS project_id ON corrections TYPE string;
DEFINE FIELD IF NOT EXISTS absorbed ON corrections TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS created_at ON corrections TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS corrections_project ON corrections FIELDS project_id;
DEFINE INDEX IF NOT EXISTS corrections_absorbed ON corrections FIELDS absorbed;

-- User grammar preferences (devtools layout, strictness presets)
DEFINE TABLE IF NOT EXISTS grammar_preferences SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS user_id ON grammar_preferences TYPE string;
DEFINE FIELD IF NOT EXISTS devtool ON grammar_preferences TYPE option<object>;
DEFINE FIELD IF NOT EXISTS strictness ON grammar_preferences TYPE string DEFAULT 'balanced';
DEFINE FIELD IF NOT EXISTS updated_at ON grammar_preferences TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS grammar_prefs_user ON grammar_preferences FIELDS user_id UNIQUE;

-- Project-owned grammar schemas and lane bindings
DEFINE TABLE IF NOT EXISTS grammar_schemas SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS project_id ON grammar_schemas TYPE string;
DEFINE FIELD IF NOT EXISTS name ON grammar_schemas TYPE string;
DEFINE FIELD IF NOT EXISTS dialect ON grammar_schemas TYPE string DEFAULT 'json_schema';
DEFINE FIELD IF NOT EXISTS body ON grammar_schemas TYPE string;
DEFINE FIELD IF NOT EXISTS is_active ON grammar_schemas TYPE bool DEFAULT true;
DEFINE FIELD IF NOT EXISTS created_at ON grammar_schemas TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON grammar_schemas TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS grammar_schemas_project ON grammar_schemas FIELDS project_id;
DEFINE INDEX IF NOT EXISTS grammar_schemas_name ON grammar_schemas FIELDS name;

DEFINE TABLE IF NOT EXISTS grammar_bindings SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS project_id ON grammar_bindings TYPE string;
DEFINE FIELD IF NOT EXISTS schema_id ON grammar_bindings TYPE string;
DEFINE FIELD IF NOT EXISTS lane ON grammar_bindings TYPE string;
DEFINE FIELD IF NOT EXISTS enforcement ON grammar_bindings TYPE string DEFAULT 'soft';
DEFINE FIELD IF NOT EXISTS priority ON grammar_bindings TYPE int DEFAULT 50;
DEFINE FIELD IF NOT EXISTS created_at ON grammar_bindings TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON grammar_bindings TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS grammar_bindings_project ON grammar_bindings FIELDS project_id;
DEFINE INDEX IF NOT EXISTS grammar_bindings_schema ON grammar_bindings FIELDS schema_id;
DEFINE INDEX IF NOT EXISTS grammar_bindings_lane ON grammar_bindings FIELDS lane;

-- Cortex governance graph (CORTEX.md §4): operator-authored reasoning
-- trees. `thought` rows are scoped per project via the `project_id`
-- field, mirroring the `memories` / `corrections` per-project pattern.
-- Three built-in edge types (leads_to / refines / summarizes) ship now;
-- custom edge types load via plugin registry in the last build phase.
DEFINE TABLE IF NOT EXISTS thought SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS content ON thought TYPE string;
DEFINE FIELD IF NOT EXISTS rro_state ON thought TYPE string;
DEFINE FIELD IF NOT EXISTS depth ON thought TYPE int;
DEFINE FIELD IF NOT EXISTS proximity ON thought TYPE float;
DEFINE FIELD IF NOT EXISTS branch_id ON thought TYPE string;
DEFINE FIELD IF NOT EXISTS project_id ON thought TYPE string;
DEFINE FIELD IF NOT EXISTS checkpoint ON thought TYPE option<record<thought>>;
DEFINE FIELD IF NOT EXISTS created_at ON thought TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS thought_project ON thought FIELDS project_id;
DEFINE INDEX IF NOT EXISTS thought_branch ON thought FIELDS branch_id;
DEFINE INDEX IF NOT EXISTS thought_state ON thought FIELDS rro_state;

DEFINE TABLE IF NOT EXISTS leads_to TYPE RELATION FROM thought TO thought SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS created_at ON leads_to TYPE datetime DEFAULT time::now();

DEFINE TABLE IF NOT EXISTS refines TYPE RELATION FROM thought TO thought SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS created_at ON refines TYPE datetime DEFAULT time::now();

DEFINE TABLE IF NOT EXISTS summarizes TYPE RELATION FROM thought TO thought SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS created_at ON summarizes TYPE datetime DEFAULT time::now();
";

// ═══════════════════════════════════════════════════════════════
// Global scope schema
// ═══════════════════════════════════════════════════════════════

/// Schema for the global-scoped graph store.
///
/// Cross-project shared knowledge: technology relationships,
/// pattern recognition, project promotion signals, shared learnings.
pub const GLOBAL_GRAPH_SCHEMA: &str = r"
-- Key-value store for signal-based access
DEFINE TABLE IF NOT EXISTS kv SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS key ON kv TYPE string;
DEFINE FIELD IF NOT EXISTS value ON kv TYPE bytes;
DEFINE INDEX IF NOT EXISTS kv_key ON kv FIELDS key UNIQUE;

-- Technology nodes (languages, frameworks, tools)
DEFINE TABLE IF NOT EXISTS technologies SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON technologies TYPE string;
DEFINE FIELD IF NOT EXISTS category ON technologies TYPE string;
DEFINE FIELD IF NOT EXISTS version ON technologies TYPE string;
DEFINE FIELD IF NOT EXISTS proficiency ON technologies TYPE float DEFAULT 0.0;
DEFINE FIELD IF NOT EXISTS last_used ON technologies TYPE datetime;
DEFINE FIELD IF NOT EXISTS project_count ON technologies TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS created_at ON technologies TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON technologies TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS tech_name ON technologies FIELDS name UNIQUE;
DEFINE INDEX IF NOT EXISTS tech_category ON technologies FIELDS category;

-- Technology relationships (depends_on, pairs_with, replaces)
DEFINE TABLE IF NOT EXISTS tech_relates SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS relation_type ON tech_relates TYPE string;
DEFINE FIELD IF NOT EXISTS weight ON tech_relates TYPE float DEFAULT 1.0;
DEFINE FIELD IF NOT EXISTS created_at ON tech_relates TYPE datetime DEFAULT time::now();

-- Cross-project patterns (recurring solutions, architectures)
DEFINE TABLE IF NOT EXISTS patterns SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON patterns TYPE string;
DEFINE FIELD IF NOT EXISTS description ON patterns TYPE string;
DEFINE FIELD IF NOT EXISTS category ON patterns TYPE string;
DEFINE FIELD IF NOT EXISTS confidence ON patterns TYPE float DEFAULT 0.5;
DEFINE FIELD IF NOT EXISTS reinforcement_count ON patterns TYPE int DEFAULT 1;
DEFINE FIELD IF NOT EXISTS project_ids ON patterns TYPE array;
DEFINE FIELD IF NOT EXISTS last_reinforced_at ON patterns TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS created_at ON patterns TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON patterns TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS patterns_category ON patterns FIELDS category;
DEFINE INDEX IF NOT EXISTS patterns_confidence ON patterns FIELDS confidence;

-- Project promotion signals (detected cross-project relevance)
DEFINE TABLE IF NOT EXISTS promotion_signals SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS source_project_id ON promotion_signals TYPE string;
DEFINE FIELD IF NOT EXISTS detected_signals ON promotion_signals TYPE object;
DEFINE FIELD IF NOT EXISTS suggested_name ON promotion_signals TYPE string;
DEFINE FIELD IF NOT EXISTS suggested_tech_stack ON promotion_signals TYPE array;
DEFINE FIELD IF NOT EXISTS confidence ON promotion_signals TYPE float;
DEFINE FIELD IF NOT EXISTS status ON promotion_signals TYPE string DEFAULT 'suggested';
DEFINE FIELD IF NOT EXISTS created_at ON promotion_signals TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS promo_status ON promotion_signals FIELDS status;

-- Shared learnings (patterns observed across all projects)
DEFINE TABLE IF NOT EXISTS shared_learnings SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS pattern ON shared_learnings TYPE string;
DEFINE FIELD IF NOT EXISTS confidence ON shared_learnings TYPE float DEFAULT 0.5;
DEFINE FIELD IF NOT EXISTS reinforcement_count ON shared_learnings TYPE int DEFAULT 1;
DEFINE FIELD IF NOT EXISTS source_projects ON shared_learnings TYPE array;
DEFINE FIELD IF NOT EXISTS last_reinforced_at ON shared_learnings TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS created_at ON shared_learnings TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS learnings_confidence ON shared_learnings FIELDS confidence;

-- Developer profile preferences (synced from session context)
DEFINE TABLE IF NOT EXISTS dev_profile SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS key ON dev_profile TYPE string;
DEFINE FIELD IF NOT EXISTS value ON dev_profile TYPE string;
DEFINE FIELD IF NOT EXISTS category ON dev_profile TYPE string;
DEFINE FIELD IF NOT EXISTS updated_at ON dev_profile TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS dev_profile_key ON dev_profile FIELDS key UNIQUE;
DEFINE INDEX IF NOT EXISTS dev_profile_category ON dev_profile FIELDS category;

-- Rejections (things user explicitly said NO to -- never suggest again)
DEFINE TABLE IF NOT EXISTS rejections SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS description ON rejections TYPE string;
DEFINE FIELD IF NOT EXISTS category ON rejections TYPE string;
DEFINE FIELD IF NOT EXISTS severity ON rejections TYPE string DEFAULT 'hard';
DEFINE FIELD IF NOT EXISTS reason ON rejections TYPE string;
DEFINE FIELD IF NOT EXISTS created_at ON rejections TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS rejections_category ON rejections FIELDS category;
";
