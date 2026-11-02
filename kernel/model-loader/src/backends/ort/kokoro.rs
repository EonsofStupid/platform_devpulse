//! Kokoro TTS via ONNX Runtime — text-to-speech synthesis.
//!
//! Runs Kokoro ONNX model directly through ort. No sherpa dependency.
//! Pattern matches SNAC decoder (`snac.rs`) — the gold standard for ort usage.
//!
//! Models on disk (`.userdata/models/voice/`):
//! - `kokoro-v1.0.onnx` (~325MB, full precision)
//! - `kokoro-v1.0.fp16.onnx` (~177MB, half precision)
//! - `kokoro-v1.0.int8.onnx` (~92MB, quantized)
//!
//! Input tensors:
//! - `input_ids`: int64 [1, N] — phoneme token IDs
//! - `style`: float32 [1, 256] — speaker style embedding
//! - `speed`: float32 [1] — speed multiplier (1.0 = normal)
//!
//! Output tensor:
//! - `audio`: float32 [1, T] — PCM samples at 24kHz mono
//!
//! # Cast lints
//!
//! Duration math (PCM sample count → seconds) crosses `usize`/`u32` →
//! `f32`. Both inputs are bounded (samples per synthesis << 2^23) so the
//! precision loss is intentional, not silent corruption.

#![allow(clippy::cast_precision_loss)]

use crate::backends::phoneme::KokoroVocab;
#[cfg(feature = "ort-backend")]
use crate::backends::phoneme::text_to_kokoro_ids;
use crate::backends::voice::{AudioSamples, TtsBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};
#[cfg(feature = "ort-backend")]
use std::sync::Mutex;

/// Output sample rate for Kokoro models.
#[cfg(feature = "ort-backend")]
const SAMPLE_RATE: u32 = 24000;

/// Kokoro TTS backed by ort (ONNX Runtime).
pub struct KokoroTts {
    /// Path to the loaded ONNX model file.
    model_path: Option<PathBuf>,
    /// Whether a model is currently loaded.
    loaded: bool,
    /// Phoneme vocabulary loaded from `vocab.json` next to the model.
    vocab: Option<KokoroVocab>,
    /// eSpeak voice identifier (e.g. `"en-us"`). Defaults to `"en-us"`;
    /// override via `synthesize(text, voice)`.
    #[cfg_attr(not(feature = "ort-backend"), allow(dead_code))]
    default_voice: String,
    /// ONNX Runtime session — behind Mutex for thread safety (SNAC pattern).
    #[cfg(feature = "ort-backend")]
    session: Mutex<Option<ort::session::Session>>,
}

impl KokoroTts {
    /// Create a new Kokoro TTS instance (unloaded).
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
            vocab: None,
            default_voice: "en-us".to_string(),
            #[cfg(feature = "ort-backend")]
            session: Mutex::new(None),
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

        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if ext != "onnx" {
            anyhow::bail!(
                "Kokoro TTS requires .onnx file, got .{ext}: {}",
                path.display()
            );
        }

        #[cfg(feature = "ort-backend")]
        {
            let session = ort::session::Session::builder()
                .map_err(|e| anyhow::anyhow!("Failed to create ort SessionBuilder: {e}"))?
                .commit_from_file(path)
                .map_err(|e| anyhow::anyhow!("Failed to load Kokoro ONNX model: {e}"))?;

            tracing::debug!(
                component = "Kokoro TTS",
                inputs = ?session.inputs().iter().map(ort::value::Outlet::name).collect::<Vec<_>>(),
                outputs = ?session.outputs().iter().map(ort::value::Outlet::name).collect::<Vec<_>>(),
                "Session created — inspecting tensor names"
            );

            *self
                .session
                .lock()
                .map_err(|e| anyhow::anyhow!("Kokoro session mutex poisoned: {e}"))? =
                Some(session);

            // Vocab lives next to the model as `vocab.json`. Required for real
            // phoneme → id conversion; without it we cannot synthesize.
            let vocab_path = path
                .parent()
                .ok_or_else(|| anyhow::anyhow!("Kokoro model has no parent dir"))?
                .join("vocab.json");
            if !vocab_path.exists() {
                anyhow::bail!(
                    "Kokoro vocab.json not found at {} — required for phonemization",
                    vocab_path.display()
                );
            }
            let vocab = KokoroVocab::from_file(&vocab_path)?;
            tracing::info!(
                component = "Kokoro TTS",
                vocab_size = vocab.len(),
                vocab_path = %vocab.source().display(),
                "Kokoro phoneme vocab loaded"
            );
            self.vocab = Some(vocab);
        }

