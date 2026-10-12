//! `DevPulse` engine — owns all platform services and bridges to clyffy kernel.
//!
//! The engine is the **sole boundary** between the desktop app (Tauri) and
//! the kernel (Clyffy). Tauri depends on this crate only — never on Clyffy
//! directly.
//!
//! # Feature Gates
//!
//! - `kernel` (default) — full internal detail, dev builds
//! - `engine` — IP-remapped, customer release builds
//!
//! These are mutually exclusive. Enabling both is a compile error.

// ═══════════════════════════════════════════════════════════════
// Feature gate enforcement
// ═══════════════════════════════════════════════════════════════

#[cfg(all(feature = "kernel", feature = "engine"))]
compile_error!("Cannot enable both 'kernel' and 'engine' features. Pick one.");

#[cfg(not(any(feature = "kernel", feature = "engine")))]
compile_error!("Must enable either 'kernel' or 'engine' feature.");

// ═══════════════════════════════════════════════════════════════
// Modules
// ═══════════════════════════════════════════════════════════════

/// IP protection vocabulary — `ip_term!()` macro and dictionary.
pub mod ip;

/// Signal routing — broadcast channels and typed payloads.
pub mod signals;

/// Platform facade — public API for persistence, health, config.
pub mod platform;

/// Claude integration — MCP server, tool registry, council, provider client.
pub mod claude;

/// AI provider SSOT — every model / inference vendor DevPulse knows about.
/// Pure data, no runtime state. Read by the lane router, devtools, council.
pub mod ai_providers;

/// Vision pipeline foundation — governor, metrics, shared DTOs.
/// Backs the capture → SigLip → sink chain exposed via `/devtools/vision`.
pub mod vision;

// ═══════════════════════════════════════════════════════════════
// Re-exports
// ═══════════════════════════════════════════════════════════════

use signals::{
    Delivery, Signal, SignalRouter, SignalSource, SignalVariant, StateStore, SystemPayload,
    SystemStatus,
};

/// The Engine — signal fabric and public API.
///
/// Engine owns the signal router (fan-out + interest) and the state store
/// (latest value of every state kind). This is the public facade.
/// Clyffy subscribes to signals for internal processing.
///
/// A cheap-to-clone handle (`Arc` inside): the desktop shell keeps one,
/// and the platform's services receive clones so they publish directly.
#[derive(Clone)]
pub struct Engine {
    router: std::sync::Arc<SignalRouter>,
    state: std::sync::Arc<StateStore>,
}

impl Engine {
    /// Boot the engine.
    pub fn boot() -> Self {
        Self {
            router: std::sync::Arc::new(SignalRouter::new()),
            state: std::sync::Arc::new(StateStore::new()),
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
        self.emit(signal);
    }

    /// Get a reference to the signal router.
    pub fn router(&self) -> &SignalRouter {
        &self.router
    }

    /// Get a reference to the state store.
    pub fn state(&self) -> &StateStore {
        &self.state
    }

    /// Publish a signal. Delivery comes from the kind's contract: a state
    /// signal is recorded (stamped with the next revision) before it fans
    /// out; an event fans out as-is. Returns the number of subscribers
    /// reached.
    pub fn emit(&self, signal: Signal) -> usize {
        let signal = match signal.payload.kind().spec().delivery {
            Delivery::State => self.state.record(signal),
            Delivery::Event => signal,
        };
        self.router.emit(signal)
    }
}
