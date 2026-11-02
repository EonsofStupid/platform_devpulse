//! Codex's history: one JSON-lines "rollout" file per session under
//! `sessions/YYYY/MM/DD/` in its home folder. Authored from your
//! `dpl-chat-codex` (`recovered/devpulselabs/crates/chat/providers/codex`),
//! the history reader and usage dialect; its app-server runtime is wired
//! with live chat, not here. Taught the records Codex writes now (surveyed
//! on this machine 2026-10-24, key names only): completed items as
//! `event_msg.item_completed` with `PascalCase` item types, token counts as
//! `token_usage_record`, the model in `thread_settings_applied`, agent to
//! agent messages, developer instructions, and its world-state snapshot.

use std::path::Path;

use serde_json::Value;

use super::events::{ChatEventContent, ProviderSessionId, TokenUsage};
use super::record::{
    event, history_title_fallback, names_a_session, one_line_title, redacted_shape, string_at,
    u64_at, unknown,
};
use super::{
    DecodeOutcome, HistoryDecoder, HistoryIndexMetadata, HistorySessionKind, ProviderUsage,
    UsageReporting,
};
use crate::providers::ProviderId;

/// Codex's records.
#[derive(Debug, Clone, Copy, Default)]
pub struct CodexHistoryDecoder;

impl HistoryDecoder for CodexHistoryDecoder {
    fn provider_id(&self) -> ProviderId {
        ProviderId::Codex
    }

    fn index_metadata(&self, path: &Path, prefix: &str) -> Option<HistoryIndexMetadata> {
        let mut native_id = codex_id_from_path(path)?;
        let mut title = String::new();
        let mut workspace = String::new();
        let mut started_at = String::new();
        let mut own_meta_seen = false;
        let mut kind = HistorySessionKind::Unknown;
        let mut parent_native_id = None;
        // Set when Codex spawned this session for another agent: its
        // nickname, when it has one.
        let mut subagent: Option<String> = None;

        for line in prefix.lines() {
            let Ok(value) = serde_json::from_str::<Value>(line) else {
                continue;
            };
            if started_at.is_empty() {
                started_at = string_at(&value, &["timestamp"]).unwrap_or_default();
            }
            // The first `session_meta` is this session's own. A session Codex
            // forked for a sub-agent carries its parent's after it, which
            // must not take the session's id, folder or start.
            if !own_meta_seen && value.get("type").and_then(Value::as_str) == Some("session_meta") {
                own_meta_seen = true;
                if let Some(id) = string_at(&value, &["payload", "id"]) {
                    native_id = id;
                }
                workspace = string_at(&value, &["payload", "cwd"]).unwrap_or(workspace);
                started_at = string_at(&value, &["payload", "timestamp"]).unwrap_or(started_at);
                (kind, parent_native_id) = session_origin(&value);
                if value.pointer("/payload/source/subagent").is_some() {
                    subagent =
                        Some(string_at(&value, &["payload", "agent_nickname"]).unwrap_or_default());
                }
            }
            if workspace.is_empty() {
                workspace = string_at(&value, &["cwd"]).unwrap_or_default();
            }
            // The first thing you wrote — Codex puts its instructions and
            // environment in front, and they do not take its place. A
            // sub-agent is named by the task its parent gave it instead (a
            // fork's copy of its parent's history is not its own).
            let candidate = if subagent.is_some() {
                agent_task(&value)
            } else {
                codex_user_text(&value)
            };
            if title.is_empty() {
                title = candidate
                    .map(|text| your_request(&text).to_owned())
                    .filter(|text| names_a_session(text))
                    .unwrap_or_default();
            }
            if !title.is_empty() && own_meta_seen {
                break;
            }
        }
        let label = match subagent.as_deref() {
            None => "Codex".to_owned(),
            Some("") => "Codex sub-agent".to_owned(),
            Some(nickname) => format!("Codex sub-agent {nickname}"),
        };
        let fallback = history_title_fallback(&label, &workspace, &started_at, &native_id);
        Some(HistoryIndexMetadata {
            native_id: ProviderSessionId(native_id),
            kind,
            parent_native_id,
            title: one_line_title(&title, &fallback),
            workspace,
            started_at,
        })
    }

