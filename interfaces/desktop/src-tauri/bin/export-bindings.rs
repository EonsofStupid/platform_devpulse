//! `cargo run -p devpulse_desktop_backend --bin export-bindings`
//!
//! Regenerate `interfaces/desktop/src/lib/sys/generated/bindings.ts`
//! from the live `#[tauri::command] #[specta::specta]` surface without
//! launching the Tauri runtime.
//!
//! Invoked by `cargo xtask regen-bindings` and the bindings-drift
//! pre-commit hook. Exits 0 on success, non-zero on export failure.
//!
//! # Why a separate binary
//!
//! Previously the export was glued onto `pub fn run()` with a
//! `DEVPULSE_BINDINGS_EXPORT_ONLY=1` env-var early-return. That hack
//! also caused every release-launch of the installed exe to attempt a
//! write to a path relative to its cwd, which silently failed or
//! polluted random dirs. The dedicated binary makes the export an
//! explicit tool with a real entry point, and `pub fn run()` no longer
//! touches the filesystem at startup.
//!
//! # Output path
//!
//! Writes `../src/lib/sys/generated/bindings.ts` relative to the
//! current working directory. `xtask regen-bindings` pins cwd to
//! `interfaces/desktop/src-tauri/` so the path resolves correctly.

use specta_typescript::{BigIntExportBehavior, Typescript};

fn main() -> std::process::ExitCode {
    let builder = devpulse_desktop_backend::build_specta_builder();
    let target = "../src/lib/sys/generated/bindings.ts";
    if let Err(err) = builder.export(
        Typescript::default().bigint(BigIntExportBehavior::Number),
        target,
    ) {
        eprintln!("[export-bindings] failed to export specta TypeScript bindings: {err}");
        return std::process::ExitCode::FAILURE;
    }

    // Strip unused `Channel as TAURI_CHANNEL` import. tauri-specta emits
    // it unconditionally regardless of whether any command actually uses
    // a channel — Vite/Rollup then warns "Channel imported but never
    // used" for every consumer. We only strip when `TAURI_CHANNEL`
    // appears exactly once in the file (the import line itself); if a
    // real channel command lands later, the symbol is referenced
    // elsewhere and the strip is a no-op.
    strip_unused_tauri_channel_import(target);

    eprintln!("[export-bindings] wrote {target}");
    std::process::ExitCode::SUCCESS
}

/// Remove `\tChannel as TAURI_CHANNEL,\n` from the generated import block
/// when nothing in the file references `TAURI_CHANNEL` outside the import.
fn strip_unused_tauri_channel_import(path: &str) {
    let Ok(content) = std::fs::read_to_string(path) else {
        return;
    };
    if content.matches("TAURI_CHANNEL").count() != 1 {
        return;
    }
    let needle = "\tChannel as TAURI_CHANNEL,\n";
    if let Some(idx) = content.find(needle) {
        let mut rebuilt = String::with_capacity(content.len() - needle.len());
        rebuilt.push_str(&content[..idx]);
        rebuilt.push_str(&content[idx + needle.len()..]);
        let _ = std::fs::write(path, rebuilt);
    }
}
