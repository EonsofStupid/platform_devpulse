//! User-scoped secrets store — currently carries the `HuggingFace` access
//! token used by the download manager and HF search. Kept in a tiny
//! TOML file alongside the model registry so downloads pick it up
//! without touching the keychain.
//!
//! File layout:
//! ```toml
//! # {models_dir}/../secrets.toml
//! hf_token = "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
//! ```
//!
//! The file is created with user-only read/write permissions on Unix
//! (`0o600`). On Windows the default ACL inherits from the parent
//! `userdata/` directory, which is already user-scoped.
//!
//! This module never logs the token and never returns it from methods
//! that serialize. The only way to read the token is via
//! [`Secrets::hf_token`], which returns a borrow so callers can pass it
//! straight into `ApiBuilder::with_token` without making extra copies.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

const SECRETS_FILENAME: &str = "secrets.toml";

/// In-memory secrets cache backed by a TOML file on disk.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Secrets {
    /// Optional `HuggingFace` access token. `None` = anonymous requests.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hf_token: Option<String>,
}

impl Secrets {
    /// Compute the secrets file path given the models directory.
    ///
    /// Stored one level up from `models_dir` so rotating the registry
    /// doesn't accidentally wipe credentials.
    pub fn path_for(models_dir: &Path) -> PathBuf {
        models_dir
            .parent()
            .map_or_else(|| models_dir.to_path_buf(), Path::to_path_buf)
            .join(SECRETS_FILENAME)
    }

    /// Load secrets from disk. Missing file returns an empty store
    /// instead of an error — first boot is valid state.
    ///
    /// # Errors
    ///
    /// Returns an error if the secrets file exists but cannot be read
    /// (permission denied, IO failure) or if the TOML body fails to
    /// parse (malformed file, schema mismatch).
    pub fn load(models_dir: &Path) -> anyhow::Result<Self> {
        let path = Self::path_for(models_dir);
        if !path.exists() {
            return Ok(Self::default());
        }
        let raw = std::fs::read_to_string(&path)
            .map_err(|e| anyhow::anyhow!("Failed to read secrets file {}: {e}", path.display()))?;
        let secrets: Self = toml::from_str(&raw)
            .map_err(|e| anyhow::anyhow!("Failed to parse secrets file {}: {e}", path.display()))?;
        Ok(secrets)
    }

    /// Persist the current secrets to disk, tightening file permissions
    /// on Unix so other users on the host cannot read the token.
    ///
    /// # Errors
    ///
    /// Returns an error if the parent directory cannot be created, if
    /// TOML serialization fails, if writing the file fails (disk full,
    /// permission denied), or — on Unix — if reading or applying the
    /// `0o600` permission mode fails.
    pub fn save(&self, models_dir: &Path) -> anyhow::Result<()> {
        let path = Self::path_for(models_dir);
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let toml_str = toml::to_string_pretty(self)
            .map_err(|e| anyhow::anyhow!("Failed to serialize secrets: {e}"))?;
        std::fs::write(&path, toml_str)
            .map_err(|e| anyhow::anyhow!("Failed to write secrets file {}: {e}", path.display()))?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = std::fs::metadata(&path)?.permissions();
            perms.set_mode(0o600);
            std::fs::set_permissions(&path, perms)?;
        }

        Ok(())
    }

    /// Replace the HF token. `None` clears the token.
    pub fn set_hf_token(&mut self, token: Option<String>) {
        self.hf_token = token.and_then(|t| {
            let trimmed = t.trim().to_string();
            if trimmed.is_empty() {
                None
            } else {
                Some(trimmed)
            }
        });
    }

    /// Borrow the current HF token.
    #[must_use]
    pub fn hf_token(&self) -> Option<&str> {
        self.hf_token.as_deref()
    }

    /// Whether a token is currently stored.
    #[must_use]
    pub fn has_hf_token(&self) -> bool {
        self.hf_token.is_some()
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)] // tests panic on assertion failure by design
mod tests {
    use super::*;

    #[test]
    fn secrets_round_trip() {
        let tmp =
            std::env::temp_dir().join(format!("devpulse-secrets-test-{}", std::process::id()));
        let models_dir = tmp.join("models");
        std::fs::create_dir_all(&models_dir).unwrap();

        let mut s = Secrets::default();
        assert!(!s.has_hf_token());
        s.set_hf_token(Some("hf_test_token_value".into()));
        s.save(&models_dir).unwrap();

        let loaded = Secrets::load(&models_dir).unwrap();
        assert_eq!(loaded.hf_token(), Some("hf_test_token_value"));

        let mut cleared = loaded.clone();
        cleared.set_hf_token(None);
        cleared.save(&models_dir).unwrap();
        let reloaded = Secrets::load(&models_dir).unwrap();
        assert!(!reloaded.has_hf_token());

        let _ = std::fs::remove_dir_all(&tmp);
    }

    #[test]
    fn whitespace_token_clears() {
        let mut s = Secrets::default();
        s.set_hf_token(Some("   ".into()));
        assert!(!s.has_hf_token());
    }
}
