//! Full trace data retained for every presentation mode and build.
use serde::Serialize;

/// Technical trace detail retained in the shipped application.
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serialized_trace_retains_technical_detail() -> Result<(), serde_json::Error> {
        let detail = TraceDetail {
            agent: "GUARDIAN".into(),
            layer: "send".into(),
            latency_budget_ms: 25,
            actual_latency_ms: 12,
            algorithm: "RRF".into(),
            cache_hit: true,
            token_count: 42,
            reasoning_steps: vec!["Compare candidate evidence".into()],
        };
        let value = serde_json::to_value(detail)?;
        assert_eq!(value["agent"], "GUARDIAN");
        assert_eq!(value["algorithm"], "RRF");
        assert_eq!(value["latency_budget_ms"], 25);
        assert_eq!(value["reasoning_steps"][0], "Compare candidate evidence");
        assert!(value.get("confidence").is_none());
        Ok(())
    }
}
