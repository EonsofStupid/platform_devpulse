// shared/src/types/analytics.rs

//! Analytics types for DevPulse
//!
//! SSOT for analytics type definitions.
//! Used by: orchestrator (DuckDB infra), engine (facade), desktop (user-facing), lab (internal)

use serde::{Deserialize, Serialize};

/// Inference statistics from model calls
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct InferenceStats {
    pub total_inferences: u64,
    pub total_tokens_in: u64,
    pub total_tokens_out: u64,
    pub avg_latency_ms: f32,
}

/// Hop statistics from reasoning chains
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct HopStats {
    pub total_hops: u64,
    pub avg_confidence: f32,
    pub avg_latency_ms: f32,
}

/// User-facing analytics summary (Desktop Dashboard)
///
/// Curated subset of metrics appropriate for end users.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AnalyticsSummary {
    pub total_sessions: u64,
    pub total_messages: u64,
    pub inference: InferenceStats,
}

/// Full internal analytics (Lab only)
///
/// Complete metrics for developer monitoring and baseline establishment.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct FullAnalytics {
    pub inference: InferenceStats,
    pub hops: HopStats,
    pub event_count: u64,
}

/// Signal trace entry for debugging
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalTraceEntry {
    pub signal_id: String,
    pub signal_type: String,
    pub timestamp_ms: i64,
    pub sinks: Vec<String>,
}
