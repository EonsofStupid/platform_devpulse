//! A persistent ACP session: one agent process and one opened or restored session for
//! the whole thread, many `session/prompt`s on it.
//!
//! The connection runs on its own task. Commands (prompt, cancel, close)
//! reach it over a channel; each turn's `session/update`s are forwarded as
//! [`AgentEvent`]s until its stop reason arrives. A permission request is
//! answered from a spawned task — the SDK's dispatch loop must not wait for
//! you — so the conversation keeps flowing while the question is on screen.

use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;

use agent_client_protocol::schema::ProtocolVersion;
use agent_client_protocol::util::MatchDispatch;
use agent_client_protocol::v1::schema::{
    CancelNotification, ContentBlock, ContentChunk, EnvVariable, Implementation, InitializeRequest,
    LoadSessionRequest, McpServer, McpServerStdio, NewSessionRequest, PermissionOptionKind,
    RequestPermissionOutcome, RequestPermissionRequest, RequestPermissionResponse,
    ResumeSessionRequest, SelectedPermissionOutcome, SessionId, SessionNotification, SessionUpdate,
    StopReason, ToolCallStatus,
};
use agent_client_protocol::v1::{ActiveSession, ConnectionTo, Dispatch, SessionMessage};
use agent_client_protocol::{AcpAgent, AcpAgentConfig, Agent, Client, ErrorCode};
use anyhow::{Result, anyhow, bail};
use futures::FutureExt;
use tokio::sync::{Mutex, mpsc, oneshot};

use super::{AgentEvent, PERMISSION_WAIT, PermissionChoice, ToolServer, TurnEvents};
use crate::providers::connect::Launch;
use crate::providers::connect::acp::refuse;

mod lifecycle;

/// How long the agent may take to start and open its session.
const START_TIMEOUT: Duration = Duration::from_secs(120);

enum Command {
    Prompt {
        text: String,
        events: mpsc::UnboundedSender<AgentEvent>,
    },
    Cancel,
    Close,
}

/// What the connection task and the handle share.
#[derive(Default)]
struct Shared {
    /// The running turn's events.
    turn: Mutex<Option<mpsc::UnboundedSender<AgentEvent>>>,
    /// Permission requests waiting for your answer, by request id.
    pending: Mutex<HashMap<String, oneshot::Sender<Option<String>>>>,
    /// The ACP session id once it is open.
    session_id: Mutex<Option<String>>,
    /// Told once whether the session opened.
    ready: Mutex<Option<oneshot::Sender<Result<(), String>>>>,
}

/// A live ACP conversation.
pub struct AcpSession {
    commands: mpsc::UnboundedSender<Command>,
    shared: Arc<Shared>,
    connection: lifecycle::Connection,
}

impl AcpSession {
    /// Start the agent and open its session in `cwd`, offering it `tools`.
    ///
    /// # Errors
    /// The agent's or the protocol's own error, or no session in time.
    pub async fn start(
        launch: &Launch,
        cwd: &Path,
        resume: Option<String>,
        tools: Vec<ToolServer>,
    ) -> Result<Self> {
        if resume.as_ref().is_some_and(|id| id.trim().is_empty()) {
            bail!("cannot restore an agent session with an empty id");
        }
        let (commands, receiver) = mpsc::unbounded_channel();
        let (ready_tx, ready_rx) = oneshot::channel();
        let shared = Arc::new(Shared::default());
        *shared.ready.lock().await = Some(ready_tx);
        let connection = lifecycle::Connection::start(
            run(
                launch.clone(),
                cwd.to_path_buf(),
                resume,
                mcp_servers(&tools),
                receiver,
                Arc::clone(&shared),
            ),
            Arc::clone(&shared),
            Duration::from_secs(5),
        );
        Self {
            commands,
            shared,
            connection,
        }
        .await_ready(ready_rx, START_TIMEOUT)
        .await
    }

