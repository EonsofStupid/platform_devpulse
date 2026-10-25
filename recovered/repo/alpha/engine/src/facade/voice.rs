// engine/src/facade/voice.rs

//! Voice facade - STT and TTS
//!
//! Wraps orchestrator voice backend with graceful degradation.
//! Audio format: 16kHz mono f32 samples.
//!
//! ## Initialization Flow
//!
//! 1. `VoiceFacade::new()` creates empty facade (no backend)
//! 2. `init_with_paths()` initializes backend when model path is configured
//! 3. Methods check for backend presence and return helpful errors if missing

use crate::error::EngineError;
use orchestrator::infra::audio::voice::{ModelPaths, ModelStatus, VoiceBackend};
use tracing::instrument;

/// Voice facade - wraps VoiceBackend with graceful degradation
///
/// Backend is optional until user configures a voice model directory.
/// All methods handle the missing backend case gracefully.
pub struct VoiceFacade {
    backend: Option<VoiceBackend>,
    status: ModelStatus,
}

impl VoiceFacade {
    /// Create new voice facade without backend
    ///
    /// Call `init_with_paths()` after discovering voice models to enable functionality.
    pub fn new() -> Self {
        Self {
            backend: None,
            status: ModelStatus {
                whisper_ready: false,
                whisper_missing: vec!["Not configured".to_string()],
                kokoro_ready: false,
                kokoro_missing: vec!["Not configured".to_string()],
                voices: vec![],
            },
        }
    }

    /// Initialize voice backend with model paths
    ///
    /// Call this after voice model discovery has found valid models.
    /// Returns true if at least one of STT/TTS is ready.
    pub fn init_with_paths(&mut self, paths: ModelPaths) -> bool {
        let backend = VoiceBackend::with_paths(paths);
        self.status = backend.verify_models();

        if self.status.whisper_ready {
            tracing::info!("Whisper STT: READY");
        } else {
            tracing::warn!(
                "Whisper STT: INCOMPLETE (missing: {:?})",
                self.status.whisper_missing
            );
        }

        if self.status.kokoro_ready {
            tracing::info!("Kokoro TTS: READY");
        } else {
            tracing::warn!(
                "Kokoro TTS: INCOMPLETE (missing: {:?})",
                self.status.kokoro_missing
            );
        }

        self.backend = Some(backend);
        self.status.whisper_ready || self.status.kokoro_ready
    }

    /// Check if backend is initialized
    pub fn is_initialized(&self) -> bool {
        self.backend.is_some()
    }

    /// Initialize voice backends (Whisper + Kokoro)
    /// Returns Ok even if models are missing (graceful degradation)
    pub async fn init(&mut self) -> Result<(), EngineError> {
        // Re-verify models in case they were downloaded
        if let Some(ref backend) = self.backend {
            self.status = backend.verify_models();
        }
        tracing::info!(
            "Voice initialized: STT={}, TTS={}",
            if self.status.whisper_ready {
                "ready"
            } else {
                "unavailable"
            },
            if self.status.kokoro_ready {
                "ready"
            } else {
                "unavailable"
            }
        );
        Ok(())
    }

    /// Is voice ready? (at least one of STT/TTS available)
    pub fn is_ready(&self) -> bool {
        self.status.whisper_ready || self.status.kokoro_ready
    }

    /// Is STT (Whisper) ready?
    pub fn is_stt_ready(&self) -> bool {
        self.status.whisper_ready
    }

    /// Is TTS (Kokoro) ready?
    pub fn is_tts_ready(&self) -> bool {
        self.status.kokoro_ready
    }

    /// Get model status for diagnostics
    pub fn model_status(&self) -> &ModelStatus {
        &self.status
    }

    /// Get download instructions for missing models
    pub fn download_instructions(&self) -> String {
        match &self.backend {
            Some(backend) => backend.download_instructions(),
            None => {
                "Voice not configured.\n\n\
                To set up voice:\n\
                1. Go to Settings → Voice\n\
                2. Browse to select your voice models folder\n\
                3. The folder should contain:\n\
                   - whisper-medium/ (for STT)\n\
                   - kokoro/ (for TTS)\n\n\
                Download models from: https://github.com/k2-fsa/sherpa-onnx/releases".to_string()
            }
        }
    }

