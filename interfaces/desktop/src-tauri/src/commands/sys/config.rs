//! System configuration commands.

use crate::state::PlatformState;
use devpulse_engine::platform::PlatformConfig;
use tauri::State;

/// Get current platform settings.
///
/// # Errors
/// Returns error if platform is still booting.
#[tauri::command]
#[specta::specta]
pub async fn get_settings(state: State<'_, PlatformState>) -> Result<PlatformConfig, String> {
    let lock = state.platform.read().await;
    match lock.as_ref() {
        Some(platform) => Ok(platform.config()),
        None => Err("Platform is still booting".to_string()),
    }
}
