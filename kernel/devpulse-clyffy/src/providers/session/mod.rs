//! Conversations with your agents (plan 0001 B3.2): one live session per
//! chat thread.
//!
//! An ACP agent (Codex through its connector, Gemini CLI, Cursor CLI, Grok
//! Build) keeps one process and one ACP session open for the whole thread:
//! every prompt is a `session/prompt` on it, and its `session/update` stream
//! becomes [`AgentEvent`]s ([`acp`]). A headless agent (Claude Code,
//! Antigravity CLI) runs its own program once per turn in its headless mode;
//! the session id it reports on the first turn is handed back on later
//! turns, so it keeps the conversation — its definition's
//! `connect.conversation` says how ([`headless`]). Either way the vendor's
//! own program does the work under your own login.
//!
//! A permission an agent asks for during a turn arrives as
//! [`AgentEvent::PermissionAsked`]; [`AgentSession::answer`] gives your
//! choice, and a request nobody answers is refused after
//! [`PERMISSION_WAIT`].

pub mod acp;
pub mod headless;

use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::{Result, bail};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

use super::connect;
use super::definition::ProviderDefinition;
use super::types::AgentProtocol;

/// How long a permission request waits for your answer before it is refused.
pub const PERMISSION_WAIT: Duration = Duration::from_mins(10);

/// One choice of a permission request, as the agent worded it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct PermissionChoice {
    /// The agent's id for it.
    pub id: String,
    /// What the agent calls it.
    pub label: String,
    /// It allows the action (as opposed to refusing it).
    pub allows: bool,
}

/// Something that happened during a turn.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum AgentEvent {
    /// Part of its answer.
    Text {
        /// The text, as it arrived.
        text: String,
    },
    /// Part of its reasoning, when it shares it.
    Thought {
        /// The text, as it arrived.
        text: String,
    },
    /// A tool it is using (reading a file, running a command, …).
    Tool {
        /// The agent's id for this use of the tool.
        id: String,
        /// What it is doing, in its words (empty on a status-only update).
        title: String,
        /// `pending`, `running`, `done` or `failed`.
        status: String,
    },
    /// It asks for permission; answer with [`AgentSession::answer`].
    PermissionAsked {
        /// Pass this back with your answer.
        request: String,
        /// What it wants to do.
        title: String,
        /// The choices it offers.
        choices: Vec<PermissionChoice>,
    },
    /// A permission was answered, expired or withdrawn; it is no longer actionable.
    PermissionResolved {
        /// The request being removed.
        request: String,
    },
    /// The turn finished (`end_turn`, `cancelled`, `max_tokens`, …).
    TurnEnded {
        /// Why it stopped.
        stop: String,
    },
    /// The turn could not run or failed, in the agent's own words.
    Failed {
        /// What went wrong.
        message: String,
    },
}

impl AgentEvent {
    /// The turn is over after this event.
    #[must_use]
    pub const fn ends_turn(&self) -> bool {
        matches!(self, Self::TurnEnded { .. } | Self::Failed { .. })
    }
}

/// The events of one turn, ending with [`AgentEvent::TurnEnded`] or
/// [`AgentEvent::Failed`].
pub type TurnEvents = mpsc::UnboundedReceiver<AgentEvent>;

/// A stdio MCP server an agent may use during a conversation: `DevPulse`'s
/// memory (plan 0001 B6.2). Its environment can hold a session's token, so a
/// debug print names the variables and not their values.
#[derive(Clone, PartialEq, Eq)]
pub struct ToolServer {
    /// What the agent calls it.
    pub name: String,
    /// The program the agent starts.
    pub command: PathBuf,
    /// Its arguments.
    pub args: Vec<String>,
    /// Its environment.
    pub env: Vec<(String, String)>,
}

impl std::fmt::Debug for ToolServer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ToolServer")
            .field("name", &self.name)
            .field("command", &self.command)
            .field("args", &self.args)
            .field(
                "env",
                &self.env.iter().map(|(name, _)| name).collect::<Vec<_>>(),
            )
            .finish()
    }
}

/// What a session may use: a seat that only talks gets nothing, whatever the
/// caller offered, which keeps a Council's blind answers blind.
fn tools_for(talk_only: bool, offered: Vec<ToolServer>) -> Vec<ToolServer> {
    if talk_only { Vec::new() } else { offered }
}

/// A live conversation with one agent.
pub struct AgentSession {
    kind: Kind,
    definition: ProviderDefinition,
    program: PathBuf,
    data_dir: PathBuf,
    /// Last, so the agent has stopped before what it was using goes away.
    leases: Vec<Box<dyn std::any::Any + Send + Sync>>,
}

enum Kind {
    Acp(acp::AcpSession),
    Headless(Box<headless::HeadlessSession>),
}

