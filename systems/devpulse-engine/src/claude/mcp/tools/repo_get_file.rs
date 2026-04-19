//! MCP tool: repo_get_file — read a file from the workspace.
//!
//! Path resolved + canonicalized. 500KB truncation limit.
//! Workspace containment enforced.

use crate::platform::Platform;
use std::path::PathBuf;

const MAX_FILE_SIZE: usize = 500_000;

/// Read a file from the project workspace. Returns contents as text.
pub async fn execute(platform: &Platform, path: &str) -> String {
    let workspace_root = platform
        .data_dir()
        .parent()
        .unwrap_or(platform.data_dir())
        .to_path_buf();

    let file_path = PathBuf::from(path);
    let resolved = match file_path.canonicalize() {
        Ok(p) => p,
        Err(e) => return format!("ERROR: Cannot resolve path: {e}"),
    };

    if !resolved.starts_with(&workspace_root) {
        tracing::warn!(
            path = %resolved.display(),
            workspace = %workspace_root.display(),
            "MCP repo_get_file: path outside workspace"
        );
        return format!(
            "ERROR: Path must be within project workspace ({}). Got: {}",
            workspace_root.display(),
            resolved.display()
        );
    }

    match tokio::fs::read_to_string(&resolved).await {
        Ok(contents) => {
            if contents.len() > MAX_FILE_SIZE {
                format!(
                    "[Truncated — {} bytes, showing first {}]\n\n{}",
                    contents.len(),
                    MAX_FILE_SIZE,
                    &contents[..MAX_FILE_SIZE]
                )
            } else {
                contents
            }
        }
        Err(e) => format!("ERROR: Failed to read file: {e}"),
    }
}
