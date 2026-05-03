//! Grammar (structured-output) handle — public-vocabulary surface.
//!
//! # What this is
//!
//! A runtime handle for the grammar-constrained decoding subsystem. The
//! kernel provides the actual constraint engine; this handle exposes a
//! public-vocabulary snapshot that the devtool can read and control.
//!
//! Authored inside the kernel (cortex SSOT) and re-exported through the
//! engine facade per the IP-NOTE pattern at
//! `systems/devpulse-engine/src/platform/mod.rs`.
//!
//! # Architecture
//!
//! Same tier as [`crate::cortex::reasoning::state::RroStateHandle`]. Clone-friendly
//! (Arc-wrapped), not a `Service` (no lifecycle/ping/shutdown).
//!
//! The kernel will drive `record_enforcement` / `record_failure` as
//! outputs are checked. The devtool reads snapshots + toggles the
//! active grammar kind.
//!
//! # Persistence
//!
//! Failures retained in a bounded in-memory ring (last 64). Configuration
//! (kind, enabled) is held in memory only — kernel wiring will promote
//! to persistent storage when grammar becomes a first-class service.

use std::collections::VecDeque;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use devpulse_telemetry::prelude::{broadcast_channel, BroadcastReceiver, BroadcastSender};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

/// Maximum failure records retained for replay in the dev tool.
const FAILURE_HISTORY_CAP: usize = 64;

/// Capacity of the event broadcast channel.
const EVENT_BROADCAST_CAPACITY: usize = 32;

// ═══════════════════════════════════════════════════════════════
// Public types — layman-friendly, no kernel vocabulary
// ═══════════════════════════════════════════════════════════════

/// What shape the grammar engine is currently enforcing.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "snake_case")]
pub enum GrammarKind {
    /// No constraint — model emits free text.
    Off,
    /// Output must match a JSON Schema.
    JsonSchema,
    /// Output must match a regex.
    Regex,
    /// Output must be one of a fixed set of values.
    Enum,
    /// Custom kernel-defined grammar (public label only).
    Custom,
}

impl GrammarKind {
    /// Snake-case wire-format label for this kind. Matches `serde(rename_all
    /// = "snake_case")` so the value is stable across logging, telemetry,
    /// and the Tauri command surface.
    #[must_use]
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Off => "off",
            Self::JsonSchema => "json_schema",
            Self::Regex => "regex",
            Self::Enum => "enum",
            Self::Custom => "custom",
        }
    }
}

/// Overall health of the grammar engine.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "snake_case")]
pub enum GrammarStatus {
    /// No active grammar, no enforcement in progress.
    Idle,
    /// Actively constraining model output.
    Enforcing,
    /// Last enforcement failed — output didn't match.
    Failed,
    /// Grammar is disabled at the system level.
    Disabled,
}

/// A single enforcement failure. Held in a bounded ring for replay.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct GrammarFailure {
    /// Unix epoch milliseconds.
    pub at_ms: i64,
    /// The grammar kind that was enforcing.
    pub kind: GrammarKind,
    /// Grammar ID that failed (opaque).
    pub grammar_id: String,
    /// Short human-readable reason (no stack, no PII).
    pub reason: String,
}

/// A snapshot of the grammar machine.
///
/// Returned by `get_grammar_state` Tauri command. Emitted as the payload
/// of `platform:grammar-changed` Tauri events on every change.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct GrammarSnapshot {
    /// Current status.
    pub status: GrammarStatus,
    /// Currently-active grammar kind.
    pub kind: GrammarKind,
    /// Opaque identifier of the active grammar. Empty if none.
    pub active_grammar_id: String,
    /// Total number of enforcements since boot (successful).
    pub enforcement_count: u64,
    /// Total number of failures since boot.
    pub failure_count: u64,
    /// Whether the engine is enabled at the platform level.
    pub enabled: bool,
    /// Last change unix epoch ms.
    pub last_change_at_ms: i64,
    /// Recent failures (newest first, capped at `FAILURE_HISTORY_CAP`).
    pub recent_failures: Vec<GrammarFailure>,
}