    async fn await_ready(
        self,
        ready: oneshot::Receiver<Result<(), String>>,
        timeout: Duration,
    ) -> Result<Self> {
        let error = match tokio::time::timeout(timeout, ready).await {
            Ok(Ok(Ok(()))) => return Ok(self),
            Ok(Ok(Err(message))) => message,
            Ok(Err(_)) => "the agent stopped before its session opened".into(),
            Err(_) => format!("the agent opened no session within {}s", timeout.as_secs()),
        };
        self.close().await;
        Err(anyhow!(error))
    }

    /// Send one prompt.
    ///
    /// # Errors
    /// When the session has ended.
    pub fn prompt(&self, text: &str) -> Result<TurnEvents> {
        let (events, receiver) = mpsc::unbounded_channel();
        self.commands
            .send(Command::Prompt {
                text: text.to_owned(),
                events,
            })
            .map_err(|_| anyhow!("the conversation has ended"))?;
        Ok(receiver)
    }

    /// Stop the running turn.
    pub fn cancel(&self) {
        let _ = self.commands.send(Command::Cancel);
    }

    /// Answer a waiting permission request.
    pub async fn answer(&self, request: &str, choice: Option<String>) -> bool {
        self.shared
            .pending
            .lock()
            .await
            .remove(request)
            .is_some_and(|waiting| waiting.send(choice).is_ok())
    }

    /// The ACP session id.
    pub async fn session_id(&self) -> Option<String> {
        self.shared.session_id.lock().await.clone()
    }

    /// End the conversation; the agent's process stops with the connection.
    pub async fn close(&self) {
        let _ = self.commands.send(Command::Close);
        self.connection.close().await;
    }
}

/// Map an ACP update to what the chat shows.
fn event_for(update: SessionUpdate) -> Option<AgentEvent> {
    // In progress, and any status a newer agent adds, reads as running.
    let status = |s: ToolCallStatus| match s {
        ToolCallStatus::Pending => "pending",
        ToolCallStatus::Completed => "done",
        ToolCallStatus::Failed => "failed",
        _ => "running",
    };
    match update {
        SessionUpdate::AgentMessageChunk(ContentChunk {
            content: ContentBlock::Text(text),
            ..
        }) if !text.text.is_empty() => Some(AgentEvent::Text { text: text.text }),
        SessionUpdate::AgentThoughtChunk(ContentChunk {
            content: ContentBlock::Text(text),
            ..
        }) if !text.text.is_empty() => Some(AgentEvent::Thought { text: text.text }),
        SessionUpdate::ToolCall(call) => Some(AgentEvent::Tool {
            id: call.tool_call_id.0.to_string(),
            title: call.title,
            status: status(call.status).to_owned(),
        }),
        SessionUpdate::ToolCallUpdate(update) => Some(AgentEvent::Tool {
            id: update.tool_call_id.0.to_string(),
            title: update.fields.title.unwrap_or_default(),
            status: update.fields.status.map_or("running", status).to_owned(),
        }),
        _ => None,
    }
}

fn stop_word(stop: StopReason) -> String {
    match stop {
        StopReason::EndTurn => "end_turn",
        StopReason::MaxTokens => "max_tokens",
        StopReason::MaxTurnRequests => "max_turn_requests",
        StopReason::Refusal => "refusal",
        StopReason::Cancelled => "cancelled",
        _ => "other",
    }
    .to_owned()
}

/// Ask you about a permission request on the running turn; `None` refuses.
async fn ask_you(
    shared: &Shared,
    request: &RequestPermissionRequest,
    wait: Duration,
) -> Option<String> {
    let turn = shared.turn.lock().await.clone()?;
    let id = uuid::Uuid::new_v4().to_string();
    let (answer, waiting) = oneshot::channel();
    shared.pending.lock().await.insert(id.clone(), answer);
    let choices = request
        .options
        .iter()
        .map(|o| PermissionChoice {
            id: o.option_id.0.to_string(),
            label: o.name.clone(),
            allows: matches!(
                o.kind,
                PermissionOptionKind::AllowOnce | PermissionOptionKind::AllowAlways
            ),
        })
        .collect();
    let title = request
        .tool_call
        .fields
        .title
        .clone()
        .unwrap_or_else(|| "The agent asks for permission".to_owned());
    if turn
        .send(AgentEvent::PermissionAsked {
            request: id.clone(),
            title,
            choices,
        })
        .is_err()
    {
        shared.pending.lock().await.remove(&id);
        return None;
    }
    let decision = tokio::time::timeout(wait, waiting)
        .await
        .ok()
        .and_then(Result::ok)
        .flatten();
    shared.pending.lock().await.remove(&id);
    let _ = turn.send(AgentEvent::PermissionResolved { request: id });
    decision
}

