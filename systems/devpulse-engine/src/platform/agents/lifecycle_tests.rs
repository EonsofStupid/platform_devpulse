//! Conversation ownership regressions; no vendor login or external requests.
#![allow(clippy::unwrap_used, reason = "test assertions")]

use std::time::Duration;
use tokio::sync::oneshot;

use super::*;
use lifecycle::Conversation;
use tests::{turn_fixture, user_turn};

async fn fixture_session(dir: &Path, running: bool) -> AgentSession {
    let mut definition = catalog::load(dir)
        .unwrap()
        .definitions
        .into_iter()
        .find(|definition| definition.id == ProviderId::ClaudeCode)
        .unwrap();
    // The fixture is a local shell, not a vendor account.
    definition.signed_in = None;
    definition.sign_in = None;
    let conversation = definition
        .connect
        .as_mut()
        .unwrap()
        .conversation
        .as_mut()
        .unwrap();
    conversation.resume.clear();
    conversation.output = devpulse_clyffy::providers::definition::StreamFormat::Text;
    #[cfg(windows)]
    let (program, args) = (
        "powershell",
        vec![
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "[Console]::WriteLine('ready'); while ($true) { [Threading.Thread]::Sleep(100) }",
        ],
    );
    #[cfg(unix)]
    let (program, args) = ("sh", vec!["-c", "printf 'ready\\n'; exec sleep 60"]);
    conversation.args = args.into_iter().map(str::to_owned).collect();
    let program = if running {
        devpulse_clyffy::providers::discovery::installed::on_path(program).unwrap()
    } else {
        let path = dir.join("must-not-launch");
        std::fs::write(&path, "not an executable").unwrap();
        path
    };
    AgentSession::start(
        &definition,
        &program,
        dir,
        dir,
        Some("saved-thread".into()),
        false,
    )
    .await
    .unwrap()
}

#[tokio::test]
async fn cancellation_before_start_never_polls_the_provider_and_next_turn_can_start() {
    let conversation = Arc::new(Conversation::default());
    let turn = conversation.begin().unwrap();
    conversation.cancel();
    assert!(
        turn.session(async { panic!("cancelled startup was polled") })
            .await
            .is_err()
    );
    drop(turn);
    assert!(!conversation.begin().unwrap().is_cancelled());
}

#[tokio::test]
async fn slow_start_is_cancellable_without_blocking_another_conversation() {
    let dir = tempfile::tempdir().unwrap();
    let slow = Arc::new(Conversation::default());
    let other = Arc::new(Conversation::default());
    let slow_turn = slow.begin().unwrap();
    let other_turn = other.begin().unwrap();
    let (started, entered) = oneshot::channel();
    let (held, disposed) = oneshot::channel::<()>();
    let (result, ()) = tokio::join!(
        slow_turn.session(async {
            let _held = held;
            started.send(()).unwrap();
            std::future::pending().await
        }),
        async {
            entered.await.unwrap();
            let session = tokio::time::timeout(
                Duration::from_secs(5),
                other_turn.session(async { Ok(fixture_session(dir.path(), false).await) }),
            )
            .await
            .unwrap()
            .unwrap();
            // The permission path can obtain this ready session during slow startup.
            assert!(Arc::ptr_eq(&session, &other.session().await.unwrap()));
            assert!(!session.answer("expired", None).await);
            slow.cancel();
        }
    );
    assert!(result.is_err());
    assert!(disposed.await.is_err());
    assert!(slow.session().await.is_none());
    assert!(slow.begin().is_err()); // Still owned until the caller finishes.
    drop(slow_turn);
    assert!(slow.begin().is_ok());
}

#[tokio::test]
async fn cancelled_after_prompt_save_does_not_dispatch_or_claim_success() {
    let (dir, db) = turn_fixture(2).await;
    let conversation = Arc::new(Conversation::default());
    let turn = conversation.begin().unwrap();
    let session = turn
        .session(async { Ok(fixture_session(dir.path(), false).await) })
        .await
        .unwrap();
    let mut events = persist_before_dispatch(&db, "s", "p", &user_turn("saved prompt"), || async {
        conversation.cancel();
        turn.dispatch(&session, "saved prompt").await
    })
    .await
    .unwrap();
    assert_eq!(
        events.recv().await,
        Some(AgentEvent::TurnEnded {
            stop: "cancelled".into()
        })
    );
    assert!(events.recv().await.is_none());
    assert_eq!(
        db.query("SELECT content FROM turns", &[]).await.unwrap(),
        vec![vec!["saved prompt".into()]]
    );
    assert!(conversation.begin().is_err());
    drop(turn);
    assert!(conversation.begin().is_ok());
    db.close().await;
}

