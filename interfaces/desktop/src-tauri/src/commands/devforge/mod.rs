//! DevForge commands — query and control the REH web server.
//!
//! DevForge REH is a Layer 1 infrastructure service that boots through
//! the platform service pipeline (`boot/devforge.rs`). The Tauri commands
//! here are the frontend's interface to the running service — they read
//! from `Platform::devforge()`, not from a separate `PlatformState::reh`.
//!
//! The REH tree is fetched from `github.com/EonsofStupid/devforge`
//! releases via `cargo xtask fetch-devforge`. In dev, it lives at
//! `deps/code-oss-reh-web/`. The dedicated `WebviewWindow` loads the
//! REH connection URL for a full VS Code experience with full extension
//! support.

pub mod paths;
pub mod state_file;
pub mod types;
pub mod window;

use crate::state::PlatformState;
use state_file::DevforgeState;
use std::path::PathBuf;
use tauri::State;
use types::{DevforgeBootstrapStatus, RehConfig, RehStatus};

/// Spawn the REH web server — now boot-managed.
///
/// DevForge REH boots through the platform service pipeline. This command
/// is kept for frontend compat but returns the current service state
/// instead of spawning a second process.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn spawn_reh_server(
    state: State<'_, PlatformState>,
    _config: RehConfig,
) -> Result<RehStatus, String> {
    let guard = state.platform.read().await;
    let platform = guard.as_ref().ok_or("Platform not booted")?;
    match platform.devforge() {
        Some(service) => Ok(RehStatus {
            running: true,
            port: Some(service.port()),
            url: Some(service.connection_url()),
            pid: None,
        }),
        None => Ok(RehStatus::default()),
    }
}

/// Stop the REH server — now boot-managed.
///
/// Platform shutdown handles this. This command is a no-op kept for
/// frontend compat.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn stop_reh_server(_state: State<'_, PlatformState>) -> Result<(), String> {
    Ok(())
}

/// Return the current status of the REH web server.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_reh_status(state: State<'_, PlatformState>) -> Result<RehStatus, String> {
    let guard = state.platform.read().await;
    let platform = guard.as_ref().ok_or("Platform not booted")?;
    match platform.devforge() {
        Some(service) => Ok(RehStatus {
            running: true,
            port: Some(service.port()),
            url: Some(service.connection_url()),
            pid: None,
        }),
        None => Ok(RehStatus::default()),
    }
}

/// Return the full connection URL (including token) for the running server.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_connection_url(state: State<'_, PlatformState>) -> Result<String, String> {
    let guard = state.platform.read().await;
    let platform = guard.as_ref().ok_or("Platform not booted")?;
    let service = platform
        .devforge()
        .ok_or("DevForge REH not running")?;
    Ok(service.connection_url())
}

/// Unified DevForge status for the frontend.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_get_status(
    state: State<'_, PlatformState>,
) -> Result<DevforgeBootstrapStatus, String> {
    let paths = &state.devforge_paths;
    let installed = paths.resolve_reh_server_dir().is_some();
    let persisted = DevforgeState::load(&paths.state_file());

    let guard = state.platform.read().await;
    let (running, url, port) = if let Some(ref platform) = *guard {
        match platform.devforge() {
            Some(service) => (true, Some(service.connection_url()), Some(service.port())),
            None => (false, None, None),
        }
    } else {
        (false, None, None)
    };

    Ok(DevforgeBootstrapStatus {
        installed,
        running,
        url,
        port,
        workspace: persisted.last_workspace.clone(),
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
