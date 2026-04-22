//! Detect Claude installations + DevPulse MCP registration state.
//!
//! For each target (Claude Code, Claude Desktop) we report:
//! - whether the config file exists on disk,
//! - whether a `mcpServers.devpulse` entry is already registered,
//! - whether the corresponding process is currently running (Claude Desktop
//!   only — Claude Code is a CLI, no long-lived process to detect),
//! - any read error (corrupt JSON, permission denied) — surfaced verbatim
//!   so the devtool can show a precise failure reason.

use std::path::Path;

use serde::Serialize;
use specta::Type;
use sysinfo::{ProcessesToUpdate, System};

use super::paths;

/// Layman-phrased install snapshot for a single Claude target.
#[derive(Debug, Clone, Serialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeInstall {
    /// Resolved config file path (always populated, even when missing — the
    /// devtool needs it to tell the user "we'd write here if you click
    /// Register"). Empty string only if the OS can't resolve the home dir.
    pub config_path: String,
    /// `true` when the config file exists on disk. A missing file is the
    /// expected first-run state — registration creates it.
    pub config_exists: bool,
    /// `true` when `mcpServers.devpulse` is present in the config.
    pub devpulse_registered: bool,
    /// `true` when a long-lived process for this target is detected on the
    /// system right now. Claude Code is a CLI, so this is always `false`
    /// for the `code` target — the devtool should hide it accordingly.
    pub process_running: bool,
    /// Read error surfaced verbatim (corrupt JSON, IO failure). `None` on
    /// success or when the file simply doesn't exist yet.
    pub read_error: Option<String>,
}

/// Both Claude install slots — what the devtool renders side-by-side.
#[derive(Debug, Clone, Serialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeInstalls {
    /// Claude Code CLI — `~/.claude/settings.json`.
    pub code: ClaudeInstall,
    /// Claude Desktop native app — platform-specific config dir.
    pub desktop: ClaudeInstall,
}

/// Snapshot every detectable Claude install state in one pass.
///
/// Always returns a populated `ClaudeInstalls` — failure to read a single
/// target is captured in that target's `read_error` field, never propagated.
pub fn detect_all() -> ClaudeInstalls {
    let processes = running_processes();
    ClaudeInstalls {
        code: detect_code(&processes),
        desktop: detect_desktop(&processes),
    }
}

fn detect_code(processes: &RunningProcesses) -> ClaudeInstall {
    let Some(path) = paths::claude_code_settings() else {
        return ClaudeInstall {
            config_path: String::new(),
            read_error: Some("Could not resolve user home directory".into()),
            ..ClaudeInstall::default()
        };
    };

    let config_path = path.display().to_string();
    let config_exists = path.exists();
    let (devpulse_registered, read_error) = if config_exists {
        check_devpulse_registered(&path)
    } else {
        (false, None)
    };

    ClaudeInstall {
        config_path,
        config_exists,
        devpulse_registered,
        process_running: processes.claude_code,
        read_error,
    }
}

fn detect_desktop(processes: &RunningProcesses) -> ClaudeInstall {
    let Some(path) = paths::claude_desktop_config() else {
        return ClaudeInstall {
            config_path: String::new(),
            read_error: Some("Could not resolve Claude Desktop config directory".into()),
            ..ClaudeInstall::default()
        };
    };

    let config_path = path.display().to_string();
    let config_exists = path.exists();
    let (devpulse_registered, read_error) = if config_exists {
        check_devpulse_registered(&path)
    } else {
        (false, None)
    };

    ClaudeInstall {
        config_path,
        config_exists,
        devpulse_registered,
        process_running: processes.claude_desktop,
        read_error,
    }
}

/// Read the JSON config and report whether `mcpServers.devpulse` exists.
///
/// Errors (IO, parse) are surfaced as `read_error`; the registered flag
/// stays `false` so the UI shows "Not registered" rather than an unknown
/// state.
fn check_devpulse_registered(path: &Path) -> (bool, Option<String>) {
    let bytes = match std::fs::read(path) {
        Ok(b) => b,
        Err(e) => return (false, Some(format!("Read failed: {e}"))),
    };
    if bytes.is_empty() {
        return (false, None);
    }
    let value: serde_json::Value = match serde_json::from_slice(&bytes) {
        Ok(v) => v,
        Err(e) => return (false, Some(format!("Config JSON is corrupt: {e}"))),
    };
    let registered = value
        .get("mcpServers")
        .and_then(|m| m.get("devpulse"))
        .is_some();
    (registered, None)
}

#[derive(Default)]
struct RunningProcesses {
    /// `claude` CLI process detected (rare — only while a session is open).
    claude_code: bool,
    /// Claude Desktop native app detected.
    claude_desktop: bool,
}

/// Probe the process list once for both targets.
///
/// We scan a single time and let the cost amortize across both detections.
/// Process names vary by platform:
/// - Windows: `Claude.exe` (Desktop), `claude.exe` / `node.exe` (CLI is
///   often spawned via Node — too noisy to detect reliably)
/// - macOS: `Claude` (Desktop)
/// - Linux: `claude-desktop` (Desktop, AppImage / Flatpak)
fn running_processes() -> RunningProcesses {
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    let mut found = RunningProcesses::default();
    for proc in sys.processes().values() {
        let name = proc.name().to_string_lossy();
        // Claude Desktop: case-insensitive "Claude" without ".exe" / arch suffix
        if !found.claude_desktop && is_claude_desktop_proc(&name) {
            found.claude_desktop = true;
        }
        // Claude Code CLI is fragile to detect (often spawned via npm/node);
        // we only count an exact `claude` / `claude.exe` so we don't false-
        // positive on `claude-something-else.exe`.
        if !found.claude_code && is_claude_code_proc(&name) {
            found.claude_code = true;
        }
        if found.claude_desktop && found.claude_code {
            break;
        }
    }
    found
}

fn is_claude_desktop_proc(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    lower == "claude.exe" || lower == "claude" || lower == "claude-desktop"
}

fn is_claude_code_proc(name: &str) -> bool {
    let lower = name.to_ascii_lowercase();
    // Note: `claude.exe` is ambiguous — Claude Desktop uses the same name on
    // Windows. We accept both signals; the devtool just shows "running"
    // somewhere. Distinguishing requires inspecting the executable path,
    // which is more cost than the UX warrants today.
    lower == "claude" || lower == "claude.exe"
}
