//! `DevForge` sidecar — type definitions for the REH web server.
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
///   persist across `DevForge` sessions.
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

/// Layman-phrased health of the `DevForge` runtime, consumed by the
/// devtool shell's `HealthBadge`.
///
/// Mirrors [`crate::platform::module::ModuleHealth`] on the Rust side but
/// flattened into `{ state, label }` so the frontend shell can render it
/// directly without pattern-matching the nested enum.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DevforgeHealth {
    /// Layman-phrased health state.
    pub state: DevforgeHealthState,
    /// One-line user-facing label (e.g. "Running", "Not installed").
    pub label: String,
}

/// Health-state variants. Matches the shell's `HealthState` union type.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum DevforgeHealthState {
    /// Transitioning from stopped toward running.
    Starting,
    /// Running, serving connections.
    Up,
    /// Running but reporting a problem.
    Degraded,
    /// Not operational (e.g. REH tree missing, REH child crashed).
    Down,
    /// Stopped by explicit request. Not a failure.
    Stopped,
    /// Status could not be determined.
    Unknown,
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
    /// `true` if a valid REH build exists at the resolved `server_dir`.
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
    /// PID of the spawned `node.exe` REH child, if running. Snapshotted
    /// at boot so the frontend can show "Process ID: X" without racing
    /// the child reap.
    pub pid: Option<u32>,
    /// Seconds since the REH child entered READY. `None` when not
    /// running. Drives the layman uptime readout on `/devforge`.
    pub uptime_secs: Option<u64>,
    /// Resident set size of the REH child in bytes — real memory the
    /// kernel has mapped for it. Looked up via `sysinfo` at status
    /// query time. `None` when not running or if sysinfo cannot find
    /// the PID (rare race during shutdown).
    pub memory_rss_bytes: Option<u64>,
}

/// Live snapshot of the `[services.system.devforge]` config block as
/// loaded by the platform — i.e. the SSOT the running service is
/// actually using.
///
/// Surfaced on `/devforge` (Connection card) and the devtool's Config
/// tab so the user sees real values, not hardcoded copies. Mirrors
/// every field on `DevForgeServiceEntry` that's relevant to the
/// frontend; private knobs (e.g. `binary_path` legacy) stay backend-only.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DevforgeConfigView {
    /// `true` if the platform will spawn DevForge on first launch.
    pub enabled: bool,
    /// `true` if a DevForge boot failure aborts platform boot.
    pub critical: bool,
    /// Service mode: `"reh"` (default — client/server) or `"standalone"`
    /// (legacy Electron, deprecated).
    pub mode: String,
    /// Configured port (`0` = auto-pick at boot).
    pub port_configured: u16,
    /// REH bind host (defaults to loopback).
    pub host: String,
    /// User-data directory (relative to `data_dir`).
    pub user_data_dir: String,
    /// Extensions directory (relative to `data_dir`).
    pub extensions_dir: String,
    /// Default workspace path (`.` = repo root).
    pub workspace_path: String,
    /// Update channel URL for in-place REH binary swaps.
    pub update_channel_url: String,
    /// Maximum seconds the platform waits for the REH child to become
    /// healthy before declaring boot failed.
    pub startup_timeout_secs: u64,
    /// Milliseconds between successive TCP-connect probes during the
    /// startup health wait.
    pub health_poll_interval_ms: u64,
}
