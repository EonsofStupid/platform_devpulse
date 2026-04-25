//! Surreal — user-scope editable overlay.
//!
//! Persists to `{data_dir}/user/surreal.toml`. Atomic write via
//! temp-file + rename so a crash mid-save never corrupts the file.
//! Load tolerates a missing or malformed file by returning defaults.
//!
//! # Semantics
//!
//! Every field is an [`Option`] — unset = "inherit from
//! `platform.default.toml`". Setting a field overlays it onto the
//! baseline [`SurrealConfig`] at boot time. This is a proper override
//! layer, not a duplicate of the platform config.
//!
//! # What can be overridden
//!
//! - `port` — the configured port the allocator probes first. When the
//!   user bumps this up because 8822 is permanently taken on their
//!   machine, save here so the next boot starts at the new value.
//! - `binary_path` — when they install SurrealDB to a non-standard
//!   location.
//! - `root_user` / `root_password` — if they want to lock down the
//!   root login to custom creds.
//! - `log_level` — `error` / `warn` / `info` / `debug`.
//! - `max_bumps` — if 20 isn't enough on a busy dev machine.
//!
//! # Apply point
//!
//! `Platform::boot()` calls [`apply_overlay`] BEFORE building the
//! `SurrealConfig` that [`SurrealService::boot`] consumes.
//! "Restart app to apply" = no hot reload.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::io::Write as _;
use std::path::{Path, PathBuf};

/// Filename under `{data_dir}/user/`.
const FILE_NAME: &str = "surreal.toml";

/// Persisted user overrides for the Surreal service.
///
/// All fields `Option<T>`: `None` means "inherit from platform TOML".
#[derive(Debug, Clone, Default, Serialize, Deserialize, Type)]
pub struct SurrealUserConfig {
    /// Overrides `[services.network.graph_api].port`.
    pub port: Option<u16>,
    /// Overrides `[services.system.surreal].binary_path`.
    /// Empty string is treated as `None`.
    pub binary_path: Option<String>,
    /// Overrides `[services.system.surreal].root_user`.
    pub root_user: Option<String>,
    /// Overrides `[services.system.surreal].root_password`.
    pub root_password: Option<String>,
    /// Overrides `[services.system.surreal].log_level`.
    pub log_level: Option<String>,
    /// Overrides the allocator's `max_bumps` ceiling.
    pub max_bumps: Option<u16>,
}

impl SurrealUserConfig {
    /// Normalize edge cases before serializing:
    /// - Empty `binary_path` / `log_level` / `root_user` → `None`.
    /// - Out-of-range `port` (`< 1024`) → `None`, so the base default wins.
    /// - Ridiculous `max_bumps` (`> 1000`) → `None`.
    fn clamp(mut self) -> Self {
        if let Some(ref s) = self.binary_path {
            if s.trim().is_empty() {
                self.binary_path = None;
            }
        }
        if let Some(ref s) = self.log_level {
            if s.trim().is_empty() {
                self.log_level = None;
            }
        }
        if let Some(ref s) = self.root_user {
            if s.trim().is_empty() {
                self.root_user = None;
            }
        }
        if let Some(p) = self.port {
            if p < 1024 {
                self.port = None;
            }
        }
        if let Some(n) = self.max_bumps {
            if n > 1000 {
                self.max_bumps = None;
            }
        }
        self
    }
}

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
        Ok(cfg) => cfg.clamp(),
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
    let clamped = cfg.clone().clamp();
    let path = resolve_path(data_dir);
    let parent = path.parent().with_context(|| {
        format!("surreal path has no parent: {}", path.display())
    })?;
    fs::create_dir_all(parent)
        .with_context(|| format!("create parent {}", parent.display()))?;

    let serialized =
        toml::to_string_pretty(&clamped).context("serialize surreal config")?;
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
    Ok(clamped)
}

