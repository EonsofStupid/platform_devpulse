//! Model commands - registry and loading
//!
//! Commands:
//! - list_models, list_models_by_family, get_model_summary
//! - set_active_model (with persistence and events)
//! - get_model_load_states
//! - load_vl_model, unload_vl_model, get_current_vl_model

use crate::helpers::parse_model_family;
use crate::state::AppState;
use crate::types::ModelLoadEvent;
use shared::types::models::{ModelInfo, ModelLoadState, ModelSummary};
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, State};

/// List all available models
#[tauri::command]
pub async fn list_models(state: State<'_, AppState>) -> Result<Vec<ModelInfo>, String> {
    let engine = state.engine().await?;
    engine.models.list_all().map_err(|e| e.to_string())
}

/// List models by family (vl, embed, rerank)
#[tauri::command]
pub async fn list_models_by_family(
    family: String,
    state: State<'_, AppState>,
) -> Result<Vec<ModelInfo>, String> {
    let engine = state.engine().await?;
    let family = parse_model_family(&family)?;
    engine.models.list_family(family).map_err(|e| e.to_string())
}

/// Get model summary
#[tauri::command]
pub async fn get_model_summary(state: State<'_, AppState>) -> Result<ModelSummary, String> {
    let engine = state.engine().await?;
    engine.models.summary().map_err(|e| e.to_string())
}

/// Set active model (with persistence)
#[tauri::command]
pub async fn set_active_model(
    id: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let engine = state.engine().await?;

    // Emit loading started
    let _ = app.emit(
        "model-loading",
        ModelLoadEvent {
            model_id: id.clone(),
            stage: "starting".to_string(),
            progress_pct: 0,
            error: None,
        },
    );

    // Get database reference and set active with persistence
    let db = engine.database();
    match engine.models.set_active_with_persistence(&id, &db).await {
        Ok(()) => {
            let _ = app.emit(
                "model-loading",
                ModelLoadEvent {
                    model_id: id,
                    stage: "complete".to_string(),
                    progress_pct: 100,
                    error: None,
                },
            );
            Ok(())
        }
        Err(e) => {
            let _ = app.emit(
                "model-loading",
                ModelLoadEvent {
                    model_id: id,
                    stage: "error".to_string(),
                    progress_pct: 0,
                    error: Some(e.to_string()),
                },
            );
            Err(e.to_string())
        }
    }
}

/// Get model load states
#[tauri::command]
pub async fn get_model_load_states(
    state: State<'_, AppState>,
) -> Result<HashMap<String, ModelLoadState>, String> {
    let engine = state.engine().await?;
    engine.models.get_load_states().map_err(|e| e.to_string())
}

/// Load a VL model into VRAM
///
/// This actually loads the model weights. Use this to load 4B or 8B VL models.
#[tauri::command]
pub async fn load_vl_model(
    model_id: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let engine = state.engine().await?;

    // Emit loading started
    let _ = app.emit(
        "model-loading",
        ModelLoadEvent {
            model_id: model_id.clone(),
            stage: "loading".to_string(),
            progress_pct: 0,
            error: None,
        },
    );

    // Load the model (this actually loads into VRAM)
    match engine.models.load_vl_model(&model_id) {
        Ok(()) => {
            let _ = app.emit(
                "model-loading",
                ModelLoadEvent {
                    model_id,
                    stage: "complete".to_string(),
                    progress_pct: 100,
                    error: None,
                },
            );
            Ok(())
        }
        Err(e) => {
            let _ = app.emit(
                "model-loading",
                ModelLoadEvent {
                    model_id,
                    stage: "error".to_string(),
                    progress_pct: 0,
                    error: Some(e.to_string()),
                },
            );
            Err(e.to_string())
        }
    }
}

/// Unload current VL model from VRAM
#[tauri::command]
pub async fn unload_vl_model(state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine.models.unload_vl_model();
    Ok(())
}

/// Get currently loaded VL model ID
#[tauri::command]
pub async fn get_current_vl_model(state: State<'_, AppState>) -> Result<Option<String>, String> {
    let engine = state.engine().await?;
    Ok(engine.models.current_vl_model())
}

// ============== Download Commands ==============

use serde::{Deserialize, Serialize};

/// Download progress event
#[derive(Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub model_id: String,
    pub downloaded: u64,
    pub total: u64,
    pub stage: String,
}

