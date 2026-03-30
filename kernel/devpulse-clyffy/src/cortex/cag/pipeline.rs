//! CAG pipeline orchestrator.
//!
//! Coordinates the retrieval pipeline stages:
//!   embed → search → rerank → hydrate → assemble
//!
//! Each stage is a trait object, making the pipeline testable
//! and swappable without touching orchestration logic.

use anyhow::Result;
use std::collections::{HashMap, HashSet};
use std::time::Instant;

use super::traits::{ContextAssembler, Embedder, Hydrator, Reranker, SparseEncoder};
use super::types::{ContextBlob, PipelineConfig, PipelineMetrics, ScoredChunk};
use crate::cortex::persistence::traits::{SparseVector as PersistenceSparseVector, VectorAdapter};

/// Reciprocal Rank Fusion — merges dense and sparse search results.
///
/// Each result set contributes `1 / (k + rank)` to a point's score.
/// Points appearing in both sets get higher fused scores.
#[allow(clippy::cast_precision_loss)]
pub fn rrf_fuse(
    dense: &[ScoredChunk],
    sparse: &[ScoredChunk],
    k: f32,
    limit: usize,
) -> Vec<ScoredChunk> {
    let mut scores: HashMap<String, f32> = HashMap::new();
    let mut chunks: HashMap<String, ScoredChunk> = HashMap::new();

    // Score from dense results
    dense.iter().enumerate().for_each(|(rank, chunk)| {
        let rrf_score = 1.0 / (k + rank as f32 + 1.0);
        *scores.entry(chunk.id.clone()).or_insert(0.0) += rrf_score;
        chunks.entry(chunk.id.clone()).or_insert_with(|| chunk.clone());
    });

    // Score from sparse results
    sparse.iter().enumerate().for_each(|(rank, chunk)| {
        let rrf_score = 1.0 / (k + rank as f32 + 1.0);
        *scores.entry(chunk.id.clone()).or_insert(0.0) += rrf_score;
        chunks.entry(chunk.id.clone()).or_insert_with(|| chunk.clone());
    });

    // Sort by fused score descending
    let mut results: Vec<_> = scores.into_iter().collect();
    results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    results
        .into_iter()
        .take(limit)
        .filter_map(|(id, score)| {
            chunks.remove(&id).map(|mut c| {
                c.score = score;
                c
            })
        })
        .collect()
}

/// Jaccard similarity between two texts (word-level).
#[allow(clippy::cast_precision_loss)]
pub fn jaccard_similarity(a: &str, b: &str) -> f32 {
    let set_a: HashSet<&str> = a.split_whitespace().collect();
    let set_b: HashSet<&str> = b.split_whitespace().collect();

    let intersection = set_a.intersection(&set_b).count();
    let union = set_a.union(&set_b).count();

    if union == 0 {
        0.0
    } else {
        intersection as f32 / union as f32
    }
}

/// Deduplicate scored chunks by Jaccard similarity on preview text.
pub fn deduplicate(chunks: Vec<ScoredChunk>, threshold: f32) -> Vec<ScoredChunk> {
    if chunks.len() < 2 {
        return chunks;
    }

    let mut keep = vec![true; chunks.len()];

    for i in 0..chunks.len() {
        if !keep[i] {
            continue;
        }
        for j in (i + 1)..chunks.len() {
            if !keep[j] {
                continue;
            }
            let sim = jaccard_similarity(&chunks[i].payload.preview, &chunks[j].payload.preview);
            if sim > threshold {
                if chunks[i].score >= chunks[j].score {
                    keep[j] = false;
                } else {
                    keep[i] = false;
                    break;
                }
            }
        }
    }

    chunks
        .into_iter()
        .enumerate()
        .filter(|(i, _)| keep[*i])
        .map(|(_, c)| c)
        .collect()
}

/// The CAG retrieval pipeline.
///
/// Orchestrates: embed → hybrid search → deduplicate → rerank → hydrate → assemble.
///
/// All stages are generics — swap implementations without touching this code.
/// The pipeline itself is deterministic given the same inputs and stage implementations.
pub struct RetrievalPipeline<E, S, R, H, A, V>
where
    E: Embedder,
    S: SparseEncoder,
    R: Reranker,
    H: Hydrator,
    A: ContextAssembler,
    V: VectorAdapter,
{
    /// Dense embedding generator (Qwen3-Embedding via Candle).
    pub embedder: E,
    /// Sparse vector encoder (BM25, CPU-only).
    pub sparse_encoder: S,
    /// Cross-encoder reranker (Qwen3-Reranker via Candle).
    pub reranker: R,
    /// Document hydrator (`LibSQL` full-content fetch).
    pub hydrator: H,
    /// Token-budgeted context assembler.
    pub assembler: A,
    /// Vector similarity store (RRO / embedded Qdrant).
    pub vector_store: V,
}

