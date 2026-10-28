//! Lifecycle checks exercise the owner used by real ACP startup and close.
#![allow(clippy::unwrap_used, reason = "test assertions")]

use super::*;

struct Fixture {
    session: AcpSession,
    ready: oneshot::Receiver<Result<(), String>>,
    disposed: oneshot::Receiver<()>,
}

async fn fixture(opened: bool, graceful: bool) -> Fixture {
    let shared = Arc::new(Shared::default());
    if opened {
        *shared.session_id.lock().await = Some("fixture-session".into());
    }
    let (ready, ready_rx) = oneshot::channel();
    *shared.ready.lock().await = Some(ready);
    let (commands, mut incoming) = mpsc::unbounded_channel();
    let (started, running) = oneshot::channel();
    let (held, disposed) = oneshot::channel();
    let connection = lifecycle::Connection::start(
        async move {
            let _held = held;
            let _ = started.send(());
            while let Some(command) = incoming.recv().await {
                if graceful && matches!(command, Command::Close) {
                    return;
                }
            }
            std::future::pending::<()>().await;
        },
        Arc::clone(&shared),
        Duration::from_millis(100),
    );
    running.await.unwrap();
    Fixture {
        session: AcpSession {
            commands,
            shared,
            connection,
        },
        ready: ready_rx,
        disposed,
    }
}

async fn disposed(receiver: oneshot::Receiver<()>) {
    // The sender is held by the connection future until that future is dropped.
    assert!(tokio::time::timeout(Duration::from_secs(5), receiver)
        .await
        .unwrap()
        .is_err());
}

#[tokio::test]
async fn dropped_startup_disposes_its_connection() {
    let fixture = fixture(false, false).await;
    assert!(tokio::time::timeout(
        Duration::from_millis(10),
        fixture.session.await_ready(fixture.ready, START_TIMEOUT),
    )
    .await
    .is_err());
    disposed(fixture.disposed).await;
}

#[tokio::test]
async fn startup_failure_and_timeout_confirm_cleanup_before_returning() {
    for fail in [false, true] {
        let fixture = fixture(false, false).await;
        if fail {
            tell_ready(&fixture.session.shared, Err("fixture auth refused".into())).await;
        }
        let outcome = fixture
            .session
            .await_ready(fixture.ready, Duration::from_millis(10))
            .await;
        let Err(error) = outcome else {
            panic!("startup should fail")
        };
        assert!(error
            .to_string()
            .contains(if fail { "auth refused" } else { "no session" }));
        // Cleanup is already confirmed, with no extra scheduling required.
        assert!(fixture.disposed.now_or_never().unwrap().is_err());
    }
}

#[tokio::test]
async fn close_waits_for_disposal_and_clears_turn_and_permission_senders() {
    for graceful in [false, true] {
        let fixture = fixture(true, graceful).await;
        let (events, mut ended) = mpsc::unbounded_channel();
        *fixture.session.shared.turn.lock().await = Some(events);
        let (permission, refused) = oneshot::channel();
        fixture
            .session
            .shared
            .pending
            .lock()
            .await
            .insert("request".into(), permission);
        tokio::join!(fixture.session.close(), fixture.session.close());
        assert!(fixture.disposed.now_or_never().unwrap().is_err());
        assert!(refused.now_or_never().unwrap().is_err());
        assert!(ended.recv().await.is_none());
        assert!(fixture.session.prompt("after close").is_err());
    }
}

#[tokio::test]
async fn cancelling_a_close_waiter_does_not_cancel_cleanup() {
    let fixture = fixture(true, false).await;
    assert!(
        tokio::time::timeout(Duration::from_millis(10), fixture.session.close())
            .await
            .is_err()
    );
    disposed(fixture.disposed).await;
    fixture.session.close().await;
    assert!(fixture.session.prompt("after close").is_err());
}

#[tokio::test]
async fn dropping_an_open_session_ends_its_connection() {
    let fixture = fixture(true, false).await;
    drop(fixture.session);
    disposed(fixture.disposed).await;
}

#[tokio::test]
async fn a_panicked_connection_clears_retained_senders() {
    let shared = Arc::new(Shared::default());
    let (events, mut ended) = mpsc::unbounded_channel();
    *shared.turn.lock().await = Some(events);
    let (started, running) = oneshot::channel();
    let connection = lifecycle::Connection::start(
        async {
            let _ = started.send(());
            panic!("fixture connection failure");
        },
        Arc::clone(&shared),
        Duration::from_millis(10),
    );
    running.await.unwrap();
    connection.close().await;
    assert!(ended.recv().await.is_none());
}

#[cfg(windows)]
#[tokio::test]
async fn cancelling_real_acp_startup_terminates_the_sdk_child() {
    use tokio::io::AsyncReadExt;

    // The socket proves that the actual child started and later exited. It
    // never answers ACP and deliberately ignores stdin EOF.
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    let launch = Launch {
        adapter: crate::providers::definition::AdapterKind::AcpAgent,
        program: "powershell".into(),
        args: vec!["-NoProfile".into(), "-NonInteractive".into(), "-Command".into(), format!(
            "$client = New-Object Net.Sockets.TcpClient('127.0.0.1', {port}); while ($true) {{ [Threading.Thread]::Sleep(100) }}"
        )],
        env: vec![],
    };
    let caller = devpulse_telemetry::spawn(async move {
        AcpSession::start(&launch, Path::new("C:/"), None).await
    });
    let connected = tokio::time::timeout(Duration::from_secs(10), listener.accept()).await;
    caller.abort();
    assert!(matches!(caller.await, Err(error) if error.is_cancelled()));
    let (mut child, _) = connected.unwrap().unwrap();
    let mut byte = [0];
    let ended = tokio::time::timeout(Duration::from_secs(5), child.read(&mut byte))
        .await
        .unwrap();
    assert!(
        matches!(ended, Ok(0)) || ended.is_err(),
        "child retained the socket: {ended:?}"
    );
}
