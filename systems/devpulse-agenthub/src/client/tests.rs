//! Cancellation and shutdown while a real child's reply is still pending.
#![allow(clippy::unwrap_used, reason = "test assertions")]

use super::*;

fn pending_peer() -> Client {
    #[cfg(windows)]
    let (program, args) = (
        "powershell",
        vec![
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "[Console]::OpenStandardInput().CopyTo([System.IO.Stream]::Null)",
        ],
    );
    #[cfg(unix)]
    let (program, args) = ("sh", vec!["-c", "cat >/dev/null"]);
    let (child, input, output) = SupervisedChild::spawn_piped(
        &ChildSpec {
            name: "pending-agenthub-peer".into(),
            program: program.into(),
            args: args.into_iter().map(str::to_owned).collect(),
            ..ChildSpec::default()
        },
        Arc::new(|_, _| {}),
    )
    .unwrap();
    Client {
        program: "must-never-restart".into(),
        data_dir: PathBuf::new(),
        state: Mutex::new(State::Running(Box::new(Peer {
            child,
            input,
            output,
        }))),
        stopping: watch::channel(false).0,
    }
}

#[tokio::test]
async fn cancelling_an_exchange_poisoned_the_connection_without_replay() {
    let client = pending_peer();
    assert!(
        tokio::time::timeout(Duration::from_millis(100), client.sessions())
            .await
            .is_err()
    );
    assert!(matches!(*client.state.lock().await, State::Failed(_)));
    let error = client.sessions().await.unwrap_err().to_string();
    assert!(error.contains("interrupted"), "{error}");
    client.shutdown().await.unwrap();
}

#[tokio::test]
async fn shutdown_interrupts_a_pending_request_and_closes_its_peer() {
    let client = Arc::new(pending_peer());
    let caller = Arc::clone(&client);
    let request = devpulse_telemetry::spawn(async move { caller.sessions().await });
    // Observe that the request owns the connection, rather than relying on
    // a fixed delay to guess whether the task has been scheduled.
    tokio::time::timeout(Duration::from_secs(5), async {
        while client.state.try_lock().is_ok() {
            tokio::task::yield_now().await;
        }
    })
    .await
    .unwrap();
    tokio::time::timeout(Duration::from_secs(10), client.shutdown())
        .await
        .unwrap()
        .unwrap();
    assert!(request
        .await
        .unwrap()
        .unwrap_err()
        .to_string()
        .contains("shutting down"));
    assert!(matches!(*client.state.lock().await, State::Stopped));
}
