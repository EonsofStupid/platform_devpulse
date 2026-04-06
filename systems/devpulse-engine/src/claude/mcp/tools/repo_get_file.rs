//! MCP tool: repo.get_file — read a file from the workspace.
//!
//! Always available. Path resolved + canonicalized. 500KB truncation limit.

use serde_json::json;
use std::path::PathBuf;

use super::{error_result, text_result, ToolRegistry};
use crate::claude::mcp::protocol::ToolDefinition;

/// Max file content returned (bytes). Prevents flooding MCP transport.
const MAX_FILE_SIZE: usize = 500_000;

pub fn register(registry: &mut ToolRegistry) {
    registry.register(
        "repo.get_file",
        ToolDefinition {
            name: "repo.get_file".to_string(),
            description: "Read a file from the project workspace. Returns contents as text."
                .to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "File path (relative or absolute)" }
                },
                "required": ["path"]
            }),
        },
        Box::new(|_platform, args| {
            Box::pin(async move {
                let path_str = match args.get("path").and_then(|v| v.as_str()) {
                    Some(s) => s,
                    None => return error_result("Missing required parameter: path".to_string()),
                };

                let file_path = PathBuf::from(path_str);
                let resolved = match file_path.canonicalize() {
                    Ok(p) => p,
                    Err(e) => return error_result(format!("Cannot resolve path: {e}")),
                };

                match tokio::fs::read_to_string(&resolved).await {
                    Ok(contents) => {
                        if contents.len() > MAX_FILE_SIZE {
                            text_result(format!(
                                "[Truncated — {} bytes, showing first {}]\n\n{}",
                                contents.len(),
                                MAX_FILE_SIZE,
                                &contents[..MAX_FILE_SIZE]
                            ))
                        } else {
                            text_result(contents)
                        }
                    }
                    Err(e) => error_result(format!("Failed to read file: {e}")),
                }
            })
        }),
    );
}