// ═══════════════════════════════════════════════════════════════
// Handle — runtime-mutable, event-broadcasting
// ═══════════════════════════════════════════════════════════════

struct Inner {
    status: GrammarStatus,
    kind: GrammarKind,
    active_grammar_id: String,
    enforcement_count: u64,
    failure_count: u64,
    enabled: bool,
    last_change_at_ms: i64,
    failures: VecDeque<GrammarFailure>,
}

impl Inner {
    fn new() -> Self {
        Self {
            status: GrammarStatus::Idle,
            kind: GrammarKind::Off,
            active_grammar_id: String::new(),
            enforcement_count: 0,
            failure_count: 0,
            enabled: false,
            last_change_at_ms: now_ms(),
            failures: VecDeque::with_capacity(FAILURE_HISTORY_CAP),
        }
    }

    fn snapshot(&self) -> GrammarSnapshot {
        GrammarSnapshot {
            status: self.status,
            kind: self.kind,
            active_grammar_id: self.active_grammar_id.clone(),
            enforcement_count: self.enforcement_count,
            failure_count: self.failure_count,
            enabled: self.enabled,
            last_change_at_ms: self.last_change_at_ms,
            recent_failures: self.failures.iter().cloned().collect(),
        }
    }

    fn touch(&mut self) {
        self.last_change_at_ms = now_ms();
    }
}

/// Runtime Grammar handle. Clone-friendly.
///
/// Broadcast uses [`BroadcastSender`] (ADR-002 context-propagating wrapper) —
/// raw `tokio::sync::broadcast` is banned workspace-wide.
#[derive(Clone)]
pub struct GrammarHandle {
    inner: Arc<RwLock<Inner>>,
    events: BroadcastSender<GrammarSnapshot>,
}

impl GrammarHandle {
    /// Construct a fresh grammar handle.
    ///
    /// Initial state: `Idle` / `Off` / disabled / zero counters. The
    /// broadcast channel is allocated with [`EVENT_BROADCAST_CAPACITY`]
    /// slots; slow subscribers will see lag signals rather than block
    /// producers.
    #[must_use]
    pub fn new() -> Self {
        let (tx, _rx) = broadcast_channel(EVENT_BROADCAST_CAPACITY);
        Self {
            inner: Arc::new(RwLock::new(Inner::new())),
            events: tx,
        }
    }

    /// Subscribe to grammar snapshot changes.
    ///
    /// Returns a [`BroadcastReceiver`] — each `recv().await` yields a
    /// `LinkedTraced<GrammarSnapshot>` carrying the producer's `OTel` context
    /// as a link target.
    #[must_use]
    pub fn subscribe(&self) -> BroadcastReceiver<GrammarSnapshot> {
        self.events.subscribe()
    }

    /// Current snapshot.
    pub async fn snapshot(&self) -> GrammarSnapshot {
        self.inner.read().await.snapshot()
    }

    /// Set the active grammar kind. Does not imply enforcement.
    pub async fn set_kind(&self, kind: GrammarKind) -> GrammarSnapshot {
        let snapshot = {
            let mut g = self.inner.write().await;
            g.kind = kind;
            g.status = if kind == GrammarKind::Off {
                GrammarStatus::Idle
            } else if g.enabled {
                GrammarStatus::Enforcing
            } else {
                GrammarStatus::Disabled
            };
            g.touch();
            g.snapshot()
        };
        tracing::info!(kind = %kind.as_str(), "grammar.kind set");
        let _ = self.events.send(snapshot.clone());
        snapshot
    }

    /// Enable the engine with an opaque grammar id.
    pub async fn enable(&self, grammar_id: String) -> GrammarSnapshot {
        let snapshot = {
            let mut g = self.inner.write().await;
            g.enabled = true;
            g.active_grammar_id.clone_from(&grammar_id);
            g.status = if g.kind == GrammarKind::Off {
                GrammarStatus::Idle
            } else {
                GrammarStatus::Enforcing
            };
            g.touch();
            g.snapshot()
        };
        tracing::info!(grammar_id = %grammar_id, "grammar enabled");
        let _ = self.events.send(snapshot.clone());
        snapshot
    }

