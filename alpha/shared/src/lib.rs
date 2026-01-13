// shared/src/lib.rs

//! DevPulse Shared - Contracts and Types
//!
//! This crate contains ONLY:
//! - Type definitions (newtypes, enums, structs)
//! - Traits (Expert, etc.)
//! - Path configuration (SSOT via OnceLock)
//!
//! NO business logic. NO implementations beyond trait definitions.

pub mod config;
pub mod types;
pub mod vault;

// Re-export commonly used types
pub use config::paths::get_paths;
pub use types::{
    // Adapter types (SSOT for adapters)
    adapter::{AdapterKind, AdapterInfo, LlmProvider},
    // Signal Atomic Contract (SSOT)
    header::{current_time_millis, SignalHeader, SignalSource},
    // IDs
    ids::{BlobHash, ProjectId, SessionId},
    // Signal routing
    profile::{CollectionSet, DataTier, ModelTier, Processing, SignalProfile, ToolSet},
    // Signal sinks (SSOT)
    sink::SinkKind,
    // Domain signals
    signal::SignalKind,
};

// Secure vault re-exports
pub use vault::{SecureVault, VaultError, Adapterstatus, KNOWN_ADAPTERS};
pub use zeroize::Zeroizing;
