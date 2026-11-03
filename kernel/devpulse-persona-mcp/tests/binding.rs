//! Connections to one store, through the protocol path sessions use: what a
//! session bound to a project can reach (plan 0001 B6.2), and several
//! connections sharing a store inside a database another owner holds open.

#![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

use std::sync::Arc;

use devpulse_clyffy::cortex::persistence::{TursoAdapter, TursoOptions};
use devpulse_persona_mcp::auth::AuthGate;
use devpulse_persona_mcp::{Binding, PersonaStore, Server};
use serde_json::{Value, json};
use tempfile::TempDir;
use tokio::io::{
    AsyncBufReadExt, AsyncWriteExt, BufReader, DuplexStream, Lines, ReadHalf, WriteHalf,
};

/// A client on one live connection, the server task behind it.
struct Client {
    to_server: WriteHalf<DuplexStream>,
    from_server: Lines<BufReader<ReadHalf<DuplexStream>>>,
    next_id: u64,
}

impl Client {
    async fn connect(store: &Arc<PersonaStore>, binding: Binding) -> Self {
        let (client, server_end) = tokio::io::duplex(64 * 1024);
        let server = Server::new(Arc::clone(store), AuthGate::offline()).bound(binding);
        devpulse_telemetry::spawn(async move {
            let (input, output) = tokio::io::split(server_end);
            server.serve(input, output).await.expect("serve");
        });
        let (from_server, to_server) = tokio::io::split(client);
        let mut this = Self {
            to_server,
            from_server: BufReader::new(from_server).lines(),
            next_id: 0,
        };
        this.request(
            "initialize",
            json!({
                "protocolVersion": "2025-06-18",
                "capabilities": {},
                "clientInfo": {"name": "test", "version": "1"},
            }),
        )
        .await;
        this.send(&json!({"jsonrpc": "2.0", "method": "notifications/initialized"}))
            .await;
        this
    }

    async fn send(&mut self, frame: &Value) {
        let line = format!("{frame}\n");
        self.to_server.write_all(line.as_bytes()).await.unwrap();
    }

    async fn request(&mut self, method: &str, params: Value) -> Value {
        self.next_id += 1;
        let id = self.next_id;
        self.send(&json!({"jsonrpc": "2.0", "id": id, "method": method, "params": params}))
            .await;
        let line = self
            .from_server
            .next_line()
            .await
            .unwrap()
            .expect("a reply");
        let reply: Value = serde_json::from_str(&line).unwrap();
        assert_eq!(reply["id"], id, "{reply}");
        reply["result"].clone()
    }

    /// A tool's outcome: its structured content, and whether it failed.
    async fn tool(&mut self, name: &str, arguments: Value) -> (Value, bool) {
        let result = self
            .request("tools/call", json!({"name": name, "arguments": arguments}))
            .await;
        (
            result["structuredContent"].clone(),
            result["isError"].as_bool().expect("isError"),
        )
    }

    async fn save(&mut self, scope: &str, slug: Option<&str>, label: &str, body: &str) -> bool {
        let key = format!("{scope}-{slug:?}-{label}-{body}");
        let (_, failed) = self
            .tool(
                "persona.save",
                json!({
                    "scope": scope,
                    "slug": slug,
                    "label": label,
                    "body": body,
                    "idempotency_key": key,
                }),
            )
            .await;
        failed
    }

    async fn bodies(&mut self, scope: &str, slug: Option<&str>) -> Vec<String> {
        let (data, failed) = self
            .tool("persona.load", json!({"scope": scope, "slug": slug}))
            .await;
        assert!(!failed, "{data}");
        data["blocks"]
            .as_array()
            .unwrap()
            .iter()
            .map(|block| block["body"].as_str().unwrap().to_owned())
            .collect()
    }
}

/// A store inside a database with its owner's own table in it.
async fn store_in_a_host_database() -> (TempDir, Arc<TursoAdapter>, Arc<PersonaStore>) {
    let dir = tempfile::tempdir().unwrap();
    let database = Arc::new(
        TursoAdapter::open_with_schema(
            &dir.path().join("user.db"),
            "CREATE TABLE IF NOT EXISTS host_table (id INTEGER PRIMARY KEY);",
            TursoOptions::default(),
        )
        .await
        .unwrap(),
    );
    #[cfg(feature = "rro")]
    let store = PersonaStore::over(Arc::clone(&database), None)
        .await
        .unwrap();
    #[cfg(not(feature = "rro"))]
    let store = PersonaStore::over(Arc::clone(&database)).await.unwrap();
    (dir, database, store)
}

fn project(slug: &str) -> Binding {
    Binding::Project(slug.to_owned())
}