/// Resolved Surreal parameters after overlaying the user config onto
/// the platform defaults.
///
/// Returned fields are the final values that flow into
/// `SurrealLifecycle::boot` via the kernel `SurrealConfig`.
#[derive(Debug, Clone)]
pub struct ResolvedSurrealParams {
    /// Port the child will bind at startup.
    pub port: u16,
    /// Explicit binary path, or `None` to fall back to PATH resolution.
    pub binary_path: Option<PathBuf>,
    /// Root user passed to `surreal start --user`.
    pub root_user: String,
    /// Root password passed to `surreal start --pass`.
    pub root_password: String,
    /// `--log <level>` flag (`error` / `warn` / `info` / `debug`).
    pub log_level: String,
    /// Maximum `+1` bumps. `None` = allocator default.
    pub max_bumps: Option<u16>,
}

/// Overlay the user config onto a baseline resolved from
/// `platform.default.toml`.
///
/// Called by the graph boot stage before spawning the child.
#[must_use]
pub fn apply_overlay(
    base_port: u16,
    base_binary: Option<PathBuf>,
    base_root_user: &str,
    base_root_password: &str,
    base_log_level: &str,
    base_max_bumps: Option<u16>,
    user: &SurrealUserConfig,
) -> ResolvedSurrealParams {
    ResolvedSurrealParams {
        port: user.port.unwrap_or(base_port),
        binary_path: user
            .binary_path
            .as_ref()
            .map(PathBuf::from)
            .or(base_binary),
        root_user: user
            .root_user
            .clone()
            .unwrap_or_else(|| base_root_user.to_string()),
        root_password: user
            .root_password
            .clone()
            .unwrap_or_else(|| base_root_password.to_string()),
        log_level: user
            .log_level
            .clone()
            .unwrap_or_else(|| base_log_level.to_string()),
        max_bumps: user.max_bumps.or(base_max_bumps),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_when_file_missing() {
        let tmp = tempfile::tempdir().unwrap();
        let cfg = load(tmp.path());
        assert!(cfg.port.is_none());
        assert!(cfg.binary_path.is_none());
    }

    #[test]
    fn roundtrip_preserves_port_override() {
        let tmp = tempfile::tempdir().unwrap();
        let saved = save(
            tmp.path(),
            &SurrealUserConfig {
                port: Some(8830),
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(saved.port, Some(8830));
        let loaded = load(tmp.path());
        assert_eq!(loaded.port, Some(8830));
    }

    #[test]
    fn empty_string_fields_are_cleared() {
        let tmp = tempfile::tempdir().unwrap();
        let saved = save(
            tmp.path(),
            &SurrealUserConfig {
                binary_path: Some(String::new()),
                log_level: Some("   ".into()),
                ..Default::default()
            },
        )
        .unwrap();
        assert!(saved.binary_path.is_none());
        assert!(saved.log_level.is_none());
    }

    #[test]
    fn low_port_is_rejected() {
        let tmp = tempfile::tempdir().unwrap();
        let saved = save(
            tmp.path(),
            &SurrealUserConfig {
                port: Some(80),
                ..Default::default()
            },
        )
        .unwrap();
        assert!(saved.port.is_none());
    }

    #[test]
    fn overlay_prefers_user_value() {
        let overlay = SurrealUserConfig {
            port: Some(9000),
            ..Default::default()
        };
        let resolved = apply_overlay(8822, None, "root", "root", "warn", None, &overlay);
        assert_eq!(resolved.port, 9000);
        assert_eq!(resolved.root_user, "root");
    }

    #[test]
    fn overlay_falls_back_to_base() {
        let overlay = SurrealUserConfig::default();
        let resolved = apply_overlay(
            8822,
            Some(PathBuf::from("/opt/surreal")),
            "root",
            "root",
            "warn",
            Some(10),
            &overlay,
        );
        assert_eq!(resolved.port, 8822);
        assert_eq!(resolved.binary_path, Some(PathBuf::from("/opt/surreal")));
        assert_eq!(resolved.max_bumps, Some(10));
    }
}
