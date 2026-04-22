//! Atomic registration of the DevPulse MCP entry in Claude config files.
//!
//! Both Claude Code and Claude Desktop read MCP entries from a JSON file
//! shaped like `{ "mcpServers": { "<name>": { "command": "...", "args": [...] } } }`.
//! Other entries (the user's own MCP servers) MUST be preserved on every
//! write. We achieve that by:
//!
//! 1. Reading the file (or starting from `{}` if missing).
//! 2. Mutating only `.mcpServers.devpulse`.
//! 3. Writing to a sibling temp file then renaming over the original.
//!
//! The tempfile + rename pattern is atomic on every OS we ship to —
//! readers either see the old file or the new file, never a half-written
//! one. On Windows, `rename` overwrites if the target exists when the
//! source and target are on the same volume, which they are by
//! construction (we put the temp file in the same directory).

use std::path::{Path, PathBuf};

use serde::Deserialize;
use serde_json::{Map, Value};
use specta::Type;

use super::detect::{detect_all, ClaudeInstalls};
use super::paths;

/// Which Claude install to write to.
#[derive(Debug, Clone, Copy, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum ClaudeTarget {
    /// `~/.claude/settings.json`.
    Code,
    /// Platform-specific Claude Desktop config dir.
    Desktop,
}

/// Add (or overwrite) the DevPulse MCP entry, then re-detect.
///
/// Idempotent — running twice with the same binary path leaves the file
/// in the same state. If the user had a previous DevPulse entry pointing
/// at a stale binary, this rewrites it to the current `current_exe()`.
///
/// # Errors
/// - Could not resolve the target config path (no home dir, etc).
/// - Could not resolve the current executable path.
/// - IO failure reading or writing the config file.
/// - Existing file is not valid JSON (we refuse to overwrite — the user
///   should fix their config first; we don't want to silently nuke it).
pub fn register(target: ClaudeTarget) -> Result<ClaudeInstalls, String> {
    let path = resolve_path(target)?;
    let exe = current_exe_string()?;
    upsert_devpulse_entry(&path, Some(devpulse_entry(&exe)))?;
    Ok(detect_all())
}

/// Remove the DevPulse MCP entry (if present), then re-detect.
///
/// Leaves the rest of the file untouched. If the target config doesn't
/// exist, this is a no-op success — there is nothing to remove.
///
/// # Errors
/// - Could not resolve the target config path.
/// - IO failure reading or writing the config file.
/// - Existing file is not valid JSON.
pub fn unregister(target: ClaudeTarget) -> Result<ClaudeInstalls, String> {
    let path = resolve_path(target)?;
    if !path.exists() {
        return Ok(detect_all());
    }
    upsert_devpulse_entry(&path, None)?;
    Ok(detect_all())
}

fn resolve_path(target: ClaudeTarget) -> Result<PathBuf, String> {
    match target {
        ClaudeTarget::Code => paths::claude_code_settings()
            .ok_or_else(|| "Could not resolve user home directory".into()),
        ClaudeTarget::Desktop => paths::claude_desktop_config()
            .ok_or_else(|| "Could not resolve Claude Desktop config directory".into()),
    }
}

fn current_exe_string() -> Result<String, String> {
    let exe = std::env::current_exe()
        .map_err(|e| format!("Could not resolve current executable: {e}"))?;
    // Canonicalize when possible so symlinks (cargo target dir, dev shims)
    // resolve to a stable absolute path.
    let canonical = std::fs::canonicalize(&exe).unwrap_or(exe);
    Ok(canonical.display().to_string())
}

/// The MCP server entry we write into Claude config.
///
/// `--mcp-stdio` is the CLI flag our `main.rs` looks for to bypass Tauri
/// and route the process into stdio MCP mode. Both flag and binary path
/// are baked into the JSON so the user can also invoke the same line by
/// hand for debugging (`devpulse-desktop-app.exe --mcp-stdio`).
fn devpulse_entry(exe: &str) -> Value {
    serde_json::json!({
        "command": exe,
        "args": ["--mcp-stdio"],
    })
}

/// Read-modify-write the config file, mutating only the DevPulse entry.
///
/// `entry = Some(...)` upserts; `entry = None` removes.
fn upsert_devpulse_entry(path: &Path, entry: Option<Value>) -> Result<(), String> {
    // Make sure the parent directory exists before we try to write.
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Could not create {}: {e}", parent.display()))?;
    }

    // Load current contents (or start from an empty object).
    let mut root: Map<String, Value> = if path.exists() {
        let bytes = std::fs::read(path)
            .map_err(|e| format!("Read failed for {}: {e}", path.display()))?;
        if bytes.is_empty() {
            Map::new()
        } else {
            let parsed: Value = serde_json::from_slice(&bytes)
                .map_err(|e| format!("Existing config is not valid JSON: {e}"))?;
            match parsed {
                Value::Object(map) => map,
                other => {
                    return Err(format!(
                        "Existing config root must be a JSON object, got {}",
                        kind_of(&other)
                    ));
                }
            }
        }
    } else {
        Map::new()
    };

    // Mutate only `mcpServers.devpulse`. Preserve every other entry.
    let mcp_servers_entry = root
        .entry("mcpServers".to_string())
        .or_insert(Value::Object(Map::new()));
    let Value::Object(mcp_servers) = mcp_servers_entry else {
        return Err(format!(
            "`mcpServers` must be a JSON object, got {}",
            kind_of(mcp_servers_entry)
        ));
    };
    match entry {
        Some(value) => {
            mcp_servers.insert("devpulse".to_string(), value);
        }
        None => {
            mcp_servers.remove("devpulse");
        }
    }

    // Atomic write: temp file in same dir, then rename over original.
    let serialized = serde_json::to_vec_pretty(&Value::Object(root))
        .map_err(|e| format!("Could not serialize updated config: {e}"))?;

    let tmp_path = match path.file_name() {
        Some(name) => {
            let mut s = name.to_os_string();
            s.push(".devpulse.tmp");
            path.with_file_name(s)
        }
        None => return Err("Config path has no file name".into()),
    };

    std::fs::write(&tmp_path, &serialized)
        .map_err(|e| format!("Write to temp file failed: {e}"))?;
    std::fs::rename(&tmp_path, path)
        .map_err(|e| format!("Rename into place failed: {e}"))?;
    Ok(())
}

fn kind_of(v: &Value) -> &'static str {
    match v {
        Value::Null => "null",
        Value::Bool(_) => "boolean",
        Value::Number(_) => "number",
        Value::String(_) => "string",
        Value::Array(_) => "array",
        Value::Object(_) => "object",
    }
}
