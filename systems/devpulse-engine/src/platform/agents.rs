//! Agent threads — conversations with your agents in chat (plan 0001 B3.3).
//!
//! A thread is a chat session (Turso `sessions`) held with one of your
//! agents; `agent_threads` records which agent, and the token that continues
//! its conversation. The kernel holds the live conversation
//! (`devpulse_clyffy::providers::session`); this facade keeps one per
//! thread, saves both sides of every turn in `turns` (the same table the
//! chat already reads), and hands each turn's events to the caller.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Instant;

use anyhow::{anyhow, bail, Context, Result};
use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlValue, TursoAdapter};
// IP-NOTE: conversation vocabulary only — thread, turn, agent, event; public
// names, no kernel internals.
use devpulse_clyffy::providers::{catalog, AgentSession};
pub use devpulse_clyffy::providers::{AgentEvent, PermissionChoice, ProviderId};
use serde::{Deserialize, Serialize};
use specta::Type;
use tokio::sync::{mpsc, Mutex};
use uuid::Uuid;

use super::projects::Projects;
use super::providers::Providers;

/// A thread with one of your agents.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AgentThread {
    /// The chat session it is (load its turns with the chat's history).
    pub session_id: String,
    /// The project it belongs to.
    pub project_id: String,
    /// The agent.
    pub provider_id: ProviderId,
    /// Its title.
    pub title: String,
    /// How many turns it holds.
    pub turn_count: i64,
    /// Unix seconds of its last turn.
    pub updated_at: i64,
}

/// What a thread needs to (re)start its conversation.
struct ThreadRecord {
    project_id: String,
    provider_id: ProviderId,
    resume_token: Option<String>,
}

/// Your agent threads.
pub struct Agents {
    db: Arc<TursoAdapter>,
    data_dir: PathBuf,
    providers: Arc<Providers>,
    projects: Option<Arc<Projects>>,
    /// The live conversation of each thread that has one, by session id.
    live: Mutex<HashMap<String, Arc<AgentSession>>>,
}

impl Agents {
    /// Agent threads over the user database.
    #[must_use]
    pub fn new(
        db: Arc<TursoAdapter>,
        data_dir: PathBuf,
        providers: Arc<Providers>,
        projects: Option<Arc<Projects>>,
    ) -> Self {
        Self {
            db,
            data_dir,
            providers,
            projects,
            live: Mutex::new(HashMap::new()),
        }
    }

    fn sql(&self) -> &dyn SqlAdapter {
        self.db.as_ref()
    }

    /// The threads of a project, latest first.
    ///
    /// # Errors
    /// Returns an error if the user database cannot be read.
    pub async fn threads(&self, project_id: &str) -> Result<Vec<AgentThread>> {
        let rows = self
            .sql()
            .query(
                "SELECT s.id, s.project_id, a.provider_id, COALESCE(s.title, ''), \
                 (SELECT COUNT(*) FROM turns t WHERE t.session_id = s.id), s.updated_at \
                 FROM agent_threads a JOIN sessions s ON s.id = a.session_id \
                 WHERE s.project_id = ? ORDER BY s.updated_at DESC",
                &[project_id.into()],
            )
            .await
            .context("read agent threads")?;
        Ok(rows
            .into_iter()
            .filter_map(|row| {
                let provider = row.get(2).and_then(SqlValue::as_text)?;
                Some(AgentThread {
                    session_id: row.first().and_then(SqlValue::as_text)?.to_owned(),
                    project_id: row.get(1).and_then(SqlValue::as_text)?.to_owned(),
                    provider_id: parse_provider(provider)?,
                    title: row.get(3).and_then(SqlValue::as_text)?.to_owned(),
                    turn_count: row.get(4).and_then(SqlValue::as_integer).unwrap_or(0),
                    updated_at: row.get(5).and_then(SqlValue::as_integer).unwrap_or(0),
                })
            })
            .collect())
    }

