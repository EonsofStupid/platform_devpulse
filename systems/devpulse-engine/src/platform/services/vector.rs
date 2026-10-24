//! Vector service wrapper (`RRO` — embedded Qdrant engine).
//!
//! Direct tokio channel communication to the RRO engine thread.
//! No HTTP, no gRPC — sub-millisecond message passing for
//! real-time keystroke-level vector search.
//!
//! Part of the two-tier retrieval pipeline:
//!   RRO (broad ANN → top 50) → Moka (hot cache → top 10 instant)

use super::{Service, ServiceRole, ServiceState};
use crate::platform::config::RetrievalConfig;
use anyhow::Result;
use devpulse_clyffy::cortex::persistence::RroAdapter;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Vector store backed by RRO (embedded Qdrant).
pub struct VectorService {
    adapter: Arc<RroAdapter>,
    retrieval_config: Arc<RwLock<RetrievalConfig>>,
}

impl VectorService {
    /// Boot the vector store with optional config path and retrieval tuning.
    ///
    /// # Errors
    /// Returns error if the RRO engine fails to initialize.
    pub fn boot(
        storage_path: &std::path::Path,
        config_path: Option<String>,
        retrieval: RetrievalConfig,
    ) -> Result<Self> {
        let adapter = RroAdapter::boot(storage_path, config_path)?;
        Ok(Self {
            adapter: Arc::new(adapter),
            retrieval_config: Arc::new(RwLock::new(retrieval)),
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<RroAdapter> {
        &self.adapter
    }

    /// Snapshot the current retrieval config (clone from read lock).
    pub async fn retrieval_config_snapshot(&self) -> RetrievalConfig {
        self.retrieval_config.read().await.clone()
    }

    /// Update the retrieval config at runtime. Takes effect immediately.
    pub async fn update_retrieval_config(&self, config: RetrievalConfig) {
        *self.retrieval_config.write().await = config;
    }

    /// Dense similarity search — public API for Tauri commands.
    ///
    /// Delegates to the `VectorAdapter` trait implementation on the adapter.
    /// Keeps the trait import inside the engine, not in the Tauri crate.
    ///
    /// # Errors
    /// Returns error if the search fails.
    pub async fn search(
        &self,
        collection: &str,
        vector: &[f32],
        limit: usize,
        filter: Option<serde_json::Value>,
    ) -> anyhow::Result<Vec<VectorSearchMatch>> {
        use devpulse_clyffy::cortex::persistence::VectorAdapter;

        let matches =
            VectorAdapter::search(self.adapter.as_ref(), collection, vector, limit, filter).await?;
        Ok(matches
            .into_iter()
            .map(|m| VectorSearchMatch {
                id: m.id,
                score: m.score,
                payload: m.payload,
            })
            .collect())
    }

    /// Create a named collection with the given vector dimensionality.
    ///
    /// # Errors
    /// Returns error if creation fails (e.g. collection already exists).
    pub async fn create_collection(&self, name: &str, dimension: u32) -> anyhow::Result<()> {
        use devpulse_clyffy::cortex::persistence::VectorAdapter;

        VectorAdapter::create_collection(self.adapter.as_ref(), name, dimension).await
    }

    /// Delete a collection and all its points.
    ///
    /// # Errors
    /// Returns error if deletion fails (e.g. collection does not exist).
    pub async fn delete_collection(&self, name: &str) -> anyhow::Result<()> {
        use devpulse_clyffy::cortex::persistence::VectorAdapter;

        VectorAdapter::delete_collection(self.adapter.as_ref(), name).await
    }
}

/// Public search result — engine-level projection of `VectorMatch`.
///
/// Avoids leaking kernel trait types to the Tauri crate.
#[derive(Debug, Clone)]
pub struct VectorSearchMatch {
    /// Point ID.
    pub id: String,
    /// Similarity score (higher = more similar).
    pub score: f32,
    /// JSON payload.
    pub payload: serde_json::Value,
}

impl Service for VectorService {
    fn name(&self) -> &'static str {
        "Vector service"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Vector
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }
}
