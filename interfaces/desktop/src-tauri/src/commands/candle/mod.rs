//! Candle runtime devtool commands — config persistence + pool restart.
//!
//! The Candle *inference backend* is a library inside the engine (not a
//! service in the lifecycle sense). These commands expose what the
//! devtool actually needs:
//!
//! - `candle_load_config` / `candle_save_config` — user-scope preferences
//!   (`context_size`, `gpu_layers`, `dtype`) persisted to
//!   `{data_dir}/user/candle.toml`. Honored by the pool at next slot-load.
//! - `candle_restart_pool` — unload every loaded slot to force a fresh
//!   start (all backends, not just Candle — this is the only lifecycle
//!   action that pool exposes today).

use crate::state::PlatformState;
use devpulse_engine::platform::CandleConfig;
use tauri::State;

/// Load the persisted Candle runtime config. Missing / malformed file
/// → defaults (never errors on parse failure).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn candle_load_config(
    state: State<'_, PlatformState>,
) -> Result<CandleConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    Ok(platform.candle_config_load())
}

/// Persist Candle config atomically. Returns the clamped value.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn candle_save_config(
    state: State<'_, PlatformState>,
    cfg: CandleConfig,
) -> Result<CandleConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .candle_config_save(&cfg)
        .map_err(|e| format!("{e:#}"))
}

/// Unload every loaded slot — forces the backend pool to start fresh.
///
/// Applies to all backends (Candle, llama.cpp-embedded, ORT voice).
/// Returns the number of slots actually unloaded so the devtool can
/// show "Restarted N slots."
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
#[cfg(feature = "inference")]
pub async fn candle_restart_pool(state: State<'_, PlatformState>) -> Result<u32, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    let loader = platform
        .model_loader()
        .ok_or("Model loader not available")?;
    let slots = loader.list_slots().await;
    let mut unloaded = 0u32;
    for slot in slots {
        if loader.unload_slot(&slot.id).await.is_ok() {
            unloaded += 1;
        }
    }
    tracing::info!(unloaded, "candle_restart_pool: unloaded slots");
    Ok(unloaded)
}

/// Non-inference build: the pool does not exist, so restart is a no-op
/// that returns 0 unloaded. Kept for command-surface symmetry so the
/// frontend never has to branch on cargo features.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
#[cfg(not(feature = "inference"))]
pub async fn candle_restart_pool(_state: State<'_, PlatformState>) -> Result<u32, String> {
    Ok(0)
}
