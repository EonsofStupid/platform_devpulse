//! Actual Turso persistence and loopback endpoint checks; no operator credentials.
#![allow(clippy::unwrap_used, clippy::expect_used, reason = "test assertions")]
use super::*;
use crate::{
    cortex::persistence::{TursoAdapter, TursoOptions},
    providers::ProviderId,
};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

const SCHEMA: &str = concat!(
    include_str!("../../../../../systems/devpulse-engine/migrations/user/0004_ai_connections.sql"),
    "CREATE TABLE sessions (id TEXT PRIMARY KEY);",
    include_str!(
        "../../../../../systems/devpulse-engine/migrations/user/0005_chat_endpoint_sessions.sql"
    )
);

#[derive(Default)]
struct Vault {
    keys: Mutex<BTreeMap<String, String>>,
    fail_write: std::sync::atomic::AtomicBool,
}
#[async_trait::async_trait]
impl CredentialStore for Vault {
    async fn read(&self, reference: &str) -> Result<Option<String>> {
        Ok(self.keys.lock().await.get(reference).cloned())
    }
    async fn write(&self, reference: &str, secret: String) -> Result<()> {
        ensure!(
            !self.fail_write.load(std::sync::atomic::Ordering::SeqCst),
            "fixture vault failure"
        );
        self.keys.lock().await.insert(reference.to_owned(), secret);
        Ok(())
    }
    async fn remove(&self, reference: &str) -> Result<()> {
        self.keys.lock().await.remove(reference);
        Ok(())
    }
}

async fn database(tree: &tempfile::TempDir) -> Arc<TursoAdapter> {
    Arc::new(
        TursoAdapter::open_with_schema(
            &tree.path().join("user.db"),
            SCHEMA,
            TursoOptions::default(),
        )
        .await
        .unwrap(),
    )
}
fn request(
    id: Option<String>,
    label: &str,
    endpoint: &str,
    credential: ConnectionCredential,
) -> SaveConnection {
    SaveConnection {
        id,
        label: label.into(),
        provider: ProviderId::Ollama,
        endpoint: endpoint.into(),
        credential,
    }
}

#[tokio::test]
async fn independent_connections_survive_restart_without_keys_or_readiness_in_public_state() {
    let tree = tempfile::tempdir().unwrap();
    let db = database(&tree).await;
    let vault = Arc::new(Vault::default());
    let connections = Connections::new(db.clone(), vault.clone());
    let first = connections
        .save(request(
            None,
            "First",
            "http://localhost:12401/v1",
            ConnectionCredential::Replace("first-secret".into()),
        ))
        .await
        .unwrap()
        .items
        .remove(0);
    let state = connections
        .save(request(
            None,
            "Second",
            "http://localhost:12402/v1",
            ConnectionCredential::Replace("second-secret".into()),
        ))
        .await
        .unwrap();
    assert_eq!(state.items.len(), 2);
    assert_eq!(vault.keys.lock().await.len(), 2);
    let rendered = serde_json::to_string(&state).unwrap();
    assert!(!rendered.contains("secret"));
    assert!(!rendered.contains("ai_connection_"));
    let rows = db.query("SELECT * FROM ai_connections", &[]).await.unwrap();
    assert!(!format!("{rows:?}").contains("secret"));
    connections.checks.lock().await.insert(
        first.id.clone(),
        Evidence {
            discovery: Some(ConnectionCheck {
                checked_at_ms: 42,
                models: vec![],
                error: None,
            }),
            text_test: None,
        },
    );
    drop(connections);
    db.close().await;
    drop(db);
    let db = Arc::new(
        TursoAdapter::open_with_schema(&tree.path().join("user.db"), "", TursoOptions::default())
            .await
            .unwrap(),
    );
    let restarted = Connections::new(db.clone(), vault.clone());
    let restored = restarted.state().await.unwrap();
    assert_eq!(restored.items.len(), 2);
    assert!(restored.items.iter().all(|c| c.check.is_none()));
    restarted.remove(&first.id).await.unwrap();
    assert_eq!(vault.keys.lock().await.len(), 1);
    assert_eq!(restarted.state().await.unwrap().items[0].label, "Second");
    db.close().await;
}

