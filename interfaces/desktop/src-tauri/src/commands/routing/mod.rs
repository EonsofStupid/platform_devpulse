//! Routing user-scope config commands — escalation chain + latency tuning.
//!
//! Same shape as the voice STT / TTS config commands: thin Tauri facade
//! over the `Platform::routing_config_*` accessors. The engine owns
//! atomic IO, default-on-missing, dual-emit (`tracing::*` +
//! `InternalEvent::RoutingConfigChanged`), and the
//! `assistant.routing.mode` write-through.

use crate::state::PlatformState;
use devpulse_engine::platform::RoutingConfig;
use tauri::State;

/// Load the persisted routing config (escalation chain + latency
/// tuning + response source).
///
/// Reads `{data_dir}/user/routing.toml` and reconciles
/// `latency.response_source` against the `assistant.routing.mode`
/// dispatch SSOT so the surface always reflects what the dispatcher will use.
/// Returns defaults when the file is missing or malformed — never errors
/// on parse failure.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn routing_load_config(state: State<'_, PlatformState>) -> Result<RoutingConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    Ok(platform.routing_config_load().await)
}

/// Persist routing config atomically. Returns the clamped value the
/// engine actually wrote (per-tier timeouts clamped to `[1s, 60s]`,
/// audio buffer to `[50ms, 1000ms]`, VAD silence to `[200ms, 2000ms]`,
/// stream chunk to `[64, 1024]`).
///
/// Save flow inside the engine:
///   1. Clamp + atomic temp-write + rename to `user/routing.toml`.
///   2. Write through `latency.response_source` →
///      `assistant.routing.mode` so the chat dispatcher is gated.
///   3. Dual-emit: `tracing::info!` on `routing.config` + broadcast
///      `InternalEvent::RoutingConfigChanged` for engine consumers.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn routing_save_config(
    state: State<'_, PlatformState>,
    cfg: RoutingConfig,
) -> Result<RoutingConfig, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform
        .routing_config_save(&cfg)
        .await
        .map_err(|e| format!("{e:#}"))
}
