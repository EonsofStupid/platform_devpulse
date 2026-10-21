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

use std::path::Path;
use std::time::Duration;

use anyhow::{bail, Result};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

use super::connect;
use super::definition::ProviderDefinition;
use super::types::AgentProtocol;

/// How long a permission request waits for your answer before it is refused.
pub const PERMISSION_WAIT: Duration = Duration::from_secs(10 * 60);

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

/// A live conversation with one agent.
pub struct AgentSession {
    kind: Kind,
}

enum Kind {
    Acp(acp::AcpSession),
    Headless(Box<headless::HeadlessSession>),
}

impl AgentSession {
    /// Start a conversation with an installed agent at `program`, working in
    /// `cwd`. `resume` continues a conversation a headless agent reported
    /// earlier ([`Self::resume_token`]).
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
    ) -> Result<Self> {
        let Some(connect_spec) = &definition.connect else {
            bail!(
                "{} can't hold a conversation yet: its definition has no connect section",
                definition.name()
            );
        };
        let launch = connect::launch(definition, program, data_dir, "")?;
        let kind = match definition.protocol() {
            Some(AgentProtocol::Acp) => Kind::Acp(acp::AcpSession::start(&launch, cwd).await?),
            Some(AgentProtocol::Headless) => {
                let Some(conversation) = &connect_spec.conversation else {
                    bail!(
                        "{} can't hold a conversation yet: its definition has no connect.conversation section",
                        definition.name()
                    );
                };
                Kind::Headless(Box::new(headless::HeadlessSession::new(
                    &launch,
                    program,
                    conversation.clone(),
                    cwd,
                    resume,
                )))
            }
            None => bail!(
                "{} is a desktop app; it can't hold a conversation",
                definition.name()
            ),
        };
        Ok(Self { kind })
    }

    /// Send one prompt; the turn's events arrive on the returned receiver.
    ///
    /// # Errors
    /// When the session has ended.
    pub async fn prompt(&self, text: &str) -> Result<TurnEvents> {
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
            Kind::Headless(session) => session.cancel().await,
        }
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use std::path::PathBuf;

    use super::*;
    use crate::providers::{catalog, discovery::installed, ProviderId};

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
            let program = installed::locate(&definition, home.as_deref()).expect("installed");
            let session = AgentSession::start(&definition, &program, &data_dir, &cwd, None)
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
