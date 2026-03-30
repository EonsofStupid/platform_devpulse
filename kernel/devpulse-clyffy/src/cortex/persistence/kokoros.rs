//! Kokoros TTS adapter — embedded voice synthesis engine.
//!
//! Wraps the `kokoros` crate's `TTSKoko` for text-to-speech synthesis.
//! Boots the ONNX model + voice styles, provides health check via
//! voice listing, and exposes raw audio synthesis.

use anyhow::{Context, Result};
use kokoros::tts::koko::TTSKoko;
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Kokoros TTS adapter — voice synthesis via embedded ONNX model.
pub struct KokorosAdapter {
    engine: Arc<RwLock<TTSKoko>>,
}

impl KokorosAdapter {
    /// Boot the Kokoros TTS engine.
    ///
    /// Loads the ONNX model from `model_path` and voice styles from `voices_path`.
    /// Both directories must exist and contain valid model/voice data.
    ///
    /// # Errors
    /// Returns error if model loading or voice style parsing fails.
    pub async fn boot(model_path: &Path, voices_path: &Path) -> Result<Self> {
        let model_str = model_path
            .to_str()
            .context("Model path is not valid UTF-8")?;
        let voices_str = voices_path
            .to_str()
            .context("Voices path is not valid UTF-8")?;

        let engine = TTSKoko::new(model_str, voices_str).await;

        Ok(Self {
            engine: Arc::new(RwLock::new(engine)),
        })
    }

    /// Health check — verify the engine is loaded and has voices available.
    ///
    /// # Errors
    /// Returns error if no voices are loaded.
    pub async fn ping(&self) -> Result<()> {
        let engine = self.engine.read().await;
        let voices = engine.get_available_voices();
        if voices.is_empty() {
            anyhow::bail!("Kokoros engine has no loaded voices");
        }
        Ok(())
    }

    /// List available voice styles.
    pub async fn available_voices(&self) -> Vec<String> {
        let engine = self.engine.read().await;
        engine.get_available_voices()
    }

    /// Synthesize text to raw audio samples (f32, 24kHz).
    ///
    /// # Errors
    /// Returns error if synthesis fails.
    pub async fn synthesize(
        &self,
        text: &str,
        language: &str,
        voice: &str,
        speed: f32,
    ) -> Result<Vec<f32>> {
        let engine = self.engine.read().await;
        engine
            .tts_raw_audio(text, language, voice, speed, None, None, None, None)
            .map_err(|e| anyhow::anyhow!("Kokoros synthesis failed: {e}"))
    }

    /// Get the underlying engine handle.
    pub fn engine(&self) -> &Arc<RwLock<TTSKoko>> {
        &self.engine
    }
}
