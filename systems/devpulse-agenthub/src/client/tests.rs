//! Deterministic pipe peers: observe dispatch before cancelling a caller.
#![allow(clippy::unwrap_used, reason = "test assertions")]

use super::*;
use tokio::sync::oneshot;

struct Fixture {
    dir: tempfile::TempDir,
}

impl Fixture {
    fn new() -> Self {
        let dir = tempfile::tempdir().unwrap();
        for (index, message) in ["first", "second", "third"].iter().enumerate() {
            let bytes = serde_json::to_vec(&Reply::Error((*message).into())).unwrap();
            let mut framed = u32::try_from(bytes.len()).unwrap().to_be_bytes().to_vec();
            framed.extend(bytes);
            std::fs::write(dir.path().join(format!("reply-{index}")), framed).unwrap();
        }
        Self { dir }
    }

    fn peer(&self) -> Peer {
        let length = serde_json::to_vec(&Request::Sessions).unwrap().len() + 4;
        #[cfg(windows)]
        let (program, args) = (
            "powershell",
            vec![
                "-NoProfile".into(),
                "-NonInteractive".into(),
                "-Command".into(),
                format!(
                    r#"$ErrorActionPreference = 'Stop'
$inputStream = [Console]::OpenStandardInput()
$outputStream = [Console]::OpenStandardOutput()
if ([IO.File]::Exists('idle')) {{
    [IO.File]::WriteAllText('seen-0', '')
    while (-not [IO.File]::Exists('fail')) {{ [Threading.Thread]::Sleep(10) }}
    exit 7
}}
for ($index = 0; $index -lt 3; $index++) {{
    for ($byte = 0; $byte -lt {length}; $byte++) {{
        if ($inputStream.ReadByte() -lt 0) {{ exit 0 }}
    }}
    [IO.File]::WriteAllText("seen-$index", '')
    while (-not [IO.File]::Exists("release-$index")) {{
        if ([IO.File]::Exists('fail')) {{ exit 7 }}
        [Threading.Thread]::Sleep(10)
    }}
    $reply = [IO.File]::ReadAllBytes("reply-$index")
    $outputStream.Write($reply, 0, $reply.Length)
    $outputStream.Flush()
}}
$inputStream.CopyTo([IO.Stream]::Null)"#
                ),
            ],
        );
        #[cfg(unix)]
        let (program, args) = (
            "sh",
            vec![
                "-c".into(),
                format!(
                    r#"if [ -f idle ]; then
    touch seen-0
    while [ ! -f fail ]; do sleep 0.01; done
    exit 7
fi
for index in 0 1 2; do
    head -c {length} > request
    [ "$(wc -c < request)" -eq {length} ] || exit 0
    touch "seen-$index"
    while [ ! -f "release-$index" ]; do
        [ ! -f fail ] || exit 7
        sleep 0.01
    done
    cat "reply-$index"
done
cat >/dev/null"#
                ),
            ],
        );
        let (child, input, output) = SupervisedChild::spawn_piped(
            &ChildSpec {
                name: "controlled-agenthub-peer".into(),
                program: program.into(),
                args,
                dir: Some(self.dir.path().into()),
                ..ChildSpec::default()
            },
            Arc::new(|_, _| {}),
        )
        .unwrap();
        Peer {
            child,
            input,
            output,
        }
    }

    fn client(&self, timeout: Duration) -> Client {
        let peer = self.peer();
        client(async { Ok(peer) }, timeout)
    }

    async fn seen(&self, index: usize) {
        tokio::time::timeout(Duration::from_secs(10), async {
            while !self.dir.path().join(format!("seen-{index}")).exists() {
                tokio::time::sleep(Duration::from_millis(5)).await;
            }
        })
        .await
        .unwrap();
    }

    fn release(&self, index: usize) {
        std::fs::write(self.dir.path().join(format!("release-{index}")), "").unwrap();
    }
}

fn client(
    start: impl std::future::Future<Output = Result<Peer>> + Send + 'static,
    timeout: Duration,
) -> Client {
    let stopping = watch::channel(false).0;
    let worker = Worker::start(start, stopping.subscribe(), timeout);
    Client {
        program: "must-never-restart".into(),
        data_dir: PathBuf::new(),
        worker: Mutex::new(Some(worker)),
        stopping,
    }
}

fn call(client: &Arc<Client>) -> tokio::task::JoinHandle<String> {
    let client = Arc::clone(client);
    devpulse_telemetry::spawn(async move { client.sessions().await.unwrap_err().to_string() })
}

async fn shutdown(client: &Client) {
    tokio::time::timeout(Duration::from_secs(10), client.shutdown())
        .await
        .unwrap()
        .unwrap();
}

#[tokio::test]
async fn cancelled_caller_keeps_the_peer_and_consumes_its_own_reply() {
    let fixture = Fixture::new();
    let client = Arc::new(fixture.client(Duration::from_secs(30)));
    let first = call(&client);
    fixture.seen(0).await;
    first.abort();
    assert!(first.await.unwrap_err().is_cancelled());
    let second = call(&client);
    fixture.release(0);
    fixture.seen(1).await;
    fixture.release(1);
    assert_eq!(second.await.unwrap(), "second");
    let third = call(&client);
    fixture.release(2);
    assert_eq!(third.await.unwrap(), "third");
    shutdown(&client).await;
}

