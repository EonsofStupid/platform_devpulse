//! Voice backend traits — TTS and STT abstraction boundary.
//!
//! Voice backends produce or consume audio, not text tokens.
//! Separate from `InferenceBackend` which handles LLM forward passes.

use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::Path;

/// Audio sample output — raw PCM data.
#[derive(Debug, Clone)]
pub struct AudioSamples {
    /// Raw PCM samples (f32, mono).
    pub data: Vec<f32>,
    /// Sample rate in Hz (typically 24000 for Orpheus/SNAC, 22050 for Kokoro).
    pub sample_rate: u32,
    /// Number of channels (1 = mono).
    pub channels: u16,
}

/// Text-to-Speech backend trait.
///
/// Implementations: Orpheus (llama.cpp → SNAC), Kokoro (sherpa-rs).
pub trait TtsBackend: Send {
    /// Load the TTS model from disk.
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint>;

    /// Unload model and free memory.
    fn unload(&mut self) -> anyhow::Result<()>;

    /// Synthesize speech from text. Returns raw PCM audio.
    ///
    /// `text` — input text to speak.
    /// `voice_profile` — voice style identifier (backend-specific).
    fn synthesize(&self, text: &str, voice_profile: &str) -> anyhow::Result<AudioSamples>;

    /// Current memory footprint.
    fn memory_usage(&self) -> MemoryFootprint;

    /// Whether a model is currently loaded.
    fn is_loaded(&self) -> bool;
}

/// Speech-to-Text backend trait.
///
/// Implementations: Whisper (sherpa-rs).
pub trait SttBackend: Send {
    /// Load the STT model from disk.
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint>;

    /// Unload model and free memory.
    fn unload(&mut self) -> anyhow::Result<()>;

    /// Transcribe audio to text.
    ///
    /// `samples` — raw PCM audio input.
    fn transcribe(&self, samples: &AudioSamples) -> anyhow::Result<String>;

    /// Current memory footprint.
    fn memory_usage(&self) -> MemoryFootprint;

    /// Whether a model is currently loaded.
    fn is_loaded(&self) -> bool;
}

/// Audio decoder backend trait (SNAC — converts audio tokens to waveform).
///
/// SNAC sits between an LLM producing audio tokens and the PCM output.
/// The LLM (Orpheus) generates token IDs representing audio codes.
/// SNAC decodes those codes into a raw waveform.
pub trait AudioDecoderBackend: Send {
    /// Load the decoder model from disk (ONNX format).
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint>;

    /// Unload model and free memory.
    fn unload(&mut self) -> anyhow::Result<()>;

    /// Decode audio tokens into PCM waveform.
    ///
    /// `audio_tokens` — token IDs from the TTS LLM (Orpheus).
    fn decode(&self, audio_tokens: &[u32]) -> anyhow::Result<AudioSamples>;

    /// Current memory footprint.
    fn memory_usage(&self) -> MemoryFootprint;

    /// Whether a model is currently loaded.
    fn is_loaded(&self) -> bool;
}
