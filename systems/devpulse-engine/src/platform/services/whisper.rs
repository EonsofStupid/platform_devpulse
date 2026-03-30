//! Whisper ASR service — Candle-based speech-to-text (CPU burst mode).
//!
//! Wraps the Candle Whisper adapter as a platform service.
//! Transcribes audio to text on demand — not streaming.
//!
//! CPU burst mode: model stays loaded, inference runs on `spawn_blocking`.
//! Uses `Mutex` because Whisper forward pass requires `&mut self`.

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_clyffy::cortex::persistence::WhisperAdapter;
use std::sync::{Arc, Mutex};

/// Whisper ASR service backed by Candle (CPU burst mode).
pub struct WhisperService {
    adapter: Arc<Mutex<WhisperAdapter>>,
}

impl WhisperService {
    /// Boot the Whisper service from a local model directory.
    ///
    /// Model directory must contain: `config.json`, `tokenizer.json`,
    /// `model.safetensors`, `melfilters.bytes`.
    ///
    /// # Errors
    /// Returns error if any model file is missing or the model fails to load.
    pub fn boot(model_dir: &std::path::Path) -> Result<Self> {
        let adapter = WhisperAdapter::load(model_dir)?;
        Ok(Self {
            adapter: Arc::new(Mutex::new(adapter)),
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<Mutex<WhisperAdapter>> {
        &self.adapter
    }
}

impl Service for WhisperService {
    fn name(&self) -> &'static str {
        "Whisper service"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Whisper
    }

    async fn ping(&self) -> Result<()> {
        let adapter = Arc::clone(&self.adapter);
        tokio::task::spawn_blocking(move || {
            let mut guard = adapter.lock().map_err(|e| anyhow::anyhow!("Lock poisoned: {e}"))?;
            guard.ping()
        })
        .await
        .map_err(|e| anyhow::anyhow!("Whisper ping spawn_blocking failed: {e}"))?
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }
}
