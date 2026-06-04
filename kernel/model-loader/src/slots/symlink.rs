//! Slot symlink layer — the filesystem IS the slot→model contract.
//!
//! **Why it exists** ([[engine-per-model-assignment]]): customer hits Save
//! on a slot in the wizard; that action MUST land as a real filesystem
//! object — a symlink at `{userdata_dir}/slots/{slot_id}/model.<ext>`
//! pointing to the registry's resolved path. Chat / STS / vision callers
//! probe the symlink path directly; if it exists, the slot is armed and
//! the engine matching the file format opens it on demand. No config
//! indirection, no `slot→model_id` lookup table, no "engine knows which
//! slot it is" coupling.
//!
//! **Why not just a config string** (which is what the broken chain
//! used for a month — [[apply-save-chain-broken]]): a config row is
//! invisible to anything that doesn't poll the loader. A symlink is
//! discoverable by `ls`, by `glob`, by `Path::exists`, by the operating
//! system itself. The save action becomes a structural commitment, not
//! a metadata note.
//!
//! **Windows note**: `std::os::windows::fs::symlink_file` / `symlink_dir`
//! requires either Administrator OR Developer Mode enabled on Win10+.
//! We surface the EACCES path with a layman pointer at Developer Mode
//! rather than silently degrading to copy/hardlink. Hardlink would only
//! work when userdata + models live on the same volume — a constraint
//! that's frequently false (models on D:, userdata on C:) — so reaching
//! for it as a "fallback" creates inconsistency, not robustness.

use crate::models::registry::ModelFormat;
use crate::traits::errors::LoaderError;
use std::path::{Path, PathBuf};

/// Slot directory: `{userdata_dir}/slots/{slot_id}/`.
#[must_use]
pub fn slot_dir(userdata_dir: &Path, slot_id: &str) -> PathBuf {
    userdata_dir.join("slots").join(slot_id)
}

/// Symlink path for a given slot + format:
/// `{userdata_dir}/slots/{slot_id}/model.<ext>` (or `.../model` for
/// directory-shaped formats like `SherpaDir`).
#[must_use]
pub fn symlink_path(userdata_dir: &Path, slot_id: &str, format: ModelFormat) -> PathBuf {
    let dir = slot_dir(userdata_dir, slot_id);
    match format_extension(format) {
        Some(ext) => dir.join(format!("model.{ext}")),
        None => dir.join("model"),
    }
}

/// File extension for each format (`None` for directory-shaped formats
/// where the symlink target is a directory and the link itself carries
/// no extension).
#[must_use]
pub const fn format_extension(format: ModelFormat) -> Option<&'static str> {
    match format {
        ModelFormat::Gguf => Some("gguf"),
        ModelFormat::SafeTensors => Some("safetensors"),
        ModelFormat::Onnx => Some("onnx"),
        ModelFormat::SherpaDir => None,
    }
}

/// Whether a given format is a directory (vs a single file). Drives
/// `symlink_dir` vs `symlink_file` selection on Windows; harmless
/// elsewhere because `std::os::unix::fs::symlink` handles both.
#[must_use]
pub const fn is_directory_format(format: ModelFormat) -> bool {
    matches!(format, ModelFormat::SherpaDir)
}

/// Create or replace the symlink for a slot.
///
/// Idempotent: if a symlink already exists at the target path it is
/// removed first, then re-created pointing at `target`. The slot
/// directory is created if missing.
///
/// # Errors
///
/// Returns [`LoaderError::Io`] if:
/// - The slot directory cannot be created.
/// - A stale symlink at the target path cannot be removed.
/// - Symlink creation fails. On Windows this is most commonly
///   `Access is denied` (1314 / `ERROR_PRIVILEGE_NOT_HELD`) when
///   Developer Mode is off — the reason string surfaces a layman hint.
pub fn assign(
    userdata_dir: &Path,
    slot_id: &str,
    format: ModelFormat,
    target: &Path,
) -> Result<PathBuf, LoaderError> {
    let dir = slot_dir(userdata_dir, slot_id);
    std::fs::create_dir_all(&dir).map_err(|e| LoaderError::Io {
        path: dir.clone(),
        reason: format!("create slot dir: {e}"),
    })?;

    let link = symlink_path(userdata_dir, slot_id, format);

    // Remove any existing link/file/dir at the target so the create
    // call is unconditional.
    remove_existing(&link)?;

    create_symlink(target, &link, is_directory_format(format))?;

    Ok(link)
}

/// Remove the slot's symlink (and the slot directory if it becomes
/// empty afterwards). Best-effort: missing path is treated as success
/// so the caller can blindly invoke this on unassign without first
/// checking whether a symlink was ever created.
///
/// # Errors
///
/// Returns [`LoaderError::Io`] only when an existing symlink or
/// directory entry can't be removed despite being present (permission
/// denial mid-flight, file in use).
pub fn unassign(userdata_dir: &Path, slot_id: &str) -> Result<(), LoaderError> {
    let dir = slot_dir(userdata_dir, slot_id);
    if !dir.exists() {
        return Ok(());
    }

    // Sweep every `model.*` entry in the slot dir.
    let entries = std::fs::read_dir(&dir).map_err(|e| LoaderError::Io {
        path: dir.clone(),
        reason: format!("read slot dir: {e}"),
    })?;
    for entry in entries.flatten() {
        let path = entry.path();
        let name_matches = path
            .file_name()
            .and_then(|n| n.to_str())
            .is_some_and(|n| n == "model" || n.starts_with("model."));
        if name_matches {
            remove_existing(&path)?;
        }
    }

    // If the slot dir is now empty, remove it as well to keep the tree
    // honest (an empty slot dir would falsely imply "slot exists" to a
    // listing walker).
    if dir
        .read_dir()
        .map(|mut it| it.next().is_none())
        .unwrap_or(false)
    {
        std::fs::remove_dir(&dir).map_err(|e| LoaderError::Io {
            path: dir.clone(),
            reason: format!("remove empty slot dir: {e}"),
        })?;
    }

    Ok(())
}

