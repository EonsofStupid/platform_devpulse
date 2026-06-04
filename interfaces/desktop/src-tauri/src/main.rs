//! `DevPulse` Desktop binary entry point.
//!
//! Two modes share the binary:
//! - default: Tauri GUI (`devpulse_desktop_backend::run`).
//! - `--mcp-stdio`: headless MCP subprocess for Claude Code / Claude
//!   Desktop integration. Constructed entirely without Tauri so the
//!   `WebView2` init never touches stdin/stdout.

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Crash safety net FIRST — installed before argv parsing so a panic
    // in `std::env::args` (or anywhere else in this function) writes
    // `<exe_dir>/early-crash-<ts>.json` instead of vanishing into the
    // detached console of a `windows_subsystem = "windows"` release
    // build. The richer hook in `logging::init()` replaces this one
    // once data_dir resolves and the JSONL subscriber is up; until then,
    // this is the ONLY thing that captures pre-logger panics on disk.
    devpulse_desktop_backend::install_early_panic_hook();

    // Route to MCP stdio mode BEFORE constructing the Tauri app — its
    // WebView2 init would corrupt stdin/stdout that the rmcp protocol
    // owns. Detection is a single argv pass; no clap dependency.
    if std::env::args().any(|a| a == "--mcp-stdio") {
        devpulse_desktop_backend::run_mcp_stdio();
        return;
    }
    devpulse_desktop_backend::run();
}
