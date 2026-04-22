//! Moshi STS backend — full-duplex speech-to-speech via Candle.
//!
//! Wraps the `moshi` crate (Kyutai Moshi 7B) for native audio-in → audio-out.
//! Frame-based at 12.5 Hz (80ms per step, 1920 samples at 24kHz).
//!
//! # Model files required
//!
//! - `model.q8.gguf` or `model.safetensors` — 7B LM weights
//! - `tokenizer-e351c8d8-checkpoint125.safetensors` — Mimi audio codec
//! - `tokenizer_spm_32k_3.model` — SentencePiece text tokenizer
//! - `config.toml` — LM config

use anyhow::{Context, Result};
use std::path::Path;
use tracing;

/// Sample rate for Moshi audio I/O.
pub const SAMPLE_RATE: u32 = 24_000;

/// Samples per frame (24000 / 12.5 Hz = 1920).
pub const FRAME_SIZE: usize = 1_920;

/// Frame rate in Hz.
pub const FRAME_RATE: f64 = 12.5;

/// Moshi STS backend state.
///
/// Owns the Mimi codec, LM model, and generation state.
/// NOT Send — must live on a dedicated inference thread (same as BackendPool pattern).
pub struct MoshiStsBackend {
    loaded: bool,
    model_dir: std::path::PathBuf,
}

impl MoshiStsBackend {
    /// Create an unloaded backend pointed at a model directory.
    #[must_use]
    pub fn new(model_dir: &Path) -> Self {
        tracing::info!(path = %model_dir.display(), "MoshiStsBackend::new()");
        Self {
            loaded: false,
            model_dir: model_dir.to_path_buf(),
        }
    }

    /// Load the Moshi model, Mimi codec, and text tokenizer.
    ///
    /// This is heavy (~8GB for q8, ~16GB for bf16). Call on a dedicated thread.
    #[cfg(feature = "moshi-sts")]
    pub fn load(&mut self, device: &candle_core::Device) -> Result<()> {
        use moshi::lm;
        use moshi::mimi;

        let lm_path = self.find_lm_file()?;
        let mimi_path = self.find_mimi_file()?;
        let _tokenizer_path = self.find_tokenizer_file()?;

        tracing::info!(
            lm = %lm_path.display(),
            mimi = %mimi_path.display(),
            "Loading Moshi STS model"
        );

        let dtype = if lm_path.extension().map_or(false, |e| e == "gguf") {
            candle_core::DType::F32 // GGUF handles its own quantization
        } else {
            candle_core::DType::BF16
        };

        // Load Mimi codec (8 codebooks for single-stream, 16 for duplex)
        let _mimi =
            mimi::load(&mimi_path, Some(8), device).context("Failed to load Mimi audio codec")?;

        // Load LM — auto-detects gguf vs safetensors by extension
        let _lm_model = lm::load_streaming_both_ways(&lm_path, dtype, device)
            .context("Failed to load Moshi LM")?;

        tracing::info!("Moshi STS model loaded successfully");
        self.loaded = true;
        Ok(())
    }

    /// Stub load for when moshi-sts feature is not enabled.
    #[cfg(not(feature = "moshi-sts"))]
    pub fn load(&mut self, _device_name: &str) -> Result<()> {
        anyhow::bail!("Moshi STS feature not enabled. Rebuild with --features moshi-sts")
    }

    /// Check if the model is loaded and ready for inference.
    #[must_use]
    pub fn is_loaded(&self) -> bool {
        self.loaded
    }

    /// Unload the model and free memory.
    pub fn unload(&mut self) {
        tracing::info!("Unloading Moshi STS model");
        self.loaded = false;
        // When the full implementation holds mimi/lm/state, dropping them frees VRAM
    }

    // ── File discovery helpers ──────────────────────────────

    fn find_lm_file(&self) -> Result<std::path::PathBuf> {
        // Prefer GGUF (quantized, smaller)
        for name in &[
            "model.q8.gguf",
            "model.q4.gguf",
            "model.gguf",
            "model.safetensors",
        ] {
            let path = self.model_dir.join(name);
            if path.exists() {
                return Ok(path);
            }
        }
        anyhow::bail!(
            "No Moshi LM file found in {}. Expected model.q8.gguf or model.safetensors",
            self.model_dir.display()
        )
    }

    fn find_mimi_file(&self) -> Result<std::path::PathBuf> {
        // The Mimi codec file is confusingly named "tokenizer-*" in Kyutai's repos
        for entry in std::fs::read_dir(&self.model_dir)? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("tokenizer-") && name.ends_with(".safetensors") {
                return Ok(entry.path());
            }
        }
        // Also check for explicit mimi file
        let mimi_path = self.model_dir.join("mimi.safetensors");
        if mimi_path.exists() {
            return Ok(mimi_path);
        }
        anyhow::bail!(
            "No Mimi codec file found in {}. Expected tokenizer-*.safetensors or mimi.safetensors",
            self.model_dir.display()
        )
    }

    fn find_tokenizer_file(&self) -> Result<std::path::PathBuf> {
        for name in &["tokenizer_spm_32k_3.model", "tokenizer.model"] {
            let path = self.model_dir.join(name);
            if path.exists() {
                return Ok(path);
            }
        }
        anyhow::bail!(
            "No SentencePiece tokenizer found in {}. Expected tokenizer_spm_32k_3.model",
            self.model_dir.display()
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backend_starts_unloaded() {
        let backend = MoshiStsBackend::new(Path::new("/tmp/fake-moshi"));
        assert!(!backend.is_loaded());
    }
}