/// Resolve the symlink for a slot to its current target, if any. Returns
/// `None` when the slot dir is missing OR contains no `model.*` entry.
/// The returned path is the symlink path itself (`{userdata_dir}/slots/
/// {slot_id}/model.<ext>`) — backends open that and the OS dereferences
/// transparently.
///
/// Callers needing the underlying real path (e.g. to compare against a
/// registry entry) should `std::fs::canonicalize` the return value.
#[must_use]
pub fn resolve(userdata_dir: &Path, slot_id: &str) -> Option<PathBuf> {
    let dir = slot_dir(userdata_dir, slot_id);
    let entries = std::fs::read_dir(&dir).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        let name = path.file_name().and_then(|n| n.to_str())?;
        if name == "model" || name.starts_with("model.") {
            return Some(path);
        }
    }
    None
}

// ── internals ──────────────────────────────────────────────────────

fn remove_existing(path: &Path) -> Result<(), LoaderError> {
    // `symlink_metadata` does NOT follow the symlink — so a broken
    // link is still detectable and removable here. `metadata` would
    // return `NotFound` for a broken link and we'd skip removal.
    match std::fs::symlink_metadata(path) {
        Ok(meta) => {
            let res = if meta.file_type().is_dir() {
                std::fs::remove_dir(path)
            } else {
                std::fs::remove_file(path)
            };
            res.map_err(|e| LoaderError::Io {
                path: path.to_path_buf(),
                reason: format!("remove stale entry: {e}"),
            })
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(LoaderError::Io {
            path: path.to_path_buf(),
            reason: format!("stat stale entry: {e}"),
        }),
    }
}

#[cfg(windows)]
fn create_symlink(target: &Path, link: &Path, is_dir: bool) -> Result<(), LoaderError> {
    use std::os::windows::fs::{symlink_dir, symlink_file};
    let result = if is_dir {
        symlink_dir(target, link)
    } else {
        symlink_file(target, link)
    };
    result.map_err(|e| {
        let reason = if e.raw_os_error() == Some(1314) {
            // ERROR_PRIVILEGE_NOT_HELD — the standard Win10+ failure
            // when Developer Mode is off and the process is not elevated.
            format!(
                "symlink create denied (ERROR_PRIVILEGE_NOT_HELD): enable Windows \
                 Developer Mode (Settings → Privacy & security → For developers → \
                 Developer Mode = On), then hit Save again. Symlinking from {link} \
                 → {target}",
                link = link.display(),
                target = target.display(),
            )
        } else {
            format!("symlink create: {e}")
        };
        LoaderError::Io {
            path: link.to_path_buf(),
            reason,
        }
    })
}

#[cfg(unix)]
fn create_symlink(target: &Path, link: &Path, _is_dir: bool) -> Result<(), LoaderError> {
    std::os::unix::fs::symlink(target, link).map_err(|e| LoaderError::Io {
        path: link.to_path_buf(),
        reason: format!("symlink create: {e}"),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn extension_mapping_is_stable() {
        assert_eq!(format_extension(ModelFormat::Gguf), Some("gguf"));
        assert_eq!(
            format_extension(ModelFormat::SafeTensors),
            Some("safetensors")
        );
        assert_eq!(format_extension(ModelFormat::Onnx), Some("onnx"));
        assert_eq!(format_extension(ModelFormat::SherpaDir), None);
    }

    #[test]
    fn symlink_path_layout() {
        let ud = Path::new("/u");
        assert_eq!(
            symlink_path(ud, "chat.brain", ModelFormat::Gguf),
            PathBuf::from("/u/slots/chat.brain/model.gguf")
        );
        assert_eq!(
            symlink_path(ud, "vision.embedder", ModelFormat::SafeTensors),
            PathBuf::from("/u/slots/vision.embedder/model.safetensors")
        );
        assert_eq!(
            symlink_path(ud, "stt.whisper", ModelFormat::SherpaDir),
            PathBuf::from("/u/slots/stt.whisper/model")
        );
    }

    #[test]
    fn assign_creates_symlink_when_target_exists() {
        let userdata = tempdir().unwrap();
        let model_root = tempdir().unwrap();
        let target = model_root.path().join("nemotron.gguf");
        fs::write(&target, b"fake gguf bytes").unwrap();

        // On Windows this test only passes when Developer Mode is on or
        // the process is elevated — same constraint the runtime hits.
        let result = assign(userdata.path(), "chat.brain", ModelFormat::Gguf, &target);
        if let Err(LoaderError::Io { reason, .. }) = &result {
            if reason.contains("ERROR_PRIVILEGE_NOT_HELD") {
                eprintln!("skipping: needs Developer Mode on Windows");
                return;
            }
        }
        let link = result.unwrap();
        assert!(link.exists(), "link should be visible to Path::exists");
        let canonical = fs::canonicalize(&link).unwrap();
        let target_canonical = fs::canonicalize(&target).unwrap();
        assert_eq!(canonical, target_canonical);
    }

    #[test]
    fn unassign_no_op_on_missing_dir() {
        let userdata = tempdir().unwrap();
        assert!(unassign(userdata.path(), "chat.brain").is_ok());
    }
}
