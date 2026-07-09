//! `DevPulse` engine — DevPulse's core backend: platform services, boot,
//! config, signals, wire client.
//!
//! The engine is the **sole boundary** between the desktop app (Tauri) and
//! Clyffy (headless AI layer, clyffyos repo — reached over the wire).
//! Tauri depends on this crate only — never on Clyffy directly.
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

#[cfg(all(feature = "full", feature = "engine"))]
compile_error!("Cannot enable both 'full' and 'engine' features. Pick one.");

#[cfg(not(any(feature = "full", feature = "engine")))]
compile_error!("Must enable either 'full' or 'engine' feature.");

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

use signals::{Signal, SignalRouter, SignalSource, SignalVariant, SystemPayload, SystemStatus};

/// The Engine — signal router and public API.
///
/// Engine owns the signal router. This is the public facade.
/// Clyffy subscribes to signals for internal processing.
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
