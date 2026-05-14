//! `DevForge` commands — query and control the REH web server.
//!
//! `DevForge` REH is a Layer 1 infrastructure service that boots through
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
use types::{
    DevforgeBootstrapStatus, DevforgeConfigView, DevforgeHealth, DevforgeHealthState, RehStatus,
};

/// Start the `DevForge` REH child process (Module Charter verb).
///
/// Lazy-start path — idempotent: returns the current status if the child
/// is already running. First call spawns `node out/server-main.js`,
/// waits for the TCP health check, and stores the service handle in
/// `Platform::devforge`. Subsequent calls are lock-free reads.
///
/// # Errors
/// - Platform not booted yet
/// - `DevForge` disabled in config
/// - No REH tree on disk (fetch-devforge not run)
/// - Health poll timed out during spawn
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_start(state: State<'_, PlatformState>) -> Result<RehStatus, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    let service = platform
        .ensure_devforge_started()
        .await
        .map_err(|e| format!("{e:#}"))?;
    Ok(RehStatus {
        running: true,
        port: Some(service.port()),
        url: Some(service.connection_url()),
        pid: service.pid(),
    })
}

/// Stop the running `DevForge` REH child process (Module Charter verb).
///
/// Atomically swaps `Platform::devforge` to `None` and shuts down the
/// taken service. Idempotent — returns `Ok(())` when nothing is
/// running.
///
/// # Errors
/// - Platform not booted yet
/// - REH child could not be killed cleanly
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_stop(state: State<'_, PlatformState>) -> Result<(), String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    platform.devforge_stop().await.map_err(|e| format!("{e:#}"))
}

/// Restart the `DevForge` REH child process (Module Charter verb).
///
/// Equivalent to `devforge_stop` followed by `devforge_start`. Returns
/// the status of the freshly started child.
///
/// # Errors
/// Returns whichever of stop or start fails first.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_restart(state: State<'_, PlatformState>) -> Result<RehStatus, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    let service = platform
        .devforge_restart()
        .await
        .map_err(|e| format!("{e:#}"))?;
    Ok(RehStatus {
        running: true,
        port: Some(service.port()),
        url: Some(service.connection_url()),
        pid: service.pid(),
    })
}

/// Health snapshot of the `DevForge` runtime (Module Charter verb).
///
/// Returns a minimal status shape matching the shell's `HealthBadge`:
/// `{ state, label }`. The shell uses this to colour the header dot
/// and short-text status on the Status tab.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_health(state: State<'_, PlatformState>) -> Result<DevforgeHealth, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    let paths = &state.devforge_paths;
    let installed = paths.resolve_reh_server_dir().is_some();

    if !installed {
        return Ok(DevforgeHealth {
            state: DevforgeHealthState::Down,
            label: "REH tree not installed — run `cargo xtask fetch-devforge`".into(),
        });
    }

    match platform.devforge() {
        Some(_service) => Ok(DevforgeHealth {
            state: DevforgeHealthState::Up,
            label: "Running".into(),
        }),
        None => Ok(DevforgeHealth {
            state: DevforgeHealthState::Stopped,
            label: "Stopped (installed — click Start to spawn REH)".into(),
        }),
    }
}

/// Return the current status of the REH web server.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_reh_status(state: State<'_, PlatformState>) -> Result<RehStatus, String> {
    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    match platform.devforge() {
        Some(service) => Ok(RehStatus {
            running: true,
            port: Some(service.port()),
            url: Some(service.connection_url()),
            pid: service.pid(),
        }),
        None => Ok(RehStatus::default()),
    }
}

/// Return the full connection URL (including token) for the running server.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_connection_url(state: State<'_, PlatformState>) -> Result<String, String> {
    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    let service = platform.devforge().ok_or("DevForge REH not running")?;
    Ok(service.connection_url())
}

/// Unified `DevForge` status for the frontend.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_get_status(
    state: State<'_, PlatformState>,
) -> Result<DevforgeBootstrapStatus, String> {
    let paths = &state.devforge_paths;
    let installed = paths.resolve_reh_server_dir().is_some();
    let persisted = DevforgeState::load(&paths.state_file());

    // P0: lock-free atomic load.
    let (running, url, port, pid, uptime_secs) = if let Some(platform) = state.platform.load_full()
    {
        match platform.devforge() {
            Some(service) => (
                true,
                Some(service.connection_url()),
                Some(service.port()),
                service.pid(),
                Some(service.uptime_secs()),
            ),
            None => (false, None, None, None, None),
        }
    } else {
        (false, None, None, None, None)
    };

    // RSS lookup via sysinfo — refreshes only the single REH PID we
    // care about so this is cheap (~µs). `None` is non-fatal: child
    // may have just exited, or the OS reaped it between the running
    // check above and the sysinfo refresh.
    let memory_rss_bytes = pid.and_then(|p| reh_child_rss_bytes(p));

    Ok(DevforgeBootstrapStatus {
        installed,
        running,
        url,
        port,
        workspace: persisted.last_workspace.clone(),
        reh_version: persisted.reh_version,
        pid,
        uptime_secs,
        memory_rss_bytes,
    })
}

/// Live snapshot of `[services.system.devforge]` — the SSOT config
/// the running platform is actually using.
///
/// Pulled from `Platform::boot_config()` so what the frontend sees
/// matches what the engine is operating with. The Connection card on
/// `/devforge` and the devtool's Config tab both render against this
/// — never hardcoded copies of the host/port/etc.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn devforge_get_config(
    state: State<'_, PlatformState>,
) -> Result<DevforgeConfigView, String> {
    let platform = state.platform.load_full().ok_or("Platform not booted")?;
    let entry = &platform.boot_config().services.system.devforge;
    Ok(DevforgeConfigView {
        enabled: entry.enabled,
        critical: entry.critical,
        mode: entry.mode.clone(),
        port_configured: entry.port,
        host: entry.host.clone(),
        user_data_dir: entry.user_data_dir.clone(),
        extensions_dir: entry.extensions_dir.clone(),
        workspace_path: entry.workspace_path.clone(),
        update_channel_url: entry.update_channel_url.clone(),
        startup_timeout_secs: entry.startup_timeout_secs,
        health_poll_interval_ms: entry.health_poll_interval_ms,
    })
}

/// Resident set size of a single PID via `sysinfo`. Targeted refresh
/// (only this PID's process info) so each status poll stays sub-ms.
/// Returns `None` when sysinfo cannot locate the PID — caller renders
/// "—" rather than treating this as an error.
fn reh_child_rss_bytes(pid: u32) -> Option<u64> {
    use sysinfo::{Pid, ProcessRefreshKind, ProcessesToUpdate, RefreshKind, System};
    let target = Pid::from_u32(pid);
    let mut sys = System::new_with_specifics(
        RefreshKind::nothing().with_processes(ProcessRefreshKind::nothing().with_memory()),
    );
    sys.refresh_processes_specifics(
        ProcessesToUpdate::Some(&[target]),
        true,
        ProcessRefreshKind::nothing().with_memory(),
    );
    sys.process(target).map(|p| p.memory())
}

/// List recently opened project paths (newest first).
///
/// These are real directories the user has opened in `DevForge`, persisted
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
/// When enabled, `DevForge` ignores the last-used workspace on startup and
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
