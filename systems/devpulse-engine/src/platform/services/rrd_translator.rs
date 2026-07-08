//! # `RrdLifecycleTranslator` — `rrd.lifecycle` → `InternalEvent` bridge
//!
//! Per `HOT_UPDATE_PATTERN.md` §11 (Observability Contract) and
//! H12 (Dual Emission): every state transition emitted by the
//! RRD daemon must surface on BOTH observability layers —
//! structured tracing (where the devtool log surface and
//! OTLP exporter consume from) AND the typed `InternalEvent`
//! broadcast bus (where minion subscribers, governance reactors,
//! and the devtool Debug tab consume from).
//!
//! The daemon is Clyffy's (`clyffyos-rrd`, in the clyffyos repo) and
//! has no dependency on this engine. It emits via `tracing` only, on
//! the contract target [`RRD_LIFECYCLE_TARGET`] — the engine owns the
//! subscriber half of that contract here. This translator preserves
//! H12 by **structural guarantee**: a single
//! [`tracing_subscriber::Layer`] in the engine's tracing pipeline
//! intercepts every event with `target = rrd.lifecycle`, extracts
//! the `phase` and `detail` fields, and emits a corresponding
//! [`InternalEvent::RrdPhaseTransition`] on the broadcast bus —
//! 1:1 with the tracing event, no callsite-coupled macro required.
//!
//! ## Why this is stricter than the macro pattern
//!
//! The macro shape (`emit_rrd_lifecycle_dual!`) requires every
//! callsite in the daemon to invoke a macro that emits both. A
//! contributor adding a `tracing::info!(target: "rrd.lifecycle", ...)`
//! by hand would silently break dual emission. With the translator,
//! every event on the target — regardless of the macro/syntax used
//! to emit it — gets the `InternalEvent`. Drift is structurally
//! impossible.
//!
//! ## H13 grep parity, restated
//!
//! Doc H13 said `grep emit_rrd_lifecycle!` count == `grep
//! InternalEvent::RrdPhaseTransition` count. With the translator,
//! the second grep should show only ONE callsite (this file). The
//! parity rule restates as: "all `InternalEvent::RrdPhaseTransition`
//! emissions originate from `RrdLifecycleTranslator::on_event`."

use std::sync::{Arc, OnceLock};
use tracing::field::{Field, Visit};
use tracing::Subscriber;
use tracing_subscriber::layer::{Context, Layer};

use devpulse_telemetry::prelude::BroadcastSender;

use crate::platform::facade::events::InternalEvent;

/// Tracing target every RRD lifecycle event uses — the engine's half of
/// the tracing contract with the Clyffy-side daemon (`clyffyos-rrd`
/// defines the same value on its emitter half; the string IS the
/// contract, like a wire route). Subscribers (devtool log surface,
/// OTLP exporter, this translator) filter on this single target.
pub const RRD_LIFECYCLE_TARGET: &str = "rrd.lifecycle";

/// Process-global broadcast sender, installed exactly once by
/// `Platform::boot` after the engine's bus is constructed.
///
/// Why a global: the translator is registered with the tracing
/// subscriber inside `logging::init` (called from `main.rs` before
/// `Platform::boot`), but the broadcast bus is owned by the engine
/// platform (constructed inside `Platform::boot`). The two dependency
/// orderings are opposite, so the layer registers without a sender
/// and reads the sender out of this `OnceLock` once Platform installs
/// it. Translator events emitted before installation are dropped —
/// the daemon only emits after boot completes anyway.
static LAZY_SENDER: OnceLock<Arc<BroadcastSender<InternalEvent>>> = OnceLock::new();

