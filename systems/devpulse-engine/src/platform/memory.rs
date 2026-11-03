//! Your memory — what your agents remember, across sessions (plan 0001 B6.2).
//!
//! The kernel's persona service keeps it. This facade puts it in the user
//! database, which one process can hold, so memory has one owner however many
//! agents run at once: each session starts the shipped relay, which reaches
//! this process over a private pipe with a token bound to the session's
//! project. The notes you approve also go with every session unasked (plan
//! 0001 B6.3).

use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::{Context, Result, anyhow};
use devpulse_clyffy::cortex::persistence::TursoAdapter;
use devpulse_clyffy::providers::ToolServer;
use devpulse_persona_mcp::PersonaError;
use devpulse_persona_mcp::bridge::{Bridge, EXECUTABLE, Grant};
use devpulse_persona_mcp::error::PersonaResult;
use devpulse_persona_mcp::store::{Expected, PersonaBlock, PersonaScope, PersonaStore};
use serde::Serialize;
use specta::Type;

/// How many notes one list shows; memory is meant to stay short.
const LIST_LIMIT: usize = 1000;

/// One note your agents can read.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MemoryNote {
    /// The project it belongs to; `None` for your own, read in every project.
    pub project_id: Option<String>,
    /// Its name, unique in its place.
    pub label: String,
    /// What it says.
    pub body: String,
    /// The most characters it may hold.
    pub char_limit: u32,
    /// When it last changed (RFC 3339).
    pub updated_at: String,
    /// How many times it has been saved.
    pub version: u32,
    /// It goes with every session unasked: you approved this exact text.
    pub included: bool,
    /// You approved an earlier version, and it has been saved over since.
    pub changed_since_approved: bool,
}

impl MemoryNote {
    /// `approved` is the version of it you approved, if any.
    fn new(block: PersonaBlock, approved: Option<i64>) -> Self {
        Self {
            included: approved == Some(block.version),
            changed_since_approved: approved.is_some_and(|version| version != block.version),
            project_id: block.slug,
            label: block.label,
            body: block.body,
            char_limit: u32::try_from(block.char_limit).unwrap_or(u32::MAX),
            updated_at: block.updated_at,
            version: u32::try_from(block.version).unwrap_or(u32::MAX),
        }
    }
}

const fn scope_of(project_id: Option<&str>) -> PersonaScope {
    match project_id {
        Some(_) => PersonaScope::Project,
        None => PersonaScope::User,
    }
}

/// What became of a save of yours.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum MemorySave {
    /// It went through.
    Saved {
        /// The note as it now stands.
        note: MemoryNote,
    },
    /// The note moved on since you opened it, so nothing changed.
    Changed {
        /// What it says now; absent when it is gone.
        current: Option<MemoryNote>,
    },
}

/// What goes with a session in one project, exactly as an agent receives it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MemorySending {
    /// The text sent; absent when no note goes.
    pub text: Option<String>,
    /// The notes you approved that did not fit, by name.
    pub left_out: Vec<String>,
    /// How many characters of notes go.
    pub used: u32,
    /// The most that can go.
    pub limit: u32,
}

/// What one session is given: the server its agent starts, and the grant that
/// must live as long as the session.
pub struct SessionMemory {
    /// The server, for the agent to start.
    pub server: ToolServer,
    /// Its token's lifetime: dropping this ends the session's access.
    pub grant: Grant,
}

/// Your memory, owned by this process.
pub struct Memory {
    store: Arc<PersonaStore>,
    bridge: Bridge,
    relay: Option<PathBuf>,
}

impl Memory {
    /// Put the memory in `db`, and start serving sessions.
    ///
    /// # Errors
    /// When its tables cannot be created or its pipe cannot be opened.
    pub async fn start(db: Arc<TursoAdapter>) -> Result<Self> {
        let relay = beside_this_program()
            .map_err(|error| tracing::warn!(target: "memory", %error, "no path for the relay"))
            .ok();
        Self::start_with(db, relay).await
    }

