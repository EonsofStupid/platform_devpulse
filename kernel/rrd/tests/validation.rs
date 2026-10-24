//! Test 6 — Validation rejection (HOT_UPDATE_PATTERN.md §12 verification 6)
//!
//! "A deliberately-corrupt snapshot fails `validate`; live encoder
//!  unchanged after the failed swap attempt."
//!
//! What this proves: the daemon's validate-then-swap order is
//! correct. A snapshot that fails validation never becomes live;
//! the previous live component is preserved.

mod common;

use std::sync::Arc;

use rrd::{HotSwap, HotUpdateable, RRDError, RRDState, RRD};

use common::{TestComponent, TestSource};

#[tokio::test]
async fn failed_validation_keeps_previous_live_component() {
    let original = TestComponent::new(1);
    let daemon = Arc::new(RRD::<TestComponent>::new(original.clone()));

    // Sanity — daemon is Running and live is generation 1.
    assert_eq!(*daemon.subscribe().borrow(), RRDState::Running);
    assert_eq!(daemon.current().generation, 1);

    let pause_handle = daemon.pause().await.expect("pause should succeed");

    // Construct a snapshot that will fail validation.
    let bad_source = TestSource {
        generation: 99,
        pass_validate: false,
    };
    let bad_snapshot = TestComponent::load(&bad_source)
        .await
        .expect("load itself should succeed; only validate fails");

    let swap_result = daemon.swap(&pause_handle, bad_snapshot).await;
    assert!(
        matches!(swap_result, Err(RRDError::ValidationFailed(_))),
        "expected ValidationFailed, got {swap_result:?}"
    );

    // Critical assertion: live component is STILL generation 1.
    assert_eq!(
        daemon.current().generation,
        1,
        "validation failure must NOT have promoted the bad snapshot"
    );

    // State should be Failed(EncoderValidationFailed).
    let state = daemon.subscribe().borrow().clone();
    assert!(
        matches!(state, RRDState::Failed(_)),
        "expected Failed state after validate fail, got {state:?}"
    );
    let reason = state
        .failure_reason()
        .expect("Failed should carry a reason");
    assert!(
        matches!(reason, rrd::FailureReason::EncoderValidationFailed(_)),
        "expected EncoderValidationFailed reason, got {reason:?}"
    );

    // Resume out of Failed is NOT legal — the operator path is
    // Failed → Loading via manual recovery, not resume. Confirm
    // the daemon enforces this.
    let resume_result = daemon.resume(pause_handle).await;
    assert!(
        matches!(resume_result, Err(RRDError::StateTransitionInvalid { .. })),
        "expected resume from Failed to be illegal, got {resume_result:?}"
    );
}

#[tokio::test]
async fn successful_validation_promotes_new_component() {
    let original = TestComponent::new(1);
    let daemon = Arc::new(RRD::<TestComponent>::new(original));

    let pause_handle = daemon.pause().await.unwrap();

    let good_source = TestSource {
        generation: 2,
        pass_validate: true,
    };
    let good_snapshot = TestComponent::load(&good_source).await.unwrap();

    daemon
        .swap(&pause_handle, good_snapshot)
        .await
        .expect("swap with passing validation should succeed");

    // Live component is now generation 2.
    assert_eq!(daemon.current().generation, 2);

    daemon
        .resume(pause_handle)
        .await
        .expect("resume after successful swap");
    assert_eq!(*daemon.subscribe().borrow(), RRDState::Running);
}

#[tokio::test]
async fn pause_without_resume_then_pause_again_rejected() {
    let original = TestComponent::new(0);
    let daemon = Arc::new(RRD::<TestComponent>::new(original));

    let _first = daemon.pause().await.expect("first pause should succeed");

    let second = daemon.pause().await;
    assert!(
        matches!(second, Err(RRDError::AlreadyPaused)),
        "concurrent pause should be rejected, got {second:?}"
    );
}
