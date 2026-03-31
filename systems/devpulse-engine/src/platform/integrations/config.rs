//! In-memory `ConfigBackend` for initial integration.
//!
//! Uses model-loader's built-in `MemoryConfig` for now.
//! Phase 6.2+ replaces this with a proper LibSQL-backed implementation
//! once the relational service API is stabilized for model config.

// Re-export the memory-backed config from model-loader.
// The engine boot sequence will create this and pass it to ModelLoaderService.
// When we wire LibSQL, we implement ConfigBackend against the engine's
// RelationalService — but that requires async-to-sync bridging that matches
// the existing service architecture.

pub use devpulse_clyffy::model_loader::MemoryConfig;

// TODO(Phase 6.2): Implement LibSqlConfig against RelationalService.
// The model-loader's ConfigBackend trait is sync. The engine's LibSQL
// service is async. The bridge pattern from the inference thread applies
// here too — use flume or blocking_lock.
