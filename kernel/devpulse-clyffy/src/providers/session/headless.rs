//! A headless conversation: the agent's own program runs once per turn in
//! its headless mode, streaming what it prints; later turns pass back the
//! session id it reported, so it keeps the conversation (Claude Code's
//! `--resume`). Its definition's `connect.conversation` says which
//! arguments, how to resume, and what it prints.

use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use anyhow::{Result, anyhow};
use serde_json::Value;
use tokio::io::{AsyncBufReadExt, AsyncReadExt, BufReader};
use tokio::sync::{Mutex, mpsc, oneshot};
use tokio_util::task::AbortOnDropHandle;

use super::{AgentEvent, TurnEvents};
use crate::providers::connect::Launch;
use crate::providers::definition::{ConversationSpec, StreamFormat};

/// How much of the agent's error output a failed turn keeps.
const STDERR_TAIL: usize = 4 * 1024;
/// How long a turn waits for the last turn's process to finish exiting.
const EXIT_WAIT: std::time::Duration = std::time::Duration::from_secs(15);

/// A live headless conversation.
pub struct HeadlessSession {
    program: PathBuf,
    provider_program: PathBuf,
    env: Vec<(String, String)>,
    conversation: ConversationSpec,
    cwd: PathBuf,
    /// Every turn adds the conversation's `talk_only` arguments.
    talk_only: bool,
    /// The session id the agent reported (continues the conversation).
    session: Arc<Mutex<Option<String>>>,
    /// Stops the running turn; empty once the turn has ended.
    stop: Arc<Mutex<Option<oneshot::Sender<()>>>>,
    /// The last turn's task, which may still be waiting for its process to
    /// exit after the turn ended.
    previous: Mutex<Option<AbortOnDropHandle<()>>>,
    closed: AtomicBool,
}

impl HeadlessSession {
    /// A conversation with the agent at `provider_program` (its definition's
    /// conversation spec), in `cwd`; `resume` continues an earlier one, and
    /// `talk_only` turns the agent's tools off on every turn.
    #[must_use]
    pub fn new(
        launch: &Launch,
        provider_program: &Path,
        conversation: ConversationSpec,
        cwd: &Path,
        resume: Option<String>,
        talk_only: bool,
    ) -> Self {
        Self {
            program: launch.program.clone(),
            provider_program: provider_program.to_path_buf(),
            env: launch.env.clone(),
            conversation,
            cwd: cwd.to_path_buf(),
            talk_only,
            session: Arc::new(Mutex::new(resume)),
            stop: Arc::new(Mutex::new(None)),
            previous: Mutex::new(None),
            closed: AtomicBool::new(false),
        }
    }

    /// The session id the agent reported.
    pub async fn session_id(&self) -> Option<String> {
        self.session.lock().await.clone()
    }

    /// Stop the running turn (its process is ended).
    pub async fn cancel(&self) {
        if let Some(stop) = self.stop.lock().await.take() {
            let _ = stop.send(());
        }
    }

    /// End this conversation and wait for its process task to release the child.
    pub async fn close(&self) {
        self.closed.store(true, Ordering::SeqCst);
        self.cancel().await;
        let mut previous = self.previous.lock().await;
        // A dispatch already holding the task slot may have installed a new
        // stop sender while Close was waiting for it.
        self.cancel().await;
        if let Some(task) = previous.take()
            && let Err(error) = finish_process(task, std::time::Duration::from_secs(5)).await
        {
            tracing::warn!(target: "providers", %error, "headless conversation forced closed");
        }
    }

    /// The arguments for one turn.
    fn turn_args(&self, prompt: &str, session: Option<&str>) -> Vec<String> {
        let program = self.provider_program.to_string_lossy();
        let fill = |a: &String| {
            a.replace("{program}", &program)
                .replace("{prompt}", prompt)
                .replace("{session}", session.unwrap_or_default())
        };
        let mut args: Vec<String> = self.conversation.args.iter().map(fill).collect();
        if session.is_some() {
            args.extend(self.conversation.resume.iter().map(fill));
        }
        if self.talk_only {
            args.extend(self.conversation.talk_only.iter().cloned());
        }
        args
    }

