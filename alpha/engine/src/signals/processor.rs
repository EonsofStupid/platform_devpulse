// engine/src/signals/processor.rs

//! SignalProcessor - Routes signals to sinks
//!
//! Subscribes to SignalRouter and dispatches each signal
//! to its designated sinks based on `signal.payload.sinks()`.
//!
//! # Architecture
//!
//! ```text
//! SignalRouter.emit(signal)
//!        │
//!        └──▶ SignalProcessor.run()
//!                    │
//!                    ├── SinkKind::Cache     → CacheSink
//!                    ├── SinkKind::Durable   → DurableSink
//!                    ├── SinkKind::Parking   → ParkingSink
//!                    ├── SinkKind::Analytics → AnalyticsSink
//!                    └── SinkKind::Vector    → VectorSink
//! ```
//!
//! Broadcast sink is handled by SignalRouter directly.

use super::sinks::{AnalyticsSink, CacheSink, DurableSink, ParkingSink, SignalSink, VectorSink};
use super::{Signal, SignalRouter, SinkKind};
use orchestrator::infra::persistence::analytics::Analytics;
use orchestrator::infra::persistence::audit::FjallStores;
use orchestrator::infra::persistence::sql::Database;
use orchestrator::infra::persistence::memory::HotCache;
use std::sync::Arc;
use tokio::sync::broadcast::error::RecvError;
use tracing::{debug, info, instrument, warn};

/// SignalProcessor - the sink dispatcher
///
/// Owns all sink instances and routes signals based on
/// their declared `sinks()` targets.
pub struct SignalProcessor {
    cache_sink: CacheSink,
    durable_sink: DurableSink,
    parking_sink: ParkingSink,
    analytics_sink: AnalyticsSink,
    vector_sink: VectorSink,
}

impl SignalProcessor {
    /// Create a new processor with all sink backends
    ///
    /// # Arguments
    /// * `cache` - moka HotCache for fast lookups
    /// * `db` - libSQL database for persistence
    /// * `stores` - fjall stores for signal replay
    /// * `analytics` - DuckDB for metrics (None = Desktop mode, skips analytics)
    pub fn new(
        cache: HotCache,
        db: Arc<Database>,
        stores: Arc<FjallStores>,
        analytics: Option<Arc<Analytics>>,
    ) -> Self {
        Self {
            cache_sink: CacheSink::new(cache),
            durable_sink: DurableSink::new(db),
            parking_sink: ParkingSink::new(stores),
            analytics_sink: AnalyticsSink::new(analytics),
            vector_sink: VectorSink::new(),
        }
    }

    /// Run the processor loop - subscribes to router and dispatches
    ///
    /// This should be spawned as a background task:
    /// ```ignore
    /// tokio::spawn(processor.run(router));
    /// ```
    #[instrument(skip(self, router), name = "signal_processor")]
    pub async fn run(self, router: Arc<SignalRouter>) {
        let mut rx = router.subscribe();
        info!("SignalProcessor started, subscribed to router");

        loop {
            match rx.recv().await {
                Ok(signal) => {
                    self.dispatch(&signal).await;
                }
                Err(RecvError::Lagged(n)) => {
                    warn!(lagged = n, "SignalProcessor lagged, missed {} signals", n);
                }
                Err(RecvError::Closed) => {
                    info!("SignalRouter closed, processor shutting down");
                    break;
                }
            }
        }
    }

    /// Dispatch a signal to all its designated sinks
    #[instrument(skip(self, signal), fields(
        signal_id = %signal.header.id,
        signal_type = signal.name()
    ))]
    async fn dispatch(&self, signal: &Signal) {
        let sinks = signal.payload.sinks();
        debug!(sinks = ?sinks, "Dispatching signal to {} sink(s)", sinks.len());

        for sink_kind in sinks {
            match sink_kind {
                SinkKind::Broadcast => {
                    // Already handled by SignalRouter - skip
                }
                SinkKind::Cache => {
                    self.cache_sink.process(signal).await;
                }
                SinkKind::Durable => {
                    self.durable_sink.process(signal).await;
                }
                SinkKind::Parking => {
                    self.parking_sink.process(signal).await;
                }
                SinkKind::Analytics => {
                    self.analytics_sink.process(signal).await;
                }
                SinkKind::Vector => {
                    self.vector_sink.process(signal).await;
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::signals::payloads::{AnalyticsEvent, AnalyticsPayload, ChatPayload, Role};
    use crate::signals::{SignalSource, SignalVariant};

    // Note: Full integration tests require mocking infra backends
    // These tests verify the dispatch logic

    #[test]
    fn test_sink_routing_chat() {
        // Chat should go to Broadcast, Cache, Durable
        let payload = SignalVariant::Chat(ChatPayload {
            role: Role::User,
            content: "test".to_string(),
        });
        let sinks = payload.sinks();
        assert!(sinks.contains(&SinkKind::Broadcast));
        assert!(sinks.contains(&SinkKind::Cache));
        assert!(sinks.contains(&SinkKind::Durable));
        assert!(!sinks.contains(&SinkKind::Analytics));
    }

    #[test]
    fn test_sink_routing_analytics() {
        // Analytics should go to Analytics only
        let payload = SignalVariant::Analytics(AnalyticsPayload {
            event_type: AnalyticsEvent::SessionStarted,
            value: 1,
        });
        let sinks = payload.sinks();
        assert!(sinks.contains(&SinkKind::Analytics));
        assert!(!sinks.contains(&SinkKind::Broadcast));
        assert!(!sinks.contains(&SinkKind::Cache));
    }

    #[test]
    fn test_sink_routing_inference() {
        // Inference should go to Broadcast + Analytics
        let payload = SignalVariant::Inference(crate::signals::payloads::InferencePayload {
            model_id: "test".to_string(),
            tokens_in: 100,
            tokens_out: 50,
            latency_ms: 250,
        });
        let sinks = payload.sinks();
        assert!(sinks.contains(&SinkKind::Broadcast));
        assert!(sinks.contains(&SinkKind::Analytics));
        assert!(!sinks.contains(&SinkKind::Cache));
    }
}
