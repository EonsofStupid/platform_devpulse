//! # `RrdLifecycleTranslator` — `rrd.lifecycle` → `InternalEvent` bridge
//!
//! Per `HOT_UPDATE_PATTERN.md` §11 (Observability Contract) and
//! H12 (Dual Emission): every state transition emitted by the
//! kernel-resident RRD daemon must surface on BOTH observability
//! layers — structured tracing (where the devtool log surface and
//! OTLP exporter consume from) AND the typed `InternalEvent`
//! broadcast bus (where minion subscribers, governance reactors,
//! and the devtool Debug tab consume from).
//!
//! The kernel `rrd` crate does NOT depend on `devpulse-engine`
//! (kernel sits below engine in the dependency layering). The
//! daemon therefore emits via `tracing` only. This translator
//! preserves H12 by **structural guarantee**: a single
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
//! to emit it — gets the InternalEvent. Drift is structurally
//! impossible.
//!
//! ## H13 grep parity, restated
//!
//! Doc H13 said `grep emit_rrd_lifecycle!` count == `grep
//! InternalEvent::RrdPhaseTransition` count. With the translator,
//! the second grep should show only ONE callsite (this file). The
//! parity rule restates as: "all `InternalEvent::RrdPhaseTransition`
//! emissions originate from `RrdLifecycleTranslator::on_event`."

use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::field::{Field, Visit};
use tracing::Subscriber;
use tracing_subscriber::layer::{Context, Layer};

use crate::platform::facade::events::InternalEvent;

/// Tracing-subscriber Layer that translates RRD lifecycle events
/// into typed broadcast events.
///
/// Construct with the engine's `broadcast::Sender<InternalEvent>`,
/// then add to the tracing subscriber via `.with(translator)`.
pub struct RrdLifecycleTranslator {
    tx: Arc<broadcast::Sender<InternalEvent>>,
}

impl RrdLifecycleTranslator {
    /// Construct a translator that publishes onto the given
    /// broadcast channel. Cloning is intentional — the layer
    /// is moved into the tracing-subscriber pipeline at engine
    /// boot and the sender is reused for every translated event.
    pub fn new(tx: Arc<broadcast::Sender<InternalEvent>>) -> Self {
        Self { tx }
    }
}

impl<S: Subscriber> Layer<S> for RrdLifecycleTranslator {
    fn on_event(&self, event: &tracing::Event<'_>, _ctx: Context<'_, S>) {
        // Filter — only translate events on the kernel's
        // `rrd.lifecycle` target. Other tracing traffic flows
        // through unchanged to other Layers.
        if event.metadata().target() != rrd::RRD_LIFECYCLE_TARGET {
            return;
        }

        // Extract the `phase` and `detail` string fields. Tracing's
        // field-recording API is visitor-based — we walk the fields
        // once and pluck the two we care about.
        let mut phase: Option<String> = None;
        let mut detail: Option<String> = None;
        struct PhaseDetailVisitor<'a> {
            phase: &'a mut Option<String>,
            detail: &'a mut Option<String>,
        }
        impl<'a> Visit for PhaseDetailVisitor<'a> {
            fn record_str(&mut self, field: &Field, value: &str) {
                match field.name() {
                    "phase" => *self.phase = Some(value.to_string()),
                    "detail" => *self.detail = Some(value.to_string()),
                    _ => {}
                }
            }
            fn record_debug(&mut self, field: &Field, value: &dyn std::fmt::Debug) {
                let v = format!("{value:?}");
                // tracing's Debug-format for &str strings is
                // `"foo"` with quotes — strip them so consumers
                // don't see escaped strings.
                let trimmed = v.trim_matches('"').to_string();
                match field.name() {
                    "phase" => *self.phase = Some(trimmed),
                    "detail" => *self.detail = Some(trimmed),
                    _ => {}
                }
            }
        }
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

        // `send` returns Err if there are no active receivers.
        // That's fine — translator is fire-and-forget; nobody
        // listening just means the event is discarded, same as
        // a tracing event with no subscriber attached.
        let _ = self.tx.send(InternalEvent::RrdPhaseTransition { phase, detail });
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
    use tracing_subscriber::layer::SubscriberExt;
    use tracing_subscriber::registry::Registry;

    #[tokio::test]
    async fn translator_mirrors_rrd_lifecycle_event_to_internal_event() {
        // Set up the broadcast channel and translator.
        let (tx, mut rx) = broadcast::channel::<InternalEvent>(64);
        let translator = RrdLifecycleTranslator::new(Arc::new(tx));

        // Install the translator as the active subscriber for this
        // test. set_default returns a thread-local guard.
        let subscriber = Registry::default().with(translator);
        let _guard = tracing::subscriber::set_default(subscriber);

        // Emit an event on the RRD lifecycle target the daemon way.
        rrd::emit_rrd_lifecycle!(
            "swap_commit",
            detail = "atomic pointer swap committed in test"
        );

        // Translator should have produced exactly one InternalEvent.
        let event = rx
            .try_recv()
            .expect("translator must emit an InternalEvent for every rrd.lifecycle tracing event");
        match event {
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
        let (tx, mut rx) = broadcast::channel::<InternalEvent>(64);
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