    /// Start a thread with an installed agent in a project.
    ///
    /// # Errors
    /// When the agent is not installed or cannot hold a conversation, or the
    /// user database cannot be written.
    pub async fn start_thread(
        &self,
        project_id: &str,
        provider_id: ProviderId,
    ) -> Result<AgentThread> {
        let catalog = catalog::load(&self.data_dir)?;
        let definition = catalog
            .definitions
            .iter()
            .find(|d| d.id == provider_id)
            .ok_or_else(|| anyhow!("{} is not an agent DevPulse knows", provider_id.key()))?;
        if definition.connect.is_none() || definition.protocol().is_none() {
            bail!("{} can't hold a conversation", definition.name());
        }
        if self.providers.location(provider_id).await.is_none() {
            bail!("{} is not installed", definition.name());
        }
        let session_id = format!("sess-{}", Uuid::new_v4());
        let title = definition.name().to_owned();
        self.sql()
            .execute(
                "INSERT INTO sessions (id, project_id, title, is_active) VALUES (?, ?, ?, 1)",
                &[
                    session_id.as_str().into(),
                    project_id.into(),
                    title.as_str().into(),
                ],
            )
            .await
            .context("create the thread's session")?;
        self.sql()
            .execute(
                "INSERT INTO agent_threads (session_id, provider_id) VALUES (?, ?)",
                &[session_id.as_str().into(), provider_id.key().into()],
            )
            .await
            .context("record the thread's agent")?;
        tracing::info!(target: "agents", %session_id, provider = provider_id.key(), "thread started");
        Ok(AgentThread {
            session_id,
            project_id: project_id.to_owned(),
            provider_id,
            title,
            turn_count: 0,
            updated_at: 0,
        })
    }

    async fn record(&self, session_id: &str) -> Result<ThreadRecord> {
        let rows = self
            .sql()
            .query(
                "SELECT s.project_id, a.provider_id, a.resume_token \
                 FROM agent_threads a JOIN sessions s ON s.id = a.session_id \
                 WHERE a.session_id = ? LIMIT 1",
                &[session_id.into()],
            )
            .await
            .context("read the thread")?;
        let row = rows
            .first()
            .ok_or_else(|| anyhow!("{session_id} is not an agent thread"))?;
        Ok(ThreadRecord {
            project_id: row
                .first()
                .and_then(SqlValue::as_text)
                .unwrap_or_default()
                .to_owned(),
            provider_id: row
                .get(1)
                .and_then(SqlValue::as_text)
                .and_then(parse_provider)
                .ok_or_else(|| anyhow!("{session_id}: unknown agent"))?,
            resume_token: row.get(2).and_then(SqlValue::as_text).map(str::to_owned),
        })
    }

    /// The thread's live conversation, started on first use in its
    /// project's folder.
    async fn live_session(
        &self,
        session_id: &str,
        record: &ThreadRecord,
    ) -> Result<Arc<AgentSession>> {
        let mut live = self.live.lock().await;
        if let Some(session) = live.get(session_id) {
            return Ok(Arc::clone(session));
        }
        let cwd = self.folder(&record.project_id).await;
        let session = Arc::new(
            self.conversation(record.provider_id, &cwd, record.resume_token.clone(), false)
                .await?,
        );
        live.insert(session_id.to_owned(), Arc::clone(&session));
        tracing::info!(target: "agents", %session_id, provider = record.provider_id.key(), cwd = %cwd.display(), "conversation started");
        Ok(session)
    }

    /// The agent is installed on this machine.
    pub(super) async fn installed(&self, provider_id: ProviderId) -> bool {
        self.providers.location(provider_id).await.is_some()
    }

