//! TypeScript bindings export — one implementation shared by the
//! `export-bindings` tool (`cargo xtask regen-bindings`, the CI drift check)
//! and the debug-build startup refresh.
//!
//! # Why the app refreshes bindings in debug builds
//!
//! During `cargo xtask run-dev` every Rust rebuild restarts the app. The
//! restarted app rewrites `bindings.ts` when the generated text changed, and
//! Vite reloads the UI against the new types — so the UI never runs on stale
//! bindings. This is tauri-specta's own documented practice
//! (`#[cfg(debug_assertions)] builder.export(...)` in its example app).
//! Release builds never touch the filesystem here.

use std::path::{Path, PathBuf};

use specta_typescript::{BigIntExportBehavior, Typescript};
use tauri_specta::Builder;

/// `interfaces/desktop/src/lib/sys/generated/bindings.ts`, resolved from this
/// crate's manifest directory at compile time (independent of the cwd).
#[must_use]
pub fn bindings_path() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../src/lib/sys/generated/bindings.ts")
}

/// Render the TypeScript bindings for `builder` with the project's settings.
///
/// # Errors
///
/// Returns the exporter's message when a type cannot be rendered.
pub fn render(builder: &Builder<tauri::Wry>) -> Result<String, String> {
    let rendered = builder
        .export_str(Typescript::default().bigint(BigIntExportBehavior::Number))
        .map_err(|e| e.to_string())?;
    Ok(strip_unused_tauri_channel_import(rendered))
}

/// Write `content` to `path` only when it differs from the file on disk.
/// Returns `true` when the file was written.
///
/// # Errors
///
/// Returns the I/O error, with the path, when the file cannot be written.
pub fn write_if_changed(path: &Path, content: &str) -> Result<bool, String> {
    if std::fs::read_to_string(path).is_ok_and(|current| current == content) {
        return Ok(false);
    }
    std::fs::write(path, content).map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(true)
}

/// Debug builds: bring `bindings.ts` in step with the running Rust code.
/// Failures are logged, never fatal — the app still starts.
#[cfg(debug_assertions)]
pub fn refresh_dev(builder: &Builder<tauri::Wry>) {
    let path = bindings_path();
    match render(builder).and_then(|content| write_if_changed(&path, &content)) {
        Ok(true) => tracing::info!(path = %path.display(), "bindings: regenerated"),
        Ok(false) => tracing::debug!(path = %path.display(), "bindings: up to date"),
        Err(err) => tracing::warn!(%err, "bindings: refresh failed — UI may run on stale types"),
    }
}

/// tauri-specta emits `Channel as TAURI_CHANNEL` in the import block whether
/// or not any command takes a channel; Vite then warns "imported but never
/// used". Drop the import when the import line is the only reference.
fn strip_unused_tauri_channel_import(content: String) -> String {
    const IMPORT_LINE: &str = "\tChannel as TAURI_CHANNEL,\n";
    if content.matches("TAURI_CHANNEL").count() == 1 {
        content.replacen(IMPORT_LINE, "", 1)
    } else {
        content
    }
}
