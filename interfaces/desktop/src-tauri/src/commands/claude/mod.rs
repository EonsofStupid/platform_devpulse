//! Claude integration Tauri commands.
//!
//! Reflects the actual subprocess model: Claude Code and Claude Desktop
//! launch us as a child process via stdio MCP. Our Tauri GUI does NOT
//! itself host an MCP server (it can't — its own stdin/stdout belong to
//! the WebView). What the devtool controls is **registration** — adding
//! / removing the `devpulse` entry in each client's MCP config so the
//! client knows how to spawn us.
//!
//! What "MCP available" means here:
//! - The binary supports `--mcp-stdio` mode (always true in this build).
//! - The compile-time tool list is non-empty.
//!
//! What "registered" means:
//! - `mcpServers.devpulse` exists in the target client's config file.
//!
//! Real "running" status would require the spawned subprocess to ping
//! home — that's deliberately out of scope; the client owns subprocess
//! lifetime, not us.

pub mod autoregister;
pub mod detect;
pub mod paths;
pub mod ping;
pub mod register;

pub use ping::{
    anthropic_key_present, ping_claude, PingClaudeRequest, PingClaudeResponse, PingClaudeUsage,
};

use serde::Serialize;
use specta::Type;

use detect::ClaudeInstalls;
use register::ClaudeTarget;

/// Snapshot of the MCP integration — what the devtool renders.
#[derive(Debug, Clone, Serialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct McpStatus {
    /// Whether the binary supports MCP stdio mode. Always `true` in this
    /// build — present so the devtool can stay generic for future modes
    /// (HTTP, SSE) where availability is conditional.
    pub available: bool,
    /// Number of compile-time-registered tools.
    pub tool_count: u32,
    /// Names of all registered tools — shown verbatim in the devtool.
    pub tool_names: Vec<String>,
    /// MCP protocol version this build advertises (matches `claude/mcp/mod.rs`).
    pub protocol_version: String,
    /// Per-client install + registration snapshot.
    pub installs: ClaudeInstalls,
}

impl McpStatus {
    /// Build the current snapshot — pairs the static tool surface with a
    /// fresh detection pass.
    pub fn snapshot() -> Self {
        Self {
            available: true,
            tool_count: TOOL_NAMES.len() as u32,
            tool_names: TOOL_NAMES.iter().map(|s| (*s).to_string()).collect(),
            protocol_version: PROTOCOL_VERSION.into(),
            installs: detect::detect_all(),
        }
    }
}

/// Tools served by the MCP server — must stay in sync with `claude/mcp/mod.rs`.
///
/// `shell_execute` is gated to the `kernel` feature on the engine side
/// but we list it here unconditionally — the devtool just shows what
/// the build *can* serve, and dev builds always include it.
const TOOL_NAMES: &[&str] = &[
    "get_health",
    "query_libsql",
    "repo_get_file",
    "repo_list_files",
    "shell_execute",
];

/// MCP protocol version advertised by `start_stdio` — keep in sync with
/// the rmcp `ServerInfo::default()` we use in `claude/mcp/mod.rs`.
const PROTOCOL_VERSION: &str = "2025-06-18";

/// Get current MCP integration status.
///
/// Always succeeds — installs that fail to detect surface their error
/// in `installs.<target>.read_error` rather than failing the call. The
/// devtool polls this every couple seconds; a failing read here would
/// blank the whole panel, so we keep returning a snapshot.
#[tauri::command]
#[specta::specta]
pub fn get_mcp_status() -> McpStatus {
    McpStatus::snapshot()
}

/// Detect Claude Code + Claude Desktop installs.
///
/// A subset of `get_mcp_status` for callers that only need the install
/// snapshot (e.g. the Settings page's "Detect Claude" button).
#[tauri::command]
#[specta::specta]
pub fn detect_claude_installs() -> ClaudeInstalls {
    detect::detect_all()
}

/// Register the DevPulse MCP entry with a Claude client.
///
/// Writes `mcpServers.devpulse = { command, args: ["--mcp-stdio"] }` into
/// the target client's config file (preserving every other entry) and
/// returns the refreshed install snapshot. The user must restart their
/// Claude client for the entry to take effect.
///
/// # Errors
/// Surfaces IO and JSON parse errors verbatim so the devtool can show
/// them in the error panel.
#[tauri::command]
#[specta::specta]
pub fn register_devpulse_mcp(
    target: ClaudeTarget,
) -> Result<ClaudeInstalls, crate::commands::_util::CommandError> {
    register::register(target)
}

/// Remove the DevPulse MCP entry from a Claude client.
///
/// Idempotent — removing a missing entry is success. The user must
/// restart their Claude client for the removal to take effect.
///
/// # Errors
/// Surfaces IO and JSON parse errors verbatim.
#[tauri::command]
#[specta::specta]
pub fn unregister_devpulse_mcp(
    target: ClaudeTarget,
) -> Result<ClaudeInstalls, crate::commands::_util::CommandError> {
    register::unregister(target)
}
