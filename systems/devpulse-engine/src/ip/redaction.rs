//! Detail redaction for IP protection.
//!
//! Beyond vocabulary remapping (`ip_term!()`), some internal DETAIL needs
//! summarizing. The customer gets the insight, not the implementation.
//!
//! - `kernel` builds: `TraceDetail` contains full agent/layer/algorithm info
//! - `engine` builds: `TraceDetail` contains summarized phase/confidence info

use serde::Serialize;

// ═══════════════════════════════════════════════════════════════
// Kernel builds: full internal detail
// ═══════════════════════════════════════════════════════════════

/// Full trace detail — visible in kernel (dev) builds only.
///
/// Contains agent names, layer identifiers, algorithm names, latency budgets,
/// and reasoning step traces. Never shipped to customers.
#[cfg(feature = "kernel")]
#[derive(Debug, Clone, Serialize)]
pub struct TraceDetail {
    /// Agent that produced this trace (e.g., "GUARDIAN", "DIARY").
    pub agent: String,
    /// Rumination layer (e.g., "keystroke layer", "send layer").
    pub layer: String,
    /// Latency budget in ms for this layer.
    pub latency_budget_ms: u64,
    /// Actual latency in ms.
    pub actual_latency_ms: u64,
    /// Algorithm used (e.g., "RRF fusion", "HMM").
    pub algorithm: String,
    /// Whether the KV cache was hit.
    pub cache_hit: bool,
    /// Token count consumed.
    pub token_count: usize,
    /// Individual reasoning steps (internal trace).
    pub reasoning_steps: Vec<String>,
}

// ═══════════════════════════════════════════════════════════════
// Engine builds: summarized for customer
// ═══════════════════════════════════════════════════════════════

/// Summarized trace detail — visible in engine (customer) builds.
///
/// Contains the same quality metrics (latency, tokens, confidence) but
/// with all internal architecture detail stripped. Agent names are remapped,
/// reasoning steps are summarized into a human-friendly description.
#[cfg(feature = "engine")]
#[derive(Debug, Clone, Serialize)]
pub struct TraceDetail {
    /// Thinking phase (e.g., "quick read", "deep thinking").
    pub phase: String,
    /// Actual latency in ms (customers see real performance).
    pub time_ms: u64,
    /// Token count (customers see real usage).
    pub tokens_used: usize,
    /// Quality confidence score (0.0–1.0).
    pub confidence: f32,
    /// Human-friendly summary of what happened.
    pub description: String,
}

/// Convert full kernel trace into customer-safe summary.
///
/// Only exists in engine builds. Kernel builds use `TraceDetail` directly.
#[cfg(feature = "engine")]
pub fn redact_trace(
    _agent: &str,
    layer: &str,
    latency_ms: u64,
    token_count: usize,
    reasoning_steps: &[String],
) -> TraceDetail {
    TraceDetail {
        phase: crate::ip_term!(layer).to_string(),
        time_ms: latency_ms,
        tokens_used: token_count,
        confidence: compute_confidence(reasoning_steps.len()),
        description: summarize_steps(reasoning_steps.len()),
    }
}

/// Confidence score derived from reasoning depth.
#[cfg(feature = "engine")]
#[allow(clippy::cast_precision_loss)] // Intentional: step_count is small, f32 precision is fine
fn compute_confidence(step_count: usize) -> f32 {
    let base = 0.7_f32;
    let step_bonus = (step_count as f32 * 0.05).min(0.25);
    (base + step_bonus).min(1.0)
}

/// Summarize reasoning steps without revealing internal logic.
#[cfg(feature = "engine")]
fn summarize_steps(step_count: usize) -> String {
    match step_count {
        0 => "Processed instantly.".to_string(),
        1 => "Analyzed your request.".to_string(),
        2..=3 => "Checked context and prepared response.".to_string(),
        4..=6 => "Deep analysis: checked your project, found patterns, built response.".to_string(),
        _ => format!("Thorough analysis across {step_count} checks before responding."),
    }
}
