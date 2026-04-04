//! Telemetry commands — lane tracing configuration.
//!
//! Read and mutate lane trace config at runtime. The config lives
//! in `Arc<RwLock<LaneTraceConfig>>` on the `TelemetryHandle` —
//! changes take effect immediately without restart.

use crate::state::PlatformState;
use devpulse_engine::platform::LaneTraceConfig;
use tauri::State;

/// Get the current lane tracing configuration.
///
/// # Errors
/// Returns error if platform is still booting or telemetry is disabled.
#[tauri::command]
#[specta::specta]
pub async fn get_lane_config(
    state: State<'_, PlatformState>,
) -> Result<LaneTraceConfig, String> {
    let lock = state.platform.read().await;
    match lock.as_ref() {
        Some(platform) => match platform.telemetry() {
            Some(t) => Ok(t.config_snapshot().await),
            None => Err("Telemetry not enabled".to_string()),
        },
        None => Err("Platform is still booting".to_string()),
    }
}

/// Update the lane tracing configuration at runtime.
///
/// Changes take effect immediately — no restart required.
/// The background writer respects the new config on the next trace.
///
/// # Errors
/// Returns error if platform is still booting or telemetry is disabled.
#[tauri::command]
#[specta::specta]
pub async fn set_lane_config(
    state: State<'_, PlatformState>,
    config: LaneTraceConfig,
) -> Result<(), String> {
    let lock = state.platform.read().await;
    match lock.as_ref() {
        Some(platform) => match platform.telemetry() {
            Some(t) => {
                t.update_config(config).await;
                Ok(())
            }
            None => Err("Telemetry not enabled".to_string()),
        },
        None => Err("Platform is still booting".to_string()),
    }
}
