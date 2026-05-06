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
//! ## What does NOT flow through the adapter
//!
//! - Forward / inference. The embedder is consumed by the RRO
//!   service in clyffy directly via `Arc<ArcSwap<BurnEmbedder<B>>>`
//!   readers; model-loader never invokes a forward pass.
//! - Hot-update orchestration. The RRD daemon (`kernel/rrd`) owns
//!   the swap surface; this adapter only exposes the initial load
//!   so the slot system can transition Empty → Ready.

use crate::loading::states::MemoryFootprint;
use std::path::Path;
use std::sync::Arc;

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
    fn unload_blocking(&self) -> anyhow::Result<()>;

    /// True iff a Burn encoder is currently loaded. Cheap; the
    /// adapter implementation typically reads an `ArcSwap` slot.
    fn is_loaded(&self) -> bool;
}

/// Type-erased handle held by `ModelLoaderService`. Engine wires the
/// concrete clyffy implementation in at boot and the slot loader
/// dispatches through this Arc.
pub type BurnEncoderAdapterArc = Arc<dyn BurnEncoderAdapter>;
