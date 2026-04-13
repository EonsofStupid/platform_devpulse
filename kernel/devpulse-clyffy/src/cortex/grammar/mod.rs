//! Grammar and constrained decoding ownership boundary.
//!
//! `llguidance` lives under the kernel because constrained decoding is part of
//! runtime inference behavior. The engine consumes kernel-owned config/state as
//! a facade; it does not define the canonical grammar shape.

pub mod config;
pub mod system_libsql;

pub use config::GrammarConfig;
pub use system_libsql::{sync_grammar_service_from_config, GRAMMAR_SERVICE_PRIMARY_ID};
