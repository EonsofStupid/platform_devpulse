//! Vision pipeline foundation — governor, metrics, DTOs.
//!
//! This module is the engine's public surface for the capture → encode
//! → sink pipeline that powers `/devtools/vision` and (eventually) the
//! customer-facing vision features. It is deliberately split from the
//! kernel model-loader backend (`kernel/model-loader/src/backends/candle/siglip.rs`)
//! because:
//!   - The backend is *kernel-internal* implementation.
//!   - This module is the *engine-public* facade that carries governor +
//!     metrics + DTOs across the Tauri boundary.
//!
//! # Module layout
//!
//! - `dto`       — wire-format types shared with the frontend
//!                 (`GovernorPolicy`, `GovernorState`, `FrameMetric`,
//!                 plus `VISION_SCHEMA` DDL).
//! - `governor`  — runtime backpressure handle (`GovernorHandle`), same
//!                 facade tier as `RroStateHandle` / `GrammarHandle`.
//! - `metrics`   — in-memory ring of `FrameMetric` + cosine / L2 helpers.
//!
//! # What does NOT live here
//!
//! - HTTP / OS-level capture code → `interfaces/desktop/src-tauri/src/commands/pixvix/`.
//! - SigLip forward passes → `kernel/model-loader/src/backends/{candle,ort}/`.
//! - Storage sink implementations → `vision/sinks.rs` (V-4, added later).
//! - The pipeline's orchestration loop → `vision/pipeline.rs` (V-4).
//!
//! # Boot wiring
//!
//! The governor is not spawned at boot — it's created on demand when
//! the pipeline starts (V-4). This keeps the engine lean for users
//! who never open `/devtools/vision`.
//!
//! The DuckDB schema (`VISION_SCHEMA`) is concatenated into
//! `SYSTEM_ANALYTICS_SCHEMA` so the tables land on the first boot
//! after this module ships — no separate migration step.

pub mod dto;
pub mod governor;
pub mod metrics;
pub mod pipeline;
pub mod sinks;

pub use dto::{
    FrameMetric, GovernorPolicy, GovernorSample, GovernorState, GovernorThrottleReason,
    VISION_SCHEMA,
};
pub use governor::GovernorHandle;
pub use metrics::{cosine_similarity, l2_norm, MetricsBuffer, DEFAULT_RECENT_CAPACITY};
pub use pipeline::{process_frame, should_skip_tick, CapturedTickFrame, PipelineConfig};
pub use sinks::{
    CompositeSink, DiscardSink, DiskFrameSink, DuckDbEmbeddingSink, FrameSink,
    FrameSinkRecord, LibSqlFrameSink, SinkHealth,
};
