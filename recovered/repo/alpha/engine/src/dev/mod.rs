// engine/src/dev/mod.rs

//! Dev-only exports - Feature-gated orchestrator access
//!
//! Allows Lab and dev builds to access orchestrator internals for:
//! - Debugging rumination chains
//! - Monitoring InfraSignals
//! - Inspecting CAG assembly context
//!
//! STRIPPED from release builds via --no-default-features

// ─── InfraSignal (internal signal types) ───────────────────────────────────
pub use orchestrator::types::infra_signal::{Direction as InfraDirection, InfraSignal, Outcome};

// ─── Rumination (multi-hop execution) ──────────────────────────────────────
pub use orchestrator::cortex::rumination::{Direction, HopOutput, MissionPlan};

// ─── CAG (context assembly) ────────────────────────────────────────────────
pub use orchestrator::cortex::cag::{AssembledContext, ContextChunk};

// ─── Adapters (inference/storage backends) ─────────────────────────────────
pub use orchestrator::adapters::{
    EmbeddingAdapter, InferParams, InferResponse, InferenceAdapter, StorageAdapter,
};

// ─── Model Catalog ─────────────────────────────────────────────────────────
pub use orchestrator::infra::catalog::models::ModelRegistry;
pub use orchestrator::infra::catalog::adapters::{ModelInfo as InternalModelInfo, AdapterKind};
