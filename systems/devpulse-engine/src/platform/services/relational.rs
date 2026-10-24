//! Relational service wrapper (Turso).
//!
//! Three scoped schemas:
//! - **System**: platform config, guardian state (git/file drift),
//!   constrained-decoding service status, protected defaults, dev baselines
//! - **User**: profiles, preferences, projects, sessions, turns,
//!   anchors, open loops, corrections, learnings, concepts, psych,
//!   grammar preferences, per-project schemas/bindings
//! - **Project**: per-project RAG data, file index, chunks, signals,
//!   codebase patterns, conventions, anti-drift log

use super::{Service, ServiceRole, ServiceState};
use crate::platform::db::{migrate, Migration};
use anyhow::{Context, Result};
use devpulse_clyffy::cortex::persistence::{TursoAdapter, TursoOptions};
use std::path::{Path, PathBuf};
use std::sync::Arc;

/// What a relational store applies when it opens: the base schema
/// (idempotent `CREATE ... IF NOT EXISTS`) and its versioned migrations.
#[derive(Debug, Clone, Copy)]
pub struct StoreSchema {
    /// Base schema for the scope.
    pub schema: &'static str,
    /// Versioned migrations for the scope, in order.
    pub migrations: &'static [Migration],
}

/// The system store: base schema + `migrations/system`.
pub const SYSTEM_STORE: StoreSchema = StoreSchema {
    schema: SYSTEM_SCHEMA,
    migrations: crate::platform::db::migrations::SYSTEM,
};

/// The user store: base schema + `migrations/user`.
pub const USER_STORE: StoreSchema = StoreSchema {
    schema: USER_SCHEMA,
    migrations: crate::platform::db::migrations::USER,
};

/// Relational store backed by Turso.
pub struct RelationalService {
    adapter: Arc<TursoAdapter>,
    /// The database file this service opened.
    path: PathBuf,
    /// Scoped name for health checks (e.g., "System relational", "User relational").
    label: &'static str,
    /// The migrations this build ships for the store's scope.
    migrations: &'static [Migration],
}

