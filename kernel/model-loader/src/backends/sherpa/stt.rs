//! Whisper STT via sherpa-rs — speech-to-text transcription.
//!
//! Uses sherpa-onnx Whisper model directory format.
//! Supports VAD (Voice Activity Detection) via Silero.
//!
//! Model: `sherpa-onnx-whisper-small/` directory
//! Input: PCM f32, 16kHz mono
//! Output: transcribed text

use crate::backends::voice::{AudioSamples, SttBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::path::{Path, PathBuf};

/// Whisper STT backed by sherpa-rs.
pub struct WhisperStt {
    model_path: Option<PathBuf>,
    loaded: bool,
    /// Whether VAD (Silero) is enabled for this instance.
    vad_enabled: bool,
}

impl WhisperStt {
    #[must_use]
    pub fn new(vad_enabled: bool) -> Self {
        Self {
            model_path: None,
            loaded: false,
            vad_enabled,
        }
    }
}

impl SttBackend for WhisperStt {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "Whisper STT",
            vad = self.vad_enabled,
            "Loading Whisper STT model"
        );

        if !path.exists() {
            anyhow::bail!("Whisper model not found: {}", path.display());
        }

        // Sherpa Whisper expects a directory containing:
        //   - encoder.onnx / decoder.onnx (or combined)
        //   - tokens.txt
        //   - Optional: model config
        if path.is_dir() {
            let tokens_path = path.join("tokens.txt");
            if !tokens_path.exists() {
                anyhow::bail!(
                    "Whisper model directory missing tokens.txt: {}",
                    path.display()
                );
            }
        }

        // TODO: Initialize sherpa-rs recognizer
        // let config = sherpa_rs::asr::OnlineRecognizerConfig { ... };
        // if self.vad_enabled {
        //     config.vad = sherpa_rs::vad::SileroVadConfig { ... };
        // }
        // let recognizer = sherpa_rs::asr::OnlineRecognizer::new(config)?;

        // Estimate directory size
        let size = if path.is_dir() {
            dir_size(path)
        } else {
            std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
        };

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
        self.model_path = None;
        self.loaded = false;
        Ok(())
    }

    fn transcribe(&self, samples: &AudioSamples) -> anyhow::Result<String> {
        if !self.loaded {
            anyhow::bail!("Whisper STT not loaded — call load() first");
        }

        tracing::debug!(
            component = "Whisper STT",
            sample_count = samples.data.len(),
            sample_rate = samples.sample_rate,
            "Transcribing audio"
        );

        // TODO: Run sherpa recognizer
        // let stream = self.recognizer.create_stream();
        // stream.accept_waveform(samples.sample_rate as i32, &samples.data);
        // let result = self.recognizer.decode_stream(&stream);

        // Placeholder
        Ok(String::new())
    }

    fn memory_usage(&self) -> MemoryFootprint {
        if let Some(ref path) = self.model_path {
            let size = if path.is_dir() {
                dir_size(path)
            } else {
                std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
            };
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
