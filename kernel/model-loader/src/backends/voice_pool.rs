//! Voice/capability pool — manages non-LLM model sessions.
//!
//! Separate from `BackendPool` (which manages LLM inference via Candle).
//! This pool owns every "capability" backend that runs through `ort` or
//! Candle-vision and produces things other than next-token logits:
//!
//! - **TTS** (`Kokoro`) — text → PCM
//! - **STT** (`Whisper`) — PCM → text
//! - **Text embedding** (`Qwen3` embedder) — text → dense vector
//! - **Reranker** (`Qwen3` cross-encoder) — (query, docs) → relevance scores
//! - **Vision embedding** (`SigLIP2`) — image → dense vector
//!
//! Name is historical — it started as `VoicePool` when only TTS/STT lived
//! here. The rest of the code still calls it `voice_pool`; renaming is a
//! separate cleanup.
//!
//! Thread safety: `sessions` and `footprints` are behind `Mutex` because
//! Tauri commands are concurrent — `speak()`, `transcribe_audio()`, and
//! `embed_text()` can fire simultaneously. Pattern matches SNAC decoder.

use crate::assistant::VoiceCloneEntry;
use crate::backends::voice::{AudioSamples, SttBackend, TtsBackend};
use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::slots::types::ModelCapability;
use crate::traits::capability::{EmbeddingBackend, RerankerBackend, VisionEmbeddingBackend};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Mutex;

/// A loaded capability session in the pool.
///
/// Variants are only constructed inside the `load()` method, which is
/// gated on `feature = "ort-backend"`. Under the default build (candle
/// only) none of the variants are reachable — dead-code analysis is
/// suppressed unconditionally since the dispatch methods below still
/// need to match on all of them.
#[allow(dead_code)]
enum VoiceSession {
    /// Text-to-Speech backend (Kokoro).
    Tts(Box<dyn TtsBackend>),
    /// Speech-to-Text backend (Whisper).
    Stt(Box<dyn SttBackend>),
    /// Dense text embedder (Qwen3-Embedding via ort).
    Embedding(Box<dyn EmbeddingBackend>),
    /// Cross-encoder reranker (Qwen3-Reranker via ort).
    Reranking(Box<dyn RerankerBackend>),
    /// Image encoder (`SigLIP2` via Candle).
    Vision(Box<dyn VisionEmbeddingBackend>),
}

