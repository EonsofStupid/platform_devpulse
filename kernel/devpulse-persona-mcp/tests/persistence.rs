//! Behavioral checks for durable, concurrent persona memory operations.

#![allow(clippy::expect_used, reason = "test assertions")]

use devpulse_persona_mcp::PersonaError;
use devpulse_persona_mcp::store::{PersonaScope, PersonaStore};
use devpulse_persona_mcp::verbs::persona::{PersonaSaveArgs, save};
use std::path::Path;
use std::sync::Arc;
use tempfile::{TempDir, tempdir};

struct Fixture {
    store: Arc<PersonaStore>,
    directory: TempDir,
}

async fn open(path: &Path) -> Arc<PersonaStore> {
    #[cfg(feature = "rro")]
    let result = PersonaStore::open(path, None).await;
    #[cfg(not(feature = "rro"))]
    let result = PersonaStore::open(path).await;
    result.expect("open test database")
}

async fn fixture() -> Fixture {
    let directory = tempdir().expect("temporary directory");
    let store = open(&directory.path().join("memory.db")).await;
    Fixture { store, directory }
}

fn args(key: &str, body: &str) -> PersonaSaveArgs {
    PersonaSaveArgs {
        scope: "user".into(),
        slug: None,
        label: "persona".into(),
        body: body.into(),
        idempotency_key: key.into(),
    }
}

#[tokio::test]
async fn simultaneous_retries_write_once() {
    let test = fixture().await;
    let (a, b, c) = tokio::join!(
        save(&test.store, args("same", "first")),
        save(&test.store, args("same", "first")),
        save(&test.store, args("same", "first")),
    );
    let a = a.expect("first retry");
    for result in [b, c] {
        let result = result.expect("concurrent retry");
        assert_eq!(result.id, a.id);
        assert_eq!(result.version, 1);
    }
    let blocks = test
        .store
        .load_blocks(PersonaScope::User, None)
        .await
        .expect("load");
    assert_eq!(blocks.len(), 1);
    assert_eq!(blocks[0].version, 1);
}

#[tokio::test]
async fn simultaneous_different_writes_under_one_key_save_exactly_one() {
    let test = fixture().await;
    let bodies = ["first", "second", "third"];
    let (a, b, c) = tokio::join!(
        save(&test.store, args("same", bodies[0])),
        save(&test.store, args("same", bodies[1])),
        save(&test.store, args("same", bodies[2])),
    );
    let outcomes = [a, b, c];
    let saved: Vec<usize> = (0..3).filter(|&i| outcomes[i].is_ok()).collect();
    assert_eq!(saved.len(), 1, "exactly one write wins: {outcomes:?}");
    for outcome in &outcomes {
        if let Err(error) = outcome {
            assert!(matches!(error, PersonaError::Conflict(_)), "{error}");
        }
    }
    let blocks = test
        .store
        .load_blocks(PersonaScope::User, None)
        .await
        .expect("load");
    assert_eq!(blocks.len(), 1);
    assert_eq!(blocks[0].version, 1);
    assert_eq!(blocks[0].body, bodies[saved[0]], "the winner's own body");
}

#[tokio::test]
async fn concurrent_distinct_writes_preserve_one_natural_key() {
    let test = fixture().await;
    let (a, b, c) = tokio::join!(
        save(&test.store, args("one", "first")),
        save(&test.store, args("two", "second")),
        save(&test.store, args("three", "third")),
    );
    let results = [
        a.expect("write one"),
        b.expect("write two"),
        c.expect("write three"),
    ];
    assert!(results.iter().all(|result| result.id == results[0].id));
    let mut versions: Vec<_> = results.iter().map(|result| result.version).collect();
    versions.sort_unstable();
    assert_eq!(versions, [1, 2, 3]);
    assert_eq!(
        test.store
            .load_blocks(PersonaScope::User, None)
            .await
            .expect("load")
            .len(),
        1
    );
}

#[tokio::test]
async fn limits_count_characters_and_honor_the_stored_limit() {
    let test = fixture().await;
    let unicode = "🧠".repeat(5000);
    save(&test.store, args("unicode", &unicode))
        .await
        .expect("5000 characters fit");
    test.store
        .conn()
        .expect("connection")
        .execute("UPDATE persona_blocks SET body = '', char_limit = 1", ())
        .await
        .expect("configure block limit");
    let before = save(&test.store, args("one-character", "é"))
        .await
        .expect("one character");
    assert!(save(&test.store, args("too-long", "éé")).await.is_err());
    let block = test
        .store
        .get_block(PersonaScope::User, None, "persona")
        .await
        .expect("read");
    assert_eq!(block.body, "é");
    assert_eq!(block.version, before.version);
}