#[tokio::test]
async fn a_bound_session_cannot_reach_another_project_on_any_tool() {
    let (_dir, _database, store) = store_in_a_host_database().await;
    let mut you = Client::connect(&store, Binding::Unbound).await;
    assert!(
        !you.save("project", Some("beta"), "facts", "beta secret")
            .await
    );

    let mut session = Client::connect(&store, project("alpha")).await;
    for (tool, arguments) in [
        ("persona.load", json!({"scope": "project", "slug": "beta"})),
        (
            "persona.list",
            json!({"scope": "project", "slug": "beta", "limit": 10}),
        ),
        (
            "persona.recall",
            json!({"scope": "project", "slug": "beta", "query": "secret"}),
        ),
        (
            "persona.save",
            json!({
                "scope": "project",
                "slug": "beta",
                "label": "facts",
                "body": "overwritten",
                "idempotency_key": "k1",
            }),
        ),
    ] {
        let (data, failed) = session.tool(tool, arguments).await;
        assert!(failed, "{tool} reached another project: {data}");
        assert!(!data.to_string().contains("beta secret"), "{tool}: {data}");
        assert_eq!(data["error"]["data"]["kind"], "auth", "{tool}: {data}");
    }
    assert_eq!(
        you.bodies("project", Some("beta")).await,
        ["beta secret"],
        "the other project is untouched"
    );
}

#[tokio::test]
async fn a_bound_session_defaults_to_its_project_and_reads_your_blocks() {
    let (_dir, _database, store) = store_in_a_host_database().await;
    let mut you = Client::connect(&store, Binding::Unbound).await;
    assert!(!you.save("user", None, "human", "you prefer Rust").await);

    let mut session = Client::connect(&store, project("alpha")).await;
    assert_eq!(session.bodies("user", None).await, ["you prefer Rust"]);

    // It names no project, and its write lands in its own.
    assert!(!session.save("project", None, "facts", "alpha fact").await);
    assert_eq!(
        you.bodies("project", Some("alpha")).await,
        ["alpha fact"],
        "saved under the bound project"
    );
    assert_eq!(session.bodies("project", None).await, ["alpha fact"]);
    assert_eq!(
        session.bodies("project", Some("alpha")).await,
        ["alpha fact"]
    );
}

#[tokio::test]
async fn a_bound_session_cannot_change_your_own_blocks() {
    let (_dir, _database, store) = store_in_a_host_database().await;
    let mut you = Client::connect(&store, Binding::Unbound).await;
    assert!(!you.save("user", None, "human", "yours").await);

    let mut session = Client::connect(&store, project("alpha")).await;
    let (data, failed) = session
        .tool(
            "persona.save",
            json!({
                "scope": "user",
                "label": "human",
                "body": "changed by an agent",
                "idempotency_key": "k2",
            }),
        )
        .await;
    assert!(failed, "{data}");
    assert_eq!(data["error"]["data"]["kind"], "auth", "{data}");
    assert_eq!(you.bodies("user", None).await, ["yours"]);
}

#[tokio::test]
async fn connections_share_one_store_at_the_same_time() {
    let (_dir, database, store) = store_in_a_host_database().await;
    let mut alpha = Client::connect(&store, project("alpha")).await;
    let mut beta = Client::connect(&store, project("beta")).await;

    let (a, b) = tokio::join!(
        async {
            for i in 0..20 {
                assert!(!alpha.save("project", None, &format!("a{i}"), "a").await);
            }
            alpha
        },
        async {
            for i in 0..20 {
                assert!(!beta.save("project", None, &format!("b{i}"), "b").await);
            }
            beta
        },
    );
    let (mut alpha, mut beta) = (a, b);
    assert_eq!(alpha.bodies("project", None).await.len(), 20);
    assert_eq!(beta.bodies("project", None).await.len(), 20);

    // The owner still uses its own database alongside them.
    let connection = database.connect().unwrap();
    connection
        .execute("INSERT INTO host_table (id) VALUES (1)", ())
        .await
        .unwrap();
}

#[tokio::test]
async fn memory_outlives_its_store_inside_the_host_database() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("user.db");
    {
        let database = Arc::new(
            TursoAdapter::open_with_schema(&path, "", TursoOptions::default())
                .await
                .unwrap(),
        );
        #[cfg(feature = "rro")]
        let store = PersonaStore::over(database, None).await.unwrap();
        #[cfg(not(feature = "rro"))]
        let store = PersonaStore::over(database).await.unwrap();
        let mut you = Client::connect(&store, Binding::Unbound).await;
        assert!(!you.save("user", None, "human", "kept").await);
    }
    let database = Arc::new(
        TursoAdapter::open_with_schema(&path, "", TursoOptions::default())
            .await
            .unwrap(),
    );
    #[cfg(feature = "rro")]
    let store = PersonaStore::over(database, None).await.unwrap();
    #[cfg(not(feature = "rro"))]
    let store = PersonaStore::over(database).await.unwrap();
    let mut you = Client::connect(&store, Binding::Unbound).await;
    assert_eq!(you.bodies("user", None).await, ["kept"]);
}
