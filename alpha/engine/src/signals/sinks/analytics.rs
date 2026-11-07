// engine/src/signals/sinks/analytics.rs

//! Analytics sink - routes signals to DuckDB
//!
//! Handles: Analytics, Inference signals
//!
//! Note: Analytics is optional - when None (Desktop mode), this sink does nothing.

use super::SignalSink;
use crate::{Signal, SignalVariant};
use orchestrator::infra::persistence::analytics::Analytics;
use std::sync::Arc;
use tracing::instrument;

/// Analytics sink - writes to DuckDB
///
/// Analytics is optional: when None (Desktop mode), processing is skipped.
/// This avoids DuckDB file locks when Lab and Desktop run simultaneously.
pub struct AnalyticsSink {
    analytics: Option<Arc<Analytics>>,
}

impl AnalyticsSink {
    pub fn new(analytics: Option<Arc<Analytics>>) -> Self {
        Self { analytics }
    }
}

#[async_trait::async_trait]
impl SignalSink for AnalyticsSink {
    #[instrument(skip(self, signal), fields(signal_id = %signal.header.id))]
    async fn process(&self, signal: &Signal) {
        // Skip if analytics is disabled (Desktop mode)
        let Some(analytics) = &self.analytics else {
            return;
        };

        match &*signal.payload {
            SignalVariant::Analytics(payload) => {
                let event_name = format!("{:?}", payload.event_type);
                let data = serde_json::to_value(payload).unwrap_or_default();
                if let Err(e) = analytics.record_event(&event_name, &data) {
                    tracing::error!("Failed to record analytics event: {}", e);
                } else {
                    tracing::debug!("Recorded analytics event: {}", event_name);
                }
            }
            SignalVariant::Inference(payload) => {
                if let Err(e) = analytics.record_inference(
                    &payload.model_id,
                    payload.tokens_in,
                    payload.tokens_out,
                    payload.latency_ms,
                ) {
                    tracing::error!("Failed to record inference metrics: {}", e);
                } else {
                    tracing::debug!(
                        "Recorded inference: {} tokens_in={} tokens_out={} latency={}ms",
                        payload.model_id,
                        payload.tokens_in,
                        payload.tokens_out,
                        payload.latency_ms
                    );
                }
            }
            _ => {
                // Other signal types don't go to analytics
            }
        }
    }

    fn name(&self) -> &'static str {
        "analytics"
    }
}
