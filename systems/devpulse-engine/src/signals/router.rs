//! `SignalRouter` — context-propagating broadcast channel for signal fanout.
//!
//! Uses `devpulse_telemetry::BroadcastSender` so each subscriber can link its
//! span back to the producer (1:N fan-out, not parent-child) — see ADR-002.

use devpulse_telemetry::prelude::{broadcast_channel, BroadcastReceiver, BroadcastSender};

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
    /// The current `OTel` context is captured at emit time and surfaces on
    /// each receiver as a [`devpulse_telemetry::LinkedTraced`].
    pub fn emit(&self, signal: Signal) -> usize {
        self.tx.send(signal).unwrap_or(0)
    }

    /// Subscribe to receive signals.
    ///
    /// Returns a receiver that will get all signals emitted after
    /// subscription. Each `recv()` yields a `LinkedTraced<Signal>` carrying
    /// the producer's `OTel` context as a span-link target.
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
