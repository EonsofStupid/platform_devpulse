//! # `EventFacade` — Dual-View Translation Layer
//!
//! The facade sits between the kernel's internal event bus and all UI consumers.
//! Every internal event flows through three stages:
//!
//! 1. **`TranslationRegistry`** — maps `InternalEvent` → `SurfaceEvent`
//! 2. **`WhitelistConfig`** — filters by category + detail level
//! 3. **`RedactionFilter`** — strips IP-sensitive internals
//!
//! Two output channels:
//! - `dev_rx`: raw `InternalEvent` for Connectome / Lab (no translation)
//! - `surface_rx`: translated `SurfaceEvent` for main UI (layman-friendly)
//!
//! # Ownership
//!
//! The facade **observes** events via `tokio::broadcast`. It never owns
//! model weights, GPU resources, or inference state. It is a read-only
//! projection of the kernel's internal state.

mod bridge;
pub mod config;
pub mod events;
mod filter;
pub mod surface;
pub mod translator;
pub mod visibility;

pub use bridge::FacadeBridge;
pub use config::{DetailLevel, RedactionLevel, WhitelistConfig};
pub use events::{EventCategory, InternalEvent};
pub use filter::FilterPipeline;
pub use surface::{Severity, SurfaceCategory, SurfaceEvent};
pub use translator::{EventTranslator, TranslationRegistry};
pub use visibility::{classify, narration_hint, Visibility};

use devpulse_telemetry::spawn;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};

/// Capacity for each output channel. Must be large enough to avoid
/// lagging during inference bursts (50+ tok/s = 50+ events/s).
const SURFACE_CHANNEL_CAPACITY: usize = 512;
const DEV_CHANNEL_CAPACITY: usize = 1024;

/// Top-level handle returned to the app on startup.
/// Clone this freely — all inner state is `Arc`-wrapped.
#[derive(Clone)]
pub struct FacadeHandle {
    /// Subscribe to translated events (main UI consumption).
    pub surface_tx: broadcast::Sender<SurfaceEvent>,

    /// Subscribe to raw internal events (Connectome / Lab).
    pub dev_tx: broadcast::Sender<InternalEvent>,

    /// Runtime-mutable config. Updated via Connectome settings UI.
    pub config: Arc<RwLock<WhitelistConfig>>,
}

impl FacadeHandle {
    /// Create a new facade handle and spawn the bridge task.
    ///
    /// `internal_tx` is the sender from the kernel's main event bus.
    /// The bridge task runs until the sender is dropped (app shutdown).
    pub fn spawn(
        internal_tx: broadcast::Sender<InternalEvent>,
        config: WhitelistConfig,
        registry: TranslationRegistry,
    ) -> Self {
        let (surface_tx, _) = broadcast::channel(SURFACE_CHANNEL_CAPACITY);
        let (dev_tx, _) = broadcast::channel(DEV_CHANNEL_CAPACITY);
        let config = Arc::new(RwLock::new(config));

        let bridge = FacadeBridge::new(
            internal_tx.subscribe(),
            surface_tx.clone(),
            dev_tx.clone(),
            Arc::clone(&config),
            Arc::new(registry),
        );

        spawn(bridge.run());

        Self {
            surface_tx,
            dev_tx,
            config,
        }
    }

    /// Get a surface event receiver for the main UI.
    pub fn subscribe_surface(&self) -> broadcast::Receiver<SurfaceEvent> {
        self.surface_tx.subscribe()
    }

    /// Get a raw event receiver for dev tools.
    pub fn subscribe_dev(&self) -> broadcast::Receiver<InternalEvent> {
        self.dev_tx.subscribe()
    }

    /// Update the whitelist config at runtime.
    pub async fn update_config(&self, new_config: WhitelistConfig) {
        let mut guard = self.config.write().await;
        *guard = new_config;
    }
}