    fn decode_line(&self, line: &str) -> DecodeOutcome {
        let Ok(value) = serde_json::from_str::<Value>(line) else {
            return unknown("codex.malformed", "malformed JSON record");
        };
        let record_type = value
            .get("type")
            .and_then(Value::as_str)
            .unwrap_or("missing");
        match record_type {
            "session_meta"
            | "turn_context"
            | "world_state"
            | "inter_agent_communication_metadata" => DecodeOutcome::IgnoreKnown,
            "response_item" => decode_response_item(value.get("payload").unwrap_or(&Value::Null)),
            "event_msg" => decode_event_message(value.get("payload").unwrap_or(&Value::Null)),
            "item.completed" => decode_completed_item(value.get("item").unwrap_or(&Value::Null)),
            "token_usage_record" => {
                let usage = codex_token_usage(value.get("payload").unwrap_or(&Value::Null));
                event(ChatEventContent::UsageUpdated {
                    summary: usage_summary(&usage),
                    usage,
                })
            }
            other => unknown(&format!("codex.{other}"), &redacted_shape(other, &value)),
        }
    }
}

fn session_origin(value: &Value) -> (HistorySessionKind, Option<ProviderSessionId>) {
    let source = value.pointer("/payload/source");
    if source.and_then(|s| s.get("subagent")).is_some() {
        let nested = string_at(
            value,
            &[
                "payload",
                "source",
                "subagent",
                "thread_spawn",
                "parent_thread_id",
            ],
        )
        .filter(|id| !id.is_empty());
        let top = string_at(value, &["payload", "parent_thread_id"]).filter(|id| !id.is_empty());
        // Conflicting metadata cannot select a parent. A fork alone is
        // never evidence of agent parentage.
        let parent = match (nested, top) {
            (Some(a), Some(b)) if a != b => None,
            (a, b) => a.or(b),
        };
        (HistorySessionKind::SubAgent, parent.map(ProviderSessionId))
    } else if matches!(
        source.and_then(Value::as_str),
        Some("cli" | "vscode" | "exec")
    ) && string_at(value, &["payload", "id"]).is_some_and(|id| !id.is_empty())
    {
        (HistorySessionKind::UserStarted, None)
    } else {
        (HistorySessionKind::Unknown, None)
    }
}

fn decode_response_item(payload: &Value) -> DecodeOutcome {
    let item_type = payload
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or("missing");
    match item_type {
        "message" => {
            let role = payload
                .get("role")
                .and_then(Value::as_str)
                .unwrap_or("unknown");
            let text = content_text(payload.get("content"));
            match (role, text) {
                ("user", Some(text)) => event(ChatEventContent::UserMessage(text)),
                ("assistant", Some(text)) => event(ChatEventContent::AssistantMessage(text)),
                // Instructions Codex was given, not the conversation.
                ("developer" | "system", _) => DecodeOutcome::IgnoreKnown,
                _ => unknown(
                    "codex.response_item.message",
                    &redacted_shape(item_type, payload),
                ),
            }
        }
        "function_call" | "custom_tool_call" => {
            let label = payload
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or("Codex tool")
                .to_owned();
            event(ChatEventContent::ToolStarted { label })
        }
        "function_call_output" | "custom_tool_call_output" => {
            event(ChatEventContent::ToolCompleted {
                label: "Codex tool".into(),
                succeeded: true,
            })
        }
        "reasoning" => DecodeOutcome::IgnoreKnown,
        // One agent writing to another (its content may be encrypted): who
        // to whom, never what.
        "agent_message" => {
            let author = string_at(payload, &["author"]).unwrap_or_else(|| "agent".into());
            let recipient = string_at(payload, &["recipient"]).unwrap_or_else(|| "agent".into());
            event(ChatEventContent::StatusUpdated(format!(
                "{author} → {recipient}"
            )))
        }
        other => unknown(
            &format!("codex.response_item.{other}"),
            &redacted_shape(other, payload),
        ),
    }
}

fn decode_event_message(payload: &Value) -> DecodeOutcome {
    let event_type = payload
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or("missing");
    match event_type {
        // Rollouts persist response_item.message in both history modes.
        // These are notifications about the same messages, not additional
        // conversation entries. Selecting the durable representation here
        // works across byte/page boundaries and preserves repeated messages.
        // Reasoning and world state are also known non-transcript records.
        "user_message" | "agent_message" | "agent_reasoning" | "world_state" => {
            DecodeOutcome::IgnoreKnown
        }
        "task_started" => event(ChatEventContent::SessionStarted),
        "task_complete" => event(ChatEventContent::TurnCompleted),
        "turn_aborted" => event(ChatEventContent::TurnInterrupted),
        "token_count" => {
            let usage = codex_token_usage(payload);
            event(ChatEventContent::UsageUpdated {
                summary: usage_summary(&usage),
                usage,
            })
        }
        "item_completed" => {
            let item = payload.get("item").unwrap_or(&Value::Null);
            match item.get("type").and_then(Value::as_str) {
                Some("user_message" | "UserMessage" | "agent_message" | "AgentMessage") => {
                    DecodeOutcome::IgnoreKnown
                }
                _ => decode_completed_item(item),
            }
        }
        "thread_settings_applied" => string_at(payload, &["thread_settings", "model"])
            .map(|model| ChatEventContent::ModelSelected { model })
            .map_or_else(
                || unknown("codex.event_msg.thread_settings_applied", "no model field"),
                event,
            ),
        // The provider naming its own model.
        "session_configured" => string_at(payload, &["model"])
            .map(|model| ChatEventContent::ModelSelected { model })
            .map_or_else(
                || unknown("codex.event_msg.session_configured", "no model field"),
                event,
            ),
        "plan_update" => {
            let summary =
                string_at(payload, &["explanation"]).unwrap_or_else(|| "Codex plan updated".into());
            event(ChatEventContent::PlanUpdated(summary))
        }
        other => unknown(
            &format!("codex.event_msg.{other}"),
            &redacted_shape(other, payload),
        ),
    }
}

