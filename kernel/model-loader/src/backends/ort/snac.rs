//! SNAC audio decoder — ONNX Runtime implementation.
//!
//! SNAC (Speech Neural Audio Codec) converts audio tokens from Orpheus TTS
//! into raw PCM waveform. Runs via `ort` crate on CPU.
//!
//! Model: `snac24_int2wav_static.onnx` (~25MB)
//! Inputs: codes0[1,12] + codes1[1,24] + codes2[1,48] (int64)
//! Output: audio[1,1,24576] (f32, 24kHz mono, ~1.024s per window)

use crate::backends::voice::{AudioDecoderBackend, AudioSamples};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};
#[cfg(feature = "ort-backend")]
use std::sync::Mutex;

/// Samples per SNAC decode window (48 frames × 512 samples/frame).
pub const SAMPLES_PER_WINDOW: usize = 24576;
/// Sample rate for SNAC 24kHz model.
pub const SAMPLE_RATE: u32 = 24000;

/// SNAC decoder backed by ONNX Runtime.
pub struct SnacDecoder {
    model_path: Option<PathBuf>,
    loaded: bool,
    #[cfg(feature = "ort-backend")]
    session: Mutex<Option<ort::session::Session>>,
}

impl SnacDecoder {
    /// Create a new SNAC audio decoder instance (unloaded).
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
            #[cfg(feature = "ort-backend")]
            session: Mutex::new(None),
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

        #[cfg(feature = "ort-backend")]
        {
            let session = ort::session::Session::builder()
                .map_err(|e| anyhow::anyhow!("Failed to create ort SessionBuilder: {e}"))?
                .commit_from_file(path)
                .map_err(|e| anyhow::anyhow!("Failed to load SNAC ONNX model: {e}"))?;
            *self.session.lock().map_err(|e| anyhow::anyhow!("Session mutex poisoned: {e}"))? = Some(session);
        }

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
        #[cfg(feature = "ort-backend")]
        {
            *self.session.lock().map_err(|e| anyhow::anyhow!("Session mutex poisoned: {e}"))? = None;
        }
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
            anyhow::bail!("SNAC decoder not loaded");
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

        #[cfg(feature = "ort-backend")]
        {
            use ort::value::Value;

            let mut guard = self.session.lock()
                .map_err(|e| anyhow::anyhow!("Session mutex poisoned: {e}"))?;
            let session = guard
                .as_mut()
                .ok_or_else(|| anyhow::anyhow!("SNAC session not initialized"))?;

            let c0 = ndarray::Array2::<i64>::from_shape_vec((1, 12), codes0.to_vec())
                .map_err(|e| anyhow::anyhow!("Failed to create codes0 tensor: {e}"))?;
            let c1 = ndarray::Array2::<i64>::from_shape_vec((1, 24), codes1.to_vec())
                .map_err(|e| anyhow::anyhow!("Failed to create codes1 tensor: {e}"))?;
            let c2 = ndarray::Array2::<i64>::from_shape_vec((1, 48), codes2.to_vec())
                .map_err(|e| anyhow::anyhow!("Failed to create codes2 tensor: {e}"))?;

            let v0 = Value::from_array(c0)
                .map_err(|e| anyhow::anyhow!("Failed to create ort Value for codes0: {e}"))?;
            let v1 = Value::from_array(c1)
                .map_err(|e| anyhow::anyhow!("Failed to create ort Value for codes1: {e}"))?;
            let v2 = Value::from_array(c2)
                .map_err(|e| anyhow::anyhow!("Failed to create ort Value for codes2: {e}"))?;

            let outputs = session
                .run(ort::inputs![v0, v1, v2])
                .map_err(|e| anyhow::anyhow!("SNAC inference failed: {e}"))?;

            let audio_value = &outputs[0];
            let audio_tensor = audio_value
                .try_extract_tensor::<f32>()
                .map_err(|e| anyhow::anyhow!("Failed to extract SNAC audio output: {e}"))?;

            let pcm: Vec<f32> = audio_tensor.1.to_vec();

            return Ok(AudioSamples {
                data: pcm,
                sample_rate: SAMPLE_RATE,
                channels: 1,
            });
        }

        #[cfg(not(feature = "ort-backend"))]
        {
            tracing::warn!(component = "SNAC", "ort-backend feature not enabled — returning silence");
            Ok(AudioSamples {
                data: vec![0.0f32; SAMPLES_PER_WINDOW],
                sample_rate: SAMPLE_RATE,
                channels: 1,
            })
        }
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
