//! Rooms — your agents seated in roles, sharing one conversation (plan 0001
//! B4.2).
//!
//! A room is a chat session (Turso `sessions`) whose places your agents
//! hold. `agenthub_room_threads` records which room of your library it is, who sits
//! where, and the token that continues each place's conversation. The kernel
//! runs it (`devpulse_clyffy::rooms`); this facade is its host: one live
//! conversation per place (opened through [`Agents`]), every turn saved in
//! `turns` with its place, role, phase and round in `metadata`, and the
//! run's events handed to the caller.
//!
//! A seat that only talks works in an empty folder of its own
//! (`{data_dir}/rooms/{session}/{place}`), its agent's tools are switched off
//! where the agent has a switch for that, and every permission it asks for
//! is refused.

use std::collections::{BTreeMap, HashMap};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use anyhow::{anyhow, bail, Context, Result};
use async_trait::async_trait;
use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlValue, TursoAdapter};
// IP-NOTE: room vocabulary only — room, seat, place, role, persona, turn;
// public names, no kernel internals.
use devpulse_clyffy::providers::AgentSession;
use devpulse_clyffy::rooms::{self as library, Issue, Place, RoomHost, RoomRun};
pub use devpulse_clyffy::rooms::{Assignment, Library, Outcome, RoomTurn};
use serde::{Deserialize, Serialize};
use specta::Type;
use tokio::sync::{mpsc, Mutex};
use uuid::Uuid;

use super::agents::{
    recovery, save_turn, save_turn_with_continuation, AgentEvent, Agents, ResumeUpdate, TurnRow,
};

/// A room of yours.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RoomThread {
    /// The chat session it is (load its turns with the chat's history).
    pub session_id: String,
    /// The project it belongs to.
    pub project_id: String,
    /// The library room it is (`council`).
    pub room_id: String,
    /// Its title.
    pub title: String,
    /// Who sits where.
    pub seating: Vec<Assignment>,
    /// How many turns it holds.
    pub turn_count: i64,
    /// Unix seconds of its last turn.
    pub updated_at: i64,
}

/// Something that happened while a room answers.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum RoomEvent {
    /// Part of one place's running turn.
    Agent {
        /// The place (`answerer-1`).
        place: String,
        /// What happened.
        event: AgentEvent,
    },
    /// A place's turn, finished and saved.
    Turn {
        /// The turn.
        turn: RoomTurn,
    },
    /// The room's answer: rounds run, why they stopped, what was picked.
    /// Saved.
    Finished {
        /// How it ended.
        outcome: Outcome,
    },
    /// The run could not be durably completed. Any recovery copy is named.
    Failed {
        /// The failure, not a successful room outcome.
        message: String,
    },
}

/// A room that is open: its run and the live conversation of each place.
struct LiveRoom {
    project_id: String,
    run: Arc<Mutex<RoomRun>>,
    places: Mutex<HashMap<String, Arc<AgentSession>>>,
    tokens: Mutex<BTreeMap<String, String>>,
    stopped: AtomicBool,
}

/// What `agenthub_room_threads` holds for a room.
struct RoomRecord {
    project_id: String,
    room_id: String,
    seating: Vec<Assignment>,
    tokens: BTreeMap<String, String>,
}

/// Your rooms.
pub struct Rooms {
    db: Arc<TursoAdapter>,
    data_dir: PathBuf,
    agents: Arc<Agents>,
    live: Mutex<HashMap<String, Arc<LiveRoom>>>,
}

/// Issues as one error, each on its own clause.
fn refusal(issues: &[Issue]) -> anyhow::Error {
    anyhow!(issues
        .iter()
        .map(ToString::to_string)
        .collect::<Vec<_>>()
        .join("; "))
}

impl Rooms {
    /// Rooms over the user database, opening conversations through `agents`.
    #[must_use]
    pub fn new(db: Arc<TursoAdapter>, data_dir: PathBuf, agents: Arc<Agents>) -> Self {
        Self {
            db,
            data_dir,
            agents,
            live: Mutex::new(HashMap::new()),
        }
    }

    fn sql(&self) -> &dyn SqlAdapter {
        self.db.as_ref()
    }

