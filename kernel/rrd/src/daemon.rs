//! # `RRD<C>` — the daemon
//!
//! Concrete implementation of [`HotSwap<C>`] for any
//! `C: HotUpdateable`. Owns:
//!
//! - `live: Arc<ArcSwap<C>>` — the atomic pointer to the current
//!   live component (H1).
//! - `state: watch::Sender<RRDState>` — single-producer broadcast
//!   of the lifecycle state (H3). Receivers gate the query path
//!   and feed the UI / devtool.
//! - `cycle: Mutex<CycleState>` — the per-cycle drain state
//!   (`TaskTracker` + `CancellationToken`). Replaced on every
//!   resume so each pause/resume cycle gets a fresh tracker.
//!
//! ## What this doesn't own
//!
//! - The query path. Callers integrate with the tracker via
//!   [`RRD::track`] which spawns a future that obeys the
//!   cancellation token and counts toward the drain.
//! - `InternalEvent` broadcast. The daemon emits tracing only;
//!   the engine's `RrdLifecycleTranslator` mirrors to
//!   `InternalEvent::RrdPhaseTransition` (preserves H12 by
//!   structural guarantee).

use std::sync::Arc;
use std::time::Duration;

use arc_swap::ArcSwap;
use tokio::sync::{watch, Mutex};
use tokio_util::sync::CancellationToken;
use tokio_util::task::TaskTracker;

use crate::emit_rrd_lifecycle;
use crate::error::{FailureReason, RRDError};
use crate::handle::PauseHandle;
use crate::lifecycle::lifecycle_phase;
use crate::state::RRDState;
use crate::traits::{HotSwap, HotUpdateable};

/// Default drain timeout — 30s per [`HOT_UPDATE_PATTERN.md`] §H9.
/// Configurable via [`RRD::with_drain_timeout`] for tests.
const DEFAULT_DRAIN_TIMEOUT: Duration = Duration::from_secs(30);

/// Per-cycle mutable state. Replaced on every resume so each
/// pause/resume cycle gets a fresh tracker + cancellation token.
struct CycleState {
    /// Cancels the in-flight query tasks tracked by `tracker`.
    /// Cloned into each spawned task so they can `select!` on
    /// `cancel.cancelled()`.
    cancel: CancellationToken,
    /// In-flight query task tracker. `track()` spawns into this;
    /// `pause()` calls `tracker.close() + tracker.wait()` to
    /// drain.
    tracker: TaskTracker,
    /// True between `pause()` returning and `resume()` consuming
    /// the handle. Concurrent pauses are rejected (not queued)
    /// per H7.
    pause_in_progress: bool,
}

impl CycleState {
    fn fresh() -> Self {
        Self {
            cancel: CancellationToken::new(),
            tracker: TaskTracker::new(),
            pause_in_progress: false,
        }
    }
}

/// The Reason Ready Daemon for a single managed component `C`.
///
/// Construct via [`RRD::new`]. The daemon transitions immediately
/// from `Loading` to `Running` because the initial component is
/// passed in already-live (the loader is the caller's
/// responsibility — typically a Phase B safetensors loader).
pub struct RRD<C: HotUpdateable> {
    /// Atomically swappable live component. Read by the query
    /// path via `live.load()`; written only by `swap()`.
    live: Arc<ArcSwap<C>>,
    /// Lifecycle state broadcast — single producer.
    state_tx: watch::Sender<RRDState>,
    /// Internal receiver kept alive for the daemon's lifetime so
    /// `state_tx.send(...)` never fails on "no receivers." External
    /// consumers get their own receivers via [`RRD::subscribe`];
    /// this one is never read, just held.
    _state_rx_keepalive: watch::Receiver<RRDState>,
    /// Per-cycle drain state (tracker + cancel token + flag).
    cycle: Arc<Mutex<CycleState>>,
    /// Drain timeout. Default 30s; tests override.
    drain_timeout: Duration,
}

