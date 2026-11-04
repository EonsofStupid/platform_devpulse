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

use anyhow::{Context as _, Result, bail};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

use super::connect;
use super::definition::{ConnectSpec, OwnToolServers, ProviderDefinition};
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

/// What an agent may do in a session, whatever else it was offered.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub enum Access {
    /// What it may do anywhere else; it asks you before it changes things.
    #[default]
    Full,
    /// It may look, with these capabilities (`read`, `web`), and change nothing.
    /// The caller also refuses its permission requests.
    Looks(Vec<String>),
    /// No tools at all. The caller also refuses its permission requests, and
    /// gives it a folder of its own.
    TalkOnly,
}

/// What a session may use: a seat that only talks gets nothing, whatever the
/// caller offered, which keeps a Council's blind answers blind.
fn tools_for(access: &Access, offered: Vec<ToolServer>) -> Vec<ToolServer> {
    if *access == Access::TalkOnly {
        Vec::new()
    } else {
        offered
    }
}

/// The agent's own switch for what this session may do.
fn access_env(connect: &ConnectSpec, access: &Access) -> Vec<(String, String)> {
    let env = match access {
        Access::Full => return Vec::new(),
        Access::Looks(_) => &connect.read_only_env,
        Access::TalkOnly => &connect.talk_only_env,
    };
    env.iter()
        .map(|(name, value)| (name.clone(), value.clone()))
        .collect()
}

/// How long an agent gets to list its own MCP servers.
const LIST_OWN_TOOLS_WAIT: Duration = Duration::from_secs(30);

/// The `mcp_servers` table for a limited seat: every server `listed` by the agent
/// turned off (with its transport, which a server from a plugin has nowhere else),
/// and what `DevPulse` offers it.
fn limited_tool_servers(
    listed: &str,
    offered: &[ToolServer],
    settings: &std::collections::BTreeMap<String, String>,
) -> Result<serde_json::Value> {
    let listed: Vec<serde_json::Value> =
        serde_json::from_str(listed).context("its list of tool servers is not JSON")?;
    let mut servers = serde_json::Map::new();
    for server in &listed {
        let (Some(name), Some(transport)) = (
            server.get("name").and_then(serde_json::Value::as_str),
            server
                .get("transport")
                .and_then(serde_json::Value::as_object),
        ) else {
            bail!("its list of tool servers has one without a name and a transport");
        };
        let mut off = serde_json::Map::new();
        for field in ["command", "args", "url"] {
            if let Some(value) = transport.get(field).filter(|value| !value.is_null()) {
                off.insert(field.to_owned(), value.clone());
            }
        }
        off.insert("enabled".to_owned(), false.into());
        servers.insert(name.to_owned(), off.into());
    }
    for tool in offered {
        let mut server = serde_json::json!({
            "command": tool.command,
            "args": tool.args,
            "env": tool.env.iter().cloned().collect::<std::collections::BTreeMap<_, _>>(),
        });
        for (name, value) in settings {
            server[name] = value.clone().into();
        }
        servers.insert(tool.name.clone(), server);
    }
    Ok(serde_json::json!({ "mcp_servers": servers }))
}

/// Ask the agent for its own MCP servers, for a limited seat. A seat whose limit
/// cannot be kept does not start.
async fn limit_own_tool_servers(
    own: &OwnToolServers,
    program: &Path,
    offered: &[ToolServer],
) -> Result<(String, String)> {
    let args: Vec<&str> = own.list.iter().map(String::as_str).collect();
    let program_name = program.to_string_lossy();
    let listed = match devpulse_process::run(&program_name, &args, &[], LIST_OWN_TOOLS_WAIT).await {
        Ok(devpulse_process::Ran::Answered(answer)) if answer.ok() => answer.stdout,
        Ok(devpulse_process::Ran::Answered(answer)) => bail!("{}", answer.reason()),
        Ok(devpulse_process::Ran::Missing) => bail!("{program_name} could not be started"),
        Err(error) => return Err(error),
    };
    let table = limited_tool_servers(&listed, offered, &own.offered)?;
    Ok((own.config_env.clone(), table.to_string()))
}

/// Add to what a session starts with. A variable set twice with JSON objects
/// merges them, so an agent's one config variable can carry both a seat's limits
/// and your notes.
fn add_env(into: &mut Vec<(String, String)>, env: Vec<(String, String)>) {
    for (name, value) in env {
        match into.iter_mut().find(|(existing, _)| *existing == name) {
            Some((_, existing)) => *existing = merged_value(existing, value),
            None => into.push((name, value)),
        }
    }
}

