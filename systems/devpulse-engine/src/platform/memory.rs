//! Your memory — what your agents remember, across sessions (plan 0001 B6.2).
//!
//! The kernel's persona service keeps it. This facade puts it in the user
//! database, which one process can hold, so memory has one owner however many
//! agents run at once: each session starts the shipped relay, which reaches
//! this process over a private pipe with a token bound to the session's
//! project.

use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::{Context, Result, anyhow};
use devpulse_clyffy::cortex::persistence::TursoAdapter;
use devpulse_clyffy::providers::ToolServer;
use devpulse_persona_mcp::bridge::{Bridge, EXECUTABLE, Grant};
use devpulse_persona_mcp::store::{PersonaBlock, PersonaScope, PersonaStore};
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
}

impl From<PersonaBlock> for MemoryNote {
    fn from(block: PersonaBlock) -> Self {
        Self {
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
        let blocks = self
            .store
            .list_blocks(scope_of(project_id), project_id, None, None, LIST_LIMIT)
            .await
            .map_err(|error| anyhow!("{error}"))?;
        Ok(blocks.into_iter().map(MemoryNote::from).collect())
    }

    /// Write a note. Your screens are not bound: this is you, not an agent.
    ///
    /// # Errors
    /// When its name is empty, it is over its limit, or it cannot be saved.
    pub async fn save(
        &self,
        project_id: Option<&str>,
        label: &str,
        body: &str,
    ) -> Result<MemoryNote> {
        let block = self
            .store
            .save_block(scope_of(project_id), project_id, label, body)
            .await
            .map_err(|error| anyhow!("{error}"))?;
        Ok(block.into())
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
    use devpulse_clyffy::providers::{AgentEvent, AgentSession, ProviderId, catalog};
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

        let yours = memory.save(None, "human", "prefers Rust").await.unwrap();
        assert_eq!(yours.project_id, None);
        assert_eq!(yours.version, 1);
        let alpha = memory
            .save(Some("alpha"), "facts", "uses Turso")
            .await
            .unwrap();
        assert_eq!(alpha.project_id.as_deref(), Some("alpha"));
        memory
            .save(Some("beta"), "facts", "uses Postgres")
            .await
            .unwrap();

        let saved_again = memory
            .save(None, "human", "prefers Rust 2024")
            .await
            .unwrap();
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
        let error = memory.save(None, "long", &over).await.unwrap_err();
        assert!(error.to_string().contains("char_limit"), "{error}");
        assert!(
            memory.save(None, "   ", "body").await.is_err(),
            "a blank name"
        );
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
            None,
            talk_only,
            vec![granted.server.clone()],
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
