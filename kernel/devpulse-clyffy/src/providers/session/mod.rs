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
use std::sync::Mutex;
use std::time::Duration;

use anyhow::{Result, bail};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

use super::connect;
use super::definition::{ConnectSpec, ProviderDefinition};
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

/// What a conversation starts with, beyond who and where.
#[derive(Default)]
pub struct SessionSetup {
    /// Restores a conversation the agent reported earlier
    /// ([`AgentSession::resume_token`]).
    pub resume: Option<String>,
    /// Adds the agent's own switch for no tools when its definition has one (a
    /// headless agent's `connect.conversation.talk_only`); an ACP agent has
    /// none, so the caller refuses its permission requests instead. A seat like
    /// this gets no `tools` and no `context`.
    pub talk_only: bool,
    /// The MCP servers the agent may use: offered to an ACP agent when its
    /// session opens, and through a headless agent's
    /// `connect.conversation.tool_servers` when its definition has them.
    pub tools: Vec<ToolServer>,
    /// Your notes for the agent: see [`delivery`].
    pub context: Option<String>,
}

/// How a session's notes reach its agent.
#[derive(Debug, PartialEq, Eq)]
enum Delivery {
    /// There are none.
    Nothing,
    /// Instructions, through its environment.
    Environment(Vec<(String, String)>),
    /// Instructions, from a file named on every turn.
    File(String),
    /// A marked block on the first prompt of this live session.
    FirstPrompt(String),
}

/// Instructions where the definition says the agent has them, because they
/// outlast the vendor's compaction and stay out of your history; otherwise the
/// first prompt. An agent told through its environment takes that only when a
/// thread starts: a real resumed Codex thread answered as if it had none. A seat
/// that only talks gets nothing.
fn delivery(
    connect: &ConnectSpec,
    talk_only: bool,
    resuming: bool,
    context: Option<String>,
) -> Delivery {
    let Some(notes) = context.filter(|notes| !talk_only && !notes.is_empty()) else {
        return Delivery::Nothing;
    };
    if connect
        .conversation
        .as_ref()
        .is_some_and(|conversation| !conversation.context.is_empty())
    {
        return Delivery::File(notes);
    }
    if !connect.context_env.is_empty() && !resuming {
        return Delivery::Environment(connect::context_env(connect, &notes));
    }
    Delivery::FirstPrompt(notes)
}

/// A live conversation with one agent.
pub struct AgentSession {
    kind: Kind,
    definition: ProviderDefinition,
    program: PathBuf,
    data_dir: PathBuf,
    /// Notes the first prompt still has to carry.
    first_prompt: Mutex<Option<String>>,
    /// Last, so the agent has stopped before what it was using goes away.
    leases: Vec<Box<dyn std::any::Any + Send + Sync>>,
}

enum Kind {
    Acp(acp::AcpSession),
    Headless(Box<headless::HeadlessSession>),
}

