//! Application state managed by Tauri.
//!
//! Two managed state structs:
//! - `PlatformState`: holds the platform engine after boot completes.
//! - `BootStateTracker`: accumulates boot progress, published to every
//!   window as the signal fabric's `Boot` state (replayed to late windows).
//!
//! # P0: Boot Never Freezes
//!
//! `platform` uses `ArcSwapOption<Platform>` — atomic load/store of
//! `Option<Arc<Platform>>`. NO `tokio::sync::RwLock`. Lock-free reads
//! across all 68+ command call sites. Boot task stores exactly once
//! after service initialization completes.

use crate::commands::devforge::paths::DevforgePaths;
use arc_swap::ArcSwapOption;
use devpulse_engine::platform::InitEvent;
use devpulse_engine::signals::{BootPhase, BootStatus};
use std::sync::{Arc, Mutex, PoisonError};

use devpulse_engine::platform::Platform;

/// Application state shared across all Tauri commands.
///
/// `platform` is `None` during boot and `Some(Arc<Platform>)` after.
/// Commands call `state.platform.load_full()` — lock-free atomic load
/// returning `Option<Arc<Platform>>`. Commands must handle the `None`
/// case gracefully (boot still in progress).
///
/// `DevForge` REH lifecycle is now owned by `Platform::devforge()` (the
/// engine-level service). No more separate `reh` field — one pipeline.
///
/// `devforge_paths` is computed once at startup from the resolved data
/// directory and shared immutably — commands consult it for canonical
/// workspace / user-data / install paths.
pub struct PlatformState {
    /// Platform engine (owns all services, bridges to clyffy kernel).
    /// `None` while boot task is running, `Some` after completion.
    /// Readers: `state.platform.load_full()` — lock-free.
    /// Writer: `boot_task` stores exactly once via `state.platform.store(Some(Arc::new(p)))`.
    pub platform: ArcSwapOption<Platform>,
    /// `DevForge` directory layout — immutable, safe to read from anywhere.
    pub devforge_paths: DevforgePaths,
}

impl PlatformState {
    /// Construct a fresh `PlatformState` with no platform loaded yet.
    #[must_use]
    pub fn new(devforge_paths: DevforgePaths) -> Self {
        Self {
            platform: ArcSwapOption::new(None),
            devforge_paths,
        }
    }
}

/// Boot progress as it accumulates.
#[derive(Debug)]
struct BootProgress {
    phase: BootPhase,
    /// Every init event in arrival order.
    events: Vec<InitEvent>,
    error: Option<String>,
}

/// Accumulates boot progress; [`BootStateTracker::status`] renders it as
/// the signal fabric's `Boot` state.
///
/// Uses `Arc<Mutex<>>` internally (`std::sync` — short sync-only scopes,
/// never held across await). A poisoned lock is recovered, never panicked on.
pub struct BootStateTracker {
    inner: Arc<Mutex<BootProgress>>,
}

impl Default for BootStateTracker {
    fn default() -> Self {
        Self::new()
    }
}

impl BootStateTracker {
    /// Create a new tracker in the `Initializing` phase with no events.
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(BootProgress {
                phase: BootPhase::Initializing,
                events: Vec::with_capacity(10),
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
    pub fn record_event(&self, event: InitEvent) {
        self.lock().events.push(event);
    }

    /// Mark boot as ready.
    pub fn set_ready(&self) {
        self.lock().phase = BootPhase::Ready;
    }

    /// Mark boot as failed with the reason shown to the user.
    pub fn set_failed(&self, error: String) {
        let mut progress = self.lock();
        progress.phase = BootPhase::Failed;
        progress.error = Some(error);
    }

    /// Boot progress as the signal fabric's `Boot` state: phase, error, and
    /// the latest status of each step in the order steps first reported.
    pub fn status(&self) -> BootStatus {
        let progress = self.lock();
        let mut steps: Vec<InitEvent> = Vec::new();
        for event in &progress.events {
            match steps.iter_mut().find(|known| known.step == event.step) {
                Some(known) => *known = event.clone(),
                None => steps.push(event.clone()),
            }
        }
        BootStatus {
            phase: progress.phase,
            error: progress.error.clone(),
            steps,
        }
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, BootProgress> {
        self.inner.lock().unwrap_or_else(PoisonError::into_inner)
    }
}
