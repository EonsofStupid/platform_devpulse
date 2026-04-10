//! DevForge sidecar commands — spawn, stop, and query the REH web server.
//!
//! The REH web server is the browser-capable VS Code Remote Extension Host
//! that ships inside `deps/code-oss-reh-web`. DevForge runs it as a Tauri
//! managed child process so the frontend can load VS Code inside a
//! WebviewWindow (or iframe) with full extension support.
//!
//! # Lifecycle
//!
//! The manager is stored in [`PlatformState::reh`](crate::state::PlatformState)
//! behind an `RwLock<Option<RehManager>>`. Only one REH server runs at a
//! time — calling [`spawn_reh_server`] while one is already alive returns
//! the existing status without spawning a second process.
//!
//! On Tauri `Exit`, `lib.rs` takes the manager and calls `stop` so we
//! don't leak Node processes on shutdown.

pub mod sidecar;
pub mod types;

use crate::state::PlatformState;
use sidecar::RehManager;
use tauri::State;
use types::{RehConfig, RehStatus};

/// Spawn the REH web server with the supplied configuration.
///
/// If a server is already running, returns its current status without
/// spawning a second process. The frontend should call
/// [`stop_reh_server`] first if it wants to restart with different config.
///
/// # Errors
/// Returns a stringified error if the server cannot be spawned or fails
/// the startup health check within the timeout.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn spawn_reh_server(
    state: State<'_, PlatformState>,
    config: RehConfig,
) -> Result<RehStatus, String> {
    {
        let guard = state.reh.read().await;
        if let Some(existing) = guard.as_ref() {
            tracing::info!("REH server already running — returning existing status");
            return Ok(existing.status());
        }
    }

    let manager = RehManager::spawn(&config)
        .await
        .map_err(|e| format!("Failed to spawn REH server: {e:#}"))?;

    let status = manager.status();

    let mut guard = state.reh.write().await;
    *guard = Some(manager);

    Ok(status)
}

/// Stop the running REH web server, if any.
///
/// Idempotent — returns `Ok(())` if no server is running.
///
/// # Errors
/// Returns a stringified error if the child process cannot be killed.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn stop_reh_server(state: State<'_, PlatformState>) -> Result<(), String> {
    let manager = {
        let mut guard = state.reh.write().await;
        guard.take()
    };

    if let Some(manager) = manager {
        manager
            .stop()
            .await
            .map_err(|e| format!("Failed to stop REH server: {e:#}"))?;
    }

    Ok(())
}

/// Return the current status of the REH web server.
///
/// Always succeeds — if no server is running, returns an empty status
/// with `running: false`.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_reh_status(state: State<'_, PlatformState>) -> Result<RehStatus, String> {
    let guard = state.reh.read().await;
    Ok(guard
        .as_ref()
        .map(RehManager::status)
        .unwrap_or_default())
}

/// Return the full connection URL (including token) for the running server.
///
/// # Errors
/// Returns an error string if no server is currently running.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_connection_url(state: State<'_, PlatformState>) -> Result<String, String> {
    let guard = state.reh.read().await;
    guard
        .as_ref()
        .map(RehManager::connection_url)
        .ok_or_else(|| "REH server is not running".to_string())
}
