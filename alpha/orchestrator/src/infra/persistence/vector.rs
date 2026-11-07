// orchestrator/src/infra/persistence/vector.rs

//! RRO - Reasoning Runtime Object (embedded vector store)
//!
//! Embedded vector store - no separate server process needed.
//! Uses the external `rro` crate (sibling workspace).
//!
//! Collections:
//! - code: Source code chunks (384 dims for MiniLM or 1536 for ada-002)
//! - docs: Documentation
//! - history: Conversation history
//! - memory: Long-term memories
//! - external: External knowledge

use rro::{Distance, RroClient, RroInstance, VectorParams};
use shared::config::{context, get_paths, RuntimeConfig};
use std::sync::Arc;

/// Vector store handle wrapping embedded RRO instance.
pub struct VectorStore {
    client: Arc<RroClient>,
    config: &'static RuntimeConfig,
}

impl VectorStore {
    /// Initialize embedded RRO instance.
    /// Uses RuntimeConfig to determine storage path based on Lab/Production mode.
    pub fn init() -> anyhow::Result<Self> {
        let config = context();
        let paths = get_paths();

        // Ensure rro directory exists
        std::fs::create_dir_all(&paths.rro_dir)?;

        // Create rro config.yaml
        let config_path = paths.rro_dir.join("config.yaml");
        if !config_path.exists() {
            // Use forward slashes for YAML (backslashes are escape chars)
            let storage_path = paths.rro_dir.to_string_lossy().replace('\\', "/");
            let yaml = format!(
                r#"storage:
  storage_path: "{}"
"#,
                storage_path
            );
            std::fs::write(&config_path, yaml)?;
        }

        tracing::info!(
            "Starting embedded RRO [mode={}] at {}",
            config.mode_name(),
            paths.rro_dir.display()
        );

        let client = RroInstance::start(Some(config_path.to_string_lossy().to_string()))?;

        tracing::info!("RRO embedded instance ready");

        Ok(Self { client, config })
    }

    /// Get runtime config reference.
    pub fn runtime_config(&self) -> &'static RuntimeConfig {
        self.config
    }

    /// Create a collection with cosine distance.
    pub async fn create_collection(&self, name: &str, vector_size: u64) -> anyhow::Result<()> {
        // Check if exists
        if self.client.get_collection(name).await?.is_some() {
            tracing::debug!("Collection '{}' already exists", name);
            return Ok(());
        }

        tracing::info!("Creating collection: {} (size: {})", name, vector_size);

        let params = VectorParams {
            size: std::num::NonZeroU64::new(vector_size).unwrap_or(
                std::num::NonZeroU64::new(384).unwrap()
            ),
            distance: Distance::Cosine,
            hnsw_config: None,
            quantization_config: None,
            on_disk: None,
            datatype: None,
            multivector_config: None,
        };

        let config: rro::VectorsConfig = params.into();
        self.client.create_collection(name, config).await?;
        Ok(())
    }

    /// Delete a collection.
    pub async fn delete_collection(&self, name: &str) -> anyhow::Result<()> {
        self.client.delete_collection(name).await?;
        Ok(())
    }

    /// List all collections.
    pub async fn list_collections(&self) -> anyhow::Result<Vec<String>> {
        Ok(self.client.list_collections().await?)
    }

    /// Upsert points into a collection.
    pub async fn upsert(&self, collection: &str, points: Vec<VectorPoint>) -> anyhow::Result<()> {
        if points.is_empty() {
            return Ok(());
        }

        tracing::debug!("Upserting {} points to '{}'", points.len(), collection);

        let rro_points: Vec<rro::PointStruct> = points
            .into_iter()
            .map(|p| p.into_rro_point())
            .collect();

        self.client.upsert_points(collection, rro_points).await?;
        Ok(())
    }

    /// Search for similar vectors.
    pub async fn search(
        &self,
        collection: &str,
        query_vector: Vec<f32>,
        limit: usize,
    ) -> anyhow::Result<Vec<SearchResult>> {
        tracing::debug!("Searching '{}' for {} results", collection, limit);

        // Build search request using the collection types
        use rro::collection::operations::types::SearchRequest;
        use rro::api::rest::schema::{SearchRequestInternal, NamedVectorStruct};
        use rro::WithPayloadInterface;

        let search_internal = SearchRequestInternal {
            vector: NamedVectorStruct::Default(query_vector),
            filter: None,
            params: None,
            limit,
            offset: None,
            with_payload: Some(WithPayloadInterface::Bool(true)),
            with_vector: None,
            score_threshold: None,
        };

        let request = SearchRequest {
            search_request: search_internal,
            shard_key: None,
        };

        let results = self.client.search_points(collection, request).await?;

        Ok(results
            .into_iter()
            .map(|r| SearchResult {
                id: r.id,
                score: r.score,
                payload: r.payload.unwrap_or_default(),
            })
            .collect())
    }

    /// Count points in a collection.
    pub async fn count(&self, collection: &str) -> anyhow::Result<usize> {
        Ok(self.client.count_points(collection, None, true).await?)
    }

    /// Verify collection dimension matches embedder (fail fast).
    ///
    /// This is critical for Pillar 2 (MMR) and all vector operations.
    /// Mismatched dimensions cause silent failures in similarity calculations.
    pub async fn assert_dimension(&self, collection: &str, expected_dim: u64) -> anyhow::Result<()> {
        use rro::collection::operations::types::VectorsConfig;

        if let Some(info) = self.client.get_collection(collection).await? {
            // Extract vector size - params.vectors is directly VectorsConfig
            let actual_dim = match &info.config.params.vectors {
                VectorsConfig::Single(p) => p.size.get(),
                VectorsConfig::Multi(m) => {
                    // For multi-vector, check the first one
                    m.values().next().map(|p| p.size.get()).unwrap_or(0)
                }
            };

            if actual_dim != expected_dim {
                anyhow::bail!(
                    "FATAL: Dimension mismatch!\n\
                     Embedder: {} dims\n\
                     Collection '{}': {} dims\n\n\
                     Run `cargo xtask migrate-vectors` to recreate collections.",
                    expected_dim, collection, actual_dim
                );
            }
        }
        Ok(())
    }
}

