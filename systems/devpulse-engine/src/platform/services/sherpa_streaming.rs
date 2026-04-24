//! Sherpa streaming ASR service — real-time zipformer recognition.
//!
//! Wraps `sherpa-onnx`'s `OnlineRecognizer` + `OnlineStream` with:
//! - a per-model recognizer cache (one recognizer per model dir,
//!   shared across every streaming session using that model)
//! - a session registry keyed by UUID
//! - model install-dir scanning + JSON-manifest-free "did this dir
//!   provide encoder/decoder/joiner/tokens" validity check
//!
//! Feature-gated behind the `sherpa` cargo feature. When the feature
//! is OFF (default), the public types still compile so the Tauri
//! command layer has a stable surface — every method returns a
//! `"sherpa feature not enabled in this build"` error.
//!
//! # Model layout
//!
//! ```text
//! {data_dir}/models/sherpa/
//!   sherpa-onnx-streaming-zipformer-en-2023-06-26/
//!     encoder-epoch-99-avg-1.int8.onnx
//!     decoder-epoch-99-avg-1.onnx
//!     joiner-epoch-99-avg-1.int8.onnx
//!     tokens.txt
//! ```
//!
//! Filename prefixes are canonical k2-fsa shapes — we match by
//! substring (`encoder`/`decoder`/`joiner`/`tokens`) rather than
//! hardcoded names so future model revisions drop in without a
//! schema change.

use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

#[cfg(feature = "sherpa")]
use std::collections::HashMap;
#[cfg(feature = "sherpa")]
use uuid::Uuid;

// ═══════════════════════════════════════════════════════════════
// Public shapes (TS-exported) — always compiled
// ═══════════════════════════════════════════════════════════════

/// A streaming-ASR model installed on disk. Paths are the fully-
/// resolved file locations so the frontend can render the model card.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SherpaInstalledModel {
    /// Directory name (unique id within `{data_dir}/models/sherpa/`).
    pub id: String,
    /// Display label — same as `id` for now; a future `model.json`
    /// manifest can enrich this.
    pub label: String,
    /// Encoder ONNX path.
    pub encoder: String,
    /// Decoder ONNX path.
    pub decoder: String,
    /// Joiner ONNX path.
    pub joiner: String,
    /// Tokens (BPE / char) text file path.
    pub tokens: String,
    /// Total on-disk size in bytes — all four files summed.
    pub size_bytes: u64,
}

/// Snapshot of a live streaming session for the devtool UI.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SherpaSessionInfo {
    /// UUID session id.
    pub id: String,
    /// Model directory id the session was started against.
    pub model_id: String,
    /// Current accumulated transcript.
    pub transcript: String,
    /// Total audio samples fed (16 kHz f32 mono).
    pub samples_fed: u64,
}

/// Whether the `sherpa` cargo feature was enabled at compile time.
/// The devtool uses this to render a "not available in this build"
/// banner when the user opens the page on a default build.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Type)]
pub struct SherpaCompileInfo {
    /// `true` when built with `--features sherpa`.
    pub enabled: bool,
}

// ═══════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════

/// Sherpa streaming ASR service.
pub struct SherpaStreamingService {
    models_dir: PathBuf,
    /// Holds the recognizer cache + live session map when the `sherpa`
    /// feature is enabled. On default builds the inner map is empty
    /// and never read — `#[allow(dead_code)]` avoids a feature-off
    /// warning without disabling dead-code analysis everywhere.
    #[cfg_attr(not(feature = "sherpa"), allow(dead_code))]
    inner: Mutex<Inner>,
}

struct Inner {
    #[cfg(feature = "sherpa")]
    recognizers: HashMap<String, std::sync::Arc<sherpa_onnx::OnlineRecognizer>>,
    #[cfg(feature = "sherpa")]
    sessions: HashMap<String, Session>,
    #[cfg(not(feature = "sherpa"))]
    _marker: std::marker::PhantomData<()>,
}

#[cfg(feature = "sherpa")]
struct Session {
    model_id: String,
    recognizer: std::sync::Arc<sherpa_onnx::OnlineRecognizer>,
    stream: sherpa_onnx::OnlineStream,
    text: String,
    samples_fed: u64,
}