fn response_for(
    request: &RequestPermissionRequest,
    choice: Option<String>,
) -> RequestPermissionResponse {
    match choice {
        Some(choice) if request.options.iter().any(|o| *o.option_id.0 == *choice) => {
            RequestPermissionResponse::new(RequestPermissionOutcome::Selected(
                SelectedPermissionOutcome::new(choice),
            ))
        }
        _ => refuse(request),
    }
}

async fn forward(dispatch: Dispatch, events: &mpsc::UnboundedSender<AgentEvent>) {
    let handled = MatchDispatch::new(dispatch.into_raw())
        .if_notification(async |notification: SessionNotification| {
            if let Some(event) = event_for(notification.update) {
                let _ = events.send(event);
            }
            Ok(())
        })
        .await
        .otherwise_ignore();
    if let Err(e) = handled {
        tracing::debug!(target: "providers", error = %e, "an agent update was not understood");
    }
}

/// What a protocol error says to you: a login the agent wants is named as one.
fn failure_message(error: &agent_client_protocol::Error) -> String {
    if error.code == ErrorCode::AUTH_REQUIRED {
        format!("Sign in first — the agent says: {error}")
    } else {
        error.to_string()
    }
}

async fn tell_ready(shared: &Shared, outcome: Result<(), String>) {
    if let Some(ready) = shared.ready.lock().await.take() {
        let _ = ready.send(outcome);
    }
}

/// Forward one turn's updates until its stop reason, while honouring
/// cancel and close. Returns `true` when the conversation is closing.
async fn run_turn(
    session: &mut ActiveSession<'_, Agent>,
    control: &ConnectionTo<Agent>,
    id: &SessionId,
    events: &mpsc::UnboundedSender<AgentEvent>,
    commands: &mut mpsc::UnboundedReceiver<Command>,
    shared: &Shared,
) -> bool {
    loop {
        tokio::select! {
            update = session.read_update() => match update {
                Ok(SessionMessage::Message(dispatch)) => forward(dispatch, events).await,
                Ok(SessionMessage::PromptResponse(Ok(response))) => {
                    let _ = events.send(AgentEvent::TurnEnded {
                        stop: stop_word(response.stop_reason),
                    });
                    return false;
                }
                // The agent refused this turn; the session stays open for the next.
                Ok(SessionMessage::PromptResponse(Err(e))) => {
                    let _ = events.send(AgentEvent::Failed { message: failure_message(&e) });
                    return false;
                }
                Ok(_) => {}
                Err(e) => {
                    let _ = events.send(AgentEvent::Failed { message: e.to_string() });
                    return false;
                }
            },
            command = commands.recv() => match command {
                Some(Command::Cancel) => {
                    shared.pending.lock().await.clear();
                    let _ = control.send_notification(CancelNotification::new(id.clone()));
                }
                Some(Command::Prompt { events: other, .. }) => {
                    let _ = other.send(AgentEvent::Failed {
                        message: "a turn is still running; wait for it or stop it".to_owned(),
                    });
                }
                Some(Command::Close) | None => {
                    let _ = control.send_notification(CancelNotification::new(id.clone()));
                    return true;
                }
            },
        }
    }
}

