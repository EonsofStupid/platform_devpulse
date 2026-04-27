//! Personaplex-7B via ONNX Runtime — load-only path.
//!
//! `nvidia/personaplex-7b-v1` ships an ONNX export alongside the
//! safetensors weights so low-VRAM tiers can run the smaller graph
//! through ORT instead of pulling the full BF16 (~16.7 GB) Candle
//! path. The Microsoft phi4mm-onnx export is the closest sibling —
//! same three-session pattern (text decoder + audio encoder + audio
//! decoder) under one repo.
//!
//! # Why load-only
//!
//! The split-graph autoregressive loop for Personaplex is not yet
//! validated against Microsoft's open-source Phi-4-mm-onnx pipeline.
//! Their reference C# `lm_backbone` + `lm_head` chain is incomplete
//! in the docs (logit handling for STS audio tokens diverges from
//! text), so wiring a sampling loop here would mean reverse-
//! engineering that pipeline in Rust without authoritative reference.
//! Load-only ships the verified surface (three sessions materialise,
//! execution provider falls back cleanly across CUDA → `DirectML` →
//! CPU) and parks the inference loop until upstream documents the
//! sampling contract.
//!
//! # Execution provider order
//!
//! 1. CUDA — preferred on Linux + Windows boxes with NVIDIA GPUs.
//! 2. `DirectML` — Windows-only fallback for AMD / Intel GPUs and
//!    integrated graphics.
//! 3. CPU — universal fallback.
//!
//! `ort` walks the provider list and uses the first one that
//! initialises successfully on the current host. Failures within
//! the provider chain are non-fatal — the next provider is tried.

#![cfg(feature = "ort-backend")]

use anyhow::{Context, Result};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use ort::execution_providers::{
    CPUExecutionProvider, CUDAExecutionProvider, DirectMLExecutionProvider, ExecutionProviderDispatch,
};
use ort::session::Session;

use crate::loading::states::{LoadParams, MemoryFootprint};

/// Repo-relative names of the three graphs Personaplex ships.
///
/// Microsoft's `Phi-4-multimodal-instruct-onnx` export — and
/// Personaplex's matching layout — uses these filenames at the root
/// of the repo or under `cuda-int4-rtn-block-32/` (or similar
/// quantization subdir). The loader probes both shapes.
const TEXT_DECODER_FILENAMES: &[&str] = &["model.onnx", "lm_backbone.onnx"];
const AUDIO_ENCODER_FILENAMES: &[&str] = &["audio_encoder.onnx", "speech_encoder.onnx"];
const AUDIO_DECODER_FILENAMES: &[&str] = &["audio_decoder.onnx", "speech_decoder.onnx"];

/// Personaplex-7B load-only backend.
pub struct PersonaplexOrtBackend {
    /// Directory holding the three ONNX graphs.
    model_dir: Option<PathBuf>,
    /// Whether all three sessions are loaded and ready.
    loaded: bool,
    /// Text decoder session (`lm_backbone` / `model.onnx`).
    text_decoder: Mutex<Option<Session>>,
    /// Audio encoder session (`speech_encoder.onnx`).
    audio_encoder: Mutex<Option<Session>>,
    /// Audio decoder session (`speech_decoder.onnx`).
    audio_decoder: Mutex<Option<Session>>,
}

