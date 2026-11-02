//! Test 4 — Drain test (`HOT_UPDATE_PATTERN.md` §12 verification 4)
//!
//! "10 mock query tasks each holding a Guard for 100ms; trigger
//!  pause; assert pause completes only after the last task resolves."
//!
//! What this proves: the daemon's drain semantics are correct —
//! `pause()` waits for tracked tasks to settle BEFORE returning,
//! not just signals them. Without this, mid-swap reads would see
//! state torn between old and new.

#![allow(clippy::unwrap_used, clippy::expect_used, reason = "test assertions")]

mod common;

use std::sync::Arc;
use std::time::{Duration, Instant};

use rrd::{HotSwap, RRD};

use common::TestComponent;

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn pause_waits_for_all_in_flight_tasks_to_complete() {
    let initial = TestComponent::new(0);
    let daemon = Arc::new(RRD::<TestComponent>::new(initial));
    assert_eq!(daemon.current().generation, 0, "initial gen");

    // Spawn 10 mock query tasks. Each holds a "guard" (just sleeps
    // 100ms, simulating a synchronous forward pass) and obeys
    // cancellation by checking the token AFTER the work — i.e.
    // the work doesn't abort mid-flight, but new attempts to use
    // the daemon would.
    //
    // The drain must wait for ALL of these to finish before
    // pause() returns. If pause() returned early, we'd see the
    // "in_flight task end" timestamp AFTER the "pause returned"
    // timestamp — that's the failure mode.
    let mut handles = Vec::with_capacity(10);
    let task_complete_times = Arc::new(tokio::sync::Mutex::new(Vec::<Instant>::new()));
    for i in 0..10 {
        let times = task_complete_times.clone();
        let h = daemon
            .track(move |_cancel| async move {
                tokio::time::sleep(Duration::from_millis(100)).await;
                times.lock().await.push(Instant::now());
                i // arbitrary return value
            })
            .await;
        handles.push(h);
    }

    // Trigger pause. Should block until all 10 tasks complete.
    let pause_start = Instant::now();
    let pause_handle = daemon.pause().await.expect("pause should succeed");
    let pause_returned = Instant::now();

    // Sanity: pause itself shouldn't have taken less than ~100ms,
    // because the tasks each sleep 100ms.
    let elapsed = pause_returned.duration_since(pause_start);
    assert!(
        elapsed >= Duration::from_millis(80),
        "pause returned in {elapsed:?} — expected ≥80ms (tasks sleep 100ms each)"
    );

    // Critical assertion: every task completion timestamp is
    // BEFORE pause_returned. If any task finished after, the
    // drain didn't actually wait.
    let times = task_complete_times.lock().await;
    assert_eq!(
        times.len(),
        10,
        "expected all 10 tasks to have run; got {}",
        times.len()
    );
    for (i, t) in times.iter().enumerate() {
        assert!(
            *t <= pause_returned,
            "task {i} completed at {t:?}, after pause_returned at {pause_returned:?} — drain broke its contract"
        );
    }

    // Clean up: complete the cycle.
    daemon
        .resume(pause_handle)
        .await
        .expect("resume should succeed");
}

/// Test 4-bis — drain timeout path: tasks that ignore cancellation
/// AND outlast the configured drain timeout do NOT block the daemon.
/// The daemon force-proceeds and emits `DRAIN_TIMEOUT` (verified
/// indirectly — if the daemon hangs, this test hangs too).
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn pause_force_proceeds_after_drain_timeout() {
    let initial = TestComponent::new(7);
    // Short timeout so the test runs in <1s instead of 30s.
    let daemon =
        Arc::new(RRD::<TestComponent>::new(initial).with_drain_timeout(Duration::from_millis(200)));
    assert_eq!(daemon.current().generation, 7, "initial gen");

    // Spawn a task that sleeps WAY longer than the drain timeout
    // and ignores cancellation. The daemon must force-proceed.
    let _stuck_handle = daemon
        .track(|_cancel| async move {
            tokio::time::sleep(Duration::from_secs(10)).await;
            42
        })
        .await;

    let pause_start = Instant::now();
    let pause_handle = daemon
        .pause()
        .await
        .expect("pause should still succeed even with stuck task");
    let elapsed = pause_start.elapsed();

    // Should complete in ~200ms (drain timeout), not 10s (task duration).
    assert!(
        elapsed < Duration::from_secs(1),
        "pause hung waiting for stuck task — drain timeout didn't fire (elapsed {elapsed:?})"
    );
    assert!(
        elapsed >= Duration::from_millis(150),
        "pause returned suspiciously fast ({elapsed:?}) — drain wasn't actually attempted"
    );

    daemon
        .resume(pause_handle)
        .await
        .expect("resume should succeed");
}
