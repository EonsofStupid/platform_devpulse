//! Model management Tauri commands.
//!
//! Delegates to `ModelLoaderService` via `PlatformState`.
//! Types flow from `model-loader` crate → specta → TypeScript bindings.

use crate::state::PlatformState;
use devpulse_engine::platform::services::model_loader::ModelLoaderService;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use tauri::State;

/// Serializable slot info for the frontend (maps from model-loader Slot).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SlotInfo {
    pub id: String,
    pub label: String,
    pub capability: String,
    pub preferred_device: String,
    pub loading_strategy: String,
    pub assigned_model_id: Option<String>,
    pub fallback: Option<String>,
}

/// Serializable model entry for the frontend (maps from model-loader ModelRegistryEntry).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ModelInfo {
    pub id: String,
    pub filename: String,
    pub architecture: String,
    pub parameter_count: Option<u64>,
    pub quant_level: Option<String>,
    pub context_length: usize,
    pub size_mb: u64,
    pub vram_estimate_mb: u64,
    pub supported_backends: Vec<String>,
    pub compatible_capabilities: Vec<String>,
}

/// Hardware metrics for the frontend.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct HardwareInfo {
    pub cpu_usage_percent: f32,
    pub cpu_cores: usize,
    pub cpu_name: String,
    pub ram_total_mb: u64,
    pub ram_used_mb: u64,
    pub ram_available_mb: u64,
    pub gpu_name: Option<String>,
    pub gpu_vram_total_mb: Option<u64>,
    pub gpu_vram_used_mb: Option<u64>,
    pub gpu_vram_free_mb: Option<u64>,
    pub gpu_utilization_percent: Option<f32>,
    pub gpu_temperature_c: Option<f32>,
    pub process_ram_mb: u64,
    pub process_vram_mb: u64,
}

/// Helper: get the model loader service from platform state.
async fn get_loader(state: &State<'_, PlatformState>) -> Result<Arc<ModelLoaderService>, String> {
    let guard = state.platform.read().await;
    let platform = guard.as_ref().ok_or("Platform not ready")?;
    platform
        .model_loader()
        .cloned()
        .ok_or_else(|| "Model Loader not available (disabled or failed to boot)".to_string())
}

/// Get hardware metrics from the model loader's hardware monitor.
#[tauri::command]
#[specta::specta]
pub async fn get_hardware_metrics(
    state: State<'_, PlatformState>,
) -> Result<HardwareInfo, String> {
    let loader = get_loader(&state).await?;
    let m = loader.hardware_metrics().await;

    Ok(HardwareInfo {
        cpu_usage_percent: m.cpu_usage_percent,
        cpu_cores: m.cpu_cores,
        cpu_name: m.cpu_name,
        ram_total_mb: m.ram_total_mb,
        ram_used_mb: m.ram_used_mb,
        ram_available_mb: m.ram_available_mb,
        gpu_name: m.gpu_name,
        gpu_vram_total_mb: m.gpu_vram_total_mb,
        gpu_vram_used_mb: m.gpu_vram_used_mb,
        gpu_vram_free_mb: m.gpu_vram_free_mb,
        gpu_utilization_percent: m.gpu_utilization_percent,
        gpu_temperature_c: m.gpu_temperature_c,
        process_ram_mb: m.process_ram_mb,
        process_vram_mb: m.process_vram_mb,
    })
}

/// Scan the models directory for GGUF files.
#[tauri::command]
#[specta::specta]
pub async fn scan_models(
    state: State<'_, PlatformState>,
) -> Result<Vec<ModelInfo>, String> {
    let loader = get_loader(&state).await?;
    let entries = loader.scan_models().await.map_err(|e| e.to_string())?;

    Ok(entries
        .into_iter()
        .map(|e| ModelInfo {
            id: e.id,
            filename: e.filename,
            architecture: e.architecture,
            parameter_count: e.parameter_count,
            quant_level: e.quant_level,
            context_length: e.context_length,
            size_mb: e.size_bytes / (1024 * 1024),
            vram_estimate_mb: e.vram_estimate_mb,
            supported_backends: e.supported_backends.iter().map(|b| b.to_string()).collect(),
            compatible_capabilities: e
                .compatible_capabilities
                .iter()
                .map(|c| c.to_string())
                .collect(),
        })
        .collect())
}

