//! RRO (Reason Ready Object) vector store adapter.
//!
//! Wraps the embedded RRO/Qdrant engine for vector similarity search.
//! Direct tokio channel communication — zero HTTP latency.
//!
//! Part of the two-tier retrieval pipeline:
//!   RRO (broad ANN → top 50) → Moka (hot cache → top 10 instant)

use anyhow::{Context, Result};
use std::num::NonZeroU64;
use std::path::Path;
use std::sync::Arc;

use super::traits::{SparseVector, VectorAdapter, VectorMatch};

use rro::api::rest::schema::{NamedVectorStruct, SearchRequestInternal, VectorStruct};
use rro::collection::operations::point_ops::{PointIdsList, PointsSelector};
use rro::collection::operations::types::VectorsConfig;
use rro::segment::types::ExtendedPointId;

/// RRO vector store adapter — embedded Qdrant engine.
///
/// Communicates via tokio mpsc channels to a dedicated engine thread.
/// No HTTP, no gRPC overhead. Sub-millisecond message passing.
pub struct RroAdapter {
    client: Arc<rro::QdrantClient>,
}

impl RroAdapter {
    /// Boot the RRO engine with optional config path override.
    ///
    /// Spawns a dedicated thread with its own tokio runtimes for
    /// search, update, and general-purpose workloads.
    ///
    /// # Errors
    /// Returns error if the engine fails to initialize (storage path
    /// issues, corrupt data, or config parsing failure).
    pub fn boot(storage_path: &std::path::Path, config_path: Option<String>) -> Result<Self> {
        rro::setup_panic_hook();
        let client = rro::QdrantInstance::start(storage_path, config_path)
            .context("Failed to start RRO vector engine")?;
        Ok(Self { client })
    }

    /// List all collections in the vector store.
    ///
    /// # Errors
    /// Returns error if the engine is unreachable.
    pub async fn list_collections(&self) -> Result<Vec<String>> {
        self.client
            .list_collections()
            .await
            .map_err(|e| anyhow::anyhow!("RRO list_collections: {e}"))
    }

    /// Create a new vector collection.
    ///
    /// # Errors
    /// Returns error if collection creation fails.
    pub async fn create_collection(
        &self,
        name: impl Into<String>,
        config: rro::VectorParams,
    ) -> Result<bool> {
        self.client
            .create_collection(name, VectorsConfig::Single(config))
            .await
            .map_err(|e| anyhow::anyhow!("RRO create_collection: {e}"))
    }

    /// Upsert points into a collection.
    ///
    /// # Errors
    /// Returns error if the upsert operation fails.
    pub async fn upsert_points(
        &self,
        collection: impl Into<String>,
        points: Vec<rro::PointStruct>,
    ) -> Result<()> {
        self.client
            .upsert_points(collection, points)
            .await
            .map_err(|e| anyhow::anyhow!("RRO upsert_points: {e}"))?;
        Ok(())
    }

    /// Search for nearest vectors in a collection.
    ///
    /// # Errors
    /// Returns error if the search fails.
    pub async fn search(
        &self,
        collection: impl Into<String>,
        request: rro::SearchRequest,
    ) -> Result<Vec<rro::LocalScoredPoint>> {
        self.client
            .search_points(collection, request)
            .await
            .map_err(|e| anyhow::anyhow!("RRO search: {e}"))
    }

    /// Count points in a collection.
    ///
    /// # Errors
    /// Returns error if the count query fails.
    pub async fn count_points(
        &self,
        collection: impl Into<String>,
    ) -> Result<usize> {
        self.client
            .count_points(collection, None, false)
            .await
            .map_err(|e| anyhow::anyhow!("RRO count_points: {e}"))
    }

    /// Health check — list collections to verify engine is responsive.
    ///
    /// # Errors
    /// Returns error if the engine is unreachable.
    pub async fn ping(&self) -> Result<()> {
        let _ = self.list_collections().await?;
        Ok(())
    }

    /// Get the underlying client for advanced operations.
    pub fn client(&self) -> &Arc<rro::QdrantClient> {
        &self.client
    }

