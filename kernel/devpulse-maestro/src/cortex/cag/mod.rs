//! Context-Augmented Generation (CAG) pipeline.
//!
//! The retrieval pipeline that feeds pristine context to the generation model.
//! Pipeline stages: embed → hybrid search → RRF fuse → deduplicate → rerank → hydrate → assemble.
//!
//! Architecture:
//! - `traits` — Stage contracts (Embedder, SparseEncoder, Reranker, Hydrator, ContextAssembler)
//! - `types` — Data types flowing between stages (ScoredChunk, RetrievedChunk, ContextBlob, etc.)
//! - `pipeline` — Orchestrator that wires stages together (RetrievalPipeline, RRF fusion, dedup)

pub mod pipeline;
pub mod traits;
pub mod types;

// Re-exports
pub use pipeline::{deduplicate, jaccard_similarity, rrf_fuse, RetrievalPipeline};
pub use traits::{ContextAssembler, Embedder, Hydrator, Reranker, SparseEncoder};
pub use types::{
    ChunkPayload, ChunkType, ContextBlob, PipelineConfig, PipelineMetrics, RetrievedChunk,
    ScoredChunk, SparseVector,
};
