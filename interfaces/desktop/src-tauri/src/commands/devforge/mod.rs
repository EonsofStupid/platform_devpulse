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

pub mod bootstrap;
pub mod paths;
pub mod sidecar;
pub mod state_file;
pub mod types;

use crate::state::PlatformState;
use sidecar::RehManager;
use state_file::DevforgeState;
use std::path::PathBuf;
use tauri::State;
use types::{DevforgeBootstrapStatus, RehConfig, RehStatus};

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

/// Unified DevForge status for the frontend — combines install state,
/// runtime state, and persisted preferences.
///
/// Frontends that mount *after* the `devforge://ready` event has fired
/// call this to catch up, instead of relying on re-emission.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_get_status(
    state: State<'_, PlatformState>,
) -> Result<DevforgeBootstrapStatus, String> {
    let paths = &state.devforge_paths;
    let installed = paths.resolve_reh_server_dir().is_some();
    let persisted = DevforgeState::load(&paths.state_file());

    let guard = state.reh.read().await;
    let (running, url, port, workspace) = if let Some(mgr) = guard.as_ref() {
        let s = mgr.status();
        (s.running, s.url, s.port, persisted.last_workspace.clone())
    } else {
        (false, None, None, persisted.last_workspace.clone())
    };

    Ok(DevforgeBootstrapStatus {
        installed,
        running,
        url,
        port,
        workspace,
        reh_version: persisted.reh_version,
    })
}

/// List recently opened project paths (newest first).
///
/// These are real directories the user has opened in DevForge, persisted
/// in `state.json`. The frontend uses this for a "recent projects" picker.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_list_recent_projects(
    state: State<'_, PlatformState>,
) -> Result<Vec<PathBuf>, String> {
    let persisted = DevforgeState::load(&state.devforge_paths.state_file());
    Ok(persisted.recent_projects)
}

/// Add a real project directory to the recent projects list.
///
/// Validates the path exists on disk. Moves it to the front if already
/// present. Caps the list at 20 entries.
///
/// # Errors
/// - Path does not exist or is not a directory
/// - Failed to write `state.json`
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_add_project(
    state: State<'_, PlatformState>,
    path: PathBuf,
) -> Result<(), String> {
    if !path.is_dir() {
        return Err(format!("Not a directory: {}", path.display()));
    }
    let state_path = state.devforge_paths.state_file();
    let mut persisted = DevforgeState::load(&state_path);
    persisted.push_recent(path);
    persisted
        .save(&state_path)
        .map_err(|e| format!("Failed to save state.json: {e:#}"))
}

/// Remove a project path from the recent projects list.
///
/// Idempotent — returns Ok even if the path wasn't in the list.
///
/// # Errors
/// - Failed to write `state.json`
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_remove_project(
    state: State<'_, PlatformState>,
    path: PathBuf,
) -> Result<(), String> {
    let state_path = state.devforge_paths.state_file();
    let mut persisted = DevforgeState::load(&state_path);
    persisted.recent_projects.retain(|p| p != &path);
    persisted
        .save(&state_path)
        .map_err(|e| format!("Failed to save state.json: {e:#}"))
}

/// Toggle the `fresh_instance_on_open` preference in `state.json`.
///
/// When enabled, DevForge ignores the last-used workspace on startup and
/// always opens the default (empty) one.
///
/// # Errors
/// Returns an error if `state.json` cannot be read or written.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_set_fresh_instance(
    state: State<'_, PlatformState>,
    enabled: bool,
) -> Result<(), String> {
    let path = state.devforge_paths.state_file();
    let mut persisted = DevforgeState::load(&path);
    persisted.fresh_instance_on_open = enabled;
    persisted
        .save(&path)
        .map_err(|e| format!("Failed to save state.json: {e:#}"))
}
