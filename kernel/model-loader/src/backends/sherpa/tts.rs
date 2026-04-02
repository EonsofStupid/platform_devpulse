//! Kokoro TTS via sherpa-rs — fallback voice when Orpheus isn't available.
//!
//! Kokoro is a lightweight TTS model that runs via sherpa's GGUF path.
//! Lower quality than Orpheus but faster and uses less memory.
//!
//! Model: `Kokoro_espeak_Q8.gguf` (~80MB)
//! Output: PCM f32, 22050Hz mono

use crate::backends::voice::{AudioSamples, TtsBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};

/// Kokoro TTS backed by sherpa-rs.
pub struct KokoroTts {
    model_path: Option<PathBuf>,
    loaded: bool,
}

impl KokoroTts {
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
        }
    }
}

impl Default for KokoroTts {
    fn default() -> Self {
        Self::new()
    }
}

impl TtsBackend for KokoroTts {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "Kokoro TTS",
            "Loading Kokoro TTS model"
        );

        if !path.exists() {
            anyhow::bail!("Kokoro model not found: {}", path.display());
        }

        // TODO: Initialize sherpa-rs TTS session
        // let config = sherpa_rs::tts::OfflineTtsConfig { ... };
        // let tts = sherpa_rs::tts::OfflineTts::new(config)?;

        let file_size = std::fs::metadata(path)?.len();
        self.model_path = Some(path.to_path_buf());
        self.loaded = true;

        tracing::info!(
            component = "Kokoro TTS",
            size_mb = file_size / (1024 * 1024),
            "Kokoro TTS loaded"
        );

        Ok(MemoryFootprint {
            ram_bytes: file_size,
            vram_bytes: 0,
        })
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        tracing::info!(component = "Kokoro TTS", "Unloading Kokoro TTS");
        self.model_path = None;
        self.loaded = false;
        Ok(())
    }

    fn synthesize(&self, text: &str, _voice_profile: &str) -> anyhow::Result<AudioSamples> {
        if !self.loaded {
            anyhow::bail!("Kokoro TTS not loaded — call load() first");
        }

        tracing::debug!(
            component = "Kokoro TTS",
            text_len = text.len(),
            "Synthesizing speech"
        );

        // TODO: Run sherpa TTS inference
        // let audio = self.tts.generate(text, sid, speed)?;

        // Placeholder: silence
        let sample_count = (text.len() * 4000).min(24000 * 30); // rough estimate
        Ok(AudioSamples {
            data: vec![0.0f32; sample_count],
            sample_rate: 22050,
            channels: 1,
        })
    }

    fn memory_usage(&self) -> MemoryFootprint {
        if let Some(ref path) = self.model_path {
            let size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
            MemoryFootprint {
                ram_bytes: size,
                vram_bytes: 0,
            }
        } else {
            MemoryFootprint::default()
        }
    }

    fn is_loaded(&self) -> bool {
        self.loaded
    }
}
