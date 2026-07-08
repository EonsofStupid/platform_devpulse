//! Vector store commands — RRO retrieval config and health.
//!
//! Read and mutate retrieval config at runtime. Query collection
//! health and run test searches from the devtools UI.
//!
//! # Tier-2 seam (standalone desktop vs. kernel-inproc)
//!
//! The RRO/qortex vector store is a **Tier-2** capability: it is kernel-side
//! (headless Clyffy / ClyffyOS) and is NOT linked into the standalone DevPulse
//! desktop — the desktop's Turso store hard-enables a `parking_lot` feature
//! mutually exclusive with qortex's, so the two cannot co-compile (see the
//! `kernel-inproc` feature in `Cargo.toml`).
//!
//! These command entry points therefore keep a **stable** Tauri/specta
//! signature so the generated frontend bindings never churn, but in the default
//! (no `kernel-inproc`) build they return a typed "Tier-2 unavailable" — the
//! exact seam the gb10-client wire calls replace once Clyffy connects. The real
//! in-process implementation is compiled only under `kernel-inproc`.

use crate::state::PlatformState;
use devpulse_engine::platform::{retrieval_param_meta, RetrievalConfig, RetrievalParamMeta};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// Returned by the vector-store commands when the in-process qortex store is
/// not linked (standalone desktop). Connect Clyffy (gb10-client wire) to enable.
#[cfg(not(feature = "kernel-inproc"))]
const VECTOR_TIER2_UNAVAILABLE: &str = "Vector store unavailable — RRO/qortex is a Tier-2 capability served by Clyffy over the gb10-client wire. Connect Clyffy to enable.";

// ═══════════════════════════════════════════════════════════════
// Config commands
// ═══════════════════════════════════════════════════════════════

/// Get the current retrieval configuration.
///
/// # Errors
/// Returns error if platform is still booting, the vector store is disabled,
/// or (standalone desktop) the store is a not-yet-connected Tier-2 capability.
#[tauri::command]
#[specta::specta]
pub async fn get_vector_config(state: State<'_, PlatformState>) -> Result<RetrievalConfig, String> {
    #[cfg(feature = "kernel-inproc")]
    {
        // P0: lock-free atomic load.
        match state.platform.load_full() {
            Some(platform) => match platform.vector() {
                Some(v) => Ok(v.retrieval_config_snapshot().await),
                None => Err("Vector store not available".to_string()),
            },
            None => Err("Platform is still booting".to_string()),
        }
    }
    #[cfg(not(feature = "kernel-inproc"))]
    {
        let _ = &state;
        Err(VECTOR_TIER2_UNAVAILABLE.to_string())
    }
}

/// Update the retrieval configuration at runtime.
///
/// Changes take effect immediately — no restart required.
///
/// # Errors
/// Returns error if platform is still booting, the vector store is disabled,
/// or (standalone desktop) the store is a not-yet-connected Tier-2 capability.
#[tauri::command]
#[specta::specta]
pub async fn set_vector_config(
    state: State<'_, PlatformState>,
    config: RetrievalConfig,
) -> Result<(), String> {
    #[cfg(feature = "kernel-inproc")]
    {
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
    #[cfg(not(feature = "kernel-inproc"))]
    {
        let _ = (&state, &config);
        Err(VECTOR_TIER2_UNAVAILABLE.to_string())
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
/// Returns error if platform is still booting, the vector store is disabled,
/// or (standalone desktop) the store is a not-yet-connected Tier-2 capability.
#[tauri::command]
#[specta::specta]
pub async fn get_vector_health(
    state: State<'_, PlatformState>,
) -> Result<VectorHealthReport, String> {
    #[cfg(feature = "kernel-inproc")]
    {
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
    #[cfg(not(feature = "kernel-inproc"))]
    {
        let _ = &state;
        Err(VECTOR_TIER2_UNAVAILABLE.to_string())
    }
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
/// Returns error if platform is booting, the vector store is disabled, the
/// search fails, or (standalone desktop) the store is a not-yet-connected
/// Tier-2 capability.
#[tauri::command]
#[specta::specta]
pub async fn vector_test_search(
    state: State<'_, PlatformState>,
    collection: String,
    vector: Vec<f32>,
    limit: u32,
) -> Result<Vec<VectorSearchResult>, String> {
    #[cfg(feature = "kernel-inproc")]
    {
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
    #[cfg(not(feature = "kernel-inproc"))]
    {
        let _ = (&state, &collection, &vector, limit);
        Err(VECTOR_TIER2_UNAVAILABLE.to_string())
    }
}

// ═══════════════════════════════════════════════════════════════
// Collection management
// ═══════════════════════════════════════════════════════════════

/// Create a new vector collection with the given dimensionality.
///
/// Default dimension for nomic-embed-text-v1.5 is 768 (cosine distance).
/// Collection-level settings are fixed at creation.
///
/// # Errors
/// Returns error if platform is booting, the vector store is disabled, creation
/// fails, or (standalone desktop) the store is a not-yet-connected Tier-2
/// capability.
#[tauri::command]
#[specta::specta]
pub async fn create_vector_collection(
    state: State<'_, PlatformState>,
    name: String,
    dimension: u32,
) -> Result<(), String> {
    #[cfg(feature = "kernel-inproc")]
    {
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
    #[cfg(not(feature = "kernel-inproc"))]
    {
        let _ = (&state, &name, dimension);
        Err(VECTOR_TIER2_UNAVAILABLE.to_string())
    }
}

/// Delete a vector collection and all its points.
///
/// # Errors
/// Returns error if platform is booting, the vector store is disabled, deletion
/// fails, or (standalone desktop) the store is a not-yet-connected Tier-2
/// capability.
#[tauri::command]
#[specta::specta]
pub async fn delete_vector_collection(
    state: State<'_, PlatformState>,
    name: String,
) -> Result<(), String> {
    #[cfg(feature = "kernel-inproc")]
    {
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
    #[cfg(not(feature = "kernel-inproc"))]
    {
        let _ = (&state, &name);
        Err(VECTOR_TIER2_UNAVAILABLE.to_string())
    }
}

// ═══════════════════════════════════════════════════════════════
// Param metadata — drives the devtools slider UI
// ═══════════════════════════════════════════════════════════════

/// Get the layman-labeled parameter registry for retrieval config.
///
/// Returns field metadata (label, family, description, slider bounds)
/// so the frontend renders sliders generically without hardcoded labels.
///
/// Always available — pure metadata, independent of the vector store backend,
/// so the retrieval-config UI renders identically in Tier-1 and Tier-2.
///
/// # Errors
/// Infallible — the `Result` shape is kept for binding parity with the
/// sibling `Result`-returning retrieval-config commands so the TS
/// surface stays uniform.
#[tauri::command]
#[specta::specta]
pub async fn get_retrieval_param_meta() -> Result<Vec<RetrievalParamMeta>, String> {
    Ok(retrieval_param_meta())
}
