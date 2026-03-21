//! Analytics service wrapper (`DuckDB`).
//!
//! Scoped schemas:
//! - **System**: LLM call telemetry, ROTI metrics, layer budgets,
//!   interaction timing, governance violations, daily aggregates.

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::DuckDbAdapter;
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
";