#[tokio::test]
async fn failed_vault_or_sql_write_keeps_old_configuration_and_key() {
    let tree = tempfile::tempdir().unwrap();
    let db = database(&tree).await;
    let vault = Arc::new(Vault::default());
    let connections = Connections::new(db.clone(), vault.clone());
    let saved = connections
        .save(request(
            None,
            "Original",
            "http://localhost:12403/v1",
            ConnectionCredential::Replace("original-secret".into()),
        ))
        .await
        .unwrap()
        .items
        .remove(0);
    vault
        .fail_write
        .store(true, std::sync::atomic::Ordering::SeqCst);
    assert!(
        connections
            .save(request(
                Some(saved.id.clone()),
                "Changed",
                &saved.endpoint,
                ConnectionCredential::Replace("new-secret".into())
            ))
            .await
            .is_err()
    );
    vault
        .fail_write
        .store(false, std::sync::atomic::Ordering::SeqCst);
    // Make the actual SQL mutation fail after writing the replacement key.
    db.execute_batch("ALTER TABLE ai_connections RENAME TO saved_connections; CREATE VIEW ai_connections AS SELECT * FROM saved_connections;").await.unwrap();
    assert!(
        connections
            .save(request(
                Some(saved.id.clone()),
                "Changed",
                &saved.endpoint,
                ConnectionCredential::Replace("new-secret".into())
            ))
            .await
            .is_err()
    );
    assert_eq!(
        connections.state().await.unwrap().items[0].label,
        "Original"
    );
    let keys = vault.keys.lock().await;
    assert_eq!(keys.len(), 1);
    assert_eq!(keys.values().next().unwrap(), "original-secret");
    db.close().await;
}

#[tokio::test]
async fn checking_uses_saved_url_and_key_and_edits_clear_evidence() {
    let tree = tempfile::tempdir().unwrap();
    let db = database(&tree).await;
    let vault = Arc::new(Vault::default());
    let connections = Connections::new(db.clone(), vault.clone());
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let endpoint = format!("http://{}/custom/v9", listener.local_addr().unwrap());
    let server = devpulse_telemetry::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut request = vec![];
        let mut buffer = [0; 2048];
        while !request.windows(4).any(|w| w == b"\r\n\r\n") {
            let count = socket.read(&mut buffer).await.unwrap();
            assert!(count > 0);
            request.extend_from_slice(&buffer[..count]);
        }
        let request = String::from_utf8(request).unwrap().to_ascii_lowercase();
        assert!(request.starts_with("get /custom/v9/models "));
        assert!(request.contains("authorization: bearer independent-secret"));
        let body = r#"{"data":[{"id":"my-model"}]}"#;
        socket
            .write_all(
                format!(
                    "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                    body.len()
                )
                .as_bytes(),
            )
            .await
            .unwrap();
    });
    let saved = connections
        .save(request(
            None,
            "Local or remote",
            &endpoint,
            ConnectionCredential::Replace("independent-secret".into()),
        ))
        .await
        .unwrap()
        .items
        .remove(0);
    let checked = connections
        .check(&saved.id)
        .await
        .unwrap()
        .items
        .remove(0)
        .check
        .unwrap();
    assert!(checked.error.is_none());
    assert_eq!(checked.models[0].id, "my-model");
    server.await.unwrap();
    let edited = connections
        .save(request(
            Some(saved.id.clone()),
            "Renamed",
            "http://localhost:12404/v1",
            ConnectionCredential::Keep,
        ))
        .await
        .unwrap();
    assert!(edited.items[0].check.is_none());
    connections
        .save(request(
            Some(saved.id),
            "Renamed",
            &endpoint,
            ConnectionCredential::Clear,
        ))
        .await
        .unwrap();
    assert!(vault.keys.lock().await.is_empty());
    db.close().await;
}