impl AgentSession {
    /// Start a conversation with an installed agent at `program`, working in
    /// `cwd`. `resume` restores a conversation the agent reported
    /// earlier ([`Self::resume_token`]). `talk_only` adds the agent's own
    /// switch for no tools when its definition has one (a headless agent's
    /// `connect.conversation.talk_only`); an ACP agent has none, so the
    /// caller refuses its permission requests instead. `tools` are the MCP
    /// servers the agent may use: offered to an ACP agent when its session
    /// opens, and through a headless agent's `connect.conversation.tool_servers`
    /// when its definition has them.
    ///
    /// # Errors
    /// When the definition says nothing about talking to it, it is a
    /// desktop app, its connector is missing, or the agent does not open a
    /// session.
    pub async fn start(
        definition: &ProviderDefinition,
        program: &Path,
        data_dir: &Path,
        cwd: &Path,
        resume: Option<String>,
        talk_only: bool,
        tools: Vec<ToolServer>,
    ) -> Result<Self> {
        let tools = tools_for(talk_only, tools);
        super::supervisor::inspect(definition, program, data_dir)
            .await
            .availability
            .chat
            .require(definition.name())?;
        let Some(connect_spec) = &definition.connect else {
            bail!(
                "{} can't hold a conversation yet: its definition has no connect section",
                definition.name()
            );
        };
        let launch = connect::launch(definition, program, data_dir, "")?;
        let kind = match definition.protocol() {
            Some(AgentProtocol::Acp) => {
                Kind::Acp(acp::AcpSession::start(&launch, cwd, resume, tools).await?)
            }
            Some(AgentProtocol::Headless) => {
                let Some(conversation) = &connect_spec.conversation else {
                    bail!(
                        "{} can't hold a conversation yet: its definition has no connect.conversation section",
                        definition.name()
                    );
                };
                let tools = if tools.is_empty() || conversation.tool_servers.is_empty() {
                    None
                } else {
                    Some(headless::ToolConfig::write(data_dir, &tools)?)
                };
                Kind::Headless(Box::new(headless::HeadlessSession::new(
                    &launch,
                    program,
                    conversation.clone(),
                    cwd,
                    resume,
                    talk_only,
                    tools,
                )))
            }
            None => bail!(
                "{} is a desktop app; it can't hold a conversation",
                definition.name()
            ),
        };
        Ok(Self {
            kind,
            definition: definition.clone(),
            program: program.to_path_buf(),
            data_dir: data_dir.to_path_buf(),
            leases: Vec::new(),
        })
    }

    /// Keep `lease` for as long as this conversation: what its tools need to
    /// stay valid, such as the memory token that ends when it is dropped.
    pub fn retain(&mut self, lease: impl std::any::Any + Send + Sync) {
        self.leases.push(Box::new(lease));
    }

    /// Send one prompt; the turn's events arrive on the returned receiver.
    ///
    /// # Errors
    /// When the session has ended.
    pub async fn prompt(&self, text: &str) -> Result<TurnEvents> {
        self.prompt_cancellable(text, std::future::pending()).await
    }

    /// Validate before dispatch while allowing the caller to cancel a slow
    /// login check. Once dispatch starts, the caller retains the turn and
    /// cancels the accepted operation through [`Self::cancel`].
    ///
    /// # Errors
    /// Returns a missing prerequisite or an ended session.
    pub async fn prompt_cancellable(
        &self,
        text: &str,
        cancelled: impl std::future::Future<Output = ()>,
    ) -> Result<TurnEvents> {
        tokio::select! {
            biased;
            () = cancelled => {
                let (out, events) = mpsc::unbounded_channel();
                let _ = out.send(AgentEvent::TurnEnded { stop: "cancelled".into() });
                return Ok(events);
            }
            observed = super::supervisor::inspect(&self.definition, &self.program, &self.data_dir) => {
                observed.availability.chat.require(self.definition.name())?;
            }
        }
        match &self.kind {
            Kind::Acp(session) => session.prompt(text),
            Kind::Headless(session) => session.prompt(text).await,
        }
    }

    /// Stop the running turn, if any.
    pub async fn cancel(&self) {
        match &self.kind {
            Kind::Acp(session) => session.cancel(),
            Kind::Headless(session) => session.cancel().await,
        }
    }

    /// Answer a permission request: `choice` is one of its
    /// [`PermissionChoice`] ids, or `None` to refuse. Returns `false` when
    /// the request is no longer waiting.
    pub async fn answer(&self, request: &str, choice: Option<String>) -> bool {
        match &self.kind {
            Kind::Acp(session) => session.answer(request, choice).await,
            // A headless agent decides permissions from its own settings.
            Kind::Headless(_) => false,
        }
    }

    /// What continues this conversation later: a headless agent's session
    /// id, or the ACP session id.
    pub async fn resume_token(&self) -> Option<String> {
        match &self.kind {
            Kind::Acp(session) => session.session_id().await,
            Kind::Headless(session) => session.session_id().await,
        }
    }