    /// Your library: the bundled roles and rooms, plus your files, with
    /// every file that did not pass named.
    #[must_use]
    pub fn library(&self) -> Library {
        library::load(&self.data_dir)
    }

    /// The rooms of a project, latest first.
    ///
    /// # Errors
    /// Returns an error if the user database cannot be read.
    pub async fn threads(&self, project_id: &str) -> Result<Vec<RoomThread>> {
        let rows = self
            .sql()
            .query(
                "SELECT s.id, s.project_id, r.room_id, COALESCE(s.title, ''), r.seating, \
                 (SELECT COUNT(*) FROM turns t WHERE t.session_id = s.id), s.updated_at \
                 FROM agenthub_room_threads r JOIN sessions s ON s.id = r.session_id \
                 WHERE s.project_id = ? ORDER BY s.updated_at DESC",
                &[project_id.into()],
            )
            .await
            .context("read rooms")?;
        Ok(rows
            .into_iter()
            .filter_map(|row| {
                let seating = row.get(4).and_then(SqlValue::as_text)?;
                Some(RoomThread {
                    session_id: row.first().and_then(SqlValue::as_text)?.to_owned(),
                    project_id: row.get(1).and_then(SqlValue::as_text)?.to_owned(),
                    room_id: row.get(2).and_then(SqlValue::as_text)?.to_owned(),
                    title: row.get(3).and_then(SqlValue::as_text)?.to_owned(),
                    seating: serde_json::from_str(seating).ok()?,
                    turn_count: row.get(5).and_then(SqlValue::as_integer).unwrap_or(0),
                    updated_at: row.get(6).and_then(SqlValue::as_integer).unwrap_or(0),
                })
            })
            .collect())
    }