#[tokio::test]
async fn replacement_discards_only_the_old_key_and_missing_key_fails_closed() {
    let tree = tempfile::tempdir().unwrap();
    let db = database(&tree).await;
    let vault = Arc::new(Vault::default());
    let connections = Connections::new(db.clone(), vault.clone());
    let saved = connections
        .save(request(
            None,
            "Server",
            "http://localhost:12401/v1",
            ConnectionCredential::Replace("old-secret".into()),
        ))
        .await
        .unwrap()
        .items
        .remove(0);
    connections
        .save(request(
            Some(saved.id.clone()),
            "Server",
            &saved.endpoint,
            ConnectionCredential::Replace("replacement-secret".into()),
        ))
        .await
        .unwrap();
    {
        let mut keys = vault.keys.lock().await;
        assert_eq!(keys.len(), 1);
        assert_eq!(keys.values().next().unwrap(), "replacement-secret");
        keys.clear();
    }
    let check = connections
        .check(&saved.id)
        .await
        .unwrap()
        .items
        .remove(0)
        .check
        .unwrap();
    assert_eq!(
        check.error.as_deref(),
        Some("The saved key is missing; enter it again")
    );
    assert_eq!(check.models, []);
    db.close().await;
}

#[tokio::test]
async fn invalid_configuration_is_rejected_before_any_key_is_written() {
    let tree = tempfile::tempdir().unwrap();
    let db = database(&tree).await;
    let vault = Arc::new(Vault::default());
    let connections = Connections::new(db.clone(), vault.clone());
    for (label, endpoint) in [
        ("", "http://localhost/v1"),
        ("X", "https://user:secret@server/v1"),
        ("X", "file:///secret"),
    ] {
        assert!(
            connections
                .save(request(
                    None,
                    label,
                    endpoint,
                    ConnectionCredential::Replace("secret".into())
                ))
                .await
                .is_err()
        );
    }
    assert!(vault.keys.lock().await.is_empty());
    assert_eq!(connections.state().await.unwrap().items, []);
    db.close().await;
}

/// Answer one text test, checking the request it was sent.
async fn answer_one_text_test(listener: tokio::net::TcpListener) {
    let (mut socket, _) = listener.accept().await.unwrap();
    let mut bytes = Vec::new();
    let mut buffer = [0; 4096];
    let headers = loop {
        let n = socket.read(&mut buffer).await.unwrap();
        assert!(n > 0);
        bytes.extend_from_slice(&buffer[..n]);
        if let Some(end) = bytes.windows(4).position(|w| w == b"\r\n\r\n") {
            let headers = String::from_utf8(bytes[..end].to_vec()).unwrap();
            let length: usize = headers
                .lines()
                .find_map(|line| {
                    line.to_ascii_lowercase()
                        .strip_prefix("content-length:")
                        .map(|n| n.trim().parse().unwrap())
                })
                .unwrap();
            if bytes.len() >= end + 4 + length {
                let body: serde_json::Value = serde_json::from_slice(&bytes[end + 4..]).unwrap();
                assert_eq!(body["model"], "selected-model");
                assert_eq!(body["messages"][0]["content"], "Visible question");
                break headers.to_ascii_lowercase();
            }
        }
    };
    assert!(headers.starts_with("post /custom/v1/chat/completions "));
    assert!(headers.contains("authorization: bearer this-connection-key"));
    let body =
        r#"{"choices":[{"index":0,"message":{"content":"Actual answer"},"finish_reason":"stop"}]}"#;
    socket
        .write_all(
            format!(
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                body.len()
            )
            .as_bytes(),
        )
        .await
        .unwrap();
}

#[tokio::test]
async fn saved_text_test_uses_its_key_records_failure_and_edits_clear_the_answer() {
    let tree = tempfile::tempdir().unwrap();
    let db = database(&tree).await;
    let vault = Arc::new(Vault::default());
    let connections = Connections::new(db.clone(), vault.clone());
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let endpoint = format!("http://{}/custom/v1", listener.local_addr().unwrap());
    let server = devpulse_telemetry::spawn(answer_one_text_test(listener));
    let saved = connections
        .save(request(
            None,
            "Target",
            &endpoint,
            ConnectionCredential::Replace("this-connection-key".into()),
        ))
        .await
        .unwrap()
        .items
        .remove(0);
    let state = connections
        .test_text(&saved.id, "selected-model", "Visible question")
        .await
        .unwrap();
    server.await.unwrap();
    assert!(state.items[0].check.is_none());
    assert_eq!(
        state.items[0]
            .text_test
            .as_ref()
            .unwrap()
            .answer
            .as_ref()
            .unwrap()
            .text,
        "Actual answer"
    );
    assert!(
        !serde_json::to_string(&state)
            .unwrap()
            .contains("this-connection-key")
    );
    vault.keys.lock().await.clear();
    let failed = connections
        .test_text(&saved.id, "selected-model", "Visible question")
        .await
        .unwrap();
    assert!(failed.items[0].text_test.as_ref().unwrap().answer.is_none());
    assert!(
        failed.items[0]
            .text_test
            .as_ref()
            .unwrap()
            .error
            .as_ref()
            .unwrap()
            .contains("saved key is missing")
    );
    let edited = connections
        .save(request(
            Some(saved.id),
            "Renamed",
            &endpoint,
            ConnectionCredential::Clear,
        ))
        .await
        .unwrap();
    assert!(edited.items[0].text_test.is_none());
    db.close().await;
}