    /// Open the vector store from a data path.
    ///
    /// Convenience wrapper around `boot()` that derives the config
    /// path from the storage directory.
    ///
    /// # Errors
    /// Returns error if the engine fails to initialize.
    pub async fn open(path: &Path) -> Result<Self> {
        let config_path = path.to_string_lossy().to_string();
        Self::boot(path, Some(config_path))
    }
}

// ═══════════════════════════════════════════════════════════════
// VectorAdapter trait implementation
// ═══════════════════════════════════════════════════════════════

impl VectorAdapter for RroAdapter {
    async fn create_collection(&self, name: &str, dimension: u32) -> Result<()> {
        let params = rro::VectorParams {
            size: NonZeroU64::new(u64::from(dimension))
                .expect("dimension must be > 0"),
            distance: rro::Distance::Cosine,
            hnsw_config: None,
            quantization_config: None,
            on_disk: None,
            datatype: None,
            multivector_config: None,
        };
        self.client
            .create_collection(name, VectorsConfig::Single(params))
            .await
            .map_err(|e| anyhow::anyhow!("RRO create_collection: {e}"))?;
        Ok(())
    }

    async fn delete_collection(&self, name: &str) -> Result<()> {
        self.client
            .delete_collection(name)
            .await
            .map_err(|e| anyhow::anyhow!("RRO delete_collection: {e}"))?;
        Ok(())
    }

    async fn collection_exists(&self, name: &str) -> Result<bool> {
        let collections = self.list_collections().await?;
        Ok(collections.iter().any(|c| c == name))
    }

    async fn upsert(
        &self,
        collection: &str,
        id: &str,
        vector: &[f32],
        payload: serde_json::Value,
    ) -> Result<()> {
        let point_id: ExtendedPointId = id.parse()
            .map_err(|_| anyhow::anyhow!("Invalid point ID: {id}"))?;
        let point = rro::PointStruct {
            id: point_id,
            vector: VectorStruct::Single(vector.to_vec()),
            payload: payload.as_object().cloned().map(|m| m.into()),
        };
        self.upsert_points(collection, vec![point]).await
    }

    async fn upsert_hybrid(
        &self,
        collection: &str,
        id: &str,
        dense: &[f32],
        _sparse: &SparseVector,
        payload: serde_json::Value,
    ) -> Result<()> {
        // TODO: wire sparse vectors when RRO sparse index support lands
        self.upsert(collection, id, dense, payload).await
    }

    async fn search(
        &self,
        collection: &str,
        vector: &[f32],
        limit: usize,
        filter: Option<serde_json::Value>,
    ) -> Result<Vec<VectorMatch>> {
        let request = rro::SearchRequest {
            search_request: SearchRequestInternal {
                vector: NamedVectorStruct::Default(vector.to_vec()),
                filter: filter.and_then(|f| serde_json::from_value(f).ok()),
                params: None,
                limit,
                offset: None,
                with_payload: Some(true.into()),
                with_vector: None,
                score_threshold: None,
            },
            shard_key: None,
        };
        let results = self
            .client
            .search_points(collection, request)
            .await
            .map_err(|e| anyhow::anyhow!("RRO search: {e}"))?;

        Ok(results
            .into_iter()
            .map(|p| VectorMatch {
                id: p.id,
                score: p.score,
                payload: p.payload.unwrap_or_default(),
            })
            .collect())
    }

    async fn search_sparse(
        &self,
        _collection: &str,
        _sparse: &SparseVector,
        _limit: usize,
        _filter: Option<serde_json::Value>,
    ) -> Result<Vec<VectorMatch>> {
        // TODO: wire when RRO sparse index support lands
        anyhow::bail!("RRO sparse search not yet wired")
    }

    async fn delete_point(&self, collection: &str, id: &str) -> Result<bool> {
        let point_id: ExtendedPointId = id.parse()
            .map_err(|_| anyhow::anyhow!("Invalid point ID: {id}"))?;
        let selector = PointsSelector::PointIdsSelector(PointIdsList {
            points: vec![point_id],
            shard_key: None,
        });
        self.client
            .delete_points(collection, selector)
            .await
            .map(|_| true)
            .map_err(|e| anyhow::anyhow!("RRO delete_point: {e}"))
    }

    async fn point_count(&self, collection: &str) -> Result<u64> {
        self.count_points(collection)
            .await
            .map(|c| c as u64)
    }
}
