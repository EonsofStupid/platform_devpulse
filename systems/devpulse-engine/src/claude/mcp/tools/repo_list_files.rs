//! MCP tool: `repo_list_files` — directory listing with sizes.
//!
//! Recursive to max depth 3. 1000 entry limit.
//! Workspace containment enforced.
//!
//! # Cast lints
//!
//! File size formatting (`u64` → `f64` to print "M" / "K" suffix) is
//! human-display math. The precision loss above 2^52 bytes (4 PB) is
//! cosmetic, and a 4-petabyte file is physically impossible inside the
//! workspace this tool walks.

#![allow(clippy::cast_precision_loss)]

use crate::platform::Platform;
use std::path::PathBuf;

const MAX_ENTRIES: usize = 1000;

/// List files in a directory with sizes.
pub async fn execute(platform: &Platform, path: &str, recursive: bool) -> String {
    let workspace_root = platform
        .data_dir()
        .parent()
        .unwrap_or(platform.data_dir())
        .to_path_buf();

    let dir_path = PathBuf::from(path);
    let resolved = match dir_path.canonicalize() {
        Ok(p) => p,
        Err(e) => return format!("ERROR: Cannot resolve path: {e}"),
    };

    if !resolved.starts_with(&workspace_root) {
        tracing::warn!(
            path = %resolved.display(),
            workspace = %workspace_root.display(),
            "MCP repo_list_files: path outside workspace"
        );
        return format!(
            "ERROR: Path must be within project workspace ({}). Got: {}",
            workspace_root.display(),
            resolved.display()
        );
    }

    if !resolved.is_dir() {
        return format!("ERROR: Not a directory: {}", resolved.display());
    }

    let mut entries = Vec::new();
    if let Err(e) = collect_entries(&resolved, &resolved, recursive, 0, 3, &mut entries).await {
        return format!("ERROR: Failed to list directory: {e}");
    }

    if entries.len() > MAX_ENTRIES {
        entries.truncate(MAX_ENTRIES);
        entries.push(format!("[... truncated at {MAX_ENTRIES} entries]"));
    }

    entries.join("\n")
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
        let relative = path
            .strip_prefix(base)
            .unwrap_or(&path)
            .display()
            .to_string();

        if metadata.is_dir() {
            entries.push(format!("{relative}/"));
            if recursive && depth < max_depth {
                Box::pin(collect_entries(
                    base,
                    &path,
                    recursive,
                    depth + 1,
                    max_depth,
                    entries,
                ))
                .await?;
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
