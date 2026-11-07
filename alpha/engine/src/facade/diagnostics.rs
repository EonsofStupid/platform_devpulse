// engine/src/facade/diagnostics.rs

//! Diagnostic events for Lab observation
//! Downsampled/batched for UI consumption

use serde::{Deserialize, Serialize};

/// What Lab UI actually sees (not per-token granularity)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DiagnosticEvent {
    /// Inference started
    InferenceStarted { model: String, prompt_tokens: u32 },
    /// Progress update (batched tokens)
    InferenceProgress { tokens_generated: u32, tokens_per_sec: f32 },
    /// Inference complete
    InferenceComplete { total_tokens: u32, latency_ms: u64 },
    /// Hop progress in rumination
    HopProgress { current: u8, max: u8, direction: String },
    /// Error occurred
    Error { service: String, message: String },
}
