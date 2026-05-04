//! # `cortex::persistence::burn` — Burn ML framework integration
//!
//! Burn is the locked authorship target for the RRO encoder per
//! `project_rro_burn_authorship.md`. Real integration is deferred to
//! the dedicated RRO encoder plan; this module exists so the persistence
//! barrel can declare `pub mod burn;` and the layman entry
//! [`crate::cortex::rro`] can compose the embedded-deps group without
//! drift.
//!
//! General inference stays multi-engine for testing (llama.cpp,
//! candle-vllm, mistral.rs); Burn is reserved specifically for the
//! custom RRO encoder kernel-internal authorship.
