//! Model management Tauri commands.
//!
//! Thin wrappers around `ModelLoaderService` methods.
//! All commands are feature-gated behind `inference` on the engine.

use crate::state::PlatformState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// Serializable slot info for the frontend.
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

/// Serializable model entry for the frontend.
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

/// Get hardware metrics.
#[tauri::command]
#[specta::specta]
pub async fn get_hardware_metrics(
    state: State<'_, PlatformState>,
) -> Result<HardwareInfo, String> {
    let guard = state.platform.read().await;
    let platform = guard.as_ref().ok_or("Platform not ready")?;

    // Use model-loader's hardware collection via engine
    let metrics = devpulse_engine::platform::metrics::collect(
        platform.uptime_secs(),
    );

    Ok(HardwareInfo {
        cpu_usage_percent: metrics.cpu_usage_percent,
        cpu_cores: 0, // ProcessMetrics doesn't have cores — enhanced in Phase 7
        cpu_name: String::new(),
        ram_total_mb: 0,
        ram_used_mb: 0,
        ram_available_mb: 0,
        gpu_name: None,
        gpu_vram_total_mb: None,
        gpu_vram_used_mb: None,
        gpu_vram_free_mb: None,
        gpu_utilization_percent: None,
        gpu_temperature_c: None,
        process_ram_mb: metrics.memory_rss_bytes / (1024 * 1024),
        process_vram_mb: 0,
    })
}

/// Scan the models directory for GGUF files.
#[tauri::command]
#[specta::specta]
pub async fn scan_models() -> Result<Vec<ModelInfo>, String> {
    // Phase 7: wire to actual ModelLoaderService instance in engine state
    Ok(Vec::new())
}

/// Get all registered slots.
#[tauri::command]
#[specta::specta]
pub async fn get_slots() -> Result<Vec<SlotInfo>, String> {
    // Phase 7: wire to actual ModelLoaderService instance in engine state
    Ok(Vec::new())
}

/// Check if this is the first run (no models configured).
#[tauri::command]
#[specta::specta]
pub async fn is_first_run() -> Result<bool, String> {
    // Phase 7: wire to actual ModelLoaderService
    Ok(true)
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
    // Phase 10: wire to ModelLoaderService.inference_handle(slot_id)
    // For now, return a placeholder that proves the command pipeline works
    Err(format!(
        "No model loaded in slot '{}'. Open Model Control to set up your AI.",
        slot_id
    ))
}
