//! # `RRDState` — daemon lifecycle state machine
//!
//! Five-state machine specified in
//! [`scripts/docs/specs/cortex/rro/RRD.md`] §2 and re-quoted verbatim
//! in [`HOT_UPDATE_PATTERN.md`] §3.1.
//!
//! ## Legal transitions
//!
//! | From       | To         | Trigger                                              |
//! | ---------- | ---------- | ---------------------------------------------------- |
//! | `Loading`  | `Running`  | All backends healthy, encoder loaded                 |
//! | `Loading`  | `Failed`   | Critical backend unreachable, encoder corrupt        |
//! | `Running`  | `Paused`   | `pause_for_update` called                            |
//! | `Running`  | `Failed`   | Critical health-check failure                        |
//! | `Paused`   | `Updating` | `swap_encoder` called with new weights path          |
//! | `Paused`   | `Running`  | `resume` called without an intervening swap          |
//! | `Updating` | `Running`  | `ArcSwap` completed, new encoder validated           |
//! | `Updating` | `Failed`   | New encoder failed validation                        |
//! | `Failed`   | `Loading`  | Manual recovery: restart with cleared error state    |
//!
//! All other transitions are illegal and return
//! [`RRDError::StateTransitionInvalid`].

use crate::error::{FailureReason, RRDError};

/// Daemon lifecycle state. Single producer (the daemon itself);
/// many consumers (UI, tests, the query path's gate check, the
/// devtool Debug tab).
///
/// `PartialEq` is implemented as variant-only equality —
/// `Failed(reason1) == Failed(reason2)` regardless of reason — so
/// state-machine assertions don't need to spell out the failure
/// reason. Use [`RRDState::failure_reason`] to extract the reason
/// when it matters.
#[derive(Debug, Clone)]
pub enum RRDState {
    /// Cold start: reading config, loading encoder weights.
    Loading,
    /// Fully operational: queries accepted.
    Running,
    /// Maintenance window: new queries queue or get
    /// [`RRDError::NotReady`].
    Paused,
    /// Atomic encoder swap in progress (`ArcSwap`).
    Updating,
    /// Unrecoverable error. Required for diagnostics — daemon does
    /// not auto-recover; explicit transition to `Loading` is
    /// required (manual recovery).
    Failed(FailureReason),
}

impl PartialEq for RRDState {
    fn eq(&self, other: &Self) -> bool {
        std::mem::discriminant(self) == std::mem::discriminant(other)
    }
}
impl Eq for RRDState {}

impl RRDState {
    /// Return the [`FailureReason`] iff this is the `Failed` variant.
    pub fn failure_reason(&self) -> Option<&FailureReason> {
        match self {
            Self::Failed(r) => Some(r),
            _ => None,
        }
    }

    /// Validate a `from → to` transition against the spec matrix.
    ///
    /// Returns `Ok(target)` if legal so callers can chain
    /// `state = state.try_transition(target)?`. Returns
    /// [`RRDError::StateTransitionInvalid`] otherwise.
    ///
    /// `Failed` is encoded with a placeholder reason (the matrix
    /// is variant-only); use [`RRDState::try_transition_to_failed`]
    /// when transitioning to `Failed` so the reason gets recorded.
    ///
    /// # Errors
    ///
    /// Returns [`RRDError::StateTransitionInvalid`] when the `from → to`
    /// edge is not in the legal-transition matrix above.
    pub fn try_transition(self, to: RRDState) -> Result<RRDState, RRDError> {
        let legal = matches!(
            (&self, &to),
            (Self::Loading | Self::Paused | Self::Updating, Self::Running,)
                | (
                    Self::Loading | Self::Running | Self::Updating,
                    Self::Failed(_),
                )
                | (Self::Running, Self::Paused)
                | (Self::Paused, Self::Updating)
                | (Self::Failed(_), Self::Loading)
        );
        if legal {
            Ok(to)
        } else {
            Err(RRDError::StateTransitionInvalid {
                from: format!("{self:?}"),
                to: format!("{to:?}"),
            })
        }
    }