/// A point to store in the vector database.
#[derive(Debug, Clone)]
pub struct VectorPoint {
    /// Unique identifier (UUID string).
    pub id: String,
    /// The embedding vector.
    pub vector: Vec<f32>,
    /// JSON payload with metadata.
    pub payload: serde_json::Value,
}

impl VectorPoint {
    /// Create a new vector point.
    pub fn new(id: impl Into<String>, vector: Vec<f32>, payload: serde_json::Value) -> Self {
        Self {
            id: id.into(),
            vector,
            payload,
        }
    }

    /// Convert to rro-lib PointStruct.
    fn into_rro_point(self) -> rro::PointStruct {
        use rro::api::rest::schema::{PointStruct, VectorStruct};
        use rro::segment::types::PointIdType;
        use rro::Payload;

        let id = uuid::Uuid::parse_str(&self.id)
            .unwrap_or_else(|_| uuid::Uuid::new_v4());

        let payload: Payload = serde_json::from_value(self.payload).unwrap_or_default();

        PointStruct {
            id: PointIdType::Uuid(id).into(),
            vector: VectorStruct::Single(self.vector).into(),
            payload: Some(payload.into()),
        }
    }
}

/// A search result from the vector database.
#[derive(Debug, Clone)]
pub struct SearchResult {
    /// Point ID (formatted).
    pub id: String,
    /// Similarity score.
    pub score: f32,
    /// Associated payload.
    pub payload: serde_json::Value,
}

/// Standard collection names.
pub mod collections {
    pub const CODE: &str = "code";
    pub const DOCS: &str = "docs";
    pub const HISTORY: &str = "history";
    pub const MEMORY: &str = "memory";
    pub const EXTERNAL: &str = "external";
}

/// Default vector dimensions for embedding models.
pub mod dimensions {
    /// OpenAI ada-002 / text-embedding-3-small
    pub const ADA_002: u64 = 1536;
    /// Local all-MiniLM-L6-v2
    pub const MINILM_L6: u64 = 384;
    /// Nomic embed text
    pub const NOMIC_EMBED: u64 = 768;
    /// Qwen3-Embedding-0.6B (our primary embedder)
    pub const QWEN3_0_6B: u64 = 1024;
    /// Qwen3-Embedding-4B
    pub const QWEN3_4B: u64 = 2560;
    /// Qwen3-Embedding-8B
    pub const QWEN3_8B: u64 = 4096;
}
