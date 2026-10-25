//! llama.cpp embedded devtool commands — config persistence only.
//!
//! The llama.cpp-embedded backend is a library (via `llama-cpp-2`)
//! inside the engine. No lifecycle verbs — the pool owns that. Config
//! lives at `{data_dir}/user/llama_cpp_embedded.toml` and is read at
//! slot-load time for any slot routed to this backend.

use crate::state::PlatformState;
use devpulse_engine::platform::LlamaCppEmbeddedConfig;
use tauri::State;

/// Load the persisted llama.cpp-embedded runtime config.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn llama_cpp_embedded_load_config(
    state: State<'_, PlatformState>,
) -> Result<LlamaCppEmbeddedConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    Ok(platform.llama_cpp_embedded_config_load())
}

/// Persist llama.cpp-embedded config atomically. Returns the clamped value.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn llama_cpp_embedded_save_config(
    state: State<'_, PlatformState>,
    cfg: LlamaCppEmbeddedConfig,
) -> Result<LlamaCppEmbeddedConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .llama_cpp_embedded_config_save(&cfg)
        .map_err(|e| format!("{e:#}"))
}
