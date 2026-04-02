//! SNAC audio decoder — ONNX Runtime implementation.
//!
//! SNAC (Speech Neural Audio Codec) converts audio tokens from Orpheus TTS
//! into raw PCM waveform. Runs via `ort` crate on CPU.
//!
//! Pipeline: Orpheus LLM → 7-per-frame token groups → redistribute → SNAC → PCM
//!
//! Model: `snac24_int2wav_static.onnx` (~25MB)
//! Inputs: codes0[1,12] + codes1[1,24] + codes2[1,48] (int64)
//! Output: audio[1,1,24576] (f32, 24kHz mono, ~1.024s per window)

use crate::backends::voice::{AudioDecoderBackend, AudioSamples};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};

/// SNAC decoder backed by ONNX Runtime.
pub struct SnacDecoder {
    model_path: Option<PathBuf>,
    loaded: bool,
    // TODO: ort::Session stored here once ort crate is wired
    // session: Option<ort::Session>,
}

impl SnacDecoder {
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

        // TODO: Initialize ort::Session
        // let session = ort::Session::builder()?
        //     .with_optimization_level(ort::GraphOptimizationLevel::Level3)?
        //     .commit_from_file(path)?;
        // self.session = Some(session);

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
            vram_bytes: 0,
        })
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        tracing::info!(component = "SNAC", "Unloading SNAC decoder");
        // self.session = None;
        self.model_path = None;
        self.loaded = false;
        Ok(())
    }

    fn decode(
        &self,
        codes0: &[i64],
        codes1: &[i64],
        codes2: &[i64],
    ) -> anyhow::Result<AudioSamples> {
        if !self.loaded {
            anyhow::bail!("SNAC decoder not loaded — call load() first");
        }

        if codes0.len() != 12 || codes1.len() != 24 || codes2.len() != 48 {
            anyhow::bail!(
                "SNAC expects codes0[12] + codes1[24] + codes2[48], got [{}, {}, {}]",
                codes0.len(),
                codes1.len(),
                codes2.len()
            );
        }

        tracing::debug!(component = "SNAC", "Decoding 84 tokens → 24576 PCM samples");

        // TODO: Run ort session inference
        // let codes0_arr = ndarray::Array2::<i64>::from_shape_vec((1, 12), codes0.to_vec())?;
        // let codes1_arr = ndarray::Array2::<i64>::from_shape_vec((1, 24), codes1.to_vec())?;
        // let codes2_arr = ndarray::Array2::<i64>::from_shape_vec((1, 48), codes2.to_vec())?;
        // let outputs = self.session.as_ref().unwrap().run(ort::inputs![
        //     "codes0" => codes0_arr,
        //     "codes1" => codes1_arr,
        //     "codes2" => codes2_arr,
        // ]?)?;
        // let audio = outputs["audio"].try_extract_tensor::<f32>()?.into_owned();
        // let pcm = audio.into_raw_vec();

        // Placeholder: silence until ort is wired
        let pcm = vec![0.0f32; 24576];

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
