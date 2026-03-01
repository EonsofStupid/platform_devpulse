//! System configuration commands.

use crate::state::AppState;
use devpulse_engine::platform::PlatformConfig;
use tauri::State;

/// Get current platform settings.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri requires State by value
pub fn get_settings(state: State<'_, AppState>) -> PlatformConfig {
    state.platform.config()
}
