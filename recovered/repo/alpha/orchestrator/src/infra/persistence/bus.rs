// orchestrator/src/infra/persistence/bus.rs

//! Event bus - L1 REFLEX layer
//!
//! Uses tokio::broadcast for instant event propagation.
//! Ephemeral - no persistence.

use crate::types::Toon;
use tokio::sync::broadcast;

const CHANNEL_CAPACITY: usize = 1024;

/// Boxed error to avoid large Result types on the stack
pub type BusError = Box<broadcast::error::SendError<Toon>>;

/// Event bus for L1 reflex communication
pub struct EventBus {
    sender: broadcast::Sender<Toon>,
}

impl EventBus {
    pub fn new() -> Self {
        let (sender, _) = broadcast::channel(CHANNEL_CAPACITY);
        Self { sender }
    }

    /// Publish a toon to all subscribers
    pub fn publish(&self, toon: Toon) -> Result<usize, BusError> {
        self.sender.send(toon).map_err(Box::new)
    }

    /// Subscribe to receive toons
    pub fn subscribe(&self) -> broadcast::Receiver<Toon> {
        self.sender.subscribe()
    }

    /// Get current subscriber count
    pub fn subscriber_count(&self) -> usize {
        self.sender.receiver_count()
    }
}

impl Default for EventBus {
    fn default() -> Self {
        Self::new()
    }
}

impl Clone for EventBus {
    fn clone(&self) -> Self {
        Self {
            sender: self.sender.clone(),
        }
    }
}
