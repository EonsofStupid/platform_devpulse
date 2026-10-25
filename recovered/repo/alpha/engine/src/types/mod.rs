// engine/src/types/mod.rs

//! Engine-local public types
//!
//! These types form engine's public API surface.
//! They wrap/translate orchestrator internals without exposing them.
//!
//! RULE: No orchestrator types in this module's public API.

mod config;
mod model;

pub use config::ConfigEntry;
pub use model::{DiscoveredModel, ModelInfo};
