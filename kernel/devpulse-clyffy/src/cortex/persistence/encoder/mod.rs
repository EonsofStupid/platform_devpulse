//! # `cortex::persistence::encoder` — RRO trifecta encoder/reranker
//!
//! Cross-encoder for the RRO trifecta. Scores query-document pairs for
//! relevance after the embedder's broad ANN search narrows the candidate
//! set. Lives next to its sibling deps (turso, duckdb, moka, embedder,
//! rro) so the layman entry [`crate::cortex::rro`] composes the trifecta
//! by linking these folders, not by storing them inline.
//!
//! ## Loading
//!
//! Encoder is **NOT hardcoded**. The model-loader resolves the artifact
//! based on the active 0.5B/270MB tier slot — adapt to the user's
//! hardware tier per `project_model_selection_tiered.md`. This module
//! re-exports the model-loader-side handle under a kernel-vocabulary
//! name; the caller (engine boot) resolves the slot, hands the path to
//! the handle, and stores it in the runtime.
//!
//! Feature-gated on `model-loader` (which transitively enables
//! `model-loader/ort-backend` per the kernel `Cargo.toml`).

#[cfg(feature = "model-loader")]
pub use model_loader::Qwen3Reranker as EncoderHandle;
