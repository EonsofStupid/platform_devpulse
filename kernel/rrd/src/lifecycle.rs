//! # `rrd.lifecycle` — tracing taxonomy
//!
//! Per [`HOT_UPDATE_PATTERN.md`] §11.1 and H12: the daemon emits
//! every lifecycle event on a single tracing target. The engine
//! layer's `RrdLifecycleTranslator` (see
//! `systems/devpulse-engine/src/platform/services/rrd_translator.rs`)
//! consumes events on this target and mirrors them into typed
//! [`InternalEvent::RrdPhaseTransition`] on the broadcast bus —
//! preserving the dual-observability rule by structural guarantee.
//!
//! The constants and macro live here (kernel layer) so the daemon
//! has zero dependency on the engine. The translator imports the
//! same constants for its filter check.

/// Tracing target every RRD lifecycle event uses.
///
/// Subscribers (devtool log surface, OTLP exporter, the engine
/// translator) filter on this single target.
pub const RRD_LIFECYCLE_TARGET: &str = "rrd.lifecycle";

/// Phase identifiers for RRD lifecycle events.
///
/// Mirrors the eight-step pause/swap/resume sequence from
/// [`HOT_UPDATE_PATTERN.md`] §3.2 plus failure terminals.
/// Subscribers should pattern-match the full set; not all phases
/// are emitted on every cycle (a clean pause→resume without
/// `swap` skips the load/validate/swap triplet).
pub mod lifecycle_phase {
    /// `pause()` entered; new queries gated.
    pub const PAUSE_REQUESTED: &str = "pause_requested";
    /// In-flight requests being awaited (`TaskTracker::wait`).
    pub const DRAIN_BEGIN: &str = "drain_begin";
    /// Drain finished within the timeout budget.
    pub const DRAIN_COMPLETE: &str = "drain_complete";
    /// Drain timed out; force-proceeding with swap.
    pub const DRAIN_TIMEOUT: &str = "drain_timeout";
    /// `swap()` step: loading new state from `Self::Source`.
    pub const LOAD_BEGIN: &str = "load_begin";
    /// Load complete; validation pending.
    pub const LOAD_COMPLETE: &str = "load_complete";
    /// `validate()` returned `Ok`; swap is safe.
    pub const VALIDATE_PASS: &str = "validate_pass";
    /// `validate()` rejected the new state; old state retained.
    pub const VALIDATE_FAIL: &str = "validate_fail";
    /// `ArcSwap::swap()` committed; new state live.
    pub const SWAP_COMMIT: &str = "swap_commit";
    /// `resume()` consumed the handle; daemon back to `Running`.
    pub const RESUME_COMPLETE: &str = "resume_complete";
    /// Unrecoverable terminal — `RRDState::Failed`.
    pub const FAIL: &str = "fail";
}

/// Emit a structured RRD lifecycle event at INFO level.
///
/// Required field: `phase` (one of [`lifecycle_phase`] constants).
/// Caller passes additional fields after the phase using the
/// standard `tracing` field syntax (`field = expr`, `field = ?expr`,
/// `field = %expr`).
///
/// # Example
///
/// ```ignore
/// use rrd::{emit_rrd_lifecycle, lifecycle_phase};
/// emit_rrd_lifecycle!(lifecycle_phase::DRAIN_COMPLETE,
///     in_flight = 3,
///     elapsed_ms = 142);
/// ```
#[macro_export]
macro_rules! emit_rrd_lifecycle {
    ($phase:expr $(, $($rest:tt)*)?) => {
        tracing::info!(
            target: $crate::RRD_LIFECYCLE_TARGET,
            phase = $phase
            $(, $($rest)*)?
        );
    };
}
