//! RRO state machine — public-vocabulary types + runtime handle.
//!
//! # IP Doctrine
//!
//! This module speaks ONLY registry vocabulary (see
//! `systems/devpulse-engine/ip/signals.registry.yaml` — group `rro`).
//! The type names here (`RroState`, `RroDepth`, etc.) match the public
//! signal attribute members exactly. No kernel-internal names leak.
//!
//! Authored inside the kernel (cortex SSOT) and re-exported through the
//! engine facade per the IP-NOTE pattern at
//! `systems/devpulse-engine/src/platform/mod.rs`.
//!
//! # Design
//!
//! - `RroStateHandle` is clone-friendly, Arc-wrapped.
//! - Transitions are recorded in-memory (ring buffer) AND emitted as
//!   Tauri events (`platform:rro-state-changed`) so UIs update live
//!   without polling.
//! - Each transition carries a `reason` string for traceability.
//! - Proximity (0.0..1.0) is a diagnostic signal per the registry —
//!   how close the current RRO is to a friction boundary (staleness,
//!   contradiction, cost).
//!
//! # Persistence
//!
//! Transition history lives in a bounded in-memory ring (last 256).
//! Future kernel work will promote this to a DuckDB-backed stream for
//! full replay — the handle's API does not change.

use std::collections::VecDeque;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use devpulse_telemetry::prelude::{broadcast_channel, BroadcastReceiver, BroadcastSender};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

/// Default proximity value on boot. 0.5 = neutral — neither near friction
/// nor comfortably safe. Diagnostics adjust this as the RRO progresses.
pub const DEFAULT_PROXIMITY: f32 = 0.5;

/// Maximum transitions retained for replay in the dev tool.
const TRANSITION_HISTORY_CAP: usize = 256;

/// Capacity of the event broadcast channel. Backpressure: oldest dropped.
const EVENT_BROADCAST_CAPACITY: usize = 64;

// ═══════════════════════════════════════════════════════════════
// Public types — mirror signals.registry.yaml group `rro`
// ═══════════════════════════════════════════════════════════════

/// RRO lifecycle state.
///
/// SSOT: `signals.registry.yaml` → group `rro` → attribute `rro.state`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum RroState {
    /// No active RRO.
    Idle,
    /// Collecting relevant context.
    Gathering,
    /// Structuring collected context.
    Processing,
    /// Weighing alternatives before committing.
    Ruminating,
    /// Context prepared, ready to act.
    Ready,
    /// Context discarded as stale or contaminated.
    Purged,
    /// Context branched into alternative paths.
    Forked,
}

impl RroState {
    /// Canonical string form (matches `signals.registry.yaml` member ids).
    #[must_use]
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Idle => "idle",
            Self::Gathering => "gathering",
            Self::Processing => "processing",
            Self::Ruminating => "ruminating",
            Self::Ready => "ready",
            Self::Purged => "purged",
            Self::Forked => "forked",
        }
    }
}

/// Deliberation depth — how deeply Clyffy ruminates before acting.
///
/// SSOT: `signals.registry.yaml` → group `rro` → attribute `rro.depth`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum RroDepth {
    /// Fast-path, minimal deliberation.
    Shallow,
    /// Standard deliberation.
    Normal,
    /// Extended deliberation.
    Deep,
}

impl RroDepth {
    /// Canonical string form.
    #[must_use]
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Shallow => "shallow",
            Self::Normal => "normal",
            Self::Deep => "deep",
        }
    }
}

/// A single transition record. Held in the ring buffer for replay.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct RroStateTransition {
    /// Previous state (None for the initial transition into `idle`).
    pub from: Option<RroState>,
    /// New state after this transition.
    pub to: RroState,
    /// Unix epoch milliseconds when the transition occurred.
    pub at_ms: i64,
    /// Opaque source/reason — per registry, never an algorithm name.
    pub reason: String,
}

