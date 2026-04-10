//! DevForge sidecar — type definitions for the REH web server.
//!
//! These types cross the Tauri IPC boundary via `tauri-specta`, so they
//! are generated into the frontend TS bindings.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::PathBuf;

/// Configuration supplied by the frontend when spawning the REH server.
///
/// `server_dir` must point at the root of a `vscode-reh-web-*` layout that
/// contains `bin/devforge-server.cmd` (Windows) or `bin/devforge-server.sh`
/// (Unix) and `out/server-main.js`.
///
/// `workspace_path` is the folder the server will open by default. The
/// frontend is responsible for validating that this path exists.
///
/// `extensions_dir` is optional — when set, the REH server stores/loads
/// extensions from this directory, allowing DevForge to manage extensions
/// outside the default user profile.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RehConfig {
    /// Path to the REH web server build directory.
    pub server_dir: PathBuf,
    /// Workspace folder the server will open on start.
    pub workspace_path: PathBuf,
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