    /// Run one turn.
    ///
    /// # Errors
    /// When a turn is already running, or the program cannot start.
    pub async fn prompt(&self, text: &str) -> Result<TurnEvents> {
        let mut previous = self.previous.lock().await;
        if self.closed.load(Ordering::SeqCst) {
            return Err(anyhow!("the conversation has ended"));
        }
        if self.stop.lock().await.is_some() {
            return Err(anyhow!("a turn is still running; wait for it or stop it"));
        }
        // The last turn has ended; let its process finish exiting so it has
        // saved the conversation this turn resumes.
        if let Some(task) = previous.take() {
            finish_process(task, EXIT_WAIT).await?;
        }
        if self.closed.load(Ordering::SeqCst) {
            return Err(anyhow!("the conversation has ended"));
        }
        let mut stop_slot = self.stop.lock().await;
        if stop_slot.is_some() {
            return Err(anyhow!("a turn is still running; wait for it or stop it"));
        }
        let session = self.session.lock().await.clone();
        let args = self.turn_args(text, session.as_deref());
        let mut command = tokio::process::Command::new(&self.program);
        command
            .args(&args)
            .envs(self.env.iter().map(|(k, v)| (k.as_str(), v.as_str())))
            .current_dir(&self.cwd)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);
        #[cfg(windows)]
        {
            // No console window flashes up from a GUI app.
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            command.creation_flags(CREATE_NO_WINDOW);
        }
        let mut child = command
            .spawn()
            .map_err(|e| anyhow!("{} could not start: {e}", self.program.display()))?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| anyhow!("no output from {}", self.program.display()))?;
        let stderr = child.stderr.take();
        let (stop_tx, stop_rx) = oneshot::channel();
        *stop_slot = Some(stop_tx);
        drop(stop_slot);

        let (events, receiver) = mpsc::unbounded_channel();
        let task = AbortOnDropHandle::new(devpulse_telemetry::spawn(stream_turn(Turn {
            child,
            stdout,
            stderr,
            stop: stop_rx,
            events,
            format: self.conversation.output,
            session: Arc::clone(&self.session),
            stop_slot: Arc::clone(&self.stop),
        })));
        *previous = Some(task);
        Ok(receiver)
    }
}

async fn finish_process(
    mut task: AbortOnDropHandle<()>,
    timeout: std::time::Duration,
) -> Result<()> {
    if let Ok(result) = tokio::time::timeout(timeout, &mut task).await {
        result.map_err(|error| anyhow!("the agent process task failed: {error}"))
    } else {
        task.abort();
        let _ = task.await;
        Err(anyhow!(
            "the previous agent process did not exit in time and was stopped; no new prompt was dispatched"
        ))
    }
}

/// One running turn.
struct Turn {
    child: tokio::process::Child,
    stdout: tokio::process::ChildStdout,
    stderr: Option<tokio::process::ChildStderr>,
    /// A stop you asked for.
    stop: oneshot::Receiver<()>,
    events: mpsc::UnboundedSender<AgentEvent>,
    format: StreamFormat,
    /// Where the session id the agent reports goes.
    session: Arc<Mutex<Option<String>>>,
    /// Cleared when the turn ends, so the next one may start.
    stop_slot: Arc<Mutex<Option<oneshot::Sender<()>>>>,
}