/// Download a model from HuggingFace
///
/// Streams the download and emits progress events.
#[tauri::command]
pub async fn download_model(
    model_id: String,
    app: AppHandle,
    _state: State<'_, AppState>,
) -> Result<(), String> {
    use orchestrator::infra::download::{DownloadService, known_models};

    // Get models directory from paths
    let models_dir = shared::config::paths::get_paths().models_dir.clone();

    // Get download list for this model
    let downloads = known_models::for_model_id(&model_id, &models_dir)
        .ok_or_else(|| format!("Unknown model: {}. Manual download required.", model_id))?;

    if downloads.is_empty() {
        return Err("No files to download for this model".to_string());
    }

    // Create download service
    let service = DownloadService::new();

    // Track total progress across all files
    let total_files = downloads.len();
    let app_handle = app.clone();
    let model_id_clone = model_id.clone();

    for (idx, download) in downloads.into_iter().enumerate() {
        // Emit file start
        let _ = app_handle.emit("download-progress", DownloadProgress {
            model_id: model_id_clone.clone(),
            downloaded: 0,
            total: 0,
            stage: format!("file {} of {}: {}", idx + 1, total_files, download.filename),
        });

        // Create progress callback
        let app_for_cb = app_handle.clone();
        let model_for_cb = model_id_clone.clone();
        let filename = download.filename.clone();

        let progress_cb: orchestrator::infra::download::ProgressCallback = Box::new(move |downloaded, total, stage| {
            let _ = app_for_cb.emit("download-progress", DownloadProgress {
                model_id: model_for_cb.clone(),
                downloaded,
                total,
                stage: format!("{}: {}", filename, stage),
            });
        });

        // Download the file
        service.download_hf_file(
            &download.repo_id,
            &download.filename,
            &download.dest_path,
            Some(progress_cb),
        )
        .await
        .map_err(|e| format!("Download failed: {}", e))?;
    }

    // Emit completion
    let _ = app.emit("download-progress", DownloadProgress {
        model_id: model_id.clone(),
        downloaded: 100,
        total: 100,
        stage: "complete".to_string(),
    });

    Ok(())
}

/// Get download size for a model (without downloading)
#[tauri::command]
pub async fn get_model_download_size(
    model_id: String,
) -> Result<u64, String> {
    use orchestrator::infra::download::{DownloadService, known_models};

    let models_dir = shared::config::paths::get_paths().models_dir.clone();

    let downloads = known_models::for_model_id(&model_id, &models_dir)
        .ok_or_else(|| format!("Unknown model: {}", model_id))?;

    let service = DownloadService::new();
    let mut total_size = 0u64;

    for download in downloads {
        match service.get_file_size(&download.repo_id, &download.filename).await {
            Ok(size) => total_size += size,
            Err(e) => {
                eprintln!("Could not get size for {}: {}", download.filename, e);
            }
        }
    }

    Ok(total_size)
}

// ============== Role Assignment Commands ==============

/// Set a model to a specific system role
///
/// Roles:
/// - encoder: Embedder for semantic search
/// - mainCortex: Primary reasoning model
/// - reasoning: Deep thinking tasks
/// - minion: Background workers
#[tauri::command]
pub async fn set_model_role(
    role: String,
    model_id: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let engine = state.engine().await?;
    let db = engine.database();

    // Validate role
    let valid_roles = ["encoder", "mainCortex", "reasoning", "minion"];
    if !valid_roles.contains(&role.as_str()) {
        return Err(format!("Invalid role: {}. Valid roles: {:?}", role, valid_roles));
    }

    // Store role assignment in user config
    let config_key = format!("model_role_{}", role);
    let value = model_id.unwrap_or_default();

    db.set_user_config(&config_key, &value, "model_roles")
        .await
        .map_err(|e| e.to_string())?;

    // Log role assignment (tracing not available in this crate)
    eprintln!("[models] Set {} role to: {}", role, if value.is_empty() { "none" } else { &value });
    Ok(())
}

/// Get model role assignments
#[tauri::command]
pub async fn get_model_roles(
    state: State<'_, AppState>,
) -> Result<HashMap<String, Option<String>>, String> {
    let engine = state.engine().await?;
    let db = engine.database();

    let mut roles = HashMap::new();

    for role in ["encoder", "mainCortex", "reasoning", "minion"] {
        let config_key = format!("model_role_{}", role);
        let value = db.get_user_config(&config_key)
            .await
            .map_err(|e| e.to_string())?
            .map(|e| e.value)
            .filter(|v| !v.is_empty());
        roles.insert(role.to_string(), value);
    }

    Ok(roles)
}
