//! Capability backend traits — embedding, reranking, vision encoding.
//!
//! These are separate from the `InferenceBackend` trait (brain/LLM) because
//! they have different shapes: embedders return vectors, rerankers return
//! scores, vision encoders accept images not tokens.
//!
//! Each trait is implemented by a single-purpose backend file:
//! - [`EmbeddingBackend`] → `backends/ort/embedder.rs` (Qwen3-Embedding)
//! - [`RerankerBackend`] → `backends/ort/reranker.rs` (Qwen3-Reranker)
//! - [`VisionEmbeddingBackend`] → `backends/candle/siglip.rs` (SigLIP2)

use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::Path;

// ── Embedding ─────────────────────────────────────────────────────

/// A dense text embedder — produces a fixed-size vector per input string.
///
/// Used for RAG retrieval, semantic search, clustering.
/// Qwen3-Embedding-0.6B produces 1024-dim vectors by default.
pub trait EmbeddingBackend: Send {
    /// Load model from disk. Returns memory footprint.
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint>;

    /// Unload model and free memory.
    fn unload(&mut self) -> anyhow::Result<()>;

    /// Embed a batch of texts. Returns one vector per input, all same dimension.
    ///
    /// # Errors
    /// Returns error if model not loaded, tokenization fails, or tensor ops fail.
    fn embed(&self, texts: &[&str]) -> anyhow::Result<Vec<Vec<f32>>>;

    /// Embed a single text. Convenience wrapper over `embed`.
    fn embed_one(&self, text: &str) -> anyhow::Result<Vec<f32>> {
        let mut results = self.embed(&[text])?;
        results
            .pop()
            .ok_or_else(|| anyhow::anyhow!("Embedding returned empty result"))
    }

    /// Output vector dimension (e.g. 1024 for Qwen3-Embedding-0.6B).
    fn embedding_dim(&self) -> usize;

    /// Current memory footprint.
    fn memory_usage(&self) -> MemoryFootprint;
}

// ── Reranking ─────────────────────────────────────────────────────

/// A cross-encoder reranker — scores query-document pairs for relevance.
///
/// Unlike embedders (which produce vectors then use cosine similarity),
/// rerankers read the query AND document together and produce a single
/// relevance score. Higher quality but slower — used as a second-stage
/// refinement after initial vector search.
pub trait RerankerBackend: Send {
    /// Load model from disk.
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint>;

    /// Unload model.
    fn unload(&mut self) -> anyhow::Result<()>;

    /// Score a list of documents against a query. Returns one score per doc.
    /// Scores are typically normalized to [0, 1] where higher = more relevant.
    ///
    /// # Errors
    /// Returns error if model not loaded or inference fails.
    fn rerank(&self, query: &str, documents: &[&str]) -> anyhow::Result<Vec<f32>>;

    /// Memory footprint.
    fn memory_usage(&self) -> MemoryFootprint;
}

// ── Vision Embedding ──────────────────────────────────────────────

/// A vision encoder — produces image embeddings for visual search/understanding.
///
/// SigLIP2-SO400M produces 1152-dim vectors at 384x384 resolution.
/// Used for screenshot understanding, visual search, cross-modal retrieval.
pub trait VisionEmbeddingBackend: Send {
    /// Load model from disk.
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint>;

    /// Unload model.
    fn unload(&mut self) -> anyhow::Result<()>;

    /// Encode a single image file path. Returns the image embedding vector.
    ///
    /// Image is loaded, resized, normalized according to the model's
    /// expected preprocessing (SigLIP uses 384x384, ImageNet normalization).
    fn encode_image(&self, path: &Path) -> anyhow::Result<Vec<f32>>;

    /// Encode raw RGB pixel data. Expects `width * height * 3` bytes in `u8` range.
    ///
    /// Use this for in-memory screenshots or frames from capture pipelines,
    /// avoiding round-trip through disk.
    fn encode_rgb(&self, rgb_bytes: &[u8], width: u32, height: u32) -> anyhow::Result<Vec<f32>>;

    /// Output embedding dimension.
    fn embedding_dim(&self) -> usize;

    /// Memory footprint.
    fn memory_usage(&self) -> MemoryFootprint;
}
