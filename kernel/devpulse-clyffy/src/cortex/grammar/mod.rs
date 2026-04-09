//! Grammar and constrained decoding ownership boundary.
//!
//! `llguidance` lives under the kernel because constrained decoding is part of
//! runtime inference behavior. The engine consumes kernel-owned config/state as
//! a facade; it does not define the canonical grammar shape.

pub mod config;

pub use config::GrammarConfig;
