//! `DevPulse` signal engine — broadcast routing and typed payloads.

pub mod signals;

use signals::{Signal, SignalRouter, SignalSource, SignalVariant, SystemPayload, SystemStatus};

/// The Engine - signal router and public API.
///
/// Engine owns the signal router. This is the public facade.
/// Maestro subscribes to signals for internal processing.
pub struct Engine {
    router: SignalRouter,
}

impl Engine {
    /// Boot the engine.
    pub fn boot() -> Self {
        Self {
            router: SignalRouter::new(),
        }
    }

    /// Start the engine and emit ready signal.
    pub fn start(&self) {
        let signal = Signal::new(
            SignalSource::System,
            SignalVariant::System(SystemPayload {
                status: SystemStatus::Ready,
                message: "Engine started".to_string(),
            }),
        );
        self.router.emit(signal);
    }

    /// Get a reference to the signal router.
    pub fn router(&self) -> &SignalRouter {
        &self.router
    }

    /// Emit a signal through the router.
    pub fn emit(&self, signal: Signal) -> usize {
        self.router.emit(signal)
    }
}
