//! Whisper STT via ONNX Runtime — speech-to-text transcription.
//!
//! Runs Whisper encoder + decoder ONNX models directly through ort.
//! No sherpa dependency — pure ort.
//!
//! Model: whisper-small directory containing:
//!   - encoder.onnx (or tiny-encoder.onnx)
//!   - decoder.onnx (or tiny-decoder.onnx)
//!   - tokens.txt
//!
//! Input: PCM f32, 16kHz mono (Whisper's native sample rate)
//! Output: transcribed text

use crate::backends::voice::{AudioSamples, SttBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};

/// Whisper STT backed by ort (ONNX Runtime).
pub struct WhisperStt {
    model_path: Option<PathBuf>,
    loaded: bool,
    // TODO: ort Sessions for encoder + decoder
    // encoder: Option<ort::Session>,
    // decoder: Option<ort::Session>,
}

impl WhisperStt {
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
        }
    }
}

impl Default for WhisperStt {
    fn default() -> Self {
        Self::new()
    }
}

impl SttBackend for WhisperStt {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "Whisper STT",
            "Loading Whisper STT model"
        );

        if !path.exists() {
            anyhow::bail!("Whisper model not found: {}", path.display());
        }

        // Whisper expects a directory with encoder + decoder + tokens
        if path.is_dir() {
            let has_tokens = path.join("tokens.txt").exists();
            if !has_tokens {
                anyhow::bail!(
                    "Whisper model directory missing tokens.txt: {}",
                    path.display()
                );
            }
            // TODO: Find encoder/decoder .onnx files, create Sessions
            // let encoder_path = find_onnx_file(path, "encoder")?;
            // let decoder_path = find_onnx_file(path, "decoder")?;
            // self.encoder = Some(ort::Session::builder()?.commit_from_file(encoder_path)?);
            // self.decoder = Some(ort::Session::builder()?.commit_from_file(decoder_path)?);
        }

        let size = dir_size(path);
        self.model_path = Some(path.to_path_buf());
        self.loaded = true;

        tracing::info!(
            component = "Whisper STT",
            size_mb = size / (1024 * 1024),
            "Whisper STT loaded"
        );

        Ok(MemoryFootprint {
            ram_bytes: size,
            vram_bytes: 0,
        })
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        tracing::info!(component = "Whisper STT", "Unloading Whisper STT");
        // self.encoder = None;
        // self.decoder = None;
        self.model_path = None;
        self.loaded = false;
        Ok(())
    }

    fn transcribe(&self, samples: &AudioSamples) -> anyhow::Result<String> {
        if !self.loaded {
            anyhow::bail!("Whisper STT not loaded");
        }

        tracing::debug!(
            component = "Whisper STT",
            sample_count = samples.data.len(),
            sample_rate = samples.sample_rate,
            "Transcribing audio"
        );

        // Whisper expects 16kHz input — resample if needed
        if samples.sample_rate != 16000 {
            tracing::warn!(
                component = "Whisper STT",
                got = samples.sample_rate,
                expected = 16000,
                "Sample rate mismatch — resampling needed"
            );
        }

        // TODO: Run encoder → decoder pipeline
        // let mel = compute_mel_spectrogram(&samples.data, samples.sample_rate)?;
        // let encoder_out = self.encoder.run(ort::inputs!["mel" => mel]?)?;
        // let decoder_out = self.decoder.run(ort::inputs![
        //     "encoder_hidden_states" => encoder_out["last_hidden_state"],
        //     "input_ids" => start_tokens,
        // ]?)?;
        // let text = detokenize(decoder_out)?;

        Ok(String::new())
    }

    fn memory_usage(&self) -> MemoryFootprint {
        if let Some(ref path) = self.model_path {
            let size = dir_size(path);
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

/// Recursively compute directory size in bytes.
fn dir_size(path: &Path) -> u64 {
    if path.is_file() {
        return std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    }
    std::fs::read_dir(path)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .map(|e| {
                    let p = e.path();
                    if p.is_dir() {
                        dir_size(&p)
                    } else {
                        std::fs::metadata(&p).map(|m| m.len()).unwrap_or(0)
                    }
                })
                .sum()
        })
        .unwrap_or(0)
}