#[tokio::test]
async fn cancellation_during_startup_does_not_cancel_the_shared_start() {
    let fixture = Fixture::new();
    let (ready, start) = oneshot::channel();
    let client = Arc::new(client(
        async { start.await.context("release test peer") },
        Duration::from_secs(30),
    ));
    assert_eq!(client.status().await.state, RuntimeState::Starting);
    // Poll through enqueue while startup is still held.
    assert!(
        tokio::time::timeout(Duration::from_millis(50), client.sessions())
            .await
            .is_err()
    );
    ready
        .send(fixture.peer())
        .unwrap_or_else(|_| panic!("startup was cancelled"));
    fixture.seen(0).await;
    assert_eq!(client.status().await.state, RuntimeState::Connected);
    let second = call(&client);
    fixture.release(0);
    fixture.seen(1).await;
    fixture.release(1);
    assert_eq!(second.await.unwrap(), "second");
    shutdown(&client).await;
    assert_eq!(client.status().await.state, RuntimeState::Stopped);
}

#[tokio::test]
async fn shutdown_rejects_pending_and_backpressured_callers_and_survives_cancellation() {
    let fixture = Fixture::new();
    let client = Arc::new(fixture.client(Duration::from_secs(30)));
    let first = call(&client);
    fixture.seen(0).await;
    let queued: Vec<_> = (0..40).map(|_| call(&client)).collect();
    let worker = client.worker.lock().await.clone().unwrap();
    tokio::time::timeout(Duration::from_secs(5), async {
        while !worker.queue_is_full() {
            tokio::task::yield_now().await;
        }
    })
    .await
    .unwrap();
    // Cleanup drains the held reply; abandon this shutdown waiter first.
    assert!(
        tokio::time::timeout(Duration::from_millis(50), client.shutdown())
            .await
            .is_err()
    );
    assert!(first.await.unwrap().contains("shutting down"));
    for request in queued {
        assert!(request.await.unwrap().contains("shutting down"));
    }
    fixture.release(0);
    shutdown(&client).await;
    shutdown(&client).await;
    assert!(client
        .sessions()
        .await
        .unwrap_err()
        .to_string()
        .contains("shutting down"));
    assert!(!fixture.dir.path().join("seen-1").exists());
}

#[tokio::test]
async fn child_failure_resolves_all_callers_without_replay() {
    let fixture = Fixture::new();
    let client = Arc::new(fixture.client(Duration::from_secs(30)));
    let first = call(&client);
    fixture.seen(0).await;
    let second = call(&client);
    std::fs::write(fixture.dir.path().join("fail"), "").unwrap();
    let error = first.await.unwrap();
    assert!(error.contains("disconnected"), "{error}");
    assert_eq!(second.await.unwrap(), error);
    assert_eq!(client.sessions().await.unwrap_err().to_string(), error);
    shutdown(&client).await;
    assert!(!fixture.dir.path().join("seen-1").exists());
}

#[tokio::test]
async fn an_idle_child_exit_is_observed_without_another_request() {
    let fixture = Fixture::new();
    std::fs::write(fixture.dir.path().join("idle"), "").unwrap();
    let client = fixture.client(Duration::from_secs(30));
    fixture.seen(0).await;
    assert_eq!(client.status().await.state, RuntimeState::Connected);
    // No request or shutdown call triggers discovery of the exit.
    let mut monitor = client.worker.lock().await.clone().unwrap();
    std::fs::write(fixture.dir.path().join("fail"), "").unwrap();
    tokio::time::timeout(Duration::from_secs(5), monitor.finished())
        .await
        .unwrap()
        .unwrap();
    let status = client.status().await;
    assert_eq!(status.state, RuntimeState::Failed);
    assert!(status.message.unwrap().contains("exited"));
    let error = client.sessions().await.unwrap_err().to_string();
    assert!(error.contains("exited"), "{error}");
    shutdown(&client).await;
}

#[tokio::test]
async fn request_timeout_fails_the_queue_and_never_dispatches_the_next_request() {
    let fixture = Fixture::new();
    let client = Arc::new(fixture.client(Duration::from_secs(2)));
    let first = call(&client);
    fixture.seen(0).await;
    let second = call(&client);
    let error = first.await.unwrap();
    assert!(error.contains("timed out"), "{error}");
    assert_eq!(second.await.unwrap(), error);
    fixture.release(0);
    shutdown(&client).await;
    assert!(!fixture.dir.path().join("seen-1").exists());
}

#[tokio::test]
async fn dropping_the_client_closes_the_child_without_explicit_shutdown() {
    let fixture = Fixture::new();
    let client = fixture.client(Duration::from_secs(30));
    fixture.release(0);
    assert_eq!(client.sessions().await.unwrap_err().to_string(), "first");
    let mut monitor = client.worker.lock().await.clone().unwrap();
    drop(client);
    tokio::time::timeout(Duration::from_secs(10), monitor.finished())
        .await
        .unwrap()
        .unwrap();
}

#[tokio::test]
async fn shutdown_before_first_request_does_not_start_a_child() {
    let client = Client::new("must-never-start".into(), PathBuf::new());
    assert_eq!(client.status().await.state, RuntimeState::Stopped);
    assert!(client.worker.lock().await.is_none());
    shutdown(&client).await;
    assert_eq!(client.status().await.state, RuntimeState::Stopped);
    assert!(client
        .sessions()
        .await
        .unwrap_err()
        .to_string()
        .contains("shutting down"));
    assert!(client.worker.lock().await.is_none());
}

#[tokio::test]
async fn startup_failure_is_observable_without_retrying_the_process() {
    let directory = tempfile::tempdir().unwrap();
    let client = Client::new(
        directory.path().join("missing-agenthub"),
        directory.path().into(),
    );
    assert_eq!(client.status().await.state, RuntimeState::Stopped);
    let error = client.sessions().await.unwrap_err().to_string();
    let status = client.status().await;
    assert_eq!(status.state, RuntimeState::Failed);
    assert!(status.message.unwrap().contains(&error));
    assert_eq!(client.sessions().await.unwrap_err().to_string(), error);
    shutdown(&client).await;
    assert_eq!(client.status().await.state, RuntimeState::Failed);
}
