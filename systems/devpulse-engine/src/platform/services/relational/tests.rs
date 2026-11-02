//! Real Turso upgrade/reopen tests for `AgentHub` table ownership.
#![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

use super::*;
use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlValue};

const OWNERSHIP: &str =
    include_str!("../../../../migrations/user/0003_agenthub_thread_ownership.sql");

async fn old_database(path: &Path) -> TursoAdapter {
    let db = TursoAdapter::open_with_schema(path, USER_SCHEMA, TursoOptions::default())
        .await
        .unwrap();
    migrate(&db, &USER_STORE.migrations[..2]).await.unwrap();
    // Exact pre-rename definitions included by the migration for fresh DBs.
    db.execute_batch(OWNERSHIP.split("ALTER TABLE agent_threads").next().unwrap())
        .await
        .unwrap();
    db.execute_batch(
        r#"INSERT INTO projects (id, name, root_path) VALUES ('p', 'project', '/project');
        INSERT INTO sessions (id, project_id, title) VALUES ('a', 'p', 'agent'), ('r', 'p', 'room');
        INSERT INTO turns (id, session_id, project_id, role, content, sequence_num)
            VALUES ('t', 'a', 'p', 'assistant', 'keep my answer', 1);
        INSERT INTO agent_threads VALUES ('a', 'codex', 'native-session', 123);
        INSERT INTO room_threads VALUES ('r', 'council', '[{"seat":"author"}]', '{"author":"native-room"}', 456);"#,
    )
    .await
    .unwrap();
    db
}

async fn rows(db: &TursoAdapter, table: &str) -> Vec<Vec<SqlValue>> {
    db.query(&format!("SELECT * FROM {table}"), &[])
        .await
        .unwrap()
}

async fn assert_names(db: &TursoAdapter) {
    let names = db.query(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN \
        ('agent_threads', 'room_threads', 'agenthub_threads', 'agenthub_room_threads') ORDER BY name",
        &[],
    ).await.unwrap();
    assert_eq!(
        names,
        vec![
            vec!["agenthub_room_threads".into()],
            vec!["agenthub_threads".into()]
        ]
    );
}

#[tokio::test]
async fn upgrade_keeps_threads_tokens_seating_and_chat_records_across_reopen() {
    let tree = tempfile::tempdir().unwrap();
    let path = tree.path().join("user.db");
    let old = old_database(&path).await;
    let agents = rows(&old, "agent_threads").await;
    let rooms = rows(&old, "room_threads").await;
    let turns = rows(&old, "turns").await;
    let sessions = rows(&old, "sessions").await;
    old.close().await;
    drop(old);
    for _ in 0..2 {
        let store = RelationalService::boot(&path, USER_STORE, "test", TursoOptions::default())
            .await
            .unwrap();
        let db = store.adapter();
        assert_names(db).await;
        assert_eq!(rows(db, "agenthub_threads").await, agents);
        assert_eq!(rows(db, "agenthub_room_threads").await, rooms);
        assert_eq!(rows(db, "turns").await, turns);
        assert_eq!(rows(db, "sessions").await, sessions);
        assert_eq!(
            crate::platform::db::history(db).await.unwrap().len(),
            USER_STORE.migrations.len()
        );
        // FK clauses survive the actual rename, as do the referenced IDs.
        for table in ["agenthub_threads", "agenthub_room_threads"] {
            let keys = db
                .query(&format!("PRAGMA foreign_key_list({table})"), &[])
                .await
                .unwrap();
            assert!(
                keys.iter()
                    .any(|row| row.get(2).and_then(SqlValue::as_text) == Some("sessions"))
            );
        }
        db.close().await;
    }
}

#[tokio::test]
async fn fresh_install_and_reopen_have_only_prefixed_thread_tables() {
    let tree = tempfile::tempdir().unwrap();
    let path = tree.path().join("new.db");
    for _ in 0..2 {
        let store = RelationalService::boot(&path, USER_STORE, "test", TursoOptions::default())
            .await
            .unwrap();
        assert_names(store.adapter()).await;
        assert_eq!(
            rows(store.adapter(), "agenthub_threads").await,
            [] as [std::vec::Vec<devpulse_clyffy::cortex::persistence::SqlValue>; 0]
        );
        store.adapter().close().await;
    }
}

#[tokio::test]
async fn ai_connections_migrate_once_and_survive_reopen_with_existing_user_data() {
    let tree = tempfile::tempdir().unwrap();
    let path = tree.path().join("connections.db");
    let old = old_database(&path).await;
    migrate(&old, &USER_STORE.migrations[..3]).await.unwrap();
    let sessions = rows(&old, "sessions").await;
    old.close().await;
    drop(old);
    let store = RelationalService::boot(&path, USER_STORE, "test", TursoOptions::default())
        .await
        .unwrap();
    store.adapter().execute("INSERT INTO ai_connections (id, label, provider_id, endpoint, credential_ref) VALUES (?, ?, ?, ?, ?)",
        &["saved".into(), "My server".into(), "ollama".into(), "https://server.example/custom/v1".into(), "opaque-ref".into()]).await.unwrap();
    let connections = rows(store.adapter(), "ai_connections").await;
    store.adapter().close().await;
    drop(store);
    let reopened = RelationalService::boot(&path, USER_STORE, "test", TursoOptions::default())
        .await
        .unwrap();
    assert_eq!(
        rows(reopened.adapter(), "ai_connections").await,
        connections
    );
    assert_eq!(rows(reopened.adapter(), "sessions").await, sessions);
    assert_eq!(
        migrate(reopened.adapter(), USER_STORE.migrations)
            .await
            .unwrap(),
        0
    );
    reopened.adapter().close().await;
}

#[tokio::test]
async fn second_rename_failure_rolls_back_first_rename_and_migration_record() {
    let tree = tempfile::tempdir().unwrap();
    let db = old_database(&tree.path().join("conflict.db")).await;
    let agents = rows(&db, "agent_threads").await;
    let rooms = rows(&db, "room_threads").await;
    db.execute_batch(
        "CREATE TABLE agenthub_room_threads (sentinel TEXT); \
        INSERT INTO agenthub_room_threads VALUES ('keep conflict visible');",
    )
    .await
    .unwrap();
    assert!(migrate(&db, USER_STORE.migrations).await.is_err());
    assert_eq!(rows(&db, "agent_threads").await, agents);
    assert_eq!(rows(&db, "room_threads").await, rooms);
    assert_eq!(
        rows(&db, "agenthub_room_threads").await,
        vec![vec!["keep conflict visible".into()]]
    );
    assert_eq!(
        db.query(
            "SELECT 1 FROM sqlite_master WHERE name = 'agenthub_threads'",
            &[]
        )
        .await
        .unwrap(),
        [] as [std::vec::Vec<devpulse_clyffy::cortex::persistence::SqlValue>; 0]
    );
    assert_eq!(crate::platform::db::history(&db).await.unwrap().len(), 2);
    db.close().await;
}
