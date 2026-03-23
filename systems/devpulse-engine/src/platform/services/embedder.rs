//! Embedder service — Candle-based dense text embedding (CPU burst mode).
//!
//! Wraps the Candle embedder adapter as a platform service.
//! Used by the CAG pipeline to generate dense vectors for RRO (Qdrant).
//!
//! The model stays loaded in memory. Embeddings are generated on demand
//! via `spawn_blocking` (CPU inference should not block the async runtime).

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::CandleEmbedder;
use std::sync::Arc;

/// Embedder service backed by Candle (CPU burst mode).
pub struct EmbedderService {
    adapter: Arc<CandleEmbedder>,
}

impl EmbedderService {
    /// Boot the embedder from a local model directory.
    ///
    /// Model directory must contain: `config.json`, `tokenizer.json`, `model.safetensors`.
    /// Runs on CPU — no GPU required.
    ///
    /// # Errors
    /// Returns error if any model file is missing or the model fails to load.
    pub fn boot(model_dir: &std::path::Path) -> Result<Self> {
        let adapter = CandleEmbedder::load(model_dir)?;
        Ok(Self {
            adapter: Arc::new(adapter),
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<CandleEmbedder> {
        &self.adapter
    }

    /// Embedding dimension (e.g. 384 for MiniLM, 1024 for Qwen3-Embedding).
    pub fn dimension(&self) -> u32 {
        self.adapter.dimension()
    }
}

impl Service for EmbedderService {
    fn name(&self) -> &'static str {
        "Embedder service"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Embedder
    }

    async fn ping(&self) -> Result<()> {
        // Run ping on blocking thread — CPU inference
        let adapter = Arc::clone(&self.adapter);
        tokio::task::spawn_blocking(move || adapter.ping())
            .await
            .map_err(|e| anyhow::anyhow!("Embedder ping spawn_blocking failed: {e}"))?
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }
}
