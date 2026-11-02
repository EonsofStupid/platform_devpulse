//! Lane tracing — per-execution-path instrumentation for the inference pipeline.
//!
//! ## Overview
//!
//! Every hardware execution path (lane) in the pipeline can be individually
//! toggled for tracing. Traces are written to `DuckDB` for baseline analysis,
//! regression detection, and A/B comparison (with/without thinking).
//!
//! ## Architecture
//!
//! ```text
//! Pipeline code
//!   → LaneTraceGuard::start() (RAII, zero cost if lane disabled)
//!   → guard.complete(metrics)
//!   → CompletedTrace sent via mpsc channel (non-blocking)
//!   → LaneTraceWriter background task
//!   → batched INSERT into DuckDB lane_traces table
//! ```
//!
//! ## Integration
//!
//! Lane traces feed three consumers:
//! 1. `tracing` crate spans → structured log output
//! 2. `DuckDB` `lane_traces` table → persistent baseline data
//! 3. Frontend via IPC → real-time telemetry dashboard

use std::sync::Arc;
use std::time::Instant;

use serde_json::json;
use tokio::sync::{RwLock, mpsc};

use devpulse_telemetry::spawn;

use crate::platform::config::{ExecutionLane, LaneTraceConfig};
use crate::platform::services::analytics::AnalyticsService;
use devpulse_clyffy::cortex::persistence::AnalyticsAdapter;

/// Channel buffer size for completed traces.
/// Backpressure: if buffer is full, traces are silently dropped.
const TRACE_CHANNEL_CAPACITY: usize = 256;

/// Maximum traces to batch before flushing to `DuckDB`.
const BATCH_SIZE: usize = 64;

/// Maximum time to hold a batch before flushing (milliseconds).
const BATCH_FLUSH_INTERVAL_MS: u64 = 500;

// ═══════════════════════════════════════════════════════════════
// Telemetry Handle
// ═══════════════════════════════════════════════════════════════

/// Top-level telemetry handle. Clone-friendly (all Arc-wrapped).
///
/// Not a `Service` — has no lifecycle, no ping, no shutdown.
/// Same architectural tier as `FacadeHandle`: a runtime handle
/// stored on `Platform`.
#[derive(Clone)]
pub struct TelemetryHandle {
    /// Runtime-mutable lane configuration.
    config: Arc<RwLock<LaneTraceConfig>>,
    /// Sender for completed traces → background writer.
    trace_tx: mpsc::Sender<CompletedTrace>,
}

impl TelemetryHandle {
    /// Create the handle and spawn the background writer task.
    ///
    /// The writer drains completed traces from the channel and
    /// bulk-inserts them into `DuckDB` at regular intervals.
    pub fn spawn(config: LaneTraceConfig, analytics: Arc<AnalyticsService>) -> Self {
        let (trace_tx, trace_rx) = mpsc::channel(TRACE_CHANNEL_CAPACITY);
        let persist = config.persist_to_duckdb;
        let config = Arc::new(RwLock::new(config));

        if persist {
            let writer = LaneTraceWriter {
                rx: trace_rx,
                analytics,
                batch: Vec::with_capacity(BATCH_SIZE),
            };
            spawn(writer.run());
        } else {
            // Still spawn a drain task so the channel doesn't fill up.
            spawn(async move {
                let mut rx = trace_rx;
                while rx.recv().await.is_some() {
                    // Discard — persistence disabled.
                }
            });
        }

        Self { config, trace_tx }
    }

    /// Start a trace for a lane.
    ///
    /// Returns `None` if the lane is disabled in the current config,
    /// meaning zero overhead for disabled lanes (no allocation, no span).
    pub async fn trace(&self, lane: ExecutionLane) -> Option<LaneTraceGuard> {
        let config = self.config.read().await;
        let enabled = config
            .lanes
            .iter()
            .any(|toggle| toggle.lane == lane && toggle.enabled);

        if !enabled {
            return None;
        }

        Some(LaneTraceGuard {
            lane,
            start: Instant::now(),
            tx: self.trace_tx.clone(),
            completed: false,
        })
    }

    /// Update the lane configuration at runtime. No restart required.
    pub async fn update_config(&self, new_config: LaneTraceConfig) {
        let mut guard = self.config.write().await;
        *guard = new_config;
    }

    /// Read a snapshot of the current configuration.
    pub async fn config_snapshot(&self) -> LaneTraceConfig {
        self.config.read().await.clone()
    }

    /// Check if a specific lane is currently enabled.
    pub async fn is_lane_enabled(&self, lane: ExecutionLane) -> bool {
        let config = self.config.read().await;
        config
            .lanes
            .iter()
            .any(|toggle| toggle.lane == lane && toggle.enabled)
    }
}

// ═══════════════════════════════════════════════════════════════
// Completed Trace Record
// ═══════════════════════════════════════════════════════════════