#[tokio::test]
async fn unsupported_protocol_is_not_guessed_from_its_model_list() {
    let tree = tempfile::tempdir().unwrap();
    let db = database(&tree).await;
    let connections = Connections::new(db.clone(), Arc::new(Vault::default()));
    let mut save = request(
        None,
        "Native API",
        "http://localhost:12400/v1",
        ConnectionCredential::Keep,
    );
    save.provider = ProviderId::AnthropicApi;
    let saved = connections.save(save).await.unwrap().items.remove(0);
    let error = connections
        .test_text(&saved.id, "model", "Question")
        .await
        .unwrap_err();
    assert!(error.to_string().contains("not implemented"));
    assert!(
        !options()
            .iter()
            .find(|o| o.provider == ProviderId::AnthropicApi)
            .unwrap()
            .supports_text_test
    );
    db.close().await;
}

#[tokio::test]
async fn prepared_conversations_reject_stale_removed_and_missing_credentials() {
    let tree = tempfile::tempdir().unwrap();
    let db = database(&tree).await;
    let vault = Arc::new(Vault::default());
    let connections = Connections::new(db, vault.clone());
    let first = connections
        .save(request(
            None,
            "Chat",
            "http://localhost:12401/v1",
            ConnectionCredential::Replace("private".into()),
        ))
        .await
        .unwrap()
        .items
        .remove(0);
    let prepared = connections
        .prepare_text(&first.id, first.revision, "chosen")
        .await
        .unwrap();
    assert_eq!(prepared.target().model, "chosen");
    assert!(
        connections
            .prepare_text(&first.id, first.revision, " ")
            .await
            .is_err()
    );
    let next = connections
        .save(request(
            Some(first.id.clone()),
            "Edited",
            "http://localhost:12402/v1",
            ConnectionCredential::Keep,
        ))
        .await
        .unwrap()
        .items
        .remove(0);
    assert_eq!(next.revision, first.revision + 1);
    assert!(
        connections
            .prepare_text(&first.id, first.revision, "chosen")
            .await
            .is_err()
    );
    assert!(
        connections
            .prepare_text(&next.id, next.revision, "chosen")
            .await
            .is_ok()
    );
    vault.keys.lock().await.clear();
    assert!(
        connections
            .prepare_text(&next.id, next.revision, "chosen")
            .await
            .is_err()
    );
    connections.remove(&next.id).await.unwrap();
    assert!(
        connections
            .prepare_text(&next.id, next.revision, "chosen")
            .await
            .is_err()
    );
    // An in-flight prepared snapshot keeps its approved target, never the edited one.
    assert_eq!(prepared.target().label, "Chat");
}

#[test]
fn conversation_bounds_never_silently_drop_history() {
    use crate::providers::adapters::openai_compatible::{EndpointChatMessage, EndpointRole};
    let message = |content: String| EndpointChatMessage {
        role: EndpointRole::User,
        content,
    };
    assert!(PreparedText::validate_messages(&[]).is_err());
    assert!(PreparedText::validate_messages(&[message(" ".into())]).is_err());
    assert!(PreparedText::validate_messages(&[message("a".repeat(1024 * 1024))]).is_ok());
    assert!(PreparedText::validate_messages(&[message("a".repeat(1024 * 1024 + 1))]).is_err());
    let messages: Vec<_> = (0..2001).map(|_| message("hello".into())).collect();
    assert!(PreparedText::validate_messages(&messages[..2000]).is_ok());
    assert!(PreparedText::validate_messages(&messages).is_err());
}
