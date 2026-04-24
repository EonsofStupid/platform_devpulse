//! Shared data shapes for the vision pipeline.
//!
//! These types cross the Tauri boundary, so every struct carries
//! `#[derive(Serialize, Deserialize, Type)]` and camelCase JSON.
//! Types live here — not split across governor/metrics/pipeline — so
//! downstream crates can depend on `devpulse_engine::vision::dto::*`
//! without pulling in the broadcast channel / DuckDB machinery.

use serde::{Deserialize, Serialize};
use specta::Type;

// ═══════════════════════════════════════════════════════════════════════
// Governor
// ═══════════════════════════════════════════════════════════════════════

/// Why the governor paused the pipeline (if at all).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum GovernorThrottleReason {
    /// System CPU load exceeded `GovernorPolicy::cpu_ceiling_pct`.
    Cpu,
    /// Process RSS exceeded `GovernorPolicy::ram_ceiling_mb`.
    Ram,
    /// Vision domain emitted status events above `GovernorPolicy::event_bridge_qps`.
    EventBridgeQps,
    /// Operator manually paused the pipeline via Actions tab.
    ManualPause,
}

/// Runtime configuration the operator can mutate from the Config tab.
///
/// Defaults target a desktop machine running Clyffy + llama.cpp +
/// SurrealDB + the vision pipeline simultaneously. Adjust upward on
/// beefier hardware; downward on laptops.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GovernorPolicy {
    /// System-wide CPU load percentage (0.0 to 100.0) above which new
    /// capture ticks are skipped. Default 75.
    pub cpu_ceiling_pct: f32,
    /// Process RSS in megabytes above which new capture ticks are
    /// skipped *and* the pipeline drains its in-memory metrics buffer
    /// to disk. Default 4096 (4 GB).
    pub ram_ceiling_mb: u64,
    /// Max events per second this domain emits through `emit_status`
    /// before frames are coalesced into multi-frame batches. Default 20.
    pub event_bridge_qps: f32,
}

impl Default for GovernorPolicy {
    fn default() -> Self {
        Self {
            cpu_ceiling_pct: 75.0,
            ram_ceiling_mb: 4096,
            event_bridge_qps: 20.0,
        }
    }
}

/// One decision from the governor — what the pipeline should do next.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GovernorState {
    /// `true` when the pipeline should skip this tick.
    pub throttled: bool,
    /// Set when `throttled = true`. `None` when a tick is allowed.
    pub reason: Option<GovernorThrottleReason>,
    /// Last sampled system CPU load (0..100).
    pub last_cpu_pct: f32,
    /// Last sampled process RSS in megabytes.
    pub last_rss_mb: u64,
    /// Last sampled event-bridge QPS (rolling 1s window).
    pub last_event_qps: f32,
    /// Unix epoch milliseconds of the last sample.
    pub last_sampled_at_ms: i64,
}

/// One sample fed into `GovernorHandle::tick`.
///
/// Separated from `GovernorState` so the sampler (usually `sysinfo`
/// inside the Tauri command layer) can be mocked in unit tests — the
/// engine module stays dep-free on `sysinfo`.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GovernorSample {
    /// Observed system CPU load (0..100).
    pub cpu_pct: f32,
    /// Observed process RSS in megabytes.
    pub rss_mb: u64,
    /// Events/sec this domain has emitted in the last 1000ms.
    pub event_qps: f32,
    /// Unix epoch milliseconds when this sample was taken.
    pub sampled_at_ms: i64,
}

// ═══════════════════════════════════════════════════════════════════════
// Frame metrics
// ═══════════════════════════════════════════════════════════════════════

