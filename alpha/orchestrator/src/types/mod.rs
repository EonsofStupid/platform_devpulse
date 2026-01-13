// orchestrator/src/types/mod.rs

//! Orchestrator-owned types (IP)
//!
//! These types are sensitive IP and live in orchestrator, not shared.

pub mod expert;
pub mod infra_signal;
pub mod toon;

pub use expert::{Expert, ExpertCapabilities, ExpertOutput, ExpertRegistry};
pub use toon::Toon;
pub use infra_signal::{InfraSignal, Direction, Outcome};