    /// Open a room of your library in a project, with your agents seated.
    ///
    /// # Errors
    /// When the seating breaks the room's rules, an agent is not installed or
    /// you are signed out of it, or the user database cannot be written.
    pub async fn start(
        &self,
        project_id: &str,
        room_id: &str,
        seating: Vec<Assignment>,
    ) -> Result<RoomThread> {
        let library = self.library();
        let seated = library::seat(&library, room_id, &seating).map_err(|i| refusal(&i))?;
        for place in &seated.places {
            if !self.agents.installed(place.provider).await {
                bail!("{}: {} is not installed", place.key(), place.agent_name());
            }
            if self.agents.signed_out(place.provider).await {
                bail!(
                    "{}: {} is not signed in — sign in from Settings → Your AI",
                    place.key(),
                    place.agent_name()
                );
            }
        }
        let session_id = format!("sess-{}", Uuid::new_v4());
        let title = seated.room.name.clone();
        let seating_json = serde_json::to_string(&seating).context("write the seating")?;
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
                    "INSERT INTO agenthub_room_threads (session_id, room_id, seating) VALUES (?, ?, ?)",
                    vec![
                        session_id.as_str().into(),
                        room_id.into(),
                        seating_json.as_str().into(),
                    ],
                ),
            ])
            .await
            .context("create the room and its seating")?;
        tracing::info!(target: "rooms", %session_id, room = room_id, places = seated.places.len(), "room opened");
        Ok(RoomThread {
            session_id,
            project_id: project_id.to_owned(),
            room_id: room_id.to_owned(),
            title,
            seating,
            turn_count: 0,
            updated_at: 0,
        })
    }

    async fn record(&self, session_id: &str) -> Result<RoomRecord> {
        let rows = self
            .sql()
            .query(
                "SELECT s.project_id, r.room_id, r.seating, r.resume_tokens \
                 FROM agenthub_room_threads r JOIN sessions s ON s.id = r.session_id \
                 WHERE r.session_id = ? LIMIT 1",
                &[session_id.into()],
            )
            .await
            .context("read the room")?;
        let row = rows
            .first()
            .ok_or_else(|| anyhow!("{session_id} is not a room"))?;
        let text = |index: usize| row.get(index).and_then(SqlValue::as_text);
        Ok(RoomRecord {
            project_id: text(0).unwrap_or_default().to_owned(),
            room_id: text(1)
                .ok_or_else(|| anyhow!("{session_id}: no room"))?
                .to_owned(),
            seating: serde_json::from_str(text(2).unwrap_or("[]"))
                .context("read the room's seating")?,
            tokens: text(3)
                .and_then(|tokens| serde_json::from_str(tokens).ok())
                .unwrap_or_default(),
        })
    }

    /// The room's live state, opened on first use (seated again from your
    /// library as it is now).
    async fn live_room(&self, session_id: &str) -> Result<Arc<LiveRoom>> {
        let mut live = self.live.lock().await;
        if let Some(room) = live.get(session_id) {
            return Ok(Arc::clone(room));
        }
        let record = self.record(session_id).await?;
        let library = self.library();
        let seated =
            library::seat(&library, &record.room_id, &record.seating).map_err(|i| refusal(&i))?;
        let room = Arc::new(LiveRoom {
            project_id: record.project_id,
            run: Arc::new(Mutex::new(RoomRun::new(seated))),
            places: Mutex::new(HashMap::new()),
            tokens: Mutex::new(record.tokens),
            stopped: AtomicBool::new(false),
        });
        live.insert(session_id.to_owned(), Arc::clone(&room));
        Ok(room)
    }

    /// Ask the room a question. Your question and every turn are saved; the
    /// run's events arrive on the returned receiver, ending with
    /// [`RoomEvent::Finished`] only after saving, or [`RoomEvent::Failed`].
    ///
    /// # Errors
    /// When the question is empty, the room is unknown or still answering,
    /// or its seating no longer fits your library.
    pub async fn ask(
        &self,
        session_id: &str,
        question: &str,
    ) -> Result<mpsc::UnboundedReceiver<RoomEvent>> {
        let question = question.trim().to_owned();
        if question.is_empty() {
            bail!("the message is empty");
        }
        let room = self.live_room(session_id).await?;
        let Ok(mut run) = Arc::clone(&room.run).try_lock_owned() else {
            bail!("the room is still answering");
        };
        room.stopped.store(false, Ordering::SeqCst);
        save_turn(
            &self.db,
            session_id,
            &room.project_id,
            &TurnRow {
                role: "user",
                token_count: None,
                content: &question,
                model_used: None,
                finish_reason: None,
                latency_ms: None,
                metadata: None,
            },
        )
        .await?;
        let (out, receiver) = mpsc::unbounded_channel();
        let host = Host {
            db: Arc::clone(&self.db),
            data_dir: self.data_dir.clone(),
            agents: Arc::clone(&self.agents),
            room,
            session_id: session_id.to_owned(),
            out,
        };
        devpulse_telemetry::spawn(async move {
            match run.ask(&question, &host).await {
                Ok(outcome) => host.finish(outcome).await,
                Err(error) => {
                    let _ = host.out.send(RoomEvent::Failed {
                        message: format!("{error:#}"),
                    });
                }
            }
        });
        Ok(receiver)
    }

    /// Stop a room that is answering: every place's running turn ends, and
    /// no place is asked again until your next question.
    pub async fn cancel(&self, session_id: &str) {
        let room = self.live.lock().await.get(session_id).cloned();
        if let Some(room) = room {
            room.stopped.store(true, Ordering::SeqCst);
            let places: Vec<Arc<AgentSession>> =
                room.places.lock().await.values().cloned().collect();
            for session in places {
                session.cancel().await;
            }
        }
    }

    /// Answer a permission request of a place that may use tools (`None`
    /// refuses). Returns `false` when it is no longer waiting.
    pub async fn answer(
        &self,
        session_id: &str,
        place: &str,
        request: &str,
        choice: Option<String>,
    ) -> bool {
        let room = self.live.lock().await.get(session_id).cloned();
        let Some(room) = room else { return false };
        let session = room.places.lock().await.get(place).cloned();
        match session {
            Some(session) => session.answer(request, choice).await,
            None => false,
        }
    }

    /// End a room's live conversations (its history stays).
    pub async fn close(&self, session_id: &str) {
        let room = self.live.lock().await.remove(session_id);
        if let Some(room) = room {
            let places: Vec<Arc<AgentSession>> =
                room.places.lock().await.drain().map(|(_, s)| s).collect();
            for session in places {
                session.close().await;
            }
            tracing::info!(target: "rooms", %session_id, "room closed");
        }
    }
}