/// One frame's worth of telemetry — written to DuckDB in batches.
///
/// Populated by the pipeline (V-4) with one row per
/// capture→encode→sink round-trip. The Metrics tab reads rolling
/// windows from `vision_frame_metrics` for charts.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FrameMetric {
    /// Opaque session identifier (UUID). One vision session →
    /// one value here. Makes it trivial to scope queries.
    pub session_id: String,
    /// Monotonic frame counter within the session (0, 1, 2, ...).
    pub frame_id: u64,
    /// Unix epoch milliseconds when the capture started.
    pub ts_ms: i64,
    /// `"monitor"` | `"window"` | `"webcam"`.
    pub source_kind: String,
    /// Zero-based index within the source kind.
    pub source_idx: u32,
    /// Capture latency (ms) — xcap/nokhwa call.
    pub capture_ms: f32,
    /// Encode latency (ms) — SigLip forward pass.
    pub encode_ms: f32,
    /// Sink write latency (ms) — sum of all configured sinks.
    pub sink_ms: f32,
    /// End-to-end latency (ms) — capture → encode → sinks.
    pub total_ms: f32,
    /// PNG size in bytes (post-encode, pre-sink).
    pub frame_bytes: u32,
    /// Embedding dimensionality (1152 for SigLIP SO400M).
    pub embedding_dim: u32,
    /// L2 norm of the embedding (should be ≈ 1.0 post-normalize).
    pub embedding_norm: f32,
    /// Cosine similarity to the previous frame's embedding. `None`
    /// on the first frame of a session.
    pub similarity_to_prev: Option<f32>,
    /// CPU load percentage observed at capture start.
    pub cpu_pct: f32,
    /// Process RSS (MB) observed at capture start.
    pub rss_mb: u32,
    /// `true` when the governor reported throttled state for this tick
    /// but the pipeline proceeded anyway (operator-forced).
    pub governor_throttled: bool,
    /// Which backend produced the embedding.
    /// `"siglip1-candle"` | `"siglip2-ort"` | `"siglip1-tiled"`.
    pub hd_path: String,
    /// Comma-separated list of sink names that acknowledged the write.
    /// e.g. `"disk,libsql,duckdb"`.
    pub sink_list: String,
}

// ═══════════════════════════════════════════════════════════════════════
// DuckDB schema
// ═══════════════════════════════════════════════════════════════════════

/// DDL for the two vision tables.
///
/// Concatenated into `SYSTEM_ANALYTICS_SCHEMA` (see
/// `platform/services/analytics.rs`). Indexed on (session_id, ts_ms)
/// because every devtool panel query filters by session then sorts
/// by time.
pub const VISION_SCHEMA: &str = r"
-- Per-frame end-to-end telemetry
CREATE TABLE IF NOT EXISTS vision_frame_metrics (
    session_id         VARCHAR NOT NULL,
    frame_id           BIGINT  NOT NULL,
    ts_ms              BIGINT  NOT NULL,
    source_kind        VARCHAR NOT NULL,
    source_idx         INTEGER NOT NULL,
    capture_ms         FLOAT   NOT NULL,
    encode_ms          FLOAT   NOT NULL,
    sink_ms            FLOAT   NOT NULL,
    total_ms           FLOAT   NOT NULL,
    frame_bytes        INTEGER NOT NULL,
    embedding_dim      INTEGER NOT NULL,
    embedding_norm     FLOAT   NOT NULL,
    similarity_to_prev FLOAT,
    cpu_pct            FLOAT   NOT NULL,
    rss_mb             INTEGER NOT NULL,
    governor_throttled BOOLEAN NOT NULL,
    hd_path            VARCHAR NOT NULL,
    sink_list          VARCHAR NOT NULL,
    created_at         TIMESTAMP DEFAULT now(),
    PRIMARY KEY (session_id, frame_id)
);

-- Per-tick governor decisions (for throttle-rate charts + post-mortem)
CREATE TABLE IF NOT EXISTS vision_governor_ticks (
    ts_ms              BIGINT  NOT NULL,
    throttled          BOOLEAN NOT NULL,
    reason             VARCHAR,            -- NULL when not throttled
    cpu_pct            FLOAT   NOT NULL,
    rss_mb             INTEGER NOT NULL,
    event_qps          FLOAT   NOT NULL,
    created_at         TIMESTAMP DEFAULT now()
);
";
