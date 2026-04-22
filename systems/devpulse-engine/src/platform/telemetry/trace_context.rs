//! Trace context — lightweight correlation ID for request tracing.
//!
//! Every user request (inference, TTS, STT) gets a `TraceContext` at entry.
//! The `trace_id` propagates across channel boundaries (flume, mpsc) by
//! embedding it in request structs. Spans on both sides of the boundary
//! reference the same `trace_id` for end-to-end correlation in `DuckDB`.

/// Lightweight trace context for cross-boundary correlation.
///
/// Embeddable in channel messages (flume `InferenceRequest`, etc.)
/// to link spans that can't share a tracing parent across OS threads.
#[derive(Debug, Clone)]
pub struct TraceContext {
    /// Unique identifier for this request trace (UUID v7, time-ordered).
    pub trace_id: String,
}

impl TraceContext {
    /// Create a new trace context with a fresh UUID v7 trace ID.
    #[must_use]
    pub fn new() -> Self {
        Self {
            trace_id: uuid::Uuid::now_v7().to_string(),
        }
    }

    /// Create a trace context from an existing ID (for child spans on
    /// the receiving side of a channel boundary).
    #[must_use]
    pub fn from_id(trace_id: String) -> Self {
        Self { trace_id }
    }
}

impl Default for TraceContext {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for TraceContext {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.trace_id)
    }
}