    /// Sugar for transitioning to `Failed(reason)` while preserving
    /// the reason. Equivalent to
    /// `try_transition(Self::Failed(reason))`.
    ///
    /// # Errors
    ///
    /// Returns [`RRDError::InvalidTransition`] when the current state
    /// is one from which the state machine forbids entering `Failed`.
    pub fn try_transition_to_failed(self, reason: FailureReason) -> Result<RRDState, RRDError> {
        self.try_transition(RRDState::Failed(reason))
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Test 5 — State-machine transition test (HOT_UPDATE_PATTERN.md §12)
// ═══════════════════════════════════════════════════════════════════════
//
// "Every legal `RRDState → RRDState` edge from RRD.md §2 succeeds;
//  every illegal edge errors."

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, clippy::expect_used, reason = "test assertions")]
    use super::*;

    fn placeholder_failed() -> RRDState {
        RRDState::Failed(FailureReason::Internal("test".into()))
    }

    /// Every legal edge from the spec matrix must succeed.
    #[test]
    fn all_legal_edges_succeed() {
        let legal: &[(RRDState, RRDState)] = &[
            (RRDState::Loading, RRDState::Running),
            (RRDState::Loading, placeholder_failed()),
            (RRDState::Running, RRDState::Paused),
            (RRDState::Running, placeholder_failed()),
            (RRDState::Paused, RRDState::Updating),
            (RRDState::Paused, RRDState::Running),
            (RRDState::Updating, RRDState::Running),
            (RRDState::Updating, placeholder_failed()),
            (placeholder_failed(), RRDState::Loading),
        ];
        for (from, to) in legal {
            let result = from.clone().try_transition(to.clone());
            assert!(
                result.is_ok(),
                "expected {from:?} -> {to:?} to be legal, got {result:?}"
            );
        }
    }

    /// Every illegal edge must error.
    #[test]
    fn illegal_edges_error() {
        let illegal: &[(RRDState, RRDState)] = &[
            // Self-transitions never happen (states are distinct events).
            (RRDState::Loading, RRDState::Loading),
            (RRDState::Running, RRDState::Running),
            (RRDState::Paused, RRDState::Paused),
            (RRDState::Updating, RRDState::Updating),
            // Skip-state forbidden:
            (RRDState::Loading, RRDState::Paused),
            (RRDState::Loading, RRDState::Updating),
            (RRDState::Running, RRDState::Updating),
            (RRDState::Running, RRDState::Loading),
            (RRDState::Paused, RRDState::Loading),
            (RRDState::Paused, placeholder_failed()),
            (RRDState::Updating, RRDState::Paused),
            (RRDState::Updating, RRDState::Loading),
            (placeholder_failed(), RRDState::Running),
            (placeholder_failed(), RRDState::Paused),
            (placeholder_failed(), RRDState::Updating),
            (placeholder_failed(), placeholder_failed()),
        ];
        for (from, to) in illegal {
            let result = from.clone().try_transition(to.clone());
            assert!(
                matches!(result, Err(RRDError::StateTransitionInvalid { .. })),
                "expected {from:?} -> {to:?} to be illegal, got {result:?}"
            );
        }
    }

    #[test]
    fn try_transition_to_failed_preserves_reason() {
        let reason = FailureReason::EncoderValidationFailed("dim mismatch".into());
        let next = RRDState::Updating
            .try_transition_to_failed(reason.clone())
            .expect("Updating -> Failed is a legal edge in the spec matrix");
        assert_eq!(next.failure_reason(), Some(&reason));
    }

    #[test]
    fn partial_eq_is_variant_only() {
        let a = RRDState::Failed(FailureReason::DrainTimeout);
        let b = RRDState::Failed(FailureReason::Internal("other".into()));
        assert_eq!(
            a, b,
            "Failed variants must compare equal regardless of reason"
        );
        assert_ne!(a, RRDState::Running);
    }
}
