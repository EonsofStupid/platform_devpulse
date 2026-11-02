//! Reasoning pipeline — chains, HMM, RRO state machine.
//!
//! Authoritative SSOT for reasoning runtime types. Engine `platform`
//! module re-exports `RroState`, `RroDepth`, `RroStateHandle`,
//! `RroStateSnapshot`, `RroStateTransition`, and `DEFAULT_PROXIMITY`
//! through the IP-NOTE pattern at `systems/devpulse-engine/src/platform/mod.rs`.

/// Chain-of-thought reasoning pipeline.
pub mod chains;
/// Hidden Markov Model reasoning adapter.
pub mod hmm;
/// RRO state machine — public-vocabulary types + runtime handle.
pub mod state;
/// HMM transition matrix.
pub mod transition_matrix;

pub use state::{
    DEFAULT_PROXIMITY, RroDepth, RroState, RroStateHandle, RroStateSnapshot, RroStateTransition,
};