    async fn start_with(db: Arc<TursoAdapter>, relay: Option<PathBuf>) -> Result<Self> {
        let store = PersonaStore::over(db)
            .await
            .map_err(|error| anyhow!("{error}"))
            .context("create the memory tables")?;
        let bridge = Bridge::start(Arc::clone(&store))?;
        tracing::info!(target: "memory", "memory is ready for agent sessions");
        Ok(Self {
            store,
            bridge,
            relay,
        })
    }

    /// The memory itself.
    #[must_use]
    pub fn store(&self) -> &Arc<PersonaStore> {
        &self.store
    }

    /// Your own notes (`project_id` `None`) or one project's, newest first.
    ///
    /// # Errors
    /// When the memory cannot be read.
    pub async fn notes(&self, project_id: Option<&str>) -> Result<Vec<MemoryNote>> {
        let scope = scope_of(project_id);
        let blocks = self
            .store
            .list_blocks(scope, project_id, None, None, LIST_LIMIT)
            .await
            .map_err(|error| anyhow!("{error}"))?;
        let approved = self
            .store
            .approved_versions(scope, project_id)
            .await
            .map_err(|error| anyhow!("{error}"))?;
        Ok(blocks
            .into_iter()
            .map(|block| {
                let version = approved.get(&block.label).copied();
                MemoryNote::new(block, version)
            })
            .collect())
    }

    /// Write a note. `expected_version` is the version you were looking at, or
    /// `None` for a new note; if the note is not as you saw it, nothing changes.
    /// `include` says whether this text goes with every session. Your screens
    /// are not bound: this is you, not an agent.
    ///
    /// # Errors
    /// When its name is empty, it is over its limit, or it cannot be saved.
    pub async fn save(
        &self,
        project_id: Option<&str>,
        label: &str,
        body: &str,
        expected_version: Option<u32>,
        include: bool,
    ) -> Result<MemorySave> {
        let expected = expected_version.map_or(Expected::Nothing, |version| {
            Expected::Version(i64::from(version))
        });
        let saved = self
            .store
            .save_yours(
                scope_of(project_id),
                project_id,
                label,
                body,
                expected,
                include,
            )
            .await;
        self.outcome(project_id, label, saved).await
    }

    /// Say whether the note at `version` goes with every session. You approve
    /// the text you read: if it has changed since, nothing changes.
    ///
    /// # Errors
    /// When the memory cannot be changed.
    pub async fn set_included(
        &self,
        project_id: Option<&str>,
        label: &str,
        version: u32,
        include: bool,
    ) -> Result<MemorySave> {
        let changed = self
            .store
            .set_included(
                scope_of(project_id),
                project_id,
                label,
                i64::from(version),
                include,
            )
            .await;
        self.outcome(project_id, label, changed).await
    }

    async fn outcome(
        &self,
        project_id: Option<&str>,
        label: &str,
        result: PersonaResult<PersonaBlock>,
    ) -> Result<MemorySave> {
        match result {
            Ok(block) => Ok(MemorySave::Saved {
                note: self.note(project_id, block).await?,
            }),
            Err(PersonaError::Conflict(_) | PersonaError::NotFound(_)) => {
                let current = self
                    .notes(project_id)
                    .await?
                    .into_iter()
                    .find(|note| note.label == label);
                Ok(MemorySave::Changed { current })
            }
            Err(error) => Err(anyhow!("{error}")),
        }
    }

    async fn note(&self, project_id: Option<&str>, block: PersonaBlock) -> Result<MemoryNote> {
        let approved = self
            .store
            .approved_versions(scope_of(project_id), project_id)
            .await
            .map_err(|error| anyhow!("{error}"))?;
        let version = approved.get(&block.label).copied();
        Ok(MemoryNote::new(block, version))
    }

    /// What goes with a session in `project_id`, for you to read.
    ///
    /// # Errors
    /// When the memory cannot be read.
    pub async fn sending(&self, project_id: &str) -> Result<MemorySending> {
        let notes = self
            .store
            .session_notes(project_id)
            .await
            .map_err(|error| anyhow!("{error}"))?;
        Ok(MemorySending {
            text: notes.text(),
            left_out: notes.left_out.iter().map(|n| n.label.clone()).collect(),
            used: u32::try_from(notes.used()).unwrap_or(u32::MAX),
            limit: u32::try_from(notes.limit).unwrap_or(u32::MAX),
        })
    }