/// Stream one turn's output as events until it ends, then wait for its
/// process to exit.
async fn stream_turn(mut turn: Turn) {
    let mut lines = BufReader::new(turn.stdout).lines();
    let mut ended = false;
    loop {
        tokio::select! {
            line = lines.next_line() => match line {
                Ok(Some(line)) => {
                    for item in read_line(turn.format, &line) {
                        match item {
                            Line::Session(id) => *turn.session.lock().await = Some(id),
                            Line::Event(event) => {
                                if event.ends_turn() {
                                    // The turn is over for you now.
                                    turn.stop_slot.lock().await.take();
                                    ended = true;
                                }
                                let _ = turn.events.send(event);
                            }
                        }
                    }
                }
                Ok(None) => break,
                Err(e) => {
                    turn.stop_slot.lock().await.take();
                    let _ = turn.events.send(AgentEvent::Failed { message: e.to_string() });
                    ended = true;
                    break;
                }
            },
            // Only a stop you asked for: the signal also fires when the turn
            // ends and drops it, which is not a cancel.
            asked = &mut turn.stop, if !ended => {
                if asked.is_err() {
                    ended = true;
                    continue;
                }
                let _ = turn.child.start_kill();
                let _ = turn.events.send(AgentEvent::TurnEnded { stop: "cancelled".to_owned() });
                ended = true;
                break;
            }
        }
    }
    let status = turn.child.wait().await;
    if ended {
        return;
    }
    // It exited without saying the turn was over.
    let event = if status.as_ref().is_ok_and(std::process::ExitStatus::success) {
        AgentEvent::TurnEnded {
            stop: "end_turn".to_owned(),
        }
    } else {
        let tail = error_tail(turn.stderr).await;
        AgentEvent::Failed {
            message: if tail.is_empty() {
                format!("the agent stopped: {status:?}")
            } else {
                tail
            },
        }
    };
    turn.stop_slot.lock().await.take();
    let _ = turn.events.send(event);
}

/// The end of what the agent printed as errors.
async fn error_tail(stderr: Option<tokio::process::ChildStderr>) -> String {
    let Some(mut stderr) = stderr else {
        return String::new();
    };
    let mut buffer = Vec::new();
    let _ = stderr.read_to_end(&mut buffer).await;
    let mut tail = String::new();
    String::from_utf8_lossy(&buffer)
        .trim()
        .clone_into(&mut tail);
    if tail.len() > STDERR_TAIL {
        let mut start = tail.len() - STDERR_TAIL;
        while !tail.is_char_boundary(start) {
            start += 1;
        }
        tail.drain(..start);
    }
    tail
}

/// What one printed line means.
#[derive(Debug, Clone, PartialEq, Eq)]
enum Line {
    /// The agent's session id (continues the conversation).
    Session(String),
    /// Something to show.
    Event(AgentEvent),
}

fn read_line(format: StreamFormat, line: &str) -> Vec<Line> {
    match format {
        StreamFormat::Text => vec![Line::Event(AgentEvent::Text {
            text: format!("{line}\n"),
        })],
        StreamFormat::ClaudeStreamJson => claude_line(line),
    }
}

/// One line of Claude Code's `--output-format stream-json`.
fn claude_line(line: &str) -> Vec<Line> {
    let Ok(json) = serde_json::from_str::<Value>(line) else {
        return Vec::new();
    };
    let text = |v: &Value, key: &str| {
        v.get(key)
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_owned()
    };
    match json.get("type").and_then(Value::as_str) {
        Some("system") if json.get("subtype").and_then(Value::as_str) == Some("init") => json
            .get("session_id")
            .and_then(Value::as_str)
            .map(|id| vec![Line::Session(id.to_owned())])
            .unwrap_or_default(),
        Some("stream_event") => {
            let Some(delta) = json.pointer("/event/delta") else {
                return Vec::new();
            };
            // Empty chunks (Claude Code sends some for hidden thinking)
            // carry nothing to show.
            match delta.get("type").and_then(Value::as_str) {
                Some("text_delta") => Some(text(delta, "text"))
                    .filter(|t| !t.is_empty())
                    .map(|text| vec![Line::Event(AgentEvent::Text { text })])
                    .unwrap_or_default(),
                Some("thinking_delta") => Some(text(delta, "thinking"))
                    .filter(|t| !t.is_empty())
                    .map(|text| vec![Line::Event(AgentEvent::Thought { text })])
                    .unwrap_or_default(),
                _ => Vec::new(),
            }
        }
        Some("assistant") => content(&json)
            .filter(|block| block.get("type").and_then(Value::as_str) == Some("tool_use"))
            .map(|block| {
                Line::Event(AgentEvent::Tool {
                    id: text(block, "id"),
                    title: text(block, "name"),
                    status: "running".to_owned(),
                })
            })
            .collect(),
        Some("user") => content(&json)
            .filter(|block| block.get("type").and_then(Value::as_str) == Some("tool_result"))
            .map(|block| {
                let failed = block.get("is_error").and_then(Value::as_bool) == Some(true);
                Line::Event(AgentEvent::Tool {
                    id: text(block, "tool_use_id"),
                    title: String::new(),
                    status: if failed { "failed" } else { "done" }.to_owned(),
                })
            })
            .collect(),
        Some("result") => {
            let mut lines: Vec<Line> = json
                .get("session_id")
                .and_then(Value::as_str)
                .map(|id| vec![Line::Session(id.to_owned())])
                .unwrap_or_default();
            let subtype = text(&json, "subtype");
            let failed = json.get("is_error").and_then(Value::as_bool) == Some(true);
            lines.push(Line::Event(if failed {
                let said = text(&json, "result");
                AgentEvent::Failed {
                    message: if said.is_empty() { subtype } else { said },
                }
            } else {
                AgentEvent::TurnEnded {
                    stop: if subtype == "success" {
                        "end_turn".to_owned()
                    } else {
                        subtype
                    },
                }
            }));
            lines
        }
        _ => Vec::new(),
    }
}

