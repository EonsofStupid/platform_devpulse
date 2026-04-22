//! Boot-time auto-registration of the DevPulse MCP entry.
//!
//! Reads the operator preferences set by the Claude devtool's Actions tab
//! (`claude.autoregister.code` / `claude.autoregister.desktop`) and calls
//! the registration helper for each `true` target. Existing user MCP
//! entries are preserved by `register::register` (atomic JSON merge).
//!
//! Pure preference plumbing — no UI, no commands. Called once during the
//! detached boot task in `lib.rs::run()` after the Platform handle is
//! installed in the shared state.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use super::register::{self, ClaudeTarget};

/// Preference keys checked at boot.
const KEY_CODE: &str = "claude.autoregister.code";
const KEY_DESKTOP: &str = "claude.autoregister.desktop";

/// Read the autoregister preferences and apply them.
///
/// Always returns success — failure to read prefs (no file yet) means
/// "no targets enabled". Per-target registration failures log a warning
/// but do not propagate; we never want a stale Claude config file to
/// prevent the rest of boot from completing.
///
/// Idempotent — running twice with the same prefs leaves both config
/// files in the same state.
pub fn apply_on_boot(data_dir: &Path) {
    let prefs = read_prefs(data_dir);
    if prefs.code {
        match register::register(ClaudeTarget::Code) {
            Ok(_) => tracing::info!("claude.autoregister: registered with Claude Code"),
            Err(e) => tracing::warn!(error = %e, "claude.autoregister: Code registration failed"),
        }
    }
    if prefs.desktop {
        match register::register(ClaudeTarget::Desktop) {
            Ok(_) => tracing::info!("claude.autoregister: registered with Claude Desktop"),
            Err(e) => tracing::warn!(error = %e, "claude.autoregister: Desktop registration failed"),
        }
    }
    if !prefs.code && !prefs.desktop {
        tracing::debug!("claude.autoregister: no targets enabled — skipping");
    }
}

/// Resolved autoregister state — opaque shape, only used inside this module.
struct Prefs {
    code: bool,
    desktop: bool,
}

/// Read the operator's autoregister preferences from the SSOT prefs file.
///
/// Mirrors the read half of `commands::sys::config::get_preference`. We
/// re-implement here (instead of calling that command) so this helper
/// works at boot time — `set_preference` requires the Tauri State that
/// only exists once `setup()` returns.
fn read_prefs(data_dir: &Path) -> Prefs {
    let prefs_file = prefs_path(data_dir);
    if !prefs_file.exists() {
        return Prefs {
            code: false,
            desktop: false,
        };
    }
    let Ok(content) = std::fs::read_to_string(&prefs_file) else {
        return Prefs {
            code: false,
            desktop: false,
        };
    };
    parse_prefs(&content)
}

fn prefs_path(data_dir: &Path) -> PathBuf {
    data_dir.join("preferences.json")
}

/// Pure parse step — exposed for unit testing without the filesystem.
///
/// Anything other than `"true"` (case-sensitive) is treated as off, so a
/// fat-fingered `"True"` or `"1"` doesn't accidentally enable a target.
fn parse_prefs(content: &str) -> Prefs {
    let map: HashMap<String, String> = serde_json::from_str(content).unwrap_or_default();
    Prefs {
        code: bool_pref(&map, KEY_CODE),
        desktop: bool_pref(&map, KEY_DESKTOP),
    }
}

fn bool_pref(map: &HashMap<String, String>, key: &str) -> bool {
    map.get(key).is_some_and(|v| v == "true")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_string_yields_all_false() {
        let prefs = parse_prefs("");
        assert!(!prefs.code);
        assert!(!prefs.desktop);
    }

    #[test]
    fn malformed_json_yields_all_false() {
        let prefs = parse_prefs("this is not json");
        assert!(!prefs.code);
        assert!(!prefs.desktop);
    }

    #[test]
    fn empty_object_yields_all_false() {
        let prefs = parse_prefs("{}");
        assert!(!prefs.code);
        assert!(!prefs.desktop);
    }

    #[test]
    fn explicit_true_matches() {
        let prefs = parse_prefs(
            r#"{"claude.autoregister.code":"true","claude.autoregister.desktop":"false"}"#,
        );
        assert!(prefs.code);
        assert!(!prefs.desktop);
    }

    #[test]
    fn anything_other_than_true_is_false() {
        let prefs = parse_prefs(
            r#"{"claude.autoregister.code":"yes","claude.autoregister.desktop":"1"}"#,
        );
        assert!(!prefs.code);
        assert!(!prefs.desktop);
    }

    #[test]
    fn extra_keys_are_ignored() {
        let prefs = parse_prefs(
            r#"{"unrelated.thing":"value","claude.autoregister.desktop":"true"}"#,
        );
        assert!(!prefs.code);
        assert!(prefs.desktop);
    }
}