#[tokio::test]
async fn a_failed_prompt_save_does_not_start_the_provider() {
    let (dir, db) = turn_fixture(0).await;
    let conversation = Arc::new(Conversation::default());
    let turn = conversation.begin().unwrap();
    let session = turn
        .session(async { Ok(fixture_session(dir.path(), false).await) })
        .await
        .unwrap();
    let result = persist_before_dispatch(&db, "s", "p", &user_turn("hello"), || {
        turn.dispatch(&session, "hello")
    })
    .await;
    assert!(result.is_err());
    assert_eq!(
        db.query("SELECT content FROM turns", &[]).await.unwrap(),
        [] as [std::vec::Vec<devpulse_clyffy::cortex::persistence::SqlValue>; 0]
    );
    drop(turn);
    assert!(conversation.begin().is_ok());
    db.close().await;
}

#[tokio::test]
async fn close_survives_its_waiter_and_waits_for_persistence_before_reopening() {
    let (dir, db) = turn_fixture(1).await;
    let conversation = Arc::new(Conversation::default());
    let turn = conversation.begin().unwrap();
    let before = turn
        .session(async { Ok(fixture_session(dir.path(), false).await) })
        .await
        .unwrap();
    assert!(
        tokio::time::timeout(Duration::from_millis(20), conversation.close())
            .await
            .is_err()
    );
    conversation.cancel(); // Cannot turn Closing back into ordinary cancellation.
    assert!(turn.is_cancelled());
    assert!(conversation.begin().is_err());
    assert!(conversation.session().await.is_none());
    save_turn(&db, "s", "p", &user_turn("final persisted record"))
        .await
        .unwrap();
    drop(turn);
    tokio::time::timeout(Duration::from_secs(5), async {
        tokio::join!(conversation.close(), conversation.close());
    })
    .await
    .unwrap();
    let next = conversation.begin().unwrap();
    let after = next
        .session(async { Ok(fixture_session(dir.path(), false).await) })
        .await
        .unwrap();
    assert!(!Arc::ptr_eq(&before, &after));
    assert_eq!(after.resume_token().await.as_deref(), Some("saved-thread"));
    assert_eq!(
        db.query("SELECT content FROM turns", &[]).await.unwrap(),
        vec![vec!["final persisted record".into()]]
    );
    drop(next);
    conversation.close().await;
    db.close().await;
}

#[tokio::test]
async fn closing_during_startup_disposes_it_and_blocks_reopen_until_turn_releases() {
    let conversation = Arc::new(Conversation::default());
    let turn = conversation.begin().unwrap();
    let (entered, started) = oneshot::channel();
    let (result, ()) = tokio::join!(
        turn.session(async {
            entered.send(()).unwrap();
            std::future::pending().await
        }),
        async {
            started.await.unwrap();
            assert!(
                tokio::time::timeout(Duration::from_millis(20), conversation.close())
                    .await
                    .is_err()
            );
        }
    );
    assert!(result.is_err());
    assert!(conversation.begin().is_err());
    drop(turn);
    tokio::time::timeout(Duration::from_secs(5), conversation.close())
        .await
        .unwrap();
    assert!(conversation.begin().is_ok());
}

#[tokio::test]
async fn losing_the_ipc_waiter_keeps_the_admitted_turn_and_its_completion() {
    let conversation = Arc::new(Conversation::default());
    let turn = conversation.begin().unwrap();
    let (finish, release) = oneshot::channel();
    let (completed, saved) = oneshot::channel();
    assert!(
        tokio::time::timeout(
            Duration::from_millis(20),
            lifecycle::owned(async move {
                release.await.unwrap();
                drop(turn);
                completed.send(()).unwrap();
                Ok(())
            })
        )
        .await
        .is_err()
    );
    assert!(conversation.begin().is_err());
    finish.send(()).unwrap();
    tokio::time::timeout(Duration::from_secs(5), saved)
        .await
        .unwrap()
        .unwrap();
    assert!(conversation.begin().is_ok());
}

#[tokio::test]
async fn cancellation_reaches_a_real_running_provider_and_keeps_its_partial_answer() {
    let dir = tempfile::tempdir().unwrap();
    let conversation = Arc::new(Conversation::default());
    let turn = conversation.begin().unwrap();
    let session = turn
        .session(async { Ok(fixture_session(dir.path(), true).await) })
        .await
        .unwrap();
    let mut events = turn.dispatch(&session, "hello").await.unwrap();
    let observed = Arc::new(LiveState::default());
    let observation = observed.begin("s", "p", None, Some(ProviderId::ClaudeCode));
    let (out, mut visible) = mpsc::unbounded_channel();
    let (result, ()) = tokio::join!(
        tokio::time::timeout(
            Duration::from_secs(10),
            turn.wait_for_answer(&session, receive_answer(&mut events, &out, &observation))
        ),
        async {
            let first = tokio::time::timeout(Duration::from_secs(5), visible.recv())
                .await
                .unwrap()
                .unwrap();
            assert!(matches!(first, AgentEvent::Text { ref text } if text.contains("ready")));
            conversation.cancel();
        }
    );
    let (answer, stop, ending) = result.unwrap();
    assert!(answer.contains("ready"));
    assert_eq!(stop, "cancelled");
    assert_eq!(
        ending,
        AgentEvent::TurnEnded {
            stop: "cancelled".into()
        }
    );
    assert!(conversation.begin().is_err());
    observation.finish(&ending);
    drop(turn);
    conversation.close().await;
}
