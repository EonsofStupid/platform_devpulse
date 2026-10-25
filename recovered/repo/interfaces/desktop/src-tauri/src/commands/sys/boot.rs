//! Boot state query command.
//!
//! Returns the accumulated boot snapshot so the frontend can catch up
//! even if it mounts after boot events have already fired.

use crate::state::BootStateTracker;

/// Return the current boot state snapshot.
///
/// Called by the frontend on mount before registering live event listeners.
/// This eliminates the race condition where events fire before listeners exist.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
#[tracing::instrument(level = "debug", skip(tracker), err)]
pub async fn get_boot_state(
    tracker: tauri::State<'_, BootStateTracker>,
) -> Result<crate::state::BootSnapshot, String> {
    Ok(tracker.snapshot())
}
