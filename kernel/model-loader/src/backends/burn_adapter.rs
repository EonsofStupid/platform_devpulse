//! # `BurnEncoderAdapter` — clyffy ⇄ model-loader bridge for the RRO encoder
//!
//! `BurnEmbedder<B>` lives in `kernel/devpulse-clyffy` (the kernel
//! module that owns brain-side ML). The model-loader crate sits one
//! layer below clyffy and can't import its types — so we trait-erase
//! the load + lifecycle surface here, and clyffy supplies the
//! concrete implementation at engine boot.
//!
//! ## What flows through the adapter
//!
//! - **Load**: model-loader calls `load_blocking(path)` from inside
//!   the slot loader. Blocking by design — this runs on tokio's
//!   blocking pool via `spawn_blocking` already wrapped at the
//!   service.rs callsite, so the adapter implementation can do sync
//!   I/O directly.
//! - **State query**: `is_loaded()` lets devtools and the slot
//!   status reporter answer "is the encoder up?" without poking at
//!   clyffy internals.
//! - **Memory footprint**: returned at load time so the slot's
//!   `MemoryFootprint` accounting stays accurate.
//!
//! ## What flows through the adapter (updated for Phase C)
//!
//! - **Load / unload**: lifecycle transitions Empty → Ready → Empty.
//! - **State query**: `is_loaded()` for devtool status.
//! - **Memory footprint**: returned at load time for slot accounting.
//! - **Embed**: `embed_texts_blocking` — text → dense vectors. Added
//!   in Phase C (tokenizer wiring) so the engine command layer can
//!   invoke the full text→embedding pipeline without knowing the
//!   concrete Burn backend type. The method is synchronous; async
//!   callers wrap with `tokio::task::spawn_blocking`.
//!
//! ## What does NOT flow through the adapter
//!
//! - Hot-update mechanics. The RRD daemon (`kernel/rrd`) owns the
//!   atomic pause→validate→swap→resume primitive; this adapter exposes
//!   the *entry point* (`swap_blocking`) that drives the daemon through
//!   one full cycle and returns a structured [`SwapStats`] for the UI.
//!   The daemon's own lifecycle events still flow through tracing →
//!   `RrdLifecycleTranslator` → `InternalEvent::RrdPhaseTransition`
//!   as before; `phases_observed` on [`SwapStats`] is a return-value
//!   snapshot for callers that want the phase list without subscribing
//!   to the live event stream.

use crate::loading::states::MemoryFootprint;
use std::path::Path;
use std::sync::Arc;

/// Result of a single [`BurnEncoderAdapter::swap_blocking`] cycle.
///
/// Mirrors the `SwapReport` interface the desktop devtool consumes via
/// the `cortex_swap_encoder` Tauri command (see
/// `interfaces/desktop/src/lib/devtools/clyffy/reasoning/rrd/data-access/swap.svc.ts`).
/// Fields are flat + plain types so the value crosses straight to the
/// frontend under specta when the consuming crate enables the feature.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct SwapStats {
    /// Output dimension of the new encoder (e.g. 1024 for Harrier 0.6B).
    /// Read off the live forward pass — authoritative against the
    /// loaded weights, not a config.json shadow.
    pub dim: usize,
    /// Total wall-clock time the maintenance window was held, in ms.
    /// Includes pause/drain + load + validate + swap + resume.
    pub elapsed_ms: u64,
    /// Phase names the daemon traversed during the swap, in order. The
    /// canonical sequence on a healthy swap is `pause_requested`,
    /// `drain_complete`, `load_complete`, `validate_pass`, `swap_commit`,
    /// `resume_complete`. Use `phases_observed.last()` to confirm the
    /// daemon settled at `resume_complete`.
    pub phases_observed: Vec<String>,
}

/// The model-loader-facing surface the clyffy Burn encoder
/// implementation must provide.
///
/// Implementor: `clyffy::cortex::persistence::burn::adapter::CortexBurnAdapter`.
pub trait BurnEncoderAdapter: Send + Sync + 'static {
    /// Load a safetensors-format Burn encoder from disk and stash
    /// the live `Arc` somewhere only the adapter knows about. The
    /// returned `MemoryFootprint` reports approximate RAM/VRAM use
    /// so the slot's status reporter stays accurate.
    ///
    /// Synchronous and CPU-bound. Callers wrap in
    /// `tokio::task::spawn_blocking` (the model-loader's `load_slot`
    /// already does this in its existing `block_in_place` arms).
    ///
    /// # Errors
    ///
    /// - File missing / unreadable / wrong format.
    /// - Tensor shape doesn't match the encoder geometry.
    /// - Validate forward returned non-finite output.
    fn load_blocking(&self, path: &Path) -> anyhow::Result<MemoryFootprint>;

    /// Drop the live encoder. After this call `is_loaded()` is
    /// false. The adapter implementation MUST drop on the calling
    /// thread (not on a query thread) so a slow Drop doesn't stall a
    /// reader — same H4 invariant the RRD daemon enforces.
    ///
    /// # Errors
    /// Returns an error when the adapter cannot release its loaded
    /// weights — typically a poisoned `ArcSwap` slot or a downstream
    /// resource shutdown failure (CUDA device drop, mmap unmap).
    fn unload_blocking(&self) -> anyhow::Result<()>;

    /// True iff a Burn encoder is currently loaded. Cheap; the
    /// adapter implementation typically reads an `ArcSwap` slot.
    fn is_loaded(&self) -> bool;

    /// Tokenize `texts` and run a full embedding forward pass, returning
    /// one L2-normalized dense vector per input text.
    ///
    /// Synchronous and CPU-bound (Burn `NdArray` backend). Async callers
    /// wrap with `tokio::task::spawn_blocking`.
    ///
    /// # Errors
    ///
    /// - Encoder or tokenizer not loaded (call `load_blocking` first).
    /// - Empty `texts` slice.
    /// - Tokenizer encode failure.
    /// - Forward pass produces non-finite output.
    fn embed_texts_blocking(&self, texts: &[&str]) -> anyhow::Result<Vec<Vec<f32>>>;

    /// Hot-swap the live encoder weights to the safetensors file at
    /// `weights_path`. Drives the RRD daemon through one full
    /// `pause → drain → load → validate → swap → resume` cycle.
    ///
    /// Synchronous from the caller's POV; internally bridges to the
    /// daemon's async surface via `tokio::runtime::Handle::current().block_on`,
    /// so the caller MUST already be inside a Tokio context (the
    /// model-loader's blocking pool counts; raw OS threads do not).
    /// Returns [`SwapStats`] on a healthy swap; the live encoder is
    /// unchanged if any phase fails.
    ///
    /// Requires the adapter to have been loaded at least once via
    /// [`Self::load_blocking`] so the RRD daemon exists. First-load
    /// callers go through `load_blocking`; only the second-and-later
    /// path goes through this method.
    ///
    /// # Errors
    ///
    /// - Daemon not constructed yet (call `load_blocking` first).
    /// - Source file missing / unreadable / wrong format.
    /// - Validate forward returned non-finite output (live unchanged).
    /// - Drain timeout (force-proceeds with warning; not a hard error).
    /// - Not inside a Tokio context.
    fn swap_blocking(&self, weights_path: &Path) -> anyhow::Result<SwapStats>;
}

/// Type-erased handle held by `ModelLoaderService`. Engine wires the
/// concrete clyffy implementation in at boot and the slot loader
/// dispatches through this Arc.
pub type BurnEncoderAdapterArc = Arc<dyn BurnEncoderAdapter>;
