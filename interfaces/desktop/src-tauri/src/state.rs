//! Application state managed by Tauri.
//!
//! Contains the platform facade — the sole bridge to the kernel.
//! Platform starts as None (boot in progress) and is filled by
//! the background boot task once all stores are initialized.

use devpulse_engine::platform::Platform;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Application state shared across all Tauri commands.
///
/// `platform` is `None` during boot and `Some(Arc<Platform>)` after.
/// Commands must handle the `None` case gracefully.
pub struct PlatformState {
    /// Platform facade (engine -> maestro bridge).
    /// None while boot task is running, Some after completion.
    pub platform: RwLock<Option<Arc<Platform>>>,
}
