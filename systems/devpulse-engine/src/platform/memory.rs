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
use devpulse_persona_mcp::store::PersonaStore;

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

    /// The memory itself, for `DevPulse`'s own screens.
    #[must_use]
    pub fn store(&self) -> &Arc<PersonaStore> {
        &self.store
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

    use devpulse_clyffy::cortex::persistence::TursoOptions;
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
        assert!(!value(PIPE_ENV).is_empty());

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
            .filter(|name| name.ends_with(".db"))
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
}
