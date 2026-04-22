//! Cross-platform Claude config file locations.
//!
//! Both Claude Code (the CLI) and Claude Desktop (the native app) read MCP
//! server entries from a JSON config file. The shapes are compatible — both
//! use a top-level `mcpServers` object — but the file paths differ.

use std::path::PathBuf;

/// Where to find Claude Code's user settings (`~/.claude/settings.json`).
///
/// The Claude Code CLI reads this on every invocation. MCP servers declared
/// here are spawned as subprocesses by Claude Code and their tools are
/// surfaced to the model.
///
/// Returns `None` only if the OS cannot resolve the user's home directory.
pub fn claude_code_settings() -> Option<PathBuf> {
    home_dir().map(|h| h.join(".claude").join("settings.json"))
}

/// Where to find Claude Desktop's MCP config.
///
/// Claude Desktop reads this on launch and re-reads on the user clicking
/// "reload" in its dev settings. MCP servers declared here are spawned as
/// subprocesses and their tools are surfaced to the model.
///
/// Platform-specific:
/// - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
/// - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
/// - Linux: `$XDG_CONFIG_HOME/Claude/claude_desktop_config.json`
///   (falls back to `~/.config/Claude/claude_desktop_config.json`)
pub fn claude_desktop_config() -> Option<PathBuf> {
    desktop_config_root().map(|root| root.join("claude_desktop_config.json"))
}

fn home_dir() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var_os("USERPROFILE").map(PathBuf::from)
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::env::var_os("HOME").map(PathBuf::from)
    }
}

fn desktop_config_root() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var_os("APPDATA").map(|p| PathBuf::from(p).join("Claude"))
    }
    #[cfg(target_os = "macos")]
    {
        home_dir().map(|h| h.join("Library").join("Application Support").join("Claude"))
    }
    #[cfg(target_os = "linux")]
    {
        std::env::var_os("XDG_CONFIG_HOME")
            .map(PathBuf::from)
            .or_else(|| home_dir().map(|h| h.join(".config")))
            .map(|root| root.join("Claude"))
    }
}
