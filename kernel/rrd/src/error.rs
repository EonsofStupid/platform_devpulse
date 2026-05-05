//! # `RRDError` — daemon error type
//!
//! Errors returned by the daemon's pause/swap/resume API and the
//! state-transition matrix. `FailureReason` is the terminal-failure
//! enum that gets parked inside `RRDState::Failed`.

use thiserror::Error;

/// Errors returned by [`crate::HotSwap`] methods.
#[derive(Debug, Error, Clone)]
pub enum RRDError {
    /// `pause()` called while another pause is already in progress.
    /// Concurrent pauses are rejected (not queued) per H7 — queuing
    /// would risk one caller resuming a different swap than they
    /// intended.
    #[error("daemon already paused — concurrent pauses are rejected, not queued")]
    AlreadyPaused,

    /// `swap()` or `resume()` called without an active pause window.
    /// The type system makes this nearly unreachable
    /// (`PauseHandle` is move-only), but the runtime check exists
    /// for the case where the daemon's internal state desyncs from
    /// the handle (e.g. after a `Failed` transition).
    #[error("daemon is not in a paused state — pause() must succeed first")]
    NotPaused,

    /// Drain timed out (default 30s per H9). The daemon force-proceeds
    /// with the swap — this error is informational, not a hard fail.
    /// Tests check that emitting the timeout phase does NOT prevent
    /// the swap from continuing.
    #[error("drain timed out after {timeout_secs}s — force-proceeded with {in_flight} in-flight")]
    DrainTimeout {
        /// Configured drain timeout in seconds.
        timeout_secs: u64,
        /// Number of in-flight tasks still tracked when the timeout
        /// fired.
        in_flight: usize,
    },

    /// `HotUpdateable::load` returned an error. Detail is the
    /// `Display` of the underlying load error.
    #[error("load failed: {0}")]
    LoadFailed(String),

    /// `HotUpdateable::validate` returned an error. Detail is the
    /// `Display` of the underlying validation error. On this error,
    /// the daemon transitions to
    /// `Failed(FailureReason::EncoderValidationFailed)` and the live
    /// component remains the previous one.
    #[error("validation failed: {0} — keeping previous live component")]
    ValidationFailed(String),

    /// Caller attempted an illegal state transition. Detail records
    /// both endpoints so log-tail readers can map back to the spec
    /// matrix.
    #[error("illegal state transition: {from} -> {to}")]
    StateTransitionInvalid {
        /// Source state, formatted via `Debug`.
        from: String,
        /// Target state, formatted via `Debug`.
        to: String,
    },

    /// `watch::Sender::send` returned `Err` (no receivers alive).
    /// Should not happen in practice — the daemon owns the receiver
    /// — but catalogued here so the daemon's `?` operator has a
    /// home for the conversion.
    #[error("state broadcast failed — no receivers (programming error)")]
    StateBroadcastFailed,

    /// Catch-all for unexpected internal errors. Detail is a short
    /// human description; full context goes to the tracing log.
    #[error("internal error: {0}")]
    Internal(String),
}

/// Reason a daemon transitioned into `RRDState::Failed`. Stored in
/// the state variant so observers can distinguish recoverable from
/// unrecoverable failures and the devtool can show a layman summary.
///
/// `Clone` so transitions can record the reason in events without
/// moving it out of state.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FailureReason {
    /// Boot-time encoder load failed before the daemon ever served
    /// traffic. Operator must fix the source path and restart.
    BootEncoderLoadFailed(String),

    /// Drain exceeded the configured timeout. Recorded but daemon
    /// proceeded with the swap — this reason marks an INFORMATIONAL
    /// failure recorded for diagnostics; the daemon itself stays
    /// in `Updating` then `Running` if the swap succeeded.
    DrainTimeout,

    /// `HotUpdateable::load` errored mid-update. Live component
    /// unchanged.
    EncoderLoadFailed(String),

    /// `HotUpdateable::validate` rejected the loaded snapshot.
    /// Live component unchanged.
    EncoderValidationFailed(String),

    /// Catch-all. Use sparingly — typed reasons above are preferred
    /// so devtools can render specific guidance.
    Internal(String),
}
