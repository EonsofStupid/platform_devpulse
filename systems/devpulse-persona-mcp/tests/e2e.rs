//! End-to-end smoke tests for the persona MCP crate.
//!
//! Each test exercises the [`PersonaStore`] + verb-handler stack end
//! to end against a fresh tempfile LibSQL database. JSON-RPC framing
//! is covered by the dispatch shape — the handler outputs and error
//! envelopes are validated by deserialising them back into the wire
//! shape.

use devpulse_persona_mcp::store::{PersonaScope, PersonaStore};
use devpulse_persona_mcp::verbs::persona::{
    list, load, recall, save, PersonaListArgs, PersonaLoadArgs, PersonaRecallArgs, PersonaSaveArgs,
};
use std::sync::Arc;
use tempfile::tempdir;

async fn fresh_store() -> Arc<PersonaStore> {
    let dir = tempdir().expect("tempdir");
    let path = dir.path().join("persona-test.libsql");
    // Leak the tempdir so the file stays alive for the test's
    // lifetime — dropping `dir` would delete the directory mid-test.
    Box::leak(Box::new(dir));
    #[cfg(feature = "rro")]
    {
        PersonaStore::open(&path, None)
            .await
            .expect("open persona store")
    }
    #[cfg(not(feature = "rro"))]
    {
        PersonaStore::open(&path).await.expect("open persona store")
    }
}

#[tokio::test]
async fn persona_save_load_roundtrip_user_scope() {
    let store = fresh_store().await;

    let saved = save(
        &store,
        PersonaSaveArgs {
            scope: "user".to_string(),
            slug: None,
            label: "persona".to_string(),
            body: "Clyffy is the orchestrator persona.".to_string(),
            idempotency_key: "01HPQ-A-0001".to_string(),
        },
    )
    .await
    .expect("save");
    assert_eq!(saved.version, 1);
    assert!(saved.conflict.is_none());

    let loaded = load(
        &store,
        PersonaLoadArgs {
            scope: "user".to_string(),
            slug: None,
        },
    )
    .await
    .expect("load");

    assert_eq!(loaded.blocks.len(), 1);
    let only = &loaded.blocks[0];
    assert_eq!(only.label, "persona");
    assert_eq!(only.body, "Clyffy is the orchestrator persona.");
    assert_eq!(only.scope, PersonaScope::User);
    assert_eq!(only.slug, None);
    assert_eq!(only.version, 1);
}

#[tokio::test]
async fn persona_save_idempotency_returns_cached_response() {
    let store = fresh_store().await;
    let key = "01HPQ-A-IDEMP".to_string();

    let first = save(
        &store,
        PersonaSaveArgs {
            scope: "user".to_string(),
            slug: None,
            label: "persona".to_string(),
            body: "first body".to_string(),
            idempotency_key: key.clone(),
        },
    )
    .await
    .expect("first save");

    let second = save(
        &store,
        PersonaSaveArgs {
            scope: "user".to_string(),
            slug: None,
            label: "persona".to_string(),
            // Different body — spec: idempotency returns the *original*
            // cached response regardless. Caller's bug if keys collide.
            body: "second body".to_string(),
            idempotency_key: key,
        },
    )
    .await
    .expect("second save");

    assert_eq!(first.id, second.id);
    assert_eq!(first.version, second.version);

    // The block on disk must still be the FIRST body because save was
    // short-circuited by idempotency. (No row update happened on call #2.)
    let loaded = load(
        &store,
        PersonaLoadArgs {
            scope: "user".to_string(),
            slug: None,
        },
    )
    .await
    .expect("load");
    assert_eq!(loaded.blocks[0].body, "first body");
}

#[tokio::test]
async fn persona_save_bumps_version_on_update() {
    let store = fresh_store().await;

    let v1 = save(
        &store,
        PersonaSaveArgs {
            scope: "user".to_string(),
            slug: None,
            label: "persona".to_string(),
            body: "v1".to_string(),
            idempotency_key: "01HPQ-A-V1".to_string(),
        },
    )
    .await
    .expect("v1");
    assert_eq!(v1.version, 1);

    let v2 = save(
        &store,
        PersonaSaveArgs {
            scope: "user".to_string(),
            slug: None,
            label: "persona".to_string(),
            body: "v2".to_string(),
            idempotency_key: "01HPQ-A-V2".to_string(),
        },
    )
    .await
    .expect("v2");
    assert_eq!(v2.version, 2);
    assert_eq!(v1.id, v2.id, "id stable across updates");
}