impl AgentSession {
    /// Start a conversation with an installed agent at `program`, working in
    /// `cwd`, as `setup` says.
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
        setup: SessionSetup,
    ) -> Result<Self> {
        let SessionSetup {
            resume,
            talk_only,
            tools,
            context,
        } = setup;
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
        let mut launch = connect::launch(definition, program, data_dir, "")?;
        let mut context_file = None;
        let mut first_prompt = None;
        match delivery(connect_spec, talk_only, resume.is_some(), context) {
            Delivery::Nothing => {}
            Delivery::Environment(env) => launch.env.extend(env),
            Delivery::File(notes) => {
                context_file = Some(headless::ContextFile::write(data_dir, &notes)?);
            }
            Delivery::FirstPrompt(notes) => first_prompt = Some(notes),
        }
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
                    headless::TurnFiles {
                        tools,
                        context: context_file,
                    },
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
            first_prompt: Mutex::new(first_prompt),
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
        let text = self.with_first_prompt_notes(text);
        match &self.kind {
            Kind::Acp(session) => session.prompt(&text),
            Kind::Headless(session) => session.prompt(&text).await,
        }
    }

    /// `text`, after the notes the first prompt still has to carry.
    fn with_first_prompt_notes(&self, text: &str) -> String {
        let notes = self
            .first_prompt
            .lock()
            .ok()
            .and_then(|mut first_prompt| first_prompt.take());
        notes.map_or_else(|| text.to_owned(), |notes| format!("{notes}\n\n{text}"))
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

    fn bundled_connect(id: ProviderId) -> ConnectSpec {
        catalog::bundled()
            .unwrap()
            .into_iter()
            .find(|d| d.id == id)
            .unwrap()
            .connect
            .unwrap()
    }

    #[test]
    fn claude_code_takes_notes_from_a_file_as_instructions() {
        assert_eq!(
            delivery(
                &bundled_connect(ProviderId::ClaudeCode),
                false,
                false,
                Some("notes".into())
            ),
            Delivery::File("notes".into())
        );
    }

    #[test]
    fn a_resumed_claude_code_thread_still_reads_the_file() {
        assert_eq!(
            delivery(
                &bundled_connect(ProviderId::ClaudeCode),
                false,
                true,
                Some("notes".into())
            ),
            Delivery::File("notes".into())
        );
        // It keeps one system prompt per conversation unless told not to, and a
        // thread you come back to would never get a note added since.
        let connect = bundled_connect(ProviderId::ClaudeCode);
        let context = connect.conversation.unwrap().context;
        assert_eq!(
            context[context.len() - 2..],
            ["--system-prompt-snapshot", "off"]
        );
    }

    #[test]
    fn a_resumed_codex_thread_gets_the_first_prompt_because_it_ignores_new_instructions() {
        assert_eq!(
            delivery(
                &bundled_connect(ProviderId::Codex),
                false,
                true,
                Some("notes".into())
            ),
            Delivery::FirstPrompt("notes".into())
        );
    }

    #[test]
    fn codex_takes_notes_as_developer_instructions_with_any_text_intact() {
        let notes = "Line one.\nSay \"yes\" and use C:\\tools.";
        let Delivery::Environment(env) = delivery(
            &bundled_connect(ProviderId::Codex),
            false,
            false,
            Some(notes.into()),
        ) else {
            panic!("Codex has an instructions channel");
        };
        let (name, value) = env.first().unwrap();
        assert_eq!(name, "CODEX_CONFIG");
        let config: serde_json::Value = serde_json::from_str(value).unwrap();
        assert_eq!(config["developer_instructions"], notes);
    }

    #[test]
    fn an_agent_with_no_instructions_channel_gets_the_first_prompt() {
        assert_eq!(
            delivery(
                &bundled_connect(ProviderId::GeminiCli),
                false,
                false,
                Some("notes".into())
            ),
            Delivery::FirstPrompt("notes".into())
        );
    }

    #[test]
    fn a_seat_that_only_talks_gets_no_notes_on_any_channel() {
        for id in [
            ProviderId::ClaudeCode,
            ProviderId::Codex,
            ProviderId::GeminiCli,
        ] {
            for resuming in [false, true] {
                assert_eq!(
                    delivery(&bundled_connect(id), true, resuming, Some("notes".into())),
                    Delivery::Nothing,
                    "{}",
                    id.key()
                );
            }
        }
    }

    #[test]
    fn no_notes_send_nothing() {
        let connect = bundled_connect(ProviderId::Codex);
        assert_eq!(delivery(&connect, false, false, None), Delivery::Nothing);
        assert_eq!(
            delivery(&connect, false, false, Some(String::new())),
            Delivery::Nothing
        );
    }

    #[test]
    fn a_definition_that_loses_its_placeholder_is_refused() {
        let real = include_str!("../../../config/providers/codex.toml");
        let broken = real.replace("{context_json}", "");
        assert_ne!(real, broken);
        let error = crate::providers::ProviderDefinition::parse(&broken).expect_err("no notes");
        assert!(format!("{error:#}").contains("context_env"), "{error:#}");

        let real = include_str!("../../../config/providers/claude-code.toml");
        let broken = real.replace("{context_file}", "");
        assert_ne!(real, broken);
        let error = crate::providers::ProviderDefinition::parse(&broken).expect_err("no file");
        assert!(format!("{error:#}").contains("context"), "{error:#}");
    }

    /// An agent that prints the prompt it was given, with no channel for notes.
    fn echoing_session_definition() -> (ProviderDefinition, PathBuf) {
        use crate::providers::definition::StreamFormat;
        let mut definition = catalog::bundled()
            .unwrap()
            .into_iter()
            .find(|d| d.id == ProviderId::ClaudeCode)
            .unwrap();
        definition.signed_in = None;
        definition.sign_in = None;
        let conversation = definition
            .connect
            .as_mut()
            .unwrap()
            .conversation
            .as_mut()
            .unwrap();
        conversation.resume.clear();
        conversation.tool_servers.clear();
        conversation.talk_only.clear();
        conversation.context.clear();
        conversation.output = StreamFormat::Text;
        #[cfg(windows)]
        let (program, args) = (
            "powershell",
            vec![
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "Write-Output '{prompt}'",
            ],
        );
        #[cfg(unix)]
        let (program, args) = ("sh", vec!["-c", "printf '%s\\n' \"$1\"", "sh", "{prompt}"]);
        conversation.args = args.into_iter().map(str::to_owned).collect();
        let program = installed::on_path(program).unwrap();
        (definition, program)
    }

    #[tokio::test]
    async fn only_the_first_prompt_carries_the_notes_and_a_talking_seat_never_does() {
        let dir = tempfile::tempdir().unwrap();
        let (definition, program) = echoing_session_definition();
        let start = |talk_only| {
            AgentSession::start(
                &definition,
                &program,
                dir.path(),
                dir.path(),
                SessionSetup {
                    talk_only,
                    context: Some("MARKED-NOTES".into()),
                    ..SessionSetup::default()
                },
            )
        };
        let session = start(false).await.unwrap();
        let first = answer(session.prompt("first").await.unwrap())
            .await
            .unwrap();
        assert!(first.contains("MARKED-NOTES"), "{first:?}");
        assert!(first.contains("first"), "{first:?}");
        let second = answer(session.prompt("second").await.unwrap())
            .await
            .unwrap();
        assert!(second.contains("second"), "{second:?}");
        assert!(!second.contains("MARKED-NOTES"), "{second:?}");
        session.close().await;

        let seat = start(true).await.unwrap();
        let spoken = answer(seat.prompt("only").await.unwrap()).await.unwrap();
        assert!(spoken.contains("only"), "{spoken:?}");
        assert!(!spoken.contains("MARKED-NOTES"), "{spoken:?}");
        seat.close().await;
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
            AgentSession::start(&definition, &program, &dir, &dir, SessionSetup::default())
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
                SessionSetup::default(),
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
