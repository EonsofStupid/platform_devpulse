//! Orpheus TTS — LLM-based text-to-speech via llama.cpp + SNAC decoder.
//!
//! Pipeline:
//!   1. Format prompt with voice name + emotion tags
//!   2. Orpheus LLM (GGUF via llama.cpp) generates audio token IDs
//!   3. Extract tokens after CODE_START_TOKEN_ID, offset by CODE_TOKEN_OFFSET
//!   4. Group into 7-per-frame chunks, redistribute to 3 SNAC codebooks
//!   5. SNAC decode(codes0, codes1, codes2) via ort → PCM f32 24kHz
//!   6. rodio plays the PCM
//!
//! Model: `orpheus-3b-0.1-ft.Q8_0.gguf` (~3.2GB)
//! Requires: SNAC decoder co-loaded (Coupled lifecycle)

use crate::backends::ort::snac::SnacDecoder;
use crate::backends::voice::{AudioDecoderBackend, AudioSamples, TtsBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};

// ── Token Constants (verified from orpheus-tts-local) ──────────────

/// Marks the start of audio generation in the LLM output.
const _START_TOKEN_ID: u32 = 128259;

/// Marks the beginning of actual audio code tokens.
const _CODE_START_TOKEN_ID: u32 = 128257;

/// Offset subtracted from raw token IDs to get codebook indices (0-4095).
const CODE_TOKEN_OFFSET: u32 = 128266;

/// End-of-sequence token IDs — stop generation when any of these appear.
const END_TOKEN_IDS: [u32; 4] = [128009, 128260, 128261, 128257];

/// Each SNAC codebook has 4096 entries.
const CODEBOOK_SIZE: u32 = 4096;

/// Tokens per audio frame (7 tokens encode 3 codebook levels).
const TOKENS_PER_FRAME: usize = 7;

/// Minimum frames before first decode (4 frames = 28 tokens).
const _MIN_FRAMES_BEFORE_DECODE: usize = 4;

/// Available voice names for Orpheus.
pub const VOICES: [&str; 8] = ["tara", "leah", "jess", "leo", "dan", "mia", "zac", "zoe"];

/// Default voice.
pub const DEFAULT_VOICE: &str = "tara";

/// Orpheus TTS: LLM generates audio tokens, SNAC decodes to waveform.
pub struct OrpheusTts {
    model_path: Option<PathBuf>,
    snac: SnacDecoder,
    llm_loaded: bool,
}

