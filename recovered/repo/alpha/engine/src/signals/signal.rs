// engine/src/signals/signal.rs

//! Signal - the atomic unit of communication
//!
//! SignalHeader and SignalSource come from shared (SSOT).
//! This module adds Signal struct which wraps header + Arc<SignalVariant>.
//!
//! Use factories: Signal::new() or Signal::caused_by()
//! NEVER construct Signal directly.

use super::variants::SignalVariant;
use std::sync::Arc;

// Import from shared (SSOT)
pub use shared::{current_time_millis, SignalHeader, SignalSource};

// =============================================================================
// SIGNAL (Header + Payload)
// =============================================================================

/// The complete signal packet
///
/// Arc<SignalVariant> enables zero-copy broadcast:
/// - One allocation when signal is created
/// - Zero-copy cloning for each subscriber
#[derive(Clone, Debug)]
pub struct Signal {
    /// Metadata (id, correlation, timestamp, source) - from shared
    pub header: SignalHeader,

    /// Payload wrapped in Arc for zero-copy
    pub payload: Arc<SignalVariant>,
}

impl Signal {
    /// Create a root signal (new causality chain)
    ///
    /// Use for: user input, system events, timer triggers
    pub fn new(source: SignalSource, variant: SignalVariant) -> Self {
        Self {
            header: SignalHeader::new(source),
            payload: Arc::new(variant),
        }
    }

    /// Create a chained signal (reaction to parent)
    ///
    /// Automatically inherits correlation from parent.
    /// Use for: expert reactions, inference results
    pub fn caused_by(parent: &Signal, variant: SignalVariant) -> Self {
        Self {
            header: SignalHeader::caused_by_header(&parent.header, SignalSource::Expert),
            payload: Arc::new(variant),
        }
    }

    /// Create a chained signal with custom source
    pub fn caused_by_with_source(
        parent: &Signal,
        source: SignalSource,
        variant: SignalVariant,
    ) -> Self {
        Self {
            header: SignalHeader::caused_by_header(&parent.header, source),
            payload: Arc::new(variant),
        }
    }

    /// Get the signal name (delegated to variant)
    #[inline]
    pub fn name(&self) -> &'static str {
        self.payload.name()
    }

    /// Get sinks for this signal (delegated to variant)
    #[inline]
    pub fn sinks(&self) -> &'static [super::SinkKind] {
        self.payload.sinks()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::signals::payloads::{AnalyticsEvent, AnalyticsPayload};

    #[test]
    fn test_root_signal() {
        let signal = Signal::new(
            SignalSource::User,
            SignalVariant::Analytics(AnalyticsPayload {
                event_type: AnalyticsEvent::SessionStarted,
                value: 1,
            }),
        );

        assert!(signal.header.correlation_id.is_none());
        assert_eq!(signal.header.source, SignalSource::User);
        assert_eq!(signal.name(), "analytics");
    }

    #[test]
    fn test_chained_signal() {
        let parent = Signal::new(
            SignalSource::User,
            SignalVariant::Analytics(AnalyticsPayload {
                event_type: AnalyticsEvent::MessageSent,
                value: 1,
            }),
        );

        let child = Signal::caused_by(
            &parent,
            SignalVariant::Analytics(AnalyticsPayload {
                event_type: AnalyticsEvent::MessageReceived,
                value: 1,
            }),
        );

        assert_eq!(child.header.correlation_id, Some(parent.header.id));
        assert_eq!(child.header.source, SignalSource::Expert);
    }
}