    /// Start a conversation with an installed agent working in `cwd` (made
    /// if missing). `resume` continues one it reported earlier; `talk_only`
    /// turns its tools off where it has a switch for that.
    ///
    /// # Errors
    /// When the agent is unknown, not installed, or does not start.
    pub(super) async fn conversation(
        &self,
        provider_id: ProviderId,
        cwd: &Path,
        resume: Option<String>,
        talk_only: bool,
    ) -> Result<AgentSession> {
        let catalog = catalog::load(&self.data_dir)?;
        let definition = catalog
            .definitions
            .iter()
            .find(|d| d.id == provider_id)
            .ok_or_else(|| anyhow!("{} is not an agent DevPulse knows", provider_id.key()))?;
        let location = self
            .providers
            .location(provider_id)
            .await
            .ok_or_else(|| anyhow!("{} is not installed", definition.name()))?;
        std::fs::create_dir_all(cwd).with_context(|| format!("make {}", cwd.display()))?;
        AgentSession::start(
            definition,
            Path::new(&location),
            &self.data_dir,
            cwd,
            resume,
            talk_only,
        )
        .await
    }

    /// Where an agent works in a project: its folder, or an empty one.
    pub(super) async fn folder(&self, project_id: &str) -> PathBuf {
        if let Some(projects) = &self.projects {
            if let Ok(state) = projects.state().await {
                if let Some(project) = state.projects.into_iter().find(|p| p.id == project_id) {
                    return PathBuf::from(project.root_path);
                }
            }
        }
        self.data_dir.join("tools").join("ask")
    }

    /// Send a prompt on a thread. Both sides of the turn are saved; the
    /// turn's events arrive on the returned receiver.
    ///
    /// # Errors
    /// When the prompt is empty, the thread is unknown, or its agent cannot
    /// start.
    pub async fn prompt(
        &self,
        session_id: &str,
        text: &str,
    ) -> Result<mpsc::UnboundedReceiver<AgentEvent>> {
        let text = text.trim();
        if text.is_empty() {
            bail!("the message is empty");
        }
        let record = self.record(session_id).await?;
        let session = self.live_session(session_id, &record).await?;
        let mut events = session.prompt(text).await?;
        save_turn(
            &self.db,
            session_id,
            &record.project_id,
            &TurnRow {
                role: "user",
                content: text,
                model_used: None,
                finish_reason: None,
                latency_ms: None,
                metadata: None,
            },
        )
        .await?;

        let (out, receiver) = mpsc::unbounded_channel();
        let db = Arc::clone(&self.db);
        let session_id = session_id.to_owned();
        let started = Instant::now();
        devpulse_telemetry::spawn(async move {
            let mut answer = String::new();
            let mut stop = String::from("end_turn");
            let mut ending = None;
            while let Some(event) = events.recv().await {
                match &event {
                    AgentEvent::Text { text } => answer.push_str(text),
                    AgentEvent::TurnEnded { stop: why } => stop.clone_from(why),
                    AgentEvent::Failed { message } => {
                        "failed".clone_into(&mut stop);
                        if answer.is_empty() {
                            answer.clone_from(message);
                        }
                    }
                    _ => {}
                }
                // The ending event goes out only after the turn is saved, so
                // a window that reloads on it finds the answer.
                if event.ends_turn() {
                    ending = Some(event);
                    break;
                }
                let _ = out.send(event);
            }
            if ending.is_none() {
                "failed".clone_into(&mut stop);
            }
            let latency = i64::try_from(started.elapsed().as_millis()).unwrap_or(i64::MAX);
            if let Err(e) = save_turn(
                &db,
                &session_id,
                &record.project_id,
                &TurnRow {
                    role: "assistant",
                    content: &answer,
                    model_used: Some(record.provider_id.key()),
                    finish_reason: Some(&stop),
                    latency_ms: Some(latency),
                    metadata: None,
                },
            )
            .await
            {
                tracing::warn!(target: "agents", %session_id, error = %format!("{e:#}"), "the answer was not saved");
            }
            if let Some(token) = session.resume_token().await {
                let saved = db
                    .execute(
                        "UPDATE agent_threads SET resume_token = ? WHERE session_id = ?",
                        &[token.as_str().into(), session_id.as_str().into()],
                    )
                    .await;
                if let Err(e) = saved {
                    tracing::warn!(target: "agents", %session_id, error = %e, "the conversation token was not saved");
                }
            }
            let _ = out.send(ending.unwrap_or(AgentEvent::Failed {
                message: "the agent stopped without ending its turn".to_owned(),
            }));
        });
        Ok(receiver)
    }

