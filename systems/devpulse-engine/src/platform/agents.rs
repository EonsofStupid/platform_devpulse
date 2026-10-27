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
use super::providers::{Providers, SignedIn};

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
    /// When the agent is not installed, you are signed out of it, it cannot
    /// hold a conversation, or the user database cannot be written.
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
        if self.signed_out(provider_id).await {
            bail!(
                "{} is not signed in — sign in from Settings → Your AI",
                definition.name()
            );
        }
        let session_id = format!("sess-{}", Uuid::new_v4());
        let title = definition.name().to_owned();
        self.db
            .write_atomic(&[
                (
                    "INSERT INTO sessions (id, project_id, title, is_active) VALUES (?, ?, ?, 1)",
                    vec![
                        session_id.as_str().into(),
                        project_id.into(),
                        title.as_str().into(),
                    ],
                ),
                (
                    "INSERT INTO agent_threads (session_id, provider_id) VALUES (?, ?)",
                    vec![session_id.as_str().into(), provider_id.key().into()],
                ),
            ])
            .await
            .context("create the agent thread")?;
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
        let cwd = self.folder(&record.project_id).await?;
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

    /// The last check found you signed out of the agent. An agent whose
    /// sign-in could not be told is not refused (some vendors only leave a
    /// login file).
    pub(super) async fn signed_out(&self, provider_id: ProviderId) -> bool {
        self.providers.signed_in(provider_id).await == SignedIn::No
    }

    /// Start a conversation in its existing workspace. Only `talk_only`
    /// places may create an isolated folder. `resume` continues a previous
    /// conversation; `talk_only` turns tools off where the agent supports it.
    ///
    /// # Errors
    /// When the workspace is unavailable or the agent cannot start.
    pub(super) async fn conversation(
        &self,
        provider_id: ProviderId,
        cwd: &Path,
        resume: Option<String>,
        talk_only: bool,
    ) -> Result<AgentSession> {
        prepare_workspace(cwd, talk_only)?;
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

    /// Resolve the intended project workspace without substituting one.
    pub(super) async fn folder(&self, project_id: &str) -> Result<PathBuf> {
        self.projects
            .as_ref()
            .context("projects are unavailable; cannot choose the agent's workspace")?
            .workspace(project_id)
            .await
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
                token_count: None,
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
                    token_count: None,
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

fn prepare_workspace(cwd: &Path, talk_only: bool) -> Result<()> {
    if !cwd.is_absolute() {
        bail!(
            "the agent needs an absolute workspace folder: {}",
            cwd.display()
        );
    }
    if talk_only {
        std::fs::create_dir_all(cwd)
            .with_context(|| format!("make the talk-only folder {}", cwd.display()))?;
    }
    let metadata = std::fs::metadata(cwd)
        .with_context(|| format!("agent workspace {} is unavailable", cwd.display()))?;
    if !metadata.is_dir() {
        bail!("agent workspace {} is not a directory", cwd.display());
    }
    Ok(())
}

pub(super) fn parse_provider(key: &str) -> Option<ProviderId> {
    serde_json::from_value(serde_json::Value::String(key.to_owned())).ok()
}

/// One side of a turn, as the chat's `turns` table keeps it.
pub struct TurnRow<'a> {
    /// The speaker: user, assistant or system.
    pub role: &'a str,
    /// The complete content to persist.
    pub content: &'a str,
    /// Tokens reported by the caller, when known.
    pub token_count: Option<i64>,
    /// The model or provider that answered.
    pub model_used: Option<&'a str>,
    /// Why the turn ended, when known.
    pub finish_reason: Option<&'a str>,
    /// Time spent producing the answer.
    pub latency_ms: Option<i64>,
    /// A JSON object (a room turn's place, role, phase and round).
    pub metadata: Option<&'a str>,
}

/// Atomically save a chat, agent or room turn and return its created id.
///
/// # Errors
/// When the session/project does not match or either database mutation fails.
pub async fn save_turn(
    db: &TursoAdapter,
    session_id: &str,
    project_id: &str,
    turn: &TurnRow<'_>,
) -> Result<String> {
    let id = format!("turn-{}", Uuid::new_v4());
    let optional_text = |v: Option<&str>| v.map_or(SqlValue::Null, SqlValue::from);
    db.write_atomic(&[(
        "INSERT INTO turns (id, session_id, project_id, role, content, sequence_num, model_used, \
         finish_reason, latency_ms, metadata, token_count) \
         SELECT ?, s.id, s.project_id, ?, ?, \
         (SELECT COALESCE(MAX(sequence_num), 0) + 1 FROM turns WHERE session_id = s.id), \
         ?, ?, ?, ?, ? FROM sessions s WHERE s.id = ? AND s.project_id = ?",
        vec![
            id.as_str().into(),
            turn.role.into(),
            turn.content.into(),
            optional_text(turn.model_used),
            optional_text(turn.finish_reason),
            turn.latency_ms.map_or(SqlValue::Null, SqlValue::from),
            optional_text(turn.metadata),
            turn.token_count.map_or(SqlValue::Null, SqlValue::from),
            session_id.into(),
            project_id.into(),
        ],
    ), (
        "UPDATE sessions SET updated_at = unixepoch(), interaction_count = interaction_count + 1 \
         WHERE id = ?",
        vec![session_id.into()],
    )])
    .await
    .context("save the turn and update its thread")?;
    Ok(id)
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use devpulse_clyffy::cortex::persistence::TursoOptions;

    async fn turn_fixture(limit: u32) -> (tempfile::TempDir, Arc<TursoAdapter>) {
        let tree = tempfile::tempdir().unwrap();
        let schema = format!("CREATE TABLE sessions (id TEXT PRIMARY KEY, project_id TEXT NOT NULL,
            updated_at INTEGER DEFAULT 0, interaction_count INTEGER DEFAULT 0 CHECK(interaction_count <= {limit}));
            CREATE TABLE turns (id TEXT PRIMARY KEY, session_id TEXT, project_id TEXT, role TEXT,
                content TEXT CHECK(content != 'reject'), sequence_num INTEGER, model_used TEXT,
                finish_reason TEXT, latency_ms INTEGER, metadata TEXT, token_count INTEGER);
            INSERT INTO sessions (id, project_id) VALUES ('s', 'p');");
        let db = TursoAdapter::open_with_schema(
            &tree.path().join("turns.db"),
            &schema,
            TursoOptions::default(),
        )
        .await
        .unwrap();
        (tree, Arc::new(db))
    }

    fn user_turn(content: &str) -> TurnRow<'_> {
        TurnRow {
            role: "user",
            token_count: None,
            content,
            model_used: None,
            finish_reason: None,
            latency_ms: None,
            metadata: None,
        }
    }

    #[tokio::test]
    async fn ordinary_chat_telemetry_survives_the_shared_atomic_write() {
        let (_tree, db) = turn_fixture(1).await;
        let id = save_turn(
            &db,
            "s",
            "p",
            &TurnRow {
                role: "assistant",
                content: "answer",
                token_count: Some(42),
                model_used: Some("chat.brain"),
                finish_reason: Some("end_turn"),
                latency_ms: Some(120),
                metadata: Some("{}"),
            },
        )
        .await
        .unwrap();
        let row = db.query("SELECT role, content, token_count, model_used, finish_reason, latency_ms, metadata FROM turns WHERE id = ?", &[id.as_str().into()]).await.unwrap();
        assert_eq!(
            row,
            vec![vec![
                "assistant".into(),
                "answer".into(),
                42.into(),
                "chat.brain".into(),
                "end_turn".into(),
                120.into(),
                "{}".into()
            ]]
        );
        db.close().await;
    }

    #[tokio::test]
    async fn simultaneous_turns_have_distinct_order_and_matching_counters() {
        let (_tree, db) = turn_fixture(32).await;
        let mut tasks = tokio::task::JoinSet::new();
        for _ in 0..16 {
            let db = Arc::clone(&db);
            tasks.spawn(async move { save_turn(&db, "s", "p", &user_turn("hello")).await });
        }
        while let Some(result) = tasks.join_next().await {
            result.unwrap().unwrap();
        }
        let order = db
            .query("SELECT sequence_num FROM turns ORDER BY sequence_num", &[])
            .await
            .unwrap();
        assert_eq!(
            order,
            (1..=16)
                .map(|n| vec![SqlValue::Integer(n)])
                .collect::<Vec<_>>()
        );
        assert_eq!(
            db.query("SELECT interaction_count FROM sessions", &[])
                .await
                .unwrap(),
            vec![vec![SqlValue::Integer(16)]]
        );
        db.close().await;
    }

    #[tokio::test]
    async fn failed_turn_writes_leave_neither_a_turn_nor_a_counter_change() {
        let (_tree, db) = turn_fixture(0).await;
        // First statement constraint, second statement constraint, missing
        // session and a mismatched project all fail without partial data.
        for (session, project, content) in [
            ("s", "p", "reject"),
            ("s", "p", "hello"),
            ("missing", "p", "hello"),
            ("s", "wrong", "hello"),
        ] {
            assert!(save_turn(&db, session, project, &user_turn(content))
                .await
                .is_err());
            assert!(db
                .query("SELECT id FROM turns", &[])
                .await
                .unwrap()
                .is_empty());
            assert_eq!(
                db.query("SELECT interaction_count FROM sessions", &[])
                    .await
                    .unwrap(),
                vec![vec![SqlValue::Integer(0)]]
            );
        }
        db.close().await;
    }

    #[test]
    fn tool_enabled_startup_never_creates_or_substitutes_a_workspace() {
        let tree = tempfile::tempdir().unwrap();
        let missing = tree.path().join("missing-project");
        assert!(prepare_workspace(&missing, false).is_err());
        assert!(!missing.exists());
        assert!(prepare_workspace(Path::new("relative-project"), false).is_err());
        let file = tree.path().join("file");
        std::fs::write(&file, "not a directory").unwrap();
        assert!(prepare_workspace(&file, false).is_err());
        assert!(prepare_workspace(tree.path(), false).is_ok());
    }

    #[test]
    fn talk_only_places_can_create_their_explicit_isolated_folder() {
        let tree = tempfile::tempdir().unwrap();
        let isolated = tree.path().join("room").join("place");
        prepare_workspace(&isolated, true).unwrap();
        assert!(isolated.is_dir());
    }

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
