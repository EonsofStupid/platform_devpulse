//! Real relay children against one owner: the arrangement every agent session
//! uses (plan 0001 B6.2). Each child is the shipped binary, started the way a
//! vendor CLI starts an MCP server.

#![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

use std::process::Stdio;
use std::sync::Arc;
use std::time::Duration;

use devpulse_clyffy::cortex::persistence::{TursoAdapter, TursoOptions};
use devpulse_persona_mcp::PersonaStore;
use devpulse_persona_mcp::bridge::{Bridge, PIPE_ENV, TOKEN_ENV};
use serde_json::{Value, json};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader, Lines};
use tokio::process::{Child, ChildStdin, ChildStdout, Command};

const WAIT: Duration = Duration::from_secs(30);

fn command(address: &str, token: &str) -> Command {
    let mut command = Command::new(env!("CARGO_BIN_EXE_devpulse-persona-mcp"));
    // A relay needs neither: the owner holds the database and authorizes it.
    command
        .env_remove("DEVPULSE_PERSONA_DB")
        .env_remove("CLYFFY_OFFLINE")
        .env(PIPE_ENV, address)
        .env(TOKEN_ENV, token)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);
    #[cfg(windows)]
    command.creation_flags(0x0800_0000);
    command
}

struct Session {
    child: Child,
    input: ChildStdin,
    output: Lines<BufReader<ChildStdout>>,
    next_id: u64,
}

impl Session {
    async fn start(address: &str, token: &str) -> Self {
        let mut child = command(address, token).spawn().expect("start the relay");
        let input = child.stdin.take().unwrap();
        let output = BufReader::new(child.stdout.take().unwrap()).lines();
        let mut session = Self {
            child,
            input,
            output,
            next_id: 0,
        };
        let initialized = session
            .request(
                "initialize",
                json!({
                    "protocolVersion": "2025-06-18",
                    "capabilities": {},
                    "clientInfo": {"name": "relay-test", "version": "1"},
                }),
            )
            .await;
        assert_eq!(
            initialized["serverInfo"]["name"], "devpulse-persona-mcp",
            "{initialized}"
        );
        session
            .send(&json!({"jsonrpc": "2.0", "method": "notifications/initialized"}))
            .await;
        session
    }

    async fn send(&mut self, frame: &Value) {
        self.input
            .write_all(format!("{frame}\n").as_bytes())
            .await
            .expect("send");
        self.input.flush().await.expect("flush");
    }

    async fn request(&mut self, method: &str, params: Value) -> Value {
        self.next_id += 1;
        let id = self.next_id;
        self.send(&json!({"jsonrpc": "2.0", "id": id, "method": method, "params": params}))
            .await;
        let line = tokio::time::timeout(WAIT, self.output.next_line())
            .await
            .expect("a reply in time")
            .unwrap()
            .expect("a reply");
        let reply: Value = serde_json::from_str(&line).unwrap();
        assert_eq!(reply["id"], id, "{reply}");
        reply["result"].clone()
    }

    async fn tool(&mut self, name: &str, arguments: Value) -> (Value, bool) {
        let result = self
            .request("tools/call", json!({"name": name, "arguments": arguments}))
            .await;
        (
            result["structuredContent"].clone(),
            result["isError"].as_bool().expect("isError"),
        )
    }

    async fn remember(&mut self, label: &str, body: &str) {
        let (data, failed) = self
            .tool(
                "persona.save",
                json!({
                    "scope": "project",
                    "label": label,
                    "body": body,
                    "idempotency_key": format!("{label}-{body}"),
                }),
            )
            .await;
        assert!(!failed, "{data}");
    }

    async fn project_bodies(&mut self) -> Vec<String> {
        let (data, failed) = self.tool("persona.load", json!({"scope": "project"})).await;
        assert!(!failed, "{data}");
        let mut bodies: Vec<String> = data["blocks"]
            .as_array()
            .unwrap()
            .iter()
            .map(|block| block["body"].as_str().unwrap().to_owned())
            .collect();
        bodies.sort();
        bodies
    }
}

async fn owner() -> (tempfile::TempDir, Bridge) {
    let dir = tempfile::tempdir().unwrap();
    let bridge = Bridge::start(open(&dir).await).unwrap();
    (dir, bridge)
}

async fn open(dir: &tempfile::TempDir) -> Arc<PersonaStore> {
    let database = Arc::new(
        TursoAdapter::open_with_schema(&dir.path().join("user.db"), "", TursoOptions::default())
            .await
            .unwrap(),
    );
    #[cfg(feature = "rro")]
    let store = PersonaStore::over(database, None).await.unwrap();
    #[cfg(not(feature = "rro"))]
    let store = PersonaStore::over(database).await.unwrap();
    store
}

