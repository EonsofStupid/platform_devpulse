//! MCP tool: `shell_execute` — run a shell command.
//!
//! `#[cfg(feature = "kernel")]` ONLY — compiled out of release.
//! Returns stdout + stderr + exit code. Timeout configurable.
//!
//! Security: workspace containment on cwd, command blocklist applied.

use crate::platform::Platform;
use std::path::PathBuf;
use std::time::Duration;
use tokio::process::Command;

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

fn is_blocked_command(command: &str) -> Option<&'static str> {
    let lower = command.to_lowercase();
    for blocked in BLOCKED_COMMANDS {
        if lower.contains(blocked) {
            return Some(blocked);
        }
    }
    BLOCKED_PATTERNS.iter().find(|&pattern| lower.contains(pattern)).map(|v| v as _)
}

/// Execute a shell command within the project workspace.
pub async fn execute(
    platform: &Platform,
    command: &str,
    cwd: Option<&str>,
    timeout_ms: Option<u64>,
) -> String {
    if let Some(blocked) = is_blocked_command(command) {
        tracing::warn!(
            command = %command,
            blocked_pattern = blocked,
            "MCP shell_execute: blocked dangerous command"
        );
        return format!("ERROR: Command blocked by security policy (matched: '{blocked}')");
    }

    let workspace_root = platform
        .data_dir()
        .parent()
        .unwrap_or(platform.data_dir())
        .to_path_buf();

    let requested_cwd = cwd.map_or_else(|| workspace_root.clone(), PathBuf::from);

    let resolved_cwd = match requested_cwd.canonicalize() {
        Ok(p) => p,
        Err(e) => return format!("ERROR: Cannot resolve cwd: {e}"),
    };

    if !resolved_cwd.starts_with(&workspace_root) {
        tracing::warn!(
            cwd = %resolved_cwd.display(),
            workspace = %workspace_root.display(),
            "MCP shell_execute: cwd outside workspace"
        );
        return format!(
            "ERROR: Working directory must be within project workspace ({}). Got: {}",
            workspace_root.display(),
            resolved_cwd.display()
        );
    }

    let timeout = timeout_ms.unwrap_or(30_000);

    let (shell, flag) = if cfg!(target_os = "windows") {
        ("cmd", "/C")
    } else {
        ("sh", "-c")
    };

    tracing::debug!(
        command = %command,
        cwd = %resolved_cwd.display(),
        timeout_ms = timeout,
        "MCP shell_execute: spawning"
    );

    let child = Command::new(shell)
        .arg(flag)
        .arg(command)
        .current_dir(&resolved_cwd)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn();

    let child = match child {
        Ok(c) => c,
        Err(e) => return format!("ERROR: Failed to spawn: {e}"),
    };

    match tokio::time::timeout(Duration::from_millis(timeout), child.wait_with_output()).await {
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
            result
        }
        Ok(Err(e)) => format!("ERROR: Process error: {e}"),
        Err(_) => format!("ERROR: Timed out after {timeout}ms"),
    }
}
