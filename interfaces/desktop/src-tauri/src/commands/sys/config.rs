//! System configuration commands.

use crate::state::PlatformState;
use devpulse_engine::platform::PlatformConfig;
use std::collections::HashMap;
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

/// Get a user preference by key.
///
/// Reads from `{data_dir}/preferences.json`. Returns `None` if key not found.
#[tauri::command]
#[specta::specta]
pub async fn get_preference(
    state: State<'_, PlatformState>,
    key: String,
) -> Result<Option<String>, String> {
    let lock = state.platform.read().await;
    let platform = lock.as_ref().ok_or("Platform is still booting")?;
    let prefs_path = platform.config().data_dir.clone();
    let prefs_file = std::path::PathBuf::from(&prefs_path).join("preferences.json");

    if !prefs_file.exists() {
        return Ok(None);
    }

    let content = std::fs::read_to_string(&prefs_file).map_err(|e| e.to_string())?;
    let prefs: HashMap<String, String> =
        serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(prefs.get(&key).cloned())
}

/// Set a user preference by key.
///
/// Writes to `{data_dir}/preferences.json`. Creates the file if it doesn't exist.
#[tauri::command]
#[specta::specta]
pub async fn set_preference(
    state: State<'_, PlatformState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let lock = state.platform.read().await;
    let platform = lock.as_ref().ok_or("Platform is still booting")?;
    let prefs_path = platform.config().data_dir.clone();
    let prefs_file = std::path::PathBuf::from(&prefs_path).join("preferences.json");

    let mut prefs: HashMap<String, String> = if prefs_file.exists() {
        let content = std::fs::read_to_string(&prefs_file).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        HashMap::new()
    };

    prefs.insert(key, value);
    let json = serde_json::to_string_pretty(&prefs).map_err(|e| e.to_string())?;
    std::fs::write(&prefs_file, json).map_err(|e| e.to_string())?;
    Ok(())
}