/// A completed lane trace, ready for `DuckDB` persistence.
#[derive(Debug)]
pub struct CompletedTrace {
    /// Which lane executed.
    pub lane: ExecutionLane,
    /// Wall clock duration in microseconds.
    pub duration_us: u64,
    /// Device category (gpu, cpu, disk, memory).
    pub device_category: &'static str,
    /// Whether this was a cache hit.
    pub cache_hit: bool,
    /// Whether this was a cold start (model loaded from disk).
    pub cold_start: bool,
    /// Queue wait time in microseconds (before device was available).
    pub queue_wait_us: u64,
    /// Input size (tokens for LLMs, bytes for audio, vectors for search).
    pub input_size: u64,
    /// Output size (same units as input).
    pub output_size: u64,
    /// Optional model identifier (for inference lanes).
    pub model_id: Option<String>,
    /// Optional slot identifier (for model lifecycle correlation).
    pub slot_id: Option<String>,
}

// ═══════════════════════════════════════════════════════════════
// Trace Guard (RAII)
// ═══════════════════════════════════════════════════════════════

/// RAII guard that measures wall-clock time for a lane execution.
///
/// Usage:
/// ```rust,ignore
/// let guard = telemetry.trace(ExecutionLane::Embedding).await;
/// if let Some(guard) = guard {
///     // ... do embedding work ...
///     guard.complete(TraceMetrics {
///         input_size: query.len() as u64,
///         output_size: 1024,
///         cache_hit: false,
///         cold_start: false,
///         queue_wait_us: 0,
///         model_id: Some("Qwen3-Embedding-0.6B".into()),
///         slot_id: Some("rag.embedder".into()),
///     });
/// }
/// ```
///
/// If dropped without calling `complete()` (error path), records
/// a trace with zero I/O sizes. No trace is silently lost.
pub struct LaneTraceGuard {
    lane: ExecutionLane,
    start: Instant,
    tx: mpsc::Sender<CompletedTrace>,
    completed: bool,
}

/// Metrics provided by the caller when completing a trace.
pub struct TraceMetrics {
    /// Input payload size in bytes (tokens × sizeof for inference, query length for retrieval).
    pub input_size: u64,
    /// Output payload size in bytes (generated tokens × sizeof, result count for retrieval).
    pub output_size: u64,
    /// Whether a cache layer satisfied the request without full execution.
    pub cache_hit: bool,
    /// Whether this was the first invocation after model load (cold start penalty).
    pub cold_start: bool,
    /// Microseconds spent waiting in the execution queue before processing began.
    pub queue_wait_us: u64,
    /// Registry ID of the model used for this trace (if applicable).
    pub model_id: Option<String>,
    /// Slot ID that serviced this request (if applicable).
    pub slot_id: Option<String>,
}

impl LaneTraceGuard {
    /// Complete the trace with final metrics.
    ///
    /// Sends the completed trace to the background writer.
    /// Non-blocking: if the channel is full, the trace is dropped
    /// (acceptable for telemetry — backpressure over blocking).
    pub fn complete(mut self, metrics: TraceMetrics) {
        self.completed = true;
        let duration = self.start.elapsed();
        let duration_us = duration.as_micros() as u64;

        let trace = CompletedTrace {
            lane: self.lane,
            duration_us,
            device_category: self.lane.device_category(),
            cache_hit: metrics.cache_hit,
            cold_start: metrics.cold_start,
            queue_wait_us: metrics.queue_wait_us,
            input_size: metrics.input_size,
            output_size: metrics.output_size,
            model_id: metrics.model_id,
            slot_id: metrics.slot_id,
        };

        // Log the completed trace via tracing crate.
        let expected = self.lane.expected_latency_ms();
        let wall_ms = duration_us / 1000;
        if wall_ms > expected * 2 {
            tracing::warn!(
                lane = self.lane.span_name(),
                actual_ms = wall_ms,
                expected_ms = expected,
                "lane exceeded 2x expected latency"
            );
        } else {
            tracing::debug!(
                lane = self.lane.span_name(),
                duration_us,
                cache_hit = trace.cache_hit,
                cold_start = trace.cold_start,
                "lane trace complete"
            );
        }

        // Non-blocking send — drop trace if channel is full.
        let _ = self.tx.try_send(trace);
    }
}

