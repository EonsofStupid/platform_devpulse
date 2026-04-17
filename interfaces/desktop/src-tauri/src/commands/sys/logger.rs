//! Frontend logger bridge.
//!
//! Receives log messages from the frontend via Tauri IPC and dispatches
//! them through the Rust tracing system. This means frontend logs appear
//! in the same session JSONL files as backend logs.
//!
//! Messages with `target == "action"` are appended as **raw JSON lines** to
//! `.userdata/logs/action-YYYY-MM-DD.jsonl` (one structured event per line).

use std::io::Write;
use std::path::Path;

use crate::paths;

fn append_action_jsonl(data_dir: &Path, line: &str) -> std::io::Result<()> {
    let logs = data_dir.join("logs");
    std::fs::create_dir_all(&logs)?;
    let day = chrono::Local::now().format("%Y-%m-%d");
    let path = logs.join(format!("action-{day}.jsonl"));
    let mut f = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)?;
    writeln!(f, "{line}")?;
    Ok(())
}

/// Log a message from the frontend.
///
/// Maps frontend log levels to tracing macros. Non-action messages are tagged
/// with `target: "frontend"` and include the source module name.
///
/// Action events (`target == "action"`) are written only to the action JSONL
/// file (plain JSON lines) to avoid double-encoding inside the session log.
#[tauri::command]
#[specta::specta]
#[allow(clippy::needless_pass_by_value)]
pub fn log(app: tauri::AppHandle, level: String, target: String, message: String) {
    if target == "action" {
        if let Ok(data_dir) = paths::resolve_data_dir(&app) {
            let _ = append_action_jsonl(&data_dir, &message);
        }
        return;
    }

    match level.as_str() {
        "error" => tracing::error!(target: "frontend", source = %target, "{message}"),
        "warn" => tracing::warn!(target: "frontend", source = %target, "{message}"),
        "info" => tracing::info!(target: "frontend", source = %target, "{message}"),
        "debug" => tracing::debug!(target: "frontend", source = %target, "{message}"),
        _ => tracing::trace!(target: "frontend", source = %target, "{message}"),
    }
}
