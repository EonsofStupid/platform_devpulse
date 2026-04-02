//! Orpheus TTS — LLM-based text-to-speech via llama.cpp + SNAC decoder.
//!
//! Pipeline:
//!   1. Orpheus LLM (GGUF via llama.cpp) generates audio token IDs
//!   2. SNAC decoder (ONNX via ort) converts tokens to PCM waveform
//!
//! The Orpheus model runs through the existing `InferenceBackend` trait
//! (same as chat models), but the output tokens are audio codes, not text.
//! A special prompt format triggers audio generation mode.
//!
//! Model: `orpheus-3b-0.1-ft.Q8_0.gguf` (~3.2GB)
//! Requires: SNAC decoder co-loaded (Coupled lifecycle)

use crate::backends::ort::snac::SnacDecoder;
use crate::backends::voice::{AudioSamples, TtsBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};

/// Special token range for Orpheus audio codes.
/// Orpheus outputs token IDs in this range to signal audio data.
const AUDIO_TOKEN_START: u32 = 128256;
const AUDIO_TOKEN_END: u32 = 131072;

/// Orpheus TTS: LLM generates audio tokens, SNAC decodes to waveform.
pub struct OrpheusTts {
    /// Path to the Orpheus GGUF model.
    model_path: Option<PathBuf>,
    /// SNAC decoder (co-loaded, Coupled lifecycle).
    snac: SnacDecoder,
    /// Whether the LLM is loaded (managed externally via InferenceHandle).
    llm_loaded: bool,
}

impl OrpheusTts {
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            snac: SnacDecoder::new(),
            llm_loaded: false,
        }
    }

    /// Build the Orpheus prompt format for TTS.
    ///
    /// Orpheus uses a specific prompt template to trigger audio generation:
    /// `<|audio|>{voice_profile}: {text}<|eoa|>`
    #[must_use]
    pub fn format_prompt(text: &str, voice_profile: &str) -> String {
        format!("<|audio|>{voice_profile}: {text}<|eoa|>")
    }

    /// Extract audio token IDs from the generated output.
    ///
    /// Filters out non-audio tokens (text tokens, special tokens)
    /// and returns only tokens in the audio code range.
    #[must_use]
    pub fn extract_audio_tokens(generated_tokens: &[u32]) -> Vec<u32> {
        generated_tokens
            .iter()
            .copied()
            .filter(|&t| t >= AUDIO_TOKEN_START && t < AUDIO_TOKEN_END)
            .collect()
    }

    /// Load the SNAC decoder (called when Coupled lifecycle triggers).
    pub fn load_snac(&mut self, snac_path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        self.snac.load(snac_path, params)
    }

    /// Unload the SNAC decoder.
    pub fn unload_snac(&mut self) -> anyhow::Result<()> {
        self.snac.unload()
    }
}

impl Default for OrpheusTts {
    fn default() -> Self {
        Self::new()
    }
}

impl TtsBackend for OrpheusTts {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "Orpheus TTS",
            "Loading Orpheus TTS model"
        );

        if !path.exists() {
            anyhow::bail!("Orpheus model not found: {}", path.display());
        }

        // The Orpheus GGUF is loaded through the existing InferenceBackend
        // (llama.cpp bridge). This TtsBackend tracks the state but delegates
        // actual weight loading to the InferenceHandle.
        //
        // TODO: Wire to InferenceHandle.load() for the voice.tts.primary slot

        let file_size = std::fs::metadata(path)?.len();
        self.model_path = Some(path.to_path_buf());
        self.llm_loaded = true;

        tracing::info!(
            component = "Orpheus TTS",
            size_mb = file_size / (1024 * 1024),
            "Orpheus TTS loaded"
        );

        Ok(MemoryFootprint {
            ram_bytes: file_size,
            vram_bytes: 0, // CPU for now
        })
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        tracing::info!(component = "Orpheus TTS", "Unloading Orpheus TTS");
        self.model_path = None;
        self.llm_loaded = false;
        // SNAC unloaded separately via Coupled lifecycle
        Ok(())
    }

    fn synthesize(&self, text: &str, voice_profile: &str) -> anyhow::Result<AudioSamples> {
        if !self.llm_loaded {
            anyhow::bail!("Orpheus TTS not loaded — call load() first");
        }
        if !self.snac.is_loaded() {
            anyhow::bail!("SNAC decoder not loaded — Coupled lifecycle should co-load it");
        }

        tracing::debug!(
            component = "Orpheus TTS",
            text_len = text.len(),
            voice = voice_profile,
            "Synthesizing speech via Orpheus → SNAC pipeline"
        );

        let _prompt = Self::format_prompt(text, voice_profile);

        // TODO: Full pipeline:
        // 1. Send prompt to InferenceHandle (llama.cpp)
        // 2. Collect generated tokens until <|eoa|> or max tokens
        // 3. Extract audio tokens from output
        // 4. Feed audio tokens to SNAC decoder
        // 5. Return PCM waveform

        // Placeholder: generate silence via SNAC with dummy tokens
        let dummy_audio_tokens: Vec<u32> = (0..100)
            .map(|i| AUDIO_TOKEN_START + (i % 2048))
            .collect();

        self.snac.decode(&dummy_audio_tokens)
    }

    fn memory_usage(&self) -> MemoryFootprint {
        let llm_size = self
            .model_path
            .as_ref()
            .and_then(|p| std::fs::metadata(p).ok())
            .map(|m| m.len())
            .unwrap_or(0);
        let snac_size = self.snac.memory_usage();

        MemoryFootprint {
            ram_bytes: llm_size + snac_size.ram_bytes,
            vram_bytes: snac_size.vram_bytes,
        }
    }

    fn is_loaded(&self) -> bool {
        self.llm_loaded
    }
}
