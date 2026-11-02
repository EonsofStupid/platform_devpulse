//! Exercise the actual binary with fixture-only provider roots.
#![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

use std::path::Path;
use std::sync::Arc;
use std::time::Duration;

use devpulse_agenthub::client::Client;
use devpulse_agenthub::protocol::{self, Hello, Reply, Request};
use devpulse_clyffy::providers::ProviderId;
use devpulse_process::{ChildSpec, SupervisedChild};
use tokio::process::{ChildStdin, ChildStdout};

fn fixture() -> tempfile::TempDir {
    let dir = tempfile::tempdir().unwrap();
    let config = dir.path().join("config/providers");
    let history = dir.path().join("history");
    std::fs::create_dir_all(&config).unwrap();
    std::fs::create_dir_all(&history).unwrap();
    for (provider, root) in [
        ("claude-code", history.clone()),
        ("codex", dir.path().join("absent")),
    ] {
        std::fs::write(config.join(format!("{provider}.toml")), format!(
            "id = \"{provider}\"\n[detect]\nexecutables = [\"unused\"]\n[history]\nformat = \"{provider}\"\nroot = {:?}\n", root.to_string_lossy()
        )).unwrap();
    }
    std::fs::write(
        history.join("one.jsonl"),
        "{\"type\":\"user\",\"message\":{\"content\":\"Fixture request\"}}\n",
    )
    .unwrap();
    dir
}

fn start(data_dir: &Path) -> (SupervisedChild, ChildStdin, ChildStdout) {
    SupervisedChild::spawn_piped(
        &ChildSpec {
            name: "agenthub-test".into(),
            program: env!("CARGO_BIN_EXE_devpulse-agenthub").into(),
            args: vec!["--data-dir".into(), data_dir.to_string_lossy().into_owned()],
            ..ChildSpec::default()
        },
        Arc::new(|_, _| {}),
    )
    .unwrap()
}

async fn connect(input: &mut ChildStdin, output: &mut ChildStdout) {
    protocol::write(input, &Hello::default()).await.unwrap();
    let hello: Hello = tokio::time::timeout(Duration::from_secs(15), protocol::read(output))
        .await
        .unwrap()
        .unwrap()
        .unwrap();
    hello.verify().unwrap();
}

#[tokio::test]
async fn concurrent_windows_share_a_real_peer_and_operation_errors_do_not_break_it() {
    let dir = fixture();
    let client = Client::new(
        env!("CARGO_BIN_EXE_devpulse-agenthub").into(),
        dir.path().into(),
    );
    let (first, second) = tokio::join!(client.sessions(), client.sessions());
    let first = first.unwrap();
    assert_eq!(first, second.unwrap());
    assert_eq!(first.sessions.len(), 1);
    assert_eq!(first.sessions[0].title, "Fixture request");
    assert!(
        client
            .page(ProviderId::ClaudeCode, "not-a-locator".into(), None)
            .await
            .is_err()
    );
    let page = client
        .page(
            ProviderId::ClaudeCode,
            first.sessions[0].locator.clone(),
            None,
        )
        .await
        .unwrap();
    assert_eq!(page.events[0].text, "Fixture request");
    client.shutdown().await.unwrap();
    client.shutdown().await.unwrap();
    assert!(client.sessions().await.is_err());
}

#[tokio::test]
async fn eof_closes_the_actual_child_and_crash_closes_its_reply_pipe() {
    let dir = fixture();
    let (mut child, mut input, mut output) = start(dir.path());
    connect(&mut input, &mut output).await;
    protocol::write(&mut input, &Request::Sessions)
        .await
        .unwrap();
    let reply: Reply = protocol::read(&mut output).await.unwrap().unwrap();
    assert!(matches!(reply, Reply::Sessions(_)));
    drop(input);
    assert!(
        tokio::time::timeout(Duration::from_secs(10), child.wait())
            .await
            .unwrap()
            .unwrap()
            .success()
    );
    assert!(
        protocol::read::<_, Reply>(&mut output)
            .await
            .unwrap()
            .is_none()
    );

    let (mut child, mut input, mut output) = start(dir.path());
    connect(&mut input, &mut output).await;
    child.kill().await.unwrap();
    assert!(
        tokio::time::timeout(
            Duration::from_secs(10),
            protocol::read::<_, Reply>(&mut output)
        )
        .await
        .unwrap()
        .unwrap()
        .is_none()
    );
}

#[tokio::test]
async fn a_stale_binary_contract_is_refused_before_any_request() {
    let dir = fixture();
    let (mut child, mut input, mut output) = start(dir.path());
    let mut stale = serde_json::to_value(Hello::default()).unwrap();
    stale["build"] = "stale".into();
    protocol::write(&mut input, &stale).await.unwrap();
    assert!(
        tokio::time::timeout(
            Duration::from_secs(10),
            protocol::read::<_, Hello>(&mut output)
        )
        .await
        .unwrap()
        .unwrap()
        .is_none()
    );
    assert!(!child.wait().await.unwrap().success());
}

#[tokio::test]
async fn a_failed_start_is_not_silently_retried() {
    let dir = fixture();
    let program = dir.path().join(devpulse_agenthub::client::EXECUTABLE);
    let client = Client::new(program.clone(), dir.path().into());
    let first = client.sessions().await.unwrap_err().to_string();
    std::fs::copy(env!("CARGO_BIN_EXE_devpulse-agenthub"), program).unwrap();
    assert_eq!(client.sessions().await.unwrap_err().to_string(), first);
    client.shutdown().await.unwrap();
}

#[tokio::test]
async fn the_runtime_runs_from_a_bundle_folder_outside_the_checkout() {
    let dir = fixture();
    let program = dir.path().join(devpulse_agenthub::client::EXECUTABLE);
    std::fs::copy(env!("CARGO_BIN_EXE_devpulse-agenthub"), &program).unwrap();
    let client = Client::new(program, dir.path().into());
    assert_eq!(
        client.sessions().await.unwrap().sessions[0].title,
        "Fixture request"
    );
    client.shutdown().await.unwrap();
}
