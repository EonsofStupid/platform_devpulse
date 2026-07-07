//! Candle runtime devtool commands — config persistence (local) + pool
//! restart (Tier-2, Clyffy).
//!
//! Candle *inference* runs on **Clyffy** (headless, on the GB10), not in
//! DevPulse. These commands expose what the devtool needs:
//!
//! - `candle_load_config` / `candle_save_config` — user-scope preferences
//!   (`context_size`, `gpu_layers`, `dtype`) persisted **locally** to
//!   `{data_dir}/user/candle.toml` (Tier-1). Shipped to Clyffy on connect and
//!   honored by its pool at next slot-load.
//! - `candle_restart_pool` — unload every loaded slot on Clyffy to force a
//!   fresh start. **Tier-2**: connection-gated, served once Clyffy connects.

use crate::state::{ClyffyConnectionState, PlatformState};
use devpulse_engine::platform::CandleConfig;
use devpulse_gb10_client::ConnectionState;
use tauri::State;

/// Load the persisted Candle runtime config. Missing / malformed file
/// → defaults (never errors on parse failure).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn candle_load_config(state: State<'_, PlatformState>) -> Result<CandleConfig, String> {
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

/// Restart Clyffy's model pool — unload every loaded slot to force a fresh
/// start (all backends: Candle, llama.cpp, ORT voice).
///
/// **Tier-2**: the model pool is Clyffy's (headless, on the GB10). Returns the
/// number of slots unloaded once `clyffyd` serves it; connection-gated until
/// then — disconnected reports "connect Clyffy", connected reports the
/// endpoint as not-yet-served (deferred, not retired).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub fn candle_restart_pool(clyffy: State<'_, ClyffyConnectionState>) -> Result<u32, String> {
    match clyffy.current() {
        ConnectionState::Connected { .. } => Err(
            "Pool restart pending — connected to Clyffy, but its advertised capability does not include model-loader control yet."
                .to_string(),
        ),
        ConnectionState::Disconnected | ConnectionState::Connecting { .. } => Err(
            "Model pool unavailable — slot management is a Tier-2 capability served by Clyffy over the gb10-client wire. Connect Clyffy to enable."
                .to_string(),
        ),
    }
}
