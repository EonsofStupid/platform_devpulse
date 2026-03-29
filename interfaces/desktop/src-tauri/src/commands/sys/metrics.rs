//! Process metrics command — real RSS, CPU, uptime from the OS.

use crate::state::PlatformState;
use devpulse_engine::platform::ProcessMetrics;

/// Return real process metrics measured from the OS.
///
/// Every field is a real measurement — no proxies, no cache counts
/// pretending to be memory. The frontend calls this to populate
/// system gauges with honest data.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_process_metrics(
    state: tauri::State<'_, PlatformState>,
) -> Result<ProcessMetrics, String> {
    let lock = state.platform.read().await;
    let uptime = lock
        .as_ref()
        .map(|p| p.uptime_secs())
        .unwrap_or(0);

    Ok(devpulse_engine::platform::metrics::collect(uptime))
}