fn decode_completed_item(item: &Value) -> DecodeOutcome {
    let item_type = item
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or("missing");
    // The item text: a `text` field, or text parts in `content`.
    let text = || string_at(item, &["text"]).or_else(|| content_text(item.get("content")));
    let completed = || {
        item.get("status")
            .and_then(Value::as_str)
            .is_none_or(|status| status == "completed")
            && item
                .get("exit_code")
                .and_then(Value::as_i64)
                .is_none_or(|code| code == 0)
    };
    let tool = |label: &str| {
        event(ChatEventContent::ToolCompleted {
            label: label.to_owned(),
            succeeded: completed(),
        })
    };
    // Codex spells item types `user_message` in older files and
    // `UserMessage` in newer ones.
    match item_type {
        "user_message" | "UserMessage" => text().map(ChatEventContent::UserMessage).map_or_else(
            || unknown("codex.item.user_message", "user item without text"),
            event,
        ),
        "agent_message" | "AgentMessage" => {
            text().map(ChatEventContent::AssistantMessage).map_or_else(
                || unknown("codex.item.agent_message", "agent item without text"),
                event,
            )
        }
        "command_execution" | "CommandExecution" => tool("Command execution"),
        "FileChange" => tool("File change"),
        "McpToolCall" => tool("MCP tool"),
        "ImageView" => tool("Image view"),
        "CollabAgentToolCall" => tool("Agent tool"),
        "SubAgentActivity" => event(ChatEventContent::StatusUpdated("Sub-agent activity".into())),
        "ContextCompaction" => event(ChatEventContent::StatusUpdated("Context compacted".into())),
        "reasoning" | "Reasoning" | "Extension" => DecodeOutcome::IgnoreKnown,
        other => unknown(&format!("codex.item.{other}"), &redacted_shape(other, item)),
    }
}

fn codex_user_text(value: &Value) -> Option<String> {
    match value.get("type").and_then(Value::as_str) {
        Some("response_item") => {
            let payload = value.get("payload")?;
            (payload.get("type").and_then(Value::as_str) == Some("message")
                && payload.get("role").and_then(Value::as_str) == Some("user"))
            .then(|| content_text(payload.get("content")))
            .flatten()
        }
        Some("event_msg") => {
            let payload = value.get("payload")?;
            match payload.get("type").and_then(Value::as_str)? {
                "user_message" => string_at(payload, &["message"]),
                // Newer files: your message as a completed `UserMessage` item.
                "item_completed" => {
                    let item = payload.get("item")?;
                    (item.get("type").and_then(Value::as_str) == Some("UserMessage"))
                        .then(|| {
                            string_at(item, &["text"]).or_else(|| content_text(item.get("content")))
                        })
                        .flatten()
                }
                _ => None,
            }
        }
        Some("item.completed") => {
            let item = value.get("item")?;
            (item.get("type").and_then(Value::as_str) == Some("user_message"))
                .then(|| string_at(item, &["text"]))
                .flatten()
        }
        _ => None,
    }
}

/// Codex Desktop's heading in front of your words when it attaches context
/// (the in-app browser, files you mentioned) to a request.
const REQUEST_HEADING: &str = "## my request for codex:";

/// Your words in a request, without what Codex Desktop attached before them.
fn your_request(text: &str) -> &str {
    // ASCII lowercasing keeps every byte where it was.
    text.to_ascii_lowercase()
        .find(REQUEST_HEADING)
        .and_then(|at| text.get(at + REQUEST_HEADING.len()..))
        .unwrap_or(text)
}

/// The task another agent sent this one, where it is not encrypted.
fn agent_task(value: &Value) -> Option<String> {
    let payload = value.get("payload")?;
    (value.get("type").and_then(Value::as_str) == Some("response_item")
        && payload.get("type").and_then(Value::as_str) == Some("agent_message"))
    .then(|| content_text(payload.get("content")))
    .flatten()
}

