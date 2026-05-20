//! Whisper (STT) user-scope config — language hint + beam size + VAD threshold.
//!
//! Persists to `{data_dir}/user/voice_stt.toml`. Atomic write via
//! temp-file + rename. Load tolerates missing/malformed files by
//! returning defaults so the devtool always renders.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::io::Write as _;
use std::path::{Path, PathBuf};

const FILE_NAME: &str = "voice_stt.toml";
/// Default language hint — empty = auto-detect.
pub const DEFAULT_LANGUAGE: &str = "";
/// Default beam size for decoding. 1 = greedy (fast), 5 = quality default.
pub const DEFAULT_BEAM_SIZE: u32 = 1;
/// Default voice-activity-detection energy threshold. 0.0..1.0.
pub const DEFAULT_VAD_THRESHOLD: f32 = 0.5;

/// Persisted user STT preferences.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
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
        self.beam_size = self.beam_size.min(10);
        if !self.vad_threshold.is_finite() {
            self.vad_threshold = DEFAULT_VAD_THRESHOLD;
        }
        self.vad_threshold = self.vad_threshold.clamp(0.0, 1.0);
        // Normalize language to trimmed-lowercase; empty means auto-detect.
        self.language = self.language.trim().to_ascii_lowercase();
        self
    }
}

fn resolve_path(data_dir: &Path) -> PathBuf {
    data_dir.join("user").join(FILE_NAME)
}

/// Load the persisted config, or defaults on any error.
#[must_use]
pub fn load(data_dir: &Path) -> VoiceSttConfig {
    let path = resolve_path(data_dir);
    let Ok(raw) = fs::read_to_string(&path) else {
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
/// - Temp-file write or rename fails.
pub fn save(data_dir: &Path, cfg: &VoiceSttConfig) -> Result<VoiceSttConfig> {
    let clamped = cfg.clone().clamp();
    let path = resolve_path(data_dir);
    let parent = path
        .parent()
        .with_context(|| format!("voice_stt path has no parent: {}", path.display()))?;
    fs::create_dir_all(parent).with_context(|| format!("create parent {}", parent.display()))?;

    let serialized = toml::to_string_pretty(&clamped).context("serialize voice_stt config")?;
    let mut tmp = path.clone();
    let mut ext = tmp
        .extension()
        .and_then(|s| s.to_str())
        .map(str::to_owned)
        .unwrap_or_default();
    ext.push_str(".tmp");
    tmp.set_extension(ext);

    {
        let mut f =
            fs::File::create(&tmp).with_context(|| format!("open tmp {}", tmp.display()))?;
        f.write_all(serialized.as_bytes())
            .with_context(|| format!("write tmp {}", tmp.display()))?;
        f.sync_all().ok();
    }

    fs::rename(&tmp, &path)
        .with_context(|| format!("rename {} -> {}", tmp.display(), path.display()))?;

    Ok(clamped)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_when_missing() {
        let tmp = tempfile::tempdir().unwrap();
        let cfg = load(tmp.path());
        assert_eq!(cfg.beam_size, DEFAULT_BEAM_SIZE);
        assert!((cfg.vad_threshold - DEFAULT_VAD_THRESHOLD).abs() < f32::EPSILON);
    }

    #[test]
    fn clamps_beam_and_threshold() {
        let tmp = tempfile::tempdir().unwrap();
        let saved = save(
            tmp.path(),
            &VoiceSttConfig {
                language: "EN".into(),
                beam_size: 999,
                vad_threshold: 2.0,
            },
        )
        .unwrap();
        assert_eq!(saved.beam_size, 10);
        assert!((saved.vad_threshold - 1.0).abs() < f32::EPSILON);
        assert_eq!(saved.language, "en");
    }
}