/// Tracing-subscriber Layer that translates RRD lifecycle events
/// into typed broadcast events.
///
/// Two construction modes:
///
/// - `new_lazy()` — production path. Reads the sender from
///   [`LAZY_SENDER`] on every event. Logging registers this variant
///   at init time; `Platform::boot` later installs the sender via
///   [`RrdLifecycleTranslator::install_global_sender`].
/// - `new(tx)` — test path. Provides the sender explicitly so
///   tests can assert against an isolated channel without touching
///   process-global state.
pub struct RrdLifecycleTranslator {
    /// Explicit per-instance sender (test path). When `None`, the
    /// translator falls back to the global [`LAZY_SENDER`] (production
    /// path). The split is necessary because tests would otherwise
    /// fight over the `OnceLock` — they can only set it once per
    /// process, and parallel tests need independent channels.
    tx: Option<Arc<BroadcastSender<InternalEvent>>>,
}

impl RrdLifecycleTranslator {
    /// Construct a translator that publishes onto the given
    /// broadcast channel. Used by tests so each test owns its own
    /// channel. Production code should use `new_lazy()`.
    pub fn new(tx: Arc<BroadcastSender<InternalEvent>>) -> Self {
        Self { tx: Some(tx) }
    }

    /// Production constructor. The translator publishes onto the
    /// process-global sender installed by `Platform::boot` via
    /// [`Self::install_global_sender`]. Events emitted before the
    /// sender is installed are silently dropped.
    pub fn new_lazy() -> Self {
        Self { tx: None }
    }

    /// Install the process-global broadcast sender. Called once by
    /// `Platform::boot` after the engine's `InternalEvent` bus is
    /// constructed. Idempotent — a second call returns `Err` with
    /// the supplied sender (the existing one is kept).
    ///
    /// # Errors
    ///
    /// Returns `Err(tx)` (the supplied sender, unchanged) when the
    /// global sender has already been installed by a prior call.
    pub fn install_global_sender(
        tx: Arc<BroadcastSender<InternalEvent>>,
    ) -> Result<(), Arc<BroadcastSender<InternalEvent>>> {
        LAZY_SENDER.set(tx)
    }
}

/// Tracing-field visitor that plucks the `phase` + `detail` fields out
/// of an `rrd.lifecycle` event. Hoisted to module scope so clippy's
/// `items_after_statements` lint is satisfied — the previous in-function
/// definition was OK semantically but reads cleanly as a top-level type.
struct PhaseDetailVisitor<'a> {
    phase: &'a mut Option<String>,
    detail: &'a mut Option<String>,
}

impl Visit for PhaseDetailVisitor<'_> {
    fn record_str(&mut self, field: &Field, value: &str) {
        match field.name() {
            "phase" => *self.phase = Some(value.to_string()),
            "detail" => *self.detail = Some(value.to_string()),
            _ => {}
        }
    }
    fn record_debug(&mut self, field: &Field, value: &dyn std::fmt::Debug) {
        let v = format!("{value:?}");
        // tracing's Debug-format for &str strings is `"foo"` with
        // quotes — strip them so consumers don't see escaped strings.
        let trimmed = v.trim_matches('"').to_string();
        match field.name() {
            "phase" => *self.phase = Some(trimmed),
            "detail" => *self.detail = Some(trimmed),
            _ => {}
        }
    }
}

impl<S: Subscriber> Layer<S> for RrdLifecycleTranslator {
    fn on_event(&self, event: &tracing::Event<'_>, _ctx: Context<'_, S>) {
        // Filter — only translate events on the daemon's
        // `rrd.lifecycle` target. Other tracing traffic flows
        // through unchanged to other Layers.
        if event.metadata().target() != RRD_LIFECYCLE_TARGET {
            return;
        }

        // Extract the `phase` and `detail` string fields. Tracing's
        // field-recording API is visitor-based — we walk the fields
        // once and pluck the two we care about.
        let mut phase: Option<String> = None;
        let mut detail: Option<String> = None;
        event.record(&mut PhaseDetailVisitor {
            phase: &mut phase,
            detail: &mut detail,
        });

        let Some(phase) = phase else {
            // Malformed event — every rrd.lifecycle emission MUST
            // include a `phase` field. Emit a tracing warning at
            // a different target (so we don't recurse) and skip.
            tracing::warn!(
                target: "rrd.translator",
                "rrd.lifecycle event missing required `phase` field; skipping"
            );
            return;
        };

        // Detail is optional — fall back to empty string so the
        // InternalEvent shape stays uniform.
        let detail = detail.unwrap_or_default();

        // Pick the explicit per-instance sender (tests) or fall
        // back to the global LAZY_SENDER (production). If neither
        // is available — production case before Platform::boot has
        // installed the sender — drop the event silently.
        let tx = match &self.tx {
            Some(tx) => tx,
            None => match LAZY_SENDER.get() {
                Some(tx) => tx,
                None => return,
            },
        };

        // `send` returns Err if there are no active receivers.
        // That's fine — translator is fire-and-forget; nobody
        // listening just means the event is discarded, same as
        // a tracing event with no subscriber attached.
        let _ = tx.send(InternalEvent::RrdPhaseTransition { phase, detail });
    }
}