impl RelationalService {
    /// Boot the relational store with a scope-specific schema.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub async fn boot(
        path: &Path,
        store: StoreSchema,
        label: &'static str,
        options: TursoOptions,
    ) -> Result<Self> {
        let adapter = TursoAdapter::open_with_schema(path, store.schema, options).await?;
        let applied = migrate(&adapter, store.migrations)
            .await
            .with_context(|| format!("{label}: schema migration"))?;
        if applied > 0 {
            tracing::info!(service = label, applied, "relational store migrated");
        }
        Ok(Self {
            adapter: Arc::new(adapter),
            path: path.to_path_buf(),
            label,
            migrations: store.migrations,
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<TursoAdapter> {
        &self.adapter
    }

    /// The database file this service opened.
    pub fn path(&self) -> &Path {
        &self.path
    }

    /// The migrations this build ships for the store's scope.
    pub fn migrations(&self) -> &'static [Migration] {
        self.migrations
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

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        tracing::info!(service = self.label, "Shutting down Turso service");
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

-- Constrained decoding / grammar engine runtime (system-owned)
CREATE TABLE IF NOT EXISTS grammar_service (
    id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    service_kind TEXT NOT NULL DEFAULT '',
    last_boot_ok INTEGER,
    last_error TEXT,
    runtime_json TEXT,
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Protected default payloads (kernel-shaped JSON; system writes only)
CREATE TABLE IF NOT EXISTS grammar_defaults (
    id TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    schema_version INTEGER NOT NULL DEFAULT 1,
    source TEXT NOT NULL DEFAULT 'system',
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_grammar_defaults_source ON grammar_defaults(source);

-- Devtool baselines (hardware + lane snapshots for regression compares)
CREATE TABLE IF NOT EXISTS grammar_baselines (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    captured_at INTEGER NOT NULL DEFAULT (unixepoch()),
    context_json TEXT NOT NULL,
    fingerprint TEXT,
    promoted INTEGER NOT NULL DEFAULT 0,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_grammar_baselines_captured ON grammar_baselines(captured_at);
";

// ═══════════════════════════════════════════════════════════════
// User scope schema
// ═══════════════════════════════════════════════════════════════

/// Schema for the user-scoped relational store.
///
/// Contains all user-owned data: identity, preferences, projects,
/// sessions, conversation history, memory corrections, learnings,
/// grammar preferences, and per-project grammar schemas/bindings.
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
    hardware_profile TEXT,
    onboarding_complete INTEGER DEFAULT 0,
    expertise_level INTEGER,
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

-- Grammar / constrained decoding preferences (devtools + UX toggles)
CREATE TABLE IF NOT EXISTS grammar_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    devtool_json TEXT,
    strictness TEXT DEFAULT 'balanced',
    updated_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_grammar_prefs_user ON grammar_preferences(user_id);

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
    constitution TEXT,                       -- JSON object from .userdata/constitution.md
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

-- Per-project reference directories.
--
-- The user has exactly ONE active project at a time; references are
-- read-only directories linked to that project for context, search,
-- and RAG indexing. `path` is the absolute filesystem path; `kind`
-- distinguishes the intent ('docs' | 'source' | 'examples' | 'other')
-- so the indexer can bias its scan strategy per kind. `label` is a
-- human-readable tag for the devtool UI. `path` is NOT globally
-- unique — two projects may reference the same directory.
CREATE TABLE IF NOT EXISTS project_references (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    label TEXT,
    kind TEXT NOT NULL DEFAULT 'other',
    created_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(project_id, path)
);
CREATE INDEX IF NOT EXISTS idx_project_references_project ON project_references(project_id);

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

-- Per-project grammar definitions (schemas live in user DB; rows are project-owned)
CREATE TABLE IF NOT EXISTS grammar_schemas (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dialect TEXT NOT NULL DEFAULT 'json_schema',
    body TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(project_id, name)
);
CREATE INDEX IF NOT EXISTS idx_grammar_schemas_project ON grammar_schemas(project_id);

-- Bind schemas to inference lanes / roles within a project
CREATE TABLE IF NOT EXISTS grammar_bindings (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    schema_id TEXT NOT NULL REFERENCES grammar_schemas(id) ON DELETE CASCADE,
    lane TEXT NOT NULL,
    enforcement TEXT NOT NULL DEFAULT 'soft',
    priority INTEGER NOT NULL DEFAULT 50,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(project_id, lane, schema_id)
);
CREATE INDEX IF NOT EXISTS idx_grammar_bindings_project ON grammar_bindings(project_id);
CREATE INDEX IF NOT EXISTS idx_grammar_bindings_schema ON grammar_bindings(schema_id);

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

-- Agent threads: a session held with one of your agents (plan 0001 B3.3)
CREATE TABLE IF NOT EXISTS agent_threads (
    session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL,               -- registry id: claude-code, codex, …
    resume_token TEXT,                       -- the agent's own id that continues it
    created_at INTEGER DEFAULT (unixepoch())
);

-- Rooms: a chat session whose seats your agents hold (plan 0001 B4.2)
CREATE TABLE IF NOT EXISTS room_threads (
    session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,                   -- library room: council, debate, …
    seating TEXT NOT NULL,                   -- JSON [{seat, place, provider, persona}]
    resume_tokens TEXT,                      -- JSON {place: the agent's own id that continues it}
    created_at INTEGER DEFAULT (unixepoch())
);

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
    times_used_by_clyffy INTEGER DEFAULT 0,
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

-- ── Decisions & Continuity ──────────────────────────────────

-- Architectural/design decisions made during sessions
CREATE TABLE IF NOT EXISTS decisions (
    id              TEXT PRIMARY KEY,
    session_id      TEXT REFERENCES sessions(id),
    project_id      TEXT REFERENCES projects(id),
    decision_text   TEXT NOT NULL,
    rationale       TEXT,
    decided_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    status          TEXT DEFAULT 'active',       -- active | superseded | reverted
    superseded_by   TEXT REFERENCES decisions(id),
    tags            TEXT                          -- JSON array: ['architecture', 'model', 'stack']
);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);

-- What influenced each decision
CREATE TABLE IF NOT EXISTS decision_factors (
    id              TEXT PRIMARY KEY,
    decision_id     TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    factor_type     TEXT NOT NULL,               -- constraint | preference | research | experience
    factor_text     TEXT NOT NULL,
    weight          REAL DEFAULT 1.0
);
CREATE INDEX IF NOT EXISTS idx_decision_factors_decision ON decision_factors(decision_id);

-- Vibe-speak to engineer-speak mappings (translation cache)
CREATE TABLE IF NOT EXISTS translation_memory (
    id              TEXT PRIMARY KEY,
    vibe_input      TEXT NOT NULL,
    translated      TEXT NOT NULL,
    project_id      TEXT REFERENCES projects(id),
    confidence      REAL DEFAULT 1.0,
    times_used      INTEGER DEFAULT 1,
    last_used       INTEGER NOT NULL DEFAULT (unixepoch()),
    created_at      INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_translation_vibe ON translation_memory(vibe_input);

-- ── Attunement ──────────────────────────────────────────────

-- Understanding of user behavior preferences
CREATE TABLE IF NOT EXISTS attunement_preferences (
    id              TEXT PRIMARY KEY,
    preference_key  TEXT NOT NULL UNIQUE,        -- verbosity | explanation_depth | humor_tolerance
    preference_val  TEXT NOT NULL,
    learned_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    source          TEXT DEFAULT 'observed'       -- observed | explicit | inferred
);

-- Specific behavioral patterns detected
CREATE TABLE IF NOT EXISTS attunement_learned (
    id              TEXT PRIMARY KEY,
    pattern_type    TEXT NOT NULL,               -- frustration_trigger | flow_indicator | preference
    pattern_data    TEXT NOT NULL,               -- JSON: the learned pattern
    confidence      REAL DEFAULT 0.5,
    observations    INTEGER DEFAULT 1,
    first_seen      INTEGER NOT NULL DEFAULT (unixepoch()),
    last_seen       INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_attunement_pattern ON attunement_learned(pattern_type);

-- ── Model & Hardware ────────────────────────────────────────

-- Installed/available models and their slot assignments
CREATE TABLE IF NOT EXISTS model_registry (
    id              TEXT PRIMARY KEY,
    slot_name       TEXT NOT NULL,               -- chat.brain | minion.shared | rag.embedder etc.
    model_name      TEXT NOT NULL,
    model_path      TEXT NOT NULL,
    format          TEXT NOT NULL,               -- safetensors | gguf
    backend         TEXT NOT NULL,               -- candle | llama_cpp
    size_bytes      INTEGER,
    vram_required   INTEGER,                     -- estimated VRAM in MB
    is_active       INTEGER DEFAULT 0,
    loading_state   TEXT DEFAULT 'cold',         -- hot | standby | warm | cold
    registered_at   INTEGER NOT NULL DEFAULT (unixepoch()),
    last_loaded     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_models_slot ON model_registry(slot_name, is_active);

-- ── Internal / Dogfooding ───────────────────────────────────

-- Raw observations during dogfooding (dev builds only)
CREATE TABLE IF NOT EXISTS _internal_captures (
    id              TEXT PRIMARY KEY,
    session_id      TEXT REFERENCES sessions(id),
    captured_at     INTEGER NOT NULL DEFAULT (unixepoch()),
    capture_type    TEXT NOT NULL,               -- bug | friction | delight | idea | regression
    description     TEXT NOT NULL,
    severity        INTEGER DEFAULT 5,           -- 1-10
    component       TEXT,                        -- ui | model | retrieval | etc.
    resolved        INTEGER DEFAULT 0,
    resolution_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_captures_type ON _internal_captures(capture_type);

-- A/B test and experiment tracking
CREATE TABLE IF NOT EXISTS _internal_experiments (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    description     TEXT,
    started_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    ended_at        INTEGER,
    status          TEXT DEFAULT 'active',       -- active | concluded | abandoned
    hypothesis      TEXT,
    conclusion      TEXT,
    variant_a       TEXT NOT NULL,               -- JSON: config for variant A
    variant_b       TEXT NOT NULL                -- JSON: config for variant B
);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON _internal_experiments(status);

-- ── Knowledge library ─────────────────────────────────────────
-- Entries synced from JSON artifacts on boot. knowledge_seen persists
-- across content updates so cooldowns survive version bumps.

CREATE TABLE IF NOT EXISTS knowledge_entries (
    id              TEXT PRIMARY KEY NOT NULL,
    type            TEXT NOT NULL,
    tool            TEXT,
    category        TEXT NOT NULL,
    tier            TEXT NOT NULL,
    payload_json    TEXT NOT NULL,
    tags_csv        TEXT NOT NULL,
    added           TEXT NOT NULL,
    content_hash    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_knowledge_type ON knowledge_entries(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_tool ON knowledge_entries(tool);
CREATE INDEX IF NOT EXISTS idx_knowledge_tier ON knowledge_entries(tier);

CREATE TABLE IF NOT EXISTS knowledge_seen (
    entry_id        TEXT NOT NULL,
    user_id         TEXT NOT NULL,
    first_shown_at  INTEGER NOT NULL,
    last_shown_at   INTEGER NOT NULL,
    shown_count     INTEGER NOT NULL DEFAULT 1,
    reaction        TEXT,
    PRIMARY KEY (entry_id, user_id),
    FOREIGN KEY (entry_id) REFERENCES knowledge_entries(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_seen_user_time ON knowledge_seen(user_id, last_shown_at);

CREATE TABLE IF NOT EXISTS knowledge_config (
    user_id         TEXT PRIMARY KEY NOT NULL,
    config_json     TEXT NOT NULL,
    updated_at      INTEGER NOT NULL
);

-- ── Vision Pipeline Frames ─────────────────────────────────────

-- One row per captured frame the pipeline lands. Composite sink
-- writes to disk + Turso + DuckDB; this table is the Turso half.
-- `sink_path` mirrors the disk-sink path for that frame so a query
-- here can locate the on-disk PNG; empty when disk sink is configured
-- out. `embedding_csv` is a comma-separated f32 list (Turso has BLOB
-- support but the SqlAdapter trait carries `&[&str]` params, and CSV
-- round-trips cleanly).
CREATE TABLE IF NOT EXISTS vision_frames (
    session_id        TEXT NOT NULL,
    frame_id          INTEGER NOT NULL,
    captured_at_ms    INTEGER NOT NULL,
    source_kind       TEXT NOT NULL,         -- 'monitor' | 'window' | 'webcam'
    source_id         INTEGER NOT NULL,
    width             INTEGER NOT NULL,
    height            INTEGER NOT NULL,
    sink_path         TEXT NOT NULL,         -- empty when disk sink not paired
    embedding_csv     TEXT NOT NULL,         -- empty when capture-only
    PRIMARY KEY (session_id, frame_id)
);
CREATE INDEX IF NOT EXISTS idx_vision_frames_time
    ON vision_frames(session_id, captured_at_ms);

-- ── Community feed cache ─────────────────────────────────────
-- Local mirror of remote community content (announcements, knowledge
-- contributions, activity highlights). Lets the Latest tab + Community
-- page render offline; the desktop Tauri command refreshes from the
-- configured endpoint on a schedule and upserts here. payload_json
-- stays VARCHAR/TEXT (NOT a native JSON column) for cross-DB consistency
-- with the DuckDB heap-corruption ground rule documented at
-- `kernel/.../duckdb/diagnostics.rs`.

CREATE TABLE IF NOT EXISTS community_feed (
    id              TEXT PRIMARY KEY NOT NULL,
    kind            TEXT NOT NULL,
    title           TEXT,
    body            TEXT,
    actor           TEXT,
    created_at      INTEGER NOT NULL,
    synced_at       INTEGER NOT NULL,
    url             TEXT,
    payload_json    TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_feed_kind_created
    ON community_feed(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_synced
    ON community_feed(synced_at);

CREATE TABLE IF NOT EXISTS community_config (
    user_id         TEXT PRIMARY KEY NOT NULL,
    last_sync_at    INTEGER NOT NULL DEFAULT 0,
    enabled         INTEGER NOT NULL DEFAULT 1,
    endpoint        TEXT
);
";

// ═══════════════════════════════════════════════════════════════
// Project scope schema
// ═══════════════════════════════════════════════════════════════

/// Schema for per-project relational stores.
///
/// Each managed project gets its own `project.db` at
/// `{project_root}/.userdata/project.db`. Contains RAG data,
/// file index, chunks, signals, codebase patterns, conventions,
/// and anti-drift enforcement log.
pub const PROJECT_SCHEMA: &str = r"
-- Key-value store for project-scoped signal access
CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value BLOB NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_kv_updated ON kv_store(updated_at);

-- ── Project Meta ────────────────────────────────────────────

-- Project-level configuration and state (seeded during project add)
CREATE TABLE IF NOT EXISTS project_meta (
    key             TEXT PRIMARY KEY,
    value           TEXT NOT NULL,
    updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ── File Index & RAG ────────────────────────────────────────

-- File tracking for delta re-indexing
CREATE TABLE IF NOT EXISTS indexed_files (
    id              TEXT PRIMARY KEY,
    file_path       TEXT NOT NULL UNIQUE,        -- relative to project root
    file_hash       TEXT NOT NULL,               -- blake3 hash for change detection
    file_size       INTEGER NOT NULL,
    language        TEXT,                        -- rust | svelte | typescript | toml | etc.
    chunk_count     INTEGER DEFAULT 0,
    indexed_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    last_modified   INTEGER NOT NULL,
    is_excluded     INTEGER DEFAULT 0            -- manually excluded from indexing
);
CREATE INDEX IF NOT EXISTS idx_files_path ON indexed_files(file_path);
CREATE INDEX IF NOT EXISTS idx_files_hash ON indexed_files(file_hash);

-- RAG chunks for retrieval
CREATE TABLE IF NOT EXISTS chunks (
    id              TEXT PRIMARY KEY,
    file_id         TEXT NOT NULL REFERENCES indexed_files(id) ON DELETE CASCADE,
    chunk_index     INTEGER NOT NULL,            -- order within file
    content         TEXT NOT NULL,
    start_line      INTEGER,
    end_line        INTEGER,
    chunk_type      TEXT DEFAULT 'code',         -- code | comment | doc | config | mixed
    symbol_name     TEXT,                        -- function/struct/enum name if applicable
    symbol_type     TEXT,                        -- function | struct | enum | impl | module
    embedding_id    TEXT,                        -- reference to RRO/vector point ID
    created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_chunks_file ON chunks(file_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_symbol ON chunks(symbol_name);

-- ── Signals ─────────────────────────────────────────────────

-- Project-level signal log
CREATE TABLE IF NOT EXISTS signals (
    id              TEXT PRIMARY KEY,
    signal_kind     TEXT NOT NULL,               -- matches SignalKind enum
    payload         TEXT,                        -- JSON: signal-specific data
    source          TEXT NOT NULL,               -- file_watcher | process_monitor | user | council
    created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    processed       INTEGER DEFAULT 0,
    processed_by    TEXT,                        -- council member that handled it
    visibility      TEXT DEFAULT 'internal'      -- internal | narrated | public | debug
);
CREATE INDEX IF NOT EXISTS idx_signals_kind ON signals(signal_kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_unprocessed ON signals(processed) WHERE processed = 0;

-- ── Codebase Patterns & Conventions ─────────────────────────

-- Detected patterns in this project
CREATE TABLE IF NOT EXISTS codebase_patterns (
    id              TEXT PRIMARY KEY,
    pattern_type    TEXT NOT NULL,               -- file_structure | naming | import | error_handling
    pattern_desc    TEXT NOT NULL,
    example_file    TEXT,
    example_snippet TEXT,
    confidence      REAL DEFAULT 0.5,
    detected_at     INTEGER NOT NULL DEFAULT (unixepoch()),
    is_enforced     INTEGER DEFAULT 0            -- 1 = violations get blocked
);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON codebase_patterns(pattern_type);

-- Explicit conventions (user-declared or AI-detected)
CREATE TABLE IF NOT EXISTS project_conventions (
    id              TEXT PRIMARY KEY,
    convention_type TEXT NOT NULL,               -- folder_structure | naming | testing | architecture
    rule            TEXT NOT NULL,
    source          TEXT DEFAULT 'detected',     -- detected | user_declared | tool_default
    tool_target     TEXT,                        -- which AI tool this convention feeds
    created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    is_active       INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_conventions_type ON project_conventions(convention_type);

-- ── Anti-Drift Enforcement ──────────────────────────────────

-- Guardian's enforcement log
CREATE TABLE IF NOT EXISTS anti_drift_log (
    id              TEXT PRIMARY KEY,
    session_id      TEXT,                        -- cross-ref UUID from user DB
    violation_type  TEXT NOT NULL,               -- duplicate_gen | out_of_bounds | delete_existing | todo_abandoned
    description     TEXT NOT NULL,
    file_affected   TEXT,
    blocked         INTEGER DEFAULT 1,           -- 1 = blocked, 0 = warning only
    created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_drift_type ON anti_drift_log(violation_type);
";