impl SherpaStreamingService {
    /// Create the service. `data_dir` is the platform root; the service
    /// rooted model store at `<data_dir>/models/sherpa/`.
    #[must_use]
    pub fn new(data_dir: &Path) -> Self {
        Self {
            models_dir: data_dir.join("models").join("sherpa"),
            inner: Mutex::new(Inner {
                #[cfg(feature = "sherpa")]
                recognizers: HashMap::new(),
                #[cfg(feature = "sherpa")]
                sessions: HashMap::new(),
                #[cfg(not(feature = "sherpa"))]
                _marker: std::marker::PhantomData,
            }),
        }
    }

    /// Report whether the `sherpa` cargo feature is enabled in this build.
    #[must_use]
    pub fn compile_info() -> SherpaCompileInfo {
        SherpaCompileInfo {
            enabled: cfg!(feature = "sherpa"),
        }
    }

    /// Scan `models_dir` for valid installed models.
    ///
    /// Returns an empty vec when the directory does not exist — the
    /// devtool treats that as "no models installed yet" and prompts
    /// the user to download one.
    ///
    /// # Errors
    /// - `readdir` on an existing directory fails.
    pub fn list_installed_models(&self) -> Result<Vec<SherpaInstalledModel>> {
        if !self.models_dir.exists() {
            return Ok(Vec::new());
        }
        let mut out = Vec::new();
        for entry in std::fs::read_dir(&self.models_dir)
            .with_context(|| format!("readdir {}", self.models_dir.display()))?
        {
            let Ok(entry) = entry else { continue };
            let p = entry.path();
            if !p.is_dir() {
                continue;
            }
            if let Some(model) = scan_model_dir(&p) {
                out.push(model);
            }
        }
        out.sort_by(|a, b| a.id.cmp(&b.id));
        Ok(out)
    }

    /// Delete a model directory by id.
    ///
    /// # Errors
    /// - `id` is empty or contains path separators (hard guard against
    ///   `..` escape).
    /// - Directory does not exist.
    /// - `remove_dir_all` fails.
    pub fn delete_model(&self, id: &str) -> Result<()> {
        validate_model_id(id)?;
        // Also drop any cached recognizer referencing this model.
        #[cfg(feature = "sherpa")]
        {
            let mut inner = self
                .inner
                .lock()
                .map_err(|e| anyhow!("sherpa inner lock poisoned: {e}"))?;
            inner.recognizers.remove(id);
            inner.sessions.retain(|_, s| s.model_id != id);
        }
        let dir = self.models_dir.join(id);
        if !dir.exists() {
            return Err(anyhow!("model {id} not installed"));
        }
        std::fs::remove_dir_all(&dir)
            .with_context(|| format!("remove {}", dir.display()))?;
        tracing::info!(model_id = id, "sherpa model deleted");
        Ok(())
    }

    /// Start a streaming recognition session against an installed model.
    /// Returns the fresh session id.
    ///
    /// # Errors
    /// - Feature `sherpa` disabled (returns a clear build-time message).
    /// - Model not installed / invalid.
    /// - `OnlineRecognizer::create` fails.
    #[cfg(feature = "sherpa")]
    #[allow(clippy::missing_panics_doc)]
    pub fn start_session(&self, model_id: &str) -> Result<String> {
        validate_model_id(model_id)?;
        let Some(model) = scan_model_dir(&self.models_dir.join(model_id)) else {
            return Err(anyhow!("model {model_id} missing required files"));
        };

        let mut inner = self
            .inner
            .lock()
            .map_err(|e| anyhow!("sherpa inner lock poisoned: {e}"))?;

        let recognizer = if let Some(r) = inner.recognizers.get(model_id) {
            std::sync::Arc::clone(r)
        } else {
            let mut config = sherpa_onnx::OnlineRecognizerConfig::default();
            config.model_config.transducer.encoder = Some(model.encoder.clone());
            config.model_config.transducer.decoder = Some(model.decoder.clone());
            config.model_config.transducer.joiner = Some(model.joiner.clone());
            config.model_config.tokens = Some(model.tokens.clone());
            config.enable_endpoint = true;
            config.decoding_method = Some("greedy_search".into());
            let r = sherpa_onnx::OnlineRecognizer::create(&config)
                .map_err(|e| anyhow!("OnlineRecognizer::create failed: {e}"))?;
            let arc = std::sync::Arc::new(r);
            inner
                .recognizers
                .insert(model_id.to_string(), std::sync::Arc::clone(&arc));
            arc
        };

        let stream = recognizer.create_stream();
        let id = Uuid::new_v4().to_string();
        inner.sessions.insert(
            id.clone(),
            Session {
                model_id: model_id.to_string(),
                recognizer,
                stream,
                text: String::new(),
                samples_fed: 0,
            },
        );
        tracing::info!(session_id = %id, model_id, "sherpa session started");
        Ok(id)
    }

