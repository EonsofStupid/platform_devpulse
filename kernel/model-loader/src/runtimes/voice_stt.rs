//! Whisper (STT) user-scope config — language hint + beam size + VAD threshold.
//!
//! Persists to `{data_dir}/user/voice_stt.toml`. Atomic write via
//! temp-file + rename. Load tolerates missing/malformed files by
//! returning defaults so the devtool always renders.

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

const FILE_NAME: &str = "voice_stt.toml";
/// Default language hint — empty = auto-detect.
pub const DEFAULT_LANGUAGE: &str = "";
/// Default beam size for decoding. 1 = greedy (fast), 5 = quality default.
pub const DEFAULT_BEAM_SIZE: u32 = 1;
/// Default voice-activity-detection energy threshold. 0.0..1.0.
pub const DEFAULT_VAD_THRESHOLD: f32 = 0.5;
/// Beam width a `high_quality` voice profile asks for at least.
const HIGH_QUALITY_BEAM_SIZE: u32 = 5;
/// Widest beam, and what a `best` voice profile asks for.
const MAX_BEAM_SIZE: u32 = 10;

/// Persisted user STT preferences.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct VoiceSttConfig {
    /// ISO-639-1 language hint (e.g. `"en"`). Empty string = auto-detect.
    pub language: String,
    /// Beam-search width. Clamped to `[1, 10]` on write.
    pub beam_size: u32,
    /// VAD energy threshold in `[0.0, 1.0]`. Clamped on write.
    pub vad_threshold: f32,
}

impl Default for VoiceSttConfig {
    fn default() -> Self {
        Self {
            language: DEFAULT_LANGUAGE.to_string(),
            beam_size: DEFAULT_BEAM_SIZE,
            vad_threshold: DEFAULT_VAD_THRESHOLD,
        }
    }
}

impl VoiceSttConfig {
    fn clamp(mut self) -> Self {
        if self.beam_size == 0 {
            self.beam_size = DEFAULT_BEAM_SIZE;
        }
        self.beam_size = self.beam_size.min(MAX_BEAM_SIZE);
        if !self.vad_threshold.is_finite() {
            self.vad_threshold = DEFAULT_VAD_THRESHOLD;
        }
        self.vad_threshold = self.vad_threshold.clamp(0.0, 1.0);
        // Normalize language to trimmed-lowercase; empty means auto-detect.
        self.language = self.language.trim().to_ascii_lowercase();
        self
    }

    /// The language to ask for; `None` means auto-detect.
    #[must_use]
    pub fn language_hint(&self) -> Option<&str> {
        Some(self.language.as_str()).filter(|language| !language.is_empty())
    }

    /// The beam width a voice profile's STT quality asks for. A profile only
    /// ever widens the saved setting. `standard` and anything unknown keep it.
    #[must_use]
    pub fn beam_size_for_quality(&self, quality: &str) -> u32 {
        match quality {
            "high_quality" => self.beam_size.max(HIGH_QUALITY_BEAM_SIZE),
            "best" => MAX_BEAM_SIZE,
            _ => self.beam_size,
        }
    }
}

fn resolve_path(data_dir: &Path) -> PathBuf {
    data_dir.join("user").join(FILE_NAME)
}

/// Load the persisted config, or defaults on any error.
#[must_use]
pub fn load(data_dir: &Path) -> VoiceSttConfig {
    let path = resolve_path(data_dir);
    let Ok(raw) = super::load_config(&path) else {
        return VoiceSttConfig::default();
    };
    match toml::from_str::<VoiceSttConfig>(&raw) {
        Ok(cfg) => cfg.clamp(),
        Err(err) => {
            tracing::warn!(
                path = %path.display(),
                error = %err,
                "voice_stt config parse failed — using defaults"
            );
            VoiceSttConfig::default()
        }
    }
}

/// Atomically persist the config. Returns the clamped value written.
///
/// # Errors
/// - Creating the `user/` directory fails.
/// - Serialization, temporary-file write, synchronization or replacement fails.
pub fn save(data_dir: &Path, cfg: &VoiceSttConfig) -> Result<VoiceSttConfig> {
    let clamped = cfg.clone().clamp();
    let path = resolve_path(data_dir);
    super::save_config(&path, &clamped)?;
    Ok(clamped)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_when_missing() -> anyhow::Result<()> {
        let tmp = tempfile::tempdir()?;
        let cfg = load(tmp.path());
        assert_eq!(cfg.beam_size, DEFAULT_BEAM_SIZE);
        assert!((cfg.vad_threshold - DEFAULT_VAD_THRESHOLD).abs() < f32::EPSILON);
        Ok(())
    }

    #[test]
    fn clamps_beam_and_threshold() -> anyhow::Result<()> {
        let tmp = tempfile::tempdir()?;
        let saved = save(
            tmp.path(),
            &VoiceSttConfig {
                language: "EN".into(),
                beam_size: 999,
                vad_threshold: 2.0,
            },
        )?;
        assert_eq!(saved.beam_size, 10);
        assert!((saved.vad_threshold - 1.0).abs() < f32::EPSILON);
        assert_eq!(saved.language, "en");
        Ok(())
    }

    #[test]
    fn empty_language_means_auto_detect() {
        let mut cfg = VoiceSttConfig::default();
        assert_eq!(cfg.language_hint(), None);
        cfg.language = "fr".into();
        assert_eq!(cfg.language_hint(), Some("fr"));
    }

    #[test]
    fn a_profile_quality_only_widens_the_saved_beam() {
        let mut cfg = VoiceSttConfig::default();
        assert_eq!(cfg.beam_size_for_quality("standard"), DEFAULT_BEAM_SIZE);
        assert_eq!(cfg.beam_size_for_quality("high_quality"), 5);
        assert_eq!(cfg.beam_size_for_quality("best"), 10);
        cfg.beam_size = 7;
        assert_eq!(cfg.beam_size_for_quality("high_quality"), 7);
        assert_eq!(cfg.beam_size_for_quality("unknown"), 7);
    }
}