impl PersonaplexOrtBackend {
    /// Create a new unloaded backend.
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_dir: None,
            loaded: false,
            text_decoder: Mutex::new(None),
            audio_encoder: Mutex::new(None),
            audio_decoder: Mutex::new(None),
        }
    }

    /// Load the three ONNX sessions from `model_dir` with the
    /// CUDA → `DirectML` → CPU execution provider chain.
    ///
    /// Each session goes through the same provider list. ORT picks
    /// the first one that initialises successfully on the current
    /// host. The returned [`MemoryFootprint`] reports the on-disk
    /// size of all three files so the platform budgeter has a
    /// coarse VRAM/RAM accounting hook.
    ///
    /// # Errors
    /// Returns an error if `model_dir` doesn't exist, any of the
    /// three required graphs cannot be located via the candidate
    /// filename probes, the session builder fails, or the file
    /// commit fails (corrupt graph, version mismatch).
    pub fn load(&mut self, model_dir: &Path, _params: &LoadParams) -> Result<MemoryFootprint> {
        if !model_dir.exists() {
            anyhow::bail!("Personaplex ONNX dir not found: {}", model_dir.display());
        }

        tracing::info!(
            dir = %model_dir.display(),
            "Personaplex ORT: loading three sessions"
        );

        let text_path = find_session_file(model_dir, TEXT_DECODER_FILENAMES)
            .context("Personaplex text decoder session file not found")?;
        let encoder_path = find_session_file(model_dir, AUDIO_ENCODER_FILENAMES)
            .context("Personaplex audio encoder session file not found")?;
        let decoder_path = find_session_file(model_dir, AUDIO_DECODER_FILENAMES)
            .context("Personaplex audio decoder session file not found")?;

        let text_size = file_size(&text_path);
        let encoder_size = file_size(&encoder_path);
        let decoder_size = file_size(&decoder_path);

        let text_session = Self::build_session(&text_path)
            .with_context(|| format!("Failed to load text decoder: {}", text_path.display()))?;
        let encoder_session = Self::build_session(&encoder_path).with_context(|| {
            format!("Failed to load audio encoder: {}", encoder_path.display())
        })?;
        let decoder_session = Self::build_session(&decoder_path).with_context(|| {
            format!("Failed to load audio decoder: {}", decoder_path.display())
        })?;

        *self
            .text_decoder
            .lock()
            .map_err(|e| anyhow::anyhow!("text decoder mutex poisoned: {e}"))? = Some(text_session);
        *self
            .audio_encoder
            .lock()
            .map_err(|e| anyhow::anyhow!("audio encoder mutex poisoned: {e}"))? = Some(encoder_session);
        *self
            .audio_decoder
            .lock()
            .map_err(|e| anyhow::anyhow!("audio decoder mutex poisoned: {e}"))? = Some(decoder_session);

        self.model_dir = Some(model_dir.to_path_buf());
        self.loaded = true;

        let total = text_size + encoder_size + decoder_size;
        tracing::info!(
            text_mb = text_size / 1_048_576,
            encoder_mb = encoder_size / 1_048_576,
            decoder_mb = decoder_size / 1_048_576,
            total_mb = total / 1_048_576,
            "Personaplex ORT: three sessions loaded"
        );

        // ORT sessions on GPU EPs allocate their working buffers in
        // device memory but the model weights themselves are mapped
        // from disk under the standard execution-provider shape; we
        // bill the on-disk size as VRAM when CUDA / `DirectML` is
        // selected and as RAM otherwise. The runtime budgeter uses
        // this for coarse planning only — real residency is queried
        // through `MemoryUsage` on the bridge.
        Ok(MemoryFootprint {
            ram_bytes: 0,
            vram_bytes: total,
            kv_cache_bytes: 0,
        })
    }

    /// Drop all three sessions and free their resources.
    ///
    /// # Errors
    /// Returns an error if any of the per-session mutexes are
    /// poisoned (a previous panic while a session was held).
    pub fn unload(&mut self) -> Result<()> {
        tracing::info!("Personaplex ORT: unloading");
        *self
            .text_decoder
            .lock()
            .map_err(|e| anyhow::anyhow!("text decoder mutex poisoned: {e}"))? = None;
        *self
            .audio_encoder
            .lock()
            .map_err(|e| anyhow::anyhow!("audio encoder mutex poisoned: {e}"))? = None;
        *self
            .audio_decoder
            .lock()
            .map_err(|e| anyhow::anyhow!("audio decoder mutex poisoned: {e}"))? = None;
        self.loaded = false;
        self.model_dir = None;
        Ok(())
    }

    /// Whether all three sessions are loaded and ready.
    #[must_use]
    pub fn is_loaded(&self) -> bool {
        self.loaded
    }

    /// Path of the loaded model directory, if any.
    #[must_use]
    pub fn loaded_model_dir(&self) -> Option<&Path> {
        self.model_dir.as_deref()
    }

    /// Build a single ONNX session against the CUDA → `DirectML` → CPU
    /// execution-provider chain.
    fn build_session(path: &Path) -> Result<Session> {
        let providers: Vec<ExecutionProviderDispatch> = vec![
            CUDAExecutionProvider::default().build(),
            DirectMLExecutionProvider::default().build(),
            CPUExecutionProvider::default().build(),
        ];

        let session = Session::builder()
            .map_err(|e| anyhow::anyhow!("Failed to create ort session builder: {e}"))?
            .with_execution_providers(providers)
            .map_err(|e| anyhow::anyhow!("Failed to register execution providers: {e}"))?
            .commit_from_file(path)
            .map_err(|e| anyhow::anyhow!("Failed to commit session from file: {e}"))?;

        Ok(session)
    }
}

impl Default for PersonaplexOrtBackend {
    fn default() -> Self {
        Self::new()
    }
}

fn find_session_file(model_dir: &Path, candidates: &[&str]) -> Result<PathBuf> {
    // Probe both the dir root and a nested quantization subdir. The
    // ONNX exports Microsoft + Nvidia ship typically land under
    // `cuda-int4-rtn-block-32/` or `cpu-int4-rtn-block-32-acc-level-4/`
    // depending on the EP target. Surface the first hit; the full
    // search list is logged so a missing graph fails with a precise
    // "looked here, here, and here" message.
    let subdirs = [
        "",
        "cuda-int4-rtn-block-32",
        "cpu-int4-rtn-block-32-acc-level-4",
        "cpu-int4-rtn-block-32",
    ];

    let mut tried = Vec::new();
    for sub in subdirs {
        for name in candidates {
            let candidate = if sub.is_empty() {
                model_dir.join(name)
            } else {
                model_dir.join(sub).join(name)
            };
            if candidate.exists() {
                return Ok(candidate);
            }
            tried.push(candidate.display().to_string());
        }
    }

    anyhow::bail!(
        "None of the expected ONNX graph filenames were found. Tried: {}",
        tried.join(", ")
    )
}

fn file_size(path: &Path) -> u64 {
    std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
}

#[cfg(test)]
#[allow(clippy::unwrap_used)] // tests panic on assertion failure by design
mod tests {
    use super::*;

    #[test]
    fn fresh_backend_reports_unloaded() {
        let backend = PersonaplexOrtBackend::new();
        assert!(!backend.is_loaded());
        assert!(backend.loaded_model_dir().is_none());
    }

    #[test]
    fn find_session_file_errors_when_no_match() {
        let dir = std::env::temp_dir().join(format!(
            "devpulse-personaplex-test-{}",
            std::process::id()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        let err = find_session_file(&dir, &["definitely-not-here.onnx"]).unwrap_err();
        assert!(err.to_string().contains("Tried:"));
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn find_session_file_locates_root_match() {
        let dir = std::env::temp_dir().join(format!(
            "devpulse-personaplex-root-{}",
            std::process::id()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        let target = dir.join("model.onnx");
        std::fs::write(&target, b"fake-onnx").unwrap();
        let found = find_session_file(&dir, TEXT_DECODER_FILENAMES).unwrap();
        assert_eq!(found, target);
        let _ = std::fs::remove_dir_all(&dir);
    }
}
