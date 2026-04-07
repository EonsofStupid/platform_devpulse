//! MCP tool: repo.list_files — directory listing with sizes.
//!
//! Always available. Recursive to max depth 3. 1000 entry limit.

use serde_json::json;
use std::path::PathBuf;

use super::{error_result, text_result, ToolRegistry};
use crate::claude::mcp::protocol::ToolDefinition;

/// Max entries returned to prevent flooding.
const MAX_ENTRIES: usize = 1000;

pub fn register(registry: &mut ToolRegistry) {
    registry.register(
        "repo.list_files",
        ToolDefinition {
            name: "repo.list_files".to_string(),
            description: "List files in a directory with sizes. Recursive to depth 3.".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "path": { "type": "string", "description": "Directory path" },
                    "recursive": { "type": "boolean", "description": "Recurse subdirectories (max depth 3)" }
                },
                "required": ["path"]
            }),
        },
        Box::new(|platform, args| {
            Box::pin(async move {
                let path_str = match args.get("path").and_then(|v| v.as_str()) {
                    Some(s) => s,
                    None => return error_result("Missing required parameter: path".to_string()),
                };

                let recursive = args.get("recursive").and_then(|v| v.as_bool()).unwrap_or(false);

                let workspace_root = platform
                    .data_dir()
                    .parent()
                    .unwrap_or(platform.data_dir())
                    .to_path_buf();

                let dir_path = PathBuf::from(path_str);
                let resolved = match dir_path.canonicalize() {
                    Ok(p) => p,
                    Err(e) => return error_result(format!("Cannot resolve path: {e}")),
                };

                // Workspace containment — prevent arbitrary filesystem listing
                if !resolved.starts_with(&workspace_root) {
                    tracing::warn!(
                        path = %resolved.display(),
                        workspace = %workspace_root.display(),
                        "MCP repo.list_files: path outside workspace"
                    );
                    return error_result(format!(
                        "Path must be within project workspace ({}). Got: {}",
                        workspace_root.display(),
                        resolved.display()
                    ));
                }

                if !resolved.is_dir() {
                    return error_result(format!("Not a directory: {}", resolved.display()));
                }

                let mut entries = Vec::new();
                if let Err(e) = collect_entries(&resolved, &resolved, recursive, 0, 3, &mut entries).await {
                    return error_result(format!("Failed to list directory: {e}"));
                }

                if entries.len() > MAX_ENTRIES {
                    entries.truncate(MAX_ENTRIES);
                    entries.push(format!("[... truncated at {MAX_ENTRIES} entries]"));
                }

                text_result(entries.join("\n"))
            })
        }),
    );
}

/// Recursively collect directory entries as formatted strings.
async fn collect_entries(
    base: &PathBuf,
    dir: &PathBuf,
    recursive: bool,
    depth: u32,
    max_depth: u32,
    entries: &mut Vec<String>,
) -> anyhow::Result<()> {
    let mut read_dir = tokio::fs::read_dir(dir).await?;

    while let Some(entry) = read_dir.next_entry().await? {
        let path = entry.path();
        let metadata = entry.metadata().await?;
        let relative = path.strip_prefix(base).unwrap_or(&path).display().to_string();

        if metadata.is_dir() {
            entries.push(format!("{relative}/"));
            if recursive && depth < max_depth {
                Box::pin(collect_entries(base, &path, recursive, depth + 1, max_depth, entries)).await?;
            }
        } else {
            let size = metadata.len();
            let size_str = if size >= 1_048_576 {
                format!("{:.1}M", size as f64 / 1_048_576.0)
            } else if size >= 1024 {
                format!("{:.1}K", size as f64 / 1024.0)
            } else {
                format!("{size}B")
            };
            entries.push(format!("{relative}  ({size_str})"));
        }
    }

    Ok(())
}
