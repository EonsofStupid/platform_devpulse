// engine/src/facade/reasoning.rs

//! Reasoning facade - vector search, embedding, and context assembly
//!
//! Wraps orchestrator's CAG/embedder/rro with:
//! - Enable/disable toggle for testing models without reasoning
//! - Graceful degradation when backends not ready
//! - Signal emission for observability
//!
//! ```text
//! Desktop/Lab → ReasoningFacade → Orchestrator (CAG/Embedder/RRO)
//!                    ↓
//!              Empty results if disabled or not ready
//! ```

use crate::error::EngineError;
use crate::signals::{
    ContextPayload, Signal, SignalRouter, SignalSource, SignalVariant,
};
use orchestrator::cortex::{AssembledContext, AssemblyConfig, CAG, ContextChunk};
use orchestrator::infra::{
    embedding::embedder::EmbedderBackend,
    persistence::vector::VectorStore,
    embedding::reranker::RerankerBackend,
};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::sync::OnceCell;
use tracing::instrument;

/// Reasoning configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReasoningConfig {
    /// Whether reasoning is enabled (can be toggled at runtime)
    pub enabled: bool,
    /// Collection to search (default: "code")
    pub collection: String,
    /// Number of candidates to fetch from RRO
    pub candidate_limit: usize,
    /// Number of results after reranking
    pub top_k: usize,
    /// Minimum relevance score (0.0 - 1.0)
    pub min_relevance: f32,
}

impl Default for ReasoningConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            collection: "code".to_string(),
            candidate_limit: 20,
            top_k: 5,
            min_relevance: 0.3,
        }
    }
}

/// Search result from reasoning facade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReasoningResult {
    /// Query that was searched
    pub query: String,
    /// Retrieved chunks with relevance scores
    pub chunks: Vec<ReasoningChunk>,
    /// Time spent (ms)
    pub latency_ms: u64,
    /// Whether this is a stub result (reasoning disabled or not ready)
    pub is_stub: bool,
}

/// Single chunk from reasoning search
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReasoningChunk {
    pub content: String,
    pub source: String,
    pub relevance_score: f32,
    pub vector_score: f32,
}

impl From<ContextChunk> for ReasoningChunk {
    fn from(chunk: ContextChunk) -> Self {
        Self {
            content: chunk.content,
            source: chunk.source,
            relevance_score: chunk.relevance_score,
            vector_score: chunk.vector_score,
        }
    }
}

/// Reasoning facade - entry point for vector search and context assembly
///
/// Toggle reasoning on/off to test models with or without RAG context.
pub struct ReasoningFacade {
    /// Signal router for broadcasting reasoning events
    router: Arc<SignalRouter>,
    /// Runtime toggle - can be changed without restart
    enabled: AtomicBool,
    /// Lazy-initialized CAG (contains embedder, rro, reranker)
    cag: OnceCell<Arc<CAG>>,
    /// Direct access to embedder for standalone embedding
    embedder: OnceCell<Arc<EmbedderBackend>>,
    /// Direct access to vector store for standalone operations
    rro: OnceCell<Arc<VectorStore>>,
    /// Configuration
    config: ReasoningConfig,
}

impl ReasoningFacade {
    /// Create a new reasoning facade
    pub fn new(router: Arc<SignalRouter>) -> Self {
        Self {
            router,
            enabled: AtomicBool::new(true),
            cag: OnceCell::new(),
            embedder: OnceCell::new(),
            rro: OnceCell::new(),
            config: ReasoningConfig::default(),
        }
    }

    /// Create with custom config
    pub fn with_config(router: Arc<SignalRouter>, config: ReasoningConfig) -> Self {
        let enabled = config.enabled;
        Self {
            router,
            enabled: AtomicBool::new(enabled),
            cag: OnceCell::new(),
            embedder: OnceCell::new(),
            rro: OnceCell::new(),
            config,
        }
    }

    /// Initialize the reasoning backends
    ///
    /// Loads embedder, rro, reranker, and creates CAG.
    /// If this fails, facade operates in stub mode (returns empty results).
    #[instrument(skip(self))]
    pub async fn init(&self) -> Result<(), EngineError> {
        use orchestrator::infra::catalog::models::ModelPaths;

        let paths = ModelPaths::default_dp_alpha();

        // Load embedder
        tracing::info!("Loading embedder from {:?}", paths.embedder_dir);
        let embedder = match EmbedderBackend::load(&paths.embedder_dir) {
            Ok(e) => Arc::new(e),
            Err(e) => {
                tracing::warn!("Embedder not available: {}", e);
                return Err(EngineError::Init(format!("Embedder load failed: {}", e)));
            }
        };
        let _ = self.embedder.set(Arc::clone(&embedder));
        tracing::info!("Embedder loaded (dim={})", embedder.dimension());

        // Load rro
        tracing::info!("Initializing RRO");
        let rro = match VectorStore::init() {
            Ok(q) => Arc::new(q),
            Err(e) => {
                tracing::warn!("RRO not available: {}", e);
                return Err(EngineError::Init(format!("RRO init failed: {}", e)));
            }
        };
        let _ = self.rro.set(Arc::clone(&rro));
        tracing::info!("RRO initialized");

        // Load reranker
        tracing::info!("Loading reranker from {:?}", paths.reranker_dir);
        let reranker = match RerankerBackend::load(&paths.reranker_dir) {
            Ok(r) => Arc::new(r),
            Err(e) => {
                tracing::warn!("Reranker not available: {}", e);
                return Err(EngineError::Init(format!("Reranker load failed: {}", e)));
            }
        };
        tracing::info!("Reranker loaded");

        // Create CAG
        let cag = CAG::new(embedder, rro, reranker);
        let _ = self.cag.set(Arc::new(cag));
        tracing::info!("CAG assembled - reasoning ready");

        Ok(())
    }

