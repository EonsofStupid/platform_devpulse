//! Portable data directory resolution — shared by logging, boot, and IPC helpers.
//!
//! Single resolution order, used by both the GUI and the `--mcp-stdio`
//! subprocess so logs and persistence never split across two parallel
//! `.userdata` trees on the same machine:
//!
//!   1. `<exe_dir>/.userdata` — portable bundle layout. Highest
//!      priority because if a shipped portable extract has its own
//!      bundled `.userdata`, that data is the user's "this install"
//!      state and must win over any nearby project root.
//!   2. Walk-up from `<exe_dir>` looking for `.userdata` (max 6
//!      levels). Covers the dev-launches-release case: a release exe
//!      built on the dev box and run from `target/release/`,
//!      `target/release/portable/<name>/`, or any other path inside
//!      the project tree resolves to the project-root `.userdata`.
//!      Stops at the first match.
//!   3. `<CARGO_MANIFEST_DIR>/../../../.userdata` — the path baked in
//!      at compile time. For a dev build this is the project root
//!      (and step 2 already covered it via the exe path); for a
//!      release exe shipped from one box and run on another, the
//!      baked path is almost certainly invalid and `is_dir()` returns
//!      false — we fall through.
//!   4. `app_data_dir()` from the Tauri Manager — the canonical
//!      installed-app location (`%APPDATA%/com.devpulse.desktop/` on
//!      Windows, `~/Library/Application Support/com.devpulse.desktop/`
//!      on macOS, `$XDG_DATA_HOME/com.devpulse.desktop/` on Linux).
//!      Only reached when the binary is truly outside any `DevPulse`
//!      workspace — the customer install case. `resolve_data_dir`
//!      can hit this; the standalone variant returns an error
//!      because the MCP subprocess must never invent a fresh dir.

use std::path::{Path, PathBuf};
use tauri::Manager;

/// Maximum number of parent directories to climb from the executable's
/// dir when looking for a sibling `.userdata`. Six is enough to cover
/// `target/release/portable/<product>/devpulse-desktop-app.exe` (3
/// hops) plus headroom for any future nested layout, while bounded
/// tightly enough that we don't accidentally pick up an unrelated
/// `.userdata` from far up the filesystem on a customer box.
const USERDATA_WALK_UP_LIMIT: usize = 6;

/// Walk from `start` up to `USERDATA_WALK_UP_LIMIT` parents searching
/// for a `.userdata` child directory. Returns the first match. Does
/// NOT check `start` itself — that's the portable-bundle case and the
/// caller already tested it separately so the layered intent stays
/// obvious in `resolve_*`.
fn find_userdata_upwards(start: &Path) -> Option<PathBuf> {
    let mut current = start.parent();
    for _ in 0..USERDATA_WALK_UP_LIMIT {
        let dir = current?;
        let candidate = dir.join(".userdata");
        if candidate.is_dir() {
            return Some(candidate);
        }
        current = dir.parent();
    }
    None
}

/// Probe the `CARGO_MANIFEST_DIR`-derived project root. Returns
/// `Some(path)` only if `.userdata` actually exists there at runtime.
/// The path is baked in at compile time; on a shipped binary running
/// on a customer box the directory won't exist and we return `None`,
/// letting the caller fall through to the OS app data dir.
fn baked_project_userdata() -> Option<PathBuf> {
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let root = manifest.parent()?.parent()?.parent()?;
    let candidate = root.join(".userdata");
    candidate.is_dir().then_some(candidate)
}

/// Resolve the data directory **without** a Tauri Manager.
///
/// Used by the MCP stdio subprocess (`--mcp-stdio`) which boots a Platform
/// without ever constructing a Tauri app. Steps 1-3 from the module
/// resolution order; the OS app-data fallback (step 4) is INTENTIONALLY
/// omitted — if the user has never launched the GUI we'd be writing to a
/// fresh dir without their data, which corrupts the parent → subprocess
/// state contract.
///
/// # Errors
///
/// Returns a human-readable message when no candidate exists. Callers
/// (the MCP subprocess) print it to stderr and exit non-zero so Claude
/// Code shows the failure to the user.
pub fn resolve_data_dir_standalone() -> Result<PathBuf, String> {
    if let Ok(exe) = std::env::current_exe()
        && let Some(exe_dir) = exe.parent()
    {
        // Step 1 — portable bundle next to the exe.
        let portable = exe_dir.join(".userdata");
        if portable.is_dir() {
            return Ok(portable);
        }
        // Step 2 — walk up from exe looking for project .userdata.
        if let Some(found) = find_userdata_upwards(exe_dir) {
            return Ok(found);
        }
    }

    // Step 3 — baked CARGO_MANIFEST_DIR project root.
    if let Some(baked) = baked_project_userdata() {
        return Ok(baked);
    }

    Err(
        "No .userdata directory found. Launch DevPulse Desktop at least once \
         to initialize platform state before running --mcp-stdio."
            .into(),
    )
}

/// Resolve the data directory — single canonical order shared with
/// [`resolve_data_dir_standalone`]. See the module-level docs for the
/// resolution priorities and rationale.
///
/// The OS app-data dir (step 4) is used only when nothing in the
/// `DevPulse` workspace can be located — i.e., a properly-installed
/// customer build outside any source tree. In that case the directory
/// is `std::fs::create_dir_all`'d so first launch produces a clean
/// `.userdata` in a stable location.
///
/// # Errors
///
/// Returns a human-readable message on resolution failure.
pub fn resolve_data_dir<R: tauri::Runtime>(app: &impl Manager<R>) -> Result<PathBuf, String> {
    if let Ok(exe) = std::env::current_exe()
        && let Some(exe_dir) = exe.parent()
    {
        // Step 1 — portable bundle: `<exe_dir>/.userdata`.
        let portable = exe_dir.join(".userdata");
        if portable.is_dir() {
            return Ok(portable);
        }
        // Step 2 — walk up: any parent dir containing `.userdata`.
        if let Some(found) = find_userdata_upwards(exe_dir) {
            return Ok(found);
        }
    }

    // Step 3 — baked CARGO_MANIFEST_DIR project root.
    if let Some(baked) = baked_project_userdata() {
        return Ok(baked);
    }

    // Debug builds historically auto-created the project-root
    // `.userdata` even when missing. Preserve that ergonomic — if the
    // CARGO_MANIFEST_DIR path resolves but the dir is absent, create
    // it now so first-clone dev launches work without a manual
    // `mkdir`. Release builds skip this branch: a release exe outside
    // any DevPulse workspace falls through to the OS app-data dir.
    #[cfg(debug_assertions)]
    {
        let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        if let Some(root) = manifest
            .parent()
            .and_then(|p| p.parent())
            .and_then(|p| p.parent())
        {
            let dev_data = root.join(".userdata");
            std::fs::create_dir_all(&dev_data).map_err(|e| e.to_string())?;
            return Ok(dev_data);
        }
    }

    // Step 4 — OS app-data dir. Installed customer build, no DevPulse
    // workspace in sight.
    let os_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&os_dir).map_err(|e| e.to_string())?;
    Ok(os_dir)
}
