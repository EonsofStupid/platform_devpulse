//! SurrealDB sidecar commands — status, health, and editable config.
//!
//! The engine side (`devpulse_engine::platform::Platform`) owns the
//! `SurrealService` lifecycle; these commands are the frontend's handle
//! into that service.
//!
//! Unlike Ollama, the SurrealDB sidecar is **boot-time, not lazy** —
//! the graph stores depend on it, so there is no `start` / `stop` /
//! `restart` here. Config changes write to the user-scope overlay and
//! take effect on the next app restart.

use crate::state::PlatformState;
use devpulse_engine::platform::{SurrealHealth, SurrealStatus, SurrealUserConfig};
use tauri::State;

// ═══════════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════════

/// Runtime status of the SurrealDB sidecar (configured vs. actual port,
/// managed/attached, bind URL, etc.).
///
/// Lock-free read — never spawns, never blocks.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn surreal_status(
    state: State<'_, PlatformState>,
) -> Result<SurrealStatus, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    Ok(platform.surreal_status())
}

/// Live-probe the sidecar via `GET /health` and return a badge-shaped
/// tri-state (`up` / `down` / `stopped`).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn surreal_health(
    state: State<'_, PlatformState>,
) -> Result<SurrealHealth, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    Ok(platform.surreal_health().await)
}

/// Load the user-scope editable overlay from
/// `{data_dir}/user/surreal.toml`.
///
/// Returns defaults if the file is missing or malformed — never errors
/// on parse failure. The devtool mounts this as its Config draft.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn surreal_config_load(
    state: State<'_, PlatformState>,
) -> Result<SurrealUserConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    Ok(platform.surreal_user_config_load())
}

/// Atomically persist the user-scope overlay.
///
/// The returned config is the clamped/normalized shape that was
/// written to disk — the devtool should update its state from this
/// rather than echoing the request back.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn surreal_config_save(
    state: State<'_, PlatformState>,
    cfg: SurrealUserConfig,
) -> Result<SurrealUserConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .surreal_user_config_save(&cfg)
        .map_err(|e| format!("{e:#}"))
}
