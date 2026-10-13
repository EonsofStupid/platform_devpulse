//! The UI copy catalog — a thin wrapper over the engine's catalog
//! (`devpulse_engine::platform::copy`).
//!
//! Needs no Platform: the catalog is bundled TOML plus your optional
//! `.userdata/config/copy.toml`, so views can read it while services boot.

use devpulse_engine::platform::copy::{self, LoadedCopy};

/// The copy catalog, and why your `copy.toml` was not used (if it wasn't).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn get_copy(app: tauri::AppHandle) -> Result<LoadedCopy, String> {
    let data_dir = crate::paths::resolve_data_dir(&app)?;
    copy::load(&data_dir).map_err(|e| format!("{e:#}"))
}
