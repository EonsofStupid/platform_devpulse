//! `SignalRouter` - broadcast channel for signal fanout.
//!
//! Uses `devpulse_telemetry::BroadcastSender` for multi-subscriber support
//! with OTel context propagation (link semantics, not parent-child).

use devpulse_telemetry::prelude::*;

use super::signal::Signal;

/// Default channel capacity.
const CHANNEL_CAPACITY: usize = 1024;

/// Signal router for broadcasting signals to multiple subscribers.
pub struct SignalRouter {
    tx: BroadcastSender<Signal>,
}

impl SignalRouter {
    /// Create a new router with default capacity.
    pub fn new() -> Self {
        let (tx, _) = broadcast_channel(CHANNEL_CAPACITY);
        Self { tx }
    }

    /// Create a new router with custom capacity.
    pub fn with_capacity(capacity: usize) -> Self {
        let (tx, _) = broadcast_channel(capacity);
        Self { tx }
    }

    /// Emit a signal to all subscribers.
    ///
    /// Returns the number of active subscribers that received the signal.
    pub fn emit(&self, signal: Signal) -> usize {
        // send returns Err if no receivers, which is fine
        self.tx.send(signal).unwrap_or(0)
    }

    /// Subscribe to receive signals.
    ///
    /// Returns a receiver that will get all signals emitted after subscription.
    /// Received signals are wrapped in `LinkedTraced<Signal>` — use `.value`
    /// to access the signal, or `.link_context()` for OTel span linking.
    pub fn subscribe(&self) -> BroadcastReceiver<Signal> {
        self.tx.subscribe()
    }

    /// Get the current number of active subscribers.
    pub fn subscriber_count(&self) -> usize {
        self.tx.receiver_count()
    }
}

impl Default for SignalRouter {
    fn default() -> Self {
        Self::new()
    }
}
