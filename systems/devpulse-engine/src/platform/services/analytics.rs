//! Analytics service wrapper (`DuckDB`).
//!
//! Scoped schemas:
//! - **System**: LLM call telemetry, ROTI metrics, layer budgets,
//!   interaction timing, governance violations, daily aggregates.

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
// System scope schema
// ═══════════════════════════════════════════════════════════════

/// Schema for the system-scoped analytics store.
///
/// Contains all platform telemetry — LLM call tracking, ROTI metrics,
/// layer budget enforcement, interaction timing, governance audit trail.
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
    metadata JSON,                         -- adapter-specific telemetry
    created_at TIMESTAMP DEFAULT now()
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

-- ── Interaction Metrics ────────────────────────────────────────

-- Per-turn timing breakdown
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
    metadata JSON,
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
    fields_json       JSON,
    created_at        TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_span_traces_trace
    ON span_traces(trace_id, created_at);

CREATE INDEX IF NOT EXISTS idx_span_traces_name
    ON span_traces(name, created_at);

-- ── Token Economics ───────────────────────────────────────────

-- Track token spend vs value delivered
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

-- ── Mood Timeline ─────────────────────────────────────────────

-- Mood tracking over time for trend analysis
CREATE TABLE IF NOT EXISTS mood_timeline (
    id                  VARCHAR NOT NULL,
    session_id          VARCHAR NOT NULL,
    recorded_at         TIMESTAMP DEFAULT now(),
    mood_score          DOUBLE NOT NULL,         -- -1.0 (heavy negative) to +1.0 (heavy positive)
    mood_signals        JSON,                    -- detected signals ['caps', 'profanity', 'short_responses']
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

-- ── Platform Telemetry ────────────────────────────────────────

-- System health and resource utilization snapshots
CREATE TABLE IF NOT EXISTS platform_telemetry (
    id                  VARCHAR NOT NULL,
    recorded_at         TIMESTAMP DEFAULT now(),
    gpu_util_pct        DOUBLE,
    vram_used_mb        INTEGER,
    ram_used_mb         INTEGER,
    cpu_util_pct        DOUBLE,
    model_states        JSON,                    -- { 'chat.brain': 'hot', 'minion.shared': 'standby', ... }
    p50_response_ms     INTEGER,
    p95_response_ms     INTEGER,
    p99_response_ms     INTEGER,
    error_count         INTEGER DEFAULT 0,
    error_types         JSON                     -- { 'inference_timeout': 2, 'oom': 0, ... }
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
