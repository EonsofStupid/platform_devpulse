//! Piper TTS backend — pure-Rust alternate to Kokoro.
//!
//! Piper is a VITS-based neural TTS with its own bundled espeak-rs phonemizer.
//! It takes a `.onnx` model + a `.onnx.json` config and produces 22.05 kHz mono
//! PCM. Compared to Kokoro, Piper is smaller and self-contained (no separate
//! vocab file needed) but slightly lower quality on English prosody.
//!
//! This backend exists so the platform can A/B test TTS quality without
//! locking in a single voice engine. Both backends implement [`TtsBackend`].
//!
//! Model file layout (`.userdata/models/voice/piper/{voice}/`):
//! - `{voice}.onnx` — the VITS weights
//! - `{voice}.onnx.json` — config handed to `piper_rs::Piper::new`
//!
//! The `path` passed to [`PiperTts::load`] is the `.onnx.json` config file —
//! the matching `.onnx` weights sit alongside it.

use crate::backends::voice::{AudioSamples, TtsBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};
#[cfg(feature = "piper-backend")]
use std::sync::Mutex;

/// Piper VITS TTS backend.
pub struct PiperTts {
    /// Path to the loaded config file (`.onnx.json`).
    model_path: Option<PathBuf>,
    /// Whether a model is currently loaded.
    loaded: bool,
    /// Cached size of the `.onnx` weights file (for `memory_usage`).
    file_size_bytes: u64,
    /// Cached output sample rate (read from the model at load time).
    #[cfg_attr(not(feature = "piper-backend"), allow(dead_code))]
    sample_rate: u32,
    /// Piper synthesizer. Synthesizing needs exclusive access to its model
    /// session, so one utterance runs at a time.
    #[cfg(feature = "piper-backend")]
    synthesizer: Mutex<Option<piper_rs::Piper>>,
}

impl PiperTts {
    /// Create a new unloaded Piper backend.
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
            file_size_bytes: 0,
            sample_rate: 22_050,
            #[cfg(feature = "piper-backend")]
            synthesizer: Mutex::new(None),
        }
    }
}

impl Default for PiperTts {
    fn default() -> Self {
        Self::new()
    }
}

impl TtsBackend for PiperTts {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "Piper TTS",
            "Loading Piper voice"
        );

        if !path.exists() {
            anyhow::bail!("Piper config not found: {}", path.display());
        }

        #[cfg(feature = "piper-backend")]
        {
            // The weights file is the config's name without `.json`.
            let weights_path = path.with_extension("");

            let config_file = std::fs::File::open(path)
                .map_err(|e| anyhow::anyhow!("Failed to open Piper model config: {e}"))?;
            let config: piper_rs::ModelConfig = serde_json::from_reader(config_file)
                .map_err(|e| anyhow::anyhow!("Failed to parse Piper model config: {e}"))?;
            self.sample_rate = config.audio.sample_rate;

            let synthesizer = piper_rs::Piper::new(&weights_path, path)
                .map_err(|e| anyhow::anyhow!("Failed to load Piper model: {e}"))?;

            *self
                .synthesizer
                .lock()
                .map_err(|e| anyhow::anyhow!("Piper synth mutex poisoned: {e}"))? =
                Some(synthesizer);

            let weights_size = std::fs::metadata(&weights_path)
                .map(|m| m.len())
                .unwrap_or(0);
            self.file_size_bytes = weights_size;
            self.model_path = Some(path.to_path_buf());
            self.loaded = true;

            tracing::info!(
                component = "Piper TTS",
                sample_rate = self.sample_rate,
                size_mb = weights_size / 1_048_576,
                "Piper voice loaded"
            );

            return Ok(MemoryFootprint {
                ram_bytes: weights_size,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            });
        }

        #[cfg(not(feature = "piper-backend"))]
        {
            anyhow::bail!("Piper TTS requires `piper-backend` feature — not compiled");
        }
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        tracing::info!(component = "Piper TTS", "Unloading Piper voice");
        #[cfg(feature = "piper-backend")]
        {
            *self
                .synthesizer
                .lock()
                .map_err(|e| anyhow::anyhow!("Piper synth mutex poisoned: {e}"))? = None;
        }
        self.model_path = None;
        self.loaded = false;
        self.file_size_bytes = 0;
        Ok(())
    }

    #[cfg(feature = "piper-backend")]
    #[tracing::instrument(skip(self), fields(text_len = text.len(), voice))]
    fn synthesize(&self, text: &str, voice: &str) -> anyhow::Result<AudioSamples> {
        if !self.loaded {
            anyhow::bail!("Piper TTS not loaded");
        }

        let _ = voice; // Piper's voice is baked into the loaded model config.

        let mut guard = self
            .synthesizer
            .lock()
            .map_err(|e| anyhow::anyhow!("Piper synth mutex poisoned: {e}"))?;
        let synth = guard
            .as_mut()
            .ok_or_else(|| anyhow::anyhow!("Piper synthesizer not initialized"))?;

        // The voice's own speaker and pace: every tuning value stays the model's.
        let (pcm, sample_rate) = synth
            .create(text, false, None, None, None, None)
            .map_err(|e| anyhow::anyhow!("Piper synthesis failed: {e}"))?;
        drop(guard);

        if pcm.is_empty() {
            anyhow::bail!("Piper produced empty audio for input: {text:?}");
        }

        tracing::info!(
            component = "Piper TTS",
            pcm_samples = pcm.len(),
            duration_secs = pcm.len() as f32 / sample_rate as f32,
            "Piper synthesis complete"
        );

        Ok(AudioSamples {
            data: pcm,
            sample_rate,
            channels: 1,
        })
    }

    #[cfg(not(feature = "piper-backend"))]
    fn synthesize(&self, _text: &str, _voice: &str) -> anyhow::Result<AudioSamples> {
        anyhow::bail!("Piper TTS requires `piper-backend` feature — not compiled")
    }

    fn memory_usage(&self) -> MemoryFootprint {
        MemoryFootprint {
            ram_bytes: self.file_size_bytes,
            vram_bytes: 0,
            kv_cache_bytes: 0,
        }
    }

    fn is_loaded(&self) -> bool {
        self.loaded
    }
}
