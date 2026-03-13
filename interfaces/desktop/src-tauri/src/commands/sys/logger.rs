//! Frontend logger bridge.
//!
//! Receives log messages from the frontend via Tauri IPC and dispatches
//! them through the Rust tracing system. This means frontend logs appear
//! in the same session JSONL files as backend logs.

/// Log a message from the frontend.
///
/// Maps frontend log levels to tracing macros. All messages are tagged
/// with `target: "frontend"` and include the source module name.
#[tauri::command]
pub fn log(level: String, target: String, message: String) {
    match level.as_str() {
        "error" => tracing::error!(target: "frontend", source = %target, "{message}"),
        "warn" => tracing::warn!(target: "frontend", source = %target, "{message}"),
        "info" => tracing::info!(target: "frontend", source = %target, "{message}"),
        "debug" => tracing::debug!(target: "frontend", source = %target, "{message}"),
        _ => tracing::trace!(target: "frontend", source = %target, "{message}"),
    }
}
