//! `AgentHub` — your sessions with every agent, found wherever `DevPulse` runs,
//! and the board they become (plan 0001 B5; plan 0009 R3, owner 2026-10-24:
//! "let devpulse sense wherever it is running if users have claude code,
//! codex, and then devpulse gives you the agenthub board built in").
//!
//! The kernel reads each provider's own history (`providers::history`,
//! authored from your `dpl-chat-store` and its Claude and Codex readers),
//! read only and inside each history folder. This facade lists every
//! provider's sessions newest first and pages one session from its newest
//! record back.

use std::path::PathBuf;

use anyhow::{anyhow, Context, Result};
use devpulse_clyffy::providers::catalog;
use devpulse_clyffy::providers::history::events::{ChatEventContent, EventPresentation};
use devpulse_clyffy::providers::history::{
    self, HistoryCursor, HistoryLimits, HistoryLocator, IndexedSession,
};
use devpulse_clyffy::providers::ProviderId;
use serde::Serialize;
use specta::Type;

/// One session found on this machine.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FoundSession {
    /// Whose.
    pub provider_id: ProviderId,
    /// Opaque; hand it back to page the session.
    pub locator: String,
    /// The provider's own id for it.
    pub native_id: Option<String>,
    /// Its first real request, or "Claude · folder · date".
    pub title: String,
    /// The folder it ran in.
    pub workspace: String,
    /// When it started, as the provider wrote it.
    pub started_at: String,
    /// When its file last changed (Unix milliseconds).
    pub modified_at: i64,
    /// Its file's size in bytes.
    pub bytes: i64,
}

/// One provider's history, as looked for.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct HistorySourceReport {
    /// Whose.
    pub provider_id: ProviderId,
    /// The folder looked in.
    pub root: Option<String>,
    /// It exists: the provider has been used on this machine.
    pub present: bool,
    /// Sessions found.
    pub sessions: u32,
    /// A ceiling was reached; there are more.
    pub truncated: bool,
    /// Why it could not be read, when it could not.
    pub problem: Option<String>,
}

/// Every session found, newest first across providers.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FoundSessions {
    /// The sessions.
    pub sessions: Vec<FoundSession>,
    /// What was looked for, per provider.
    pub sources: Vec<HistorySourceReport>,
}

/// One event of a found session.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FoundEvent {
    /// Its id.
    pub id: String,
    /// What it is (`user_message`, `assistant_message`, `tool_started`, …).
    pub kind: String,
    /// Where it belongs: `conversation`, `activity` or `diagnostics`.
    pub presentation: String,
    /// Its text: the message, the tool, the status line; empty when the
    /// kind says it all.
    pub text: String,
}

/// One page of a found session, oldest event first.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FoundPage {
    /// Whose.
    pub provider_id: ProviderId,
    /// The session.
    pub locator: String,
    /// The events.
    pub events: Vec<FoundEvent>,
    /// Hand it back for the next older page.
    pub next_cursor: Option<String>,
    /// Older events exist.
    pub truncated_before: bool,
}

/// `AgentHub`.
pub struct AgentHub {
    data_dir: PathBuf,
}

impl AgentHub {
    /// `AgentHub` over the providers this `DevPulse` folder knows.
    #[must_use]
    pub fn new(data_dir: PathBuf) -> Self {
        Self { data_dir }
    }

    /// Every session found on this machine, newest first.
    ///
    /// # Errors
    /// When the provider catalog cannot be read.
    pub async fn sessions(&self) -> Result<FoundSessions> {
        let data_dir = self.data_dir.clone();
        devpulse_telemetry::spawn_blocking(move || list(&data_dir))
            .await
            .context("list your sessions")?
    }

    /// One page of a session, ending before `cursor` (the newest page when
    /// `None`).
    ///
    /// # Errors
    /// When the provider has no history here, or the session is gone,
    /// changed, or cannot be read.
    pub async fn page(
        &self,
        provider_id: ProviderId,
        locator: String,
        cursor: Option<String>,
    ) -> Result<FoundPage> {
        let data_dir = self.data_dir.clone();
        devpulse_telemetry::spawn_blocking(move || page(&data_dir, provider_id, &locator, cursor))
            .await
            .context("read the session")?
    }
}

fn limits() -> HistoryLimits {
    HistoryLimits::default()
}

