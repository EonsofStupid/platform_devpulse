//! Real user-store and loopback endpoint tests, without live accounts.
#![allow(clippy::unwrap_used, clippy::expect_used, reason = "test assertions")]
use super::*;
use crate::platform::{
    SqlValue, TursoOptions,
    services::relational::{RelationalService, USER_STORE},
};
use devpulse_clyffy::providers::{
    ProviderId,
    connections::{ConnectionCredential, SaveConnection, SavedConnection},
    credentials::CredentialStore,
};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[derive(Default)]
struct Vault(Mutex<HashMap<String, String>>);
#[async_trait::async_trait]
impl CredentialStore for Vault {
    async fn read(&self, id: &str) -> Result<Option<String>> {
        Ok(self.0.lock().unwrap().get(id).cloned())
    }
    async fn write(&self, id: &str, key: String) -> Result<()> {
        self.0.lock().unwrap().insert(id.into(), key);
        Ok(())
    }
    async fn remove(&self, id: &str) -> Result<()> {
        self.0.lock().unwrap().remove(id);
        Ok(())
    }
}
async fn open(tree: &tempfile::TempDir) -> (Arc<TursoAdapter>, Arc<Connections>, Arc<Chat>) {
    let store = RelationalService::boot(
        &tree.path().join("user.db"),
        USER_STORE,
        "chat test",
        TursoOptions::default(),
    )
    .await
    .unwrap();
    let db = Arc::clone(store.adapter());
    db.execute_batch("INSERT OR IGNORE INTO projects(id,name,root_path) VALUES ('p','one','/one'),('q','two','/two');").await.unwrap();
    let connections = Arc::new(Connections::new(db.clone(), Arc::new(Vault::default())));
    let chat = Arc::new(Chat::new(db.clone(), Some(connections.clone()), None, None));
    (db, connections, chat)
}
async fn save(connections: &Connections, id: Option<String>, endpoint: &str) -> SavedConnection {
    connections
        .save(SaveConnection {
            id,
            label: "My endpoint".into(),
            provider: ProviderId::Ollama,
            endpoint: endpoint.into(),
            credential: ConnectionCredential::Keep,
        })
        .await
        .unwrap()
        .items
        .remove(0)
}
async fn request(socket: &mut tokio::net::TcpStream) -> serde_json::Value {
    let mut bytes = Vec::new();
    loop {
        let mut chunk = [0; 4096];
        let count = socket.read(&mut chunk).await.unwrap();
        assert!(count > 0);
        bytes.extend_from_slice(&chunk[..count]);
        if let Some(end) = bytes.windows(4).position(|b| b == b"\r\n\r\n") {
            let headers = std::str::from_utf8(&bytes[..end]).unwrap();
            assert!(headers.starts_with("POST /custom/v1/chat/completions "));
            let size: usize = headers
                .lines()
                .find_map(|l| {
                    l.to_ascii_lowercase()
                        .strip_prefix("content-length:")
                        .map(|n| n.trim().parse().unwrap())
                })
                .unwrap();
            if bytes.len() >= end + 4 + size {
                return serde_json::from_slice(&bytes[end + 4..end + 4 + size]).unwrap();
            }
        }
    }
}
fn stream_body(text: &str) -> String {
    format!(
        "data: {}\n\ndata: {}\n\ndata: [DONE]\n\n",
        serde_json::json!({"model":"fixture-model","choices":[{"index":0,"delta":{"content":text},"finish_reason":null}]}),
        serde_json::json!({"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]})
    )
}

#[tokio::test]
async fn selected_ordinary_session_and_project_own_every_write() {
    let tree = tempfile::tempdir().unwrap();
    let (db, _, chat) = open(&tree).await;
    assert!(chat.send_user("p", None, " ").await.is_err());
    let sessions = db.query("SELECT id FROM sessions", &[]).await.unwrap();
    assert_eq!(sessions.len(), 0);
    let first = chat.send_user("p", None, "first").await.unwrap();
    let second = chat.send_user("p", None, "second").await.unwrap();
    assert_ne!(first.session_id, second.session_id);
    chat.send_user("p", Some(&first.session_id), "still first")
        .await
        .unwrap();
    assert_eq!(
        chat.recent("p", Some(&first.session_id))
            .await
            .unwrap()
            .len(),
        2
    );
    assert_eq!(
        chat.recent("p", Some(&second.session_id))
            .await
            .unwrap()
            .len(),
        1
    );
    assert!(chat.recent("p", None).await.unwrap().is_empty());
    assert!(
        chat.send_user("q", Some(&first.session_id), "wrong")
            .await
            .is_err()
    );
    assert!(chat.recent("q", Some(&first.session_id)).await.is_err());
    db.execute(
        "UPDATE sessions SET ended_at = 1 WHERE id = ?",
        &[first.session_id.as_str().into()],
    )
    .await
    .unwrap();
    assert!(
        save_turn(
            &db,
            &first.session_id,
            "p",
            &turns::user_turn("atomic archive guard")
        )
        .await
        .is_err()
    );
    assert!(
        chat.send_user("p", Some(&first.session_id), "archived")
            .await
            .is_err()
    );
    assert_eq!(
        chat.recent("p", Some(&first.session_id))
            .await
            .unwrap()
            .len(),
        2
    );
}

/// Stream two answers, returning the requests that asked for them.
async fn answer_two_streams(listener: tokio::net::TcpListener) -> Vec<serde_json::Value> {
    let mut requests = Vec::new();
    for text in ["first answer", "second answer"] {
        let (mut socket, _) = listener.accept().await.unwrap();
        requests.push(request(&mut socket).await);
        let body = stream_body(text);
        socket.write_all(format!("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).as_bytes()).await.unwrap();
    }
    requests
}

#[tokio::test]
async fn an_endpoint_conversation_gets_the_notes_you_approved_and_saves_only_your_words() {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/custom/v1", listener.local_addr().unwrap());
    let server = devpulse_telemetry::spawn(answer_two_streams(listener));
    let tree = tempfile::tempdir().unwrap();
    let (db, connections, _) = open(&tree).await;
    let memory = Arc::new(Memory::start(db.clone()).await.unwrap());
    memory
        .save(Some("p"), "stack", "Tauri and Svelte.", None, true)
        .await
        .unwrap();
    memory
        .save(Some("q"), "other", "Another project's note.", None, true)
        .await
        .unwrap();
    memory
        .save(Some("p"), "private", "Held back.", None, false)
        .await
        .unwrap();
    let chat = Chat::new(db.clone(), Some(connections.clone()), Some(memory), None);
    let connection = save(&connections, None, &url).await;
    let session = chat
        .start_endpoint("p", &connection.id, connection.revision, "chosen-model")
        .await
        .unwrap();

    prompt_quietly(&chat, "p", &session, "hello").await.unwrap();
    prompt_quietly(&chat, "p", &session, "again").await.unwrap();

    let requests = server.await.unwrap();
    for request in &requests {
        let first = &request["messages"][0];
        assert_eq!(first["role"], "system", "{request}");
        let notes = first["content"].as_str().unwrap();
        assert!(notes.contains("Tauri and Svelte."), "{notes}");
        assert!(!notes.contains("Another project's note."), "{notes}");
        assert!(!notes.contains("Held back."), "{notes}");
    }
    assert_eq!(requests[0]["messages"][1]["content"], "hello");
    let saved = chat.recent("p", Some(&session)).await.unwrap();
    assert!(
        saved.iter().all(|turn| !turn.content.contains("Tauri")),
        "your history holds your words, not the notes"
    );
}

/// One turn whose chunks the test does not need.
async fn prompt_quietly(
    chat: &Chat,
    project: &str,
    session: &str,
    text: &str,
) -> Result<ChatMessage> {
    chat.prompt_endpoint(project, session, &Uuid::new_v4().to_string(), text, |_| {
        Ok(())
    })
    .await
}

#[tokio::test]
async fn endpoint_chat_retains_history_across_reopen_and_uses_explicit_target() {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/custom/v1", listener.local_addr().unwrap());
    let server = devpulse_telemetry::spawn(answer_two_streams(listener));
    let tree = tempfile::tempdir().unwrap();
    let (db, connections, chat) = open(&tree).await;
    let connection = save(&connections, None, &url).await;
    let session = chat
        .start_endpoint("p", &connection.id, connection.revision, "chosen-model")
        .await
        .unwrap();
    assert!(
        chat.send_user("p", Some(&session), "wrong path")
            .await
            .is_err()
    );
    assert!(
        prompt_quietly(&chat, "q", &session, "wrong project")
            .await
            .is_err()
    );
    let mut deltas = String::new();
    let answer = chat
        .prompt_endpoint("p", &session, &Uuid::new_v4().to_string(), "hello", |t| {
            deltas.push_str(t);
            Ok(())
        })
        .await
        .unwrap();
    assert_eq!(answer.content, deltas);
    assert_eq!(answer.token_count, None);
    assert_eq!(answer.model_used.as_deref(), Some("fixture-model"));
    chat.shutdown().await;
    db.close().await;
    drop((chat, connections, db));
    let (db, connections, chat) = open(&tree).await;
    let target = chat
        .endpoint_target("p", Some(&session))
        .await
        .unwrap()
        .unwrap();
    assert_eq!(target.connection_id, connection.id);
    prompt_quietly(&chat, "p", &session, "remember that")
        .await
        .unwrap();
    let requests = server.await.unwrap();
    assert_eq!(requests[0]["model"], "chosen-model");
    assert_eq!(requests[0]["messages"].as_array().unwrap().len(), 1);
    assert_eq!(
        requests[1]["messages"],
        serde_json::json!([
            {"role":"user","content":"hello"}, {"role":"assistant","content":"first answer"}, {"role":"user","content":"remember that"}
        ])
    );
    assert_eq!(chat.recent("p", Some(&session)).await.unwrap().len(), 4);
    let edited = save(
        &connections,
        Some(connection.id.clone()),
        "http://127.0.0.1:1/custom/v1",
    )
    .await;
    assert_eq!(edited.revision, connection.revision + 1);
    assert!(
        prompt_quietly(&chat, "p", &session, "must not leak history")
            .await
            .unwrap_err()
            .to_string()
            .contains("changed")
    );
    assert_eq!(chat.recent("p", Some(&session)).await.unwrap().len(), 4);
    connections.remove(&connection.id).await.unwrap();
    assert_eq!(chat.recent("p", Some(&session)).await.unwrap().len(), 4);
    assert!(
        chat.endpoint_target("p", Some(&session))
            .await
            .unwrap()
            .is_some()
    );
    assert_eq!(
        db.query("SELECT COUNT(*) FROM agenthub_threads", &[])
            .await
            .unwrap()[0][0],
        SqlValue::Integer(0)
    );
}

async fn stopped_response(shutdown: bool) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/custom/v1", listener.local_addr().unwrap());
    let (received, ready) = tokio::sync::oneshot::channel();
    let server = devpulse_telemetry::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        request(&mut socket).await;
        let body = "data: {\"choices\":[{\"index\":0,\"delta\":{\"content\":\"partial\"}}]}\n\n";
        socket.write_all(format!("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nContent-Length: 999999\r\n\r\n{body}").as_bytes()).await.unwrap();
        received.send(()).unwrap();
        let mut end = [0];
        tokio::time::timeout(std::time::Duration::from_secs(5), socket.read(&mut end))
            .await
            .unwrap()
            .unwrap()
    });
    let tree = tempfile::tempdir().unwrap();
    let (_, connections, chat) = open(&tree).await;
    let connection = save(&connections, None, &url).await;
    let session = chat
        .start_endpoint("p", &connection.id, connection.revision, "model")
        .await
        .unwrap();
    let request_id = Uuid::new_v4().to_string();
    let task = {
        let chat = chat.clone();
        let session = session.clone();
        let request_id = request_id.clone();
        devpulse_telemetry::spawn(async move {
            chat.prompt_endpoint("p", &session, &request_id, "question", |_| Ok(()))
                .await
        })
    };
    ready.await.unwrap();
    assert!(
        chat.prompt_endpoint(
            "p",
            &session,
            &Uuid::new_v4().to_string(),
            "overlap",
            |_| Ok(())
        )
        .await
        .is_err()
    );
    assert!(
        chat.cancel_endpoint("q", &session, &request_id)
            .await
            .is_err()
    );
    chat.cancel_endpoint("p", &session, "stale-request")
        .await
        .unwrap();
    assert!(!task.is_finished());
    if shutdown {
        tokio::time::timeout(std::time::Duration::from_secs(5), chat.shutdown())
            .await
            .unwrap();
        assert!(
            chat.start_endpoint("p", &connection.id, connection.revision, "model")
                .await
                .is_err()
        );
    } else {
        chat.cancel_endpoint("p", &session, &request_id)
            .await
            .unwrap();
    }
    assert!(
        task.await
            .unwrap()
            .unwrap_err()
            .to_string()
            .contains("cancelled")
    );
    assert_eq!(server.await.unwrap(), 0);
    let history = chat.recent("p", Some(&session)).await.unwrap();
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].role, "user");
    assert!(chat.running.lock().unwrap().is_empty());
}

