//! Relational service wrapper (`LibSQL`).
//!
//! Two scoped schemas:
//! - **System**: platform config, guardian state (git/file drift)
//! - **User**: profiles, preferences, projects, sessions, turns,
//!   anchors, open loops, corrections, learnings, concepts, psych

use super::{Service, ServiceRole};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::LibSqlAdapter;
use std::path::Path;
use std::sync::Arc;

/// Relational store backed by `LibSQL`.
pub struct RelationalService {
    adapter: Arc<LibSqlAdapter>,
    /// Scoped name for health checks (e.g., "System relational", "User relational").
    label: &'static str,
}

impl RelationalService {
    /// Boot the relational store with a scope-specific schema.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub async fn boot(path: &Path, schema: &str, label: &'static str) -> Result<Self> {
        let adapter = LibSqlAdapter::open_with_schema(path, schema).await?;
        Ok(Self {
            adapter: Arc::new(adapter),
            label,
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<LibSqlAdapter> {
        &self.adapter
    }
}

impl Service for RelationalService {
    fn name(&self) -> &'static str {
        self.label
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Relational
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn is_ready(&self) -> bool {
        true
    }

    async fn shutdown(&self) -> Result<()> {
        tracing::info!(service = self.label, "Shutting down LibSQL service");
        self.adapter.close().await;
        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════
// System scope schema
// ═══════════════════════════════════════════════════════════════

/// Schema for the system-scoped relational store.
///
/// Contains platform internals only — never user-facing data.
pub const SYSTEM_SCHEMA: &str = r"
-- Key-value store for signal-based access
CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value BLOB NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_kv_updated ON kv_store(updated_at);

-- Platform configuration (system-wide settings)
CREATE TABLE IF NOT EXISTS platform_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_config_category ON platform_config(category);

-- Guardian state snapshots (git/file drift detection per project)
CREATE TABLE IF NOT EXISTS guardian_states (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    current_branch TEXT,
    last_commit_hash TEXT,
    last_commit_msg TEXT,
    last_commit_at INTEGER,
    uncommitted_changes INTEGER DEFAULT 0,
    modified_files TEXT,                     -- JSON array
    created_files TEXT,                      -- JSON array
    deleted_files TEXT,                      -- JSON array
    drift_detected INTEGER DEFAULT 0,
    drift_details TEXT,                      -- JSON object
    captured_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_guardian_project ON guardian_states(project_id);
CREATE INDEX IF NOT EXISTS idx_guardian_captured ON guardian_states(captured_at);

-- Boot history for diagnostics
CREATE TABLE IF NOT EXISTS boot_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    success INTEGER NOT NULL DEFAULT 0,
    services_booted INTEGER DEFAULT 0,
    services_failed INTEGER DEFAULT 0,
    total_latency_ms INTEGER,
    error_message TEXT
);
";

// ═══════════════════════════════════════════════════════════════
// User scope schema
// ═══════════════════════════════════════════════════════════════

/// Schema for the user-scoped relational store.
///
/// Contains all user-owned data: identity, preferences, projects,
/// sessions, conversation history, memory corrections, learnings.
pub const USER_SCHEMA: &str = r"
-- Key-value store for user signal-based access
CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value BLOB NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_kv_updated ON kv_store(updated_at);

-- ── User Identity ────────────────────────────────────────────

-- User profile (single row per install, multi-user future-proofed)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    display_name TEXT,
    email TEXT UNIQUE,
    hardware_profile TEXT DEFAULT '32g_engineer',
    onboarding_complete INTEGER DEFAULT 0,
    expertise_level INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    last_active_at INTEGER
);

-- User preferences (theme, context mode, editor settings)
CREATE TABLE IF NOT EXISTS preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark',
    context_mode TEXT DEFAULT 'normal',      -- lean | normal | deep
    show_thinking INTEGER DEFAULT 0,
    preferred_languages TEXT,                -- JSON array
    tab_size INTEGER DEFAULT 4,
    use_semicolons INTEGER DEFAULT 1,
    default_temperature REAL DEFAULT 0.7,
    verbosity TEXT DEFAULT 'balanced',
    allow_telemetry INTEGER DEFAULT 1,
    screen_capture_enabled INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(user_id)
);

-- API keys (encrypted, per adapter)
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    adapter TEXT NOT NULL,
    encrypted_key BLOB NOT NULL,
    key_hint TEXT,
    last_used_at INTEGER,
    total_tokens_used INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(user_id, adapter)
);

-- User config (legacy compatibility, simple key-value)
CREATE TABLE IF NOT EXISTS user_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);

