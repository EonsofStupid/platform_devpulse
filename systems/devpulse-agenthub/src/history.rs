//! `History` — your sessions with every agent, found wherever `DevPulse` runs,
//! and the board they become (plan 0001 B5; plan 0009 R3, owner 2026-10-24:
//! "let devpulse sense wherever it is running if users have claude code,
//! codex, and then devpulse gives you the agenthub board built in").
//!
//! The kernel reads each provider's own history (`providers::history`,
//! authored from your `dpl-chat-store` and its Claude and Codex readers),
//! read only and inside each history folder. This facade lists every
//! provider's sessions newest first and pages one session from its newest
//! record back.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Instant;

use anyhow::{anyhow, Context, Result};
use devpulse_clyffy::providers::catalog;
use devpulse_clyffy::providers::history::events::{ChatEventContent, EventPresentation};
use devpulse_clyffy::providers::history::{
    self, FoundSource, HistoryCatalog, HistoryCursor, HistoryLimits, HistoryLocator,
    HistorySessionKind, IndexedSession,
};
use devpulse_clyffy::providers::ProviderId;
use serde::{Deserialize, Serialize};
use specta::Type;

/// One session found on this machine.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FoundSession {
    /// Whose.
    pub provider_id: ProviderId,
    /// Opaque; hand it back to page the session.
    pub locator: String,
    /// The provider's own id for it.
    pub native_id: Option<String>,
    /// Positive classification; unknown sessions cannot be continued.
    pub kind: HistorySessionKind,
    /// The provider's parent reference, independent of whether it was found.
    pub parent_native_id: Option<String>,
    /// The unique parent artifact in this provider, when safely resolved.
    pub parent_locator: Option<String>,
    /// Why the parent is linked or left visible at the top level.
    pub parent_resolution: ParentResolution,
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

/// A missing or ambiguous parent never hides a sub-agent or changes its kind.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum ParentResolution {
    /// A user-started session has no agent parent.
    NotApplicable,
    /// Metadata does not identify a parent.
    Unknown,
    /// The referenced parent was not found in the bounded inventory.
    Missing,
    /// Several artifacts have the parent's native id.
    Ambiguous,
    /// Following this edge would make a cycle.
    Cycle,
    /// A unique, acyclic parent artifact is available.
    Resolved,
}

/// One provider's history, as looked for.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize, Type)]
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
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FoundSessions {
    /// The sessions.
    pub sessions: Vec<FoundSession>,
    /// What was looked for, per provider.
    pub sources: Vec<HistorySourceReport>,
}

/// One event of a found session.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize, Type)]
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
#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize, Type)]
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

/// `History`.
pub struct History {
    data_dir: PathBuf,
    history: Arc<Mutex<HistoryCatalog>>,
}

impl History {
    /// `History` over the providers this `DevPulse` folder knows.
    #[must_use]
    pub fn new(data_dir: PathBuf) -> Self {
        Self {
            data_dir,
            history: Arc::default(),
        }
    }

    /// Every session found on this machine, newest first.
    ///
    /// # Errors
    /// When the provider catalog cannot be read.
    pub async fn sessions(&self) -> Result<FoundSessions> {
        let data_dir = self.data_dir.clone();
        let history = Arc::clone(&self.history);
        let requested = Instant::now();
        devpulse_telemetry::spawn_blocking(move || {
            let queue_wait_ms = requested.elapsed().as_millis();
            let refresh_started = Instant::now();
            let (catalog, found) = refresh(&data_dir, &history)?;
            let configuration_ms = refresh_started.elapsed().as_millis();
            let listing_started = Instant::now();
            let sessions = list(&catalog, found);
            tracing::info!(
                target: "agenthub",
                elapsed_ms = requested.elapsed().as_millis(),
                queue_wait_ms,
                configuration_ms,
                listing_ms = listing_started.elapsed().as_millis(),
                "session listing finished"
            );
            Ok(sessions)
        })
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
        let history = Arc::clone(&self.history);
        devpulse_telemetry::spawn_blocking(move || {
            let (catalog, _) = refresh(&data_dir, &history)?;
            page(&catalog, provider_id, &locator, cursor)
        })
        .await
        .context("read the session")?
    }
}

fn refresh(
    data_dir: &std::path::Path,
    history: &Mutex<HistoryCatalog>,
) -> Result<(HistoryCatalog, Vec<FoundSource>)> {
    // Reload the small definitions so moved homes and changed limits take
    // effect. Only sources whose configuration changed lose their indexes.
    let mut catalog = history
        .lock()
        .map_err(|error| anyhow!("history catalog lock poisoned: {error}"))?;
    let definitions = catalog::load(data_dir)?.definitions;
    let home = std::env::home_dir();
    let found = history::catalog(
        &mut catalog,
        &definitions,
        home.as_deref(),
        HistoryLimits::default(),
    );
    // A snapshot shares the sources. Release the configuration lock before
    // reading transcripts; each source synchronizes its own index refresh.
    Ok((catalog.clone(), found))
}