/// Get all registered slots.
#[tauri::command]
#[specta::specta]
pub async fn get_slots(
    state: State<'_, PlatformState>,
) -> Result<Vec<SlotInfo>, String> {
    let loader = get_loader(&state).await?;
    let slots = loader.list_slots().await;

    Ok(slots
        .into_iter()
        .map(|s| SlotInfo {
            id: s.id,
            label: s.label,
            capability: s.capability.to_string(),
            preferred_device: s.preferred_device.to_string(),
            loading_strategy: format!("{:?}", s.loading),
            assigned_model_id: s.assigned_model,
            fallback: s.fallback,
        })
        .collect())
}

/// Check if this is the first run (no models configured).
#[tauri::command]
#[specta::specta]
pub async fn is_first_run(
    state: State<'_, PlatformState>,
) -> Result<bool, String> {
    let loader = get_loader(&state).await?;
    Ok(loader.is_first_run().await)
}

/// Assign a model to a slot.
#[tauri::command]
#[specta::specta]
pub async fn assign_model_to_slot(
    state: State<'_, PlatformState>,
    slot_id: String,
    model_id: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .assign_model(&slot_id, &model_id)
        .await
        .map_err(|e| e.to_string())
}

/// Load a slot's assigned model into memory.
#[tauri::command]
#[specta::specta]
pub async fn load_slot(
    state: State<'_, PlatformState>,
    slot_id: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .load_slot(&slot_id)
        .await
        .map_err(|e| e.to_string())
}

/// Unload a slot's model from memory.
#[tauri::command]
#[specta::specta]
pub async fn unload_slot(
    state: State<'_, PlatformState>,
    slot_id: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .unload_slot(&slot_id)
        .await
        .map_err(|e| e.to_string())
}

/// Start downloading a model from HuggingFace.
/// Returns the download ID for progress tracking.
#[tauri::command]
#[specta::specta]
pub async fn download_model(
    state: State<'_, PlatformState>,
    repo_id: String,
    filename: String,
) -> Result<String, String> {
    let loader = get_loader(&state).await?;
    loader
        .download_model(&repo_id, &filename)
        .await
        .map_err(|e| e.to_string())
}

/// Cancel an active model download.
#[tauri::command]
#[specta::specta]
pub async fn cancel_download(
    state: State<'_, PlatformState>,
    download_id: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .cancel_download(&download_id)
        .await
        .map_err(|e| e.to_string())
}

/// Search result from HuggingFace.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct HfSearchResultInfo {
    pub repo_id: String,
    pub author: String,
    pub model_name: String,
    pub downloads: u64,
    pub likes: u64,
    pub pipeline_tag: Option<String>,
    pub tags: Vec<String>,
    pub gguf_files: Vec<HfFileInfoItem>,
    pub last_modified: String,
}

/// A GGUF file in a HuggingFace repo.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct HfFileInfoItem {
    pub filename: String,
    pub size_bytes: u64,
    pub quant_level: Option<String>,
}

/// Search HuggingFace for GGUF models.
#[tauri::command]
#[specta::specta]
pub async fn search_huggingface(
    state: State<'_, PlatformState>,
    query: String,
    limit: Option<u32>,
) -> Result<Vec<HfSearchResultInfo>, String> {
    let loader = get_loader(&state).await?;
    let results = loader
        .search_huggingface(&query, limit.unwrap_or(20))
        .await
        .map_err(|e| e.to_string())?;

    Ok(results
        .into_iter()
        .map(|r| HfSearchResultInfo {
            repo_id: r.repo_id,
            author: r.author,
            model_name: r.model_name,
            downloads: r.downloads,
            likes: r.likes,
            pipeline_tag: r.pipeline_tag,
            tags: r.tags,
            gguf_files: r
                .gguf_files
                .into_iter()
                .map(|f| HfFileInfoItem {
                    filename: f.filename,
                    size_bytes: f.size_bytes,
                    quant_level: f.quant_level,
                })
                .collect(),
            last_modified: r.last_modified,
        })
        .collect())
}

/// Auto-configure model recommendations based on detected hardware.
#[tauri::command]
#[specta::specta]
pub async fn auto_configure(
    state: State<'_, PlatformState>,
) -> Result<String, String> {
    let loader = get_loader(&state).await?;
    let config = loader.auto_configure().await;
    serde_json::to_string(&config).map_err(|e| e.to_string())
}

/// Generate text using a loaded model slot.
/// Streams tokens via Tauri events. Returns the full generated text.
#[tauri::command]
#[specta::specta]
pub async fn inference_generate(
    slot_id: String,
    prompt: String,
    max_tokens: u32,
    temperature: f32,
) -> Result<String, String> {
    // Inference generation requires a loaded model — this will be wired
    // to InferenceHandle.generate() when a model is loaded in a slot.
    Err(format!(
        "No model loaded in slot '{}'. Open Model Control to set up your AI.",
        slot_id
    ))
}
