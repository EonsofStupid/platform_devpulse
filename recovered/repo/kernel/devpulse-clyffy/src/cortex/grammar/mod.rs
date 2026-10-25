//! Grammar and constrained decoding ownership boundary.
//!
//! `llguidance` lives under the kernel because constrained decoding is part of
//! runtime inference behavior. The engine consumes kernel-owned config/state as
//! a facade; it does not define the canonical grammar shape.
//!
//! Authoritative SSOT for grammar runtime types. Engine `platform` module
//! re-exports `GrammarKind`, `GrammarStatus`, `GrammarFailure`,
//! `GrammarSnapshot`, and `GrammarHandle` through the IP-NOTE pattern at
//! `systems/devpulse-engine/src/platform/mod.rs`.

pub mod config;
pub mod handle;
pub mod system_libsql;

pub use config::GrammarConfig;
pub use handle::{GrammarFailure, GrammarHandle, GrammarKind, GrammarSnapshot, GrammarStatus};
pub use system_libsql::{sync_grammar_service_from_config, GRAMMAR_SERVICE_PRIMARY_ID};
