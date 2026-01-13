// engine/src/facade/voice_discovery.rs

//! Voice Discovery Facade - Wraps voice model discovery for engine consumers
//!
//! Provides:
//! - Scan folders for Whisper/Kokoro models
//! - Track selected models
//! - Check readiness status

use crate::EngineError;
use orchestrator::infra::audio::voice::voice_discovery::{
    DiscoveredKokoroModel, DiscoveredWhisperModel, VoiceDiscoveryResult, VoiceModelManager,
};
use std::path::Path;
use std::sync::Arc;
use tracing::instrument;

/// Voice discovery facade
pub struct VoiceDiscoveryFacade {
    manager: Arc<VoiceModelManager>,
}

impl VoiceDiscoveryFacade {
    /// Create new facade
    pub fn new() -> Self {
        Self {
            manager: Arc::new(VoiceModelManager::new()),
        }
    }

    /// Set model directory and scan for voice models
    #[instrument(skip(self), fields(path = %path.display()))]
    pub async fn set_model_directory(&self, path: &Path) -> Result<VoiceDiscoveryResult, EngineError> {
        self.manager
            .set_model_directory(path)
            .await
            .map_err(|e| EngineError::Voice(format!("Failed to scan voice models: {}", e)))
    }

    /// Get current discovery result
    pub async fn get_discovery(&self) -> Option<VoiceDiscoveryResult> {
        self.manager.get_discovery().await
    }

    /// Get all discovered Whisper models
    pub async fn get_whisper_models(&self) -> Vec<DiscoveredWhisperModel> {
        self.manager
            .get_discovery()
            .await
            .map(|d| d.whisper_models)
            .unwrap_or_default()
    }

    /// Get all discovered Kokoro models
    pub async fn get_kokoro_models(&self) -> Vec<DiscoveredKokoroModel> {
        self.manager
            .get_discovery()
            .await
            .map(|d| d.kokoro_models)
            .unwrap_or_default()
    }

    /// Get selected Whisper model
    pub async fn get_selected_whisper(&self) -> Option<DiscoveredWhisperModel> {
        self.manager.get_selected_whisper().await
    }

    /// Get selected Kokoro model
    pub async fn get_selected_kokoro(&self) -> Option<DiscoveredKokoroModel> {
        self.manager.get_selected_kokoro().await
    }

    /// Select a Whisper model
    #[instrument(skip(self))]
    pub async fn select_whisper(&self, id: &str) -> Result<DiscoveredWhisperModel, EngineError> {
        self.manager
            .select_whisper(id)
            .await
            .map_err(|e| EngineError::Voice(format!("Failed to select Whisper model: {}", e)))
    }

    /// Select a Kokoro model
    #[instrument(skip(self))]
    pub async fn select_kokoro(&self, id: &str) -> Result<DiscoveredKokoroModel, EngineError> {
        self.manager
            .select_kokoro(id)
            .await
            .map_err(|e| EngineError::Voice(format!("Failed to select Kokoro model: {}", e)))
    }

    /// Check if STT is ready
    pub async fn is_stt_ready(&self) -> bool {
        self.manager.is_stt_ready().await
    }

    /// Check if TTS is ready
    pub async fn is_tts_ready(&self) -> bool {
        self.manager.is_tts_ready().await
    }
}

impl Default for VoiceDiscoveryFacade {
    fn default() -> Self {
        Self::new()
    }
}