/// Manages voice model sessions — one per slot.
///
/// All access to `sessions` and `footprints` goes through `Mutex::lock()`.
/// Poisoned mutex = hard error, not silent failure.
pub struct VoicePool {
    /// `slot_id` → voice session (TTS or STT).
    sessions: Mutex<HashMap<String, VoiceSession>>,
    /// `slot_id` → memory footprint of loaded model.
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
                // Qwen3-TTS path (safetensors talker + bundled codec) —
                // selected when the slot's preset declares
                // `backend_variant = "qwen3-tts-candle"`, OR when the
                // assigned file is a `.safetensors` (Kokoro is
                // ONNX-only). Same `TtsBackend` trait — replaces what
                // Kokoro otherwise covers, with voice-cloning support.
                // The dispatch hook (and the variant/ext bindings it
                // reads) only exists when the feature is compiled in;
                // otherwise the safetensors check is dead and we fall
                // straight through to the Kokoro path which then errors
                // cleanly on the wrong file extension.
                #[cfg(feature = "qwen3-tts-backend")]
                {
                    let variant = params.backend_variant.as_deref();
                    let ext = model_path
                        .extension()
                        .and_then(|e| e.to_str())
                        .unwrap_or("");
                    if variant == Some("qwen3-tts-candle") || ext == "safetensors" {
                        let mut backend = crate::backends::candle::Qwen3TtsBackend::new();
                        let footprint = backend.load(model_path, params)?;
                        let mut sessions =
                            self.sessions.lock().map_err(|e| {
                                anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}")
                            })?;
                        let mut footprints =
                            self.footprints.lock().map_err(|e| {
                                anyhow::anyhow!("VoicePool footprints mutex poisoned: {e}")
                            })?;
                        sessions
                            .insert(slot_id.to_string(), VoiceSession::Tts(Box::new(backend)));
                        footprints.insert(slot_id.to_string(), footprint);
                        tracing::info!(
                            slot = %slot_id,
                            backend = "qwen3-tts-candle",
                            "VoicePool: TTS model loaded (Qwen3-TTS path)"
                        );
                        return Ok(footprint);
                    }
                }

                // Default path — Kokoro ONNX via ort.
                let mut backend = crate::backends::ort::kokoro::KokoroTts::new();
                let footprint = backend.load(model_path, params)?;
                let mut sessions = self
                    .sessions
                    .lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
                let mut footprints = self
                    .footprints
                    .lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool footprints mutex poisoned: {e}"))?;
                sessions.insert(slot_id.to_string(), VoiceSession::Tts(Box::new(backend)));
                footprints.insert(slot_id.to_string(), footprint);
                tracing::info!(
                    slot = %slot_id,
                    backend = "kokoro-ort",
                    "VoicePool: TTS model loaded (Kokoro path)"
                );
                Ok(footprint)
            }
            ModelCapability::SpeechToText => {
                let mut backend = crate::backends::ort::whisper::WhisperStt::new();
                let footprint = backend.load(model_path, params)?;
                let mut sessions = self
                    .sessions
                    .lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
                let mut footprints = self
                    .footprints
                    .lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool footprints mutex poisoned: {e}"))?;
                sessions.insert(slot_id.to_string(), VoiceSession::Stt(Box::new(backend)));
                footprints.insert(slot_id.to_string(), footprint);
                tracing::info!(slot = %slot_id, "VoicePool: STT model loaded");
                Ok(footprint)
            }
            ModelCapability::Embedding => {
                let mut backend = crate::backends::ort::embedder::Qwen3Embedder::new();
                let footprint = backend.load(model_path, params)?;
                let mut sessions = self
                    .sessions
                    .lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
                let mut footprints = self
                    .footprints
                    .lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool footprints mutex poisoned: {e}"))?;
                sessions.insert(
                    slot_id.to_string(),
                    VoiceSession::Embedding(Box::new(backend)),
                );
                footprints.insert(slot_id.to_string(), footprint);
                tracing::info!(slot = %slot_id, "VoicePool: embedder model loaded");
                Ok(footprint)
            }
            ModelCapability::Reranking => {
                let mut backend = crate::backends::ort::reranker::Qwen3Reranker::new();
                let footprint = backend.load(model_path, params)?;
                let mut sessions = self
                    .sessions
                    .lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
                let mut footprints = self
                    .footprints
                    .lock()
                    .map_err(|e| anyhow::anyhow!("VoicePool footprints mutex poisoned: {e}"))?;
                sessions.insert(
                    slot_id.to_string(),
                    VoiceSession::Reranking(Box::new(backend)),
                );
                footprints.insert(slot_id.to_string(), footprint);
                tracing::info!(slot = %slot_id, "VoicePool: reranker model loaded");
                Ok(footprint)
            }
            ModelCapability::VisionEmbedding => {
                let variant = params.backend_variant.as_deref();

                // HD path — SigLIP 2 ONNX via ort. Requires `ort-backend` feature.
                #[cfg(feature = "ort-backend")]
                if variant == Some(crate::backends::ort::siglip_naflex::SigLip2OrtFixRes::backend_name()) {
                    let mut backend =
                        crate::backends::ort::siglip_naflex::SigLip2OrtFixRes::new();
                    let footprint = backend.load(model_path, params.clone())?;
                    let mut sessions = self
                        .sessions
                        .lock()
                        .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
                    let mut footprints = self
                        .footprints
                        .lock()
                        .map_err(|e| anyhow::anyhow!("VoicePool footprints mutex poisoned: {e}"))?;
                    sessions
                        .insert(slot_id.to_string(), VoiceSession::Vision(Box::new(backend)));
                    footprints.insert(slot_id.to_string(), footprint);
                    tracing::info!(
                        slot = %slot_id,
                        backend = "siglip2-onnx-fixres",
                        "VoicePool: vision encoder loaded (HD path)"
                    );
                    return Ok(footprint);
                }

                // Default path — SigLIP via candle (SD path).
                #[cfg(feature = "candle-backend")]
                {
                    let mut backend = crate::backends::candle::SigLipVision::new();
                    let footprint = backend.load(model_path, params)?;
                    let mut sessions = self
                        .sessions
                        .lock()
                        .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
                    let mut footprints = self
                        .footprints
                        .lock()
                        .map_err(|e| anyhow::anyhow!("VoicePool footprints mutex poisoned: {e}"))?;
                    sessions.insert(slot_id.to_string(), VoiceSession::Vision(Box::new(backend)));
                    footprints.insert(slot_id.to_string(), footprint);
                    tracing::info!(
                        slot = %slot_id,
                        backend = "siglip-candle",
                        "VoicePool: vision encoder loaded (SD path)"
                    );
                    Ok(footprint)
                }
                #[cfg(not(feature = "candle-backend"))]
                {
                    let _ = (slot_id, model_path, params, variant);
                    anyhow::bail!(
                        "VisionEmbedding requires `candle-backend` feature (or `ort-backend` with backend_variant=\"siglip2-onnx-fixres\") — neither compiled"
                    );
                }
            }
            other => {
                anyhow::bail!("VoicePool does not handle capability: {other}");
            }
        }
    }

    /// Load — not available without `ort-backend` feature.
    ///
    /// # Errors
    /// Always returns an error in this build configuration: the
    /// `ort-backend` Cargo feature is not enabled, so no capability
    /// backend can be constructed for the requested slot.
    #[cfg(not(feature = "ort-backend"))]
    pub fn load(
        &self,
        slot_id: &str,
        _model_path: &Path,
        _capability: ModelCapability,
        _params: LoadParams,
    ) -> anyhow::Result<MemoryFootprint> {
        anyhow::bail!(
            "ort-backend feature not compiled — cannot load voice model for slot '{slot_id}'"
        )
    }

    /// Unload a voice model from a slot.
    pub fn unload(&self, slot_id: &str) -> Option<MemoryFootprint> {
        let removed = self.sessions.lock().map(|mut s| s.remove(slot_id)).ok()?;
        if removed.is_some() {
            tracing::info!(slot = %slot_id, "VoicePool: session unloaded");
        }
        self.footprints.lock().map(|mut f| f.remove(slot_id)).ok()?
    }

    /// Check if a slot has a loaded voice session.
    #[must_use]
    pub fn is_loaded(&self, slot_id: &str) -> bool {
        self.sessions
            .lock()
            .map(|s| s.contains_key(slot_id))
            .unwrap_or(false)
    }

    /// Push a fresh voice-clone snapshot into the TTS backend at `slot_id`.
    ///
    /// Returns `true` when a TTS session was found and refreshed, `false`
    /// when the slot is unloaded or holds a non-TTS session — both are
    /// valid no-op states (no error path) because the engine layer fires
    /// this hook unconditionally after every `register_voice_clone` /
    /// `remove_voice_clone` and after every successful TTS slot load.
    ///
    /// Backends that don't support cloning (Kokoro, Orpheus) accept the
    /// snapshot via the trait's default no-op `set_voice_clones`.
    pub fn refresh_voice_clones(&self, slot_id: &str, clones: Vec<VoiceCloneEntry>) -> bool {
        let sessions = match self.sessions.lock() {
            Ok(guard) => guard,
            Err(e) => {
                tracing::error!(
                    slot = %slot_id,
                    error = %e,
                    "VoicePool: sessions mutex poisoned during refresh_voice_clones"
                );
                return false;
            }
        };
        match sessions.get(slot_id) {
            Some(VoiceSession::Tts(backend)) => {
                backend.set_voice_clones(clones);
                true
            }
            _ => false,
        }
    }

    /// Synthesize speech for a TTS slot.
    ///
    /// # Errors
    /// Returns an error if the `sessions` mutex is poisoned, no session
    /// is loaded for `slot_id`, the loaded session is not a TTS backend,
    /// or the underlying `synthesize()` call on the TTS backend fails
    /// (unknown voice, phonemization failure, inference error).
    pub fn synthesize(
        &self,
        slot_id: &str,
        text: &str,
        voice: &str,
    ) -> anyhow::Result<AudioSamples> {
        let sessions = self
            .sessions
            .lock()
            .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
        match sessions.get(slot_id) {
            Some(VoiceSession::Tts(backend)) => backend.synthesize(text, voice),
            Some(other) => anyhow::bail!("Slot '{slot_id}' is {}, not TTS", session_kind(other)),
            None => anyhow::bail!("No voice model loaded in slot '{slot_id}'"),
        }
    }

    /// Transcribe audio for an STT slot.
    ///
    /// # Errors
    /// Returns an error if the `sessions` mutex is poisoned, no session
    /// is loaded for `slot_id`, the loaded session is not an STT backend,
    /// or the underlying `transcribe()` call on the STT backend fails
    /// (mel-spectrogram extraction or encoder/decoder inference error).
    pub fn transcribe(&self, slot_id: &str, samples: &AudioSamples) -> anyhow::Result<String> {
        let sessions = self
            .sessions
            .lock()
            .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
        match sessions.get(slot_id) {
            Some(VoiceSession::Stt(backend)) => backend.transcribe(samples),
            Some(other) => anyhow::bail!("Slot '{slot_id}' is {}, not STT", session_kind(other)),
            None => anyhow::bail!("No voice model loaded in slot '{slot_id}'"),
        }
    }

    /// Embed a batch of texts via an embedder slot.
    ///
    /// Returns one dense vector per input. Fails if the slot holds a
    /// non-embedder backend — no silent fallback.
    ///
    /// # Errors
    /// Returns an error if the `sessions` mutex is poisoned, no session
    /// is loaded for `slot_id`, the loaded session is not an embedder,
    /// or the underlying `embed()` call on the embedder backend fails
    /// (tokenization failure, ONNX session error, malformed output shape).
    pub fn embed(&self, slot_id: &str, texts: &[&str]) -> anyhow::Result<Vec<Vec<f32>>> {
        let sessions = self
            .sessions
            .lock()
            .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
        match sessions.get(slot_id) {
            Some(VoiceSession::Embedding(backend)) => backend.embed(texts),
            Some(other) => anyhow::bail!(
                "Slot '{slot_id}' is {}, not an embedder",
                session_kind(other)
            ),
            None => anyhow::bail!("No embedder loaded in slot '{slot_id}'"),
        }
    }

    /// Rerank documents against a query via a reranker slot.
    ///
    /// Returns one score per document in `[0.0, 1.0]` (higher = more relevant).
    ///
    /// # Errors
    /// Returns an error if the `sessions` mutex is poisoned, no session is
    /// loaded for `slot_id`, the loaded session is not a reranker, or the
    /// underlying `rerank()` call on the reranker backend fails
    /// (tokenization failure, ONNX session error, malformed output shape).
    pub fn rerank(
        &self,
        slot_id: &str,
        query: &str,
        documents: &[&str],
    ) -> anyhow::Result<Vec<f32>> {
        let sessions = self
            .sessions
            .lock()
            .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
        match sessions.get(slot_id) {
            Some(VoiceSession::Reranking(backend)) => backend.rerank(query, documents),
            Some(other) => anyhow::bail!(
                "Slot '{slot_id}' is {}, not a reranker",
                session_kind(other)
            ),
            None => anyhow::bail!("No reranker loaded in slot '{slot_id}'"),
        }
    }

    /// Encode an image file on disk via a vision encoder slot.
    ///
    /// # Errors
    /// Returns an error if the `sessions` mutex is poisoned, no session is
    /// loaded for `slot_id`, the loaded session is not a vision encoder,
    /// or the underlying `encode_image()` call fails (image cannot be
    /// opened/decoded, resize/normalize error, ONNX session failure).
    pub fn encode_image(&self, slot_id: &str, path: &Path) -> anyhow::Result<Vec<f32>> {
        let sessions = self
            .sessions
            .lock()
            .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
        match sessions.get(slot_id) {
            Some(VoiceSession::Vision(backend)) => backend.encode_image(path),
            Some(other) => anyhow::bail!(
                "Slot '{slot_id}' is {}, not a vision encoder",
                session_kind(other)
            ),
            None => anyhow::bail!("No vision encoder loaded in slot '{slot_id}'"),
        }
    }

    /// Encode raw RGB pixel data via a vision encoder slot.
    ///
    /// # Errors
    /// Returns an error if the `sessions` mutex is poisoned, no session is
    /// loaded for `slot_id`, the loaded session is not a vision encoder,
    /// or the underlying `encode_rgb()` call fails (length mismatch
    /// between `rgb_bytes` and `width * height * 3`, tensor build failure,
    /// or ONNX session inference error).
    pub fn encode_rgb(
        &self,
        slot_id: &str,
        rgb_bytes: &[u8],
        width: u32,
        height: u32,
    ) -> anyhow::Result<Vec<f32>> {
        let sessions = self
            .sessions
            .lock()
            .map_err(|e| anyhow::anyhow!("VoicePool sessions mutex poisoned: {e}"))?;
        match sessions.get(slot_id) {
            Some(VoiceSession::Vision(backend)) => backend.encode_rgb(rgb_bytes, width, height),
            Some(other) => anyhow::bail!(
                "Slot '{slot_id}' is {}, not a vision encoder",
                session_kind(other)
            ),
            None => anyhow::bail!("No vision encoder loaded in slot '{slot_id}'"),
        }
    }

    /// Memory footprint for a loaded slot.
    #[must_use]
    pub fn memory(&self, slot_id: &str) -> Option<MemoryFootprint> {
        self.footprints
            .lock()
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

/// Human-readable kind label for a loaded session, used in mismatch errors.
fn session_kind(session: &VoiceSession) -> &'static str {
    match session {
        VoiceSession::Tts(_) => "TTS",
        VoiceSession::Stt(_) => "STT",
        VoiceSession::Embedding(_) => "embedder",
        VoiceSession::Reranking(_) => "reranker",
        VoiceSession::Vision(_) => "vision encoder",
    }
}
