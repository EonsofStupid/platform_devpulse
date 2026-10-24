//! Type-time suggestion service.
//!
//! Drives the chat-input intellisense layer: as the user types a partial
//! prompt, the service embeds the partial via the `chat.suggest` slot
//! and runs a HNSW cosine query against the user's prompt history in
//! the `clyffy/devpulse` namespace. With no embedder answering (no model
//! loaded), it recalls by the partial's words through the full-text index
//! instead (plan 0001 B3.9). Returns top-K matches ordered by a
//! recency × similarity × accepted-frequency rank.
//!
//! # Boundaries
//!
//! - **Embedding**: delegated to any [`crate::cortex::cag::traits::Embedder`]
//!   implementation. The runtime binds this to the `chat.suggest` slot
//!   (Harrier 0.6B, 1024-d, BF16) via the model-loader pool.
//! - **Storage**: `chat_prompt` table in the `clyffy/devpulse`
//!   namespace, schema lives in
//!   [`crate::cortex::persistence::surreal::client`]. HNSW index on
//!   `embedding` is the recall path.
//! - **Ranking**: pure Rust post-processing on the SurrealDB candidate
//!   set. No per-query model round-trip beyond the single embedding
//!   pass — sub-50 ms p99 target.

mod service;

#[cfg(feature = "model-loader")]
mod embedder;

pub use service::{Suggestion, SuggestionService};

#[cfg(feature = "model-loader")]
pub use embedder::ChatSuggestEmbedder;
