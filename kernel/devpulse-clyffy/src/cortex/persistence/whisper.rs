//! Candle-based Whisper ASR adapter — speech-to-text on CPU.
//!
//! Loads a Whisper model (tiny/base/small) from safetensors.
//! Runs inference on CPU for burst transcription — not streaming.
//!
//! Model files expected at:
//! ```text
//! {model_dir}/
//! ├── config.json           # Whisper model config
//! ├── tokenizer.json        # Whisper tokenizer
//! └── model.safetensors     # Model weights
//! ```
//!
//! Audio input: 16kHz mono f32 PCM samples.

use anyhow::{Context, Result};
use candle_core::{Device, Tensor};
use candle_nn;
use candle_transformers::models::whisper::{self as m, Config};
use std::path::Path;
use tokenizers::Tokenizer;

/// Candle-based Whisper speech-to-text adapter.
pub struct WhisperAdapter {
    model: m::model::Whisper,
    tokenizer: Tokenizer,
    config: Config,
    device: Device,
    mel_filters: Vec<f32>,
}

impl WhisperAdapter {
    /// Load a Whisper model from a local directory.
    ///
    /// # Errors
    /// Returns error if any model file is missing or corrupt.
    pub fn load(model_dir: &Path) -> Result<Self> {
        let device = Device::Cpu;

        // Load config
        let config_path = model_dir.join("config.json");
        let config_data = std::fs::read_to_string(&config_path)
            .with_context(|| format!("Missing config.json at {}", config_path.display()))?;
        let config: Config =
            serde_json::from_str(&config_data).context("Failed to parse Whisper config.json")?;

        // Load tokenizer
        let tokenizer_path = model_dir.join("tokenizer.json");
        let tokenizer = Tokenizer::from_file(&tokenizer_path)
            .map_err(|e| anyhow::anyhow!("Failed to load Whisper tokenizer: {e}"))?;

        // Load mel filters from model directory
        // Whisper models ship with melfilters.bytes (f32 little-endian)
        let mel_path = model_dir.join("melfilters.bytes");
        let mel_bytes = std::fs::read(&mel_path).with_context(|| {
            format!(
                "Missing melfilters.bytes at {}. \
                 Download from the Whisper model repo (80-band or 128-band).",
                mel_path.display()
            )
        })?;
        let mel_filters: Vec<f32> = mel_bytes
            .chunks_exact(4)
            .map(|chunk| f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]))
            .collect();
        let expected_len = config.num_mel_bins * 201; // n_mels * (n_fft/2 + 1)
        if mel_filters.len() != expected_len {
            anyhow::bail!(
                "melfilters.bytes has {} floats, expected {} ({}×201)",
                mel_filters.len(),
                expected_len,
                config.num_mel_bins
            );
        }

        // Load model weights
        let weights_path = model_dir.join("model.safetensors");
        let vb = candle_nn::VarBuilder::from_pth(&weights_path, candle_core::DType::F32, &device)
            .with_context(|| format!("Failed to load {}", weights_path.display()))?;
        let model = m::model::Whisper::load(&vb, config.clone())
            .context("Failed to construct Whisper model")?;

        tracing::info!(
            model_dir = %model_dir.display(),
            num_mel_bins = config.num_mel_bins,
            "Whisper ASR loaded (CPU burst mode)"
        );

        Ok(Self {
            model,
            tokenizer,
            config,
            device,
            mel_filters,
        })
    }

    /// Transcribe audio samples to text.
    ///
    /// Input: 16kHz mono f32 PCM samples.
    /// Output: Transcribed text.
    ///
    /// This is a simplified greedy decode — no beam search, no timestamps.
    ///
    /// # Errors
    /// Returns error if mel spectrogram computation or decoding fails.
    pub fn transcribe(&mut self, pcm_16khz: &[f32]) -> Result<String> {
        // Compute log-mel spectrogram
        let mel = m::audio::pcm_to_mel(&self.config, pcm_16khz, &self.mel_filters);
        let mel_len = mel.len() / self.config.num_mel_bins;
        let mel = Tensor::from_vec(mel, (1, self.config.num_mel_bins, mel_len), &self.device)?;

        // Encode audio
        let audio_features = self.model.encoder.forward(&mel, true)?;

        // Greedy decode
        let sot_token = self.token_id("<|startoftranscript|>")?;
        let transcribe_token = self.token_id("<|transcribe|>")?;
        let eot_token = self.token_id("<|endoftext|>")?;
        let no_timestamps_token = self.token_id("<|notimestamps|>")?;

        let mut tokens = vec![sot_token, transcribe_token, no_timestamps_token];
        let max_tokens = 448; // Whisper's max decode length

        for _ in 0..max_tokens {
            let token_tensor = Tensor::new(tokens.as_slice(), &self.device)?.unsqueeze(0)?;
            let logits = self
                .model
                .decoder
                .forward(&token_tensor, &audio_features, true)?;

            // Greedy: take argmax of last token position
            let last_logits = logits.get(0)?.get(logits.dim(1)? - 1)?;
            let next_token = last_logits.argmax(0)?.to_scalar::<u32>()?;

            if next_token == eot_token {
                break;
            }
            tokens.push(next_token);
        }

        // Decode tokens to text (skip special tokens)
        let text_tokens: Vec<u32> = tokens
            .into_iter()
            .filter(|&t| t != sot_token && t != transcribe_token && t != no_timestamps_token)
            .collect();

        let text = self
            .tokenizer
            .decode(&text_tokens, true)
            .map_err(|e| anyhow::anyhow!("Token decode failed: {e}"))?;

        Ok(text.trim().to_string())
    }

    /// Health check — verify model is loaded and can run a forward pass.
    pub fn ping(&mut self) -> Result<()> {
        // Generate a tiny silent audio segment and try to encode it
        let silence = vec![0.0f32; 16000]; // 1 second of silence
        let mel = m::audio::pcm_to_mel(&self.config, &silence, &self.mel_filters);
        let mel_len = mel.len() / self.config.num_mel_bins;
        let mel = Tensor::from_vec(mel, (1, self.config.num_mel_bins, mel_len), &self.device)?;
        let _ = self.model.encoder.forward(&mel, true)?;
        Ok(())
    }

    /// Look up a special token ID by name.
    fn token_id(&self, token: &str) -> Result<u32> {
        self.tokenizer
            .token_to_id(token)
            .ok_or_else(|| anyhow::anyhow!("Missing token '{token}' in Whisper tokenizer"))
    }
}