#[tokio::test]
async fn persona_project_scope_requires_slug() {
    let store = fresh_store().await;

    let err = save(
        &store,
        PersonaSaveArgs {
            scope: "project".to_string(),
            slug: None,
            label: "goals".to_string(),
            body: "ship Slice 1".to_string(),
            idempotency_key: "01HPQ-B-0001".to_string(),
        },
    )
    .await
    .expect_err("project scope without slug must fail");

    let env = err.into_envelope();
    assert_eq!(
        env.data.kind,
        devpulse_persona_mcp::error::ErrorKind::InvalidArg
    );
}

#[tokio::test]
async fn persona_user_scope_rejects_slug() {
    let store = fresh_store().await;

    let err = save(
        &store,
        PersonaSaveArgs {
            scope: "user".to_string(),
            slug: Some("devpulse".to_string()),
            label: "persona".to_string(),
            body: "x".to_string(),
            idempotency_key: "01HPQ-C-0001".to_string(),
        },
    )
    .await
    .expect_err("user scope with slug must fail");

    let env = err.into_envelope();
    assert_eq!(
        env.data.kind,
        devpulse_persona_mcp::error::ErrorKind::InvalidArg
    );
}

#[tokio::test]
async fn persona_list_orders_by_updated_at_desc() {
    let store = fresh_store().await;
    let labels = ["persona", "human", "pinned"];
    for (i, lab) in labels.iter().enumerate() {
        save(
            &store,
            PersonaSaveArgs {
                scope: "user".to_string(),
                slug: None,
                label: (*lab).to_string(),
                body: format!("body {i}"),
                idempotency_key: format!("01HPQ-D-{i:04}"),
            },
        )
        .await
        .expect("save");
        // Avoid same-millisecond timestamps so ORDER BY is deterministic.
        tokio::time::sleep(std::time::Duration::from_millis(5)).await;
    }

    let listed = list(
        &store,
        PersonaListArgs {
            scope: "user".to_string(),
            slug: None,
            kind: None,
            since: None,
            limit: 100,
        },
    )
    .await
    .expect("list");

    assert_eq!(listed.items.len(), 3);
    let labels_observed: Vec<&str> = listed.items.iter().map(|b| b.label.as_str()).collect();
    assert_eq!(labels_observed, vec!["pinned", "human", "persona"]);
}

#[tokio::test]
async fn persona_recall_cos_like_match() {
    let store = fresh_store().await;
    save(
        &store,
        PersonaSaveArgs {
            scope: "user".to_string(),
            slug: None,
            label: "persona".to_string(),
            body: "Clyffy orchestrator persona for DevPulse platform.".to_string(),
            idempotency_key: "01HPQ-E-0001".to_string(),
        },
    )
    .await
    .expect("save");
    save(
        &store,
        PersonaSaveArgs {
            scope: "user".to_string(),
            slug: None,
            label: "human".to_string(),
            body: "The user prefers direct execution.".to_string(),
            idempotency_key: "01HPQ-E-0002".to_string(),
        },
    )
    .await
    .expect("save");

    let hits = recall(
        &store,
        PersonaRecallArgs {
            scope: "user".to_string(),
            slug: None,
            query: "orchestrator".to_string(),
            top_k: 10,
            kinds: None,
            mode: "cos".to_string(),
        },
    )
    .await
    .expect("recall");

    assert_eq!(hits.hits.len(), 1);
    assert_eq!(hits.hits[0].kind, "persona");
}

#[tokio::test]
async fn persona_recall_bfs_mode_invalid_until_slice_5() {
    let store = fresh_store().await;
    let err = recall(
        &store,
        PersonaRecallArgs {
            scope: "user".to_string(),
            slug: None,
            query: "x".to_string(),
            top_k: 10,
            kinds: None,
            mode: "bfs".to_string(),
        },
    )
    .await
    .expect_err("bfs must error until Slice 5");

    let env = err.into_envelope();
    assert_eq!(
        env.data.kind,
        devpulse_persona_mcp::error::ErrorKind::InvalidArg
    );
    assert!(env.message.contains("Slice 5"));
}
