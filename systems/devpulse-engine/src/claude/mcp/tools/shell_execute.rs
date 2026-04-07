//! MCP tool: shell_execute — run a shell command.
//!
//! `#[cfg(feature = "internal")]` ONLY — compiled out of release.
//! Returns stdout + stderr + exit code. Timeout configurable.
//!
//! Security: workspace containment enforced on `cwd`, command blocklist applied.

use serde_json::json;
use std::path::PathBuf;
use std::time::Duration;
use tokio::process::Command;

use super::{error_result, text_result, ToolRegistry};
use crate::claude::mcp::protocol::ToolDefinition;

/// Commands that are never allowed regardless of context.
const BLOCKED_COMMANDS: &[&str] = &[
    "rm -rf /",
    "rm -rf ~",
    "format",
    "mkfs",
    "dd if=",
    ":(){:|:&};:",
    "shutdown",
    "reboot",
    "halt",
    "poweroff",
    "init 0",
    "init 6",
];

/// Substrings that indicate dangerous piped operations.
const BLOCKED_PATTERNS: &[&str] = &[
    "| sh",
    "| bash",
    "| cmd",
    "| powershell",
    "> /dev/sd",
    "curl | ",
    "wget | ",
    "net user ",
    "reg delete",
    "reg add",
];

/// Verify that a resolved path is inside the workspace root.
fn is_within_workspace(path: &std::path::Path, workspace: &std::path::Path) -> bool {
    path.starts_with(workspace)
}

/// Check if a command string matches any blocklist entry.
fn is_blocked_command(command: &str) -> Option<&'static str> {
    let lower = command.to_lowercase();
    for blocked in BLOCKED_COMMANDS {
        if lower.contains(blocked) {
            return Some(blocked);
        }
    }
    for pattern in BLOCKED_PATTERNS {
        if lower.contains(pattern) {
            return Some(pattern);
        }
    }
    None
}

pub fn register(registry: &mut ToolRegistry) {
    registry.register(
        "shell_execute",
        ToolDefinition {
            name: "shell_execute".to_string(),
            description: "Execute a shell command within the project workspace. \
                Returns stdout + stderr + exit code. Internal builds only."
                .to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "command": { "type": "string", "description": "Shell command to execute" },
                    "cwd": { "type": "string", "description": "Working directory (must be within project workspace)" },
                    "timeout_ms": { "type": "number", "description": "Timeout ms (default 30000)" }
                },
                "required": ["command"]
            }),
        },
        Box::new(|platform, args| {
            Box::pin(async move {
                let command = match args.get("command").and_then(|v| v.as_str()) {
                    Some(s) => s.to_string(),
                    None => return error_result("Missing required parameter: command".to_string()),
                };

                // ── Command blocklist ────────────────────────────────
                if let Some(blocked) = is_blocked_command(&command) {
                    tracing::warn!(
                        command = %command,
                        blocked_pattern = blocked,
                        "MCP shell_execute: blocked dangerous command"
                    );
                    return error_result(format!(
                        "Command blocked by security policy (matched: '{blocked}')"
                    ));
                }

                // ── Workspace root: parent of data_dir ───────────────
                let workspace_root = platform
                    .data_dir()
                    .parent()
                    .unwrap_or(platform.data_dir())
                    .to_path_buf();

                // ── Resolve and contain cwd ──────────────────────────
                let requested_cwd = args
                    .get("cwd")
                    .and_then(|v| v.as_str())
                    .map(PathBuf::from)
                    .unwrap_or_else(|| workspace_root.clone());

                let cwd = match requested_cwd.canonicalize() {
                    Ok(p) => p,
                    Err(e) => return error_result(format!("Cannot resolve cwd: {e}")),
                };

                if !is_within_workspace(&cwd, &workspace_root) {
                    tracing::warn!(
                        cwd = %cwd.display(),
                        workspace = %workspace_root.display(),
                        "MCP shell_execute: cwd outside workspace"
                    );
                    return error_result(format!(
                        "Working directory must be within project workspace ({}). Got: {}",
                        workspace_root.display(),
                        cwd.display()
                    ));
                }

                let timeout_ms = args
                    .get("timeout_ms")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(30_000);

                let (shell, flag) = if cfg!(target_os = "windows") {
                    ("cmd", "/C")
                } else {
                    ("sh", "-c")
                };

                tracing::debug!(
                    command = %command,
                    cwd = %cwd.display(),
                    timeout_ms = timeout_ms,
                    "MCP shell_execute: spawning"
                );

                let child = Command::new(shell)
                    .arg(flag)
                    .arg(&command)
                    .current_dir(&cwd)
                    .stdout(std::process::Stdio::piped())
                    .stderr(std::process::Stdio::piped())
                    .spawn();

                let child = match child {
                    Ok(c) => c,
                    Err(e) => return error_result(format!("Failed to spawn: {e}")),
                };

                match tokio::time::timeout(Duration::from_millis(timeout_ms), child.wait_with_output()).await {
                    Ok(Ok(output)) => {
                        let stdout = String::from_utf8_lossy(&output.stdout);
                        let stderr = String::from_utf8_lossy(&output.stderr);
                        let code = output.status.code().unwrap_or(-1);

                        let mut result = format!("Exit code: {code}\n");
                        if !stdout.is_empty() {
                            result.push_str(&format!("\n--- stdout ---\n{stdout}"));
                        }
                        if !stderr.is_empty() {
                            result.push_str(&format!("\n--- stderr ---\n{stderr}"));
                        }
                        text_result(result)
                    }
                    Ok(Err(e)) => error_result(format!("Process error: {e}")),
                    Err(_) => error_result(format!("Timed out after {timeout_ms}ms")),
                }
            })
        }),
    );
}
