//! CAG pipeline stage traits.
//!
//! Each stage of the retrieval pipeline is a trait contract:
//!   `Embedder` → `SparseEncoder` → `HybridSearcher` → `Reranker` → `ContextAssembler`
//!
//! Implementations will be backed by:
//!   - Candle (Qwen3-Embedding, Qwen3-Reranker)
//!   - RRO (hybrid search with RRF fusion)
//!   - `LibSQL` (document hydration)
//!
//! These traits define WHAT each stage must do.
//! HOW is deferred to concrete implementations.

use anyhow::Result;

use super::types::{ContextBlob, PipelineConfig, RetrievedChunk, ScoredChunk, SparseVector};

/// Dense embedding generation.
///
/// Converts text → fixed-dimension dense vector for semantic similarity.
/// Backed by Qwen3-Embedding-0.6B via Candle (GGUF quantized).
#[allow(async_fn_in_trait)]
pub trait Embedder: Send + Sync {
    /// Dimensionality of output vectors (e.g. 1024 for Qwen3-Embedding).
    fn dimension(&self) -> u32;

    /// Embed a single text into a dense vector.
    async fn embed(&self, text: &str) -> Result<Vec<f32>>;

    /// Batch embed multiple texts. Default impl calls `embed` sequentially.
    async fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>> {
        let mut results = Vec::with_capacity(texts.len());
        for text in texts {
            results.push(self.embed(text).await?);
        }
        Ok(results)
    }
}

/// Sparse vector generation for keyword-based retrieval (BM25).
///
/// Converts text → sparse vector of (`token_index`, `tf_idf_score`) pairs.
/// Runs on CPU, no model required — purely statistical.
pub trait SparseEncoder: Send + Sync {
    /// Encode text into a sparse vector.
    fn encode(&self, text: &str) -> SparseVector;

    /// Update corpus statistics (IDF scores, average document length).
    /// Called periodically as new documents are indexed.
    fn update_corpus_stats(&mut self, idf: std::collections::HashMap<String, f32>, avgdl: f32);
}

/// Cross-encoder reranking.
///
/// Takes (query, document) pairs and scores relevance.
/// Backed by Qwen3-Reranker-0.6B via Candle (GGUF quantized).
/// More accurate than bi-encoder similarity but O(n) per query.
#[allow(async_fn_in_trait)]
pub trait Reranker: Send + Sync {
    /// Score a batch of (query, document) pairs.
    /// Returns scores in the same order as input documents.
    async fn rerank(&self, query: &str, documents: &[ScoredChunk]) -> Result<Vec<f32>>;

    /// Maximum sequence length the reranker accepts.
    fn max_seq_len(&self) -> usize;
}

/// Context assembly — token-budgeted, deduplicated context blob construction.
///
/// Takes scored+hydrated chunks and assembles them into a `ContextBlob`
/// that fits within the generation model's context window.
pub trait ContextAssembler: Send + Sync {
    /// Assemble retrieved chunks into a context blob.
    ///
    /// Handles:
    /// - Token budget enforcement
    /// - Deduplication (Jaccard similarity threshold)
    /// - Priority ordering (reranker scores)
    /// - Project context injection
    ///
    /// # Errors
    /// Returns error if context assembly fails.
    fn assemble(
        &self,
        chunks: Vec<RetrievedChunk>,
        project_context: Option<String>,
        config: &PipelineConfig,
    ) -> Result<ContextBlob>;
}

/// Document hydration — resolves vector store point IDs to full content.
///
/// The vector store holds embeddings + minimal payload (preview, metadata).
/// Hydration fetches the full document content from `LibSQL` for prompt injection.
#[allow(async_fn_in_trait)]
pub trait Hydrator: Send + Sync {
    /// Hydrate scored chunks with full document content.
    /// Input: scored chunks with IDs from vector search.
    /// Output: retrieved chunks with full content from `LibSQL`.
    async fn hydrate(&self, chunks: Vec<ScoredChunk>) -> Result<Vec<RetrievedChunk>>;
}