fn list(catalog: &HistoryCatalog, found: Vec<FoundSource>) -> FoundSessions {
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
                    tracing::info!(target: "agenthub", provider = source.provider_id.key(),
                        scanned_files = index.scanned_files, prefix_reads = index.prefix_reads,
                        prefix_bytes = index.prefix_bytes, "history index refreshed");
                    report.sessions = u32::try_from(index.sessions.len()).unwrap_or(u32::MAX);
                    report.truncated = index.truncated;
                    sessions.extend(index.sessions.into_iter().map(found_session));
                }
                Err(e) => report.problem = Some(e.to_string()),
            }
        }
        sources.push(report);
    }
    sessions.sort_by(|a, b| {
        b.modified_at
            .cmp(&a.modified_at)
            .then_with(|| a.provider_id.key().cmp(b.provider_id.key()))
            .then_with(|| a.locator.cmp(&b.locator))
    });
    resolve_parents(&mut sessions);
    tracing::info!(
        target: "agenthub",
        sessions = sessions.len(),
        sources = sources.len(),
        "sessions found on this machine"
    );
    FoundSessions { sessions, sources }
}

fn found_session(indexed: IndexedSession) -> FoundSession {
    FoundSession {
        provider_id: indexed.summary.provider_id,
        locator: indexed.locator.value().to_string(),
        native_id: indexed.summary.provider_session_id.map(|id| id.0),
        kind: indexed.kind,
        parent_native_id: indexed.parent_native_id.map(|id| id.0),
        parent_locator: None,
        parent_resolution: ParentResolution::Unknown,
        title: indexed.summary.title,
        workspace: indexed.summary.workspace,
        started_at: indexed.started_at,
        modified_at: i64::try_from(indexed.modified_millis).unwrap_or(i64::MAX),
        bytes: i64::try_from(indexed.source_bytes).unwrap_or(i64::MAX),
    }
}

fn resolve_parents(sessions: &mut [FoundSession]) {
    let mut identities: HashMap<_, Vec<usize>> = HashMap::new();
    for (i, session) in sessions.iter().enumerate() {
        if let Some(native) = &session.native_id {
            identities
                .entry((session.provider_id, native.clone()))
                .or_default()
                .push(i);
        }
    }
    let mut edges = vec![None; sessions.len()];
    for (i, session) in sessions.iter_mut().enumerate() {
        session.parent_locator = None;
        session.parent_resolution = match (session.kind, &session.parent_native_id) {
            (HistorySessionKind::UserStarted, _) => ParentResolution::NotApplicable,
            (HistorySessionKind::SubAgent, Some(parent)) => {
                match identities
                    .get(&(session.provider_id, parent.clone()))
                    .map(Vec::as_slice)
                {
                    Some([target]) => {
                        edges[i] = Some(*target);
                        ParentResolution::Resolved
                    }
                    Some(_) => ParentResolution::Ambiguous,
                    None => ParentResolution::Missing,
                }
            }
            _ => ParentResolution::Unknown,
        };
    }
    // The bounded inventory is small. Walk each chain without recursion;
    // sever every edge in a cycle, leaving those artifacts visible roots.
    for start in 0..sessions.len() {
        let mut path: Vec<usize> = Vec::new();
        let mut next = Some(start);
        while let Some(node) = next {
            if let Some(at) = path.iter().position(|&previous| previous == node) {
                for &cyclic in &path[at..] {
                    edges[cyclic] = None;
                    sessions[cyclic].parent_resolution = ParentResolution::Cycle;
                }
                break;
            }
            path.push(node);
            next = edges[node];
        }
    }
    for (child, parent) in edges.into_iter().enumerate() {
        sessions[child].parent_locator = parent.map(|index| sessions[index].locator.clone());
    }
}