/// The content blocks of a `message`.
fn content(json: &Value) -> impl Iterator<Item = &Value> {
    json.pointer("/message/content")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use futures::FutureExt;

    #[tokio::test]
    async fn teardown_timeout_disposes_the_task_before_returning_failure() {
        let (held, disposed) = oneshot::channel::<()>();
        let task = AbortOnDropHandle::new(devpulse_telemetry::spawn(async move {
            let _held = held;
            std::future::pending::<()>().await;
        }));
        let error = finish_process(task, std::time::Duration::from_millis(10))
            .await
            .unwrap_err();
        assert!(error.to_string().contains("no new prompt was dispatched"));
        assert!(disposed.now_or_never().unwrap().is_err());
    }

    #[tokio::test]
    async fn cancelling_close_does_not_detach_the_process_task_or_reopen_the_session() {
        let session = session(false);
        let (held, disposed) = oneshot::channel::<()>();
        *session.previous.lock().await = Some(AbortOnDropHandle::new(devpulse_telemetry::spawn(
            async move {
                let _held = held;
                std::future::pending::<()>().await;
            },
        )));
        assert!(
            tokio::time::timeout(std::time::Duration::from_millis(10), session.close())
                .await
                .is_err()
        );
        assert!(
            tokio::time::timeout(std::time::Duration::from_secs(5), disposed)
                .await
                .unwrap()
                .is_err()
        );
        let error = session.prompt("must not launch").await.unwrap_err();
        assert!(error.to_string().contains("conversation has ended"));
        session.close().await;
    }

    #[tokio::test]
    async fn close_during_previous_exit_prevents_a_new_dispatch() {
        let session = session(false);
        let (release, held) = oneshot::channel();
        *session.previous.lock().await = Some(AbortOnDropHandle::new(devpulse_telemetry::spawn(
            async move {
                let _ = held.await;
            },
        )));
        let (result, ()) = tokio::join!(session.prompt("must not launch"), async {
            while session.previous.try_lock().is_ok() {
                tokio::task::yield_now().await;
            }
            tokio::join!(session.close(), async {
                release.send(()).unwrap();
            });
        });
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("conversation has ended")
        );
    }

    #[cfg(windows)]
    #[tokio::test]
    async fn close_and_drop_terminate_the_real_headless_child() {
        for drop_session in [false, true] {
            let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
            let port = listener.local_addr().unwrap().port();
            let mut session = session(false);
            session.program = "powershell".into();
            session.cwd = std::env::current_dir().unwrap();
            session.conversation.output = StreamFormat::Text;
            session.conversation.args = vec![
                "-NoProfile".into(),
                "-NonInteractive".into(),
                "-Command".into(),
                format!(
                    "$client = New-Object Net.Sockets.TcpClient('127.0.0.1', {port}); while ($true) {{ [Threading.Thread]::Sleep(100) }}"
                ),
            ];
            let _events = session.prompt("fixture").await.unwrap();
            let (mut child, _) =
                tokio::time::timeout(std::time::Duration::from_secs(10), listener.accept())
                    .await
                    .unwrap()
                    .unwrap();
            if !drop_session {
                session.close().await;
                assert!(session.prompt("after close").await.is_err());
            }
            drop(session);
            let mut byte = [0];
            let ended =
                tokio::time::timeout(std::time::Duration::from_secs(5), child.read(&mut byte))
                    .await
                    .unwrap();
            assert!(
                matches!(ended, Ok(0)) || ended.is_err(),
                "child retained its socket: {ended:?}"
            );
        }
    }

    #[test]
    fn claude_stream_json_becomes_events_and_the_session_id() {
        // Lines in the shape a real Claude Code 2.1.296 turn printed.
        let lines = [
            r#"{"type":"rate_limit_event"}"#,
            r#"{"type":"system","subtype":"init","session_id":"abc"}"#,
            r#"{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"thinking_delta","thinking":""}}}"#,
            r#"{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"thinking_delta","thinking":"hmm"}}}"#,
            r#"{"type":"stream_event","event":{"type":"content_block_delta","delta":{"type":"text_delta","text":"hello there"}}}"#,
            r#"{"type":"assistant","message":{"content":[{"type":"text","text":"hello there"},{"type":"tool_use","id":"tu1","name":"Read"}]}}"#,
            r#"{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"tu1","is_error":false}]}}"#,
            r#"{"type":"result","subtype":"success","result":"hello there","session_id":"abc","is_error":false}"#,
        ];
        let read: Vec<Line> = lines
            .iter()
            .flat_map(|l| read_line(StreamFormat::ClaudeStreamJson, l))
            .collect();
        assert_eq!(
            read,
            [
                Line::Session("abc".into()),
                Line::Event(AgentEvent::Thought { text: "hmm".into() }),
                Line::Event(AgentEvent::Text {
                    text: "hello there".into()
                }),
                Line::Event(AgentEvent::Tool {
                    id: "tu1".into(),
                    title: "Read".into(),
                    status: "running".into()
                }),
                Line::Event(AgentEvent::Tool {
                    id: "tu1".into(),
                    title: String::new(),
                    status: "done".into()
                }),
                Line::Session("abc".into()),
                Line::Event(AgentEvent::TurnEnded {
                    stop: "end_turn".into()
                }),
            ]
        );
    }

    #[test]
    fn a_failed_result_says_why() {
        let read = read_line(
            StreamFormat::ClaudeStreamJson,
            r#"{"type":"result","subtype":"error_during_execution","result":"Not logged in","is_error":true}"#,
        );
        assert_eq!(
            read,
            [Line::Event(AgentEvent::Failed {
                message: "Not logged in".into()
            })]
        );
    }

    fn session(talk_only: bool) -> HeadlessSession {
        HeadlessSession::new(
            &Launch {
                adapter: crate::providers::definition::AdapterKind::Headless,
                program: PathBuf::from("/bin/claude"),
                args: Vec::new(),
                env: Vec::new(),
            },
            Path::new("/bin/claude"),
            ConversationSpec {
                args: vec!["-p".into(), "{prompt}".into()],
                resume: vec!["--resume".into(), "{session}".into()],
                talk_only: vec!["--tools".into(), String::new()],
                output: StreamFormat::ClaudeStreamJson,
            },
            Path::new("/tmp"),
            None,
            talk_only,
        )
    }

    #[test]
    fn later_turns_resume_the_reported_session() {
        let session = session(false);
        assert_eq!(session.turn_args("hi", None), ["-p", "hi"]);
        assert_eq!(
            session.turn_args("again", Some("abc")),
            ["-p", "again", "--resume", "abc"]
        );
    }

    #[test]
    fn a_talk_only_seat_turns_tools_off_on_every_turn() {
        let session = session(true);
        assert_eq!(session.turn_args("hi", None), ["-p", "hi", "--tools", ""]);
        assert_eq!(
            session.turn_args("again", Some("abc")),
            ["-p", "again", "--resume", "abc", "--tools", ""]
        );
    }
}