impl OrpheusTts {
    /// Create a new Orpheus TTS instance (unloaded).
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            snac: SnacDecoder::new(),
            llm_loaded: false,
        }
    }

    /// Build the Orpheus prompt for TTS generation.
    ///
    /// Supports emotion tags inline: `<laugh>`, `<sigh>`, `<chuckle>`, etc.
    #[must_use]
    pub fn format_prompt(text: &str, voice: &str) -> String {
        format!(
            "<custom_token_3><|begin_of_text|>{voice}: {text}\
             <|eot_id|><custom_token_4><custom_token_5><custom_token_1>"
        )
    }

    /// Check if a token ID signals end of generation.
    #[must_use]
    pub fn is_end_token(token_id: u32) -> bool {
        END_TOKEN_IDS.contains(&token_id)
    }

    /// Check if a token ID is an audio code (after CODE_START_TOKEN_ID).
    #[must_use]
    pub fn is_audio_token(token_id: u32) -> bool {
        token_id >= CODE_TOKEN_OFFSET
    }

    /// Convert a raw audio token to its codebook value.
    ///
    /// Each position in the 7-token frame maps to a different codebook:
    /// `actual_code = token_id - CODE_TOKEN_OFFSET - (position_in_group * CODEBOOK_SIZE)`
    #[must_use]
    pub fn token_to_code(token_id: u32, position_in_group: usize) -> u32 {
        token_id
            .saturating_sub(CODE_TOKEN_OFFSET)
            .saturating_sub((position_in_group as u32) * CODEBOOK_SIZE)
    }

    /// Redistribute a flat sequence of audio tokens into SNAC's 3 codebook levels.
    ///
    /// Input: flat token stream grouped in 7s.
    /// Per-frame pattern: `[c0, c1a, c2a, c2b, c1b, c2c, c2d]`
    ///
    /// Output: 3 Vecs for SNAC's 3 input tensors.
    /// - codes0: 1 token per frame (indices 0)
    /// - codes1: 2 tokens per frame (indices 1, 4)
    /// - codes2: 4 tokens per frame (indices 2, 3, 5, 6)
    #[must_use]
    pub fn redistribute_codes(tokens: &[u32]) -> (Vec<i64>, Vec<i64>, Vec<i64>) {
        let num_frames = tokens.len() / TOKENS_PER_FRAME;
        let mut codes0 = Vec::with_capacity(num_frames);
        let mut codes1 = Vec::with_capacity(num_frames * 2);
        let mut codes2 = Vec::with_capacity(num_frames * 4);

        for frame in 0..num_frames {
            let base = frame * TOKENS_PER_FRAME;
            let t = |offset: usize, group_pos: usize| -> i64 {
                Self::token_to_code(tokens[base + offset], group_pos) as i64
            };

            // codes0: 1 per frame
            codes0.push(t(0, 0));
            // codes1: 2 per frame
            codes1.push(t(1, 1));
            codes1.push(t(4, 4));
            // codes2: 4 per frame
            codes2.push(t(2, 2));
            codes2.push(t(3, 3));
            codes2.push(t(5, 5));
            codes2.push(t(6, 6));
        }

        (codes0, codes1, codes2)
    }

    /// Load the SNAC decoder (Coupled lifecycle — loads with Orpheus).
    pub fn load_snac(
        &mut self,
        snac_path: &Path,
        params: LoadParams,
    ) -> anyhow::Result<MemoryFootprint> {
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

        // Orpheus GGUF loads through InferenceHandle (llama.cpp bridge).
        // This TtsBackend tracks state but delegates weight loading.
        // TODO: Wire to InferenceHandle.load() for voice.tts.primary slot

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
            vram_bytes: 0,
        })
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        tracing::info!(component = "Orpheus TTS", "Unloading Orpheus TTS");
        self.model_path = None;
        self.llm_loaded = false;
        Ok(())
    }

    fn synthesize(&self, text: &str, voice: &str) -> anyhow::Result<AudioSamples> {
        if !self.llm_loaded {
            anyhow::bail!("Orpheus TTS not loaded");
        }
        if !self.snac.is_loaded() {
            anyhow::bail!("SNAC decoder not loaded — Coupled lifecycle should co-load it");
        }

        tracing::debug!(
            component = "Orpheus TTS",
            text_len = text.len(),
            voice = voice,
            "Synthesizing speech via Orpheus → SNAC pipeline"
        );

        let _prompt = Self::format_prompt(text, voice);

        // TODO: Full pipeline:
        // 1. Send prompt to InferenceHandle (llama.cpp)
        // 2. Collect tokens until end token or max
        // 3. Find CODE_START_TOKEN_ID, extract audio tokens after it
        // 4. redistribute_codes() → (codes0, codes1, codes2)
        // 5. SNAC decode per 12+24+48 window
        // 6. Concatenate PCM windows
        // 7. Return AudioSamples

        // Placeholder: one window of silence
        let dummy_frames = 12; // 12 frames = 84 tokens = 1 SNAC window
        let dummy_tokens: Vec<u32> = (0..dummy_frames * TOKENS_PER_FRAME)
            .map(|i| CODE_TOKEN_OFFSET + (i as u32 % CODEBOOK_SIZE))
            .collect();
        let (codes0, codes1, codes2) = Self::redistribute_codes(&dummy_tokens);
        self.snac.decode(&codes0, &codes1, &codes2)
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