#[tokio::test]
async fn idempotency_failure_rolls_back_the_block_write() {
    let test = fixture().await;
    test.store
        .conn()
        .expect("connection")
        .execute_batch(
            "DROP TABLE persona_idempotency;
         CREATE TABLE persona_idempotency (
             key TEXT PRIMARY KEY CHECK(key <> 'reject'), response_json TEXT NOT NULL,
             inserted_at TEXT NOT NULL, expires_at TEXT NOT NULL
         );",
        )
        .await
        .expect("inject durable result failure");
    assert!(
        save(&test.store, args("reject", "must roll back"))
            .await
            .is_err()
    );
    assert!(
        test.store
            .load_blocks(PersonaScope::User, None)
            .await
            .expect("read after rollback")
            .is_empty()
    );
    save(&test.store, args("accept", "works after rollback"))
        .await
        .expect("next write succeeds");
}

#[tokio::test]
async fn retries_survive_reopening_the_database() {
    let Fixture { store, directory } = fixture().await;
    let original = save(&store, args("persistent", "original"))
        .await
        .expect("save");
    drop(store);
    let reopened = open(&directory.path().join("memory.db")).await;
    let retry = save(&reopened, args("persistent", "original"))
        .await
        .expect("retry");
    assert_eq!(retry.id, original.id);
    assert_eq!(retry.version, original.version);
    let different = save(&reopened, args("persistent", "replacement"))
        .await
        .expect_err("a used key still refuses a different write after reopening");
    assert!(
        matches!(different, PersonaError::Conflict(_)),
        "{different}"
    );
    assert_eq!(
        reopened
            .get_block(PersonaScope::User, None, "persona")
            .await
            .expect("read")
            .body,
        "original"
    );
}

#[tokio::test]
async fn list_filters_do_not_cross_scopes_or_ignore_dates() {
    let test = fixture().await;
    for slug in ["project-a", "project-b"] {
        for label in ["goals", "facts"] {
            test.store
                .save_block(PersonaScope::Project, Some(slug), label, "memory")
                .await
                .expect("save project");
        }
    }
    test.store
        .save_block(PersonaScope::User, None, "goals", "user memory")
        .await
        .expect("save user");
    let selected = test
        .store
        .list_blocks(
            PersonaScope::Project,
            Some("project-a"),
            Some("goals"),
            None,
            100,
        )
        .await
        .expect("filter");
    assert_eq!(selected.len(), 1);
    assert_eq!(selected[0].slug.as_deref(), Some("project-a"));
    assert_eq!(selected[0].label, "goals");
    let future = chrono::Utc::now() + chrono::Duration::days(1);
    assert!(
        test.store
            .list_blocks(PersonaScope::User, None, Some("goals"), Some(future), 100)
            .await
            .expect("future filter")
            .is_empty()
    );
    assert_eq!(
        test.store
            .list_blocks(PersonaScope::Project, Some("project-a"), None, None, 1)
            .await
            .expect("limit")
            .len(),
        1
    );
}

#[tokio::test]
async fn warming_the_retry_cache_does_not_extend_its_durable_deadline() {
    let test = fixture().await;
    let now = chrono::Utc::now();
    let expiry = now + chrono::Duration::seconds(1);
    test.store.conn().expect("connection").execute(
        "INSERT INTO persona_idempotency (key, response_json, inserted_at, expires_at) VALUES (?1, ?2, ?3, ?4)",
        turso::params!["near-expiry", "{}", now.to_rfc3339(), expiry.to_rfc3339()],
    ).await.expect("insert a result near expiry");
    assert!(
        test.store
            .idempotency()
            .get("near-expiry")
            .await
            .expect("hydrate cache")
            .is_some()
    );
    let remaining = (expiry - chrono::Utc::now()).to_std().unwrap_or_default();
    tokio::time::sleep(remaining + std::time::Duration::from_millis(20)).await;
    assert!(
        test.store
            .idempotency()
            .get("near-expiry")
            .await
            .expect("expired lookup")
            .is_none()
    );
}