    /// Non-sherpa stub — every call is a clear opt-in prompt.
    #[cfg(not(feature = "sherpa"))]
    #[allow(clippy::missing_errors_doc)]
    pub fn start_session(&self, _model_id: &str) -> Result<String> {
        Err(anyhow!(sherpa_not_enabled_msg()))
    }

    /// Feed a chunk of PCM-float samples (f32, mono, 16 kHz) to an
    /// active session. Returns the updated transcript after decoding.
    ///
    /// # Errors
    /// - Feature `sherpa` disabled.
    /// - Session id unknown.
    #[cfg(feature = "sherpa")]
    pub fn feed_audio(&self, session_id: &str, samples: &[f32]) -> Result<String> {
        let mut inner = self
            .inner
            .lock()
            .map_err(|e| anyhow!("sherpa inner lock poisoned: {e}"))?;
        let session = inner
            .sessions
            .get_mut(session_id)
            .ok_or_else(|| anyhow!("sherpa session {session_id} not found"))?;

        session.stream.accept_waveform(16_000, samples);
        session.samples_fed += samples.len() as u64;

        while session.recognizer.is_ready(&session.stream) {
            session.recognizer.decode(&session.stream);
        }

        let result = session
            .recognizer
            .get_result(&session.stream)
            .map_err(|e| anyhow!("get_result failed: {e}"))?;
        session.text = result.text.clone();
        Ok(session.text.clone())
    }

    /// Non-sherpa stub.
    #[cfg(not(feature = "sherpa"))]
    #[allow(clippy::missing_errors_doc)]
    pub fn feed_audio(&self, _session_id: &str, _samples: &[f32]) -> Result<String> {
        Err(anyhow!(sherpa_not_enabled_msg()))
    }

    /// Signal end-of-input to a session and get the final transcript.
    ///
    /// # Errors
    /// - Feature `sherpa` disabled.
    /// - Session id unknown.
    #[cfg(feature = "sherpa")]
    pub fn finish_session(&self, session_id: &str) -> Result<String> {
        let mut inner = self
            .inner
            .lock()
            .map_err(|e| anyhow!("sherpa inner lock poisoned: {e}"))?;
        let session = inner
            .sessions
            .get_mut(session_id)
            .ok_or_else(|| anyhow!("sherpa session {session_id} not found"))?;

        session.stream.input_finished();
        while session.recognizer.is_ready(&session.stream) {
            session.recognizer.decode(&session.stream);
        }
        let result = session
            .recognizer
            .get_result(&session.stream)
            .map_err(|e| anyhow!("get_result failed: {e}"))?;
        session.text = result.text.clone();
        Ok(session.text.clone())
    }

    /// Non-sherpa stub.
    #[cfg(not(feature = "sherpa"))]
    #[allow(clippy::missing_errors_doc)]
    pub fn finish_session(&self, _session_id: &str) -> Result<String> {
        Err(anyhow!(sherpa_not_enabled_msg()))
    }

    /// Drop a session — releases its `OnlineStream` handle.
    ///
    /// # Errors
    /// - Feature `sherpa` disabled (returns explicit message instead
    ///   of silently succeeding — keeps behaviour observable).
    pub fn stop_session(&self, session_id: &str) -> Result<()> {
        #[cfg(feature = "sherpa")]
        {
            let mut inner = self
                .inner
                .lock()
                .map_err(|e| anyhow!("sherpa inner lock poisoned: {e}"))?;
            if inner.sessions.remove(session_id).is_none() {
                return Err(anyhow!("sherpa session {session_id} not found"));
            }
            tracing::info!(session_id, "sherpa session stopped");
            Ok(())
        }
        #[cfg(not(feature = "sherpa"))]
        {
            let _ = session_id;
            Err(anyhow!(sherpa_not_enabled_msg()))
        }
    }

