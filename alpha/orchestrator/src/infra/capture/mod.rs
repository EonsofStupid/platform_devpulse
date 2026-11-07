// orchestrator/src/infra/capture/mod.rs

//! Capture Pipeline - Lab telemetry and experiment tracking
//!
//! Provides real-time signal capture for:
//! - A/B testing experiments
//! - Adapter comparison (local vs API)
//! - Latency analysis
//! - Quality metrics
//!
//! ## Architecture
//! ```text
//! Signal → CapturePipeline → DuckDB (persistence)
//!                         ↓
//!                    Broadcast (real-time subscribers)
//! ```

pub mod pipeline;
pub mod experiment;

pub use pipeline::{CapturePipeline, CapturedSignal, CaptureFilter};
pub use experiment::{Experiment, ExperimentRun, ExperimentComparison};
