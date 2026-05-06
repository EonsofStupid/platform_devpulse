//! Surreal — user-scope editable overlay (embedded path).
//!
//! Persists to `{data_dir}/user/surreal.toml`. Atomic write via
//! temp-file + rename so a crash mid-save never corrupts the file.
//! Load tolerates a missing or malformed file by returning defaults.
//!
//! # Why this still exists after the embedded cutover
//!
//! The prior sidecar surface exposed many overrides — port, binary,
//! root user/password, log level, max bumps. None of those apply
//! now: the embedded path holds the file lock directly, has no
//! port, and authenticates by virtue of being in-process.
//!
//! This shell is retained because:
//!
//! - The Tauri command surface (`surreal_config_load` /
//!   `surreal_config_save`) was wired through specta into the
//!   frontend devtool. Removing the struct in one shot would
//!   ripple into the bindings and the devtool draft state.
//! - Future tuning knobs (cache size, compaction policy, snapshot
//!   retention) belong here so the same load/save plumbing covers
//!   them when they land.
//!
//! For now, the struct is intentionally empty. Loads / saves
//! round-trip an empty TOML file and the devtool renders a static
//! "no user-tunable settings yet" panel.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::io::Write as _;
use std::path::{Path, PathBuf};

/// Filename under `{data_dir}/user/`.
const FILE_NAME: &str = "surreal.toml";

/// Persisted user overrides for the Surreal embedded store.
///
/// Reserved for future tuning knobs (cache size, compaction policy,
/// snapshot retention). Empty today — the embedded path has no
/// port / binary / auth fields a user would override.
#[derive(Debug, Clone, Default, Serialize, Deserialize, Type)]
pub struct SurrealUserConfig {}

/// Resolved file path: `{data_dir}/user/surreal.toml`.
fn resolve_path(data_dir: &Path) -> PathBuf {
    data_dir.join("user").join(FILE_NAME)
}

/// Load the persisted overrides, or `Default::default()` on any error.
///
/// Never propagates parse/IO errors — the devtool must always render,
/// even when the overlay file is missing or corrupt.
#[must_use]
pub fn load(data_dir: &Path) -> SurrealUserConfig {
    let path = resolve_path(data_dir);
    let Ok(raw) = fs::read_to_string(&path) else {
        return SurrealUserConfig::default();
    };
    match toml::from_str::<SurrealUserConfig>(&raw) {
        Ok(cfg) => cfg,
        Err(err) => {
            tracing::warn!(
                path = %path.display(),
                error = %err,
                "surreal user config parse failed — using defaults"
            );
            SurrealUserConfig::default()
        }
    }
}

/// Save the overrides atomically.
///
/// Writes to `surreal.toml.tmp` next to the target, fsyncs, then
/// renames. Parent dir is created as needed.
///
/// # Errors
/// - Creating the parent directory fails.
/// - Temp-file write or rename fails.
/// - Serialization fails (should be impossible for this shape).
pub fn save(
    data_dir: &Path,
    cfg: &SurrealUserConfig,
) -> Result<SurrealUserConfig> {
    let path = resolve_path(data_dir);
    let parent = path.parent().with_context(|| {
        format!("surreal path has no parent: {}", path.display())
    })?;
    fs::create_dir_all(parent)
        .with_context(|| format!("create parent {}", parent.display()))?;

    let serialized =
        toml::to_string_pretty(cfg).context("serialize surreal config")?;
    let mut tmp = path.clone();
    let mut ext = tmp
        .extension()
        .and_then(|s| s.to_str())
        .map(str::to_owned)
        .unwrap_or_default();
    ext.push_str(".tmp");
    tmp.set_extension(ext);

    {
        let mut f = fs::File::create(&tmp)
            .with_context(|| format!("open tmp {}", tmp.display()))?;
        f.write_all(serialized.as_bytes())
            .with_context(|| format!("write tmp {}", tmp.display()))?;
        f.sync_all().ok();
    }

    fs::rename(&tmp, &path)
        .with_context(|| format!("rename {} -> {}", tmp.display(), path.display()))?;

    tracing::info!(path = %path.display(), "Surreal user-config saved");
    Ok(cfg.clone())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_when_file_missing() {
        let tmp = tempfile::tempdir().unwrap();
        let _cfg = load(tmp.path());
        // No fields to assert today — coverage is just "doesn't panic".
    }

    #[test]
    fn save_creates_user_dir_and_file() {
        let tmp = tempfile::tempdir().unwrap();
        save(tmp.path(), &SurrealUserConfig::default()).unwrap();
        let path = resolve_path(tmp.path());
        assert!(path.exists());
    }
}
