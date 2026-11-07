//! Discovery commands - model folder scanning
//!
//! Commands:
//! - scan_models: One-off directory scan
//! - set_model_directory: Set and scan persistent path
//! - get_discovered_models, get_vl_models: Cached results
//! - select_discovered_model, get_selected_model

use crate::state::AppState;
use crate::types::DiscoveredModel;
use tauri::State;

/// Scan a directory for GGUF models
#[tauri::command]
pub async fn scan_models(
    path: String,
    state: State<'_, AppState>,
) -> Result<Vec<DiscoveredModel>, String> {
    let engine = state.engine().await?;

    let models = engine
        .discovery
        .scan_directory(&path)
        .map_err(|e| e.to_string())?;

    Ok(models
        .into_iter()
        .map(|m| DiscoveredModel {
            id: m.id.clone(),
            name: m.name.clone(),
            path: m.path.to_string_lossy().to_string(),
            mmproj_path: m.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
            params_b: m.params_b,
            quantization: m.quantization.clone(),
            family: m.family.clone(),
            is_vl: m.is_vl,
            vram_gb: m.vram_estimate_gb,
            size_human: m.size_human(),
        })
        .collect())
}

/// Set model directory and refresh discovery
#[tauri::command]
pub async fn set_model_directory(
    path: String,
    state: State<'_, AppState>,
) -> Result<Vec<DiscoveredModel>, String> {
    let engine = state.engine().await?;

    // Set the path (this also refreshes models)
    engine
        .discovery
        .set_model_path(&path)
        .await
        .map_err(|e| e.to_string())?;

    // Return discovered models
    let models = engine.discovery.models().await;

    Ok(models
        .into_iter()
        .map(|m| DiscoveredModel {
            id: m.id.clone(),
            name: m.name.clone(),
            path: m
                .path
                .as_ref()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default(),
            mmproj_path: m.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
            params_b: m.params_b,
            quantization: m.quantization.clone(),
            family: m.family.clone(),
            is_vl: m.is_vl,
            vram_gb: m.vram_gb,
            size_human: m.size_human.clone(),
        })
        .collect())
}

/// Get discovered models (cached)
#[tauri::command]
pub async fn get_discovered_models(
    state: State<'_, AppState>,
) -> Result<Vec<DiscoveredModel>, String> {
    let engine = state.engine().await?;
    let models = engine.discovery.models().await;

    Ok(models
        .into_iter()
        .map(|m| DiscoveredModel {
            id: m.id.clone(),
            name: m.name.clone(),
            path: m
                .path
                .as_ref()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default(),
            mmproj_path: m.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
            params_b: m.params_b,
            quantization: m.quantization.clone(),
            family: m.family.clone(),
            is_vl: m.is_vl,
            vram_gb: m.vram_gb,
            size_human: m.size_human.clone(),
        })
        .collect())
}

/// Get VL models only
#[tauri::command]
pub async fn get_vl_models(state: State<'_, AppState>) -> Result<Vec<DiscoveredModel>, String> {
    let engine = state.engine().await?;
    let models = engine.discovery.vl_models().await;

    Ok(models
        .into_iter()
        .map(|m| DiscoveredModel {
            id: m.id.clone(),
            name: m.name.clone(),
            path: m
                .path
                .as_ref()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default(),
            mmproj_path: m.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
            params_b: m.params_b,
            quantization: m.quantization.clone(),
            family: m.family.clone(),
            is_vl: m.is_vl,
            vram_gb: m.vram_gb,
            size_human: m.size_human.clone(),
        })
        .collect())
}

/// Select a model for use
#[tauri::command]
pub async fn select_discovered_model(
    id: String,
    state: State<'_, AppState>,
) -> Result<DiscoveredModel, String> {
    let engine = state.engine().await?;
    let model = engine
        .discovery
        .select_model(&id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(DiscoveredModel {
        id: model.id.clone(),
        name: model.name.clone(),
        path: model
            .path
            .as_ref()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        mmproj_path: model.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
        params_b: model.params_b,
        quantization: model.quantization.clone(),
        family: model.family.clone(),
        is_vl: model.is_vl,
        vram_gb: model.vram_gb,
        size_human: model.size_human.clone(),
    })
}

/// Get selected model
#[tauri::command]
pub async fn get_selected_model(
    state: State<'_, AppState>,
) -> Result<Option<DiscoveredModel>, String> {
    let engine = state.engine().await?;
    let model = engine.discovery.selected_model().await;

    Ok(model.map(|m| DiscoveredModel {
        id: m.id.clone(),
        name: m.name.clone(),
        path: m
            .path
            .as_ref()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        mmproj_path: m.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
        params_b: m.params_b,
        quantization: m.quantization.clone(),
        family: m.family.clone(),
        is_vl: m.is_vl,
        vram_gb: m.vram_gb,
        size_human: m.size_human.clone(),
    }))
}
