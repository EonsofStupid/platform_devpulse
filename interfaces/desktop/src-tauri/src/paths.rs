//! Portable data directory resolution — shared by logging, boot, and IPC helpers.

use std::path::PathBuf;
use tauri::Manager;

/// Resolve the data directory — portable-first (matches `lib.rs` setup).
///
/// Dev: `.userdata/` at project root (`CARGO_MANIFEST_DIR` → up 3 levels).
/// Release: `.userdata/` next to binary, or OS app data dir.
///
/// # Errors
/// Returns a human-readable message on resolution failure.
pub fn resolve_data_dir<R: tauri::Runtime>(app: &impl Manager<R>) -> Result<PathBuf, String> {
	if cfg!(debug_assertions) {
		let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
		let project_root = manifest
			.parent()
			.and_then(|p| p.parent())
			.and_then(|p| p.parent())
			.ok_or_else(|| "Failed to resolve project root from CARGO_MANIFEST_DIR".to_string())?;
		let dev_data = project_root.join(".userdata");
		std::fs::create_dir_all(&dev_data).map_err(|e| e.to_string())?;
		Ok(dev_data)
	} else {
		let exe_dir = std::env::current_exe()
			.map_err(|e| e.to_string())?
			.parent()
			.ok_or_else(|| "Executable has no parent directory".to_string())?
			.to_path_buf();
		let portable_dir = exe_dir.join(".userdata");
		if portable_dir.exists() {
			Ok(portable_dir)
		} else {
			let os_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
			std::fs::create_dir_all(&os_dir).map_err(|e| e.to_string())?;
			Ok(os_dir)
		}
	}
}