    /// The text that goes with a session in `project_id`. A session still runs
    /// when it cannot be read, without your notes, and the log says why.
    pub async fn session_text(&self, project_id: &str) -> Option<String> {
        match self.store.session_notes(project_id).await {
            Ok(notes) => notes.text(),
            Err(error) => {
                tracing::warn!(
                    target: "memory",
                    %error,
                    "your notes could not be read; this session starts without them"
                );
                None
            }
        }
    }

    /// Delete a note; returns whether there was one.
    ///
    /// # Errors
    /// When the memory cannot be changed.
    pub async fn remove(&self, project_id: Option<&str>, label: &str) -> Result<bool> {
        self.store
            .delete_block(scope_of(project_id), project_id, label)
            .await
            .map_err(|error| anyhow!("{error}"))
    }

    /// A session's way in, bound to `project_id`. `None` when the shipped
    /// relay is missing: the session still runs, without memory, and the log
    /// says why.
    #[must_use]
    pub fn for_session(&self, project_id: &str) -> Option<SessionMemory> {
        let relay = self.relay.as_deref().filter(|relay| {
            let present = relay.is_file();
            if !present {
                tracing::warn!(
                    target: "memory",
                    relay = %relay.display(),
                    "the memory relay is missing; this session runs without memory"
                );
            }
            present
        })?;
        Some(self.grant(project_id, relay))
    }

    fn grant(&self, project_id: &str, relay: &Path) -> SessionMemory {
        let grant = self.bridge.grant(project_id);
        SessionMemory {
            server: self.bridge.tool_server(&grant, relay),
            grant,
        }
    }
}