    /// Snapshot of every live session — useful for the devtool's
    /// "Active sessions" list.
    pub fn list_sessions(&self) -> Vec<SherpaSessionInfo> {
        #[cfg(feature = "sherpa")]
        {
            let Ok(inner) = self.inner.lock() else {
                return Vec::new();
            };
            inner
                .sessions
                .iter()
                .map(|(id, s)| SherpaSessionInfo {
                    id: id.clone(),
                    model_id: s.model_id.clone(),
                    transcript: s.text.clone(),
                    samples_fed: s.samples_fed,
                })
                .collect()
        }
        #[cfg(not(feature = "sherpa"))]
        {
            Vec::new()
        }
    }

    /// Models root — the devtool shows this as the "install target"
    /// when the user pulls a model.
    #[must_use]
    pub fn models_dir(&self) -> &Path {
        &self.models_dir
    }
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/// Reject ids that are empty or contain path separators / traversal.
fn validate_model_id(id: &str) -> Result<()> {
    if id.is_empty() {
        return Err(anyhow!("model id must be non-empty"));
    }
    if id.contains('/') || id.contains('\\') || id.contains("..") {
        return Err(anyhow!(
            "model id must not contain path separators: {id}"
        ));
    }
    Ok(())
}

/// Scan a candidate model directory for the four required files.
/// Returns `None` when any required component is missing — the caller
/// treats that as "not a valid sherpa model dir" and skips it.
fn scan_model_dir(dir: &Path) -> Option<SherpaInstalledModel> {
    if !dir.is_dir() {
        return None;
    }
    let mut encoder: Option<PathBuf> = None;
    let mut decoder: Option<PathBuf> = None;
    let mut joiner: Option<PathBuf> = None;
    let mut tokens: Option<PathBuf> = None;

    for entry in std::fs::read_dir(dir).ok()? {
        let Ok(entry) = entry else { continue };
        let p = entry.path();
        let Some(name) = p.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        let lower = name.to_ascii_lowercase();
        if lower.ends_with(".onnx") {
            if lower.contains("encoder") && encoder.is_none() {
                encoder = Some(p);
            } else if lower.contains("decoder") && decoder.is_none() {
                decoder = Some(p);
            } else if lower.contains("joiner") && joiner.is_none() {
                joiner = Some(p);
            }
        } else if lower == "tokens.txt" || (lower.starts_with("tokens") && lower.ends_with(".txt"))
        {
            tokens = Some(p);
        }
    }

    let encoder = encoder?;
    let decoder = decoder?;
    let joiner = joiner?;
    let tokens = tokens?;

    let size_bytes = [&encoder, &decoder, &joiner, &tokens]
        .iter()
        .filter_map(|p| std::fs::metadata(p).ok().map(|m| m.len()))
        .sum();

    let id = dir
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    Some(SherpaInstalledModel {
        id: id.clone(),
        label: id,
        encoder: encoder.display().to_string(),
        decoder: decoder.display().to_string(),
        joiner: joiner.display().to_string(),
        tokens: tokens.display().to_string(),
        size_bytes,
    })
}

/// Canonical "you forgot the feature" message — surfaced everywhere the
/// service gracefully refuses to do work on a default build.
#[cfg(not(feature = "sherpa"))]
fn sherpa_not_enabled_msg() -> &'static str {
    "Sherpa streaming ASR was not compiled into this build. Rebuild with \
     `cargo xtask run-dev --features sherpa` (pulls ~100 MB of prebuilt \
     native binaries on first compile)."
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_rejects_traversal() {
        assert!(validate_model_id("").is_err());
        assert!(validate_model_id("../etc").is_err());
        assert!(validate_model_id("a/b").is_err());
        assert!(validate_model_id("a\\b").is_err());
        assert!(validate_model_id("ok-model").is_ok());
    }

    #[test]
    fn scan_skips_incomplete_dir() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("model");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("encoder.onnx"), b"x").unwrap();
        // missing decoder/joiner/tokens
        assert!(scan_model_dir(&dir).is_none());
    }

    #[test]
    fn scan_accepts_complete_dir() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("zipformer-en");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("encoder-99.int8.onnx"), b"x").unwrap();
        std::fs::write(dir.join("decoder-99.onnx"), b"x").unwrap();
        std::fs::write(dir.join("joiner-99.int8.onnx"), b"x").unwrap();
        std::fs::write(dir.join("tokens.txt"), b"x").unwrap();
        let model = scan_model_dir(&dir).unwrap();
        assert_eq!(model.id, "zipformer-en");
        assert!(model.encoder.ends_with("encoder-99.int8.onnx"));
        assert_eq!(model.size_bytes, 4);
    }
}