fn content_text(content: Option<&Value>) -> Option<String> {
    let content = content?;
    if let Some(text) = content.as_str() {
        return Some(text.to_owned());
    }
    let joined = content
        .as_array()?
        .iter()
        .filter_map(|part| {
            part.get("text")
                .or_else(|| part.get("input_text"))
                .or_else(|| part.get("output_text"))
                .and_then(Value::as_str)
        })
        .collect::<Vec<_>>()
        .join("\n");
    (!joined.is_empty()).then_some(joined)
}

/// Codex's usage dialect.
///
/// Codex reports a full input/output split plus a combined total and the
/// model context window, and names its model in `session_configured`. It
/// does not price its own calls.
#[derive(Debug, Clone, Copy, Default)]
pub struct CodexUsage;

impl ProviderUsage for CodexUsage {
    fn provider_id(&self) -> ProviderId {
        ProviderId::Codex
    }

    fn reports(&self) -> UsageReporting {
        UsageReporting {
            input_output_split: true,
            total_tokens: true,
            context_window: true,
            provider_priced: false,
            model: true,
            // `total_token_usage` restates the running total each time.
            counts_are_cumulative: true,
            history_backfill: true,
        }
    }

    fn usage_from_line(&self, line: &str) -> Option<TokenUsage> {
        let value: Value = serde_json::from_str(line).ok()?;
        let payload = value.get("payload")?;
        let counts = value.get("type").and_then(Value::as_str) == Some("token_usage_record")
            || payload.get("type").and_then(Value::as_str) == Some("token_count");
        if !counts {
            return None;
        }
        let usage = codex_token_usage(payload);
        (!usage.is_empty()).then_some(usage)
    }

    fn model_from_line(&self, line: &str) -> Option<String> {
        let value: Value = serde_json::from_str(line).ok()?;
        let payload = value.get("payload")?;
        match payload.get("type").and_then(Value::as_str)? {
            "session_configured" => string_at(payload, &["model"]),
            "thread_settings_applied" => string_at(payload, &["thread_settings", "model"]),
            _ => None,
        }
    }
}

/// Codex's `token_count` accounting.
///
/// Read DEFENSIVELY: each field is looked up independently and a missing
/// one stays `None`. If Codex reshapes this payload we lose a field, not
/// correctness — a wrong number priced as real would be worse than an
/// absent one. `total_token_usage` (older files) and `thread_token_usage`
/// (a `token_usage_record`) are the cumulative totals, which is what cost
/// is computed from.
fn codex_token_usage(payload: &Value) -> TokenUsage {
    let at = |leaf: &str| {
        u64_at(payload, &["info", "total_token_usage", leaf])
            .or_else(|| u64_at(payload, &["total_token_usage", leaf]))
            .or_else(|| u64_at(payload, &["thread_token_usage", leaf]))
    };
    TokenUsage {
        input_tokens: at("input_tokens"),
        // Codex reports cached input separately too — kept separate for
        // the same reason: it bills at a different rate.
        cache_read_tokens: at("cached_input_tokens"),
        cache_write_tokens: at("cache_write_input_tokens"),
        output_tokens: at("output_tokens"),
        total_tokens: at("total_tokens"),
        context_used: None,
        context_size: u64_at(payload, &["info", "model_context_window"])
            .or_else(|| u64_at(payload, &["model_context_window"])),
    }
}

/// "Codex tokens · 1200 in · 450 out".
fn usage_summary(usage: &TokenUsage) -> String {
    match (usage.input_tokens, usage.output_tokens) {
        (Some(input), Some(output)) => format!("Codex tokens · {input} in · {output} out"),
        _ => usage.total_tokens.map_or_else(
            || "Codex token usage updated".to_owned(),
            |total| format!("Codex tokens · {total} total"),
        ),
    }
}

/// The session id in a rollout file's name (its last 36 characters when
/// they are a UUID), else the name itself.
fn codex_id_from_path(path: &Path) -> Option<String> {
    let stem = path.file_stem()?.to_string_lossy();
    if let Some(candidate) = stem.get(stem.len().saturating_sub(36)..)
        && looks_like_uuid(candidate)
    {
        return Some(candidate.to_owned());
    }
    Some(stem.into_owned())
}