fn page(
    catalog: &HistoryCatalog,
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

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use std::fs;

    fn session(
        provider: ProviderId,
        locator: &str,
        native: &str,
        parent: Option<&str>,
    ) -> FoundSession {
        FoundSession {
            provider_id: provider,
            locator: locator.into(),
            native_id: Some(native.into()),
            kind: if parent.is_some() {
                HistorySessionKind::SubAgent
            } else {
                HistorySessionKind::UserStarted
            },
            parent_native_id: parent.map(str::to_owned),
            parent_locator: None,
            parent_resolution: ParentResolution::Unknown,
            title: native.into(),
            workspace: String::new(),
            started_at: String::new(),
            modified_at: 0,
            bytes: 0,
        }
    }

    #[test]
    fn parents_are_unique_provider_scoped_artifacts_and_orphans_stay_visible() {
        let provider = ProviderId::Codex;
        let mut sessions = vec![
            session(provider, "1", "parent", None),
            session(ProviderId::ClaudeCode, "2", "parent", None),
            session(provider, "3", "child", Some("parent")),
            session(provider, "4", "grandchild", Some("child")),
            session(provider, "5", "orphan", Some("absent")),
            session(ProviderId::ClaudeCode, "6", "wrong-provider", Some("child")),
        ];
        resolve_parents(&mut sessions);
        assert_eq!(sessions.len(), 6);
        assert_eq!(sessions[2].parent_locator.as_deref(), Some("1"));
        assert_eq!(sessions[3].parent_locator.as_deref(), Some("3"));
        for i in [4, 5] {
            assert_eq!(sessions[i].kind, HistorySessionKind::SubAgent);
            assert_eq!(sessions[i].parent_resolution, ParentResolution::Missing);
            assert_eq!(sessions[i].parent_locator, None);
        }
        // A duplicate native id is a separate artifact, not a safe choice.
        sessions.push(session(provider, "7", "parent", None));
        resolve_parents(&mut sessions);
        assert_eq!(sessions[2].parent_resolution, ParentResolution::Ambiguous);
        assert_eq!(sessions[2].parent_locator, None);
        sessions.pop();
        resolve_parents(&mut sessions);
        assert_eq!(sessions[2].parent_resolution, ParentResolution::Resolved);
        assert_eq!(sessions[2].parent_locator.as_deref(), Some("1"));
    }

    #[test]
    fn cycles_and_unknown_parentage_cannot_hide_sessions() {
        let provider = ProviderId::Codex;
        let mut sessions = vec![
            session(provider, "1", "a", Some("b")),
            session(provider, "2", "b", Some("a")),
            session(provider, "3", "self", Some("self")),
            session(provider, "4", "descendant", Some("a")),
            session(provider, "5", "unknown", None),
            session(provider, "6", "orphan", None),
        ];
        sessions[4].kind = HistorySessionKind::Unknown;
        sessions[5].kind = HistorySessionKind::SubAgent;
        resolve_parents(&mut sessions);
        for node in &sessions[..3] {
            assert_eq!(node.parent_resolution, ParentResolution::Cycle);
            assert_eq!(node.parent_locator, None);
        }
        assert_eq!(sessions[3].parent_locator.as_deref(), Some("1"));
        for node in &sessions[4..] {
            assert_eq!(node.parent_resolution, ParentResolution::Unknown);
            assert_eq!(node.parent_locator, None);
            assert_ne!(node.kind, HistorySessionKind::UserStarted);
        }
        let first = sessions.clone();
        resolve_parents(&mut sessions);
        assert_eq!(sessions, first);
    }

    #[tokio::test]
    async fn session_and_page_requests_share_the_catalog_and_observe_root_changes() {
        let tree = tempfile::tempdir().unwrap();
        let config = tree.path().join("config/providers");
        let root = tree.path().join("history");
        fs::create_dir_all(&config).unwrap();
        fs::create_dir(&root).unwrap();
        let definition = |id: &str, path: &std::path::Path| {
            fs::write(config.join(format!("{id}.toml")), format!(
                "id = \"{id}\"\n[detect]\nexecutables = [\"unused\"]\n[history]\nformat = \"{id}\"\nroot = {:?}\n",
                path.display().to_string()
            )).unwrap();
        };
        // Both definitions are jailed to fixtures, never the person's history.
        definition("claude-code", &root);
        definition("codex", &tree.path().join("missing-codex"));
        let transcript = "{\"type\":\"user\",\"message\":{\"content\":\"First request\"}}\n";
        fs::write(root.join("s.jsonl"), transcript).unwrap();
        let hub = History::new(tree.path().to_path_buf());
        let first = hub.sessions().await.unwrap();
        assert_eq!(first.sessions.len(), 1);
        assert_eq!(first.sessions[0].title, "First request");
        let (catalog, _) = refresh(tree.path(), &hub.history).unwrap();
        assert_eq!(
            catalog
                .list(ProviderId::ClaudeCode, None)
                .unwrap()
                .prefix_reads,
            0
        );
        assert_eq!(hub.sessions().await.unwrap(), first);
        let page = hub
            .page(
                ProviderId::ClaudeCode,
                first.sessions[0].locator.clone(),
                None,
            )
            .await
            .unwrap();
        assert_eq!(page.events[0].text, "First request");
        assert!(page.next_cursor.is_none());

        let other_root = tree.path().join("other-history");
        fs::create_dir(&other_root).unwrap();
        fs::write(
            other_root.join("s.jsonl"),
            transcript.replace("First", "Other"),
        )
        .unwrap();
        definition("claude-code", &other_root);
        let moved = hub.sessions().await.unwrap();
        assert_eq!(moved.sessions.len(), 1);
        assert_eq!(moved.sessions[0].title, "Other request");
        assert_ne!(moved.sessions[0].locator, first.sessions[0].locator);
        assert!(hub
            .page(
                ProviderId::ClaudeCode,
                first.sessions[0].locator.clone(),
                None
            )
            .await
            .is_err());
        let other_page = hub
            .page(
                ProviderId::ClaudeCode,
                moved.sessions[0].locator.clone(),
                None,
            )
            .await
            .unwrap();
        assert_eq!(other_page.events[0].text, "Other request");
    }
}
