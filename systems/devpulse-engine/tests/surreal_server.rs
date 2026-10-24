//! Every schema and query path the app uses, against upstream's Surreal
//! server build (plan 0007 Part S, S5) — on a throwaway store, before the
//! owner's store is ever opened by the server.
//!
//! Needs the build `cargo xtask fetch-surreal` installs; run with
//! `cargo test -p devpulse-engine --test surreal_server -- --ignored --nocapture`.

#![allow(
    clippy::expect_used,
    clippy::unwrap_used,
    clippy::cast_precision_loss,
    clippy::too_many_lines,
    reason = "test assertions, a stand-in embedding, one end-to-end walk"
)]

use std::path::PathBuf;
use std::sync::Arc;

use async_trait::async_trait;
use devpulse_clyffy::cortex::cag::traits::Embedder;
use devpulse_clyffy::cortex::intelligence::MEMORY_SCHEMA;
use devpulse_clyffy::cortex::persistence::surreal::client::REASONING_SCHEMA;
use devpulse_clyffy::cortex::persistence::surreal::{
    SurrealAdapter, SurrealConfig, SurrealLifecycle,
};
use devpulse_clyffy::cortex::suggest::SuggestionService;
use devpulse_engine::platform::services::graph::{
    GLOBAL_GRAPH_SCHEMA, SYSTEM_GRAPH_SCHEMA, USER_GRAPH_SCHEMA,
};
use devpulse_engine::platform::services::project_graph::PROJECT_GRAPH_SCHEMA;
use serde_json::json;

/// A stand-in embedder: the same 1024-number vector shape the real one gives.
struct FixedEmbedder;

#[async_trait]
impl Embedder for FixedEmbedder {
    fn dimension(&self) -> u32 {
        1024
    }

    async fn embed(&self, text: &str) -> anyhow::Result<Vec<f32>> {
        let seed = text.len() as f32;
        Ok((0..1024)
            .map(|i| ((i as f32 + seed) * 0.01).sin())
            .collect())
    }
}

fn installed_server() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../.userdata/global/runtimes/surreal/3.0.5")
        .join(format!("surreal{}", std::env::consts::EXE_SUFFIX))
}

#[tokio::test]
#[ignore = "needs the installed Surreal server build"]
async fn every_schema_and_query_path_works_on_the_server() {
    let binary = installed_server();
    assert!(binary.is_file(), "install it first: {}", binary.display());
    let dir = tempfile::tempdir().expect("temp");
    let port = std::net::TcpListener::bind(("127.0.0.1", 0))
        .unwrap()
        .local_addr()
        .unwrap()
        .port();
    let server = SurrealLifecycle::boot(SurrealConfig {
        binary,
        data_path: dir.path().join("store"),
        host: "127.0.0.1".into(),
        port,
        max_bumps: 20,
        log_level: "warn".into(),
        user: "root".into(),
        password: "test-password".into(),
    })
    .await
    .expect("the server starts");
    server.ping().await.expect("INFO FOR ROOT");
    assert!(
        server.version().is_some_and(|v| v.contains("3.0.5")),
        "{:?}",
        server.version()
    );
    assert_eq!(server.restarts(), 0);
    assert!(server.ready_since().is_some());

    // The three boot scopes, exactly as boot applies them.
    let adapter = Arc::new(
        SurrealAdapter::connect_with_ns(&server, "system", "engine", SYSTEM_GRAPH_SCHEMA)
            .await
            .expect("system schema"),
    );
    adapter
        .init_namespace("user", "profile", USER_GRAPH_SCHEMA)
        .await
        .expect("user schema");
    adapter
        .init_namespace("global", "knowledge", GLOBAL_GRAPH_SCHEMA)
        .await
        .expect("global schema");
    // The other schemas the code carries.
    adapter
        .init_namespace("project", "p_test", PROJECT_GRAPH_SCHEMA)
        .await
        .expect("project schema");
    adapter
        .init_namespace("projects", "demo", MEMORY_SCHEMA)
        .await
        .expect("memory schema");
    adapter
        .init_namespace("clyffy", "devpulse", REASONING_SCHEMA)
        .await
        .expect("reasoning schema");

    // Chat type-ahead suggestions: record, then recall (HNSW + record::id).
    let suggest = SuggestionService::new(
        Arc::new(FixedEmbedder),
        Arc::clone(&adapter),
        "user",
        "profile",
    );
    suggest
        .record_prompt(
            "it's a \"quoted\" prompt with a backslash \\ and a person:tobie",
            "default",
            true,
        )
        .await
        .expect("record a prompt");
    let found = suggest
        .query("it's a \"quoted\" prompt", "default", 3)
        .await
        .expect("recall");
    assert!(!found.is_empty(), "the prompt comes back");
    assert!(
        found[0].text.contains("person:tobie"),
        "the text round-trips exactly: {:?}",
        found[0].text
    );

    // kv, nodes and edges through a scoped handle.
    let system = adapter.scoped_handle("system", "engine");
    system.kv_set("greeting", b"hello").await.expect("kv set");
    assert_eq!(
        system.kv_get("greeting").await.expect("kv get").as_deref(),
        Some(&b"hello"[..])
    );
    assert!(system.kv_delete("greeting").await.expect("kv delete"));
    system.ping().await.expect("handle ping");

    let user = adapter.scoped_handle("user", "profile");
    // The fields governance writes for a thought (the table is SCHEMAFULL).
    user.create_node(
        "thought",
        "t-1",
        &json!({
            "content": "first",
            "rro_state": "idle",
            "depth": 0,
            "proximity": 0.5,
            "branch_id": "main",
            "project_id": "p-1"
        }),
    )
    .await
    .expect("create node");
    let thoughts = user
        .query("SELECT * FROM thought")
        .await
        .expect("read nodes");
    assert!(
        thoughts.to_string().contains("thought:`t-1`"),
        "record ids read as table:key — {thoughts}"
    );

    // Inspector reads the devtools use.
    let dbs = adapter
        .list_databases_in_ns("projects")
        .await
        .expect("databases");
    assert_eq!(dbs, vec!["demo".to_owned()]);
    assert_eq!(
        adapter
            .list_databases_in_ns("never_defined")
            .await
            .expect("an undefined namespace has none"),
        Vec::<String>::new()
    );
    assert_eq!(
        adapter
            .count_in_ns("projects", "demo", "memories")
            .await
            .expect("count"),
        0
    );

    server.shutdown().await.expect("stops");
}
