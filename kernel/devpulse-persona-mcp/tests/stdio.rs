//! Exercise the restored executable through its actual stdio process boundary.

#![allow(clippy::expect_used, reason = "test assertions")]

use serde_json::{json, Value};
use std::path::Path;
use std::process::Stdio;
use std::time::Duration;
use tempfile::tempdir;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;

async fn run(database: Option<&Path>, frames: &[Value]) -> std::process::Output {
    let mut command = Command::new(env!("CARGO_BIN_EXE_devpulse-persona-mcp"));
    command
        .env_remove("DEVPULSE_PERSONA_DB")
        .env("CLYFFY_OFFLINE", "true")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);
    if let Some(database) = database {
        command.env("DEVPULSE_PERSONA_DB", database);
    }
    #[cfg(windows)]
    command.creation_flags(0x0800_0000);
    let mut child = command.spawn().expect("spawn restored service");
    let mut input = child.stdin.take().expect("stdin");
    for frame in frames {
        input
            .write_all(format!("{frame}\n").as_bytes())
            .await
            .expect("send frame");
    }
    drop(input);
    tokio::time::timeout(Duration::from_secs(30), child.wait_with_output())
        .await
        .expect("service exits after EOF")
        .expect("wait for service")
}

fn initialize() -> Value {
    json!({"jsonrpc":"2.0","id":1,"method":"initialize","params":{
        "protocolVersion":"2025-06-18","capabilities":{},
        "clientInfo":{"name":"restoration-test","version":"1"}
    }})
}

#[tokio::test]
async fn subprocess_handshake_save_load_and_restart() {
    let directory = tempdir().expect("test directory");
    let database = directory.path().join("memory.db");
    let frames = [
        initialize(),
        json!({"jsonrpc":"2.0","method":"notifications/initialized"}),
        json!({"jsonrpc":"2.0","id":2,"method":"tools/list"}),
        json!({"jsonrpc":"2.0","id":3,"method":"tools/call","params":{
            "name":"persona.save","arguments":{"scope":"user","label":"human","body":"Preserve my planning.","idempotency_key":"stdio-retry"}
        }}),
        json!({"jsonrpc":"2.0","id":4,"method":"tools/call","params":{
            "name":"persona.load","arguments":{"scope":"user"}
        }}),
        json!({"jsonrpc":"2.0","id":5,"method":"tools/call","params":{
            "name":"persona.save","arguments":{"scope":"project","label":"goals","body":"invalid scope","idempotency_key":"invalid"}
        }}),
    ];
    for _ in 0..2 {
        let output = run(Some(&database), &frames).await;
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        let responses: Vec<Value> = String::from_utf8(output.stdout)
            .expect("UTF-8 stdout")
            .lines()
            .map(|line| serde_json::from_str(line).expect("stdout contains only JSON-RPC"))
            .collect();
        assert_eq!(responses.len(), 5, "notifications produce no response");
        assert_eq!(
            responses[0]["result"]["serverInfo"]["name"],
            "devpulse-persona-mcp"
        );
        assert_eq!(
            responses[1]["result"]["tools"]
                .as_array()
                .expect("tools")
                .len(),
            4
        );
        assert_eq!(responses[2]["result"]["structuredContent"]["version"], 1);
        assert_eq!(responses[2]["result"]["content"][0]["type"], "text");
        assert_eq!(responses[2]["result"]["isError"], false);
        assert_eq!(
            responses[3]["result"]["structuredContent"]["blocks"][0]["body"],
            "Preserve my planning."
        );
        assert_eq!(responses[4]["result"]["isError"], true);
        assert_eq!(
            responses[4]["result"]["structuredContent"]["error"]["data"]["kind"],
            "invalid_arg"
        );
    }
}

#[tokio::test]
async fn missing_or_relative_database_configuration_fails_explicitly() {
    for configured in [None, Some(Path::new("relative.db"))] {
        let output = run(configured, &[]).await;
        assert!(!output.status.success());
        assert!(output.stdout.is_empty());
        assert!(String::from_utf8_lossy(&output.stderr).contains("DEVPULSE_PERSONA_DB"));
    }
}

#[tokio::test]
async fn invalid_frames_and_notifications_cannot_write_memory() {
    let directory = tempdir().expect("test directory");
    let database = directory.path().join("memory.db");
    let arguments = json!({"scope":"user","label":"human","body":"must not persist","idempotency_key":"invalid-write"});
    let frames = [
        json!({"jsonrpc":"2.0","id":0,"method":"tools/call","params":{"name":"persona.save","arguments":arguments}}),
        initialize(),
        json!({"jsonrpc":"2.0","method":"notifications/initialized"}),
        json!({"jsonrpc":"1.0","id":2,"method":"tools/call","params":{"name":"persona.save","arguments":arguments}}),
        json!({"jsonrpc":"2.0","method":"tools/call","params":{"name":"persona.save","arguments":arguments}}),
        json!({"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"persona.load","arguments":{"scope":"user"}}}),
    ];
    let output = run(Some(&database), &frames).await;
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let responses: Vec<Value> = String::from_utf8(output.stdout)
        .expect("stdout")
        .lines()
        .map(|line| serde_json::from_str(line).expect("response JSON"))
        .collect();
    assert_eq!(responses.len(), 4);
    assert_eq!(responses[0]["error"]["code"], -32600);
    assert_eq!(responses[2]["error"]["code"], -32600);
    assert_eq!(
        responses[3]["result"]["structuredContent"]["blocks"],
        json!([])
    );
}