impl Drop for LaneTraceGuard {
    fn drop(&mut self) {
        if !self.completed {
            // Guard dropped without complete() — error path.
            // Record a minimal trace so no execution is silently lost.
            let duration_us = self.start.elapsed().as_micros() as u64;

            tracing::debug!(
                lane = self.lane.span_name(),
                duration_us,
                "lane trace dropped without complete (error path)"
            );

            let trace = CompletedTrace {
                lane: self.lane,
                duration_us,
                device_category: self.lane.device_category(),
                cache_hit: false,
                cold_start: false,
                queue_wait_us: 0,
                input_size: 0,
                output_size: 0,
                model_id: None,
                slot_id: None,
            };

            let _ = self.tx.try_send(trace);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Background Writer
// ═══════════════════════════════════════════════════════════════

/// Background task that drains the trace channel and bulk-inserts
/// into `DuckDB` at regular intervals.
///
/// Batches up to `BATCH_SIZE` traces or flushes every
/// `BATCH_FLUSH_INTERVAL_MS`, whichever comes first.
/// On channel close (shutdown), flushes the remaining buffer.
struct LaneTraceWriter {
    rx: mpsc::Receiver<CompletedTrace>,
    analytics: Arc<AnalyticsService>,
    batch: Vec<CompletedTrace>,
}

impl LaneTraceWriter {
    async fn run(mut self) {
        let flush_interval = tokio::time::Duration::from_millis(BATCH_FLUSH_INTERVAL_MS);

        loop {
            // Wait for a trace or timeout (flush interval).
            let trace = tokio::time::timeout(flush_interval, self.rx.recv()).await;

            match trace {
                Ok(Some(t)) => {
                    self.batch.push(t);
                    if self.batch.len() >= BATCH_SIZE {
                        self.flush().await;
                    }
                }
                Ok(None) => {
                    // Channel closed — flush remaining and exit.
                    self.flush().await;
                    tracing::debug!("Lane trace writer shutting down");
                    return;
                }
                Err(_) => {
                    // Timeout — flush whatever we have.
                    if !self.batch.is_empty() {
                        self.flush().await;
                    }
                }
            }
        }
    }

    async fn flush(&mut self) {
        if self.batch.is_empty() {
            return;
        }

        let records: Vec<serde_json::Value> = self
            .batch
            .drain(..)
            .map(|t| {
                json!({
                    "lane": t.lane.toml_key(),
                    "device_category": t.device_category,
                    "duration_us": t.duration_us,
                    "cache_hit": t.cache_hit,
                    "cold_start": t.cold_start,
                    "queue_wait_us": t.queue_wait_us,
                    "input_size": t.input_size,
                    "output_size": t.output_size,
                    "model_id": t.model_id,
                    "slot_id": t.slot_id,
                })
            })
            .collect();

        let count = records.len();

        match self
            .analytics
            .adapter()
            .append("lane_traces", &records)
            .await
        {
            Ok(inserted) => {
                tracing::debug!(count, inserted, "Flushed lane traces to DuckDB");
            }
            Err(e) => {
                tracing::warn!(
                    count,
                    error = %format!("{e:#}"),
                    "Failed to flush lane traces to DuckDB"
                );
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// DuckDB Schema
// ═══════════════════════════════════════════════════════════════

/// SQL appended to the system analytics schema for lane trace storage.
///
/// Tables:
/// - `lane_traces`: Raw per-execution trace records.
/// - `lane_baselines`: Computed baseline percentiles per hardware tier.
pub const LANE_TRACES_SCHEMA: &str = r"
-- ── Lane Traces ───────────────────────────────────────────────

-- Per-execution-lane trace spans for pipeline instrumentation.
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

-- Index for baseline queries (lane + time range).
CREATE INDEX IF NOT EXISTS idx_lane_traces_lane
    ON lane_traces(lane, created_at);

-- Computed baseline percentiles. Populated by analytical queries,
-- not by the writer. Stored for fast dashboard access.
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
";

// ═══════════════════════════════════════════════════════════════
// Baseline Queries (Reference SQL)
// ═══════════════════════════════════════════════════════════════

/// Per-lane latency percentiles.
/// Execute via MCP `query_duckdb` tool or Cortex viewer.
pub const BASELINE_PERCENTILES_SQL: &str = r"
SELECT
    lane,
    device_category,
    COUNT(*) as sample_count,
    ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_us), 0) as p50_us,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_us), 0) as p95_us,
    ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_us), 0) as p99_us,
    ROUND(AVG(queue_wait_us), 0) as avg_queue_us,
    ROUND(AVG(CASE WHEN cache_hit THEN 1.0 ELSE 0.0 END), 3) as cache_hit_rate,
    ROUND(AVG(CASE WHEN cold_start THEN 1.0 ELSE 0.0 END), 3) as cold_start_rate
FROM lane_traces
GROUP BY lane, device_category
ORDER BY p95_us DESC;
";

/// Regression detection: lanes where recent p95 exceeds baseline by 20%+.
pub const REGRESSION_CHECK_SQL: &str = r"
WITH baseline AS (
    SELECT lane,
           PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_us) as p95
    FROM lane_traces
    WHERE created_at < now() - INTERVAL '1 day'
    GROUP BY lane
),
recent AS (
    SELECT lane,
           PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_us) as p95
    FROM lane_traces
    WHERE created_at >= now() - INTERVAL '1 day'
    GROUP BY lane
)
SELECT
    b.lane,
    ROUND(b.p95, 0) as baseline_p95_us,
    ROUND(r.p95, 0) as recent_p95_us,
    ROUND((r.p95 - b.p95) / b.p95 * 100, 1) as regression_pct
FROM baseline b
JOIN recent r ON b.lane = r.lane
WHERE r.p95 > b.p95 * 1.2
ORDER BY regression_pct DESC;
";
