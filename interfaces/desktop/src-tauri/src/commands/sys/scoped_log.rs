//! Target-scoped query over the current session's tracing JSONL log.
//!
//! `commands::sys::action_log` tails the operator-facing
//! `action-YYYY-MM-DD.jsonl`. This module reads the developer-facing
//! `session-YYYY-MM-DD-HHMMSS.jsonl` written by the file-tracing layer
//! and returns the last N lines whose `target` field starts with a
//! caller-supplied prefix.
//!
//! Used by per-service devtools (Claude, RRO, model loader, etc.) to
//! show a live "scoped log" panel without a third-party log shipper.
//! One read per invocation — refresh is the caller's job.
#![expect(
    clippy::needless_pass_by_value,
    reason = "Tauri command macro injects `AppHandle` by value and deserializes `String` args from JSON; commands cannot take `&AppHandle` / `&str` and remain `#[tauri::command]`-compatible."
)]

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::paths;

/// One parsed JSONL log line, projected to the fields the devtool renders.
///
/// Skips spans/fields/file/line — the JSONL has them but the devtool's
/// scoped-log panel only needs timestamp + level + target + message. A
/// future "log details" drawer can re-parse the raw JSON if needed.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ScopedLogEntry {
    /// ISO-8601 timestamp from the JSONL `timestamp` field.
    pub timestamp: String,
    /// Log level: `TRACE` / `DEBUG` / `INFO` / `WARN` / `ERROR`.
    pub level: String,
    /// Tracing target — e.g. `devtools.claude`, `mcp_stdio_server`,
    /// `claude::mcp::tools::query_database`.
    pub target: String,
    /// Human-readable message from the JSONL `fields.message` field.
    /// Empty string if the entry was a span event without a message.
    pub message: String,
}

/// Read the current session JSONL file and return the last `limit` lines
/// whose `target` starts with `target_prefix`.
///
/// Returns newest-first. If `target_prefix` is empty, returns every line.
/// Missing log directory or no session file = empty result, not an error
/// (the dev may have just booted).
///
/// # Errors
/// - Data dir resolution failed.
/// - Log directory listing failed (IO error).
/// - Most-recent session file could not be read.
#[tauri::command]
#[specta::specta]
pub fn query_scoped_log(
    app: tauri::AppHandle,
    target_prefix: String,
    limit: u32,
) -> Result<Vec<ScopedLogEntry>, String> {
    let data_dir = paths::resolve_data_dir(&app)?;
    let logs_dir = data_dir.join("logs");
    if !logs_dir.exists() {
        return Ok(Vec::new());
    }

    let Some(session_path) = newest_session_file(&logs_dir)? else {
        return Ok(Vec::new());
    };

    let raw = std::fs::read_to_string(&session_path)
        .map_err(|e| format!("read {} failed: {e}", session_path.display()))?;

    Ok(filter_lines(&raw, &target_prefix, limit as usize))
}

/// Return the most recent `session-*.jsonl` file in `logs_dir`, by name.
///
/// Filename convention is `session-YYYY-MM-DD-HHMMSS.jsonl`, so a string
/// sort works without parsing the timestamp.
fn newest_session_file(logs_dir: &Path) -> Result<Option<PathBuf>, String> {
    let mut sessions: Vec<PathBuf> = std::fs::read_dir(logs_dir)
        .map_err(|e| format!("readdir {} failed: {e}", logs_dir.display()))?
        .filter_map(Result::ok)
        .map(|e| e.path())
        .filter(|p| {
            p.file_name().and_then(|n| n.to_str()).is_some_and(|n| {
                n.starts_with("session-")
                    && Path::new(n)
                        .extension()
                        .is_some_and(|ext| ext.eq_ignore_ascii_case("jsonl"))
            })
        })
        .collect();
    if sessions.is_empty() {
        return Ok(None);
    }
    sessions.sort();
    Ok(sessions.pop())
}

/// Parse + filter + tail. Pure for unit testing.
fn filter_lines(raw: &str, target_prefix: &str, limit: usize) -> Vec<ScopedLogEntry> {
    let mut matched = Vec::new();
    for line in raw.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let Ok(rec) = serde_json::from_str::<TracingJsonRecord>(trimmed) else {
            continue;
        };
        if !target_prefix.is_empty() && !rec.target.starts_with(target_prefix) {
            continue;
        }
        matched.push(ScopedLogEntry {
            timestamp: rec.timestamp,
            level: rec.level,
            target: rec.target,
            message: rec.fields.message.unwrap_or_default(),
        });
    }
    let total = matched.len();
    if total > limit {
        matched.drain(0..total - limit);
    }
    matched.reverse();
    matched
}

/// Subset of the tracing-subscriber JSON layer's per-line shape.
///
/// We deliberately ignore everything we don't render so a future
/// tracing version that adds new fields doesn't break parsing.
#[derive(Debug, Deserialize)]
struct TracingJsonRecord {
    timestamp: String,
    level: String,
    target: String,
    #[serde(default)]
    fields: TracingFields,
}

#[derive(Debug, Default, Deserialize)]
struct TracingFields {
    #[serde(default)]
    message: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = r#"{"timestamp":"2026-04-22T10:00:00Z","level":"INFO","target":"devtools.claude","fields":{"message":"Manual refresh"}}
{"timestamp":"2026-04-22T10:00:01Z","level":"DEBUG","target":"unrelated","fields":{"message":"noise"}}
{"timestamp":"2026-04-22T10:00:02Z","level":"INFO","target":"devtools.claude","fields":{"message":"Register code"}}
{"timestamp":"2026-04-22T10:00:03Z","level":"WARN","target":"claude.mcp.tools","fields":{"message":"slow tool"}}
"#;

    #[test]
    fn empty_prefix_returns_everything_newest_first() {
        let out = filter_lines(SAMPLE, "", 100);
        assert_eq!(out.len(), 4);
        assert_eq!(out[0].timestamp, "2026-04-22T10:00:03Z");
        assert_eq!(out[3].timestamp, "2026-04-22T10:00:00Z");
    }

    #[test]
    fn prefix_matches_targets_starting_with_value() {
        let out = filter_lines(SAMPLE, "claude.", 100);
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].target, "claude.mcp.tools");
    }

    #[test]
    fn devtools_claude_prefix_matches_devtool_lines_only() {
        let out = filter_lines(SAMPLE, "devtools.claude", 100);
        assert_eq!(out.len(), 2);
        assert!(out.iter().all(|e| e.target == "devtools.claude"));
    }

    #[test]
    fn limit_keeps_only_most_recent_matches() {
        let out = filter_lines(SAMPLE, "", 2);
        assert_eq!(out.len(), 2);
        assert_eq!(out[0].timestamp, "2026-04-22T10:00:03Z");
        assert_eq!(out[1].timestamp, "2026-04-22T10:00:02Z");
    }

    #[test]
    fn malformed_lines_are_skipped() {
        let raw = "not json\n{\"timestamp\":\"t\",\"level\":\"INFO\",\"target\":\"a\",\"fields\":{}}\nstill not json\n";
        let out = filter_lines(raw, "", 100);
        assert_eq!(out.len(), 1);
    }

    #[test]
    fn missing_message_field_renders_empty_string() {
        let raw = r#"{"timestamp":"t","level":"INFO","target":"a","fields":{}}"#;
        let out = filter_lines(raw, "", 100);
        assert_eq!(out[0].message, "");
    }

    #[test]
    fn empty_input_returns_empty() {
        assert!(filter_lines("", "", 100).is_empty());
        assert!(filter_lines("\n\n  \n", "", 100).is_empty());
    }
}
