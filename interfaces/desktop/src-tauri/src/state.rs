//! Application state managed by Tauri.
//!
//! Two managed state structs:
//! - `PlatformState`: holds the platform engine after boot completes.
//! - `BootStateTracker`: accumulates boot events so the frontend can
//!   catch up even if it mounts after boot finishes.

use crate::commands::devforge::paths::DevforgePaths;
use crate::commands::devforge::sidecar::RehManager;
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
///
/// `reh` holds the DevForge REH web server manager. It is `None` until
/// bootstrap (or an explicit `spawn_reh_server` call) succeeds, and is
/// cleared again by `stop_reh_server` or the app-exit handler in `lib.rs`.
///
/// `devforge_paths` is computed once at startup from the resolved data
/// directory and shared immutably — commands consult it for canonical
/// workspace / user-data / install paths.
pub struct PlatformState {
    /// Platform engine (owns all services, bridges to clyffy kernel).
    /// None while boot task is running, Some after completion.
    pub platform: RwLock<Option<Arc<Platform>>>,
    /// DevForge REH web server lifecycle manager.
    pub reh: RwLock<Option<RehManager>>,
    /// DevForge directory layout — immutable, safe to read from anywhere.
    pub devforge_paths: DevforgePaths,
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

/// Model readiness snapshot — survives the frontend mount race.
///
/// Emitted as `platform:models-status` from the boot task, AND stored in
/// the `BootStateTracker` so `get_boot_state` returns it to late-mounting
/// frontends that missed the live event.
#[derive(Debug, Clone, Serialize, Type, Default)]
#[serde(rename_all = "camelCase")]
pub struct ModelsStatusSnapshot {
    /// Whether models are present AND at least one slot is assigned.
    pub ready: bool,
    /// No slot assignments exist — show setup wizard.
    pub first_run: bool,
    /// Number of model files found by the registry scan.
    pub model_count: usize,
    /// Total slots configured.
    pub slot_count: usize,
    /// Slots that have an assigned model.
    pub assigned_count: usize,
    /// Optional error from the model readiness check.
    pub error: Option<String>,
}

/// Snapshot of boot state — returned by `get_boot_state` command.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BootSnapshot {
    /// Current boot phase.
    pub phase: BootPhase,
    /// Ordered list of subsystem init events accumulated during boot.
    pub events: Vec<InitEvent>,
    /// Final health snapshot (populated once boot completes).
    pub health: Option<SystemHealth>,
    /// Error message if boot failed.
    pub error: Option<String>,
    /// Model readiness — populated after the model loader check runs.
    /// Frontend reads this in `applySnapshot()` to catch up on
    /// `platform:models-status` events that fired before the listener
    /// was mounted.
    pub models_status: Option<ModelsStatusSnapshot>,
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
                models_status: None,
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

    /// Store model readiness so late-mounting frontends can catch up via
    /// `get_boot_state` instead of relying on the live `platform:models-status`
    /// event which fires before the SvelteKit listener mounts in dev mode.
    ///
    /// # Panics
    /// Panics if the internal mutex is poisoned.
    #[allow(clippy::expect_used)]
    pub fn set_models_status(&self, status: ModelsStatusSnapshot) {
        let mut snap = self.inner.lock().expect("BootStateTracker lock poisoned");
        snap.models_status = Some(status);
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
