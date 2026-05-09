//! Analytics service wrapper (`DuckDB`).
//!
//! Two scoped instances (one DuckDB file each, OLAP-optimized):
//!
//! - **System scope (Clyffy analytics)** — what the AI did. LLM call
//!   telemetry, layer budgets, governance, retrieval/lane/span traces,
//!   council performance, vision pipeline metrics, platform resource
//!   snapshots. Schema: [`SYSTEM_ANALYTICS_SCHEMA`].
//! - **User scope (user/project analytics)** — what the user did /
//!   experienced. ROTI, perceived turn timing, daily rollups, token
//!   economics, mood timeline, teaching moments. Schema:
//!   [`USER_ANALYTICS_SCHEMA`].
//!
//! Same wrapper struct, different files + schemas. Lane / span trace
//! writers target the system scope; ROTI / mood / teaching writers
//! target the user scope.

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_clyffy::cortex::persistence::DuckDbAdapter;
use std::path::Path;
use std::sync::Arc;

/// Analytics store backed by `DuckDB`.
pub struct AnalyticsService {
    adapter: Arc<DuckDbAdapter>,
    /// Scoped name for health checks (e.g., "System analytics").
    label: &'static str,
}

impl AnalyticsService {
    /// Boot the analytics store with a scope-specific schema.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub fn boot(path: &Path, schema: &str, label: &'static str) -> Result<Self> {
        let adapter = DuckDbAdapter::open_with_schema(path, schema)?;
        Ok(Self {
            adapter: Arc::new(adapter),
            label,
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<DuckDbAdapter> {
        &self.adapter
    }
}

impl Service for AnalyticsService {
    fn name(&self) -> &'static str {
        self.label
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Analytics
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        tracing::info!(service = self.label, "Shutting down DuckDB service");
        self.adapter.close().await;
        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════
// System scope schema — Clyffy analytics (what the AI did)
// ═══════════════════════════════════════════════════════════════

/// Schema for the system-scoped analytics store ("Clyffy analytics").
///
/// AI behavior + infrastructure telemetry: LLM call tracking, layer
/// budget enforcement, governance, retrieval / lane / span traces,
/// council performance, vision pipeline metrics, platform resource
/// snapshots. User-perceived metrics live in [`USER_ANALYTICS_SCHEMA`].
/// Optimized for OLAP queries (`DuckDB` columnar storage).
pub const SYSTEM_ANALYTICS_SCHEMA: &str = r"
-- Key-value store for signal-based access
CREATE TABLE IF NOT EXISTS kv_store (
    key VARCHAR PRIMARY KEY,
    value BLOB NOT NULL,
    updated_at TIMESTAMP DEFAULT now()
);

-- ── LLM Call Telemetry ─────────────────────────────────────────

-- Every model call with full telemetry
CREATE TABLE IF NOT EXISTS model_calls (
    id VARCHAR NOT NULL,
    session_id VARCHAR,
    project_id VARCHAR,
    model VARCHAR NOT NULL,
    adapter VARCHAR NOT NULL,              -- anthropic | openai | local | etc.
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    ttft_ms INTEGER,                       -- time to first token
    tokens_per_second DOUBLE,
    finish_reason VARCHAR,                 -- stop | length | tool_use | error
    cache_hit BOOLEAN DEFAULT FALSE,
    estimated_cost_usd DOUBLE DEFAULT 0.0,
    error_message VARCHAR,
    metadata VARCHAR,                      -- JSON-encoded text; queried via json_extract(metadata, '$.field').
                                           -- Native JSON column type triggers heap corruption when DuckDB is
                                           -- initialized in a process holding heavy native libs (candle/llama-cpp/ort).
    created_at TIMESTAMP DEFAULT now()
);

-- ── Layer Metrics ──────────────────────────────────────────────

-- Per-layer token budget tracking
CREATE TABLE IF NOT EXISTS layer_metrics (
    id VARCHAR NOT NULL,
    session_id VARCHAR NOT NULL,
    layer VARCHAR NOT NULL,                -- context | reasoning | generation | reflection
    tokens_used INTEGER NOT NULL,
    token_budget INTEGER NOT NULL,
    budget_utilization DOUBLE NOT NULL,     -- tokens_used / token_budget
    overage INTEGER DEFAULT 0,
    latency_ms INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- ── Governance ─────────────────────────────────────────────────

-- Policy violations and guardrail triggers
CREATE TABLE IF NOT EXISTS governance_violations (
    id VARCHAR NOT NULL,
    session_id VARCHAR,
    project_id VARCHAR,
    violation_type VARCHAR NOT NULL,       -- token_limit | content_filter | cost_cap | rate_limit
    severity VARCHAR NOT NULL DEFAULT 'warning', -- info | warning | critical
    description VARCHAR NOT NULL,
    action_taken VARCHAR NOT NULL,         -- blocked | warned | throttled | logged
    metadata VARCHAR,                      -- JSON-encoded text (see model_calls.metadata for rationale).
    created_at TIMESTAMP DEFAULT now()
);

-- ── Signal Processing ──────────────────────────────────────────

-- Signal processing metrics (retained from core schema)
CREATE TABLE IF NOT EXISTS signal_metrics (
    id VARCHAR NOT NULL,
    signal_kind VARCHAR NOT NULL,
    processing_tier VARCHAR NOT NULL,      -- hot | warm | cold
    latency_ms INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- ── Lane Traces ───────────────────────────────────────────────

-- Per-execution-lane trace spans for inference pipeline instrumentation.
-- Written by the LaneTraceWriter background task in batches.
CREATE TABLE IF NOT EXISTS lane_traces (
    lane              VARCHAR NOT NULL,
    device_category   VARCHAR NOT NULL,
    duration_us       BIGINT NOT NULL,
    cache_hit         BOOLEAN DEFAULT FALSE,
    cold_start        BOOLEAN DEFAULT FALSE,
    queue_wait_us     BIGINT DEFAULT 0,
    input_size        BIGINT DEFAULT 0,
    output_size       BIGINT DEFAULT 0,
    model_id          VARCHAR,
    slot_id           VARCHAR,
    created_at        TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lane_traces_lane
    ON lane_traces(lane, created_at);

-- Computed baseline percentiles per lane.
-- Populated by analytical queries, not the writer.
CREATE TABLE IF NOT EXISTS lane_baselines (
    lane              VARCHAR NOT NULL,
    sample_count      INTEGER NOT NULL,
    p50_us            BIGINT NOT NULL,
    p95_us            BIGINT NOT NULL,
    p99_us            BIGINT NOT NULL,
    avg_queue_wait_us BIGINT DEFAULT 0,
    cache_hit_rate    DOUBLE DEFAULT 0.0,
    cold_start_rate   DOUBLE DEFAULT 0.0,
    computed_at       TIMESTAMP DEFAULT now(),
    PRIMARY KEY (lane)
);

-- ── Span Traces ──────────────────────────────────────────────

-- Distributed tracing spans from the tracing::Layer subscriber.
-- Written by SpanTraceWriter background task in batches.
-- Correlates with lane_traces via trace_id for end-to-end request trees.
CREATE TABLE IF NOT EXISTS span_traces (
    trace_id          VARCHAR NOT NULL,
    span_id           BIGINT NOT NULL,
    parent_span_id    BIGINT,
    name              VARCHAR NOT NULL,
    target            VARCHAR NOT NULL,
    level             VARCHAR NOT NULL,
    duration_us       BIGINT NOT NULL,
    fields_json       VARCHAR,                -- JSON-encoded span fields (see model_calls.metadata).
    created_at        TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_span_traces_trace
    ON span_traces(trace_id, created_at);

CREATE INDEX IF NOT EXISTS idx_span_traces_name
    ON span_traces(name, created_at);

-- ── Council Performance ───────────────────────────────────────

-- Per-session performance metrics for council members
CREATE TABLE IF NOT EXISTS council_performance (
    id                  VARCHAR NOT NULL,
    council_member      VARCHAR NOT NULL,
    session_id          VARCHAR NOT NULL,
    recorded_at         TIMESTAMP DEFAULT now(),
    activations         INTEGER,
    avg_latency_ms      DOUBLE,
    tasks_completed     INTEGER,
    tasks_failed        INTEGER,
    user_overrides      INTEGER,                 -- how often user rejected council output
    translation_accuracy DOUBLE,
    mood_detection_accuracy DOUBLE,
    context_recall_rate DOUBLE,
    pattern_match_rate  DOUBLE
);

-- ── Retrieval Metrics ─────────────────────────────────────────

-- RAG pipeline performance per query
CREATE TABLE IF NOT EXISTS retrieval_metrics (
    id                  VARCHAR NOT NULL,
    query_id            VARCHAR NOT NULL,
    session_id          VARCHAR NOT NULL,
    recorded_at         TIMESTAMP DEFAULT now(),
    embed_time_ms       INTEGER,
    search_time_ms      INTEGER,
    rerank_time_ms      INTEGER,
    total_retrieval_ms  INTEGER,
    candidates_found    INTEGER,
    candidates_reranked INTEGER,
    final_context_chunks INTEGER,
    cache_hit           BOOLEAN,
    complexity_score    DOUBLE,
    routing_path        VARCHAR,                 -- fast | fused | deep
    relevance_rating    INTEGER                  -- 1-5, NULL if not rated
);

-- ── Agent Workflow Tracking ───────────────────────────────────

-- SDLC lifecycle phase tracking
CREATE TABLE IF NOT EXISTS agent_workflow_tracking (
    id                  VARCHAR NOT NULL,
    session_id          VARCHAR NOT NULL,
    project_id          VARCHAR NOT NULL,
    recorded_at         TIMESTAMP DEFAULT now(),
    phase               VARCHAR NOT NULL,        -- intake | specification | architecture | decomposition | implementation | verification
    phase_status        VARCHAR NOT NULL,        -- entered | gate_passed | gate_failed | skipped | rolled_back
    artifact_type       VARCHAR,
    artifact_id         VARCHAR,
    gate_checks_run     INTEGER,
    gate_checks_passed  INTEGER,
    critic_verdict      VARCHAR,                 -- pass | fail | skip
    critic_explanation  VARCHAR,
    iteration_count     INTEGER DEFAULT 1,
    phase_duration_ms   INTEGER,
    time_in_elicitation_ms INTEGER,
    time_in_generation_ms INTEGER,
    time_in_validation_ms INTEGER
);

-- ── COSTAR Satisfaction ───────────────────────────────────────

-- Track COSTAR+ completeness across interactions
CREATE TABLE IF NOT EXISTS costar_satisfaction (
    id                  VARCHAR NOT NULL,
    turn_id             VARCHAR NOT NULL,
    session_id          VARCHAR NOT NULL,
    recorded_at         TIMESTAMP DEFAULT now(),
    context_score       DOUBLE,
    objective_score     DOUBLE,
    style_score         DOUBLE,
    tone_score          DOUBLE,
    audience_score      DOUBLE,
    response_score      DOUBLE,
    instance_context_score DOUBLE,
    overall_score       DOUBLE,
    satisfied           BOOLEAN,
    gaps_from_input     INTEGER,
    gaps_from_diary     INTEGER,
    gaps_from_repo      INTEGER,
    gaps_from_elicitation INTEGER,
    gaps_unfilled       INTEGER
);

-- ── Platform Telemetry ────────────────────────────────────────

-- System health and resource utilization snapshots
CREATE TABLE IF NOT EXISTS platform_telemetry (
    id                  VARCHAR NOT NULL,
    recorded_at         TIMESTAMP DEFAULT now(),
    gpu_util_pct        DOUBLE,
    vram_used_mb        INTEGER,
    ram_used_mb         INTEGER,
    cpu_util_pct        DOUBLE,
    model_states        VARCHAR,                 -- JSON-encoded { 'chat.brain': 'hot', 'minion.shared': 'standby', ... }
    p50_response_ms     INTEGER,
    p95_response_ms     INTEGER,
    p99_response_ms     INTEGER,
    error_count         INTEGER DEFAULT 0,
    error_types         VARCHAR                  -- JSON-encoded { 'inference_timeout': 2, 'oom': 0, ... }
);

-- ── Vision Pipeline ───────────────────────────────────────────

-- Per-frame end-to-end telemetry from the capture → encode → sink chain.
-- Written by the vision pipeline (V-4) in batches; drives the Metrics
-- tab in /devtools/vision. One row per completed frame, regardless of
-- whether the governor throttled the tick or let it through.
CREATE TABLE IF NOT EXISTS vision_frame_metrics (
    session_id         VARCHAR NOT NULL,
    frame_id           BIGINT  NOT NULL,
    ts_ms              BIGINT  NOT NULL,
    source_kind        VARCHAR NOT NULL,        -- 'monitor' | 'window' | 'webcam'
    source_idx         INTEGER NOT NULL,
    capture_ms         FLOAT   NOT NULL,
    encode_ms          FLOAT   NOT NULL,
    sink_ms            FLOAT   NOT NULL,
    total_ms           FLOAT   NOT NULL,
    frame_bytes        INTEGER NOT NULL,
    embedding_dim      INTEGER NOT NULL,
    embedding_norm     FLOAT   NOT NULL,
    similarity_to_prev FLOAT,                   -- NULL on session's first frame
    cpu_pct            FLOAT   NOT NULL,
    rss_mb             INTEGER NOT NULL,
    governor_throttled BOOLEAN NOT NULL,
    hd_path            VARCHAR NOT NULL,        -- 'siglip1-candle' | 'siglip2-ort' | 'siglip1-tiled'
    sink_list          VARCHAR NOT NULL,        -- comma-sep; e.g. 'disk,libsql,duckdb'
    created_at         TIMESTAMP DEFAULT now(),
    PRIMARY KEY (session_id, frame_id)
);

-- Per-tick governor decisions for throttle-rate charts + post-mortem.
-- One row per transition (throttle/recover), not per sample — the rest
-- of the samples are implicit between transitions.
CREATE TABLE IF NOT EXISTS vision_governor_ticks (
    ts_ms              BIGINT  NOT NULL,
    throttled          BOOLEAN NOT NULL,
    reason             VARCHAR,                 -- 'cpu' | 'ram' | 'event-bridge-qps' | 'manual-pause' | NULL
    cpu_pct            FLOAT   NOT NULL,
    rss_mb             INTEGER NOT NULL,
    event_qps          FLOAT   NOT NULL,
    created_at         TIMESTAMP DEFAULT now()
);

-- Embedding-only sink target. The DuckDbEmbeddingSink (V-4) appends
-- one row per frame whose embedding is present (capture-only sessions
-- do not pollute this table). Designed for the Metrics tab's ad-hoc
-- rollups: 'how many frames did session X produce?', 'what's the
-- distribution of embedding norms over the last hour?'.
CREATE TABLE IF NOT EXISTS vision_embeddings (
    session_id         VARCHAR NOT NULL,
    frame_id           BIGINT  NOT NULL,
    captured_at_ms     BIGINT  NOT NULL,
    embedding_dim      INTEGER NOT NULL,
    embedding          DOUBLE[] NOT NULL,        -- DuckDB native list type
    created_at         TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vision_embeddings_session
    ON vision_embeddings(session_id, captured_at_ms);
";

// ═══════════════════════════════════════════════════════════════
// User scope schema — User / project analytics (what the user did)
// ═══════════════════════════════════════════════════════════════

/// Schema for the user-scoped analytics store.
///
/// User-perceived metrics: time invested, perceived turn timing,
/// daily rollups for the dashboard widgets, token economics
/// (cost vs lines kept), mood trajectory, teaching moments. Boots
/// alongside `user/libsql/user.db` so user/project data lives in
/// one user-scope folder.
///
/// Lives on a separate DuckDB file from [`SYSTEM_ANALYTICS_SCHEMA`]
/// so the user data can be backed up / wiped independently of the
/// AI behavior telemetry.
pub const USER_ANALYTICS_SCHEMA: &str = r"
-- Key-value store for user-scope signal access
CREATE TABLE IF NOT EXISTS kv_store (
    key VARCHAR PRIMARY KEY,
    value BLOB NOT NULL,
    updated_at TIMESTAMP DEFAULT now()
);

-- ── ROTI Metrics ───────────────────────────────────────────────

-- Return On Time Invested — signature DevPulse metric
CREATE TABLE IF NOT EXISTS roti_metrics (
    id VARCHAR NOT NULL,
    session_id VARCHAR NOT NULL,
    project_id VARCHAR,
    user_time_invested_secs INTEGER NOT NULL,
    ai_time_saved_secs INTEGER NOT NULL,
    roti_ratio DOUBLE NOT NULL,            -- ai_saved / user_invested
    task_category VARCHAR,                 -- code_gen | debug | refactor | explain | etc.
    quality_score DOUBLE,                  -- 0.0-1.0 subjective quality
    created_at TIMESTAMP DEFAULT now()
);

-- ── Interaction Metrics ────────────────────────────────────────

-- Per-turn timing breakdown — user-perceived wait
CREATE TABLE IF NOT EXISTS interaction_metrics (
    id VARCHAR NOT NULL,
    turn_id VARCHAR NOT NULL,
    session_id VARCHAR NOT NULL,
    context_assembly_ms INTEGER,
    reasoning_ms INTEGER,
    generation_ms INTEGER,
    tool_call_ms INTEGER,
    total_latency_ms INTEGER NOT NULL,
    user_wait_ms INTEGER,                  -- perceived wait from user perspective
    created_at TIMESTAMP DEFAULT now()
);

-- ── Daily Aggregates ───────────────────────────────────────────

-- Pre-computed daily stats for dashboard widgets
CREATE TABLE IF NOT EXISTS daily_stats (
    date DATE PRIMARY KEY,
    total_model_calls INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_prompt_tokens INTEGER DEFAULT 0,
    total_completion_tokens INTEGER DEFAULT 0,
    total_cost_usd DOUBLE DEFAULT 0.0,
    avg_latency_ms DOUBLE DEFAULT 0,
    avg_roti_ratio DOUBLE DEFAULT 0,
    cache_hit_rate DOUBLE DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    governance_violations INTEGER DEFAULT 0
);

-- ── Token Economics ───────────────────────────────────────────

-- Track token spend vs value delivered to the user
CREATE TABLE IF NOT EXISTS token_economics (
    id                  VARCHAR NOT NULL,
    session_id          VARCHAR NOT NULL,
    recorded_at         TIMESTAMP DEFAULT now(),
    input_tokens        INTEGER,
    output_tokens       INTEGER,
    thinking_tokens     INTEGER,
    embedding_tokens    INTEGER,
    total_tokens        INTEGER,
    estimated_cost_usd  DOUBLE,
    inference_time_ms   INTEGER,
    model_slot          VARCHAR,
    loading_state       VARCHAR,                 -- what state was the model in when called?
    tokens_per_useful_line DOUBLE,               -- total_tokens / lines_user_kept
    cache_hit_rate      DOUBLE                   -- Moka hit rate for this session
);

-- ── Mood Timeline ─────────────────────────────────────────────

-- Mood tracking over time for trend analysis
CREATE TABLE IF NOT EXISTS mood_timeline (
    id                  VARCHAR NOT NULL,
    session_id          VARCHAR NOT NULL,
    recorded_at         TIMESTAMP DEFAULT now(),
    mood_score          DOUBLE NOT NULL,         -- -1.0 (heavy negative) to +1.0 (heavy positive)
    mood_signals        VARCHAR,                 -- JSON-encoded ['caps', 'profanity', 'short_responses']
    mood_category       VARCHAR,                 -- frustrated | neutral | engaged | flow
    trigger_turn_id     VARCHAR,
    psych_action        VARCHAR,                 -- acknowledged | adjusted_tone | offered_break | none
    action_effective    BOOLEAN
);

-- ── Teaching Moments ──────────────────────────────────────────

-- Education tracking for progressive skill building
CREATE TABLE IF NOT EXISTS teaching_moments (
    id                  VARCHAR NOT NULL,
    session_id          VARCHAR NOT NULL,
    recorded_at         TIMESTAMP DEFAULT now(),
    concept             VARCHAR NOT NULL,
    explanation_given   VARCHAR,
    context_trigger     VARCHAR,
    user_engaged        BOOLEAN,
    terminology_adopted BOOLEAN,
    user_level_before   VARCHAR,                 -- novice | aware | practicing | fluent
    user_level_after    VARCHAR
);
";

// ═══════════════════════════════════════════════════════════════
// Schema baseline tests — chunk-by-chunk visual report.
//
// Built on the reusable harness in
// `devpulse_clyffy::cortex::persistence::duckdb::diagnostics`. Each
// test produces streaming output of the form:
//
//   ── SCHEMA BISECT: SYSTEM_ANALYTICS_SCHEMA (17 chunks) ──
//   [01/17] table kv_store ........................ ✓   (412µs)
//   [02/17] table model_calls ..................... ✓   (286µs)
//   ...
//   ── 17/17 chunks loaded cleanly (8.4ms) ──
//
// The streaming property is load-bearing: stdout is flushed after
// every chunk so the last printed line names the chunk in flight if
// the process aborts (e.g. STATUS_HEAP_CORRUPTION on Windows).
//
// These are baseline tests — re-run anytime the schemas change to
// confirm every chunk still loads + the schema remains idempotent.
// ═══════════════════════════════════════════════════════════════

#[cfg(test)]
mod schema_baseline_tests {
    use super::{SYSTEM_ANALYTICS_SCHEMA, USER_ANALYTICS_SCHEMA};
    use devpulse_clyffy::cortex::persistence::duckdb::diagnostics::{
        assert_schema_idempotent, bisect_columns, bisect_schema, ColumnSpec,
    };

    // Tests are prefixed with `aNN_` / `bNN_` so the libtest harness's
    // alphabetical ordering produces a deterministic, top-down diagnostic
    // sequence: chunk-by-chunk baselines first (so visual output is in the
    // log even if a later test crashes the process), idempotency second.

    /// Baseline #1: every statement of `SYSTEM_ANALYTICS_SCHEMA` loads
    /// cleanly against a fresh DuckDB. Visual chunk-by-chunk report
    /// streamed to stdout — observe with `cargo test ... -- --nocapture`.
    #[test]
    fn a01_system_schema_loads_chunk_by_chunk() {
        let report = bisect_schema("SYSTEM_ANALYTICS_SCHEMA", SYSTEM_ANALYTICS_SCHEMA);
        report.assert_clean();
    }

    /// Baseline #2: every statement of `USER_ANALYTICS_SCHEMA` loads cleanly.
    #[test]
    fn a02_user_schema_loads_chunk_by_chunk() {
        let report = bisect_schema("USER_ANALYTICS_SCHEMA", USER_ANALYTICS_SCHEMA);
        report.assert_clean();
    }

    /// Idempotency guarantee: loading the schema twice on the same DB must
    /// be a no-op. Catches regressions where a future chunk drops the
    /// `IF NOT EXISTS` guard, which would crash boot on every restart
    /// against an existing data dir. Phase markers narrate `open` →
    /// `first load` → `second load` so a crash leaves a precise trail.
    #[test]
    fn b01_system_schema_is_idempotent() {
        assert_schema_idempotent("SYSTEM_ANALYTICS_SCHEMA", SYSTEM_ANALYTICS_SCHEMA)
            .expect("system schema must be idempotent");
    }

    /// Idempotency guarantee for the user-scope schema.
    #[test]
    fn b02_user_schema_is_idempotent() {
        assert_schema_idempotent("USER_ANALYTICS_SCHEMA", USER_ANALYTICS_SCHEMA)
            .expect("user schema must be idempotent");
    }

    /// Column-level baseline for `model_calls` (post-JSON-fix shape). All
    /// columns must accept individually against a fresh DuckDB under any
    /// feature loadout. Diagnostic baseline: if a future column is added
    /// to `model_calls` and starts crashing this test, the streaming
    /// report names exactly which column.
    #[test]
    fn c01_model_calls_columns_baseline() {
        let candidates = [
            ColumnSpec::new("session_id VARCHAR", "session_id VARCHAR"),
            ColumnSpec::new("project_id VARCHAR", "project_id VARCHAR"),
            ColumnSpec::new("model VARCHAR NOT NULL", "model VARCHAR NOT NULL"),
            ColumnSpec::new("adapter VARCHAR NOT NULL", "adapter VARCHAR NOT NULL"),
            ColumnSpec::new("prompt_tokens INTEGER NOT NULL", "prompt_tokens INTEGER NOT NULL"),
            ColumnSpec::new(
                "completion_tokens INTEGER NOT NULL",
                "completion_tokens INTEGER NOT NULL",
            ),
            ColumnSpec::new("total_tokens INTEGER NOT NULL", "total_tokens INTEGER NOT NULL"),
            ColumnSpec::new("latency_ms INTEGER NOT NULL", "latency_ms INTEGER NOT NULL"),
            ColumnSpec::new("ttft_ms INTEGER", "ttft_ms INTEGER"),
            ColumnSpec::new("tokens_per_second DOUBLE", "tokens_per_second DOUBLE"),
            ColumnSpec::new("finish_reason VARCHAR", "finish_reason VARCHAR"),
            ColumnSpec::new(
                "cache_hit BOOLEAN DEFAULT FALSE",
                "cache_hit BOOLEAN DEFAULT FALSE",
            ),
            ColumnSpec::new(
                "estimated_cost_usd DOUBLE DEFAULT 0.0",
                "estimated_cost_usd DOUBLE DEFAULT 0.0",
            ),
            ColumnSpec::new("error_message VARCHAR", "error_message VARCHAR"),
            ColumnSpec::new("metadata VARCHAR", "metadata VARCHAR"),
            ColumnSpec::new(
                "created_at TIMESTAMP DEFAULT now()",
                "created_at TIMESTAMP DEFAULT now()",
            ),
        ];
        let report = bisect_columns("model_calls columns", &candidates);
        report.assert_clean();
    }

    /// Regression detector for the **DuckDB JSON-extension heap-corruption
    /// quirk**.
    ///
    /// Discovery (2026-05-07): when `devpulse-engine` is compiled with the
    /// `rro,candle,inference` feature set (pulling candle BLAS, llama-cpp,
    /// mistralrs, ort), opening a DuckDB connection and creating a column
    /// of native type `JSON` aborts the process with
    /// `STATUS_HEAP_CORRUPTION (0xc0000374)` on Windows. The harness above
    /// pinpointed the offending construct at column granularity. The fix
    /// was to migrate every `JSON` column in the analytics schemas to
    /// `VARCHAR` (queried via `json_extract(varchar, '$.path')`), which
    /// is the canonical SQLite-compatible pattern.
    ///
    /// This test is `#[ignore]`'d by default — running it would crash the
    /// entire test process — but is kept on-tree as a *living regression
    /// detector*: re-run with `cargo test ... -- --ignored` after every
    /// duckdb-rs version bump or feature-set change. The day this test
    /// passes (no crash, just a SQL `Ok`) is the day we know upstream
    /// has resolved the JSON-extension allocator interaction and we can
    /// migrate back to native JSON columns if desired.
    #[test]
    #[ignore = "deliberately reproduces the DuckDB JSON heap-corruption quirk; run with --ignored after upstream fixes"]
    fn z01_json_column_known_crash_under_full_features() {
        let candidates = [ColumnSpec::new("metadata JSON", "metadata JSON")];
        let report = bisect_columns("JSON-extension regression probe", &candidates);
        report.assert_clean();
    }
}
