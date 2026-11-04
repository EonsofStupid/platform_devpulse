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

use specta_typescript::Typescript;
use tauri_specta::Builder;

/// What a fallible command resolves to, named for the UI's own wrappers around
/// commands. tauri-specta spells this shape out at each command, without a name.
const RESULT_TYPE: &str =
    "export type Result<T, E> = { status: \"ok\"; data: T } | { status: \"error\"; error: E };";

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
    // tauri-specta only exports to a path. Rendering must not touch the real
    // file: the caller writes it only when the text changed.
    let draft = std::env::temp_dir().join(format!("devpulse-bindings-{}.ts", std::process::id()));
    let exported = builder
        .export(Typescript::default().with_raw(RESULT_TYPE), &draft)
        .map_err(|e| e.to_string());
    let rendered = exported.and_then(|()| {
        std::fs::read_to_string(&draft).map_err(|e| format!("{}: {e}", draft.display()))
    });
    let removed = std::fs::remove_file(&draft);
    let rendered = rendered?;
    removed.map_err(|e| format!("{}: {e}", draft.display()))?;
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

/// tauri-specta before rc.24 emitted `Channel as TAURI_CHANNEL` in the import
/// block whether or not any command took a channel; Vite then warned "imported
/// but never used". This dropped the import when it was the only reference.
/// Current tauri-specta imports `Channel` only when used, so this finds nothing.
fn strip_unused_tauri_channel_import(content: String) -> String {
    const IMPORT_LINE: &str = "\tChannel as TAURI_CHANNEL,\n";
    if content.matches("TAURI_CHANNEL").count() == 1 {
        content.replacen(IMPORT_LINE, "", 1)
    } else {
        content
    }
}
