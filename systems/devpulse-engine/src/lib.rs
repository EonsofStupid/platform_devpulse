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
