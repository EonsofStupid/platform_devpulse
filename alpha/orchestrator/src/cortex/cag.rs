// orchestrator/src/cortex/cag.rs

//! CAG - Context Assembly Graph
//!
//! Pipeline: Query -> Embed -> RRO Search -> Rerank -> Context
//!
//! Implements the 4 Pillars:
//! 1. Persona-Skewed Rerank - bias map on reranker scores (TODO: Sprint 2)
//! 2. MMR - Maximal Marginal Relevance for diversity (TODO: Sprint 2)
//! 3. Focus Sphere - proximity decay from active file (TODO: Sprint 2)
//! 4. Adaptive Thresholding - elbow cutoff (implemented)
//!
//! Sprint 1: Basic embed -> search -> rerank pipeline

use crate::infra::{
    embedding::embedder::EmbedderBackend,
    persistence::vector::{SearchResult, VectorStore},
    embedding::reranker::RerankerBackend,
};
use anyhow::Result;
use std::sync::Arc;

/// Assembled context ready for LLM consumption
#[derive(Debug, Clone)]
pub struct AssembledContext {
    /// Original query
    pub query: String,
    /// Selected context chunks (post-rerank, post-filter)
    pub chunks: Vec<ContextChunk>,
    /// Total candidates searched in RRO
    pub candidates_searched: usize,
    /// Time spent assembling (ms)
    pub assembly_time_ms: u64,
}

/// Single context chunk with metadata and scores
#[derive(Debug, Clone)]
pub struct ContextChunk {
    /// The actual content
    pub content: String,
    /// Source file/location
    pub source: String,
    /// Relevance score from reranker (0-1)
    pub relevance_score: f32,
    /// Vector similarity score from RRO
    pub vector_score: f32,
}

/// Assembly configuration
#[derive(Debug, Clone)]
pub struct AssemblyConfig {
    /// Which collection to search
    pub collection: String,
    /// How many candidates to fetch from RRO
    pub candidate_limit: usize,
    /// How many to return after reranking
    pub top_k: usize,
    /// Minimum relevance score (Pillar 4: adaptive threshold)
    pub min_relevance: f32,
    /// Drop score threshold (Pillar 4: elbow detection)
    pub elbow_drop_ratio: f32,
}

impl Default for AssemblyConfig {
    fn default() -> Self {
        Self {
            collection: "code".to_string(),
            candidate_limit: 20,  // Fetch 20 from RRO
            top_k: 5,             // Return top 5 after rerank
            min_relevance: 0.3,   // Minimum 30% relevance
            elbow_drop_ratio: 0.5, // Stop if score drops >50% from previous
        }
    }
}

/// Context Assembly Graph - the Smart Cortex
pub struct CAG {
    embedder: Arc<EmbedderBackend>,
    rro: Arc<VectorStore>,
    reranker: Arc<RerankerBackend>,
}

impl CAG {
    /// Create new CAG with all backends
    pub fn new(
        embedder: Arc<EmbedderBackend>,
        rro: Arc<VectorStore>,
        reranker: Arc<RerankerBackend>,
    ) -> Self {
        Self { embedder, rro, reranker }
    }

    /// Assemble context for a query
    ///
    /// Pipeline:
    /// 1. Embed query (CPU)
    /// 2. Search RRO (get candidates)
    /// 3. Rerank candidates (CPU, will be GPU)
    /// 4. Apply adaptive thresholding (Pillar 4)
    /// 5. Return assembled context
    pub async fn assemble(&self, query: &str, config: &AssemblyConfig) -> Result<AssembledContext> {
        let start = std::time::Instant::now();

        // 1. Embed query
        tracing::debug!("CAG: Embedding query ({} chars)", query.len());
        let embedding = self.embedder.embed(query)?;

        // 2. Search RRO
        tracing::debug!("CAG: Searching {} for {} candidates", config.collection, config.candidate_limit);
        let search_results = self.rro
            .search(&config.collection, embedding, config.candidate_limit)
            .await?;

        let candidates_searched = search_results.len();

        if candidates_searched == 0 {
            return Ok(AssembledContext {
                query: query.to_string(),
                chunks: vec![],
                candidates_searched: 0,
                assembly_time_ms: start.elapsed().as_millis() as u64,
            });
        }

        // 3. Extract documents for reranking
        let documents: Vec<String> = search_results
            .iter()
            .map(|r| extract_content(&r.payload))
            .collect();

        // 4. Rerank all candidates
        tracing::debug!("CAG: Reranking {} candidates", candidates_searched);
        let reranked = self.reranker.rerank(query, &documents)?;

        // 5. Apply Pillar 4: Adaptive Thresholding
        let chunks = self.apply_adaptive_threshold(&reranked, &search_results, &documents, config);

        let assembly_time_ms = start.elapsed().as_millis() as u64;
        tracing::debug!("CAG: Assembled {} chunks in {}ms", chunks.len(), assembly_time_ms);

        Ok(AssembledContext {
            query: query.to_string(),
            chunks,
            candidates_searched,
            assembly_time_ms,
        })
    }

    /// Apply Pillar 4: Adaptive Thresholding
    ///
    /// Stop adding chunks when:
    /// - Score drops below min_relevance
    /// - Score drops more than elbow_drop_ratio from previous
    /// - We've hit top_k
    fn apply_adaptive_threshold(
        &self,
        reranked: &[(usize, f32)],
        search_results: &[SearchResult],
        documents: &[String],
        config: &AssemblyConfig,
    ) -> Vec<ContextChunk> {
        let mut chunks = Vec::new();
        let mut prev_score = 1.0f32;

        for (idx, relevance_score) in reranked.iter().take(config.top_k) {
            // Minimum threshold
            if *relevance_score < config.min_relevance {
                tracing::debug!("CAG: Stopping - score {:.2} below min {:.2}", relevance_score, config.min_relevance);
                break;
            }

            // Elbow detection: stop if score drops too much
            let drop_ratio = (prev_score - relevance_score) / prev_score;
            if chunks.len() > 0 && drop_ratio > config.elbow_drop_ratio {
                tracing::debug!(
                    "CAG: Stopping - elbow detected (drop {:.1}% > {:.1}%)",
                    drop_ratio * 100.0,
                    config.elbow_drop_ratio * 100.0
                );
                break;
            }

            let result = &search_results[*idx];
            chunks.push(ContextChunk {
                content: documents[*idx].clone(),
                source: extract_source(&result.payload),
                relevance_score: *relevance_score,
                vector_score: result.score,
            });

            prev_score = *relevance_score;
        }

        chunks
    }

    /// Get embedder dimension (for validation)
    pub fn embedder_dimension(&self) -> usize {
        self.embedder.dimension()
    }
}

/// Extract content from payload
fn extract_content(payload: &serde_json::Value) -> String {
    payload
        .get("content")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}

/// Extract source from payload
fn extract_source(payload: &serde_json::Value) -> String {
    payload
        .get("source")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AssemblyConfig::default();
        assert_eq!(config.collection, "code");
        assert_eq!(config.candidate_limit, 20);
        assert_eq!(config.top_k, 5);
    }
}
