//! Application state managed by Tauri.
//!
//! Two managed state structs:
//! - `PlatformState`: holds the platform engine after boot completes.
//! - `BootStateTracker`: accumulates boot events so the frontend can
//!   catch up even if it mounts after boot finishes.

use devpulse_engine::platform::{InitEvent, SystemHealth};
use serde::Serialize;
use specta::Type;
use std::sync::{Arc, Mutex};

use devpulse_engine::platform::Platform;
use tokio::sync::RwLock;

/// Application state shared across all Tauri commands.
///
/// `platform` is `None` during boot and `Some(Arc<Platform>)` after.
/// Commands must handle the `None` case gracefully.
pub struct PlatformState {
    /// Platform engine (owns all services, bridges to clyffy kernel).
    /// None while boot task is running, Some after completion.
    pub platform: RwLock<Option<Arc<Platform>>>,
}

/// Boot phase — serialized to frontend as `PascalCase`.
#[derive(Debug, Clone, Serialize, Type)]
pub enum BootPhase {
    /// Platform is still starting up — services initializing.
    Initializing,
    /// All services booted successfully (or degraded gracefully).
    Ready,
    /// Boot failed — see `BootSnapshot::error` for details.
    Failed,
}

/// Snapshot of boot state — returned by `get_boot_state` command.
#[derive(Debug, Clone, Serialize, Type)]
pub struct BootSnapshot {
    /// Current boot phase.
    pub phase: BootPhase,
    /// Ordered list of subsystem init events accumulated during boot.
    pub events: Vec<InitEvent>,
    /// Final health snapshot (populated once boot completes).
    pub health: Option<SystemHealth>,
    /// Error message if boot failed.
    pub error: Option<String>,
}

/// Accumulates boot events so the frontend can catch up at any time.
///
/// Uses `Arc<Mutex<>>` internally so it can be cloned into the
/// boot callback closure (which requires `'static`).
pub struct BootStateTracker {
    inner: Arc<Mutex<BootSnapshot>>,
}

impl Default for BootStateTracker {
    fn default() -> Self {
        Self::new()
    }
}

impl BootStateTracker {
    /// Create a new tracker in the `Initializing` phase with empty events.
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(BootSnapshot {
                phase: BootPhase::Initializing,
                events: Vec::with_capacity(10),
                health: None,
                error: None,
            })),
        }
    }

    /// Clone the inner Arc for passing to background tasks.
    #[must_use]
    pub fn clone_tracker(&self) -> Self {
        Self {
            inner: Arc::clone(&self.inner),
        }
    }

    /// Record a subsystem init event.
    ///
    /// # Panics
    /// Panics if the internal mutex is poisoned.
    #[allow(clippy::expect_used)]
    pub fn record_event(&self, event: InitEvent) {
        let mut snap = self.inner.lock().expect("BootStateTracker lock poisoned");
        snap.events.push(event);
    }

    /// Mark boot as ready with final health snapshot.
    ///
    /// # Panics
    /// Panics if the internal mutex is poisoned.
    #[allow(clippy::expect_used)]
    pub fn set_ready(&self, health: SystemHealth) {
        let mut snap = self.inner.lock().expect("BootStateTracker lock poisoned");
        snap.phase = BootPhase::Ready;
        snap.health = Some(health);
    }

    /// Mark boot as failed with error message.
    ///
    /// # Panics
    /// Panics if the internal mutex is poisoned.
    #[allow(clippy::expect_used)]
    pub fn set_failed(&self, error: String) {
        let mut snap = self.inner.lock().expect("BootStateTracker lock poisoned");
        snap.phase = BootPhase::Failed;
        snap.error = Some(error);
    }

    /// Return a clone of the current boot snapshot.
    ///
    /// # Panics
    /// Panics if the internal mutex is poisoned.
    #[allow(clippy::expect_used)]
    pub fn snapshot(&self) -> BootSnapshot {
        self.inner
            .lock()
            .expect("BootStateTracker lock poisoned")
            .clone()
    }
}
