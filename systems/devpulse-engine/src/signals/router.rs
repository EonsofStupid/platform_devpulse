//! SignalRouter - broadcast channel for signal fanout.
//!
//! Uses tokio::broadcast for multi-subscriber support.

use tokio::sync::broadcast;

use super::signal::Signal;

/// Default channel capacity.
const CHANNEL_CAPACITY: usize = 1024;

/// Signal router for broadcasting signals to multiple subscribers.
pub struct SignalRouter {
    tx: broadcast::Sender<Signal>,
}

impl SignalRouter {
    /// Create a new router with default capacity.
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(CHANNEL_CAPACITY);
        Self { tx }
    }

    /// Create a new router with custom capacity.
    pub fn with_capacity(capacity: usize) -> Self {
        let (tx, _) = broadcast::channel(capacity);
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
    pub fn subscribe(&self) -> broadcast::Receiver<Signal> {
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
