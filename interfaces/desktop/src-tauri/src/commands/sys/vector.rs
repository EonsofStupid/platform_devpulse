//! Vector store commands — RRO retrieval config and health.
//!
//! Read and mutate retrieval config at runtime. Query collection
//! health and run test searches from the devtools UI.
//!
//! Mirrors the telemetry.rs pattern: `Arc<RwLock<RetrievalConfig>>`
//! on `VectorService`, get/set via Tauri commands.

use crate::state::PlatformState;
use devpulse_engine::platform::{RetrievalConfig, RetrievalParamMeta, retrieval_param_meta};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

// ═══════════════════════════════════════════════════════════════
// Config commands
// ═══════════════════════════════════════════════════════════════

/// Get the current retrieval configuration.
///
/// # Errors
/// Returns error if platform is still booting or vector store is disabled.
#[tauri::command]
#[specta::specta]
pub async fn get_vector_config(
    state: State<'_, PlatformState>,
) -> Result<RetrievalConfig, String> {
    // P0: lock-free atomic load.
    match state.platform.load_full() {
        Some(platform) => match platform.vector() {
            Some(v) => Ok(v.retrieval_config_snapshot().await),
            None => Err("Vector store not available".to_string()),
        },
        None => Err("Platform is still booting".to_string()),
    }
}

/// Update the retrieval configuration at runtime.
///
/// Changes take effect immediately — no restart required.
///
/// # Errors
/// Returns error if platform is still booting or vector store is disabled.
#[tauri::command]
#[specta::specta]
pub async fn set_vector_config(
    state: State<'_, PlatformState>,
    config: RetrievalConfig,
) -> Result<(), String> {
    // P0: lock-free atomic load.
    match state.platform.load_full() {
        Some(platform) => match platform.vector() {
            Some(v) => {
                v.update_retrieval_config(config).await;
                Ok(())
            }
            None => Err("Vector store not available".to_string()),
        },
        None => Err("Platform is still booting".to_string()),
    }
}

// ═══════════════════════════════════════════════════════════════
// Health commands
// ═══════════════════════════════════════════════════════════════

/// Collection info returned by health check.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CollectionInfo {
    /// Collection name.
    pub name: String,
    /// Number of points in the collection.
    pub point_count: u64,
}

/// Vector store health report.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VectorHealthReport {
    /// Resolved storage path on disk.
    pub storage_path: String,
    /// Collections with their point counts.
    pub collections: Vec<CollectionInfo>,
}

/// Get vector store health — collections, point counts, storage path.
///
/// # Errors
/// Returns error if platform is still booting or vector store is disabled.
#[tauri::command]
#[specta::specta]
pub async fn get_vector_health(
    state: State<'_, PlatformState>,
) -> Result<VectorHealthReport, String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_string())?;
    let vector_svc = platform
        .vector()
        .ok_or_else(|| "Vector store not available".to_string())?;

    let adapter = vector_svc.adapter();

    let names = adapter
        .list_collections()
        .await
        .map_err(|e| format!("List collections failed: {e:#}"))?;

    let mut collections = Vec::with_capacity(names.len());
    for name in names {
        let count = adapter
            .count_points(&name)
            .await
            .map(|c| c as u64)
            .unwrap_or(0);
        collections.push(CollectionInfo {
            name,
            point_count: count,
        });
    }

    // Read storage path from config (boot_config is stored on Platform).
    let storage_path = platform.config().data_dir.clone();

    Ok(VectorHealthReport {
        storage_path,
        collections,
    })
}

// ═══════════════════════════════════════════════════════════════
// Search test bench
// ═══════════════════════════════════════════════════════════════

/// A single search result for the devtools test bench.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VectorSearchResult {
    /// Point ID in the vector store.
    pub id: String,
    /// Similarity score (higher = more similar).
    pub score: f32,
    /// JSON payload attached to this point (serialized string).
    pub payload_json: String,
}

/// Run a test search against a collection with a raw vector.
///
/// For the full embed-then-search flow, call `embed_text` first to get the
/// vector, then pass it here. This keeps the test bench decoupled from
/// the encoder slot.
///
/// # Errors
/// Returns error if platform is booting, vector store is disabled,
/// or the search fails.
#[tauri::command]
#[specta::specta]
pub async fn vector_test_search(
    state: State<'_, PlatformState>,
    collection: String,
    vector: Vec<f32>,
    limit: u32,
) -> Result<Vec<VectorSearchResult>, String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_string())?;
    let vector_svc = platform
        .vector()
        .ok_or_else(|| "Vector store not available".to_string())?;

    let matches = vector_svc
        .search(&collection, &vector, limit as usize, None)
        .await
        .map_err(|e| format!("Vector search failed: {e:#}"))?;

    Ok(matches
        .into_iter()
        .map(|m| VectorSearchResult {
            id: m.id,
            score: m.score,
            payload_json: serde_json::to_string(&m.payload).unwrap_or_default(),
        })
        .collect())
}

// ═══════════════════════════════════════════════════════════════
// Collection management
// ═══════════════════════════════════════════════════════════════

/// Create a new vector collection with the given dimensionality.
///
/// Default dimension for nomic-embed-text-v1.5 is 768 (cosine distance).
///
/// # Errors
/// Returns error if platform is booting, vector store is disabled,
/// or collection creation fails.
#[tauri::command]
#[specta::specta]
pub async fn create_vector_collection(
    state: State<'_, PlatformState>,
    name: String,
    dimension: u32,
) -> Result<(), String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_string())?;
    let vector_svc = platform
        .vector()
        .ok_or_else(|| "Vector store not available".to_string())?;

    vector_svc
        .create_collection(&name, dimension)
        .await
        .map_err(|e| format!("Create collection failed: {e:#}"))
}

/// Delete a vector collection and all its points.
///
/// # Errors
/// Returns error if platform is booting, vector store is disabled,
/// or collection deletion fails.
#[tauri::command]
#[specta::specta]
pub async fn delete_vector_collection(
    state: State<'_, PlatformState>,
    name: String,
) -> Result<(), String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_string())?;
    let vector_svc = platform
        .vector()
        .ok_or_else(|| "Vector store not available".to_string())?;

    vector_svc
        .delete_collection(&name)
        .await
        .map_err(|e| format!("Delete collection failed: {e:#}"))
}

// ═══════════════════════════════════════════════════════════════
// Param metadata — drives the devtools slider UI
// ═══════════════════════════════════════════════════════════════

/// Get the layman-labeled parameter registry for retrieval config.
///
/// Returns field metadata (label, family, description, slider bounds)
/// so the frontend renders sliders generically without hardcoded labels.
#[tauri::command]
#[specta::specta]
pub async fn get_retrieval_param_meta() -> Result<Vec<RetrievalParamMeta>, String> {
    Ok(retrieval_param_meta())
}
