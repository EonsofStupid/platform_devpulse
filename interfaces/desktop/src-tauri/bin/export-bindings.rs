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

fn main() {
    let builder = devpulse_desktop_backend::build_specta_builder();
    let target = "../src/lib/sys/generated/bindings.ts";
    builder
        .export(Typescript::default().bigint(BigIntExportBehavior::Number), target)
        .expect("failed to export specta TypeScript bindings");
    eprintln!("[export-bindings] wrote {target}");
}