impl<C: HotUpdateable> RRD<C> {
    /// Construct a new daemon with `initial` as the first live
    /// component. Daemon enters `Running` state immediately.
    ///
    /// Boot-time encoder load is the caller's responsibility — the
    /// daemon has no opinion on how `Arc<C>` was produced. If load
    /// fails before this constructor is called, the caller should
    /// not construct an RRD at all (no `Loading → Failed` boot
    /// transition through the daemon's surface).
    ///
    pub fn new(initial: Arc<C>) -> Self {
        let live = Arc::new(ArcSwap::new(initial));
        let (state_tx, state_rx) = watch::channel(RRDState::Loading);
        // Immediately transition to Running — `Loading` is a
        // construction-time-only state in the simplified Phase A″
        // surface. A future spec evolution may add explicit
        // `boot()` semantics with health checks; for now the
        // caller has already done the load.
        //
        // SAFETY: `state_rx` (about to become `_state_rx_keepalive`)
        // is still in scope here, so the channel always has at least
        // one receiver. `watch::Sender::send` returns `Err` only when
        // there are no receivers, which is unreachable. The
        // `send_replace` API does not signal that failure mode at
        // all, so we use it here to keep `expect_used` honest.
        state_tx.send_replace(RRDState::Running);
        emit_rrd_lifecycle!(
            "ready",
            detail = "daemon constructed with initial live component"
        );
        Self {
            live,
            state_tx,
            _state_rx_keepalive: state_rx,
            cycle: Arc::new(Mutex::new(CycleState::fresh())),
            drain_timeout: DEFAULT_DRAIN_TIMEOUT,
        }
    }

    /// Override the drain timeout. Primarily for tests so the
    /// drain test doesn't have to wait 30s for the timeout path.
    #[must_use]
    pub fn with_drain_timeout(mut self, timeout: Duration) -> Self {
        self.drain_timeout = timeout;
        self
    }

    /// Subscribe to lifecycle state changes. Returns a
    /// `watch::Receiver` — call `.borrow()` to read the current
    /// state synchronously, or `.changed().await` to be notified.
    pub fn subscribe(&self) -> watch::Receiver<RRDState> {
        self.state_tx.subscribe()
    }

    /// Read the current live component. Returns an `Arc<C>`
    /// owned snapshot — call `load_full()` semantics — so the
    /// caller can drop their reference before crossing an
    /// `.await` boundary (per H5: never hold an `arc-swap::Guard`
    /// across `.await`).
    pub fn current(&self) -> Arc<C> {
        self.live.load_full()
    }

    /// Spawn a future onto the daemon's per-cycle `TaskTracker`.
    /// The future receives the cancellation token so it can
    /// `select!` on `cancel.cancelled()` and exit cleanly when
    /// pause begins.
    ///
    /// The query path uses this to ensure (a) every in-flight
    /// query counts toward the drain, and (b) the drain signal
    /// reaches every reader without polling.
    pub async fn track<F, Fut, T>(&self, f: F) -> tokio::task::JoinHandle<T>
    where
        F: FnOnce(CancellationToken) -> Fut,
        Fut: std::future::Future<Output = T> + Send + 'static,
        T: Send + 'static,
    {
        let cycle = self.cycle.lock().await;
        let cancel = cycle.cancel.clone();
        cycle.tracker.spawn(f(cancel))
    }

    /// Internal: drop the old Arc explicitly on the maintenance
    /// task (H4). Called inside `swap()` after the `ArcSwap` commit
    /// so the Drop cost is paid here, not on whichever reader
    /// happened to hold the last `Guard`.
    #[inline]
    fn drop_off_hot_path(old: Arc<C>) {
        drop(old);
    }
}

impl<C: HotUpdateable> HotSwap<C> for RRD<C> {
    async fn pause(&self) -> Result<PauseHandle, RRDError> {
        // Acquire the cycle lock briefly to set the in-progress
        // flag and snapshot the cancel/tracker. Drop the lock
        // BEFORE awaiting the drain — otherwise concurrent
        // pause/swap/resume calls would deadlock.
        let (cancel, tracker) = {
            let mut cycle = self.cycle.lock().await;
            if cycle.pause_in_progress {
                return Err(RRDError::AlreadyPaused);
            }
            cycle.pause_in_progress = true;
            (cycle.cancel.clone(), cycle.tracker.clone())
        };

        // Phase: pause_requested. Transition Running → Paused.
        emit_rrd_lifecycle!(
            lifecycle_phase::PAUSE_REQUESTED,
            detail = "begin maintenance window"
        );
        let next = self
            .state_tx
            .borrow()
            .clone()
            .try_transition(RRDState::Paused)?;
        self.state_tx
            .send(next)
            .map_err(|_| RRDError::StateBroadcastFailed)?;

        // Phase: drain_begin. Cancel new work, close tracker,
        // wait for in-flight to settle.
        emit_rrd_lifecycle!(lifecycle_phase::DRAIN_BEGIN, in_flight = tracker.len());
        cancel.cancel();
        tracker.close();

        let in_flight_at_start = tracker.len();
        let drain_result = tokio::time::timeout(self.drain_timeout, tracker.wait()).await;

        if drain_result.is_ok() {
            emit_rrd_lifecycle!(
                lifecycle_phase::DRAIN_COMPLETE,
                drained = in_flight_at_start
            );
        } else {
            // Force-proceed per H9 — daemon does NOT fail on
            // drain timeout. Subscribers count this as a
            // signal, not a fatal error.
            let stuck = tracker.len();
            emit_rrd_lifecycle!(
                lifecycle_phase::DRAIN_TIMEOUT,
                timeout_secs = self.drain_timeout.as_secs(),
                stuck = stuck
            );
        }

        Ok(PauseHandle::new())
    }

