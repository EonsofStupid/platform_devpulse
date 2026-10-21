//! llama-server settings commands — load and save only.
//!
//! The settings live at `{data_dir}/user/llama_server.toml`; loading a GGUF
//! slot starts the sidecar with them ([`super::llama::start_server`]).

use crate::state::PlatformState;
use devpulse_engine::platform::LlamaServerConfig;
use tauri::State;

/// Your llama-server settings, or the defaults.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn llama_server_load_config(
    state: State<'_, PlatformState>,
) -> Result<LlamaServerConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    Ok(platform.llama_server_config_load())
}

/// Save your llama-server settings atomically. Returns the clamped value;
/// they apply the next time a GGUF slot is loaded.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn llama_server_save_config(
    state: State<'_, PlatformState>,
    cfg: LlamaServerConfig,
) -> Result<LlamaServerConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .llama_server_config_save(&cfg)
        .map_err(|e| format!("{e:#}"))
}
