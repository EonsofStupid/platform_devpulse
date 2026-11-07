// engine/src/signals/sinks/parking.rs

//! Parking sink - routes signals to fjall for replay
//!
//! All signals can be parked for time-travel debugging

use super::SignalSink;
use crate::Signal;
use orchestrator::infra::persistence::audit::{FjallStores, SignalReplayEntry};
use std::sync::Arc;
use tracing::instrument;

/// Parking sink - writes to fjall LSM-tree for signal replay
pub struct ParkingSink {
    stores: Arc<FjallStores>,
}

impl ParkingSink {
    pub fn new(stores: Arc<FjallStores>) -> Self {
        Self { stores }
    }
}

#[async_trait::async_trait]
impl SignalSink for ParkingSink {
    #[instrument(skip(self, signal), fields(signal_id = %signal.header.id))]
    async fn process(&self, signal: &Signal) {
        // Record all signals for replay capability
        let entry = SignalReplayEntry {
            signal_id: signal.header.id.to_string(),
            project_id: "default".to_string(), // TODO: Extract from context
            session_id: "default".to_string(), // TODO: Extract from context
            signal_type: signal.name().to_string(),
            payload_json: serde_json::to_string(&*signal.payload).unwrap_or_default(),
            timestamp_ms: signal.header.timestamp as i64,
            hop_number: 0, // TODO: Track hop number in signal
            parent_id: signal.header.correlation_id.map(|id| id.to_string()),
        };

        if let Err(e) = self.stores.record_signal(&entry) {
            tracing::error!("Failed to record signal for replay: {}", e);
        } else {
            tracing::debug!("Parked signal for replay: {}", signal.name());
        }
    }

    fn name(&self) -> &'static str {
        "parking"
    }
}
