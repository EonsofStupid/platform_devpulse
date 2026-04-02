//! Voice backend traits — TTS, STT, and audio codec abstraction boundary.
//!
//! Voice backends produce or consume audio, not text tokens.
//! Separate from `InferenceBackend` which handles LLM forward passes.
//!
//! All ONNX models (SNAC, Whisper, Kokoro) run through the `ort` crate.
//! Orpheus TTS runs through `InferenceBackend` (llama.cpp) + SNAC decoder.
//! Audio playback via `rodio`. Microphone capture via `cpal`.

use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::Path;

/// Audio sample output — raw PCM data.
#[derive(Debug, Clone)]
pub struct AudioSamples {
    /// Raw PCM samples (f32, mono).
    pub data: Vec<f32>,
    /// Sample rate in Hz (24000 for Orpheus/SNAC, varies for Kokoro/Whisper).
    pub sample_rate: u32,
    /// Number of channels (1 = mono).
    pub channels: u16,
}

/// Text-to-Speech backend trait.
///
/// Implementations:
/// - `OrpheusTts` — llama.cpp LLM → audio tokens → SNAC decoder → PCM
/// - `KokoroTts` — ort ONNX session → PCM
pub trait TtsBackend: Send {
    /// Load the TTS model from disk.
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint>;

    /// Unload model and free memory.
    fn unload(&mut self) -> anyhow::Result<()>;

    /// Synthesize speech from text. Returns raw PCM audio.
    ///
    /// `text` — input text to speak. Supports emotion tags: `<laugh>`, `<sigh>`, etc.
    /// `voice` — voice name (Orpheus: tara/leah/jess/leo/dan/mia/zac/zoe).
    fn synthesize(&self, text: &str, voice: &str) -> anyhow::Result<AudioSamples>;

    /// Current memory footprint.
    fn memory_usage(&self) -> MemoryFootprint;

    /// Whether a model is currently loaded.
    fn is_loaded(&self) -> bool;
}

/// Speech-to-Text backend trait.
///
/// Implementation: `WhisperStt` — ort ONNX session (encoder + decoder).
pub trait SttBackend: Send {
    /// Load the STT model from disk.
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint>;

    /// Unload model and free memory.
    fn unload(&mut self) -> anyhow::Result<()>;

    /// Transcribe audio to text.
    fn transcribe(&self, samples: &AudioSamples) -> anyhow::Result<String>;

    /// Current memory footprint.
    fn memory_usage(&self) -> MemoryFootprint;

    /// Whether a model is currently loaded.
    fn is_loaded(&self) -> bool;
}

/// SNAC audio decoder — converts LLM audio tokens to PCM waveform.
///
/// SNAC uses 3 codebook levels at different temporal resolutions.
/// Each decode window produces ~1.024 seconds of 24kHz audio.
///
/// Input: 3 codebook token arrays (12 + 24 + 48 = 84 tokens total)
/// Output: 24,576 PCM f32 samples at 24kHz
pub trait AudioDecoderBackend: Send {
    /// Load the decoder model from disk (ONNX format).
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint>;

    /// Unload model and free memory.
    fn unload(&mut self) -> anyhow::Result<()>;

    /// Decode one window of audio tokens into PCM waveform.
    ///
    /// SNAC expects 3 codebook levels per window:
    /// - `codes0`: 12 tokens (lowest temporal resolution, 1 per 4 frames)
    /// - `codes1`: 24 tokens (mid resolution, 1 per 2 frames)
    /// - `codes2`: 48 tokens (highest resolution, 1 per frame)
    fn decode(
        &self,
        codes0: &[i64],
        codes1: &[i64],
        codes2: &[i64],
    ) -> anyhow::Result<AudioSamples>;

    /// Current memory footprint.
    fn memory_usage(&self) -> MemoryFootprint;

    /// Whether a model is currently loaded.
    fn is_loaded(&self) -> bool;
}