    /// Stop the running turn of a thread.
    pub async fn cancel(&self, session_id: &str) {
        let session = self.live.lock().await.get(session_id).cloned();
        if let Some(session) = session {
            session.cancel().await;
        }
    }

    /// Answer a permission request of a thread's running turn (`None`
    /// refuses). Returns `false` when it is no longer waiting.
    pub async fn answer(&self, session_id: &str, request: &str, choice: Option<String>) -> bool {
        let session = self.live.lock().await.get(session_id).cloned();
        match session {
            Some(session) => session.answer(request, choice).await,
            None => false,
        }
    }

    /// End a thread's live conversation (its history stays).
    pub async fn close(&self, session_id: &str) {
        let session = self.live.lock().await.remove(session_id);
        if let Some(session) = session {
            session.close().await;
            tracing::info!(target: "agents", %session_id, "conversation closed");
        }
    }
}

pub(super) fn parse_provider(key: &str) -> Option<ProviderId> {
    serde_json::from_value(serde_json::Value::String(key.to_owned())).ok()
}

/// One side of a turn, as the chat's `turns` table keeps it.
pub(super) struct TurnRow<'a> {
    pub(super) role: &'a str,
    pub(super) content: &'a str,
    pub(super) model_used: Option<&'a str>,
    pub(super) finish_reason: Option<&'a str>,
    pub(super) latency_ms: Option<i64>,
    /// A JSON object (a room turn's place, role, phase and round).
    pub(super) metadata: Option<&'a str>,
}

/// Save one side of a turn in the chat's `turns` table.
pub(super) async fn save_turn(
    db: &TursoAdapter,
    session_id: &str,
    project_id: &str,
    turn: &TurnRow<'_>,
) -> Result<()> {
    let sequence = db
        .query(
            "SELECT COALESCE(MAX(sequence_num), 0) + 1 FROM turns WHERE session_id = ?",
            &[session_id.into()],
        )
        .await
        .context("read the turn order")?
        .first()
        .and_then(|r| r.first())
        .and_then(SqlValue::as_integer)
        .unwrap_or(1);
    let optional_text = |v: Option<&str>| v.map_or(SqlValue::Null, SqlValue::from);
    db.execute(
        "INSERT INTO turns (id, session_id, project_id, role, content, sequence_num, model_used, \
         finish_reason, latency_ms, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        &[
            format!("turn-{}", Uuid::new_v4()).as_str().into(),
            session_id.into(),
            project_id.into(),
            turn.role.into(),
            turn.content.into(),
            sequence.into(),
            optional_text(turn.model_used),
            optional_text(turn.finish_reason),
            turn.latency_ms.map_or(SqlValue::Null, SqlValue::from),
            optional_text(turn.metadata),
        ],
    )
    .await
    .context("save the turn")?;
    db.execute(
        "UPDATE sessions SET updated_at = unixepoch(), interaction_count = interaction_count + 1 \
         WHERE id = ?",
        &[session_id.into()],
    )
    .await
    .context("touch the thread")?;
    Ok(())
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn stored_agent_ids_read_back() {
        assert_eq!(parse_provider("claude-code"), Some(ProviderId::ClaudeCode));
        assert_eq!(parse_provider("codex"), Some(ProviderId::Codex));
        assert_eq!(parse_provider("nope"), None);
        for p in devpulse_clyffy::providers::registry::PROVIDERS {
            assert_eq!(parse_provider(p.id.key()), Some(p.id));
        }
    }
}