impl<E, S, R, H, A, V> RetrievalPipeline<E, S, R, H, A, V>
where
    E: Embedder,
    S: SparseEncoder,
    R: Reranker,
    H: Hydrator,
    A: ContextAssembler,
    V: VectorAdapter,
{
    /// Execute the full retrieval pipeline.
    ///
    /// Signal flow: query → embed → search(dense+sparse) → RRF fuse →
    ///              deduplicate → rerank → hydrate → assemble → `ContextBlob`
    ///
    /// # Errors
    /// Returns error if any pipeline stage (embed, search, rerank, hydrate, assemble) fails.
    pub async fn retrieve(
        &self,
        query: &str,
        project_id: &str,
        collection: &str,
        project_context: Option<String>,
        config: &PipelineConfig,
    ) -> Result<(ContextBlob, PipelineMetrics)> {
        let pipeline_start = Instant::now();

        // 1. Embed query
        let embed_start = Instant::now();
        let dense_vector = self.embedder.embed(query).await?;
        let embed_latency = embed_start.elapsed();

        // 2. Sparse encode query
        let sparse_vector = self.sparse_encoder.encode(query);
        let persistence_sparse = PersistenceSparseVector {
            indices: sparse_vector.indices,
            values: sparse_vector.values,
        };

        // 3. Hybrid search (dense + sparse in parallel concept, sequential for now)
        let search_start = Instant::now();

        let project_filter = serde_json::json!({
            "must": [{ "key": "project_id", "match": { "value": project_id } }]
        });

        let dense_results = self.vector_store
            .search(collection, &dense_vector, config.search_limit, Some(project_filter.clone()))
            .await?;

        let sparse_results = self.vector_store
            .search_sparse(collection, &persistence_sparse, config.search_limit, Some(project_filter))
            .await?;

        // Convert VectorMatch → ScoredChunk
        let dense_chunks: Vec<ScoredChunk> = dense_results
            .into_iter()
            .filter_map(|m| {
                let payload = serde_json::from_value(m.payload).ok()?;
                Some(ScoredChunk {
                    id: m.id,
                    score: m.score,
                    payload,
                })
            })
            .collect();

        let sparse_chunks: Vec<ScoredChunk> = sparse_results
            .into_iter()
            .filter_map(|m| {
                let payload = serde_json::from_value(m.payload).ok()?;
                Some(ScoredChunk {
                    id: m.id,
                    score: m.score,
                    payload,
                })
            })
            .collect();

        let search_candidates = dense_chunks.len() + sparse_chunks.len();
        let search_latency = search_start.elapsed();

        // 4. RRF fusion
        let fused = rrf_fuse(&dense_chunks, &sparse_chunks, config.rrf_k, config.search_limit);

        // 5. Deduplicate
        let deduped = deduplicate(fused, config.dedup_threshold);

        // 6. Rerank
        let rerank_start = Instant::now();
        let rerank_input: Vec<ScoredChunk> = deduped.into_iter().take(config.rerank_top_k * 2).collect();
        let rerank_scores = self.reranker.rerank(query, &rerank_input).await?;

        let mut reranked: Vec<ScoredChunk> = rerank_input
            .into_iter()
            .zip(rerank_scores)
            .map(|(mut chunk, score)| {
                chunk.score = score;
                chunk
            })
            .collect();
        reranked.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
        reranked.truncate(config.rerank_top_k);
        let reranked_count = reranked.len();
        let rerank_latency = rerank_start.elapsed();

        // 7. Hydrate
        let hydrate_start = Instant::now();
        let hydrated = self.hydrator.hydrate(reranked).await?;
        let hydrate_latency = hydrate_start.elapsed();

        // 8. Assemble context blob
        let assemble_start = Instant::now();
        let blob = self.assembler.assemble(hydrated, project_context, config)?;
        let assemble_latency = assemble_start.elapsed();

        let metrics = PipelineMetrics {
            embed_latency,
            search_latency,
            rerank_latency,
            hydrate_latency,
            assemble_latency,
            total_latency: pipeline_start.elapsed(),
            search_candidates,
            reranked_count,
            final_chunk_count: blob.chunk_count(),
            context_tokens: blob.total_tokens,
            cache_hit: false,
        };

        Ok((blob, metrics))
    }
}
