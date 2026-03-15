//! Voice service wrapper (`Kokoros` — embedded TTS engine).
//!
//! Wraps the Kokoros adapter for text-to-speech synthesis.
//! Part of the Maestro AI pipeline for voice output.

use super::{Service, ServiceRole};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::KokorosAdapter;
use std::sync::Arc;

/// Voice service backed by Kokoros (embedded ONNX TTS).
pub struct VoiceService {
    adapter: Arc<KokorosAdapter>,
}

impl VoiceService {
    /// Boot the voice service with model and voice data paths.
    ///
    /// # Errors
    /// Returns error if the Kokoros engine fails to initialize.
    pub async fn boot(model_path: &std::path::Path, voices_path: &std::path::Path) -> Result<Self> {
        let adapter = KokorosAdapter::boot(model_path, voices_path).await?;
        Ok(Self {
            adapter: Arc::new(adapter),
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<KokorosAdapter> {
        &self.adapter
    }
}

impl Service for VoiceService {
    fn name(&self) -> &'static str {
        "Voice service"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Voice
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn is_ready(&self) -> bool {
        true
    }
}
