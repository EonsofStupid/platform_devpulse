//! Kokoros (TTS) user-scope config — default voice + default speed.
//!
//! Persists to `{data_dir}/user/voice_tts.toml`. Atomic write via
//! temp-file + rename so a crash mid-write never corrupts the file.
//! Load tolerates a missing or malformed file by returning defaults.

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Filename under `{data_dir}/user/`.
const FILE_NAME: &str = "voice_tts.toml";
/// Default voice id when nothing is persisted. Matches Kokoros's stock
/// English female voice — safe fallback if a user resets or first runs.
pub const DEFAULT_VOICE_ID: &str = "af_heart";
/// Default speech speed (1.0 = natural).
pub const DEFAULT_SPEED: f32 = 1.0;

/// Persisted user TTS preferences.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct VoiceTtsConfig {
    /// Persisted default voice id. Read back when the devtool mounts.
    pub default_voice: String,
    /// Persisted default speech speed. Clamped at write-time to [0.5, 2.0].
    pub default_speed: f32,
}

impl Default for VoiceTtsConfig {
    fn default() -> Self {
        Self {
            default_voice: DEFAULT_VOICE_ID.to_string(),
            default_speed: DEFAULT_SPEED,
        }
    }
}

impl VoiceTtsConfig {
    fn clamp(mut self) -> Self {
        if self.default_voice.trim().is_empty() {
            self.default_voice = DEFAULT_VOICE_ID.to_string();
        }
        if !self.default_speed.is_finite() {
            self.default_speed = DEFAULT_SPEED;
        }
        self.default_speed = self.default_speed.clamp(0.5, 2.0);
        self
    }
}

/// Resolve `{data_dir}/user/voice_tts.toml`.
fn resolve_path(data_dir: &Path) -> PathBuf {
    data_dir.join("user").join(FILE_NAME)
}

/// Load the persisted config, or `Default::default()` on any error.
///
/// Never propagates parse/IO errors — the TTS devtool should degrade
/// to defaults rather than refuse to render.
#[must_use]
pub fn load(data_dir: &Path) -> VoiceTtsConfig {
    let path = resolve_path(data_dir);
    let Ok(raw) = super::load_config(&path) else {
        return VoiceTtsConfig::default();
    };
    match toml::from_str::<VoiceTtsConfig>(&raw) {
        Ok(cfg) => cfg.clamp(),
        Err(err) => {
            tracing::warn!(
                path = %path.display(),
                error = %err,
                "voice_tts config parse failed — using defaults"
            );
            VoiceTtsConfig::default()
        }
    }
}

/// Save the config atomically.
///
/// Writes to a unique sibling temporary file, syncs, then atomically replaces
/// the target. Parent directory is created as needed.
///
/// # Errors
/// - Creating the parent directory fails.
/// - Temp-file write or rename fails.
/// - Serialization or file synchronization fails.
pub fn save(data_dir: &Path, cfg: &VoiceTtsConfig) -> Result<VoiceTtsConfig> {
    let clamped = cfg.clone().clamp();
    let path = resolve_path(data_dir);
    super::save_config(&path, &clamped)?;
    Ok(clamped)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_applied_when_file_missing() -> anyhow::Result<()> {
        let tmp = tempfile::tempdir()?;
        let cfg = load(tmp.path());
        assert_eq!(cfg.default_voice, DEFAULT_VOICE_ID);
        assert!((cfg.default_speed - DEFAULT_SPEED).abs() < f32::EPSILON);
        Ok(())
    }

    #[test]
    fn roundtrip_clamps_speed() -> anyhow::Result<()> {
        let tmp = tempfile::tempdir()?;
        let saved = save(
            tmp.path(),
            &VoiceTtsConfig {
                default_voice: "af_bella".into(),
                default_speed: 5.0,
            },
        )?;
        assert!((saved.default_speed - 2.0).abs() < f32::EPSILON);
        let loaded = load(tmp.path());
        assert_eq!(loaded.default_voice, "af_bella");
        assert!((loaded.default_speed - 2.0).abs() < f32::EPSILON);
        Ok(())
    }

    #[test]
    fn empty_voice_falls_back_to_default() -> anyhow::Result<()> {
        let tmp = tempfile::tempdir()?;
        let saved = save(
            tmp.path(),
            &VoiceTtsConfig {
                default_voice: "   ".into(),
                default_speed: 1.2,
            },
        )?;
        assert_eq!(saved.default_voice, DEFAULT_VOICE_ID);
        Ok(())
    }
}
