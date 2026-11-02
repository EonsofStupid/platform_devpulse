//! Test 11 — End-to-end log replay (`HOT_UPDATE_PATTERN.md` §12 verification 11)
//!
//! "`query_scoped_log("rrd.lifecycle", 100)` returns the expected
//!  phase sequence after a real pause→swap→resume cycle in a
//!  runtime test."
//!
//! Verification 11 in the doc is phrased against the engine's
//! `query_scoped_log` Tauri command. At the kernel layer (where
//! this test lives) we don't have access to that command — but
//! we DO have access to the same tracing taxonomy the command
//! reads from. So this test installs an in-process `tracing`
//! capture subscriber, runs the cycle, and asserts the captured
//! phase sequence matches the expected one.
//!
//! The engine-side test 10 (in `systems/devpulse-engine`) covers
//! the `InternalEvent` translation half of the contract.

#![allow(clippy::unwrap_used, clippy::expect_used, reason = "test assertions")]

mod common;

use std::sync::{Arc, Mutex};

use rrd::{HotSwap, HotUpdateable, RRD, RRD_LIFECYCLE_TARGET, lifecycle_phase};
use tracing::Subscriber;
use tracing::field::{Field, Visit};
use tracing_subscriber::Layer;
use tracing_subscriber::layer::{Context, SubscriberExt};
use tracing_subscriber::registry::Registry;

use common::{TestComponent, TestSource};

/// Tracing subscriber Layer that captures the `phase` field of
/// every event with target [`RRD_LIFECYCLE_TARGET`].
#[derive(Default, Clone)]
struct CapturedPhases(Arc<Mutex<Vec<String>>>);

impl CapturedPhases {
    fn snapshot(&self) -> Vec<String> {
        self.0.lock().unwrap().clone()
    }
}

impl<S: Subscriber> Layer<S> for CapturedPhases {
    fn on_event(&self, event: &tracing::Event<'_>, _ctx: Context<'_, S>) {
        // Visit the event's fields and capture the `phase` string.
        struct PhaseVisitor<'a>(&'a mut Option<String>);
        impl Visit for PhaseVisitor<'_> {
            fn record_str(&mut self, field: &Field, value: &str) {
                if field.name() == "phase" {
                    *self.0 = Some(value.to_string());
                }
            }
            fn record_debug(&mut self, field: &Field, value: &dyn std::fmt::Debug) {
                if field.name() == "phase" {
                    let v = format!("{value:?}");
                    // tracing's Debug-format for &str strings is "\"foo\"" — strip quotes.
                    let trimmed = v.trim_matches('"').to_string();
                    *self.0 = Some(trimmed);
                }
            }
        }
        if event.metadata().target() != RRD_LIFECYCLE_TARGET {
            return;
        }
        let mut phase: Option<String> = None;
        event.record(&mut PhaseVisitor(&mut phase));
        if let Some(p) = phase {
            self.0.lock().unwrap().push(p);
        }
    }
}

/// Run on the default current-thread tokio runtime — the daemon's
/// `Mutex.lock().await` yields, but only ever back to the same OS
/// thread, so `tracing::subscriber::set_default`'s thread-local
/// stays valid across awaits in this test.
#[tokio::test]
async fn pause_swap_resume_emits_canonical_phase_sequence() {
    let captured = CapturedPhases::default();
    let subscriber = Registry::default().with(captured.clone());

    // Thread-local subscriber guard — Drop releases the binding
    // when this fn returns. Avoids cross-test contamination via
    // the global default.
    let _guard = tracing::subscriber::set_default(subscriber);

    run_full_cycle().await;

    let phases = captured.snapshot();

    // Expected sequence from a clean pause→swap(success)→resume cycle:
    //   "ready" (construction)
    //   pause_requested
    //   drain_begin
    //   drain_complete
    //   load_complete       (snapshot received by daemon — load happens caller-side)
    //   validate_pass
    //   swap_commit
    //   resume_complete
    let expected = [
        "ready",
        lifecycle_phase::PAUSE_REQUESTED,
        lifecycle_phase::DRAIN_BEGIN,
        lifecycle_phase::DRAIN_COMPLETE,
        lifecycle_phase::LOAD_COMPLETE,
        lifecycle_phase::VALIDATE_PASS,
        lifecycle_phase::SWAP_COMMIT,
        lifecycle_phase::RESUME_COMPLETE,
    ];

    assert_eq!(
        phases.len(),
        expected.len(),
        "phase count mismatch: captured {phases:?}, expected {expected:?}"
    );
    for (i, (got, want)) in phases.iter().zip(expected.iter()).enumerate() {
        assert_eq!(
            got, want,
            "phase[{i}] = {got:?}, expected {want:?}; full sequence: {phases:?}"
        );
    }
}

async fn run_full_cycle() {
    let original = TestComponent::new(1);
    let daemon = Arc::new(RRD::<TestComponent>::new(original));
    assert_eq!(
        daemon.current().generation,
        1,
        "live component should be the original at cycle start"
    );

    let pause_handle = daemon.pause().await.expect("pause");

    let source = TestSource {
        generation: 2,
        pass_validate: true,
    };
    let snapshot = TestComponent::load(&source).await.expect("load");
    daemon.swap(&pause_handle, snapshot).await.expect("swap");

    daemon.resume(pause_handle).await.expect("resume");

    assert_eq!(
        daemon.current().generation,
        2,
        "live component should be the new generation after a successful cycle"
    );
}