    /// Enable reasoning (runtime toggle)
    pub fn enable(&self) {
        self.enabled.store(true, Ordering::SeqCst);
        tracing::info!("Reasoning ENABLED");
    }

    /// Disable reasoning (runtime toggle)
    pub fn disable(&self) {
        self.enabled.store(false, Ordering::SeqCst);
        tracing::info!("Reasoning DISABLED");
    }

    /// Check if reasoning is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled.load(Ordering::SeqCst)
    }

    /// Check if reasoning backends are ready
    pub fn is_ready(&self) -> bool {
        self.cag.get().is_some()
    }

    /// Search for relevant context (main entry point)
    ///
    /// Returns empty results if:
    /// - Reasoning is disabled
    /// - Backends not initialized
    #[instrument(skip(self), fields(query_len = query.len()))]
    pub async fn search(&self, query: &str) -> Result<ReasoningResult, EngineError> {
        let start = std::time::Instant::now();

        // Check if enabled
        if !self.is_enabled() {
            tracing::debug!("Reasoning disabled, returning stub");
            return Ok(ReasoningResult {
                query: query.to_string(),
                chunks: vec![],
                latency_ms: 0,
                is_stub: true,
            });
        }

        // Check if ready
        let cag = match self.cag.get() {
            Some(c) => c,
            None => {
                tracing::debug!("Reasoning not initialized, returning stub");
                return Ok(ReasoningResult {
                    query: query.to_string(),
                    chunks: vec![],
                    latency_ms: 0,
                    is_stub: true,
                });
            }
        };

        // Build assembly config from facade config
        let assembly_config = AssemblyConfig {
            collection: self.config.collection.clone(),
            candidate_limit: self.config.candidate_limit,
            top_k: self.config.top_k,
            min_relevance: self.config.min_relevance,
            elbow_drop_ratio: 0.5,
        };

        // Run CAG assembly
        let assembled = cag.assemble(query, &assembly_config).await
            .map_err(|e| EngineError::Reasoning(format!("CAG assembly failed: {}", e)))?;

        let latency_ms = start.elapsed().as_millis() as u64;

        // Emit context signal for observability
        self.emit_context_signal(query, &assembled);

        // Convert to facade types
        let chunks: Vec<ReasoningChunk> = assembled.chunks.into_iter().map(Into::into).collect();

        Ok(ReasoningResult {
            query: query.to_string(),
            chunks,
            latency_ms,
            is_stub: false,
        })
    }

    /// Embed text to vector (standalone, for custom operations)
    ///
    /// Returns None if reasoning disabled or embedder not ready.
    #[instrument(skip(self), fields(text_len = text.len()))]
    pub fn embed(&self, text: &str) -> Result<Option<Vec<f32>>, EngineError> {
        if !self.is_enabled() {
            return Ok(None);
        }

        let embedder = match self.embedder.get() {
            Some(e) => e,
            None => return Ok(None),
        };

        embedder.embed(text)
            .map(Some)
            .map_err(|e| EngineError::Reasoning(format!("Embedding failed: {}", e)))
    }

    /// Get embedding dimension
    pub fn embedding_dimension(&self) -> Option<usize> {
        self.embedder.get().map(|e| e.dimension())
    }

    /// Get the vector store handle (for advanced operations like indexing)
    pub fn vector_store(&self) -> Option<Arc<VectorStore>> {
        self.rro.get().cloned()
    }

    /// Get the embedder handle (for advanced operations like indexing)
    pub fn embedder(&self) -> Option<Arc<EmbedderBackend>> {
        self.embedder.get().cloned()
    }

    /// Emit context signal for observability
    fn emit_context_signal(&self, query: &str, assembled: &AssembledContext) {
        let chunk_ids: Vec<String> = assembled.chunks
            .iter()
            .map(|c| c.source.clone())
            .collect();

        let scores: Vec<f32> = assembled.chunks
            .iter()
            .map(|c| c.relevance_score)
            .collect();

        self.router.emit(Signal::new(
            SignalSource::System,
            SignalVariant::Context(ContextPayload {
                query: query.to_string(),
                chunk_ids,
                scores,
            }),
        ));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_router() -> Arc<SignalRouter> {
        Arc::new(SignalRouter::new())
    }

    #[test]
    fn test_toggle_works() {
        let facade = ReasoningFacade::new(test_router());

        assert!(facade.is_enabled());

        facade.disable();
        assert!(!facade.is_enabled());

        facade.enable();
        assert!(facade.is_enabled());
    }

    #[test]
    fn test_not_ready_returns_stub() {
        let facade = ReasoningFacade::new(test_router());
        assert!(!facade.is_ready());
    }

    #[tokio::test]
    async fn test_disabled_returns_stub() {
        let facade = ReasoningFacade::new(test_router());
        facade.disable();

        let result = facade.search("test query").await.unwrap();
        assert!(result.is_stub);
        assert!(result.chunks.is_empty());
    }

    #[test]
    fn test_default_config() {
        let config = ReasoningConfig::default();
        assert!(config.enabled);
        assert_eq!(config.collection, "code");
        assert_eq!(config.candidate_limit, 20);
        assert_eq!(config.top_k, 5);
    }
}
