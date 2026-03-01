//! `DevMaestro` commands — system status and health checks.
//!
//! These commands delegate to the Platform facade.
//! No maestro types are exposed — only engine public types.

use crate::state::AppState;
use devpulse_engine::platform::SystemHealth;
use tauri::State;

/// Get the current system health status.
///
/// Pings all database subsystems and returns aggregate health.
///
/// # Errors
/// This command is infallible — health status is always returned.
#[tauri::command]
pub async fn get_status(state: State<'_, AppState>) -> Result<SystemHealth, String> {
    Ok(state.platform.health().await)
}
