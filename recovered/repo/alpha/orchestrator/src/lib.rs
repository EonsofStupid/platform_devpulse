// orchestrator/src/lib.rs

//! DevPulse Orchestrator
//!
//! The orchestrator is the llm of DevPulse. It:
//! - Routes signals via SignalKind::profile()
//! - Executes rumination chains (4-15 hops)
//! - Manages ephemeral frames (personas)
//! - Coordinates sub-agents (experts)
//! - Handles all storage (infra)

pub mod adapters;
pub mod chat;
pub mod cortex;
pub mod frames;
pub mod github;
pub mod infra;
pub mod runtime;
pub mod sub_agents;
pub mod types;

// Re-export key types
pub use chat::ChatEngine;
pub use cortex::{CostarBuilder, Router, Rumination};
pub use frames::FrameManager;
pub use github::{GitHubClient, GitHubValidator};
pub use runtime::{DevPulseRuntime, Experiments, RuntimeHandle};
pub use types::{Expert, ExpertCapabilities, ExpertOutput, ExpertRegistry, Toon};

// Re-export VL backend for model loading
pub use infra::vision::vl::VLBackend;

// Re-export Infra (the CoT/Rumination foundation)
pub use infra::Infra;
