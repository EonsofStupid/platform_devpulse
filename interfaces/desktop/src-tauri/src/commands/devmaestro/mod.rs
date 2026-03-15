//! `DevMaestro` commands — system status and health checks.
//!
//! These commands delegate to the Platform engine.
//! No maestro types are exposed — only engine public types.

use crate::state::PlatformState;
use devpulse_engine::platform::SystemHealth;
use tauri::State;

/// Get the current system health status.
///
/// Returns health if platform is booted, or a "booting" status if still initializing.
#[tauri::command]
#[allow(clippy::missing_errors_doc)]
pub async fn get_status(state: State<'_, PlatformState>) -> Result<SystemHealth, String> {
    let lock = state.platform.read().await;
    match lock.as_ref() {
        Some(platform) => Ok(platform.health().await),
        None => Err("Platform is still booting".to_string()),
    }
}
