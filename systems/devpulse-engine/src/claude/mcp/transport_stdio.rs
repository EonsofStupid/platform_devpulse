//! Stdio transport for MCP server.
//!
//! `#[cfg(feature = "internal")]` only — Claude Code connects this way.
//! Reads newline-delimited JSON from stdin, writes responses to stdout.

use std::sync::Arc;
// devpulse_telemetry crate not yet built — use tokio::spawn directly
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::task::JoinHandle;

use super::handler::McpHandler;
use super::protocol::JsonRpcRequest;

/// Start the stdio transport with access to the MCP handler.
///
/// Reads lines from stdin, parses as JSON-RPC, dispatches via handler,
/// writes response to stdout. Runs until stdin closes (EOF).
pub async fn start(handler: Arc<McpHandler>) -> anyhow::Result<JoinHandle<()>> {
    let handle = tokio::spawn(async move {
        let stdin = tokio::io::stdin();
        let mut stdout = tokio::io::stdout();
        let reader = BufReader::new(stdin);
        let mut lines = reader.lines();

        tracing::info!("MCP stdio transport started — reading from stdin");

        while let Ok(Some(line)) = lines.next_line().await {
            let line = line.trim().to_string();
            if line.is_empty() {
                continue;
            }

            let request: JsonRpcRequest = match serde_json::from_str(&line) {
                Ok(req) => req,
                Err(e) => {
                    tracing::warn!("Invalid JSON-RPC on stdin: {e}");
                    continue;
                }
            };

            if let Some(response) = handler.dispatch(&request).await {
                match serde_json::to_string(&response) {
                    Ok(mut json) => {
                        json.push('\n');
                        if let Err(e) = stdout.write_all(json.as_bytes()).await {
                            tracing::error!("Failed to write to stdout: {e}");
                            break;
                        }
                        if let Err(e) = stdout.flush().await {
                            tracing::error!("Failed to flush stdout: {e}");
                            break;
                        }
                    }
                    Err(e) => {
                        tracing::error!("Failed to serialize MCP response: {e}");
                    }
                }
            }
        }

        tracing::info!("MCP stdio transport ended — stdin closed");
    });

    Ok(handle)
}