/// The host a room runs on: one live conversation per place, turns saved.
struct Host {
    db: Arc<TursoAdapter>,
    data_dir: PathBuf,
    agents: Arc<Agents>,
    room: Arc<LiveRoom>,
    session_id: String,
    out: mpsc::UnboundedSender<RoomEvent>,
}

impl Host {
    /// The place's live conversation, started on first use: a talk-only
    /// place in its own empty folder, any other in the project's.
    async fn conversation(&self, place: &Place) -> Result<Arc<AgentSession>> {
        let key = place.key();
        if let Some(session) = self.room.places.lock().await.get(&key) {
            return Ok(Arc::clone(session));
        }
        let talk_only = place.role.permissions.talk_only;
        let cwd = if talk_only {
            self.data_dir
                .join("rooms")
                .join(&self.session_id)
                .join(&key)
        } else {
            self.agents.folder(&self.room.project_id).await?
        };
        let resume = self.room.tokens.lock().await.get(&key).cloned();
        let session = Arc::new(
            self.agents
                .conversation(place.provider, &cwd, resume, talk_only)
                .await?,
        );
        self.room
            .places
            .lock()
            .await
            .insert(key.clone(), Arc::clone(&session));
        tracing::info!(target: "rooms", session_id = %self.session_id, place = %key, provider = place.provider.key(), talk_only, "place joined");
        Ok(session)
    }

    /// Save the run's end and say so.
    async fn finish(&self, outcome: Outcome) {
        let event = finish_outcome(
            &self.db,
            &self.data_dir,
            &self.session_id,
            &self.room.project_id,
            outcome,
        )
        .await;
        let _ = self.out.send(event);
    }
}

async fn finish_outcome(
    db: &TursoAdapter,
    data_dir: &std::path::Path,
    session_id: &str,
    project_id: &str,
    outcome: Outcome,
) -> RoomEvent {
    let metadata = serde_json::json!({ "roomOutcome": &outcome }).to_string();
    let turn = TurnRow {
        role: "system",
        token_count: None,
        content: "",
        model_used: None,
        finish_reason: Some("room-finished"),
        latency_ms: None,
        metadata: Some(&metadata),
    };
    if let Err(error) = save_turn(db, session_id, project_id, &turn).await {
        let message = recovery::retain(data_dir, session_id, project_id, &turn, None, &error).await;
        return RoomEvent::Failed { message };
    }
    let winner = outcome
        .pick
        .as_ref()
        .and_then(|p| p.winner_place.as_deref())
        .unwrap_or("none");
    tracing::info!(target: "rooms", %session_id, rounds = outcome.rounds, winner, "room answered");
    RoomEvent::Finished { outcome }
}

#[async_trait]
impl RoomHost for Host {
    async fn ask(&self, place: &Place, prompt: &str) -> Result<String> {
        if self.room.stopped.load(Ordering::SeqCst) {
            bail!("stopped");
        }
        let session = self.conversation(place).await?;
        let mut events = session.prompt(prompt).await?;
        let key = place.key();
        let mut text = String::new();
        while let Some(event) = events.recv().await {
            if let AgentEvent::PermissionAsked { request, title, .. } = &event {
                if place.role.permissions.talk_only {
                    tracing::info!(target: "rooms", place = %key, %title, "a talk-only place asked for a permission; refused");
                    session.answer(request, None).await;
                    continue;
                }
            }
            let ended = match &event {
                AgentEvent::Text { text: part } => {
                    text.push_str(part);
                    None
                }
                AgentEvent::TurnEnded { stop } if stop == "cancelled" => {
                    Some(Err(anyhow!("stopped")))
                }
                AgentEvent::TurnEnded { .. } => Some(Ok(())),
                AgentEvent::Failed { message } => Some(Err(anyhow!("{message}"))),
                _ => None,
            };
            let _ = self.out.send(RoomEvent::Agent {
                place: key.clone(),
                event,
            });
            if let Some(result) = ended {
                return result.map(|()| text);
            }
        }
        bail!("the agent stopped without ending its turn")
    }

