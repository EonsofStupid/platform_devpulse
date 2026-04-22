//! Platform configuration — per-module, figment-layered.
//!
//! # Architecture
//!
//! Config is split along the five-axis module taxonomy (see
//! [`super::module::ModuleAxis`]). Each axis has its own submodule, each
//! submodule owns one `{Module}Config` per module.
//!
//! | Submodule | Folder mirror | Purpose |
//! |---|---|---|
//! | [`runtime`] | `config/platform/runtime/` | Platform primitives (boot, portable, telemetry, network, windows) |
//! | [`stores`] | `config/platform/stores/` | Persistent state backends |
//! | [`runtimes`] | `config/platform/runtimes/` | Execution backends |
//! | [`capabilities`] | `config/platform/capabilities/` | Product-facing user verbs |
//! | [`integrations`] | `config/platform/integrations/` | External providers |
//!
//! The [`loader`] submodule composes all five axes into `PlatformConfig`
//! via a figment provider stack (defaults → overlay → env).
//!
//! # Migration state (S0, 2026-04-21)
//!
//! This module is mid-rewrite. The legacy monolith lives at
//! [`legacy`] and is **still the authoritative loader** during S0.
//!
//! Every re-export from `legacy` in this file corresponds to a pending
//! migration. As each module rebuilds to the charter shape (see
//! `scripts/docs/sprints/SPRINT-FOUNDATIONAL-REBUILD-MODULE-CHARTER.md`):
//!
//! 1. Its types move from `legacy` into the appropriate axis submodule.
//! 2. Its entry is removed from the re-export list below.
//! 3. Its section is deleted from `legacy.rs`.
//!
//! When the re-export list is empty, `legacy.rs` is deleted.
//! This module is the migration's progress bar.

mod legacy;

pub mod capabilities;
pub mod integrations;
pub mod loader;
pub mod runtime;
pub mod runtimes;
pub mod stores;

// ════════════════════════════════════════════════════════════════════
// Legacy re-exports — shrinks as modules migrate.
// Each entry here means "this type still lives in the monolith."
// ════════════════════════════════════════════════════════════════════

pub use legacy::{
    retrieval_param_meta, sanitize_path, CacheServiceEntry, CatalogEntry, CatalogOption, DataScope,
    DatabaseConfig, ExecutionLane, LaneToggle, LaneTraceConfig, ModelLoaderServiceEntry,
    PlatformBootConfig, PlatformConfig, RetrievalConfig, RetrievalParamMeta, RetrievalPreset,
    ServiceEntry, VectorServiceEntry, WindowsConfig,
};
