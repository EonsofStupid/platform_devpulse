//! Per-project Qdrant collection manager (RRO embedded engine).
//!
//! Qdrant runs as ONE embedded instance via [`VectorService`]. Per-project
//! isolation is at the COLLECTION layer — every project gets a fixed
//! set of collections named `proj_<sanitized_project_id>__<purpose>`.
//! No second Qdrant instance; the storage path stays fixed at the
//! global vector dir.
//!
//! # Purposes
//!
//! - `chunks`: prose / docstring / comment chunks (dense semantic vectors)
//! - `symbols`: function / class / type signatures (denser, structured)
//!
//! Both share the same embedding dimensionality at boot. If dims diverge
//! later, the [`ProjectCollections`] struct adds a new field; collection
//! IDs are stable.
//!
//! # Naming convention
//!
//! All per-project collections are `proj_<sanitized>__<purpose>`.
//! Sanitization mirrors `project_graph::project_database` — `[a-zA-Z0-9_]`
//! kept, anything else `_`. This guarantees the prefix `proj_` does
//! not collide with global collections, and `_database_` / `_namespace_`
//! tooling can pattern-match per-project collections by the `proj_`
//! prefix.

use anyhow::{Context, Result};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::platform::services::vector::VectorService;

/// Default embedding dimension for project collections.
///
/// Mirrors the BGE-small / `SigLIP` small dim used by the default
/// indexing preset. Override via [`ProjectCollectionsConfig::dimension`]
/// when the project picks a different embedder.
pub const DEFAULT_PROJECT_VECTOR_DIM: u32 = 384;

/// Tuning knobs for the project's collection set.
#[derive(Debug, Clone)]
pub struct ProjectCollectionsConfig {
    /// Vector dimensionality. Must match the embedder the indexing
    /// pipeline uses for this project.
    pub dimension: u32,
}

impl Default for ProjectCollectionsConfig {
    fn default() -> Self {
        Self {
            dimension: DEFAULT_PROJECT_VECTOR_DIM,
        }
    }
}

/// The named collections owned by one project.
///
/// Returned from [`ProjectVectorManager::init_project`] so callers
/// have the resolved collection names without re-deriving them.
#[derive(Debug, Clone)]
pub struct ProjectCollections {
    /// Prose / docstring / comment chunks collection.
    pub chunks: String,
    /// Function / class / type symbols collection.
    pub symbols: String,
}

impl ProjectCollections {
    /// Iterate over every collection name owned by the project.
    pub fn iter(&self) -> impl Iterator<Item = &str> {
        [self.chunks.as_str(), self.symbols.as_str()].into_iter()
    }
}

/// Manages per-project Qdrant collections inside the single embedded
/// `VectorService` instance.
pub struct ProjectVectorManager {
    cols: RwLock<HashMap<String, ProjectCollections>>,
}

impl Default for ProjectVectorManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ProjectVectorManager {
    /// Construct an empty manager.
    #[must_use]
    pub fn new() -> Self {
        Self {
            cols: RwLock::new(HashMap::new()),
        }
    }

    /// Create the per-project collection set inside the shared
    /// `VectorService`. Idempotent — `create_collection` returns
    /// `AlreadyExists` which we treat as success.
    ///
    /// # Errors
    /// Returns error if any collection creation fails for a reason
    /// other than already-exists.
    pub async fn init_project(
        &self,
        vector: &Arc<VectorService>,
        project_id: &str,
        config: &ProjectCollectionsConfig,
    ) -> Result<ProjectCollections> {
        let collections = ProjectCollections {
            chunks: project_collection(project_id, "chunks"),
            symbols: project_collection(project_id, "symbols"),
        };

        tracing::info!(
            project_id,
            chunks = %collections.chunks,
            symbols = %collections.symbols,
            dim = config.dimension,
            "Initializing project vector collections"
        );

        for name in collections.iter() {
            match vector.create_collection(name, config.dimension).await {
                Ok(()) => {
                    tracing::debug!(collection = name, "Vector collection ensured");
                }
                Err(e) => {
                    // RRO's `AlreadyExists` surfaces as an opaque
                    // anyhow string; substring match is the contract
                    // the wrapper exposes today.
                    let msg = format!("{e:#}");
                    if msg.contains("already exists") || msg.contains("AlreadyExists") {
                        tracing::debug!(collection = name, "Vector collection already exists");
                    } else {
                        return Err(e).with_context(|| {
                            format!("Failed to create project vector collection '{name}'")
                        });
                    }
                }
            }
        }

        self.cols
            .write()
            .await
            .insert(project_id.to_string(), collections.clone());

        tracing::info!(project_id, "Project vector collections ready");
        Ok(collections)
    }

    /// Get already-initialized collections for a project.
    pub async fn get(&self, project_id: &str) -> Option<ProjectCollections> {
        self.cols.read().await.get(project_id).cloned()
    }

    /// Delete every per-project collection from the shared
    /// `VectorService`. Use on project removal — irreversible.
    ///
    /// # Errors
    /// Returns error if any deletion fails. Best-effort across the
    /// collection set; partial failure leaves the rest of the
    /// collections untouched.
    pub async fn delete_project(
        &self,
        vector: &Arc<VectorService>,
        project_id: &str,
    ) -> Result<()> {
        let cached = self.cols.write().await.remove(project_id);
        let collections = cached.unwrap_or_else(|| ProjectCollections {
            chunks: project_collection(project_id, "chunks"),
            symbols: project_collection(project_id, "symbols"),
        });

        for name in collections.iter() {
            if let Err(e) = vector.delete_collection(name).await {
                let msg = format!("{e:#}");
                if msg.contains("not found") || msg.contains("NotFound") {
                    tracing::debug!(collection = name, "Vector collection already absent");
                } else {
                    return Err(e).with_context(|| {
                        format!("Failed to delete project vector collection '{name}'")
                    });
                }
            }
        }

        tracing::info!(project_id, "Project vector collections deleted");
        Ok(())
    }

    /// Forget all cached collection mappings on shutdown.
    pub async fn shutdown(&self) {
        self.cols.write().await.clear();
    }
}

/// Canonical collection name for a `(project_id, purpose)` pair.
#[must_use]
pub fn project_collection(project_id: &str, purpose: &str) -> String {
    let mut out = String::with_capacity("proj___".len() + project_id.len() + purpose.len());
    out.push_str("proj_");
    for ch in project_id.chars() {
        if ch.is_ascii_alphanumeric() || ch == '_' {
            out.push(ch);
        } else {
            out.push('_');
        }
    }
    out.push_str("__");
    out.push_str(purpose);
    out
}
