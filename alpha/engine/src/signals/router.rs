// engine/src/signals/router.rs

//! SignalRouter - the DUMB broadcaster
//!
//! CRITICAL: Router just broadcasts. Nothing else.
//! - No processing
//! - No sink routing
//! - No orchestrator calls
//!
//! Conduit subscribes as a listener - NO circular dependency.

use super::signal::{Signal, SignalSource};
use super::variants::SignalVariant;
use tokio::sync::broadcast;

/// Default buffer size for broadcast channel
const DEFAULT_BUFFER_SIZE: usize = 256;

/// Signal router - fire and forget broadcasting
///
/// This is intentionally simple:
/// - `emit()` broadcasts a Signal
/// - `subscribe()` returns a receiver
/// - That's it. No routing logic here.
///
/// The routing happens in subscribers (Conduit, Desktop).
pub struct SignalRouter {
    broadcast_tx: broadcast::Sender<Signal>,
}

impl SignalRouter {
    /// Create a new router with default buffer size
    pub fn new() -> Self {
        Self::with_buffer_size(DEFAULT_BUFFER_SIZE)
    }

    /// Create a new router with custom buffer size
    pub fn with_buffer_size(buffer_size: usize) -> Self {
        let (tx, _) = broadcast::channel(buffer_size);
        Self { broadcast_tx: tx }
    }

    /// Emit a pre-constructed signal - fire and forget
    ///
    /// Use Signal::new() or Signal::caused_by() to create.
    #[inline]
    pub fn emit(&self, signal: Signal) {
        // Just broadcast. Conduit subscribes separately.
        // Ignore send errors (no subscribers = OK)
        let _ = self.broadcast_tx.send(signal);
    }

    /// Emit a root signal with source and variant
    ///
    /// Convenience method that creates Signal::new() internally.
    #[inline]
    pub fn emit_new(&self, source: SignalSource, variant: SignalVariant) {
        self.emit(Signal::new(source, variant));
    }

    /// Subscribe to the signal stream
    ///
    /// Used by:
    /// - Desktop: UI updates
    /// - Conduit: sink processing
    pub fn subscribe(&self) -> broadcast::Receiver<Signal> {
        self.broadcast_tx.subscribe()
    }

    /// Get current subscriber count (for diagnostics)
    pub fn subscriber_count(&self) -> usize {
        self.broadcast_tx.receiver_count()
    }
}

impl Default for SignalRouter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::signals::payloads::{AnalyticsEvent, AnalyticsPayload};

    #[tokio::test]
    async fn test_emit_and_receive() {
        let router = SignalRouter::new();
        let mut rx = router.subscribe();

        // Emit a signal using factory
        router.emit_new(
            SignalSource::User,
            SignalVariant::Analytics(AnalyticsPayload {
                event_type: AnalyticsEvent::SessionStarted,
                value: 1,
            }),
        );

        // Should receive it
        let signal = rx.recv().await.unwrap();
        assert_eq!(signal.name(), "analytics");
        assert_eq!(signal.header.source, SignalSource::User);
        assert!(signal.header.correlation_id.is_none()); // Root signal
    }

    #[tokio::test]
    async fn test_arc_sharing() {
        let router = SignalRouter::new();
        let mut rx1 = router.subscribe();
        let mut rx2 = router.subscribe();

        router.emit_new(
            SignalSource::System,
            SignalVariant::Analytics(AnalyticsPayload {
                event_type: AnalyticsEvent::MessageSent,
                value: 42,
            }),
        );

        let sig1 = rx1.recv().await.unwrap();
        let sig2 = rx2.recv().await.unwrap();

        // Both receivers share the same Arc payload
        assert!(std::sync::Arc::ptr_eq(&sig1.payload, &sig2.payload));
    }

    #[tokio::test]
    async fn test_chained_signal() {
        let router = SignalRouter::new();
        let mut rx = router.subscribe();

        // Create parent
        let parent = Signal::new(
            SignalSource::User,
            SignalVariant::Analytics(AnalyticsPayload {
                event_type: AnalyticsEvent::MessageSent,
                value: 1,
            }),
        );
        let parent_id = parent.header.id;
        router.emit(parent);

        // Create child linked to parent
        let parent_for_child = rx.recv().await.unwrap();
        let child = Signal::caused_by(
            &parent_for_child,
            SignalVariant::Analytics(AnalyticsPayload {
                event_type: AnalyticsEvent::MessageReceived,
                value: 2,
            }),
        );
        router.emit(child);

        // Verify chain
        let received_child = rx.recv().await.unwrap();
        assert_eq!(received_child.header.correlation_id, Some(parent_id));
        assert_eq!(received_child.header.source, SignalSource::Expert);
    }
}
