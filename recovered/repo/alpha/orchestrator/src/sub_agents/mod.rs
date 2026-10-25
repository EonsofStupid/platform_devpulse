// orchestrator/src/sub_agents/mod.rs

//! Sub-a gents(Experts)
//!
//! Each sub-agent is a specialist that implements the Expert trait.
//! Sub-agents have manifest.toml files defining their capabilities.

pub mod guardian;

use crate::types::ExpertRegistry;

/// Initialize all sub-agents and register them
pub fn init_registry() -> ExpertRegistry {
    let mut registry = ExpertRegistry::new();

    // Register built-in experts
    registry.register(Box::new(guardian::Guardian::new()));

    // TODO: Register more experts
    // registry.register(Box::new(psych::Psych::new()));
    // registry.register(Box::new(scribe::Scribe::new()));
    // registry.register(Box::new(vision::Vision::new()));

    registry
}