/// The relay ships beside this executable, like every bundled runtime; `PATH`
/// and the checkout are never searched.
fn beside_this_program() -> Result<PathBuf> {
    let current = std::env::current_exe().context("locate the DevPulse executable")?;
    let directory = current
        .parent()
        .context("the DevPulse executable has no parent folder")?;
    Ok(directory.join(EXECUTABLE))
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use std::time::Duration;

    use devpulse_clyffy::cortex::persistence::TursoOptions;
    use devpulse_clyffy::providers::discovery::installed;
    use devpulse_clyffy::providers::{AgentEvent, AgentSession, ProviderId, SessionSetup, catalog};
    use devpulse_persona_mcp::bridge::{PIPE_ENV, TOKEN_ENV};
    use devpulse_persona_mcp::store::PersonaScope;

    use super::*;

    async fn database(dir: &tempfile::TempDir) -> Arc<TursoAdapter> {
        Arc::new(
            TursoAdapter::open_with_schema(
                &dir.path().join("user.db"),
                "",
                TursoOptions::default(),
            )
            .await
            .unwrap(),
        )
    }

    fn saved(outcome: MemorySave) -> MemoryNote {
        match outcome {
            MemorySave::Saved { note } => note,
            MemorySave::Changed { current } => panic!("not saved; it is now {current:?}"),
        }
    }

    fn present_relay(dir: &tempfile::TempDir) -> PathBuf {
        let relay = dir.path().join(EXECUTABLE);
        std::fs::write(&relay, "fixture").unwrap();
        relay
    }

    #[tokio::test]
    async fn a_session_gets_the_relay_with_its_own_token() {
        let dir = tempfile::tempdir().unwrap();
        let relay = present_relay(&dir);
        let memory = Memory::start_with(database(&dir).await, Some(relay.clone()))
            .await
            .unwrap();

        let session = memory.for_session("alpha").expect("a way in");
        assert_eq!(session.server.command, relay);
        let value = |name: &str| {
            session
                .server
                .env
                .iter()
                .find(|(key, _)| key == name)
                .map(|(_, value)| value.clone())
                .expect(name)
        };
        assert_eq!(value(TOKEN_ENV), session.grant.token());
        assert_ne!(value(PIPE_ENV), "");

        let other = memory.for_session("alpha").expect("a way in");
        assert_ne!(session.grant.token(), other.grant.token());
    }

    #[tokio::test]
    async fn a_missing_relay_means_no_memory_and_not_a_failed_session() {
        let dir = tempfile::tempdir().unwrap();
        let memory = Memory::start_with(database(&dir).await, Some(dir.path().join("gone.exe")))
            .await
            .unwrap();
        assert!(memory.for_session("alpha").is_none());

        let unknown = Memory::start_with(database(&dir).await, None)
            .await
            .unwrap();
        assert!(unknown.for_session("alpha").is_none());
    }

    #[tokio::test]
    async fn memory_lives_in_the_database_it_is_given_and_outlasts_a_restart() {
        let dir = tempfile::tempdir().unwrap();
        let db = database(&dir).await;
        db.connect()
            .unwrap()
            .execute("CREATE TABLE host_table (id INTEGER PRIMARY KEY)", ())
            .await
            .unwrap();
        {
            let memory = Memory::start_with(Arc::clone(&db), None).await.unwrap();
            memory
                .store()
                .save_block(PersonaScope::User, None, "human", "prefers Rust")
                .await
                .unwrap();
        }
        // Its tables sit beside the owner's, in the one file.
        let connection = db.connect().unwrap();
        let mut rows = connection
            .query(
                "SELECT count(*) FROM sqlite_master WHERE name IN ('host_table', 'persona_blocks')",
                (),
            )
            .await
            .unwrap();
        let row = rows.next().await.unwrap().expect("a count");
        assert_eq!(row.get::<i64>(0).unwrap(), 2);
        drop(rows);
        drop(connection);
        let names: Vec<_> = std::fs::read_dir(dir.path())
            .unwrap()
            .map(|entry| entry.unwrap().file_name().to_string_lossy().into_owned())
            .filter(|name| {
                Path::new(name)
                    .extension()
                    .is_some_and(|extension| extension.eq_ignore_ascii_case("db"))
            })
            .collect();
        assert_eq!(names, ["user.db"], "no parallel database file");

        drop(db);
        let reopened = Memory::start_with(database(&dir).await, None)
            .await
            .unwrap();
        let block = reopened
            .store()
            .get_block(PersonaScope::User, None, "human")
            .await
            .unwrap();
        assert_eq!(block.body, "prefers Rust");
    }

    #[tokio::test]
    async fn your_screens_read_write_and_delete_notes_in_their_place() {
        let dir = tempfile::tempdir().unwrap();
        let memory = Memory::start_with(database(&dir).await, None)
            .await
            .unwrap();

        let yours = saved(
            memory
                .save(None, "human", "prefers Rust", None, true)
                .await
                .unwrap(),
        );
        assert_eq!(yours.project_id, None);
        assert_eq!(yours.version, 1);
        let alpha = saved(
            memory
                .save(Some("alpha"), "facts", "uses Turso", None, true)
                .await
                .unwrap(),
        );
        assert_eq!(alpha.project_id.as_deref(), Some("alpha"));
        memory
            .save(Some("beta"), "facts", "uses Postgres", None, true)
            .await
            .unwrap();

        let saved_again = saved(
            memory
                .save(None, "human", "prefers Rust 2024", Some(1), true)
                .await
                .unwrap(),
        );
        assert_eq!(saved_again.version, 2);

        let bodies =
            |notes: Vec<MemoryNote>| notes.into_iter().map(|note| note.body).collect::<Vec<_>>();
        assert_eq!(
            bodies(memory.notes(None).await.unwrap()),
            ["prefers Rust 2024"]
        );
        assert_eq!(
            bodies(memory.notes(Some("alpha")).await.unwrap()),
            ["uses Turso"]
        );

        assert!(memory.remove(Some("alpha"), "facts").await.unwrap());
        assert!(!memory.remove(Some("alpha"), "facts").await.unwrap());
        assert_eq!(memory.notes(Some("alpha")).await.unwrap(), []);
        assert_eq!(
            bodies(memory.notes(Some("beta")).await.unwrap()),
            ["uses Postgres"]
        );

        let over = "x".repeat(5001);
        let error = memory
            .save(None, "long", &over, None, true)
            .await
            .unwrap_err();
        assert!(error.to_string().contains("char_limit"), "{error}");
        assert!(
            memory.save(None, "   ", "body", None, true).await.is_err(),
            "a blank name"
        );
    }

    #[tokio::test]
    async fn your_screens_see_which_notes_go_and_exactly_what_is_sent() {
        let dir = tempfile::tempdir().unwrap();
        let memory = Memory::start_with(database(&dir).await, None)
            .await
            .unwrap();
        memory
            .save(None, "preferences", "Prefers Rust.", None, true)
            .await
            .unwrap();
        memory
            .save(Some("alpha"), "stack", "Tauri.", None, true)
            .await
            .unwrap();
        memory
            .save(Some("alpha"), "private", "Keep back.", None, false)
            .await
            .unwrap();

        let notes = memory.notes(Some("alpha")).await.unwrap();
        let note = |label: &str| notes.iter().find(|note| note.label == label).unwrap();
        assert!(note("stack").included);
        assert!(!note("private").included);
        assert!(!note("private").changed_since_approved);

        let sending = memory.sending("alpha").await.unwrap();
        let text = sending.text.clone().unwrap();
        assert!(text.contains("Prefers Rust."), "{text}");
        assert!(text.contains("Tauri."), "{text}");
        assert!(!text.contains("Keep back."), "{text}");
        assert_eq!(memory.session_text("alpha").await.unwrap(), text);
        assert_eq!(sending.left_out, Vec::<String>::new());
        assert!(sending.used > 0 && sending.used <= sending.limit);

        assert_eq!(
            memory.sending("beta").await.unwrap().text.unwrap(),
            memory.session_text("beta").await.unwrap(),
        );
        assert!(
            !memory
                .session_text("beta")
                .await
                .unwrap()
                .contains("Tauri."),
            "another project's notes must not go"
        );
    }

    #[tokio::test]
    async fn a_note_an_agent_changed_says_so_and_your_stale_save_changes_nothing() {
        let dir = tempfile::tempdir().unwrap();
        let memory = Memory::start_with(database(&dir).await, None)
            .await
            .unwrap();
        memory
            .save(Some("alpha"), "stack", "Tauri.", None, true)
            .await
            .unwrap();
        // An agent saves over it, the way MCP does.
        memory
            .store()
            .save_idempotent(
                PersonaScope::Project,
                Some("alpha"),
                "stack",
                "Agent text.",
                "key",
            )
            .await
            .unwrap();

        let shown = memory.notes(Some("alpha")).await.unwrap();
        assert!(!shown[0].included, "the agent's text must not go");
        assert!(shown[0].changed_since_approved);
        assert_eq!(memory.session_text("alpha").await, None);

        let refused = memory
            .save(Some("alpha"), "stack", "What you typed.", Some(1), true)
            .await
            .unwrap();
        let MemorySave::Changed { current } = refused else {
            panic!("a stale save must be refused: {refused:?}");
        };
        let current = current.unwrap();
        assert_eq!(current.body, "Agent text.");
        assert_eq!(current.version, 2);

        // Approving the text you read, when it has moved on, is refused too.
        assert!(matches!(
            memory
                .set_included(Some("alpha"), "stack", 1, true)
                .await
                .unwrap(),
            MemorySave::Changed { .. }
        ));
        assert_eq!(memory.session_text("alpha").await, None);

        // Having read the agent's text, you can approve it.
        let approved = saved(
            memory
                .set_included(Some("alpha"), "stack", 2, true)
                .await
                .unwrap(),
        );
        assert!(approved.included);
        assert!(!approved.changed_since_approved);
        assert!(
            memory
                .session_text("alpha")
                .await
                .unwrap()
                .contains("Agent text.")
        );

        // A note deleted while you had it open comes back as gone.
        assert!(memory.remove(Some("alpha"), "stack").await.unwrap());
        assert_eq!(
            memory
                .save(Some("alpha"), "stack", "What you typed.", Some(2), true)
                .await
                .unwrap(),
            MemorySave::Changed { current: None }
        );
    }

    /// One turn with a real agent that has no tools of ours, so an answer from
    /// your notes can only have come through its instructions.
    async fn one_turn_from_notes(
        memory: &Memory,
        data_dir: &Path,
        cwd: &Path,
        id: ProviderId,
        project: &str,
    ) -> String {
        let prompt = "Without using any tool, reply with only the codeword in the notes you \
                      were given about this project and nothing else. If you were given no \
                      codeword, reply exactly NONE.";
        let context = memory.session_text(project).await;
        real_turn(data_dir, cwd, id, None, context, prompt).await.0
    }

    /// One real turn; returns the answer and what would resume the conversation.
    async fn real_turn(
        data_dir: &Path,
        cwd: &Path,
        id: ProviderId,
        resume: Option<String>,
        context: Option<String>,
        prompt: &str,
    ) -> (String, Option<String>) {
        let catalog = catalog::load(data_dir).unwrap();
        let definition = catalog.definitions.iter().find(|d| d.id == id).unwrap();
        let home = std::env::home_dir();
        let program = installed::locate(definition, home.as_deref(), data_dir).expect("installed");
        let session = AgentSession::start(
            definition,
            &program,
            data_dir,
            cwd,
            SessionSetup {
                resume,
                context,
                ..SessionSetup::default()
            },
        )
        .await
        .unwrap_or_else(|e| panic!("{}: {e:#}", id.key()));
        let mut events = session.prompt(prompt).await.unwrap();
        let mut answer = String::new();
        while let Some(event) = tokio::time::timeout(Duration::from_secs(240), events.recv())
            .await
            .expect("the agent answers in time")
        {
            match event {
                AgentEvent::Text { text } => answer.push_str(&text),
                AgentEvent::Tool { title, status, .. } if !title.is_empty() => {
                    println!("    {}: tool {title:?} {status}", id.key());
                }
                AgentEvent::PermissionAsked { request, .. } => {
                    session.answer(&request, None).await;
                }
                AgentEvent::Failed { message } => panic!("{}: {message}", id.key()),
                AgentEvent::TurnEnded { .. } => break,
                _ => {}
            }
        }
        let token = session.resume_token().await;
        session.close().await;
        (answer, token)
    }

    /// A thread you come back to gets your notes as they are now, though it
    /// started before they existed: after a restart every thread resumes.
    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    #[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
    async fn real_agents_get_your_notes_when_a_thread_resumes() {
        let data_dir = PathBuf::from(std::env::var("DEVPULSE_DATA_DIR").expect("data folder"));
        let scratch = tempfile::tempdir().unwrap();
        let memory = Memory::start_with(database(&scratch).await, None)
            .await
            .unwrap();
        let cwd = scratch.path().join("workspace");
        std::fs::create_dir_all(&cwd).unwrap();
        let id = uuid::Uuid::now_v7().simple().to_string();
        let codeword = format!("plum-{}", &id[id.len() - 8..]);
        for agent in [ProviderId::ClaudeCode, ProviderId::Codex] {
            let (first, token) = real_turn(
                &data_dir,
                &cwd,
                agent,
                None,
                None,
                "Reply with exactly OK and nothing else.",
            )
            .await;
            println!("{}, a first turn with no notes: {first:?}", agent.key());
            memory
                .save(
                    Some("alpha"),
                    agent.key(),
                    &format!("The codeword is {codeword}."),
                    None,
                    true,
                )
                .await
                .unwrap();
            let (answer, _) = real_turn(
                &data_dir,
                &cwd,
                agent,
                Some(token.expect("something to resume")),
                memory.session_text("alpha").await,
                "Without using any tool, reply with only the codeword in the notes you were \
                 given about this project and nothing else. If you were given no codeword, \
                 reply exactly NONE.",
            )
            .await;
            println!(
                "{}, resumed, with notes added since: {answer:?}",
                agent.key()
            );
            assert!(answer.contains(&codeword), "{}: {answer:?}", agent.key());
        }
    }

    /// Your notes reach real agents unasked: only what you approved, only in its
    /// own project, and not once an agent has changed it. Uses a throwaway
    /// database. Run as `real_agents_answer_from_memory_within_their_project` is.
    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    #[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
    async fn real_agents_get_the_notes_you_approved_unasked() {
        let data_dir = PathBuf::from(std::env::var("DEVPULSE_DATA_DIR").expect("data folder"));
        let scratch = tempfile::tempdir().unwrap();
        let memory = Memory::start_with(database(&scratch).await, None)
            .await
            .unwrap();
        let word = |prefix: &str| {
            let id = uuid::Uuid::now_v7().simple().to_string();
            format!("{prefix}-{}", &id[id.len() - 8..])
        };
        let (approved, held_back) = (word("plum"), word("fig"));
        let note = |codeword: &str| format!("The codeword is {codeword}.");
        memory
            .save(Some("alpha"), "facts", &note(&approved), None, true)
            .await
            .unwrap();
        memory
            .save(Some("beta"), "facts", &note(&held_back), None, false)
            .await
            .unwrap();
        let cwd = scratch.path().join("workspace");
        std::fs::create_dir_all(&cwd).unwrap();

        for id in [ProviderId::ClaudeCode, ProviderId::Codex] {
            let answer = one_turn_from_notes(&memory, &data_dir, &cwd, id, "alpha").await;
            println!("{}, an approved note: {answer:?}", id.key());
            assert!(answer.contains(&approved), "{}: {answer:?}", id.key());

            let answer = one_turn_from_notes(&memory, &data_dir, &cwd, id, "beta").await;
            println!("{}, a note held back: {answer:?}", id.key());
            assert!(!answer.contains(&held_back), "{}: {answer:?}", id.key());
            assert!(!answer.contains(&approved), "{}: {answer:?}", id.key());
        }

        // An agent changes the approved note: its new text must not go.
        let planted = word("nettle");
        memory
            .store()
            .save_idempotent(
                PersonaScope::Project,
                Some("alpha"),
                "facts",
                &note(&planted),
                "agent-write",
            )
            .await
            .unwrap();
        for id in [ProviderId::ClaudeCode, ProviderId::Codex] {
            let answer = one_turn_from_notes(&memory, &data_dir, &cwd, id, "alpha").await;
            println!("{}, a note an agent changed: {answer:?}", id.key());
            assert!(!answer.contains(&planted), "{}: {answer:?}", id.key());
        }
    }

    /// One turn with a real agent, in a session offered this memory. Only a
    /// request to use the memory is allowed; anything else is refused.
    async fn one_turn(
        memory: &Memory,
        data_dir: &Path,
        cwd: &Path,
        id: ProviderId,
        project: &str,
        talk_only: bool,
        prompt: &str,
    ) -> String {
        let catalog = catalog::load(data_dir).unwrap();
        let definition = catalog.definitions.iter().find(|d| d.id == id).unwrap();
        let home = std::env::home_dir();
        let program = installed::locate(definition, home.as_deref(), data_dir).expect("installed");
        let granted = memory.for_session(project).expect("the relay");
        let mut session = AgentSession::start(
            definition,
            &program,
            data_dir,
            cwd,
            SessionSetup {
                talk_only,
                tools: vec![granted.server.clone()],
                ..SessionSetup::default()
            },
        )
        .await
        .unwrap_or_else(|e| panic!("{}: {e:#}", id.key()));
        session.retain(granted.grant);
        let mut events = session.prompt(prompt).await.unwrap();
        let mut answer = String::new();
        while let Some(event) = tokio::time::timeout(Duration::from_secs(240), events.recv())
            .await
            .expect("the agent answers in time")
        {
            match event {
                AgentEvent::Text { text } => answer.push_str(&text),
                AgentEvent::Tool { title, status, .. } if !title.is_empty() => {
                    println!("    {}: tool {title:?} {status}", id.key());
                }
                AgentEvent::PermissionAsked {
                    request,
                    title,
                    choices,
                } => {
                    let memory_tool = title.contains("persona") || title.contains("memory");
                    println!("    {}: asked {title:?}, allowed {memory_tool}", id.key());
                    let choice = choices
                        .iter()
                        .find(|choice| choice.allows && memory_tool)
                        .map(|choice| choice.id.clone());
                    session.answer(&request, choice).await;
                }
                AgentEvent::Failed { message } => panic!("{}: {message}", id.key()),
                AgentEvent::TurnEnded { .. } => break,
                _ => {}
            }
        }
        session.close().await;
        answer
    }

    /// The whole path with real agents and a throwaway database: your real
    /// memory is not touched. The codewords exist only in that database, so a
    /// right answer can only come through the tools. Run with
    /// `DEVPULSE_DATA_DIR=<the DevPulse data folder>
    /// DEVPULSE_MEMORY_RELAY=<the built devpulse-persona-mcp> cargo test -p
    /// devpulse-engine --lib real_agents -- --ignored --nocapture`, outside a
    /// Claude Code session (or with `CLAUDECODE` unset, as `DevPulse` runs).
    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    #[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
    async fn real_agents_answer_from_memory_within_their_project() {
        let data_dir = PathBuf::from(std::env::var("DEVPULSE_DATA_DIR").expect("data folder"));
        let relay = PathBuf::from(std::env::var("DEVPULSE_MEMORY_RELAY").expect("relay"));
        let scratch = tempfile::tempdir().unwrap();
        let memory = Memory::start_with(database(&scratch).await, Some(relay))
            .await
            .unwrap();
        let word = |prefix: &str| {
            let id = uuid::Uuid::now_v7().simple().to_string();
            format!("{prefix}-{}", &id[id.len() - 8..])
        };
        let (alpha, beta) = (word("plum"), word("fig"));
        for (project, codeword) in [("alpha", &alpha), ("beta", &beta)] {
            memory
                .store()
                .save_block(
                    PersonaScope::Project,
                    Some(project),
                    "facts",
                    &format!("The codeword is {codeword}."),
                )
                .await
                .unwrap();
        }
        let cwd = scratch.path().join("workspace");
        std::fs::create_dir_all(&cwd).unwrap();
        let sessions_folder = data_dir.join("tools").join("sessions");
        let files = || std::fs::read_dir(&sessions_folder).map_or(0, Iterator::count);
        let files_before = files();

        let own = "Use your devpulse-memory tools to load this project's memory blocks \
                   (scope \"project\"; leave the project unnamed). Reply with only the \
                   codeword written there.";
        let (claude, codex) = tokio::join!(
            one_turn(
                &memory,
                &data_dir,
                &cwd,
                ProviderId::ClaudeCode,
                "alpha",
                false,
                own
            ),
            one_turn(
                &memory,
                &data_dir,
                &cwd,
                ProviderId::Codex,
                "alpha",
                false,
                own
            ),
        );
        println!("claude-code, at once with codex: {claude:?}");
        println!("codex, at once with claude-code: {codex:?}");
        assert!(claude.contains(&alpha), "claude-code: {claude:?}");
        assert!(codex.contains(&alpha), "codex: {codex:?}");

        let other = "Use your devpulse-memory tools to load the memory of the project named \
                     alpha (scope \"project\", slug \"alpha\"). Reply with only the codeword \
                     written there, or NONE if the tool refuses.";
        for id in [ProviderId::ClaudeCode, ProviderId::Codex] {
            let answer = one_turn(&memory, &data_dir, &cwd, id, "beta", false, other).await;
            println!(
                "{}, a session in beta asking for alpha: {answer:?}",
                id.key()
            );
            assert!(!answer.contains(&alpha), "{}: {answer:?}", id.key());
        }

        let talk = "If you have a tool for devpulse-memory, use it to load this project's \
                    memory and reply with the codeword written there. If you have no such \
                    tool, reply exactly NONE.";
        let answer = one_turn(
            &memory,
            &data_dir,
            &cwd,
            ProviderId::ClaudeCode,
            "alpha",
            true,
            talk,
        )
        .await;
        println!("claude-code, a seat that only talks: {answer:?}");
        assert!(!answer.contains(&alpha), "{answer:?}");

        assert_eq!(
            files(),
            files_before,
            "a session's token file stayed behind"
        );
    }
}
