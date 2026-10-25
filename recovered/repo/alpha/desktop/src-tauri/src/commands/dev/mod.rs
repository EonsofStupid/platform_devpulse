//! Dev-only commands - feature-gated for development builds
//!
//! Commands:
//! - dev_list_internal_models: List internal model details
//! - dev_system_diagnostics: Get system diagnostics

use crate::AppState;
use tauri::State;

#[derive(serde::Serialize)]
pub struct InternalModelInfo {
    pub id: String,
    pub internal_name: String,
    pub parameters: u64,
    pub quantization: String,
    pub memory_mb: u32,
}

#[derive(serde::Serialize)]
pub struct SystemDiagnostics {
    pub memory_used_mb: u64,
    pub memory_total_mb: u64,
    pub cpu_usage_percent: f32,
    pub gpu_available: bool,
    pub active_threads: u32,
}

#[tauri::command]
pub async fn dev_list_internal_models(
    _state: State<'_, AppState>,
) -> Result<Vec<InternalModelInfo>, String> {
    // Stub - will wire to engine.dev.list_internal_models() later
    Ok(vec![InternalModelInfo {
        id: "llama3.2:3b".to_string(),
        internal_name: "llama-3.2-3b-instruct-q4_0".to_string(),
        parameters: 3_000_000_000,
        quantization: "Q4_0".to_string(),
        memory_mb: 2048,
    }])
}

#[tauri::command]
pub async fn dev_system_diagnostics(
    _state: State<'_, AppState>,
) -> Result<SystemDiagnostics, String> {
    // Stub - will wire to engine.dev.system_diagnostics() later
    Ok(SystemDiagnostics {
        memory_used_mb: 1024,
        memory_total_mb: 16384,
        cpu_usage_percent: 15.0,
        gpu_available: false,
        active_threads: 4,
    })
}
