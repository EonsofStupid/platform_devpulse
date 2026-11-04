//! Scoped conversations: kernel execution, engine persistence and cancellation.
mod history;
#[cfg(test)]
mod tests;
mod turns;
mod types;

use super::agents::{TurnRow, notes_on, save_turn};
use super::containers::Containers;
use super::memory::Memory;
use anyhow::{Context, Result, ensure};
pub use devpulse_clyffy::providers::connections::TextTarget;
use devpulse_clyffy::{
    cortex::persistence::{SqlAdapter, TursoAdapter},
    providers::{
        adapters::openai_compatible::{EndpointChatMessage, EndpointRole},
        connections::{Connections, PreparedText},
    },
};
use std::{
    collections::HashMap,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
};
use tokio::sync::watch;
pub use types::{ChatMessage, RoomEntry};
use uuid::Uuid;

struct Running {
    request_id: String,
    cancel: watch::Sender<bool>,
}

/// Chat coordination over the existing user store and private kernel connections.
pub struct Chat {
    db: Arc<TursoAdapter>,
    connections: Option<Arc<Connections>>,
    /// Your memory; the notes you approved go with each endpoint conversation.
    memory: Option<Arc<Memory>>,
    /// The same observed host state used by agent conversations.
    containers: Option<Arc<Containers>>,
    running: Mutex<HashMap<String, Running>>,
    closed: AtomicBool,
    drained: tokio::sync::Notify,
}

struct TurnGuard<'a> {
    chat: &'a Chat,
    session: String,
}
impl Drop for TurnGuard<'_> {
    fn drop(&mut self) {
        if let Ok(mut running) = self.chat.running.lock() {
            running.remove(&self.session);
            self.chat.drained.notify_one();
        }
    }
}

async fn host_context_message(containers: Option<&Arc<Containers>>) -> Option<EndpointChatMessage> {
    let host = containers?.host_context().await?;
    Some(EndpointChatMessage {
        role: EndpointRole::System,
        content: host,
    })
}

impl Chat {
    /// Bind platform-owned persistence to kernel-owned endpoint execution.
    #[must_use]
    pub fn new(
        db: Arc<TursoAdapter>,
        connections: Option<Arc<Connections>>,
        memory: Option<Arc<Memory>>,
        containers: Option<Arc<Containers>>,
    ) -> Self {
        Self {
            db,
            connections,
            memory,
            containers,
            running: Mutex::new(HashMap::new()),
            closed: AtomicBool::new(false),
            drained: tokio::sync::Notify::new(),
        }
    }

    /// Start an explicit endpoint conversation. This does not send a prompt.
    /// # Errors
    /// Refuses unknown projects, changed connections or unavailable credentials.
    pub async fn start_endpoint(
        &self,
        project: &str,
        connection: &str,
        revision: i64,
        model: &str,
    ) -> Result<String> {
        ensure!(!self.closed.load(Ordering::SeqCst), "Chat is shutting down");
        self.require_project(project).await?;
        let prepared = self
            .connections
            .as_ref()
            .context("Saved AI connections are unavailable")?
            .prepare_text(connection, revision, model)
            .await?;
        let target = prepared.target();
        let id = format!("sess-{}", Uuid::new_v4());
        let title = format!("{} / {}", target.label, target.model);
        self.db.write_atomic(&[
            ("INSERT INTO sessions (id, project_id, title) VALUES (?, ?, ?)", vec![id.as_str().into(), project.into(), title.into()]),
            ("INSERT INTO chat_endpoint_sessions (session_id, connection_id, connection_revision, connection_label, model) VALUES (?, ?, ?, ?, ?)", vec![id.as_str().into(), target.connection_id.as_str().into(), target.revision.into(), target.label.as_str().into(), target.model.as_str().into()]),
        ]).await.context("Create the endpoint conversation")?;
        Ok(id)
    }

    /// Public routing identity of a selected chat, including retained old bindings.
    /// # Errors
    /// A supplied session must belong to the supplied project.
    pub async fn endpoint_target(
        &self,
        project: &str,
        session: Option<&str>,
    ) -> Result<Option<TextTarget>> {
        let Some(session) = session else {
            return Ok(None);
        };
        self.require_session(project, session, false).await?;
        let rows = self.db.query("SELECT connection_id, connection_revision, connection_label, model FROM chat_endpoint_sessions WHERE session_id = ?", &[session.into()]).await?;
        rows.first()
            .map(|row| {
                Ok(TextTarget {
                    connection_id: history::text(row, 0)?.to_owned(),
                    revision: row
                        .get(1)
                        .and_then(super::SqlValue::as_integer)
                        .context("Invalid connection revision")?,
                    label: history::text(row, 2)?.to_owned(),
                    model: history::text(row, 3)?.to_owned(),
                })
            })
            .transpose()
    }

