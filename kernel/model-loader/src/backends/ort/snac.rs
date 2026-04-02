//! SNAC audio decoder — ONNX Runtime implementation.
//!
//! SNAC (Speech Neural Audio Codec) converts audio tokens from Orpheus TTS
//! into raw PCM waveform. Runs via `ort` crate on CPU.
//!
//! Pipeline: Orpheus LLM → audio token IDs → SNAC decoder → PCM f32 → speakers
//!
//! Model: `snac_24khz.onnx` (~25MB)
//! Input: audio token tensor (i64)
//! Output: PCM waveform tensor (f32, 24kHz mono)

use crate::backends::voice::{AudioDecoderBackend, AudioSamples};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};

/// SNAC decoder backed by ONNX Runtime.
pub struct SnacDecoder {
    /// Path to loaded .onnx file, if loaded.
    model_path: Option<PathBuf>,
    /// ONNX session — None until load() is called.
    /// Type is `ort::Session` behind the feature gate.
    // session: Option<ort::Session>,
    loaded: bool,
}

impl SnacDecoder {
    /// Create a new unloaded SNAC decoder.
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
        }
    }
}

impl Default for SnacDecoder {
    fn default() -> Self {
        Self::new()
    }
}

impl AudioDecoderBackend for SnacDecoder {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "SNAC",
            "Loading SNAC audio decoder"
        );

        if !path.exists() {
            anyhow::bail!("SNAC model not found: {}", path.display());
        }

        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if ext != "onnx" {
            anyhow::bail!(
                "SNAC decoder requires .onnx file, got .{ext}: {}",
                path.display()
            );
        }

        // TODO: Initialize ort::Session here when ort crate is wired
        // let session = ort::Session::builder()?
        //     .with_optimization_level(ort::GraphOptimizationLevel::Level3)?
        //     .commit_from_file(path)?;

        let file_size = std::fs::metadata(path)?.len();

        self.model_path = Some(path.to_path_buf());
        self.loaded = true;

        tracing::info!(
            component = "SNAC",
            size_mb = file_size / (1024 * 1024),
            "SNAC decoder loaded"
        );

        Ok(MemoryFootprint {
            ram_bytes: file_size,
            vram_bytes: 0, // CPU-only
        })
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        tracing::info!(component = "SNAC", "Unloading SNAC decoder");
        self.model_path = None;
        self.loaded = false;
        Ok(())
    }

    fn decode(&self, audio_tokens: &[u32]) -> anyhow::Result<AudioSamples> {
        if !self.loaded {
            anyhow::bail!("SNAC decoder not loaded — call load() first");
        }

        tracing::debug!(
            component = "SNAC",
            token_count = audio_tokens.len(),
            "Decoding audio tokens to waveform"
        );

        // TODO: Run ort session inference
        // let input = ort::Value::from_array(audio_tokens.iter().map(|&t| t as i64).collect())?;
        // let outputs = self.session.as_ref().unwrap().run(ort::inputs![input]?)?;
        // let pcm: Vec<f32> = outputs[0].extract_tensor::<f32>()?.into_owned();

        // Placeholder: return silence until ort is wired
        let silence_duration_samples = audio_tokens.len() * 320; // rough: ~320 samples per token at 24kHz
        let pcm = vec![0.0f32; silence_duration_samples];

        Ok(AudioSamples {
            data: pcm,
            sample_rate: 24000,
            channels: 1,
        })
    }

    fn memory_usage(&self) -> MemoryFootprint {
        if let Some(ref path) = self.model_path {
            let size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
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
