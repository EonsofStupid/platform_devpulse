//! Kokoro TTS via ONNX Runtime — fallback voice.
//!
//! Runs Kokoro ONNX model directly through ort. No sherpa dependency.
//! Lower quality than Orpheus but faster and lighter.
//!
//! Model: kokoro.onnx (~80MB) or Kokoro_espeak_Q8.gguf (sherpa format)
//! For ort path: needs ONNX export of Kokoro
//! Output: PCM f32, 24kHz mono

use crate::backends::voice::{AudioSamples, TtsBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};

/// Kokoro TTS backed by ort (ONNX Runtime).
pub struct KokoroTts {
    model_path: Option<PathBuf>,
    loaded: bool,
    // TODO: ort::Session
    // session: Option<ort::Session>,
}

impl KokoroTts {
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
        }
    }
}

impl Default for KokoroTts {
    fn default() -> Self {
        Self::new()
    }
}

impl TtsBackend for KokoroTts {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "Kokoro TTS",
            "Loading Kokoro TTS model"
        );

        if !path.exists() {
            anyhow::bail!("Kokoro model not found: {}", path.display());
        }

        // TODO: Create ort::Session
        // self.session = Some(ort::Session::builder()?.commit_from_file(path)?);

        let file_size = std::fs::metadata(path)?.len();
        self.model_path = Some(path.to_path_buf());
        self.loaded = true;

        tracing::info!(
            component = "Kokoro TTS",
            size_mb = file_size / (1024 * 1024),
            "Kokoro TTS loaded"
        );

        Ok(MemoryFootprint {
            ram_bytes: file_size,
            vram_bytes: 0,
        })
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        tracing::info!(component = "Kokoro TTS", "Unloading Kokoro TTS");
        // self.session = None;
        self.model_path = None;
        self.loaded = false;
        Ok(())
    }

    fn synthesize(&self, text: &str, _voice: &str) -> anyhow::Result<AudioSamples> {
        if !self.loaded {
            anyhow::bail!("Kokoro TTS not loaded");
        }

        tracing::debug!(
            component = "Kokoro TTS",
            text_len = text.len(),
            "Synthesizing speech"
        );

        // TODO: Run ort inference
        // let input_ids = tokenize_kokoro(text)?;
        // let outputs = self.session.run(ort::inputs!["input_ids" => input_ids]?)?;
        // let audio = outputs["audio"].try_extract_tensor::<f32>()?.into_owned();

        // Placeholder: silence
        let sample_count = (text.len() * 4000).min(24000 * 30);
        Ok(AudioSamples {
            data: vec![0.0f32; sample_count],
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