    /// Run one turn. The engine saves both sides; windows receive only deltas.
    /// # Errors
    /// Wrong scope, concurrent turns, changed connections, cancellation, transport
    /// and persistence failures are explicit. Partial output is never a completed answer.
    pub async fn prompt_endpoint(
        &self,
        project: &str,
        session: &str,
        request_id: &str,
        content: &str,
        on_delta: impl FnMut(&str) -> Result<()>,
    ) -> Result<ChatMessage> {
        ensure!(!content.trim().is_empty(), "Message content is empty");
        Uuid::parse_str(request_id).context("Invalid chat request identity")?;
        self.require_session(project, session, true).await?;
        let (cancel, mut cancelled) = watch::channel(false);
        {
            let mut running = self
                .running
                .lock()
                .map_err(|_| anyhow::anyhow!("Chat coordination is unavailable"))?;
            ensure!(!self.closed.load(Ordering::SeqCst), "Chat is shutting down");
            ensure!(
                !running.contains_key(session),
                "This conversation already has a response in progress"
            );
            running.insert(
                session.to_owned(),
                Running {
                    request_id: request_id.to_owned(),
                    cancel,
                },
            );
        }
        let _guard = TurnGuard {
            chat: self,
            session: session.to_owned(),
        };
        let target = self
            .endpoint_target(project, Some(session))
            .await?
            .context("This is not an endpoint conversation")?;
        let prepared = self
            .connections
            .as_ref()
            .context("Saved AI connections are unavailable")?
            .prepare_text(&target.connection_id, target.revision, &target.model)
            .await?;
        let mut messages = self.context(project, session).await?;
        if let Some(memory) = &self.memory
            && notes_on(self.db.as_ref(), session).await
            && let Some(notes) = memory.session_text(project).await
        {
            messages.insert(
                0,
                EndpointChatMessage {
                    role: EndpointRole::System,
                    content: notes,
                },
            );
        }
        if let Some(host) = host_context_message(self.containers.as_ref()).await {
            messages.insert(0, host);
        }
        messages.push(EndpointChatMessage {
            role: EndpointRole::User,
            content: content.trim().to_owned(),
        });
        PreparedText::validate_messages(&messages)?;
        ensure!(!*cancelled.borrow(), "Response cancelled before sending");
        save_turn(
            &self.db,
            session,
            project,
            &turns::user_turn(content.trim()),
        )
        .await?;
        let answer = tokio::select! {
            biased;
            _ = cancelled.changed() => anyhow::bail!("Response cancelled; no completed answer was saved"),
            result = prepared.stream(messages, on_delta) => result?,
        };
        ensure!(
            !*cancelled.borrow(),
            "Response cancelled; no completed answer was saved"
        );
        let tokens = answer
            .usage
            .as_ref()
            .map(|usage| i64::try_from(usage.completion_tokens))
            .transpose()
            .context("Endpoint token count is too large")?;
        let elapsed = i64::try_from(answer.elapsed_ms).context("Endpoint duration is too large")?;
        let model = answer.model.as_deref().unwrap_or(&target.model);
        let id = save_turn(
            &self.db,
            session,
            project,
            &TurnRow {
                role: "assistant",
                content: &answer.text,
                token_count: tokens,
                model_used: Some(model),
                finish_reason: Some(&answer.finish_reason),
                latency_ms: Some(elapsed),
                metadata: None,
            },
        )
        .await?;
        self.message(&id).await
    }

    /// Cancel only the identified request in its owning project/session.
    /// # Errors
    /// Wrong project and unavailable coordination fail; an already-ended request is harmless.
    pub async fn cancel_endpoint(
        &self,
        project: &str,
        session: &str,
        request_id: &str,
    ) -> Result<()> {
        self.require_session(project, session, false).await?;
        let running = self
            .running
            .lock()
            .map_err(|_| anyhow::anyhow!("Chat coordination is unavailable"))?;
        if let Some(turn) = running
            .get(session)
            .filter(|turn| turn.request_id == request_id)
        {
            turn.cancel.send_replace(true);
        }
        Ok(())
    }

    /// Cancel in-flight endpoint requests before platform storage shuts down.
    pub async fn shutdown(&self) {
        self.closed.store(true, Ordering::SeqCst);
        if let Ok(running) = self.running.lock() {
            for turn in running.values() {
                turn.cancel.send_replace(true);
            }
        }
        loop {
            if self.running.lock().is_ok_and(|running| running.is_empty()) {
                break;
            }
            self.drained.notified().await;
        }
    }
}
