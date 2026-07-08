//! `DevPulse` Clyffy — AI orchestrator kernel.

/// Connectome subsystem — persistence, reasoning, minions, KV cache.
pub mod connectome;

/// Clyffy interaction templates — kernel SSOT for structured,
/// scripted exchanges between Clyffy and the user. The Setup Wizard
/// is the canonical instance; future templates add hardware-change
/// reconfigure, welcome-back, and broken-slot recovery flows.
pub mod interactions;

pub use interactions::{
    InteractionError, InteractionPhase, InteractionTemplate, InteractionTrigger,
};

/// Re-export model-loader for engine consumption.
/// The model-loader crate is self-enclosed — clyffy does NOT depend on it
/// for its own functionality. This re-export exists solely so the engine
/// can access model-loader types through the existing dependency chain.
#[cfg(feature = "model-loader")]
pub use model_loader;

/// Top-level orchestrator facade.
#[derive(Default)]
pub struct Connectome {
    // Main entry point
}

impl Connectome {
    /// Create a new orchestrator instance.
    pub fn new() -> Self {
        Self::default()
    }
}
