//! Voice pool — manages TTS, STT, and audio decoder sessions.
//!
//! Separate from `BackendPool` (which manages LLM inference via Candle).
//! Voice models run through `ort` (ONNX Runtime) and produce/consume audio,
//! not text tokens.
//!
//! Thread safety: `sessions` and `footprints` are behind `Mutex` because
//! Tauri commands are concurrent — `speak()` and `transcribe_audio()` can
//! fire simultaneously. Pattern matches SNAC decoder (`snac.rs:26`).

use crate::backends::voice::{AudioSamples, SttBackend, TtsBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::slots::types::ModelCapability;
use std::collections::HashMap;
use std::path::Path;
use std::sync::Mutex;

/// A loaded voice session in the pool.
enum VoiceSession {
    /// Text-to-Speech backend (Kokoro).
    Tts(Box<dyn TtsBackend>),
    /// Speech-to-Text backend (Whisper).
    Stt(Box<dyn SttBackend>),
}

/// Manages voice model sessions — one per slot.
///
/// All access to `sessions` and `footprints` goes through `Mutex::lock()`.
/// Poisoned mutex = hard error, not silent failure.
pub struct VoicePool {
    /// slot_id → voice session (TTS or STT).
    sessions: Mutex<HashMap<String, VoiceSession>>,
    /// slot_id → memory footprint of loaded model.
    footprints: Mutex<HashMap<String, MemoryFootprint>>,
}

impl VoicePool {
    /// Create an empty voice pool.
    #[must_use]
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
            footprints: Mutex::new(HashMap::new()),
        }
    }

    /// Load a voice model for a slot. Creates the appropriate backend
    /// based on capability.
    #[cfg(feature = "ort-backend")]
    pub fn load(
        &self,
        slot_id: &str,
        model_path: &Path,
        capability: ModelCapability,
        params: LoadParams,
    ) -> anyhow::Result<MemoryFootprint> {
        // Unload existing session for this slot if any
        self.unload(slot_id);

        match capability {
            ModelCapability::TextToSpeech => {
                let mut backend = crate::backends::ort::kokoro::KokoroTts::new();
                let footprint = backend.load(model_path, params)?;
                let mut sessions = self.sessions.lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
                let mut footprints = self.footprints.lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool footprints mutex poisoned: {e}"))?;
                sessions.insert(slot_id.to_string(), VoiceSession::Tts(Box::new(backend)));
                footprints.insert(slot_id.to_string(), footprint);
                tracing::info!(slot = %slot_id, "VoicePool: TTS model loaded");
                Ok(footprint)
            }
            ModelCapability::SpeechToText => {
                let mut backend = crate::backends::ort::whisper::WhisperStt::new();
                let footprint = backend.load(model_path, params)?;
                let mut sessions = self.sessions.lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
                let mut footprints = self.footprints.lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool footprints mutex poisoned: {e}"))?;
                sessions.insert(slot_id.to_string(), VoiceSession::Stt(Box::new(backend)));
                footprints.insert(slot_id.to_string(), footprint);
                tracing::info!(slot = %slot_id, "VoicePool: STT model loaded");
                Ok(footprint)
            }
            other => {
                anyhow::bail!("VoicePool does not handle capability: {other}");
            }
        }
    }

    /// Load — not available without ort-backend feature.
    #[cfg(not(feature = "ort-backend"))]
    pub fn load(
        &self,
        slot_id: &str,
        _model_path: &Path,
        _capability: ModelCapability,
        _params: LoadParams,
    ) -> anyhow::Result<MemoryFootprint> {
        anyhow::bail!("ort-backend feature not compiled — cannot load voice model for slot '{slot_id}'")
    }

    /// Unload a voice model from a slot.
    pub fn unload(&self, slot_id: &str) -> Option<MemoryFootprint> {
        let removed = self.sessions.lock()
            .map(|mut s| s.remove(slot_id))
            .ok()?;
        if removed.is_some() {
            tracing::info!(slot = %slot_id, "VoicePool: session unloaded");
        }
        self.footprints.lock()
            .map(|mut f| f.remove(slot_id))
            .ok()?
    }

    /// Check if a slot has a loaded voice session.
    #[must_use]
    pub fn is_loaded(&self, slot_id: &str) -> bool {
        self.sessions.lock()
            .map(|s| s.contains_key(slot_id))
            .unwrap_or(false)
    }

    /// Synthesize speech for a TTS slot.
    pub fn synthesize(&self, slot_id: &str, text: &str, voice: &str) -> anyhow::Result<AudioSamples> {
        let sessions = self.sessions.lock()
            .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
        match sessions.get(slot_id) {
            Some(VoiceSession::Tts(backend)) => backend.synthesize(text, voice),
            Some(VoiceSession::Stt(_)) => anyhow::bail!("Slot '{slot_id}' is STT, not TTS"),
            None => anyhow::bail!("No voice model loaded in slot '{slot_id}'"),
        }
    }

    /// Transcribe audio for an STT slot.
    pub fn transcribe(&self, slot_id: &str, samples: &AudioSamples) -> anyhow::Result<String> {
        let sessions = self.sessions.lock()
            .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
        match sessions.get(slot_id) {
            Some(VoiceSession::Stt(backend)) => backend.transcribe(samples),
            Some(VoiceSession::Tts(_)) => anyhow::bail!("Slot '{slot_id}' is TTS, not STT"),
            None => anyhow::bail!("No voice model loaded in slot '{slot_id}'"),
        }
    }

    /// Memory footprint for a loaded slot.
    #[must_use]
    pub fn memory(&self, slot_id: &str) -> Option<MemoryFootprint> {
        self.footprints.lock()
            .map(|f| f.get(slot_id).copied())
            .ok()?
    }

    /// Total memory used by all voice models.
    #[must_use]
    pub fn total_memory(&self) -> MemoryFootprint {
        let mut total = MemoryFootprint::default();
        if let Ok(footprints) = self.footprints.lock() {
            for fp in footprints.values() {
                total.ram_bytes += fp.ram_bytes;
                total.vram_bytes += fp.vram_bytes;
            }
        }
        total
    }

    /// Shutdown all voice sessions.
    pub fn shutdown_all(&self) {
        if let Ok(mut sessions) = self.sessions.lock() {
            sessions.clear();
        }
        if let Ok(mut footprints) = self.footprints.lock() {
            footprints.clear();
        }
        tracing::info!("VoicePool: all sessions shut down");
    }
}

impl Default for VoicePool {
    fn default() -> Self {
        Self::new()
    }
}
