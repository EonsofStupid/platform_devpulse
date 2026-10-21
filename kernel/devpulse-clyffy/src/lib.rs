//! `DevPulse` Clyffy — AI orchestrator kernel.

/// Cortex subsystem — persistence, reasoning, minions, KV cache.
pub mod cortex;

/// Providers — every AI you bring (subscription agents, desktop apps), as
/// definition files: detection, versions, sign-in state and the vendor's own
/// commands.
pub mod providers;

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
/// Available with `model-loader-core` (types + hardware, no inference
/// backends); `model-loader` adds the compiled-in backends on top.
#[cfg(feature = "model-loader-core")]
pub use model_loader;

/// Top-level orchestrator facade.
#[derive(Default)]
pub struct Cortex {
    // Main entry point
}

impl Cortex {
    /// Create a new orchestrator instance.
    pub fn new() -> Self {
        Self::default()
    }
}