async fn run(
    launch: Launch,
    cwd: std::path::PathBuf,
    resume: Option<String>,
    servers: Vec<McpServer>,
    mut commands: mpsc::UnboundedReceiver<Command>,
    shared: Arc<Shared>,
) {
    let agent = AcpAgent::new(
        AcpAgentConfig::new(&launch.program)
            .args(launch.args.iter().cloned())
            .envs(launch.env.iter().cloned()),
    );
    let handler_shared = Arc::clone(&shared);
    let session_shared = Arc::clone(&shared);
    let outcome = Client
        .v1()
        .on_receive_request(
            async move |request: RequestPermissionRequest,
                        responder,
                        connection: ConnectionTo<Agent>| {
                // Waiting for you happens off the dispatch loop.
                let shared = Arc::clone(&handler_shared);
                connection.spawn(async move {
                    let choice = ask_you(&shared, &request, PERMISSION_WAIT).await;
                    responder.respond(response_for(&request, choice))
                })
            },
            agent_client_protocol::on_receive_request!(),
        )
        .connect_with(agent, async move |connection: ConnectionTo<Agent>| {
            let mut session = open_session(&connection, &cwd, resume.as_deref(), servers).await?;
            *session_shared.session_id.lock().await = Some(session.session_id().0.to_string());
            tell_ready(&session_shared, Ok(())).await;
            let control = session.connection().clone();
            let id = session.session_id().clone();
            while let Some(command) = commands.recv().await {
                let (text, events) = match command {
                    Command::Prompt { text, events } => (text, events),
                    Command::Cancel => continue,
                    Command::Close => break,
                };
                *session_shared.turn.lock().await = Some(events.clone());
                let closing = if let Err(e) = session.send_prompt(&text) {
                    let _ = events.send(AgentEvent::Failed {
                        message: e.to_string(),
                    });
                    false
                } else {
                    run_turn(
                        &mut session,
                        &control,
                        &id,
                        &events,
                        &mut commands,
                        &session_shared,
                    )
                    .await
                };
                *session_shared.turn.lock().await = None;
                session_shared.pending.lock().await.clear();
                if closing {
                    break;
                }
            }
            Ok(())
        })
        .await;
    if let Err(e) = outcome {
        let message = failure_message(&e);
        tell_ready(&shared, Err(message.clone())).await;
        if let Some(turn) = shared.turn.lock().await.take() {
            let _ = turn.send(AgentEvent::Failed { message });
        }
    }
    shared.pending.lock().await.clear();
}

/// ACP's stdio form, the one transport every agent must support.
fn mcp_servers(tools: &[ToolServer]) -> Vec<McpServer> {
    tools
        .iter()
        .map(|tool| {
            McpServer::Stdio(
                McpServerStdio::new(tool.name.clone(), tool.command.clone())
                    .args(tool.args.clone())
                    .env(
                        tool.env
                            .iter()
                            .map(|(name, value)| EnvVariable::new(name.clone(), value.clone()))
                            .collect(),
                    ),
            )
        })
        .collect()
}

async fn open_session(
    connection: &ConnectionTo<Agent>,
    cwd: &Path,
    resume: Option<&str>,
    servers: Vec<McpServer>,
) -> Result<ActiveSession<'static, Agent>, agent_client_protocol::Error> {
    let initialized = connection
        .send_request(
            InitializeRequest::new(ProtocolVersion::V1)
                .client_info(Implementation::new("DevPulse", env!("CARGO_PKG_VERSION"))),
        )
        .block_task()
        .await?;
    let Some(id) = resume else {
        return Ok(connection
            .build_session_from(NewSessionRequest::new(cwd).mcp_servers(servers))
            .block_task()
            .start_session()
            .await?
            .session);
    };
    let capabilities = initialized.agent_capabilities;
    if capabilities.session_capabilities.resume.is_some() {
        return Ok(connection
            .resume_session_from(ResumeSessionRequest::new(id.to_owned(), cwd).mcp_servers(servers))
            .block_task()
            .start_session()
            .await?
            .session);
    }
    if !capabilities.load_session {
        return Err(agent_client_protocol::Error::invalid_request()
            .data("This agent cannot restore saved sessions: it advertises neither session/resume nor session/load"));
    }
    let mut session = connection
        .load_session_from(LoadSessionRequest::new(id.to_owned(), cwd).mcp_servers(servers))
        .block_task()
        .start_session()
        .await?
        .session;
    // ACP requires load replay before its response. The SDK processes that
    // response in order, so all replay is already queued here. Poll only
    // ready updates, without a timeout that could eat the next live turn.
    while let Some(update) = session.read_update().now_or_never() {
        update?;
    }
    Ok(session)
}

