//! LLM constrained-decoding runtime — `llguidance`-backed.
//!
//! This is structured-output enforcement on the model token stream:
//! JSON-schema, regex, enum, and custom grammars that the kernel applies
//! during decoding. It is distinct from any user-facing writing-grammar /
//! spelling tool (Harper) — they share the word "grammar" only by accident.
//!
//! `llguidance` lives under the kernel because constrained decoding is
//! part of runtime inference behavior. The engine consumes kernel-owned
//! config/state as a facade; it does not define the canonical shape.
//!
//! Engine `platform` module re-exports `GrammarKind`, `GrammarStatus`,
//! `GrammarFailure`, `GrammarSnapshot`, and `GrammarHandle` through the
//! IP-NOTE pattern at `systems/devpulse-engine/src/platform/mod.rs`.

pub mod config;
pub mod handle;
pub mod system_libsql;

pub use config::GrammarConfig;
pub use handle::{GrammarFailure, GrammarHandle, GrammarKind, GrammarSnapshot, GrammarStatus};
pub use system_libsql::{sync_grammar_service_from_config, GRAMMAR_SERVICE_PRIMARY_ID};