        #[cfg(not(feature = "ort-backend"))]
        anyhow::bail!(
            "ort-backend feature not compiled — cannot load Kokoro TTS. \
             Enable 'ort-backend' feature in model-loader Cargo.toml."
        );

        #[cfg(feature = "ort-backend")]
        {
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
                kv_cache_bytes: 0,
            })
        }
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        tracing::info!(component = "Kokoro TTS", "Unloading Kokoro TTS");
        #[cfg(feature = "ort-backend")]
        {
            *self
                .session
                .lock()
                .map_err(|e| anyhow::anyhow!("Kokoro session mutex poisoned: {e}"))? = None;
        }
        self.model_path = None;
        self.loaded = false;
        self.vocab = None;
        Ok(())
    }

    #[cfg(feature = "ort-backend")]
    #[tracing::instrument(skip(self), fields(text_len = text.len(), voice))]
    fn synthesize(&self, text: &str, voice: &str) -> anyhow::Result<AudioSamples> {
        if !self.loaded {
            anyhow::bail!("Kokoro TTS not loaded");
        }

        tracing::debug!(
            component = "Kokoro TTS",
            text_len = text.len(),
            voice = voice,
            "Synthesizing speech"
        );

        // Real phonemization: eSpeak NG → IPA → Kokoro vocab ID lookup.
        // Gated behind the `espeak-phonemizer` feature; returns a clear error
        // on default builds rather than emitting garbage IDs.
        let vocab = self
            .vocab
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("Kokoro vocab not loaded"))?;

        let voice_id = if voice.is_empty() {
            &self.default_voice
        } else {
            voice
        };
        let phoneme_ids = text_to_kokoro_ids(text, voice_id, vocab)?;

        if phoneme_ids.len() <= 2 {
            // Only the two pad tokens — input produced no real phonemes.
            anyhow::bail!("Phonemization produced empty sequence for input: {text:?}");
        }

        let seq_len = phoneme_ids.len();

        let mut guard = self
            .session
            .lock()
            .map_err(|e| anyhow::anyhow!("Kokoro session mutex poisoned: {e}"))?;
        let session = guard
            .as_mut()
            .ok_or_else(|| anyhow::anyhow!("Kokoro session not initialized"))?;

        // Build input tensors (same pattern as SNAC snac.rs:135-147)
        let input_ids = ndarray::Array2::<i64>::from_shape_vec((1, seq_len), phoneme_ids)
            .map_err(|e| anyhow::anyhow!("Failed to create input_ids tensor: {e}"))?;

        // Style embedding — 256-dim vector, zeros = default voice
        // Future: load voice-specific style vectors from a voice registry
        let style = ndarray::Array2::<f32>::zeros((1, 256));

        // Speed multiplier
        let speed = ndarray::Array1::<f32>::from_vec(vec![1.0]);

        let v_ids = ort::value::Value::from_array(input_ids)
            .map_err(|e| anyhow::anyhow!("Failed to create ort Value for input_ids: {e}"))?;
        let v_style = ort::value::Value::from_array(style)
            .map_err(|e| anyhow::anyhow!("Failed to create ort Value for style: {e}"))?;
        let v_speed = ort::value::Value::from_array(speed)
            .map_err(|e| anyhow::anyhow!("Failed to create ort Value for speed: {e}"))?;

        let outputs = session
            .run(ort::inputs![v_ids, v_style, v_speed])
            .map_err(|e| anyhow::anyhow!("Kokoro inference failed: {e}"))?;

        let audio_value = &outputs[0];
        let audio_tensor = audio_value
            .try_extract_tensor::<f32>()
            .map_err(|e| anyhow::anyhow!("Failed to extract Kokoro audio output: {e}"))?;

        let pcm: Vec<f32> = audio_tensor.1.to_vec();

        tracing::info!(
            component = "Kokoro TTS",
            pcm_samples = pcm.len(),
            duration_secs = pcm.len() as f32 / SAMPLE_RATE as f32,
            "Synthesis complete"
        );

        Ok(AudioSamples {
            data: pcm,
            sample_rate: SAMPLE_RATE,
            channels: 1,
        })
    }

    #[cfg(not(feature = "ort-backend"))]
    fn synthesize(&self, _text: &str, _voice: &str) -> anyhow::Result<AudioSamples> {
        anyhow::bail!("Kokoro TTS requires ort-backend feature — not compiled")
    }

    fn memory_usage(&self) -> MemoryFootprint {
        if let Some(ref path) = self.model_path {
            let size = std::fs::metadata(path).map_or(0, |m| m.len());
            MemoryFootprint {
                ram_bytes: size,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            }
        } else {
            MemoryFootprint::default()
        }
    }

    fn is_loaded(&self) -> bool {
        self.loaded
    }
}