    /// End the conversation (the agent's process stops).
    pub async fn close(&self) {
        match &self.kind {
            Kind::Acp(session) => session.close().await,
            Kind::Headless(session) => session.close().await,
        }
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use std::path::PathBuf;

    use super::*;
    use crate::providers::{ProviderId, catalog, discovery::installed};

    fn memory_server() -> ToolServer {
        ToolServer {
            name: "devpulse-memory".into(),
            command: PathBuf::from("devpulse-persona-mcp"),
            args: Vec::new(),
            env: vec![("DEVPULSE_MEMORY_TOKEN".into(), "secret-token".into())],
        }
    }

    #[test]
    fn a_seat_that_only_talks_gets_no_tools_whatever_it_was_offered() {
        assert_eq!(tools_for(true, vec![memory_server()]), []);
        assert_eq!(tools_for(false, vec![memory_server()]), [memory_server()]);
    }

    #[test]
    fn a_debug_print_never_shows_a_session_token() {
        let printed = format!("{:?}", memory_server());
        assert!(printed.contains("DEVPULSE_MEMORY_TOKEN"), "{printed}");
        assert!(!printed.contains("secret-token"), "{printed}");
    }

    #[tokio::test]
    async fn a_live_session_rechecks_login_and_cancellation_before_dispatch() {
        use crate::providers::definition::{PerOs, SignedInSpec};
        let dir =
            std::env::temp_dir().join(format!("devpulse-session-gate-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let program = dir.join("must-not-run");
        let login = dir.join("login-present");
        std::fs::write(&program, "not executable").unwrap();
        std::fs::write(&login, "presence only; no token").unwrap();
        let mut definition = catalog::bundled()
            .unwrap()
            .into_iter()
            .find(|d| d.id == ProviderId::ClaudeCode)
            .unwrap();
        let files = vec![login.display().to_string()];
        definition.signed_in = Some(SignedInSpec {
            args: None,
            files: PerOs {
                windows: files.clone(),
                macos: files.clone(),
                linux: files,
            },
            output_signed_in: None,
            output_signed_out: None,
            absent_means_signed_out: true,
        });
        let session =
            AgentSession::start(&definition, &program, &dir, &dir, None, false, Vec::new())
                .await
                .unwrap();
        std::fs::remove_file(&login).unwrap();
        let error = session.prompt("must not dispatch").await.unwrap_err();
        assert!(error.to_string().contains("Sign in to"), "{error:#}");
        // Cancellation wins even over failed prerequisites and never dispatches.
        let mut events = session
            .prompt_cancellable("must not dispatch", std::future::ready(()))
            .await
            .unwrap();
        assert_eq!(
            events.recv().await,
            Some(AgentEvent::TurnEnded {
                stop: "cancelled".into()
            })
        );
        assert!(events.recv().await.is_none());
        std::fs::write(&login, "presence only").unwrap();
        std::fs::remove_file(&program).unwrap();
        let error = session.prompt("must not dispatch").await.unwrap_err();
        assert!(error.to_string().contains("not installed"), "{error:#}");
        session.close().await;
        std::fs::remove_dir_all(&dir).unwrap();
    }

    /// The answer of one turn, or what went wrong.
    async fn answer(mut events: TurnEvents) -> Result<String, String> {
        let mut text = String::new();
        while let Some(event) = events.recv().await {
            println!("    {event:?}");
            match event {
                AgentEvent::Text { text: part } => text.push_str(&part),
                AgentEvent::Failed { message } => return Err(message),
                AgentEvent::TurnEnded { .. } => break,
                _ => {}
            }
        }
        Ok(text)
    }

    /// A real two-turn conversation keeps its context. Run with
    /// `DEVPULSE_DATA_DIR=<the DevPulse data folder> cargo test -p devpulse-clyffy
    /// --lib two_turns -- --ignored --nocapture`.
    #[tokio::test]
    #[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
    async fn two_turns_keep_their_context() {
        let data_dir =
            PathBuf::from(std::env::var("DEVPULSE_DATA_DIR").expect("DEVPULSE_DATA_DIR"));
        let home = std::env::home_dir();
        let cwd = std::env::temp_dir().join("devpulse-two-turns");
        std::fs::create_dir_all(&cwd).unwrap();
        for id in [ProviderId::ClaudeCode, ProviderId::Codex] {
            let definition = catalog::bundled()
                .unwrap()
                .into_iter()
                .find(|d| d.id == id)
                .unwrap();
            let program =
                installed::locate(&definition, home.as_deref(), &data_dir).expect("installed");
            let session = AgentSession::start(
                &definition,
                &program,
                &data_dir,
                &cwd,
                None,
                false,
                Vec::new(),
            )
            .await
            .unwrap_or_else(|e| panic!("{}: {e:#}", id.key()));
            let first = answer(
                session
                    .prompt("Remember the word marmalade. Reply with just: OK")
                    .await
                    .unwrap(),
            )
            .await
            .unwrap_or_else(|e| panic!("{} turn 1: {e}", id.key()));
            let second = answer(
                session
                    .prompt("Which word did I ask you to remember? Reply with that one word.")
                    .await
                    .unwrap(),
            )
            .await
            .unwrap_or_else(|e| panic!("{} turn 2: {e}", id.key()));
            println!(
                "{}: turn 1 {first:?} · turn 2 {second:?} · resume {:?}",
                id.key(),
                session.resume_token().await
            );
            assert!(
                second.to_lowercase().contains("marmalade"),
                "{} lost the conversation: {second:?}",
                id.key()
            );
            session.close().await;
        }
    }
}
