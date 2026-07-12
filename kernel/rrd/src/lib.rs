//! # `rrd` — Reason Ready Daemon
//!
//! In-process orchestrator for the RRO cluster's hot-update lifecycle.
//! Implements the contract specified in
//! [`scripts/docs/specs/cortex/rro/HOT_UPDATE_PATTERN.md`] and consumed
//! by [`scripts/docs/specs/cortex/rro/RRD.md`].
//!
//! ## What this crate owns
//!
//! - [`RRDState`] — five-state lifecycle (`Loading | Running | Paused |
//!   Updating | Failed`).
//! - [`PauseHandle`] — opaque move-only proof-of-pause; encodes the
//!   `pause → swap → resume` protocol in the type system.
//! - [`RRDError`] / [`FailureReason`] — errors and terminal failure
//!   reasons.
//! - [`HotUpdateable`] — the trait every swappable component
//!   implements (the swappee surface).
//! - [`HotSwap`] — the trait the daemon implements (the orchestrator
//!   surface).
//! - [`RRD`] — the concrete daemon. One per swappable component;
//!   parameterised over `C: HotUpdateable`.
//! - [`RRD_LIFECYCLE_TARGET`] / [`lifecycle_phase`] — the tracing
//!   taxonomy. Engine layer's translator consumes events on this
//!   target and mirrors them into `InternalEvent::RrdPhaseTransition`.
//!
//! ## What this crate does NOT own
//!
//! - `InternalEvent` / `EventCategory` — these live in
//!   `devpulse-engine` because they're the engine's typed broadcast
//!   bus. The RRD layer crosses outward via tracing only;
//!   translation happens at the engine layer.
//! - The RRO public API surface (`pause_for_update / swap_encoder /
//!   resume`) — that's an engine-layer wrapper around `RRD`.
//! - Concrete `HotUpdateable` impls (`BurnEmbedder`, backend types) —
//!   those live in their owner crates (e.g. `devpulse-clyffy` for
//!   the encoder).
//!
//! ## Layer boundary
//!
//! `rrd` is a kernel crate. It does NOT depend on `devpulse-engine`.
//! Dual-observability (H12) is preserved by the engine-side tracing
//! translator that maps `target: "rrd.lifecycle"` events to
//! `InternalEvent::RrdPhaseTransition` 1:1 — see the
//! `RrdLifecycleTranslator` layer in
//! `systems/devpulse-engine/src/platform/services/rrd_translator.rs`.

pub mod daemon;
pub mod error;
pub mod handle;
pub mod lifecycle;
pub mod state;
pub mod traits;

pub use daemon::RRD;
pub use error::{FailureReason, RRDError};
pub use handle::PauseHandle;
pub use lifecycle::{lifecycle_phase, RRD_LIFECYCLE_TARGET};
pub use state::RRDState;
pub use traits::{HotSwap, HotUpdateable};
