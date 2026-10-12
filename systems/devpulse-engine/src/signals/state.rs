//! `StateStore` — the latest value of every state signal, with a revision.
//!
//! State kinds ([`Delivery::State`](super::spec::Delivery::State)) describe
//! something Rust owns: hardware, models readiness, boot phase, the developer
//! profile. Fan-out alone cannot carry them correctly — a broadcast drops the
//! oldest values when a subscriber lags, and a window opened later never saw
//! them. The store keeps the latest signal per kind and stamps every recorded
//! signal with a process-wide, strictly increasing `revision`.
//!
//! Consumers follow the Kubernetes list-then-watch rule: subscribe first, read
//! [`StateStore::snapshot`], then apply only signals whose revision is newer
//! than what they hold. `epoch` changes when the process restarts, telling a
//! consumer that its copy belongs to an older run.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{PoisonError, RwLock};

use serde::{Deserialize, Serialize};
use specta::Type;
use uuid::Uuid;

use super::signal::Signal;
use super::variants::SignalKind;

/// Every state signal's latest value at one revision.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub struct StateSnapshot {
    /// Identifies this process run (UUID v7). A different epoch means the
    /// consumer's copy is from an earlier run and must be discarded.
    pub epoch: Uuid,
    /// Highest revision recorded when the snapshot was taken.
    pub revision: u64,
    /// The latest signal of every state kind, oldest revision first.
    pub signals: Vec<Signal>,
}

/// Latest value per state kind, stamped with a monotonic revision.
#[derive(Debug)]
pub struct StateStore {
    epoch: Uuid,
    revision: AtomicU64,
    latest: RwLock<HashMap<SignalKind, Signal>>,
}

impl StateStore {
    /// Empty store for this process run.
    #[must_use]
    pub fn new() -> Self {
        Self {
            epoch: Uuid::now_v7(),
            revision: AtomicU64::new(0),
            latest: RwLock::new(HashMap::new()),
        }
    }

    /// This process run's identity.
    #[must_use]
    pub fn epoch(&self) -> Uuid {
        self.epoch
    }

    /// Stamp the next revision onto `signal`, keep it as the latest value of
    /// its kind, and return the stamped signal for fan-out.
    ///
    /// The revision is taken under the write lock, so revision order always
    /// equals the order values entered the store.
    #[must_use]
    pub fn record(&self, mut signal: Signal) -> Signal {
        let mut latest = self.latest.write().unwrap_or_else(PoisonError::into_inner);
        let revision = self.revision.fetch_add(1, Ordering::Relaxed) + 1;
        signal.header.revision = Some(revision);
        latest.insert(signal.payload.kind(), signal.clone());
        signal
    }

    /// The latest signal of `kind`, if one was recorded.
    #[must_use]
    pub fn latest(&self, kind: SignalKind) -> Option<Signal> {
        self.latest
            .read()
            .unwrap_or_else(PoisonError::into_inner)
            .get(&kind)
            .cloned()
    }

    /// Every kind's latest signal, oldest revision first.
    #[must_use]
    pub fn snapshot(&self) -> StateSnapshot {
        let latest = self.latest.read().unwrap_or_else(PoisonError::into_inner);
        let mut signals: Vec<Signal> = latest.values().cloned().collect();
        signals.sort_by_key(|signal| signal.header.revision);
        StateSnapshot {
            epoch: self.epoch,
            revision: self.revision.load(Ordering::Relaxed),
            signals,
        }
    }
}

impl Default for StateStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use proptest::prelude::*;

    use super::*;
    use crate::signals::{
        ChatPayload, ChatRole, ContextPayload, SignalSource, SignalVariant, SystemPayload,
        SystemStatus,
    };

    fn signal(kind_index: u8, n: u32) -> Signal {
        let payload = match kind_index % 3 {
            0 => SignalVariant::System(SystemPayload {
                status: SystemStatus::Ready,
                message: n.to_string(),
            }),
            1 => SignalVariant::Chat(ChatPayload {
                content: n.to_string(),
                role: ChatRole::User,
                model: None,
            }),
            _ => SignalVariant::Context(ContextPayload {
                chunks: Vec::new(),
                query: n.to_string(),
            }),
        };
        Signal::new(SignalSource::System, payload)
    }

    proptest! {
        /// After any sequence of records: one entry per kind, each the last
        /// one recorded for that kind, revisions strictly increasing in
        /// record order, and the snapshot revision equals the record count.
        #[test]
        fn latest_wins_and_revisions_only_grow(ops in prop::collection::vec((0u8..3, any::<u32>()), 1..64)) {
            let store = StateStore::new();
            let mut last_revision = 0;
            let mut expected: HashMap<SignalKind, Signal> = HashMap::new();

            for (kind_index, n) in &ops {
                let stamped = store.record(signal(*kind_index, *n));
                let revision = stamped.header.revision.unwrap_or_default();
                prop_assert!(revision > last_revision);
                last_revision = revision;
                expected.insert(stamped.payload.kind(), stamped);
            }

            let snapshot = store.snapshot();
            prop_assert_eq!(snapshot.revision, ops.len() as u64);
            prop_assert_eq!(snapshot.epoch, store.epoch());
            prop_assert_eq!(snapshot.signals.len(), expected.len());
            for kept in &snapshot.signals {
                let want = &expected[&kept.payload.kind()];
                prop_assert_eq!(kept.header.id, want.header.id);
                prop_assert_eq!(kept.header.revision, want.header.revision);
            }
            prop_assert!(snapshot
                .signals
                .windows(2)
                .all(|pair| pair[0].header.revision < pair[1].header.revision));
        }
    }

    #[test]
    fn a_new_store_is_empty_and_each_run_has_its_own_epoch() {
        let first = StateStore::new();
        let second = StateStore::new();
        assert!(first.snapshot().signals.is_empty());
        assert_eq!(first.snapshot().revision, 0);
        assert_ne!(first.epoch(), second.epoch());
    }
}
