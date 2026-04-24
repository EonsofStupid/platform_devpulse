//! Sherpa streaming ASR commands.
//!
//! Thin wrappers over `Platform::sherpa_streaming()` — model scanning,
//! session lifecycle, audio feed. All commands are always compiled so
//! specta bindings stay stable; the engine service returns clear
//! "feature not enabled" errors on builds without `--features sherpa`.

use crate::state::PlatformState;
use devpulse_engine::platform::{SherpaCompileInfo, SherpaInstalledModel, SherpaSessionInfo};
use tauri::State;

/// Report whether the `sherpa` cargo feature is baked into this build.
/// Used by the devtool to render a "not available in this build" banner
/// instead of silently failing when the user opens the page.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn sherpa_compile_info(
    _state: State<'_, PlatformState>,
) -> Result<SherpaCompileInfo, String> {
    Ok(devpulse_engine::platform::SherpaStreamingService::compile_info())
}

/// List installed streaming-ASR models under `{data_dir}/models/sherpa/`.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn sherpa_list_models(
    state: State<'_, PlatformState>,
) -> Result<Vec<SherpaInstalledModel>, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .sherpa_streaming()
        .list_installed_models()
        .map_err(|e| format!("{e:#}"))
}

/// Delete an installed model directory by id.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn sherpa_delete_model(
    state: State<'_, PlatformState>,
    id: String,
) -> Result<(), String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .sherpa_streaming()
        .delete_model(&id)
        .map_err(|e| format!("{e:#}"))
}

/// Start a streaming recognition session against an installed model.
/// Returns the fresh session id.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn sherpa_start_session(
    state: State<'_, PlatformState>,
    model_id: String,
) -> Result<String, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .sherpa_streaming()
        .start_session(&model_id)
        .map_err(|e| format!("{e:#}"))
}

/// Feed 16 kHz mono f32 PCM samples to a live session. Returns the
/// updated partial transcript after decoding.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn sherpa_feed_audio(
    state: State<'_, PlatformState>,
    session_id: String,
    samples: Vec<f32>,
) -> Result<String, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .sherpa_streaming()
        .feed_audio(&session_id, &samples)
        .map_err(|e| format!("{e:#}"))
}

/// Signal end-of-input and return the final transcript for a session.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn sherpa_finish_session(
    state: State<'_, PlatformState>,
    session_id: String,
) -> Result<String, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .sherpa_streaming()
        .finish_session(&session_id)
        .map_err(|e| format!("{e:#}"))
}

/// Drop a session — releases its OnlineStream handle.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn sherpa_stop_session(
    state: State<'_, PlatformState>,
    session_id: String,
) -> Result<(), String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .sherpa_streaming()
        .stop_session(&session_id)
        .map_err(|e| format!("{e:#}"))
}

/// Snapshot of every live session — id, model, partial transcript,
/// samples fed.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn sherpa_list_sessions(
    state: State<'_, PlatformState>,
) -> Result<Vec<SherpaSessionInfo>, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    Ok(platform.sherpa_streaming().list_sessions())
}

/// Return the absolute path of the models root
/// (`{data_dir}/models/sherpa/`). The devtool shows this so users
/// know where to manually drop model dirs.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn sherpa_models_dir(
    state: State<'_, PlatformState>,
) -> Result<String, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    Ok(platform
        .sherpa_streaming()
        .models_dir()
        .display()
        .to_string())
}
