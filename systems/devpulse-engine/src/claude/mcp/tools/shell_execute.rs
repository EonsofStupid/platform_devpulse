//! MCP tool: shell_execute — run a shell command.
//!
//! `#[cfg(feature = "internal")]` ONLY — compiled out of release.
//! Returns stdout + stderr + exit code. Timeout configurable.

use serde_json::json;
use std::path::PathBuf;
use std::time::Duration;
use tokio::process::Command;

use super::{error_result, text_result, ToolRegistry};
use crate::claude::mcp::protocol::ToolDefinition;

pub fn register(registry: &mut ToolRegistry) {
    registry.register(
        "shell_execute",
        ToolDefinition {
            name: "shell_execute".to_string(),
            description: "Execute a shell command. Returns stdout + stderr + exit code. \
                Internal builds only."
                .to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "command": { "type": "string", "description": "Shell command to execute" },
                    "cwd": { "type": "string", "description": "Working directory (optional)" },
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

                let cwd = args
                    .get("cwd")
                    .and_then(|v| v.as_str())
                    .map(PathBuf::from)
                    .unwrap_or_else(|| {
                        platform
                            .data_dir()
                            .parent()
                            .unwrap_or(platform.data_dir())
                            .to_path_buf()
                    });

                let timeout_ms = args
                    .get("timeout_ms")
                    .and_then(|v| v.as_u64())
                    .unwrap_or(30_000);

                let (shell, flag) = if cfg!(target_os = "windows") {
                    ("cmd", "/C")
                } else {
                    ("sh", "-c")
                };

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
