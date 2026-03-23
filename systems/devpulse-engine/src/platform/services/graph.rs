//! Graph service wrapper (`SurrealDB`).
//!
//! Three scoped schemas:
//! - **System**: FSM state machine, kernel reasoning, state transitions
//! - **User**: knowledge graph, learning patterns, memory relationships
//! - **Global**: cross-project concepts, shared knowledge base

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::SurrealAdapter;
use std::path::Path;
use std::sync::Arc;

/// Graph store backed by `SurrealDB`.
pub struct GraphService {
    adapter: Arc<SurrealAdapter>,
    /// Scoped name for health checks (e.g., "System graph", "User graph").
    label: &'static str,
}

impl GraphService {
    /// Boot the graph store with explicit namespace, database, and schema.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub async fn boot(
        path: &Path,
        namespace: &str,
        database: &str,
        schema: &str,
        label: &'static str,
    ) -> Result<Self> {
        let adapter = SurrealAdapter::open_with_ns(path, namespace, database, schema).await?;
        Ok(Self {
            adapter: Arc::new(adapter),
            label,
        })
    }

    /// Create a graph store from a shared adapter.
    ///
    /// Used when all graph stores share a single `SurrealDB` instance
    /// with multiple namespaces. The adapter must already have the
    /// target namespace initialized via `init_namespace()`.
    pub fn from_shared(adapter: Arc<SurrealAdapter>, label: &'static str) -> Self {
        Self { adapter, label }
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<SurrealAdapter> {
        &self.adapter
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
        self.adapter.ping().await
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        tracing::info!(service = self.label, "Shutting down SurrealDB service");
        self.adapter.close().await;
        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════
// System scope schema
// ═══════════════════════════════════════════════════════════════

/// Schema for the system-scoped graph store.
///
/// Contains kernel FSM state machine, reasoning nodes/edges,
/// state transitions, and HMM states. Never user-facing data.
pub const SYSTEM_GRAPH_SCHEMA: &str = r"
-- ══════════════════════════════════════════════════════════════
-- Platform engine system account.
-- OWNER role = full CRUD on all tables in this database.
-- The platform engine authenticates as this user for all internal ops.
-- External tools (Claude Code, surreal sql) connect as root via HTTP API :8822.
-- ══════════════════════════════════════════════════════════════
DEFINE USER IF NOT EXISTS devpulse_engine ON NAMESPACE PASSWORD 'dp_sys_2026!' ROLES OWNER;

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

-- HMM states for reasoning state machine
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

-- Sub-agent outputs (diary, guardian, psych, teacher, scribe)
DEFINE TABLE IF NOT EXISTS agent_outputs SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS agent ON agent_outputs TYPE string;
DEFINE FIELD IF NOT EXISTS layer ON agent_outputs TYPE string;
DEFINE FIELD IF NOT EXISTS output ON agent_outputs TYPE object;
DEFINE FIELD IF NOT EXISTS confidence ON agent_outputs TYPE float;
DEFINE FIELD IF NOT EXISTS session_id ON agent_outputs TYPE string;
DEFINE FIELD IF NOT EXISTS trace_id ON agent_outputs TYPE string;
DEFINE FIELD IF NOT EXISTS triggered_at ON agent_outputs TYPE datetime;
DEFINE FIELD IF NOT EXISTS completed_at ON agent_outputs TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS agent_outputs_agent ON agent_outputs FIELDS agent;
DEFINE INDEX IF NOT EXISTS agent_outputs_session ON agent_outputs FIELDS session_id;

-- COSTAR prompt tracking
DEFINE TABLE IF NOT EXISTS costar_prompts SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS session_id ON costar_prompts TYPE string;
DEFINE FIELD IF NOT EXISTS context_summary ON costar_prompts TYPE string;
DEFINE FIELD IF NOT EXISTS objective ON costar_prompts TYPE string;
DEFINE FIELD IF NOT EXISTS style ON costar_prompts TYPE string;
DEFINE FIELD IF NOT EXISTS tone ON costar_prompts TYPE string;
DEFINE FIELD IF NOT EXISTS audience ON costar_prompts TYPE string;
DEFINE FIELD IF NOT EXISTS response_format ON costar_prompts TYPE string;
DEFINE FIELD IF NOT EXISTS completeness_score ON costar_prompts TYPE float;
DEFINE FIELD IF NOT EXISTS total_tokens ON costar_prompts TYPE int;
DEFINE FIELD IF NOT EXISTS created_at ON costar_prompts TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS costar_session ON costar_prompts FIELDS session_id;

-- Rumination state per session
DEFINE TABLE IF NOT EXISTS rumination_state SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS session_id ON rumination_state TYPE string;
DEFINE FIELD IF NOT EXISTS rolling_summary ON rumination_state TYPE string;
DEFINE FIELD IF NOT EXISTS rolling_summary_tokens ON rumination_state TYPE int;
DEFINE FIELD IF NOT EXISTS current_layer ON rumination_state TYPE string DEFAULT 'background';
DEFINE FIELD IF NOT EXISTS is_processing ON rumination_state TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS updated_at ON rumination_state TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS rumination_session ON rumination_state FIELDS session_id UNIQUE;
";

// ═══════════════════════════════════════════════════════════════
// User scope schema
// ═══════════════════════════════════════════════════════════════

/// Schema for the user-scoped graph store.
///
/// Contains user knowledge relationships, memory graph with staging,
/// learning patterns, and concept mastery connections.
pub const USER_GRAPH_SCHEMA: &str = r"
-- Platform engine user-scope account. OWNER on this namespace.
DEFINE USER IF NOT EXISTS devpulse_engine ON NAMESPACE PASSWORD 'dp_usr_2026!' ROLES OWNER;

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
";

// ═══════════════════════════════════════════════════════════════
// Global scope schema
// ═══════════════════════════════════════════════════════════════

/// Schema for the global-scoped graph store.
///
/// Cross-project shared knowledge: technology relationships,
/// pattern recognition, project promotion signals, shared learnings.
pub const GLOBAL_GRAPH_SCHEMA: &str = r"
-- Platform engine global-scope account. OWNER on this namespace.
DEFINE USER IF NOT EXISTS devpulse_engine ON NAMESPACE PASSWORD 'dp_glb_2026!' ROLES OWNER;

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

-- Developer profile preferences (synced from SurrealDB session context)
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
