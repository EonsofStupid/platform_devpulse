//! Application state managed by Tauri.
//!
//! Contains the platform facade — the sole bridge to the kernel.
//! All IPC commands access the platform through this state.

use devpulse_engine::platform::Platform;
use std::sync::Arc;

/// Application state shared across all Tauri commands.
pub struct AppState {
    /// Platform facade (engine → maestro bridge).
    pub platform: Arc<Platform>,
}
