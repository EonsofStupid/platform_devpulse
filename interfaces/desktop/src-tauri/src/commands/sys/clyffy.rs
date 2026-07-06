//! Clyffy wire connection status command.
//!
//! Reports the current [`ConnectionState`] (Disconnected / Connecting /
//! Connected) computed by the background probe task (`clyffy_probe_loop` in
//! [`crate::lib`]). This is the seam the frontend reads to drive the no-AI
//! indicator and every Tier-2 surface gate — capability is always **computed**
//! from the live endpoint handshake, never assumed.
//!
//! The client is kernel-free and always present, so unlike the
//! [`crate::commands::sys::vector`] seam there is no `kernel-inproc` arm: a
//! `Disconnected` result is the honest standalone answer, not an error.

use crate::state::ClyffyConnectionState;
use devpulse_gb10_client::ConnectionState;
use tauri::State;

/// Current Clyffy connection state.
///
/// Always succeeds — `Disconnected` is the honest standalone answer, not a
/// failure. The frontend derives `tier2Available` and the no-AI indicator from
/// the returned variant, and reads the computed `capability` when `Connected`.
///
/// # Errors
/// Never returns `Err` today; the `Result` keeps the specta signature stable if
/// a fallible read is introduced later.
#[tauri::command]
#[specta::specta]
pub async fn connection_status(
    state: State<'_, ClyffyConnectionState>,
) -> Result<ConnectionState, String> {
    Ok(state.current())
}