/// A snapshot of the RRO machine at a point in time.
///
/// Returned by `get_rro_state` Tauri command. Emitted as the payload of
/// `platform:rro-state-changed` Tauri events.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct RroStateSnapshot {
    /// Current state.
    pub state: RroState,
    /// Current rumination depth.
    pub depth: RroDepth,
    /// Opaque origin identifier (per registry `rro.source`).
    pub source: String,
    /// Unix epoch milliseconds of the last transition.
    pub last_transition_at_ms: i64,
    /// Diagnostic proximity (0.0..1.0) — closer to 1.0 = closer to friction.
    pub proximity: f32,
    /// Recent transitions (newest first, capped at `TRANSITION_HISTORY_CAP`).
    pub history: Vec<RroStateTransition>,
}

// ═══════════════════════════════════════════════════════════════
// Handle — runtime-mutable, event-broadcasting
// ═══════════════════════════════════════════════════════════════

struct Inner {
    state: RroState,
    depth: RroDepth,
    source: String,
    last_transition_at_ms: i64,
    proximity: f32,
    history: VecDeque<RroStateTransition>,
}

impl Inner {
    fn new() -> Self {
        let at_ms = now_ms();
        let initial = RroStateTransition {
            from: None,
            to: RroState::Idle,
            at_ms,
            reason: "boot".to_string(),
        };
        let mut history = VecDeque::with_capacity(TRANSITION_HISTORY_CAP);
        history.push_front(initial);
        Self {
            state: RroState::Idle,
            depth: RroDepth::Normal,
            source: String::new(),
            last_transition_at_ms: at_ms,
            proximity: DEFAULT_PROXIMITY,
            history,
        }
    }

    fn snapshot(&self) -> RroStateSnapshot {
        RroStateSnapshot {
            state: self.state,
            depth: self.depth,
            source: self.source.clone(),
            last_transition_at_ms: self.last_transition_at_ms,
            proximity: self.proximity,
            history: self.history.iter().cloned().collect(),
        }
    }

    fn record(&mut self, to: RroState, reason: String) {
        let from = Some(self.state);
        let at_ms = now_ms();
        self.history.push_front(RroStateTransition {
            from,
            to,
            at_ms,
            reason,
        });
        while self.history.len() > TRANSITION_HISTORY_CAP {
            self.history.pop_back();
        }
        self.state = to;
        self.last_transition_at_ms = at_ms;
    }
}

/// Runtime RRO state handle. Clone-friendly (all Arc-wrapped).
#[derive(Clone)]
pub struct RroStateHandle {
    inner: Arc<RwLock<Inner>>,
    /// Broadcast channel for live snapshot updates. Subscribers receive a
    /// full snapshot on every transition so UIs can replace their view.
    /// Uses [`BroadcastSender`] (context-propagating wrapper) per ADR-002 —
    /// raw `tokio::sync::broadcast` is banned workspace-wide.
    events: BroadcastSender<RroStateSnapshot>,
}

impl RroStateHandle {
    /// Create a fresh handle. Initial state: `idle`, depth: `normal`.
    #[must_use]
    pub fn new() -> Self {
        let (tx, _rx) = broadcast_channel(EVENT_BROADCAST_CAPACITY);
        Self {
            inner: Arc::new(RwLock::new(Inner::new())),
            events: tx,
        }
    }

    /// Subscribe to state transitions. Each transition sends the full new
    /// snapshot. Receivers that fall behind lose the oldest events.
    ///
    /// Returns a [`BroadcastReceiver`] — each `recv().await` yields a
    /// `LinkedTraced<RroStateSnapshot>` carrying the producer's `OTel` context
    /// as a link target (fan-out peers, not children).
    #[must_use]
    pub fn subscribe(&self) -> BroadcastReceiver<RroStateSnapshot> {
        self.events.subscribe()
    }

    /// Snapshot the current state.
    pub async fn snapshot(&self) -> RroStateSnapshot {
        self.inner.read().await.snapshot()
    }

    /// Set the deliberation depth. Emits a transition snapshot.
    ///
    /// Depth changes do NOT transition state — they modify future behavior.
    pub async fn set_depth(&self, depth: RroDepth) -> RroStateSnapshot {
        let snapshot = {
            let mut g = self.inner.write().await;
            g.depth = depth;
            g.snapshot()
        };
        tracing::info!(depth = %depth.as_str(), "rro.depth set");
        let _ = self.events.send(snapshot.clone());
        snapshot
    }