#[tokio::test]
async fn cancellation_is_scoped_and_partial_output_is_not_a_completed_answer() {
    stopped_response(false).await;
}
#[tokio::test]
async fn shutdown_cancels_and_drains_the_inflight_endpoint_request() {
    stopped_response(true).await;
}

#[tokio::test]
async fn latest_history_is_ordered_and_assistant_writes_enforce_scope() {
    let tree = tempfile::tempdir().unwrap();
    let (db, _, chat) = open(&tree).await;
    let first = chat.send_user("p", None, "first").await.unwrap();
    assert!(
        chat.save_assistant("q", &first.session_id, "wrong project", None, "model", 1)
            .await
            .is_err()
    );
    assert!(
        chat.save_assistant("p", &first.session_id, "bad metrics", Some(-1), "model", 1)
            .await
            .is_err()
    );
    for i in 2..=205 {
        db.execute("INSERT INTO turns (id, session_id, project_id, role, content, sequence_num) VALUES (?, ?, 'p', 'user', ?, ?)", &[format!("turn-{i}").into(), first.session_id.as_str().into(), i.to_string().into(), i.into()]).await.unwrap();
    }
    let recent = chat.recent("p", Some(&first.session_id)).await.unwrap();
    assert_eq!(recent.len(), 200);
    assert_eq!(recent[0].content, "6");
    assert_eq!(recent[199].content, "205");
    let context = chat.context("p", &first.session_id).await.unwrap();
    assert_eq!(context.len(), 205);
    assert_eq!(context[0].content, "first");
}

