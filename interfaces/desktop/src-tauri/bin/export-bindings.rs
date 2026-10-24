//! `cargo run -p devpulse_desktop_backend --bin export-bindings`
//!
//! Regenerate `interfaces/desktop/src/lib/sys/generated/bindings.ts`
//! from the live `#[tauri::command] #[specta::specta]` surface without
//! launching the Tauri runtime.
//!
//! Invoked by `cargo xtask regen-bindings` and the bindings-drift
//! pre-commit hook. Always writes (the xtask checks the file's mtime).
//! Exits 0 on success, non-zero on export failure.
//!
//! Rendering and the output path live in
//! [`devpulse_desktop_backend::bindings`], shared with the debug-build
//! startup refresh, so both produce byte-identical files.

use devpulse_desktop_backend::bindings;

fn main() -> std::process::ExitCode {
    let builder = devpulse_desktop_backend::build_specta_builder();
    let path = bindings::bindings_path();

    let content = match bindings::render(&builder) {
        Ok(content) => content,
        Err(err) => {
            eprintln!("[export-bindings] failed to render TypeScript bindings: {err}");
            return std::process::ExitCode::FAILURE;
        }
    };
    if let Err(err) = std::fs::write(&path, content) {
        eprintln!(
            "[export-bindings] failed to write {}: {err}",
            path.display()
        );
        return std::process::ExitCode::FAILURE;
    }

    eprintln!("[export-bindings] wrote {}", path.display());
    std::process::ExitCode::SUCCESS
}
