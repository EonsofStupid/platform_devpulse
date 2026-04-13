//! DevForge sidecar — type definitions for the REH web server.
//!
//! These types cross the Tauri IPC boundary via `tauri-specta`, so they
//! are generated into the frontend TS bindings.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::PathBuf;

/// Configuration supplied when spawning the REH server.
///
/// Most callers will not construct this by hand — [`bootstrap`](super::bootstrap)
/// builds it from [`DevforgePaths`](super::paths::DevforgePaths) and the
/// persisted [`DevforgeState`](super::state_file::DevforgeState). It is
/// still exposed to the frontend so a "custom workspace" power-user path
/// can call `spawn_reh_server` directly with an arbitrary folder.
///
/// - `server_dir` must contain `out/server-main.js` and a bundled
///   `node.exe` (Windows) or `node` (Unix).
/// - `workspace_path` is the folder REH will open on start — must exist.
/// - `user_data_dir` is passed to REH via `--user-data-dir`. This is what
///   enables VS Code profiles, settings, keybindings, and state to
///   persist across DevForge sessions.
/// - `extensions_dir` is optional — when set, REH loads/stores extensions
///   from this directory instead of the user-data-dir default.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RehConfig {
    /// Path to the REH web server build directory.
    pub server_dir: PathBuf,
    /// Project folder the server will open on start. `None` means REH
    /// starts with no folder — the user picks one inside VS Code.
    pub workspace_path: Option<PathBuf>,
    /// VS Code user-data directory (profiles, settings, state).
    pub user_data_dir: PathBuf,
    /// Optional extensions directory override.
    pub extensions_dir: Option<PathBuf>,
}

/// Runtime status of the REH web server.
///
/// Returned from `spawn_reh_server` and `get_reh_status`. All optional
/// fields are populated only when the server is actually running.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct RehStatus {
    /// Whether the server process is currently alive.
    pub running: bool,
    /// Port the server is listening on, if running.
    pub port: Option<u16>,
    /// Full connection URL including the auth token, if running.
    pub url: Option<String>,
    /// Process ID of the spawned `node.exe`, if running.
    pub pid: Option<u32>,
}

/// Unified status returned by [`devforge_get_status`](super::devforge_get_status)
/// and emitted on the `devforge://ready` event after bootstrap.
///
/// Combines "is the REH binary installed on disk" with "is it currently
/// running" so the frontend can pick between three UI states in a single
/// payload: needs-install, installing/booting, ready-to-open.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct DevforgeBootstrapStatus {
    /// `true` if a valid REH build exists at the resolved server_dir.
    pub installed: bool,
    /// `true` if the REH child process is currently alive.
    pub running: bool,
    /// Full connection URL (includes token) — frontend loads this in a
    /// `WebviewWindow` or iframe.
    pub url: Option<String>,
    /// Port REH is listening on.
    pub port: Option<u16>,
    /// Workspace REH was spawned against.
    pub workspace: Option<PathBuf>,
    /// Installed REH bundle version, if known.
    pub reh_version: Option<String>,
}