    /// Disable the engine entirely.
    pub async fn disable(&self) -> GrammarSnapshot {
        let snapshot = {
            let mut g = self.inner.write().await;
            g.enabled = false;
            g.active_grammar_id.clear();
            g.status = GrammarStatus::Disabled;
            g.touch();
            g.snapshot()
        };
        tracing::info!("grammar disabled");
        let _ = self.events.send(snapshot.clone());
        snapshot
    }

    /// Record a successful enforcement (kernel calls this per constrained output).
    pub async fn record_enforcement(&self) -> GrammarSnapshot {
        let snapshot = {
            let mut g = self.inner.write().await;
            g.enforcement_count = g.enforcement_count.saturating_add(1);
            g.status = GrammarStatus::Enforcing;
            g.touch();
            g.snapshot()
        };
        let _ = self.events.send(snapshot.clone());
        snapshot
    }

    /// Record a failure (kernel calls this per rejected output).
    pub async fn record_failure(&self, grammar_id: String, reason: String) -> GrammarSnapshot {
        let snapshot = {
            let mut g = self.inner.write().await;
            g.failure_count = g.failure_count.saturating_add(1);
            let kind = g.kind;
            g.failures.push_front(GrammarFailure {
                at_ms: now_ms(),
                kind,
                grammar_id,
                reason,
            });
            while g.failures.len() > FAILURE_HISTORY_CAP {
                g.failures.pop_back();
            }
            g.status = GrammarStatus::Failed;
            g.touch();
            g.snapshot()
        };
        tracing::warn!(
            failure_count = snapshot.failure_count,
            "grammar failure recorded"
        );
        let _ = self.events.send(snapshot.clone());
        snapshot
    }
}

impl Default for GrammarHandle {
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
    async fn initial_state_is_idle_off() {
        let h = GrammarHandle::new();
        let s = h.snapshot().await;
        assert_eq!(s.status, GrammarStatus::Idle);
        assert_eq!(s.kind, GrammarKind::Off);
        assert!(!s.enabled);
        assert_eq!(s.enforcement_count, 0);
        assert_eq!(s.failure_count, 0);
        assert!(s.recent_failures.is_empty());
    }

    #[tokio::test]
    async fn set_kind_emits_and_updates_status() {
        let h = GrammarHandle::new();
        let mut rx = h.subscribe();
        let s = h.set_kind(GrammarKind::JsonSchema).await;
        assert_eq!(s.kind, GrammarKind::JsonSchema);
        // Not enabled yet — status should be Disabled or Idle
        assert!(matches!(
            s.status,
            GrammarStatus::Disabled | GrammarStatus::Idle
        ));
        let emitted = rx.recv().await.unwrap();
        assert_eq!(emitted.value.kind, GrammarKind::JsonSchema);
    }

    #[tokio::test]
    async fn enable_transitions_to_enforcing_when_kind_set() {
        let h = GrammarHandle::new();
        h.set_kind(GrammarKind::Regex).await;
        let s = h.enable("grammar_42".to_string()).await;
        assert_eq!(s.status, GrammarStatus::Enforcing);
        assert!(s.enabled);
        assert_eq!(s.active_grammar_id, "grammar_42");
    }

    #[tokio::test]
    async fn failures_are_recorded_and_capped() {
        let h = GrammarHandle::new();
        for i in 0..(FAILURE_HISTORY_CAP + 20) {
            h.record_failure(format!("g{i}"), format!("reason {i}"))
                .await;
        }
        let s = h.snapshot().await;
        assert_eq!(s.recent_failures.len(), FAILURE_HISTORY_CAP);
        assert_eq!(s.failure_count, (FAILURE_HISTORY_CAP + 20) as u64);
    }

    #[tokio::test]
    async fn disable_clears_active_grammar() {
        let h = GrammarHandle::new();
        h.set_kind(GrammarKind::Enum).await;
        h.enable("abc".to_string()).await;
        let s = h.disable().await;
        assert!(!s.enabled);
        assert_eq!(s.active_grammar_id, "");
        assert_eq!(s.status, GrammarStatus::Disabled);
    }
}