    /// Transcribe audio to text (STT)
    ///
    /// Audio must be 16kHz mono f32 samples in range [-1.0, 1.0]
    #[instrument(skip(self, audio), fields(samples = audio.len()))]
    pub fn transcribe(&self, audio: &[f32]) -> Result<String, EngineError> {
        let backend = self.backend.as_ref().ok_or_else(|| {
            EngineError::Voice(
                "Voice not configured. Go to Settings → Voice to set up voice models.".into(),
            )
        })?;

        if !self.status.whisper_ready {
            return Err(EngineError::Voice(
                "Whisper STT not available. Check Settings → Voice for download instructions.".into(),
            ));
        }

        match backend.transcribe(audio, 16000) {
            Ok(result) => {
                tracing::debug!(
                    text = %result.text,
                    duration_ms = result.duration_ms,
                    "Transcription complete"
                );
                Ok(result.text)
            }
            Err(e) => {
                tracing::error!(error = %e, "Transcription failed");
                Err(EngineError::Voice(format!("Transcription failed: {}", e)))
            }
        }
    }

    /// Convert text to speech (TTS)
    ///
    /// Returns 16kHz mono f32 samples
    #[instrument(skip(self), fields(text_len = text.len()))]
    pub fn speak(&self, text: &str) -> Result<TtsResult, EngineError> {
        let backend = self.backend.as_ref().ok_or_else(|| {
            EngineError::Voice(
                "Voice not configured. Go to Settings → Voice to set up voice models.".into(),
            )
        })?;

        if !self.status.kokoro_ready {
            return Err(EngineError::Voice(
                "Kokoro TTS not available. Check Settings → Voice for download instructions.".into(),
            ));
        }

        match backend.speak(text) {
            Ok(result) => {
                tracing::debug!(
                    samples = result.audio.len(),
                    sample_rate = result.sample_rate,
                    duration_ms = result.duration_ms,
                    "TTS synthesis complete"
                );
                Ok(TtsResult {
                    audio: result.audio,
                    sample_rate: result.sample_rate,
                })
            }
            Err(e) => {
                tracing::error!(error = %e, "TTS synthesis failed");
                Err(EngineError::Voice(format!("TTS synthesis failed: {}", e)))
            }
        }
    }

    /// Synthesize with specific speaker and speed
    #[instrument(skip(self), fields(text_len = text.len(), speaker_id, speed))]
    pub fn synthesize(
        &self,
        text: &str,
        speaker_id: i32,
        speed: f32,
    ) -> Result<TtsResult, EngineError> {
        let backend = self.backend.as_ref().ok_or_else(|| {
            EngineError::Voice(
                "Voice not configured. Go to Settings → Voice to set up voice models.".into(),
            )
        })?;

        if !self.status.kokoro_ready {
            return Err(EngineError::Voice(
                "Kokoro TTS not available. Check Settings → Voice for download instructions.".into(),
            ));
        }

        match backend.synthesize(text, speaker_id, speed) {
            Ok(result) => Ok(TtsResult {
                audio: result.audio,
                sample_rate: result.sample_rate,
            }),
            Err(e) => Err(EngineError::Voice(format!("TTS synthesis failed: {}", e))),
        }
    }

    /// List available voice profiles
    pub fn list_voices(&self) -> Result<Vec<String>, EngineError> {
        match &self.backend {
            Some(backend) => backend
                .list_voices()
                .map_err(|e| EngineError::Voice(format!("Failed to list voices: {}", e))),
            None => Ok(vec![]),
        }
    }
}

/// TTS synthesis result
#[derive(Debug, Clone)]
pub struct TtsResult {
    /// Audio samples (f32, mono)
    pub audio: Vec<f32>,
    /// Sample rate (typically 22050 for Kokoro)
    pub sample_rate: u32,
}

impl Default for VoiceFacade {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_voice_facade_creation() {
        let facade = VoiceFacade::new();
        // Should be created but not initialized
        assert!(!facade.is_initialized());
        assert!(!facade.is_ready());
        let status = facade.model_status();
        println!("Model status: {}", status);
        println!("\nDownload instructions:\n{}", facade.download_instructions());
    }

    #[test]
    fn test_voice_facade_without_backend() {
        let facade = VoiceFacade::new();
        // Transcribe should return helpful error
        let result = facade.transcribe(&[0.0; 1000]);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("not configured"));
    }
}