fn list(data_dir: &std::path::Path) -> Result<FoundSessions> {
    let definitions = catalog::load(data_dir)?.definitions;
    let home = std::env::home_dir();
    let (catalog, found) = history::catalog(&definitions, home.as_deref(), limits());
    let mut sessions = Vec::new();
    let mut sources = Vec::new();
    for source in found {
        let mut report = HistorySourceReport {
            provider_id: source.provider_id,
            root: source.root.as_ref().map(|r| r.display().to_string()),
            present: source.present,
            sessions: 0,
            truncated: false,
            problem: source.problem,
        };
        if catalog.has_source(source.provider_id) {
            match catalog.list(source.provider_id, None) {
                Ok(index) => {
                    report.sessions = u32::try_from(index.sessions.len()).unwrap_or(u32::MAX);
                    report.truncated = index.truncated;
                    sessions.extend(index.sessions.into_iter().map(found_session));
                }
                Err(e) => report.problem = Some(e.to_string()),
            }
        }
        sources.push(report);
    }
    sessions.sort_by_key(|s| std::cmp::Reverse(s.modified_at));
    tracing::info!(
        target: "agenthub",
        sessions = sessions.len(),
        sources = sources.len(),
        "sessions found on this machine"
    );
    Ok(FoundSessions { sessions, sources })
}

fn found_session(indexed: IndexedSession) -> FoundSession {
    FoundSession {
        provider_id: indexed.summary.provider_id,
        locator: indexed.locator.value().to_string(),
        native_id: indexed.summary.provider_session_id.map(|id| id.0),
        title: indexed.summary.title,
        workspace: indexed.summary.workspace,
        started_at: indexed.started_at,
        modified_at: i64::try_from(indexed.modified_millis).unwrap_or(i64::MAX),
        bytes: i64::try_from(indexed.source_bytes).unwrap_or(i64::MAX),
    }
}

fn page(
    data_dir: &std::path::Path,
    provider_id: ProviderId,
    locator: &str,
    cursor: Option<String>,
) -> Result<FoundPage> {
    let locator = HistoryLocator::from_value(
        locator
            .parse()
            .map_err(|_| anyhow!("{locator:?} is not a session locator"))?,
    );
    let cursor = cursor
        .map(|c| {
            c.parse()
                .map(HistoryCursor::before)
                .map_err(|_| anyhow!("{c:?} is not a page cursor"))
        })
        .transpose()?;
    let definitions = catalog::load(data_dir)?.definitions;
    let home = std::env::home_dir();
    let (catalog, _) = history::catalog(&definitions, home.as_deref(), limits());
    let page = catalog
        .page(provider_id, locator, cursor)
        .map_err(|e| anyhow!("{e}"))?;
    Ok(FoundPage {
        provider_id,
        locator: page.locator.value().to_string(),
        events: page
            .events
            .into_iter()
            .map(|event| {
                let (kind, text) = describe(&event.content);
                FoundEvent {
                    id: event.id.0.to_string(),
                    kind: kind.to_owned(),
                    presentation: match event.content.presentation() {
                        EventPresentation::Conversation => "conversation",
                        EventPresentation::Activity => "activity",
                        EventPresentation::Diagnostics => "diagnostics",
                    }
                    .to_owned(),
                    text,
                }
            })
            .collect(),
        next_cursor: page.next_cursor.map(|c| c.before_byte().to_string()),
        truncated_before: page.truncated_before,
    })
}

/// An event's kind and its text.
fn describe(content: &ChatEventContent) -> (&'static str, String) {
    match content {
        ChatEventContent::SessionStarted => ("session_started", String::new()),
        ChatEventContent::ModelSelected { model } => ("model_selected", model.clone()),
        ChatEventContent::UserMessage(text) => ("user_message", text.clone()),
        ChatEventContent::AssistantMessage(text) => ("assistant_message", text.clone()),
        ChatEventContent::PlanUpdated(text) => ("plan_updated", text.clone()),
        ChatEventContent::StatusUpdated(text) => ("status_updated", text.clone()),
        ChatEventContent::ToolStarted { label } => ("tool_started", label.clone()),
        ChatEventContent::ToolCompleted { label, succeeded } => (
            if *succeeded {
                "tool_completed"
            } else {
                "tool_failed"
            },
            label.clone(),
        ),
        ChatEventContent::DiffUpdated(text) => ("diff_updated", text.clone()),
        ChatEventContent::ApprovalRequested { summary } => ("approval_requested", summary.clone()),
        ChatEventContent::ApprovalResolved { accepted } => (
            if *accepted {
                "approval_allowed"
            } else {
                "approval_refused"
            },
            String::new(),
        ),
        ChatEventContent::UsageUpdated { summary, .. } => ("usage_updated", summary.clone()),
        ChatEventContent::TurnCompleted => ("turn_completed", String::new()),
        ChatEventContent::TurnInterrupted => ("turn_interrupted", String::new()),
        ChatEventContent::TurnFailed { message } => ("turn_failed", message.clone()),
        ChatEventContent::ProviderWarning(text) => ("provider_warning", text.clone()),
        ChatEventContent::Unknown(payload) => ("unknown", payload.schema.clone()),
    }
}
