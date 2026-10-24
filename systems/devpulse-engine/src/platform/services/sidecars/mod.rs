//! Managed-sidecar services — each runtime is a child process the
//! platform spawns, health-checks, and (eventually) hot-swaps.
//!
//! Each sidecar lives in its own folder so config, service wrapper,
//! and preflight checks colocate cleanly. Cross-sidecar code (the
//! `Service` trait, `Preflightable` trait, lifecycle macros) lives
//! one level up in [`super`].
//!
//! Family layout:
//! - **Model loaders** — `ollama`, `mistralrs`, `candle_vllm`. All
//!   speak HTTP, all serve inference. Devtool registry tier =
//!   `model_loader`.
//! - **Stores** — `surreal`, the graph store's server (plan 0007 Part S).
//! - Other sidecars (devforge, sherpa) currently live flat in [`super`];
//!   they migrate into this folder as their phases run.

pub mod ollama;
pub mod surreal;