// ═══════════════════════════════════════════════════════════════
// Test 10 — Dual emission verification (HOT_UPDATE_PATTERN.md §12)
// ═══════════════════════════════════════════════════════════════
//
// "Every entry/exit pair in §11.3 has both a `tracing::event!` and
//  an `InternalEvent` emission verifiable by capture-subscriber
//  test."
//
// Restated under the translator architecture: "every tracing event
// on `rrd.lifecycle` produces exactly one `InternalEvent::RrdPhaseTransition`
// on the broadcast bus."

#[cfg(test)]
mod tests {
    use super::*;
    use devpulse_telemetry::prelude::broadcast_channel;
    use tracing_subscriber::layer::SubscriberExt;
    use tracing_subscriber::registry::Registry;

    #[tokio::test]
    async fn translator_mirrors_rrd_lifecycle_event_to_internal_event() {
        // Set up the broadcast channel and translator.
        let (tx, mut rx) = broadcast_channel::<InternalEvent>(64);
        let translator = RrdLifecycleTranslator::new(Arc::new(tx));

        // Install the translator as the active subscriber for this
        // test. set_default returns a thread-local guard.
        let subscriber = Registry::default().with(translator);
        let _guard = tracing::subscriber::set_default(subscriber);

        // Emit an event on the RRD lifecycle target exactly the way the
        // daemon's macro expands — a raw tracing event on the contract
        // target. Deliberately NOT a macro call: the module doc's thesis
        // is that ANY emission on the target gets translated, macro or
        // not, and this exercises that stronger contract directly.
        tracing::info!(
            target: RRD_LIFECYCLE_TARGET,
            phase = "swap_commit",
            detail = "atomic pointer swap committed in test"
        );

        // Translator should have produced exactly one InternalEvent.
        let envelope = rx
            .try_recv()
            .expect("translator must emit an InternalEvent for every rrd.lifecycle tracing event");
        match envelope.value {
            InternalEvent::RrdPhaseTransition { phase, detail } => {
                assert_eq!(phase, "swap_commit");
                assert_eq!(detail, "atomic pointer swap committed in test");
            }
            other => panic!("expected RrdPhaseTransition, got {other:?}"),
        }

        // No additional events queued.
        assert!(
            rx.try_recv().is_err(),
            "translator emitted more than one InternalEvent for one tracing event"
        );
    }

    #[tokio::test]
    async fn translator_ignores_non_rrd_targets() {
        let (tx, mut rx) = broadcast_channel::<InternalEvent>(64);
        let translator = RrdLifecycleTranslator::new(Arc::new(tx));
        let subscriber = Registry::default().with(translator);
        let _guard = tracing::subscriber::set_default(subscriber);

        // Emit on a different target — translator must NOT mirror this.
        tracing::info!(
            target: "some.other.target",
            phase = "swap_commit",
            detail = "this should NOT be translated"
        );

        assert!(
            rx.try_recv().is_err(),
            "translator must only translate events on the rrd.lifecycle target"
        );
    }
}
