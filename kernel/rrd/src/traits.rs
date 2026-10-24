//! # `HotUpdateable` and `HotSwap` — the two-trait contract
//!
//! Specified in [`HOT_UPDATE_PATTERN.md`] §5.1 / §5.2. Any in-process
//! component that wants the daemon's pause/drain/swap/resume
//! lifecycle implements [`HotUpdateable`]. The daemon ([`RRD<C>`])
//! implements [`HotSwap<C>`] over any such component.
//!
//! ## Native `async fn` in traits
//!
//! These traits use Rust 1.75+ native async fn. They are NOT
//! object-safe — that's intentional. The daemon is generic over
//! `C: HotUpdateable`, not `Box<dyn HotUpdateable>`. If a future
//! caller needs trait objects, switch to `async-trait` at that point;
//! don't pre-pay the allocation now.
//!
//! ## `Send + Sync + 'static` bounds
//!
//! Required so [`ArcSwap<Self>`] can cross task boundaries.
//! Verified at the assertion site
//! `kernel/devpulse-clyffy/src/cortex/persistence/burn/mod.rs`
//! per `HOT_UPDATE_PATTERN.md` §12 verification 1.

use crate::error::RRDError;
use crate::handle::PauseHandle;
use std::sync::Arc;

/// A component whose live state can be replaced atomically while
/// the process is running.
///
/// Implementor owns the type bounds (load source, snapshot type,
/// load error); the orchestrator owns the swap protocol. The
/// `validate` step is a separate trait method from `load` because
/// the failure semantics differ:
///
/// - `load` failure → `RRDError::LoadFailed`, daemon stays in
///   `Updating` then transitions to `Failed`. Live component
///   unchanged.
/// - `validate` failure → `RRDError::ValidationFailed`, same
///   recovery. Snapshot is dropped without ever becoming live.
pub trait HotUpdateable: Send + Sync + 'static {
    /// The serialized form on disk (e.g. safetensors path +
    /// tokenizer dir, or `rro.toml` config block).
    type Source: Send + Sync + 'static;

    /// Loaded-but-not-yet-live form. Live state is `Arc<Self>`.
    /// Distinguishing `Snapshot` from `Self` makes it impossible
    /// to accidentally race a partially-constructed component
    /// into `ArcSwap` — only [`HotUpdateable::into_live`] performs
    /// the promotion.
    type Snapshot: Send + Sync + 'static;

    /// Errors returned by `load`/`validate`. Must implement
    /// `Display` (used by `RRDError::LoadFailed`/`ValidationFailed`
    /// detail) and `Send` so the daemon's maintenance task can
    /// receive them across an `.await`.
    type LoadError: std::error::Error + Send + Sync + 'static;

    /// Load from disk (or other source). Must NOT mutate any live
    /// state. May be slow (5+ seconds is fine — happens during
    /// `Updating`, not `Paused`). Async because real loaders need
    /// async I/O for the safetensors files.
    fn load(
        source: &Self::Source,
    ) -> impl std::future::Future<Output = Result<Self::Snapshot, Self::LoadError>> + Send;

    /// Validate the snapshot can produce sensible output BEFORE
    /// the swap. For an encoder: dimension match + one synthetic
    /// forward pass yields a finite vector. For a backend: health
    /// probe + schema match.
    fn validate(
        snap: &Self::Snapshot,
    ) -> impl std::future::Future<Output = Result<(), Self::LoadError>> + Send;

    /// Promote a validated snapshot to live form. Cheap — no I/O.
    /// Typically `Arc::new(snap.into_live_inner())`. Happens
    /// DURING the maintenance window where every millisecond is
    /// user-visible, so this method must not allocate large
    /// structures.
    fn into_live(snap: Self::Snapshot) -> Arc<Self>;
}

/// The orchestrator-side trait. Implemented by [`crate::RRD`]
/// for any `C: HotUpdateable`.
///
/// Three methods, each gated by [`PauseHandle`] type-state:
///
/// - `pause` returns a handle, which proves you've paused.
/// - `swap` borrows a handle (so you must have one — i.e. you
///   must have paused).
/// - `resume` consumes the handle (so it can only happen once).
///
/// The compiler rejects `resume` without `pause`, double-`resume`,
/// and `swap` without `pause`. The state-machine assertion in
/// [`crate::RRDState::try_transition`] is the runtime check that
/// catches the (hopefully impossible) cases not encoded in types
/// — e.g. concurrent calls from different tasks racing through
/// the daemon's state.
pub trait HotSwap<C: HotUpdateable>: Send + Sync {
    /// Begin the maintenance window: gate new queries, drain
    /// in-flight work. Returns the proof-of-pause handle.
    fn pause(&self) -> impl std::future::Future<Output = Result<PauseHandle, RRDError>> + Send;

    /// Replace the live `Arc<C>` with the validated snapshot.
    /// Caller supplies the handle from `pause`. Old `Arc<C>` is
    /// dropped on the maintenance task, NOT on a query thread (H4).
    fn swap(
        &self,
        handle: &PauseHandle,
        new: C::Snapshot,
    ) -> impl std::future::Future<Output = Result<(), RRDError>> + Send;

    /// End the maintenance window. Consumes the handle so resume
    /// cannot happen twice.
    fn resume(
        &self,
        handle: PauseHandle,
    ) -> impl std::future::Future<Output = Result<(), RRDError>> + Send;
}
