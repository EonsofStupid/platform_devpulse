//! # `connectome::rro` — RRO trifecta (layman entry)
//!
//! Sibling to [`connectome::llguidance`]. Layman barrel that links to the
//! embedded deps the RRO trifecta composes — vector store, embedder,
//! encoder. No types are owned here; everything is `pub use`.
//!
//! "RRO" is the public-vocabulary name for the embedded retrieval unit:
//! an embedder produces dense vectors, an encoder produces the rerank
//! signal, and the vector store (Qdrant fork wrapped at
//! [`connectome::persistence::rro`]) holds the index. The state machine
//! that drives gather → process → ruminate → ready lives at
//! [`connectome::reasoning::state`] and is re-exposed below under its
//! customer-facing name.
//!
//! Engine `platform` module re-exports the same symbols through the
//! IP-NOTE pattern at `systems/devpulse-engine/src/platform/mod.rs`.

// State machine — runtime handle + types from the reasoning module.
pub use crate::connectome::reasoning::{
    RroDepth, RroState, RroStateHandle, RroStateSnapshot, RroStateTransition, DEFAULT_PROXIMITY,
};

// Vector store adapter — feature-gated to mirror the dep gate at
// `connectome::persistence::mod.rs:32-33,50-51`.
#[cfg(feature = "rro")]
pub use crate::connectome::persistence::RroAdapter;

// Embedder — broad-ANN candidate generator. Path-equivalence link to
// the dep folder; CandleEmbedder lives at `connectome::persistence::embedder`
// and is feature-gated on `candle`.
#[cfg(feature = "candle")]
pub use crate::connectome::persistence::embedder;

// Encoder/reranker — second-stage relevance scoring. Path-equivalence
// link to the dep folder; loads via model-loader at the 0.5B/270MB
// tier slot — NOTHING HARDCODED.
#[cfg(feature = "model-loader")]
pub use crate::connectome::persistence::encoder;