    /// Set the proximity indicator (0..1, clamped).
    pub async fn set_proximity(&self, value: f32) -> RroStateSnapshot {
        let snapshot = {
            let mut g = self.inner.write().await;
            g.proximity = value.clamp(0.0, 1.0);
            g.snapshot()
        };
        let _ = self.events.send(snapshot.clone());
        snapshot
    }

    /// Request a gather. Transitions idle → gathering.
    ///
    /// `source` is an opaque provenance label (registry rule: never an
    /// algorithm or backend name).
    pub async fn gather(&self, source: String) -> RroStateSnapshot {
        let reason = format!("gather:{source}");
        let snapshot = {
            let mut g = self.inner.write().await;
            g.source = source;
            g.record(RroState::Gathering, reason.clone());
            g.snapshot()
        };
        tracing::info!(reason = %reason, "rro.state → gathering");
        let _ = self.events.send(snapshot.clone());
        snapshot
    }

    /// Request a purge. Transitions current → purged with a reason.
    pub async fn purge(&self, reason: String) -> RroStateSnapshot {
        let tagged = format!("purge:{reason}");
        let snapshot = {
            let mut g = self.inner.write().await;
            g.record(RroState::Purged, tagged.clone());
            g.snapshot()
        };
        tracing::info!(reason = %tagged, "rro.state → purged");
        let _ = self.events.send(snapshot.clone());
        snapshot
    }

    /// Request a fork. Transitions current → forked with a label.
    pub async fn fork(&self, label: String) -> RroStateSnapshot {
        let tagged = format!("fork:{label}");
        let snapshot = {
            let mut g = self.inner.write().await;
            g.record(RroState::Forked, tagged.clone());
            g.snapshot()
        };
        tracing::info!(reason = %tagged, "rro.state → forked");
        let _ = self.events.send(snapshot.clone());
        snapshot
    }

    /// Direct transition to any state (kernel-driven path).
    /// Prefer `gather`/`purge`/`fork` for public verbs.
    pub async fn transition(&self, to: RroState, reason: String) -> RroStateSnapshot {
        let snapshot = {
            let mut g = self.inner.write().await;
            g.record(to, reason.clone());
            g.snapshot()
        };
        tracing::info!(target = %to.as_str(), reason = %reason, "rro.state transition");
        let _ = self.events.send(snapshot.clone());
        snapshot
    }
}

impl Default for RroStateHandle {
    fn default() -> Self {
        Self::new()
    }
}

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| i64::try_from(d.as_millis()).unwrap_or(i64::MAX))
        .unwrap_or(0)
}

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn initial_state_is_idle() {
        let h = RroStateHandle::new();
        let s = h.snapshot().await;
        assert_eq!(s.state, RroState::Idle);
        assert_eq!(s.depth, RroDepth::Normal);
        assert_eq!(s.history.len(), 1);
    }

    #[tokio::test]
    async fn gather_transitions_state_and_emits() {
        let h = RroStateHandle::new();
        let mut rx = h.subscribe();
        let s = h.gather("test_source".to_string()).await;
        assert_eq!(s.state, RroState::Gathering);
        assert_eq!(s.source, "test_source");
        let emitted = rx.recv().await.expect("should emit");
        assert_eq!(emitted.value.state, RroState::Gathering);
    }

    #[tokio::test]
    async fn set_depth_does_not_transition_state() {
        let h = RroStateHandle::new();
        h.set_depth(RroDepth::Deep).await;
        let s = h.snapshot().await;
        assert_eq!(s.state, RroState::Idle);
        assert_eq!(s.depth, RroDepth::Deep);
    }

    #[tokio::test]
    async fn history_is_capped() {
        let h = RroStateHandle::new();
        for i in 0..(TRANSITION_HISTORY_CAP + 50) {
            h.transition(RroState::Ruminating, format!("{i}")).await;
        }
        let s = h.snapshot().await;
        assert_eq!(s.history.len(), TRANSITION_HISTORY_CAP);
    }

    #[tokio::test]
    async fn proximity_clamps() {
        let h = RroStateHandle::new();
        h.set_proximity(2.5).await;
        assert!((h.snapshot().await.proximity - 1.0).abs() < f32::EPSILON);
        h.set_proximity(-0.5).await;
        assert!(h.snapshot().await.proximity.abs() < f32::EPSILON);
    }
}
