//! # Facade Bridge
//!
//! The runtime async task that sits on the internal event bus
//! and fans out to two output channels:
//!
//! 1. **Dev channel** — raw `InternalEvent`, no translation, no filtering.
//!    This is local builder tooling for `run-dev`, not a customer contract.
//!    It must be flag/capability/build gated out of shipped customer surfaces.
//!
//! 2. **Surface channel** — translated `SurfaceEvent`, filtered and redacted.
//!    Consumed by main UI, Clyffy chat.
//!    This is the safe wrapped contract the product can rely on.
//!
//! If normal devtools need kernel management in shipped builds, that must be
//! provided via a filtered operator-safe contract, not by wiring raw dev events
//! into the renderer.
//!
//! The bridge runs as a `tokio::spawn`ed task for the lifetime of the app.
//! It reads the config on every event (cheap: just `RwLock::read()`).
//!
//! # Backpressure
//!
//! `tokio::broadcast` drops oldest messages when receivers lag.
//! This is the correct behavior: if the UI can't keep up, stale
//! events should be dropped rather than queued indefinitely.

use std::sync::Arc;
use std::time::Instant;

use devpulse_telemetry::prelude::{BroadcastReceiver, BroadcastSender};
use tokio::sync::broadcast::error::RecvError;
use tokio::sync::RwLock;
use tracing::{debug, trace, warn};

use super::config::WhitelistConfig;
use super::events::InternalEvent;
use super::filter::FilterPipeline;
use super::surface::SurfaceEvent;
use super::translator::TranslationRegistry;

/// The bridge task. Created by `FacadeHandle::spawn()`.
pub struct FacadeBridge {
    internal_rx: BroadcastReceiver<InternalEvent>,
    surface_tx: BroadcastSender<SurfaceEvent>,
    dev_tx: BroadcastSender<InternalEvent>,
    config: Arc<RwLock<WhitelistConfig>>,
    registry: Arc<TranslationRegistry>,
}

impl FacadeBridge {
    pub fn new(
        internal_rx: BroadcastReceiver<InternalEvent>,
        surface_tx: BroadcastSender<SurfaceEvent>,
        dev_tx: BroadcastSender<InternalEvent>,
        config: Arc<RwLock<WhitelistConfig>>,
        registry: Arc<TranslationRegistry>,
    ) -> Self {
        Self {
            internal_rx,
            surface_tx,
            dev_tx,
            config,
            registry,
        }
    }

    /// Main event loop. Runs until the internal sender is dropped.
    pub async fn run(mut self) {
        let start = Instant::now();
        let mut pipeline = FilterPipeline::new(5);
        let mut dev_dropped: u64 = 0;
        let mut surface_dropped: u64 = 0;

        loop {
            match self.internal_rx.recv().await {
                Ok(traced) => {
                    // Producer's OTel context comes through as a span-link
                    // target on `traced.link_context()`. We don't attach it
                    // because the bridge is its own span tree (ADR-002:
                    // 1:N broadcast subscribers are peers, not children).
                    let event = traced.value;
                    let elapsed_ms = start.elapsed().as_millis() as u64;

                    // ── Dev channel: local builder stream only ───────
                    if self.dev_tx.receiver_count() > 0 && self.dev_tx.send(event.clone()).is_err()
                    {
                        dev_dropped += 1;
                        if dev_dropped % 100 == 0 {
                            warn!(dropped = dev_dropped, "Dev channel: receivers lagging");
                        }
                    }

                    // ── Surface channel: translate → filter → emit ───
                    if self.surface_tx.receiver_count() > 0 {
                        let config = self.config.read().await;

                        let category = event.category();
                        if !config.allows(category) {
                            trace!(?category, "Blocked by whitelist");
                            continue;
                        }

                        let Some(mut surface_event) = self.registry.translate(&event, &config)
                        else {
                            trace!(?category, "Translator returned None");
                            continue;
                        };

                        surface_event.timestamp_ms = elapsed_ms;

                        let Some(final_event) = pipeline.apply(surface_event, &config) else {
                            trace!(?category, "Filtered by pipeline");
                            continue;
                        };

                        if self.surface_tx.send(final_event).is_err() {
                            surface_dropped += 1;
                            if surface_dropped % 100 == 0 {
                                warn!(
                                    dropped = surface_dropped,
                                    "Surface channel: receivers lagging"
                                );
                            }
                        }
                    }
                }

                Err(RecvError::Lagged(n)) => {
                    warn!(lagged = n, "Facade bridge lagged — {n} events skipped");
                }

                Err(RecvError::Closed) => {
                    debug!("Internal event bus closed. Facade bridge shutting down.");
                    break;
                }
            }
        }

        if dev_dropped > 0 || surface_dropped > 0 {
            warn!(
                dev_dropped,
                surface_dropped, "Facade bridge shutdown. Total dropped."
            );
        }
    }
}