    async fn swap(&self, _handle: &PauseHandle, new: C::Snapshot) -> Result<(), RRDError> {
        // Confirm we're actually paused. Type-state encoding
        // makes this nearly unreachable, but guard against
        // state desync (e.g. Failed during the pause window).
        if !matches!(*self.state_tx.borrow(), RRDState::Paused) {
            return Err(RRDError::NotPaused);
        }

        // Transition Paused → Updating before the (potentially
        // slow) load+validate.
        let next = self
            .state_tx
            .borrow()
            .clone()
            .try_transition(RRDState::Updating)?;
        self.state_tx
            .send(next)
            .map_err(|_| RRDError::StateBroadcastFailed)?;

        // The caller already loaded the snapshot via
        // `C::load(...).await` — we just take the snapshot in.
        // Loading happens outside the daemon so the maintenance
        // task can serve other concerns concurrently if needed.
        // We DO own the validate step here so the swap-or-fail
        // decision lives at the daemon boundary.
        emit_rrd_lifecycle!(
            lifecycle_phase::LOAD_COMPLETE,
            detail = "snapshot received by daemon"
        );

        // Validate.
        if let Err(e) = C::validate(&new).await {
            let detail = e.to_string();
            emit_rrd_lifecycle!(
                lifecycle_phase::VALIDATE_FAIL,
                detail = %detail
            );
            // Transition to Failed; live component unchanged.
            let next =
                self.state_tx.borrow().clone().try_transition_to_failed(
                    FailureReason::EncoderValidationFailed(detail.clone()),
                )?;
            self.state_tx
                .send(next)
                .map_err(|_| RRDError::StateBroadcastFailed)?;
            emit_rrd_lifecycle!(
                lifecycle_phase::FAIL,
                reason = "validate_fail",
                detail = %detail
            );
            return Err(RRDError::ValidationFailed(detail));
        }
        emit_rrd_lifecycle!(
            lifecycle_phase::VALIDATE_PASS,
            detail = "new component verified"
        );

        // Promote and ArcSwap. `swap()` returns the old Arc so
        // the maintenance task owns the Drop (H4).
        let new_live = C::into_live(new);
        let old = self.live.swap(new_live);
        emit_rrd_lifecycle!(
            lifecycle_phase::SWAP_COMMIT,
            detail = "atomic pointer swap committed"
        );
        Self::drop_off_hot_path(old);

        Ok(())
    }

    async fn resume(&self, _handle: PauseHandle) -> Result<(), RRDError> {
        // Resume from whichever post-pause state we ended in.
        // Two legal predecessors per the spec matrix:
        //   - Paused → Running (no swap was attempted)
        //   - Updating → Running (swap completed successfully)
        // (Updating → Failed is a different terminal — `resume`
        //  does NOT recover from Failed; manual recovery via
        //  Failed → Loading is the operator path.)
        let current = self.state_tx.borrow().clone();
        let next = match current {
            RRDState::Paused | RRDState::Updating => {
                current.clone().try_transition(RRDState::Running)?
            }
            other => {
                return Err(RRDError::StateTransitionInvalid {
                    from: format!("{other:?}"),
                    to: "Running".into(),
                });
            }
        };
        self.state_tx
            .send(next)
            .map_err(|_| RRDError::StateBroadcastFailed)?;

        // Refresh the cycle: new tracker + new cancel token so
        // the next pause cycle starts clean.
        {
            let mut cycle = self.cycle.lock().await;
            *cycle = CycleState::fresh();
        }

        emit_rrd_lifecycle!(
            lifecycle_phase::RESUME_COMPLETE,
            detail = "maintenance window closed; daemon resumed"
        );
        Ok(())
    }
}
