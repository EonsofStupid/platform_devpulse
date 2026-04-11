//! DevForge bootstrap — preload the REH server when DevPulse starts.
//!
//! This is what makes the UX "click DevPulse icon → click DevForge tab →
//! VS Code is already there" possible: the REH server starts in the
//! background while the main window is still rendering, so by the time
//! the user clicks the DevForge surface the connection URL is already
//! cached and the WebviewWindow can load instantly.
//!
//! Failures are logged but non-fatal — the UI reacts to the emitted
//! `devforge://ready` event, which carries an `installed`/`running` pair
//! so the frontend can switch between three states:
//!
//! - `installed: false` → "Install DevForge" CTA
//! - `installed: true, running: false` → spawn failure, show error
//! - `installed: true, running: true` → ready, open the webview

use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};

use super::paths::DevforgePaths;
use super::sidecar::RehManager;
use super::state_file::DevforgeState;
use super::types::{DevforgeBootstrapStatus, RehConfig};
use crate::state::PlatformState;

/// Event name emitted when bootstrap finishes (success or failure).
pub const READY_EVENT: &str = "devforge://ready";

/// Run the DevForge bootstrap sequence.
///
/// Intended to be `tokio::spawn`ed from the Tauri setup hook. The task is
/// fire-and-forget; results are delivered via:
/// 1. The `devforge://ready` event, carrying a [`DevforgeBootstrapStatus`]
/// 2. The [`PlatformState::reh`] handle, set to `Some(RehManager)` on success
///
/// # Sequence
/// 1. Ensure the `<data_dir>/devforge/` directory layout exists
/// 2. Load (or default-construct) `state.json`
/// 3. Resolve the REH server directory (dev junction vs prod install)
/// 4. Pick the workspace (`default` if fresh-instance, else `last_workspace`)
/// 5. Spawn `RehManager`, store it in `PlatformState.reh`
/// 6. Persist the chosen workspace back to `state.json`
/// 7. Emit the ready event
pub async fn run(app: AppHandle, data_dir: PathBuf) {
    let paths = DevforgePaths::from_data_dir(&data_dir);

    if let Err(e) = paths.ensure_layout() {
        tracing::error!(error = %e, "DevForge bootstrap: failed to ensure layout");
        emit(&app, DevforgeBootstrapStatus::default());
        return;
    }
    tracing::info!(
        root = %paths.root.display(),
        "DevForge bootstrap: layout ready"
    );

    let state_path = paths.state_file();
    let mut state = DevforgeState::load(&state_path);

    let Some(server_dir) = paths.resolve_reh_server_dir() else {
        tracing::warn!("DevForge bootstrap: no REH build found — skipping spawn");
        emit(
            &app,
            DevforgeBootstrapStatus {
                installed: false,
                ..Default::default()
            },
        );
        return;
    };

    // Workspace selection: fresh-instance preference wins, otherwise the
    // last-used workspace if it still exists on disk, otherwise the
    // default empty workspace we just created in ensure_layout().
    let workspace = if state.fresh_instance_on_open {
        paths.default_workspace()
    } else {
        state
            .last_workspace
            .clone()
            .filter(|p| p.exists())
            .unwrap_or_else(|| paths.default_workspace())
    };

    let config = RehConfig {
        server_dir,
        workspace_path: workspace.clone(),
        user_data_dir: paths.user_data_dir(),
        extensions_dir: Some(paths.extensions_dir()),
    };

    tracing::info!(
        workspace = %workspace.display(),
        user_data_dir = %config.user_data_dir.display(),
        "DevForge bootstrap: spawning REH server"
    );

    match RehManager::spawn(&config).await {
        Ok(manager) => {
            let reh_status = manager.status();

            // Persist the chosen workspace so next start restores it.
            state.last_workspace = Some(workspace.clone());
            if let Err(e) = state.save(&state_path) {
                tracing::warn!(error = %e, "DevForge: failed to persist state.json");
            }

            // Install the manager into shared state so commands can reach it.
            let platform_state = app.state::<PlatformState>();
            {
                let mut guard = platform_state.reh.write().await;
                *guard = Some(manager);
            }

            let payload = DevforgeBootstrapStatus {
                installed: true,
                running: reh_status.running,
                url: reh_status.url,
                port: reh_status.port,
                workspace: Some(workspace),
                reh_version: state.reh_version.clone(),
            };
            emit(&app, payload);
            tracing::info!("DevForge bootstrap complete — REH ready");
        }
        Err(e) => {
            tracing::error!(error = %e, "DevForge bootstrap: REH spawn failed");
            emit(
                &app,
                DevforgeBootstrapStatus {
                    installed: true,
                    running: false,
                    ..Default::default()
                },
            );
        }
    }
}

/// Emit the ready event. Errors are logged — the frontend can always
/// recover by calling `devforge_get_status` directly.
fn emit(app: &AppHandle, status: DevforgeBootstrapStatus) {
    if let Err(e) = app.emit(READY_EVENT, status) {
        tracing::warn!(error = %e, "Failed to emit {READY_EVENT}");
    }
}