fn looks_like_uuid(value: &str) -> bool {
    value.len() == 36
        && value.bytes().enumerate().all(|(index, byte)| match index {
            8 | 13 | 18 | 23 => byte == b'-',
            _ => byte.is_ascii_hexdigit(),
        })
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn codex_index_uses_session_meta_and_first_user_message() {
        let prefix = concat!(
            "{\"timestamp\":\"2026-07-23T00:00:00Z\",\"type\":\"session_meta\",\"payload\":{\"id\":\"thr-1\",\"cwd\":\"C:/repo\"}}\n",
            "{\"type\":\"event_msg\",\"payload\":{\"type\":\"user_message\",\"message\":\"Fix  the tests\"}}\n"
        );
        let metadata = CodexHistoryDecoder
            .index_metadata(Path::new("rollout-fallback.jsonl"), prefix)
            .expect("metadata");
        assert_eq!(metadata.native_id.0, "thr-1");
        assert_eq!(metadata.workspace, "C:/repo");
        assert_eq!(metadata.title, "Fix the tests");
    }

    #[test]
    fn codex_unknown_records_preserve_only_redacted_structure() {
        let outcome = CodexHistoryDecoder.decode_line(
            "{\"type\":\"future.secret\",\"token\":\"must-not-survive\",\"value\":42}",
        );
        let DecodeOutcome::Event(event) = outcome else {
            panic!("event");
        };
        let ChatEventContent::Unknown(payload) = event.content else {
            panic!("unknown");
        };
        assert!(payload.redacted_summary.contains("token"));
        assert!(!payload.redacted_summary.contains("must-not-survive"));
    }

    #[test]
    fn codex_index_rejects_injected_context_as_a_session_title() {
        let prefix = concat!(
            "{\"timestamp\":\"2026-07-23T00:00:00Z\",\"type\":\"session_meta\",\"payload\":{\"id\":\"thr-1\",\"cwd\":\"C:/repo\"}}\n",
            "{\"type\":\"event_msg\",\"payload\":{\"type\":\"user_message\",\"message\":\"<recommended_plugins>secret setup context</recommended_plugins>\"}}\n"
        );
        let metadata = CodexHistoryDecoder
            .index_metadata(Path::new("rollout-fallback.jsonl"), prefix)
            .expect("metadata");
        assert_eq!(metadata.title, "Codex · repo · 2026-07-23");
    }

    #[test]
    fn codex_world_state_is_known_nondisplayable_context() {
        let outcome = CodexHistoryDecoder
            .decode_line("{\"type\":\"event_msg\",\"payload\":{\"type\":\"world_state\"}}");
        assert_eq!(outcome, DecodeOutcome::IgnoreKnown);
    }

    #[test]
    fn token_count_yields_real_numbers_not_prose() {
        let line = r#"{"type":"event_msg","payload":{"type":"token_count","info":{
            "total_token_usage":{"input_tokens":1200,"cached_input_tokens":800,
            "output_tokens":450,"reasoning_output_tokens":100,"total_tokens":1650},
            "model_context_window":272000}}}"#;
        let DecodeOutcome::Event(decoded) = CodexHistoryDecoder.decode_line(line) else {
            panic!("token_count should decode to an event");
        };
        let ChatEventContent::UsageUpdated { summary, usage } = decoded.content else {
            panic!("token_count should decode to UsageUpdated");
        };
        assert_eq!(usage.input_tokens, Some(1200));
        assert_eq!(usage.output_tokens, Some(450));
        assert_eq!(usage.total_tokens, Some(1650));
        assert_eq!(usage.context_size, Some(272_000));
        assert!(!usage.is_empty());
        assert_eq!(summary, "Codex tokens · 1200 in · 450 out");
    }

    #[test]
    fn a_reshaped_token_payload_loses_fields_not_correctness() {
        // If Codex moves these fields, each lookup independently returns
        // None. A missing count must never silently become zero.
        let line = r#"{"type":"event_msg","payload":{"type":"token_count","info":{}}}"#;
        let DecodeOutcome::Event(decoded) = CodexHistoryDecoder.decode_line(line) else {
            panic!("token_count should still decode");
        };
        let ChatEventContent::UsageUpdated { summary, usage } = decoded.content else {
            panic!("expected UsageUpdated");
        };
        assert!(usage.is_empty(), "absent counts stay absent, never zero");
        assert_eq!(summary, "Codex token usage updated");
    }

    #[test]
    fn session_configured_names_the_model() {
        let line = r#"{"type":"event_msg","payload":{"type":"session_configured",
            "model":"gpt-5-codex","session_id":"abc"}}"#;
        let DecodeOutcome::Event(decoded) = CodexHistoryDecoder.decode_line(line) else {
            panic!("session_configured should decode to an event");
        };
        assert_eq!(
            decoded.content,
            ChatEventContent::ModelSelected {
                model: "gpt-5-codex".into()
            }
        );
    }

    #[test]
    fn a_newer_rollout_is_titled_by_your_first_request() {
        let prefix = concat!(
            "{\"timestamp\":\"2026-10-24T00:00:00Z\",\"type\":\"session_meta\",\"payload\":{\"id\":\"thr-2\",\"cwd\":\"C:/rrflow\"}}\n",
            "{\"type\":\"response_item\",\"payload\":{\"type\":\"message\",\"role\":\"user\",\"content\":[{\"type\":\"input_text\",\"text\":\"# AGENTS.md instructions for C:/rrflow\"}]}}\n",
            "{\"type\":\"event_msg\",\"payload\":{\"type\":\"item_completed\",\"item\":{\"type\":\"UserMessage\",\"content\":[{\"type\":\"text\",\"text\":\"Wire the board\"}]}}}\n"
        );
        let metadata = CodexHistoryDecoder
            .index_metadata(Path::new("rollout-x.jsonl"), prefix)
            .expect("metadata");
        assert_eq!(metadata.title, "Wire the board");
    }

    #[test]
    fn a_forked_session_keeps_its_own_id() {
        let prefix = concat!(
            "{\"type\":\"session_meta\",\"payload\":{\"id\":\"child\",\"cwd\":\"C:/rrflow\",\"timestamp\":\"2026-10-25T01:00:00Z\",\"forked_from_id\":\"parent\"}}\n",
            "{\"type\":\"session_meta\",\"payload\":{\"id\":\"parent\",\"cwd\":\"C:/elsewhere\",\"timestamp\":\"2026-10-19T01:00:00Z\"}}\n",
            "{\"type\":\"response_item\",\"payload\":{\"type\":\"message\",\"role\":\"user\",\"content\":[{\"type\":\"input_text\",\"text\":\"Review the store\"}]}}\n"
        );
        let metadata = CodexHistoryDecoder
            .index_metadata(Path::new("rollout-x.jsonl"), prefix)
            .expect("metadata");
        assert_eq!(metadata.native_id, ProviderSessionId("child".into()));
        assert_eq!(metadata.workspace, "C:/rrflow");
        assert_eq!(metadata.started_at, "2026-10-25T01:00:00Z");
        assert_eq!(metadata.title, "Review the store");
    }

    #[test]
    fn your_words_after_codex_desktops_attachments_name_the_session() {
        let prefix = concat!(
            "{\"type\":\"session_meta\",\"payload\":{\"id\":\"thr-3\",\"cwd\":\"C:/rrflow\"}}\n",
            "{\"type\":\"response_item\",\"payload\":{\"type\":\"message\",\"role\":\"user\",\"content\":[{\"type\":\"input_text\",\"text\":\"<in-app-browser-context>\\nurl: http://localhost\\n</in-app-browser-context>\\n\\n## My request for Codex:\\nShow the board\"}]}}\n"
        );
        let metadata = CodexHistoryDecoder
            .index_metadata(Path::new("rollout-x.jsonl"), prefix)
            .expect("metadata");
        assert_eq!(metadata.title, "Show the board");
        assert_eq!(your_request("Fix it"), "Fix it");
    }

    #[test]
    fn only_own_metadata_classifies_a_codex_session() {
        let decode = |payload: Value, rest: &str| {
            CodexHistoryDecoder
                .index_metadata(
                    Path::new("rollout-child.jsonl"),
                    &format!(
                        "{}\n{rest}",
                        serde_json::json!({"type":"session_meta","payload":payload})
                    ),
                )
                .expect("metadata")
        };
        let own = serde_json::json!({"id":"child","source":{"subagent":{"thread_spawn":{"parent_thread_id":"parent"}}},"parent_thread_id":"parent"});
        let inherited =
            "{\"type\":\"session_meta\",\"payload\":{\"id\":\"parent\",\"source\":\"cli\"}}\n";
        let child = decode(own.clone(), inherited);
        assert_eq!(child.kind, HistorySessionKind::SubAgent);
        assert_eq!(child.native_id.0, "child");
        assert_eq!(
            child.parent_native_id,
            Some(ProviderSessionId("parent".into()))
        );
        let mut conflict = own;
        conflict["parent_thread_id"] = serde_json::json!("different");
        assert_eq!(decode(conflict, "").parent_native_id, None);
        let orphan = decode(
            serde_json::json!({"id":"child","source":{"subagent":"review"}}),
            "",
        );
        assert_eq!(orphan.kind, HistorySessionKind::SubAgent);
        assert_eq!(orphan.parent_native_id, None);
        let fork = decode(
            serde_json::json!({"id":"fork","source":"vscode","forked_from_id":"parent"}),
            "",
        );
        assert_eq!(fork.kind, HistorySessionKind::UserStarted);
        assert_eq!(fork.parent_native_id, None);
        for source in [
            Value::Null,
            serde_json::json!("future"),
            serde_json::json!({}),
        ] {
            assert_eq!(
                decode(
                    serde_json::json!({"id":"unknown","source":source}),
                    inherited
                )
                .kind,
                HistorySessionKind::Unknown
            );
        }
    }

    #[test]
    fn a_subagent_is_named_by_its_task_or_its_nickname() {
        let meta = "{\"timestamp\":\"2026-10-25T01:00:00Z\",\"type\":\"session_meta\",\"payload\":{\"id\":\"sub-1\",\"cwd\":\"C:/rrflow\",\"timestamp\":\"2026-10-25T01:00:00Z\",\"agent_nickname\":\"Planck\",\"source\":{\"subagent\":{\"thread_spawn\":{}}}}}\n";
        let instructions = "{\"type\":\"response_item\",\"payload\":{\"type\":\"message\",\"role\":\"user\",\"content\":[{\"type\":\"input_text\",\"text\":\"# AGENTS.md instructions for C:/rrflow\"}]}}\n";
        let title = |rest: &str| {
            CodexHistoryDecoder
                .index_metadata(
                    Path::new("rollout-x.jsonl"),
                    &format!("{meta}{instructions}{rest}"),
                )
                .expect("metadata")
                .title
        };
        assert_eq!(
            title(
                "{\"type\":\"response_item\",\"payload\":{\"type\":\"agent_message\",\"author\":\"root\",\"recipient\":\"Planck\",\"content\":[{\"type\":\"text\",\"text\":\"Audit the store\"}]}}\n"
            ),
            "Audit the store"
        );
        assert_eq!(
            title(
                "{\"type\":\"response_item\",\"payload\":{\"type\":\"agent_message\",\"content\":[{\"type\":\"encrypted\",\"encrypted_content\":\"…\"}]}}\n"
            ),
            "Codex sub-agent Planck · rrflow · 2026-10-25"
        );
    }

    #[test]
    fn codex_records_written_now_decode() {
        let decode = |line: &str| CodexHistoryDecoder.decode_line(line);
        assert_eq!(
            decode(
                r#"{"type":"event_msg","payload":{"type":"item_completed","item":{"type":"AgentMessage","content":[{"type":"Text","text":"Done."}]}}}"#
            ),
            DecodeOutcome::IgnoreKnown
        );
        assert_eq!(
            decode(
                r#"{"type":"event_msg","payload":{"type":"item_completed","item":{"type":"UserMessage","content":[{"type":"text","text":"Ship it"}]}}}"#
            ),
            DecodeOutcome::IgnoreKnown
        );
        assert_eq!(
            decode(
                r#"{"type":"event_msg","payload":{"type":"item_completed","item":{"type":"CommandExecution","status":"completed","exit_code":1}}}"#
            ),
            event(ChatEventContent::ToolCompleted {
                label: "Command execution".into(),
                succeeded: false
            })
        );
        assert_eq!(
            decode(
                r#"{"type":"event_msg","payload":{"type":"item_completed","item":{"type":"Reasoning"}}}"#
            ),
            DecodeOutcome::IgnoreKnown
        );
        assert_eq!(
            decode(
                r#"{"type":"event_msg","payload":{"type":"thread_settings_applied","thread_settings":{"model":"gpt-5.5-codex"}}}"#
            ),
            event(ChatEventContent::ModelSelected {
                model: "gpt-5.5-codex".into()
            })
        );
        assert_eq!(
            decode(
                r#"{"type":"response_item","payload":{"type":"message","role":"developer","content":[{"type":"input_text","text":"rules"}]}}"#
            ),
            DecodeOutcome::IgnoreKnown
        );
        assert_eq!(
            decode(
                r#"{"type":"response_item","payload":{"type":"agent_message","author":"main","recipient":"worker-1","content":[{"type":"encrypted_content"}]}}"#
            ),
            event(ChatEventContent::StatusUpdated("main → worker-1".into()))
        );
        let record = r#"{"type":"token_usage_record","payload":{"thread_token_usage":{"input_tokens":1200,"cached_input_tokens":800,"cache_write_input_tokens":5,"output_tokens":450,"total_tokens":1650}}}"#;
        let DecodeOutcome::Event(decoded) = decode(record) else {
            panic!("token_usage_record decodes");
        };
        let ChatEventContent::UsageUpdated { usage, .. } = decoded.content else {
            panic!("usage");
        };
        assert_eq!(usage.cache_write_tokens, Some(5));
        assert_eq!(CodexUsage.usage_from_line(record), Some(usage));
        for kind in ["world_state", "inter_agent_communication_metadata"] {
            assert_eq!(
                decode(&format!("{{\"type\":\"{kind}\"}}")),
                DecodeOutcome::IgnoreKnown
            );
        }
    }

    #[test]
    fn rollout_notifications_do_not_create_second_messages() {
        for kind in ["user_message", "agent_message"] {
            assert_eq!(
                CodexHistoryDecoder.decode_line(&format!(
                    r#"{{"type":"event_msg","payload":{{"type":"{kind}","message":"same words"}}}}"#
                )),
                DecodeOutcome::IgnoreKnown
            );
        }
        for kind in [
            "user_message",
            "UserMessage",
            "agent_message",
            "AgentMessage",
        ] {
            assert_eq!(
                CodexHistoryDecoder.decode_line(&format!(
                    r#"{{"type":"event_msg","payload":{{"type":"item_completed","item":{{"type":"{kind}","text":"same words"}}}}}}"#
                )),
                DecodeOutcome::IgnoreKnown
            );
        }
        // CLI JSON output is a separate format, with no rollout response item.
        assert_eq!(
            CodexHistoryDecoder.decode_line(
                r#"{"type":"item.completed","item":{"type":"agent_message","text":"Done."}}"#
            ),
            event(ChatEventContent::AssistantMessage("Done.".into()))
        );
    }

    #[test]
    fn rollout_pages_preserve_repeated_real_messages_without_mirrors() {
        use super::super::{HistoryLimits, HistorySource, JsonlHistorySource};

        struct Fixture(std::path::PathBuf);
        impl Drop for Fixture {
            fn drop(&mut self) {
                let _ = std::fs::remove_dir_all(&self.0);
            }
        }
        let fixture = Fixture(
            std::env::temp_dir().join(format!("devpulse-codex-mirrors-{}", uuid::Uuid::new_v4())),
        );
        std::fs::create_dir(&fixture.0).unwrap();
        let records = concat!(
            "{\"type\":\"session_meta\",\"payload\":{\"id\":\"thread\"}}\n",
            "{\"type\":\"response_item\",\"payload\":{\"type\":\"message\",\"role\":\"user\",\"content\":\"repeat\"}}\n",
            "{\"type\":\"event_msg\",\"payload\":{\"type\":\"user_message\",\"message\":\"repeat\"}}\n",
            "{\"type\":\"event_msg\",\"payload\":{\"type\":\"agent_message\",\"message\":\"reply\"}}\n",
            "{\"type\":\"response_item\",\"payload\":{\"type\":\"message\",\"role\":\"assistant\",\"content\":\"reply\"}}\n",
            "{\"type\":\"response_item\",\"payload\":{\"type\":\"message\",\"role\":\"user\",\"content\":\"repeat\"}}\n",
            "{\"type\":\"event_msg\",\"payload\":{\"type\":\"item_completed\",\"item\":{\"type\":\"UserMessage\",\"text\":\"repeat\"}}}\n",
            "{\"type\":\"event_msg\",\"payload\":{\"type\":\"item_completed\",\"item\":{\"type\":\"AgentMessage\",\"text\":\"reply\"}}}\n",
            "{\"type\":\"response_item\",\"payload\":{\"type\":\"message\",\"role\":\"assistant\",\"content\":\"reply\"}}\n",
        );
        std::fs::write(fixture.0.join("rollout.jsonl"), records).unwrap();
        let source = JsonlHistorySource::open(
            &fixture.0,
            CodexHistoryDecoder,
            HistoryLimits {
                page_events: 1,
                ..HistoryLimits::default()
            },
        )
        .unwrap();
        let locator = source.list(None).unwrap().sessions[0].locator;
        let mut cursor = None;
        let mut messages = Vec::new();
        let mut ids = std::collections::HashSet::new();
        loop {
            let page = source.page(locator, cursor).unwrap();
            assert!(page.events.len() <= 1);
            for entry in page.events {
                assert!(ids.insert(entry.id));
                messages.push(entry.content);
            }
            let Some(next) = page.next_cursor else { break };
            assert!(cursor.is_none_or(|previous| next.before_byte < previous.before_byte));
            cursor = Some(next);
        }
        assert_eq!(
            messages,
            vec![
                ChatEventContent::AssistantMessage("reply".into()),
                ChatEventContent::UserMessage("repeat".into()),
                ChatEventContent::AssistantMessage("reply".into()),
                ChatEventContent::UserMessage("repeat".into()),
            ]
        );
    }

    #[test]
    fn a_rollout_file_name_carries_the_session_id() {
        let path =
            Path::new("rollout-2026-09-16T00-13-02-01a0a86b-0af1-7c70-8f52-862a99e9821f.jsonl");
        assert_eq!(
            codex_id_from_path(path).as_deref(),
            Some("01a0a86b-0af1-7c70-8f52-862a99e9821f")
        );
    }
}
