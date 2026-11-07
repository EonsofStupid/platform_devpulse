//! Status commands - engine and system health
//!
//! Commands:
//! - get_status: Basic engine status
//! - get_system_status: Detailed component status
//! - get_adapters, set_adapter: Adapter management
//! - get_analytics: Dashboard metrics

use crate::state::AppState;
use crate::types::StatusInfo;
use engine::SystemStatusSnapshot;
use tauri::State;

/// Get engine status
#[tauri::command]
pub async fn get_status(state: State<'_, AppState>) -> Result<StatusInfo, String> {
    let engine = state.engine().await?;
    let status = engine.status().await;

    Ok(StatusInfo {
        ai_ready: status.ai_ready,
        voice_ready: status.voice_ready,
        projects_count: status.projects_count,
        sessions_count: status.sessions_count,
        active_adapter: status.active_adapter,
    })
}

/// Get detailed system status (components: rro, embedder, llm, etc)
#[tauri::command]
pub async fn get_system_status(state: State<'_, AppState>) -> Result<SystemStatusSnapshot, String> {
    let engine = state.engine().await?;
    Ok(engine.system_status.snapshot())
}

/// Get available adapters
#[tauri::command]
pub async fn get_adapters(state: State<'_, AppState>) -> Result<Vec<engine::AdapterInfo>, String> {
    let engine = state.engine().await?;
    Ok(engine.adapters.list())
}

/// Set active adapter
#[tauri::command]
pub async fn set_adapter(kind: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine
        .adapters
        .set_active_str(&kind)
        .map_err(|e| e.to_string())
}

/// Get analytics stats for dashboard (user-facing subset)
#[tauri::command]
pub async fn get_analytics(state: State<'_, AppState>) -> Result<engine::AnalyticsSummary, String> {
    let engine = state.engine().await?;
    engine.get_user_analytics().await.map_err(|e| e.to_string())
}
