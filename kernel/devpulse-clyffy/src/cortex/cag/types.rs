//! CAG pipeline types.
//!
//! Concrete data structures flowing through the retrieval pipeline.
//! These types are the shared language between pipeline stages —
//! every stage consumes and produces these, not raw primitives.

use serde::{Deserialize, Serialize};
use std::time::Duration;

// ═══════════════════════════════════════════════════════════════
// Vector types
// ═══════════════════════════════════════════════════════════════

/// Sparse vector for BM25 / keyword-based retrieval.
///
/// Mirrors `persistence::traits::SparseVector` but lives in the CAG
/// domain. Conversion between the two is free (same layout).
#[derive(Debug, Clone, Default)]
pub struct SparseVector {
    /// Non-zero dimension indices.
    pub indices: Vec<u32>,
    /// Values at those indices.
    pub values: Vec<f32>,
}

impl SparseVector {
    /// Whether this sparse vector has any non-zero entries.
    pub fn is_empty(&self) -> bool {
        self.indices.is_empty()
    }

    /// Number of non-zero entries.
    pub fn nnz(&self) -> usize {
        self.indices.len()
    }
}

/// Convert from persistence-layer sparse vector to CAG sparse vector.
impl From<crate::cortex::persistence::traits::SparseVector> for SparseVector {
    fn from(v: crate::cortex::persistence::traits::SparseVector) -> Self {
        Self {
            indices: v.indices,
            values: v.values,
        }
    }
}

/// Convert from CAG sparse vector to persistence-layer sparse vector.
impl From<SparseVector> for crate::cortex::persistence::traits::SparseVector {
    fn from(v: SparseVector) -> Self {
        Self {
            indices: v.indices,
            values: v.values,
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Chunk types (pipeline data flow)
// ═══════════════════════════════════════════════════════════════

/// Classification of indexed content.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ChunkType {
    /// Source code.
    Code,
    /// Documentation / comments.
    Documentation,
    /// Config files (toml, json, yaml).
    Config,
    /// Conversation history.
    Conversation,
    /// User memory / preferences.
    Memory,
    /// Error logs / stack traces.
    Error,
    /// Project structure / manifest.
    Structure,
}

/// Payload attached to each indexed point in the vector store.
///
/// Stored as JSON in RRO alongside the embedding vector.
/// Contains enough metadata for filtering and preview without hydration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkPayload {
    /// Unique chunk ID — matches the primary key in Turso.
    pub chunk_id: String,
    /// Source document path.
    pub source_path: String,
    /// Content classification.
    pub chunk_type: ChunkType,
    /// Project ID for multi-tenancy filtering.
    pub project_id: String,
    /// Session ID for recency filtering.
    pub session_id: Option<String>,
    /// Unix timestamp for time-decay scoring.
    pub created_at: i64,
    /// First 200 chars of content for quick display.
    pub preview: String,
    /// Semantic tags extracted by GUARDIAN minion.
    pub tags: Vec<String>,
    /// Language / framework markers for tech-stack filtering.
    pub tech_stack: Vec<String>,
}

/// A chunk scored by vector similarity (output of search stage).
///
/// Has metadata + score but NOT full content — that comes from hydration.
#[derive(Debug, Clone)]
pub struct ScoredChunk {
    /// Point ID in the vector store.
    pub id: String,
    /// Similarity score from vector search or reranker.
    pub score: f32,
    /// Payload metadata from the vector store.
    pub payload: ChunkPayload,
}

/// A fully hydrated chunk ready for context assembly.
///
/// Has full content (from Turso) plus the search score.
#[derive(Debug, Clone)]
pub struct RetrievedChunk {
    /// Chunk ID.
    pub id: String,
    /// Final relevance score (from reranker if available, else search score).
    pub score: f32,
    /// Full document content from Turso hydration.
    pub content: String,
    /// Source path for attribution.
    pub source: String,
    /// Content classification.
    pub chunk_type: ChunkType,
    /// Approximate token count of `content`.
    pub token_count: usize,
}

// ═══════════════════════════════════════════════════════════════
// Context blob (pipeline output)
// ═══════════════════════════════════════════════════════════════

/// Assembled context ready for prompt injection.
///
/// The final output of the CAG pipeline. Contains:
/// - Retrieved chunks (scored, hydrated, deduplicated, budget-trimmed)
/// - Project-level context (always included)
/// - Token accounting for the generation model
#[derive(Debug, Clone)]
pub struct ContextBlob {
    /// Project-level context (always included, counts against budget).
    pub project_context: String,
    /// Retrieved chunks in relevance order.
    pub chunks: Vec<RetrievedChunk>,
    /// Total token count across all content.
    pub total_tokens: usize,
    /// How many chunks were dropped due to budget.
    pub dropped_count: usize,
}

impl ContextBlob {
    /// Whether this blob has any retrieved content.
    pub fn is_empty(&self) -> bool {
        self.chunks.is_empty() && self.project_context.is_empty()
    }

    /// Number of retrieved chunks included.
    pub fn chunk_count(&self) -> usize {
        self.chunks.len()
    }
}

// ═══════════════════════════════════════════════════════════════
// Pipeline metrics (observability)
// ═══════════════════════════════════════════════════════════════

/// Latency and quality metrics for a single pipeline execution.
///
/// Emitted as an analytics signal after each retrieval.
#[derive(Debug, Clone)]
pub struct PipelineMetrics {
    /// Time spent generating the query embedding.
    pub embed_latency: Duration,
    /// Time spent in vector search (dense + sparse + fusion).
    pub search_latency: Duration,
    /// Time spent in cross-encoder reranking.
    pub rerank_latency: Duration,
    /// Time spent hydrating chunks from Turso.
    pub hydrate_latency: Duration,
    /// Time spent assembling the context blob.
    pub assemble_latency: Duration,
    /// Total end-to-end pipeline latency.
    pub total_latency: Duration,
    /// Number of candidates from vector search (before reranking).
    pub search_candidates: usize,
    /// Number of chunks after reranking.
    pub reranked_count: usize,
    /// Number of chunks in final context blob.
    pub final_chunk_count: usize,
    /// Total tokens in assembled context.
    pub context_tokens: usize,
    /// Whether the Moka cache was hit for this query.
    pub cache_hit: bool,
}

// ═══════════════════════════════════════════════════════════════
// Pipeline configuration
// ═══════════════════════════════════════════════════════════════

/// Configuration for a single pipeline execution.
#[derive(Debug, Clone)]
pub struct PipelineConfig {
    /// Maximum tokens in assembled context.
    pub max_context_tokens: usize,
    /// Number of candidates to retrieve from vector search.
    pub search_limit: usize,
    /// Number of top results after reranking.
    pub rerank_top_k: usize,
    /// Jaccard similarity threshold for deduplication (0.0–1.0).
    pub dedup_threshold: f32,
    /// RRF fusion constant (typically 60.0).
    pub rrf_k: f32,
    /// Reranker batch size for memory efficiency.
    pub rerank_batch_size: usize,
}

impl Default for PipelineConfig {
    fn default() -> Self {
        Self {
            max_context_tokens: 4096,
            search_limit: 50,
            rerank_top_k: 10,
            dedup_threshold: 0.7,
            rrf_k: 60.0,
            rerank_batch_size: 16,
        }
    }
}
