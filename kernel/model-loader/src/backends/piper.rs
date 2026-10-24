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
//! - `{voice}.onnx.json` — config used to configure `piper_rs::from_config_path`
//!
//! The `path` passed to [`PiperTts::load`] is the `.onnx.json` config file —
//! `piper-rs` resolves the matching `.onnx` weights alongside it.

use crate::backends::voice::{AudioSamples, TtsBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};
#[cfg(feature = "piper-backend")]
use std::sync::{Arc, Mutex};

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
    /// Piper synthesizer — arc-cloned because `PiperSpeechSynthesizer::clone_model`
    /// internally requires an `Arc<dyn PiperModel>`.
    #[cfg(feature = "piper-backend")]
    synthesizer: Mutex<Option<Arc<piper_rs::synth::PiperSpeechSynthesizer>>>,
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
            use piper_rs::synth::PiperSpeechSynthesizer;

            // piper-rs expects the path to the `.onnx.json` config file; the
            // weights file is resolved by stripping `.json` from the filename.
            let model = piper_rs::from_config_path(path)
                .map_err(|e| anyhow::anyhow!("Failed to load Piper model config: {e:?}"))?;

            let audio_info = model
                .audio_output_info()
                .map_err(|e| anyhow::anyhow!("Failed to query Piper audio info: {e:?}"))?;
            self.sample_rate = audio_info.sample_rate as u32;

            let synthesizer = PiperSpeechSynthesizer::new(model)
                .map_err(|e| anyhow::anyhow!("Failed to build Piper synthesizer: {e:?}"))?;

            *self
                .synthesizer
                .lock()
                .map_err(|e| anyhow::anyhow!("Piper synth mutex poisoned: {e}"))? =
                Some(Arc::new(synthesizer));

            // Resolve `.onnx` weights size: config stem + `.onnx` next to config.
            let weights_path = path.with_extension("");
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

        let guard = self
            .synthesizer
            .lock()
            .map_err(|e| anyhow::anyhow!("Piper synth mutex poisoned: {e}"))?;
        let synth = guard
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Piper synthesizer not initialized"))?
            .clone();
        drop(guard);

        // Parallel synthesis streams sentence-level Audio chunks back — collect
        // into a single contiguous f32 PCM buffer.
        let mut pcm: Vec<f32> = Vec::new();
        let stream = synth
            .synthesize_parallel(text.to_string(), None)
            .map_err(|e| anyhow::anyhow!("Piper synthesize_parallel failed: {e:?}"))?;

        for result in stream {
            match result {
                Ok(audio) => {
                    pcm.extend_from_slice(audio.as_wave_bytes_f32().as_slice());
                }
                Err(e) => anyhow::bail!("Piper synthesis error mid-stream: {e:?}"),
            }
        }

        if pcm.is_empty() {
            anyhow::bail!("Piper produced empty audio for input: {text:?}");
        }

        tracing::info!(
            component = "Piper TTS",
            pcm_samples = pcm.len(),
            duration_secs = pcm.len() as f32 / self.sample_rate as f32,
            "Piper synthesis complete"
        );

        Ok(AudioSamples {
            data: pcm,
            sample_rate: self.sample_rate,
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
