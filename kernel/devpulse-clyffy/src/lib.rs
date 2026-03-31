//! `DevPulse` Clyffy — AI orchestrator kernel.

/// Cortex subsystem — persistence, reasoning, minions, KV cache.
pub mod cortex;

/// Re-export model-loader for engine consumption.
/// The model-loader crate is self-enclosed — clyffy does NOT depend on it
/// for its own functionality. This re-export exists solely so the engine
/// can access model-loader types through the existing dependency chain.
#[cfg(feature = "model-loader")]
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