fn merged_value(existing: &str, value: String) -> String {
    match (
        serde_json::from_str::<serde_json::Value>(existing),
        serde_json::from_str::<serde_json::Value>(&value),
    ) {
        (Ok(serde_json::Value::Object(mut first)), Ok(serde_json::Value::Object(second))) => {
            first.extend(second);
            serde_json::Value::Object(first).to_string()
        }
        _ => value,
    }
}

/// What a conversation starts with, beyond who and where.
#[derive(Default)]
pub struct SessionSetup {
    /// Restores a conversation the agent reported earlier
    /// ([`AgentSession::resume_token`]).
    pub resume: Option<String>,
    /// What it may do, through the agent's own switches when its definition has
    /// them (a headless agent's `connect.conversation`, an ACP agent's
    /// `connect.talk_only_env` and `connect.read_only_env`). A seat that only
    /// talks gets no `tools`: one seat's memory tools could read what another
    /// wrote. It can still have `context`.
    pub access: Access,
    /// The MCP servers the agent may use: offered to an ACP agent when its
    /// session opens, and through a headless agent's
    /// `connect.conversation.tool_servers` when its definition has them.
    pub tools: Vec<ToolServer>,
    /// Your notes for the agent, when this conversation gets them: see
    /// [`delivery`]. The caller decides, from your choice for it.
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
/// thread starts: a real resumed Codex thread answered as if it had none.
fn delivery(connect: &ConnectSpec, resuming: bool, context: Option<String>) -> Delivery {
    let Some(notes) = context.filter(|notes| !notes.is_empty()) else {
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
            access,
            tools,
            context,
        } = setup;
        let tools = tools_for(&access, tools);
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
        add_env(&mut launch.env, access_env(connect_spec, &access));
        let tools = match (&access, &connect_spec.own_tool_servers) {
            (Access::Full, _) | (_, None) => tools,
            (_, Some(own)) => {
                let config = limit_own_tool_servers(own, program, &tools)
                    .await
                    .with_context(|| {
                        format!(
                            "{} can't be limited to this seat: its own tools could not be turned off",
                            definition.name()
                        )
                    })?;
                add_env(&mut launch.env, vec![config]);
                Vec::new()
            }
        };
        let mut context_file = None;
        let mut first_prompt = None;
        match delivery(connect_spec, resume.is_some(), context) {
            Delivery::Nothing => {}
            Delivery::Environment(env) => add_env(&mut launch.env, env),
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
                    access,
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
        assert_eq!(tools_for(&Access::TalkOnly, vec![memory_server()]), []);
        assert_eq!(
            tools_for(&Access::Full, vec![memory_server()]),
            [memory_server()]
        );
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
                Some("notes".into())
            ),
            Delivery::FirstPrompt("notes".into())
        );
    }

    #[test]
    fn a_talking_codex_seat_has_no_shell_and_any_other_codex_session_has_one() {
        let connect = bundled_connect(ProviderId::Codex);
        let talking = access_env(&connect, &Access::TalkOnly);
        assert!(talking.contains(&("INITIAL_AGENT_MODE".to_owned(), "read-only".to_owned())));
        let (_, config) = talking
            .iter()
            .find(|(name, _)| name == "CODEX_CONFIG")
            .expect("its config");
        let config: serde_json::Value = serde_json::from_str(config).unwrap();
        assert_eq!(config["features"]["shell_tool"], false);
        assert_eq!(config["features"]["unified_exec"], false);

        // Looking is read-only with its shell, since that is how Codex reads.
        let looking = access_env(&connect, &Access::Looks(vec!["read".to_owned()]));
        assert!(looking.contains(&("INITIAL_AGENT_MODE".to_owned(), "read-only".to_owned())));
        let (_, config) = looking
            .iter()
            .find(|(name, _)| name == "CODEX_CONFIG")
            .expect("its config");
        let config: serde_json::Value = serde_json::from_str(config).unwrap();
        assert_eq!(config["features"]["computer_use"], false);
        assert!(config["features"].get("shell_tool").is_none());
        assert_eq!(access_env(&connect, &Access::Full), []);
    }

    #[test]
    fn a_limited_seat_turns_off_each_server_of_the_agents_and_keeps_what_devpulse_offers() {
        let listed = r#"[
            {"name":"node_repl","enabled":true,"transport":{"type":"stdio","command":"node","args":["r"],"env":{"SECRET":"x"},"cwd":null}},
            {"name":"hosted","enabled":true,"transport":{"type":"streamable_http","url":"https://example.test/mcp","bearer_token_env_var":null}}
        ]"#;
        let settings = [(
            "default_tools_approval_mode".to_owned(),
            "approve".to_owned(),
        )]
        .into();
        let table = limited_tool_servers(listed, &[memory_server()], &settings).unwrap();
        let servers = &table["mcp_servers"];
        assert_eq!(
            servers["node_repl"],
            serde_json::json!({"command":"node","args":["r"],"enabled":false})
        );
        assert_eq!(
            servers["hosted"],
            serde_json::json!({"url":"https://example.test/mcp","enabled":false})
        );
        assert_eq!(
            servers[memory_server().name.as_str()]["enabled"],
            serde_json::Value::Null
        );
        assert!(
            !table.to_string().contains("SECRET"),
            "its secrets stay out"
        );
        assert_eq!(
            servers[memory_server().name.as_str()]["default_tools_approval_mode"],
            "approve",
            "what DevPulse offers needs no asking"
        );
        assert!(limited_tool_servers("not json", &[], &settings).is_err());
        assert!(limited_tool_servers(r#"[{"enabled":true}]"#, &[], &settings).is_err());
    }

    #[test]
    fn a_seats_limits_and_your_notes_share_one_config_variable() {
        let connect = bundled_connect(ProviderId::Codex);
        let mut env = vec![("CODEX_PATH".to_owned(), "codex".to_owned())];
        add_env(&mut env, access_env(&connect, &Access::TalkOnly));
        let Delivery::Environment(notes) = delivery(&connect, false, Some("MARKED".into())) else {
            panic!("a new Codex session gets its notes through the environment");
        };
        add_env(&mut env, notes);
        let configs: Vec<_> = env
            .iter()
            .filter(|(name, _)| name == "CODEX_CONFIG")
            .collect();
        assert_eq!(configs.len(), 1);
        let config: serde_json::Value = serde_json::from_str(&configs[0].1).unwrap();
        assert_eq!(config["developer_instructions"], "MARKED");
        assert_eq!(config["features"]["shell_tool"], false);

        // A plain value is replaced, as it always was.
        let mut plain = vec![("MODE".to_owned(), "a".to_owned())];
        add_env(&mut plain, vec![("MODE".to_owned(), "b".to_owned())]);
        assert_eq!(plain, [("MODE".to_owned(), "b".to_owned())]);
    }

    #[test]
    fn no_notes_send_nothing() {
        let connect = bundled_connect(ProviderId::Codex);
        assert_eq!(delivery(&connect, false, None), Delivery::Nothing);
        assert_eq!(
            delivery(&connect, false, Some(String::new())),
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
        conversation.prompt_via = crate::providers::definition::PromptVia::Argument;
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
    async fn only_the_first_prompt_carries_the_notes_on_any_kind_of_seat() {
        let dir = tempfile::tempdir().unwrap();
        let (definition, program) = echoing_session_definition();
        let start = |talk_only| {
            AgentSession::start(
                &definition,
                &program,
                dir.path(),
                dir.path(),
                SessionSetup {
                    access: if talk_only {
                        Access::TalkOnly
                    } else {
                        Access::Full
                    },
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
        assert!(spoken.contains("MARKED-NOTES"), "{spoken:?}");
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

    /// A prompt longer than a Windows command line holds reaches a real Claude
    /// Code. Run as `two_turns_keep_their_context` is.
    #[tokio::test]
    #[ignore = "talks to this machine's Claude Code on your own subscription"]
    async fn a_prompt_past_the_command_line_limit_reaches_a_real_agent() {
        let data_dir =
            PathBuf::from(std::env::var("DEVPULSE_DATA_DIR").expect("DEVPULSE_DATA_DIR"));
        let home = std::env::home_dir();
        let cwd = tempfile::tempdir().unwrap();
        let definition = catalog::bundled()
            .unwrap()
            .into_iter()
            .find(|d| d.id == ProviderId::ClaudeCode)
            .unwrap();
        let program =
            installed::locate(&definition, home.as_deref(), &data_dir).expect("installed");
        let session = AgentSession::start(
            &definition,
            &program,
            &data_dir,
            cwd.path(),
            SessionSetup::default(),
        )
        .await
        .unwrap();
        let filler = "This line is only here to make the prompt long.\n".repeat(800);
        assert!(filler.len() > 32_767);
        let prompt = format!("{filler}\nIgnore the lines above and reply with exactly: LONG-OK");
        let reply = answer(session.prompt(&prompt).await.unwrap())
            .await
            .unwrap();
        println!("claude code, {} characters in: {reply:?}", prompt.len());
        assert!(reply.contains("LONG-OK"), "{reply:?}");
        session.close().await;
    }

    /// A seat that only talks changes nothing, whatever it is asked: its
    /// permission requests are refused, as a room refuses them, and the agent's
    /// own switch stops what it would do without asking. Run with
    /// `DEVPULSE_DATA_DIR=<the DevPulse data folder> cargo test -p devpulse-clyffy
    /// --lib a_talking_seat -- --ignored --nocapture`.
    #[tokio::test]
    #[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
    async fn a_talking_seat_changes_nothing_when_asked_to() {
        let data_dir =
            PathBuf::from(std::env::var("DEVPULSE_DATA_DIR").expect("DEVPULSE_DATA_DIR"));
        let home = std::env::home_dir();
        for id in [ProviderId::Codex, ProviderId::ClaudeCode] {
            let cwd = tempfile::tempdir().unwrap();
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
                cwd.path(),
                SessionSetup {
                    access: Access::TalkOnly,
                    ..SessionSetup::default()
                },
            )
            .await
            .unwrap_or_else(|e| panic!("{}: {e:#}", id.key()));
            let mut events = session
                .prompt(
                    "Create a file named hello.txt in the current folder containing the word \
                     hi, using whatever tool you have, then reply DONE. If you cannot, reply \
                     exactly REFUSED.",
                )
                .await
                .unwrap();
            let mut answer = String::new();
            while let Some(event) = events.recv().await {
                match event {
                    AgentEvent::Text { text } => answer.push_str(&text),
                    AgentEvent::Tool { title, status, .. } if !title.is_empty() => {
                        println!("    {}: tool {title:?} {status}", id.key());
                    }
                    AgentEvent::PermissionAsked { request, title, .. } => {
                        println!("    {}: asked {title:?}, refused", id.key());
                        session.answer(&request, None).await;
                    }
                    AgentEvent::Failed { message } => panic!("{}: {message}", id.key()),
                    AgentEvent::TurnEnded { .. } => break,
                    _ => {}
                }
            }
            session.close().await;
            let left: Vec<_> = std::fs::read_dir(cwd.path())
                .unwrap()
                .map(|entry| entry.unwrap().file_name())
                .collect();
            println!("{}: answered {answer:?}, folder holds {left:?}", id.key());
            assert!(left.is_empty(), "{}: it wrote {left:?}", id.key());
        }
    }

    /// One real turn with this access: what it answered, and what was in the folder
    /// afterwards.
    async fn one_turn(
        id: ProviderId,
        access: Access,
        cwd: &Path,
        prompt: &str,
    ) -> (String, Vec<std::ffi::OsString>) {
        let data_dir =
            PathBuf::from(std::env::var("DEVPULSE_DATA_DIR").expect("DEVPULSE_DATA_DIR"));
        let home = std::env::home_dir();
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
            cwd,
            SessionSetup {
                access,
                ..SessionSetup::default()
            },
        )
        .await
        .unwrap_or_else(|e| panic!("{}: {e:#}", id.key()));
        let mut events = session.prompt(prompt).await.unwrap();
        let mut answer = String::new();
        while let Some(event) = events.recv().await {
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
                    let offered: Vec<_> = choices.iter().map(|c| c.label.as_str()).collect();
                    println!("    {}: asked {title:?} offering {offered:?}", id.key());
                    session.answer(&request, None).await;
                }
                AgentEvent::Failed { message } => panic!("{}: {message}", id.key()),
                AgentEvent::TurnEnded { stop } => {
                    println!("    {}: the turn ended: {stop}", id.key());
                    break;
                }
                _ => {}
            }
        }
        session.close().await;
        let left = std::fs::read_dir(cwd)
            .unwrap()
            .map(|entry| entry.unwrap().file_name())
            .collect();
        println!("{}: answered {answer:?}, folder holds {left:?}", id.key());
        (answer, left)
    }

    /// A real seat that may look reads the project and cannot change it. Run with
    /// `DEVPULSE_DATA_DIR=<the DevPulse data folder> cargo test -p devpulse-clyffy
    /// --lib a_looking_seat -- --ignored --nocapture`.
    #[tokio::test]
    #[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
    async fn a_looking_seat_reads_and_cannot_write() {
        for id in [ProviderId::ClaudeCode, ProviderId::Codex] {
            let cwd = tempfile::tempdir().unwrap();
            std::fs::write(cwd.path().join("marker.txt"), "the codeword is HERON-41\n").unwrap();
            let looks = Access::Looks(vec!["read".to_owned()]);
            let (answer, _) = one_turn(
                id,
                looks.clone(),
                cwd.path(),
                "Read marker.txt in the current folder and reply with its codeword.",
            )
            .await;
            assert!(
                answer.contains("HERON-41"),
                "{}: it could not read",
                id.key()
            );
            let (_, left) = one_turn(
                id,
                looks,
                cwd.path(),
                "Create a file named made.txt in the current folder, using whatever tool you \
                 have, then reply DONE. If you cannot, reply exactly REFUSED.",
            )
            .await;
            assert_eq!(left, ["marker.txt"], "{}: it changed the folder", id.key());
        }
    }

    /// Codex's refusal for this request stops its turn, and the same session can
    /// still finish its answer, which is what a room does next. Run with
    /// `DEVPULSE_DATA_DIR=<the DevPulse data folder> cargo test -p devpulse-clyffy
    /// --lib a_refused_seat -- --ignored --nocapture`.
    #[tokio::test]
    #[ignore = "talks to this machine's Codex on your own subscription"]
    async fn a_refused_seat_finishes_its_answer_in_the_same_session() {
        let data_dir =
            PathBuf::from(std::env::var("DEVPULSE_DATA_DIR").expect("DEVPULSE_DATA_DIR"));
        let home = std::env::home_dir();
        let cwd = tempfile::tempdir().unwrap();
        std::fs::write(cwd.path().join("marker.txt"), "the codeword is HERON-41\n").unwrap();
        let definition = catalog::bundled()
            .unwrap()
            .into_iter()
            .find(|d| d.id == ProviderId::Codex)
            .unwrap();
        let program =
            installed::locate(&definition, home.as_deref(), &data_dir).expect("installed");
        let session = AgentSession::start(
            &definition,
            &program,
            &data_dir,
            cwd.path(),
            SessionSetup {
                access: Access::Looks(vec!["read".to_owned()]),
                ..SessionSetup::default()
            },
        )
        .await
        .unwrap();
        let mut refused = false;
        let mut prompt = "First create a file named made.txt in the current folder. Then, \
                          whether or not that worked, read marker.txt and reply with its codeword."
            .to_owned();
        let mut answer = String::new();
        for _ in 0..2 {
            answer.clear();
            let mut events = session.prompt(&prompt).await.unwrap();
            let mut stop = String::new();
            while let Some(event) = events.recv().await {
                match event {
                    AgentEvent::Text { text } => answer.push_str(&text),
                    AgentEvent::PermissionAsked { request, title, .. } => {
                        println!("    asked {title:?}, refused");
                        refused = true;
                        session.answer(&request, None).await;
                    }
                    AgentEvent::Failed { message } => panic!("{message}"),
                    AgentEvent::TurnEnded { stop: ended } => {
                        stop = ended;
                        break;
                    }
                    _ => {}
                }
            }
            println!("    the turn ended {stop}: {answer:?}");
            if stop != "cancelled" {
                break;
            }
            crate::rooms::brief::AFTER_A_REFUSAL.clone_into(&mut prompt);
        }
        session.close().await;
        assert!(refused, "it never asked, so this proved nothing");
        assert!(
            answer.contains("HERON-41"),
            "it lost its answer: {answer:?}"
        );
        assert!(
            !cwd.path().join("made.txt").exists(),
            "it changed the folder"
        );
    }

    /// A real seat that only talks cannot reach a file by its full path either,
    /// which is what keeps blind answers blind. Run with
    /// `DEVPULSE_DATA_DIR=<the DevPulse data folder> cargo test -p devpulse-clyffy
    /// --lib a_talking_seat_reads -- --ignored --nocapture`.
    #[tokio::test]
    #[ignore = "talks to this machine's Claude Code and Codex on your own subscriptions"]
    async fn a_talking_seat_reads_nothing_outside_its_folder() {
        let elsewhere = tempfile::tempdir().unwrap();
        let marker = elsewhere.path().join("marker.txt");
        std::fs::write(&marker, "the codeword is HERON-41\n").unwrap();
        for id in [ProviderId::ClaudeCode, ProviderId::Codex] {
            let cwd = tempfile::tempdir().unwrap();
            let (answer, _) = one_turn(
                id,
                Access::TalkOnly,
                cwd.path(),
                &format!(
                    "Read the file {} using whatever tool you have, and reply with the codeword \
                     in it. If you cannot, reply exactly NONE.",
                    marker.display()
                ),
            )
            .await;
            assert!(
                !answer.contains("HERON-41"),
                "{}: it read the file",
                id.key()
            );
        }
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