async fn wait_for_exit(child: &mut Child) -> std::process::ExitStatus {
    tokio::time::timeout(WAIT, child.wait())
        .await
        .expect("the relay exits")
        .unwrap()
}

/// The failure the design exists to avoid: two sessions at once, each with its
/// own process, and neither can see the other's project.
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn two_real_sessions_run_at_once_each_in_its_project() {
    let (_dir, bridge) = owner().await;
    let (alpha_grant, beta_grant) = (bridge.grant("alpha"), bridge.grant("beta"));
    let address = bridge.address().to_owned();

    let alpha_address = address.clone();
    let alpha_token = alpha_grant.token().to_owned();
    let alpha = devpulse_telemetry::spawn(async move {
        let mut session = Session::start(&alpha_address, &alpha_token).await;
        for i in 0..10 {
            session.remember(&format!("a{i}"), "alpha fact").await;
        }
        session
    });
    let beta_token = beta_grant.token().to_owned();
    let beta = devpulse_telemetry::spawn(async move {
        let mut session = Session::start(&address, &beta_token).await;
        for i in 0..10 {
            session.remember(&format!("b{i}"), "beta fact").await;
        }
        session
    });
    let (mut alpha, mut beta) = (alpha.await.unwrap(), beta.await.unwrap());

    assert_eq!(alpha.project_bodies().await, vec!["alpha fact"; 10]);
    assert_eq!(beta.project_bodies().await, vec!["beta fact"; 10]);
    let (data, failed) = alpha
        .tool("persona.load", json!({"scope": "project", "slug": "beta"}))
        .await;
    assert!(failed, "alpha read beta: {data}");
    assert!(!data.to_string().contains("beta fact"), "{data}");
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_wrong_token_is_refused_and_the_child_says_so() {
    let (_dir, bridge) = owner().await;
    let _grant = bridge.grant("alpha");
    let output = tokio::time::timeout(WAIT, command(bridge.address(), "not-a-real-token").output())
        .await
        .expect("the relay exits")
        .unwrap();
    assert!(!output.status.success());
    assert!(output.stdout.is_empty(), "nothing on the protocol stream");
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(stderr.contains("did not recognize"), "{stderr}");
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_relay_with_no_owner_fails_visibly() {
    let (_dir, bridge) = owner().await;
    let address = bridge.address().to_owned();
    drop(bridge);
    tokio::time::sleep(Duration::from_millis(100)).await;
    let output = tokio::time::timeout(WAIT, command(&address, "any").output())
        .await
        .expect("the relay exits")
        .unwrap();
    assert!(!output.status.success());
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(stderr.contains("reach DevPulse's memory"), "{stderr}");
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn ending_a_session_closes_its_connection_and_its_token() {
    let (_dir, bridge) = owner().await;
    let grant = bridge.grant("alpha");
    let token = grant.token().to_owned();
    let mut session = Session::start(bridge.address(), &token).await;
    session.remember("fact", "kept").await;

    drop(grant);
    wait_for_exit(&mut session.child).await;

    let output = tokio::time::timeout(WAIT, command(bridge.address(), &token).output())
        .await
        .expect("the relay exits")
        .unwrap();
    assert!(!output.status.success(), "a revoked token still got in");

    // What it saved stays: ending a session is not forgetting.
    let next = bridge.grant("alpha");
    let mut later = Session::start(bridge.address(), next.token()).await;
    assert_eq!(later.project_bodies().await, ["kept"]);
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn a_session_dying_leaves_the_owner_serving() {
    let (_dir, bridge) = owner().await;
    let grant = bridge.grant("alpha");
    let mut first = Session::start(bridge.address(), grant.token()).await;
    first.remember("fact", "before").await;
    first.child.kill().await.unwrap();

    let mut second = Session::start(bridge.address(), grant.token()).await;
    second.remember("other", "after").await;
    assert_eq!(second.project_bodies().await, ["after", "before"]);
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn closing_stdin_ends_the_relay() {
    let (_dir, bridge) = owner().await;
    let grant = bridge.grant("alpha");
    let session = Session::start(bridge.address(), grant.token()).await;
    let Session {
        mut child, input, ..
    } = session;
    drop(input);
    let status = wait_for_exit(&mut child).await;
    assert!(status.success(), "{status}");
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn memory_survives_the_owner_restarting() {
    let dir = tempfile::tempdir().unwrap();
    {
        let bridge = Bridge::start(open(&dir).await).unwrap();
        let grant = bridge.grant("alpha");
        let mut session = Session::start(bridge.address(), grant.token()).await;
        session.remember("fact", "durable").await;
    }
    let bridge = Bridge::start(open(&dir).await).unwrap();
    let grant = bridge.grant("alpha");
    let mut session = Session::start(bridge.address(), grant.token()).await;
    assert_eq!(session.project_bodies().await, ["durable"]);
}
