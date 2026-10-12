//! `SignalRouter` — context-propagating broadcast channel for signal fanout,
//! plus the interest registry producers use to run only while watched.
//!
//! Uses `devpulse_telemetry::BroadcastSender` so each subscriber can link its
//! span back to the producer (1:N fan-out, not parent-child) — see ADR-002.
//!
//! # Interest
//!
//! A subscriber (a UI window, identified by its label) declares which kinds
//! it is watching. Interest is a set per kind, so re-declaring after a window
//! reload never double-counts, and [`SignalRouter::forget_subscriber`] drops
//! everything a closed window held. Producers observe a kind through
//! [`SignalRouter::interest`] — a `watch` that is `true` while anyone watches.

use std::collections::{HashMap, HashSet};
use std::sync::{Mutex, PoisonError};

use devpulse_telemetry::prelude::{broadcast_channel, BroadcastReceiver, BroadcastSender};
use tokio::sync::watch;

use super::signal::Signal;
use super::variants::SignalKind;

/// Default channel capacity.
const CHANNEL_CAPACITY: usize = 1024;

/// Who is watching one kind, and the switch producers observe.
#[derive(Debug)]
struct Interest {
    watchers: HashSet<String>,
    watched: watch::Sender<bool>,
}

impl Interest {
    fn new() -> Self {
        Self {
            watchers: HashSet::new(),
            watched: watch::Sender::new(false),
        }
    }

    fn publish(&self) {
        self.watched.send_replace(!self.watchers.is_empty());
    }
}

/// Signal router for broadcasting signals to multiple subscribers.
pub struct SignalRouter {
    tx: BroadcastSender<Signal>,
    interest: Mutex<HashMap<SignalKind, Interest>>,
}

impl SignalRouter {
    /// Create a new router with default capacity.
    pub fn new() -> Self {
        Self::with_capacity(CHANNEL_CAPACITY)
    }

    /// Create a new router with custom capacity.
    pub fn with_capacity(capacity: usize) -> Self {
        let (tx, _) = broadcast_channel(capacity);
        Self {
            tx,
            interest: Mutex::new(HashMap::new()),
        }
    }

    /// Emit a signal to all subscribers.
    ///
    /// Returns the number of active subscribers that received the signal.
    /// The current `OTel` context is captured at emit time and surfaces on
    /// each receiver as a [`devpulse_telemetry::LinkedTraced`].
    pub fn emit(&self, signal: Signal) -> usize {
        self.tx.send(signal).unwrap_or(0)
    }

    /// Subscribe to receive signals.
    ///
    /// Returns a receiver that will get all signals emitted after
    /// subscription. Each `recv()` yields a `LinkedTraced<Signal>` carrying
    /// the producer's `OTel` context as a span-link target.
    pub fn subscribe(&self) -> BroadcastReceiver<Signal> {
        self.tx.subscribe()
    }

    /// Get the current number of active subscribers.
    pub fn subscriber_count(&self) -> usize {
        self.tx.receiver_count()
    }

    /// Record that `subscriber` started (`true`) or stopped (`false`)
    /// watching `kind`. Idempotent per subscriber.
    pub fn set_interest(&self, kind: SignalKind, subscriber: &str, interested: bool) {
        let mut interest = self.interest.lock().unwrap_or_else(PoisonError::into_inner);
        let entry = interest.entry(kind).or_insert_with(Interest::new);
        if interested {
            entry.watchers.insert(subscriber.to_owned());
        } else {
            entry.watchers.remove(subscriber);
        }
        entry.publish();
    }

    /// Drop every interest `subscriber` held (its window closed).
    pub fn forget_subscriber(&self, subscriber: &str) {
        let mut interest = self.interest.lock().unwrap_or_else(PoisonError::into_inner);
        for entry in interest.values_mut() {
            if entry.watchers.remove(subscriber) {
                entry.publish();
            }
        }
    }

    /// Observe whether anyone is watching `kind`: `true` while at least one
    /// subscriber is. Producers await `changed()` to start or stop.
    pub fn interest(&self, kind: SignalKind) -> watch::Receiver<bool> {
        let mut interest = self.interest.lock().unwrap_or_else(PoisonError::into_inner);
        interest.entry(kind).or_insert_with(Interest::new).watched.subscribe()
    }
}

impl Default for SignalRouter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn interest_is_a_set_per_kind_and_follows_its_subscribers() {
        let router = SignalRouter::new();
        let watched = router.interest(SignalKind::Hardware);
        assert!(!*watched.borrow());

        router.set_interest(SignalKind::Hardware, "main", true);
        router.set_interest(SignalKind::Hardware, "main", true);
        router.set_interest(SignalKind::Hardware, "chat", true);
        assert!(*watched.borrow());

        router.set_interest(SignalKind::Hardware, "main", false);
        assert!(*watched.borrow(), "chat still watches");

        router.forget_subscriber("chat");
        assert!(!*watched.borrow());
    }

    #[test]
    fn interest_in_one_kind_does_not_leak_into_another() {
        let router = SignalRouter::new();
        router.set_interest(SignalKind::Hardware, "main", true);
        assert!(!*router.interest(SignalKind::Chat).borrow());
    }
}