-- ── Projects ─────────────────────────────────────────────────

-- Projects registry
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    root_path TEXT NOT NULL UNIQUE,
    project_type TEXT NOT NULL DEFAULT 'personal',  -- general | personal | team | archived
    slug TEXT,
    description TEXT,
    tool TEXT,                               -- lovable | cursor | vscode | etc.
    tech_stack TEXT,                         -- JSON array
    constitution TEXT,                       -- JSON object from .devpulse/constitution.md
    settings TEXT,                           -- JSON object
    promoted_from_id TEXT,
    promotion_status TEXT DEFAULT 'pending', -- pending | suggested | promoted | declined
    promoted_at INTEGER,
    active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    last_active_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(root_path);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);

-- Per-project golden path rules
CREATE TABLE IF NOT EXISTS golden_path (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL,
    rule TEXT NOT NULL,
    priority INTEGER DEFAULT 50,
    source TEXT DEFAULT 'user',
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_golden_path_project ON golden_path(project_id);

-- Per-project context summary
CREATE TABLE IF NOT EXISTS project_context (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    tech_summary TEXT,
    architecture_summary TEXT,
    recent_focus TEXT,
    total_indexed_tokens INTEGER DEFAULT 0,
    active_context_tokens INTEGER DEFAULT 0,
    last_indexed_at INTEGER,
    last_accessed_at INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- ── Sessions & Conversation ──────────────────────────────────

-- Sessions (one per sitting)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT,
    context_mode TEXT DEFAULT 'normal',      -- lean | normal | deep
    is_active INTEGER DEFAULT 1,
    summary TEXT,                            -- DIARY populates
    decisions TEXT,                          -- JSON array [{decision, rationale, timestamp}]
    open_loops_json TEXT,                    -- JSON array [{description, priority, context}]
    blockers_hit TEXT,                       -- JSON array
    wins_achieved TEXT,                      -- JSON array
    mood_trajectory TEXT,                    -- JSON array ['focused', 'frustrated', 'resolved']
    interaction_count INTEGER DEFAULT 0,
    escalation_count INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    ended_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active, updated_at);

-- Turns (individual messages with full telemetry)
CREATE TABLE IF NOT EXISTS turns (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role TEXT NOT NULL,                      -- user | assistant | system
    content TEXT NOT NULL,
    token_count INTEGER,
    model_used TEXT,
    latency_ms INTEGER,
    finish_reason TEXT,
    sequence_num INTEGER NOT NULL,
    metadata TEXT,                           -- JSON object
    created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_turns_session ON turns(session_id, sequence_num);
CREATE INDEX IF NOT EXISTS idx_turns_project ON turns(project_id);

-- Session anchors (facts extracted during conversation)
CREATE TABLE IF NOT EXISTS anchors (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    fact TEXT NOT NULL,
    source TEXT,
    confidence REAL DEFAULT 0.8,
    is_active INTEGER DEFAULT 1,
    superseded_by TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_anchors_session ON anchors(session_id);
CREATE INDEX IF NOT EXISTS idx_anchors_project ON anchors(project_id);

-- Open loops (unresolved questions/blockers)
CREATE TABLE IF NOT EXISTS open_loops (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',             -- open | resolved | abandoned
    resolved_at INTEGER,
    resolution_turn_id TEXT REFERENCES turns(id),
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_open_loops_session ON open_loops(session_id);
CREATE INDEX IF NOT EXISTS idx_open_loops_status ON open_loops(status);

-- Focus contexts (what user is working on — survives focus switches)
CREATE TABLE IF NOT EXISTS focus_contexts (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    last_touched INTEGER DEFAULT (unixepoch()),
    touch_count INTEGER DEFAULT 1,
    files TEXT,                              -- JSON array
    branches TEXT,                           -- JSON array
    external_refs TEXT,                      -- JSON array (Figma, Supabase, etc.)
    context_ready INTEGER DEFAULT 0,
    context_stale INTEGER DEFAULT 0,
    last_prepared INTEGER,
    created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_focus_session ON focus_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_focus_active ON focus_contexts(active);

-- ── Learning & Memory ────────────────────────────────────────

-- User corrections (when user corrects the assistant)
CREATE TABLE IF NOT EXISTS corrections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    original_claim TEXT NOT NULL,
    correction TEXT NOT NULL,
    implied_rule TEXT,
    severity TEXT DEFAULT 'normal',         -- normal | critical
    source_turn_id TEXT REFERENCES turns(id),
    absorbed INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_corrections_project ON corrections(project_id);
CREATE INDEX IF NOT EXISTS idx_corrections_absorbed ON corrections(absorbed);

-- Learnings (patterns observed across sessions)
CREATE TABLE IF NOT EXISTS learnings (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    pattern TEXT NOT NULL,
    confidence REAL DEFAULT 0.5,
    reinforcement_count INTEGER DEFAULT 1,
    last_reinforced_at INTEGER DEFAULT (unixepoch()),
    source_type TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_learnings_project ON learnings(project_id);
CREATE INDEX IF NOT EXISTS idx_learnings_confidence ON learnings(confidence);

-- Concept mastery tracking (TEACHER agent)
CREATE TABLE IF NOT EXISTS user_concepts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    concept TEXT NOT NULL,
    category TEXT,                           -- react | git | rust | database | etc.
    introduced_at INTEGER,
    demonstrated_at INTEGER,
    mastery_level INTEGER DEFAULT 0,         -- 0=unknown 1=introduced 2=demonstrated 3=mastered
    times_used_by_maestro INTEGER DEFAULT 0,
    times_used_by_user INTEGER DEFAULT 0,
    last_referenced INTEGER,
    current_depth INTEGER DEFAULT 3,         -- 3=full explain 2=brief 1=assume known 0=expert
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(user_id, concept)
);
CREATE INDEX IF NOT EXISTS idx_concepts_user ON user_concepts(user_id);
CREATE INDEX IF NOT EXISTS idx_concepts_mastery ON user_concepts(mastery_level);

-- Psych states (frustration/flow tracking per session)
CREATE TABLE IF NOT EXISTS psych_states (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    state TEXT NOT NULL,                     -- flow | focused | frustrated | stuck
    confidence REAL,
    signals TEXT,                            -- JSON {tab_switches, error_count, caps_lock, ...}
    recommended_tone TEXT,
    avoid TEXT,                              -- JSON array
    assessed_at INTEGER DEFAULT (unixepoch()),
    valid_until INTEGER,
    created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_psych_session ON psych_states(session_id);
CREATE INDEX IF NOT EXISTS idx_psych_state ON psych_states(state);

-- Ambient observations (VL screenshot descriptions)
CREATE TABLE IF NOT EXISTS ambient_observations (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    trigger TEXT NOT NULL,                   -- tab_switch | periodic | user_idle
    app_name TEXT,
    description TEXT NOT NULL,
    extracted_topic TEXT,
    extracted_files TEXT,                    -- JSON array
    observed_at INTEGER DEFAULT (unixepoch()),
    used_in_context INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ambient_session ON ambient_observations(session_id);
CREATE INDEX IF NOT EXISTS idx_ambient_observed ON ambient_observations(observed_at);
";