    async fn record(&self, turn: &RoomTurn) -> Result<()> {
        let session = self.room.places.lock().await.get(&turn.place).cloned();
        let token = match session {
            Some(session) => session.resume_token().await,
            None => None,
        };
        // Serialize token-map updates through the transaction. A failed write
        // cannot advance the in-memory map or overwrite another place's token.
        let mut current = self.room.tokens.lock().await;
        let mut pending = current.clone();
        if let Some(token) = token {
            pending.insert(turn.place.clone(), token);
        }
        let tokens =
            serde_json::to_string(&pending).context("encode the room's continuation tokens")?;
        let continuation = ResumeUpdate::Room(&tokens);
        let metadata = serde_json::json!({ "room": turn }).to_string();
        let content = if turn.text.is_empty() {
            turn.failed.clone().unwrap_or_default()
        } else {
            turn.text.clone()
        };
        let row = TurnRow {
            role: "assistant",
            token_count: None,
            content: &content,
            model_used: Some(turn.provider.key()),
            finish_reason: Some(if turn.failed.is_some() {
                "failed"
            } else {
                "end_turn"
            }),
            latency_ms: None,
            metadata: Some(&metadata),
        };
        if let Err(error) = save_turn_with_continuation(
            &self.db,
            &self.session_id,
            &self.room.project_id,
            &row,
            Some(&continuation),
        )
        .await
        {
            let message = recovery::retain(
                &self.data_dir,
                &self.session_id,
                &self.room.project_id,
                &row,
                Some(&continuation),
                &error,
            )
            .await;
            bail!("{message}");
        }
        *current = pending;
        let _ = self.out.send(RoomEvent::Turn { turn: turn.clone() });
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, reason = "test assertions")]
    use super::*;
    use devpulse_clyffy::cortex::persistence::TursoOptions;

    #[tokio::test]
    async fn only_a_saved_room_outcome_reports_finished() {
        for limit in [0, 1] {
            let tree = tempfile::tempdir().unwrap();
            let schema = format!("CREATE TABLE sessions (id TEXT PRIMARY KEY, project_id TEXT,
                updated_at INTEGER DEFAULT 0, interaction_count INTEGER DEFAULT 0 CHECK(interaction_count <= {limit}));
                CREATE TABLE turns (id TEXT, session_id TEXT, project_id TEXT, role TEXT, content TEXT,
                sequence_num INTEGER, model_used TEXT, finish_reason TEXT, latency_ms INTEGER, metadata TEXT, token_count INTEGER);
                INSERT INTO sessions (id, project_id) VALUES ('s', 'p');");
            let db = TursoAdapter::open_with_schema(
                &tree.path().join("room.db"),
                &schema,
                TursoOptions::default(),
            )
            .await
            .unwrap();
            let outcome = Outcome {
                rounds: 1,
                stopped: library::Stopped::Rounds,
                pick: None,
                flips: vec![],
            };
            let event = finish_outcome(&db, tree.path(), "s", "p", outcome.clone()).await;
            if limit == 0 {
                let RoomEvent::Failed { message } = event else {
                    panic!("unsaved room outcome reported finished")
                };
                assert!(message.contains("Recovery copy:"));
                assert!(db
                    .query("SELECT id FROM turns", &[])
                    .await
                    .unwrap()
                    .is_empty());
                let path = std::fs::read_dir(tree.path().join("agenthub/recovery"))
                    .unwrap()
                    .next()
                    .unwrap()
                    .unwrap()
                    .path();
                let document: serde_json::Value =
                    serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap();
                let metadata: serde_json::Value =
                    serde_json::from_str(document["turn"]["metadata"].as_str().unwrap()).unwrap();
                assert_eq!(metadata["roomOutcome"]["rounds"], 1);
            } else {
                assert_eq!(event, RoomEvent::Finished { outcome });
                assert_eq!(
                    db.query("SELECT finish_reason FROM turns", &[])
                        .await
                        .unwrap(),
                    vec![vec!["room-finished".into()]]
                );
            }
            db.close().await;
        }
    }
}