#[cfg(test)]
#[path = "acp_restore_tests.rs"]
mod restore_tests;

#[cfg(test)]
#[path = "acp_lifecycle_tests.rs"]
mod lifecycle_tests;

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use agent_client_protocol::v1::schema::{
        PermissionOption, TextContent, ToolCall, ToolCallUpdate, ToolCallUpdateFields,
    };

    use super::*;

    #[tokio::test]
    async fn every_permission_resolution_removes_the_request_and_is_observable() {
        for action in ["answer", "expire", "cancel"] {
            let shared = Arc::new(Shared::default());
            let (events, mut received) = mpsc::unbounded_channel();
            *shared.turn.lock().await = Some(events);
            let worker = Arc::clone(&shared);
            let request = RequestPermissionRequest::new(
                "s1",
                ToolCallUpdate::new("t1", ToolCallUpdateFields::default()),
                vec![PermissionOption::new(
                    "allow",
                    "Allow",
                    PermissionOptionKind::AllowOnce,
                )],
            );
            let wait = if action == "expire" {
                Duration::ZERO
            } else {
                Duration::from_secs(10)
            };
            let task =
                devpulse_telemetry::spawn(async move { ask_you(&worker, &request, wait).await });
            let AgentEvent::PermissionAsked { request, .. } = received.recv().await.unwrap() else {
                panic!("permission was not published")
            };
            match action {
                "answer" => {
                    shared
                        .pending
                        .lock()
                        .await
                        .remove(&request)
                        .unwrap()
                        .send(Some("allow".into()))
                        .unwrap();
                }
                "cancel" => shared.pending.lock().await.clear(),
                _ => {}
            }
            assert_eq!(
                task.await.unwrap(),
                (action == "answer").then(|| "allow".to_owned())
            );
            assert_eq!(
                received.recv().await,
                Some(AgentEvent::PermissionResolved { request })
            );
            assert!(shared.pending.lock().await.is_empty());
        }
    }

    #[test]
    fn updates_become_what_the_chat_shows() {
        let text = SessionUpdate::AgentMessageChunk(ContentChunk::new(ContentBlock::Text(
            TextContent::new("hi"),
        )));
        assert_eq!(
            event_for(text),
            Some(AgentEvent::Text { text: "hi".into() })
        );
        let tool = SessionUpdate::ToolCall(ToolCall::new("t1", "Read Cargo.toml"));
        assert_eq!(
            event_for(tool),
            Some(AgentEvent::Tool {
                id: "t1".into(),
                title: "Read Cargo.toml".into(),
                status: "pending".into()
            })
        );
        let done = SessionUpdate::ToolCallUpdate(ToolCallUpdate::new(
            "t1",
            ToolCallUpdateFields::new().status(ToolCallStatus::Completed),
        ));
        assert_eq!(
            event_for(done),
            Some(AgentEvent::Tool {
                id: "t1".into(),
                title: String::new(),
                status: "done".into()
            })
        );
    }

    #[test]
    fn your_choice_is_sent_only_when_the_agent_offered_it() {
        let request = RequestPermissionRequest::new(
            "s1",
            ToolCallUpdate::new("t1", ToolCallUpdateFields::default()),
            vec![
                PermissionOption::new("allow", "Allow", PermissionOptionKind::AllowOnce),
                PermissionOption::new("deny", "Deny", PermissionOptionKind::RejectOnce),
            ],
        );
        let chosen = response_for(&request, Some("allow".into()));
        assert!(matches!(
            chosen.outcome,
            RequestPermissionOutcome::Selected(ref s) if &*s.option_id.0 == "allow"
        ));
        let invented = response_for(&request, Some("everything".into()));
        assert!(matches!(
            invented.outcome,
            RequestPermissionOutcome::Selected(ref s) if &*s.option_id.0 == "deny"
        ));
        let none = response_for(&request, None);
        assert!(matches!(
            none.outcome,
            RequestPermissionOutcome::Selected(ref s) if &*s.option_id.0 == "deny"
        ));
    }
}
