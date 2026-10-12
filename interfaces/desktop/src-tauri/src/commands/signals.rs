//! Signal transport — the one bridge from the engine's signal fabric to UI
//! windows, and the two commands the UI fabric calls.
//!
//! - [`spawn_bridge`] subscribes to the engine router once and forwards every
//!   UI-bound signal as one typed [`SignalBroadcast`] event. A kind with a
//!   coalesce window (`[signals.coalesce_ms]` in the platform config) reaches
//!   the UI at most once per window, newest value wins. When the bridge falls
//!   behind the router it sends `resync`, so windows re-read the snapshot
//!   instead of showing a gap (the Kubernetes `410 Gone` → re-list rule).
//! - [`get_signal_state`] returns the state snapshot (list-then-watch).
//! - [`set_signal_interest`] records that the calling window started or
//!   stopped watching a kind, so producers run only while someone looks.
#![expect(
    clippy::needless_pass_by_value,
    reason = "Tauri command extractors (`State`, `Window`) are injected by value; commands cannot take them by reference and remain `#[tauri::command]`-compatible."
)]

use std::collections::HashMap;
use std::time::{Duration, Instant};

use devpulse_engine::platform::config::SignalsConfig;
use devpulse_engine::signals::{
    Audience, Signal, SignalKind, SignalSource, SignalVariant, SinkKind, StateSnapshot,
};
use devpulse_engine::Engine;
use tauri::{Manager, State};
use tauri_specta::Event;
use tokio::sync::broadcast::error::RecvError;
use tracing::Instrument;

use crate::events::SignalBroadcast;

/// How often held (coalesced) signals are checked for release.
const FLUSH_TICK: Duration = Duration::from_millis(100);

/// Start the bridge. Safe to call from Tauri's `setup` (outside any async
/// runtime): the subscription is taken synchronously — before
/// `Engine::start`, so windows also receive the engine's ready signal — and
/// the forwarding loop runs on Tauri's async runtime.
pub fn spawn_bridge(app: tauri::AppHandle, config: SignalsConfig) {
    let mut rx = {
        let engine = app.state::<Engine>();
        let rx = engine.router().subscribe();
        engine.start();
        rx
    };

    let forwarding = async move {
        let mut coalescer = Coalescer::new(config);
        let mut tick = tokio::time::interval(FLUSH_TICK);
        loop {
            tokio::select! {
                received = rx.recv() => match received {
                    Ok(linked) => {
                        let (signal, _producer_cx) = linked.into_parts();
                        if let Some(ready) = coalescer.offer(signal, Instant::now()) {
                            forward(&app, ready);
                        }
                    }
                    Err(RecvError::Lagged(skipped)) => {
                        tracing::warn!(skipped, "signal bridge: lagged — windows resync from the snapshot");
                        forward(&app, Signal::new(SignalSource::System, SignalVariant::Resync));
                    }
                    Err(RecvError::Closed) => break,
                },
                _ = tick.tick() => {
                    for ready in coalescer.release_due(Instant::now()) {
                        forward(&app, ready);
                    }
                }
            }
        }
        tracing::info!("signal bridge: router closed");
    };
    tauri::async_runtime::spawn(forwarding.instrument(tracing::info_span!("signal_bridge")));
}

/// Send one signal to the windows its contract names.
fn forward(app: &tauri::AppHandle, signal: Signal) {
    let spec = signal.payload.kind().spec();
    if !spec.sinks.contains(&SinkKind::Broadcast) {
        return;
    }
    tracing::trace!(
        kind = signal.payload.name(),
        revision = signal.header.revision,
        "signal bridge: forwarded"
    );
    match spec.audience {
        Audience::All => {
            if let Err(err) = (SignalBroadcast { signal }).emit(app) {
                tracing::warn!(%err, "signal bridge: emit failed");
            }
        }
        // No kind targets devtools yet; delivery to devtools windows only
        // lands with the facade's dev output (plan 0004 A11b).
        Audience::Devtools | Audience::Internal => {}
    }
}