#[tokio::test]
async fn upgrading_user_store_preserves_existing_connections_and_turns() {
    use crate::platform::services::relational::StoreSchema;
    let tree = tempfile::tempdir().unwrap();
    let path = tree.path().join("user.db");
    let old = StoreSchema {
        schema: USER_STORE.schema,
        migrations: &USER_STORE.migrations[..4],
    };
    let store = RelationalService::boot(&path, old, "old chat", TursoOptions::default())
        .await
        .unwrap();
    store.adapter().execute_batch("INSERT INTO projects (id,name,root_path) VALUES ('p','one','/one'); INSERT INTO sessions (id,project_id,title) VALUES ('existing','p','Keep me'); INSERT INTO turns (id,session_id,project_id,role,content,sequence_num) VALUES ('existing-turn','existing','p','user','Original text',1); INSERT INTO ai_connections (id,label,provider_id,endpoint,credential_ref) VALUES ('saved','My server','ollama','http://localhost:12401/custom/v1','vault-ref');").await.unwrap();
    store.adapter().close().await;
    drop(store);
    let (_, connections, chat) = open(&tree).await;
    let connection = connections.state().await.unwrap().items.remove(0);
    assert_eq!(connection.id, "saved");
    assert_eq!(connection.revision, 1);
    assert!(connection.has_credential);
    assert_eq!(connection.endpoint, "http://localhost:12401/custom/v1");
    assert_eq!(
        chat.recent("p", Some("existing")).await.unwrap()[0].content,
        "Original text"
    );
    assert!(
        chat.endpoint_target("p", Some("existing"))
            .await
            .unwrap()
            .is_none()
    );
}

#[tokio::test]
async fn transcript_access_does_not_require_the_endpoint_service() {
    let tree = tempfile::tempdir().unwrap();
    let (db, connections, chat) = open(&tree).await;
    let connection = save(&connections, None, "http://localhost:12401/v1").await;
    let session = chat
        .start_endpoint("p", &connection.id, connection.revision, "model")
        .await
        .unwrap();
    let unavailable = Chat::new(db, None, None, None);
    assert!(
        unavailable
            .recent("p", Some(&session))
            .await
            .unwrap()
            .is_empty()
    );
    assert!(
        unavailable
            .endpoint_target("p", Some(&session))
            .await
            .unwrap()
            .is_some()
    );
    assert!(
        unavailable
            .send_user("p", None, "ordinary still works")
            .await
            .is_ok()
    );
    let error = unavailable
        .prompt_endpoint(
            "p",
            &session,
            &Uuid::new_v4().to_string(),
            "question",
            |_| Ok(()),
        )
        .await
        .unwrap_err();
    assert!(error.to_string().contains("unavailable"));
    assert!(unavailable.running.lock().unwrap().is_empty());
}