/// Per-kind rate limit from `[signals.coalesce_ms]`: at most one signal per
/// window reaches the UI, and a held signal is replaced by a newer one.
#[derive(Debug)]
struct Coalescer {
    config: SignalsConfig,
    last_sent: HashMap<SignalKind, Instant>,
    held: HashMap<SignalKind, Signal>,
}

impl Coalescer {
    fn new(config: SignalsConfig) -> Self {
        Self {
            config,
            last_sent: HashMap::new(),
            held: HashMap::new(),
        }
    }

    /// Returns the signal to forward now, or holds it until its window ends.
    fn offer(&mut self, signal: Signal, now: Instant) -> Option<Signal> {
        let kind = signal.payload.kind();
        let window = self.config.coalesce_window(kind);
        if window.is_zero() {
            return Some(signal);
        }
        match self.last_sent.get(&kind) {
            Some(last) if now.duration_since(*last) < window => {
                self.held.insert(kind, signal);
                None
            }
            _ => {
                self.last_sent.insert(kind, now);
                self.held.remove(&kind);
                Some(signal)
            }
        }
    }

    /// Held signals whose window has ended, ready to forward.
    fn release_due(&mut self, now: Instant) -> Vec<Signal> {
        let due: Vec<SignalKind> = self
            .held
            .keys()
            .copied()
            .filter(|kind| {
                self.last_sent.get(kind).is_none_or(|last| {
                    now.duration_since(*last) >= self.config.coalesce_window(*kind)
                })
            })
            .collect();
        due.into_iter()
            .filter_map(|kind| {
                self.last_sent.insert(kind, now);
                self.held.remove(&kind)
            })
            .collect()
    }
}

/// The latest value of every state signal, for list-then-watch sync.
#[tauri::command]
#[specta::specta]
pub fn get_signal_state(engine: State<'_, Engine>) -> StateSnapshot {
    engine.state().snapshot()
}

/// The calling window started (`interested = true`) or stopped watching `kind`.
#[tauri::command]
#[specta::specta]
pub fn set_signal_interest(
    window: tauri::Window,
    engine: State<'_, Engine>,
    kind: SignalKind,
    interested: bool,
) {
    engine.router().set_interest(kind, window.label(), interested);
}

#[cfg(test)]
mod tests {
    use devpulse_engine::platform::HardwareMetrics;
    use devpulse_engine::signals::{SystemPayload, SystemStatus};

    use super::*;

    fn hardware(cores: usize) -> Signal {
        Signal::new(
            SignalSource::System,
            SignalVariant::Hardware(HardwareMetrics {
                cpu_cores: cores,
                ..HardwareMetrics::default()
            }),
        )
    }

    fn cores(signal: &Signal) -> Option<usize> {
        match signal.payload.as_ref() {
            SignalVariant::Hardware(metrics) => Some(metrics.cpu_cores),
            _ => None,
        }
    }

    #[test]
    fn kinds_without_a_window_pass_straight_through() {
        let mut coalescer = Coalescer::new(SignalsConfig::shipped());
        let now = Instant::now();
        let event = Signal::new(
            SignalSource::System,
            SignalVariant::System(SystemPayload {
                status: SystemStatus::Ready,
                message: String::new(),
            }),
        );
        assert!(coalescer.offer(event.clone(), now).is_some());
        assert!(coalescer.offer(event, now).is_some());
    }

    #[test]
    fn within_a_window_the_newest_value_is_held_then_released() {
        let config = SignalsConfig::shipped();
        let window = config.coalesce_window(SignalKind::Hardware);
        assert!(!window.is_zero(), "shipped config coalesces hardware");
        let mut coalescer = Coalescer::new(config);
        let start = Instant::now();

        assert_eq!(coalescer.offer(hardware(1), start).as_ref().and_then(cores), Some(1));
        assert!(coalescer.offer(hardware(2), start).is_none());
        assert!(coalescer.offer(hardware(3), start).is_none());
        assert!(coalescer.release_due(start).is_empty());

        let released = coalescer.release_due(start + window);
        assert_eq!(released.iter().filter_map(cores).collect::<Vec<_>>(), vec![3]);
        assert!(coalescer.release_due(start + window + window).is_empty());
    }
}
