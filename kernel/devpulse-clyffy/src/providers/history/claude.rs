//! Claude Code's history: one JSON-lines file per session under
//! `projects/<folder>/` in its config folder. Authored from your
//! `dpl-chat-claude` (`recovered/devpulselabs/crates/chat/providers/claude`),
//! the history reader and usage dialect, taught the records Claude Code
//! 2.1.310 writes (surveyed on this machine 2026-10-24, key names only):
//! tool results inside `user` records, thinking-only `assistant` records,
//! its own session title (`ai-title`), pull-request links, and the
//! bookkeeping records it keeps for itself.

use std::path::Path;

use serde_json::Value;

use super::events::{ChatEventContent, ProviderSessionId, TokenUsage};
use super::record::{
    event, history_title_fallback, names_a_session, one_line_title, redacted_shape, string_at,
    unknown,
};
use super::{DecodeOutcome, HistoryDecoder, HistoryIndexMetadata, ProviderUsage, UsageReporting};
use crate::providers::ProviderId;

/// Claude Code's records.
#[derive(Debug, Clone, Copy, Default)]
pub struct ClaudeHistoryDecoder;

impl HistoryDecoder for ClaudeHistoryDecoder {
    fn provider_id(&self) -> ProviderId {
        ProviderId::ClaudeCode
    }

    fn index_metadata(&self, path: &Path, prefix: &str) -> Option<HistoryIndexMetadata> {
        let native_id = path.file_stem()?.to_string_lossy().into_owned();
        let mut title = String::new();
        // Claude Code names a session itself once it is under way; that
        // name wins over the first request.
        let mut ai_title = String::new();
        let mut workspace = String::new();
        let mut started_at = String::new();
        for line in prefix.lines() {
            let Ok(value) = serde_json::from_str::<Value>(line) else {
                continue;
            };
            if workspace.is_empty() {
                workspace = string_at(&value, &["cwd"]).unwrap_or_default();
            }
            if started_at.is_empty() {
                started_at = string_at(&value, &["timestamp"]).unwrap_or_default();
            }
            if title.is_empty() && value.get("type").and_then(Value::as_str) == Some("user") {
                // The first thing you wrote — context Claude Code put first
                // does not take the title's place.
                title = claude_message_text(&value)
                    .filter(|text| names_a_session(text))
                    .unwrap_or_default();
            }
            if value.get("type").and_then(Value::as_str) == Some("ai-title") {
                ai_title = string_at(&value, &["aiTitle"]).unwrap_or(ai_title);
            }
        }
        let fallback = history_title_fallback("Claude", &workspace, &started_at, &native_id);
        let named = if ai_title.trim().is_empty() {
            title
        } else {
            ai_title
        };
        Some(HistoryIndexMetadata {
            native_id: ProviderSessionId(native_id.clone()),
            title: one_line_title(&named, &fallback),
            workspace,
            started_at,
        })
    }

    fn decode_line(&self, line: &str) -> DecodeOutcome {
        let Ok(value) = serde_json::from_str::<Value>(line) else {
            return unknown("claude.malformed", "malformed JSON record");
        };
        let record_type = value
            .get("type")
            .and_then(Value::as_str)
            .unwrap_or("missing");
        match record_type {
            "user" => decode_user(&value),
            "assistant" => decode_assistant(&value),
            "pr-link" => event(ChatEventContent::StatusUpdated(pull_request(&value))),
            // What Claude Code keeps for itself: its title, your last
            // prompt, the mode, the request it sent, file snapshots, the
            // context it attached (environment, reminders, deferred tools),
            // and the queue of what you typed while it worked (a delivered
            // one is in the history again as your message).
            "ai-title"
            | "last-prompt"
            | "mode"
            | "permission-mode"
            | "api-request"
            | "api-request-blob"
            | "atis-latch"
            | "attachment"
            | "file-history-delta"
            | "file-history-snapshot"
            | "queue-operation" => DecodeOutcome::IgnoreKnown,
            "system" => {
                if value.get("subtype").and_then(Value::as_str) == Some("init") {
                    event(ChatEventContent::SessionStarted)
                } else {
                    DecodeOutcome::IgnoreKnown
                }
            }
            "result" => {
                if value.get("is_error").and_then(Value::as_bool) == Some(true) {
                    event(ChatEventContent::TurnFailed {
                        message: "Claude reported a failed turn".into(),
                    })
                } else {
                    event(ChatEventContent::TurnCompleted)
                }
            }
            "progress" => event(ChatEventContent::StatusUpdated(
                value
                    .get("subtype")
                    .and_then(Value::as_str)
                    .unwrap_or("Claude progress updated")
                    .to_owned(),
            )),
            // Rate-limit status carries no token accounting — an empty
            // `TokenUsage` says "not reported", which is the truth here.
            "rate_limit_event" => event(ChatEventContent::UsageUpdated {
                summary: "Claude rate-limit status updated".into(),
                usage: TokenUsage::default(),
            }),
            other => unknown(&format!("claude.{other}"), &redacted_shape(other, &value)),
        }
    }
}

/// Claude's usage dialect.
///
/// Claude is the one major that PRICES ITS OWN CALLS — `result` records
/// carry `total_cost_usd`, real billed money. That is authoritative over
/// any price table of ours: it knows its billing, we only infer it.
///
/// Counts live in two places: per-turn on `assistant.message.usage`, and
/// on `result.usage`. Cache reads and cache creation are reported
/// separately and stay separate: they bill at very different rates.
#[derive(Debug, Clone, Copy, Default)]
pub struct ClaudeUsage;

impl ProviderUsage for ClaudeUsage {
    fn provider_id(&self) -> ProviderId {
        ProviderId::ClaudeCode
    }

    fn reports(&self) -> UsageReporting {
        UsageReporting {
            input_output_split: true,
            total_tokens: true,
            context_window: false,
            provider_priced: true,
            model: true,
            // Each assistant message reports only ITS OWN turn, so a
            // session total is the sum, not the last reading.
            counts_are_cumulative: false,
            history_backfill: true,
        }
    }

    fn usage_from_line(&self, line: &str) -> Option<TokenUsage> {
        let value: Value = serde_json::from_str(line).ok()?;
        let usage = match value.get("type").and_then(Value::as_str)? {
            "assistant" => value.get("message")?.get("usage")?,
            "result" => value.get("usage")?,
            _ => return None,
        };
        let n = |key: &str| usage.get(key).and_then(Value::as_u64);
        // Cache reads and cache writes stay SEPARATE from fresh input:
        // they bill at very different rates, and a folded number can
        // never be split again.
        let input = n("input_tokens");
        let cache_read = n("cache_read_input_tokens");
        let cache_write = n("cache_creation_input_tokens");
        let output = n("output_tokens");
        let billed_in = [input, cache_read, cache_write]
            .into_iter()
            .flatten()
            .reduce(u64::saturating_add);
        let out = TokenUsage {
            input_tokens: input,
            cache_read_tokens: cache_read,
            cache_write_tokens: cache_write,
            output_tokens: output,
            total_tokens: match (billed_in, output) {
                (Some(i), Some(o)) => Some(i.saturating_add(o)),
                _ => None,
            },
            context_used: None,
            context_size: None,
        };
        (!out.is_empty()).then_some(out)
    }

    fn model_from_line(&self, line: &str) -> Option<String> {
        let value: Value = serde_json::from_str(line).ok()?;
        if value.get("type").and_then(Value::as_str)? != "assistant" {
            return None;
        }
        string_at(&value, &["message", "model"])
    }

    #[allow(
        clippy::cast_possible_truncation,
        clippy::cast_sign_loss,
        reason = "a finite, non-negative dollar amount in micros fits u64"
    )]
    fn cost_micros_from_line(&self, line: &str) -> Option<u64> {
        let value: Value = serde_json::from_str(line).ok()?;
        if value.get("type").and_then(Value::as_str)? != "result" {
            return None;
        }
        let usd = value.get("total_cost_usd").and_then(Value::as_f64)?;
        // Refuse nonsense rather than casting it into a plausible number.
        (usd.is_finite() && usd >= 0.0).then(|| (usd * 1_000_000.0).round() as u64)
    }
}

/// The parts of a record's message content.
fn content_parts(value: &Value) -> &[Value] {
    value
        .get("message")
        .and_then(|message| message.get("content"))
        .and_then(Value::as_array)
        .map_or(&[], Vec::as_slice)
}

fn part_of_type<'a>(parts: &'a [Value], kind: &str) -> impl Iterator<Item = &'a Value> + 'a {
    let kind = kind.to_owned();
    parts
        .iter()
        .filter(move |part| part.get("type").and_then(Value::as_str) == Some(kind.as_str()))
}

/// You wrote, or a tool answered (Claude Code returns tool results inside
/// `user` records).
fn decode_user(value: &Value) -> DecodeOutcome {
    if let Some(text) = claude_message_text(value) {
        return event(ChatEventContent::UserMessage(text));
    }
    let parts = content_parts(value);
    let mut results = part_of_type(parts, "tool_result").peekable();
    if results.peek().is_some() {
        let failed =
            results.any(|part| part.get("is_error").and_then(Value::as_bool) == Some(true));
        return event(ChatEventContent::ToolCompleted {
            label: "Tool result".into(),
            succeeded: !failed,
        });
    }
    unknown("claude.user", "user record without text")
}

fn decode_assistant(value: &Value) -> DecodeOutcome {
    if let Some(text) = claude_message_text(value) {
        return event(ChatEventContent::AssistantMessage(text));
    }
    let parts = content_parts(value);
    if let Some(tool) = part_of_type(parts, "tool_use").next() {
        return event(ChatEventContent::ToolStarted {
            label: tool
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or("Claude tool")
                .to_owned(),
        });
    }
    // Thinking stays Claude's: a record of only thinking is known, not shown.
    if !parts.is_empty() && part_of_type(parts, "thinking").count() == parts.len() {
        return DecodeOutcome::IgnoreKnown;
    }
    unknown(
        "claude.assistant",
        "assistant record without displayable text",
    )
}

/// "Pull request #42 — https://…".
fn pull_request(value: &Value) -> String {
    let number = value.get("prNumber").and_then(Value::as_u64);
    let url = string_at(value, &["prUrl"]).unwrap_or_default();
    match number {
        Some(number) => format!("Pull request #{number} — {url}"),
        None => format!("Pull request — {url}"),
    }
}

fn claude_message_text(value: &Value) -> Option<String> {
    let content = value.get("message")?.get("content")?;
    if let Some(text) = content.as_str() {
        return Some(text.to_owned());
    }
    let joined = content
        .as_array()?
        .iter()
        .filter(|part| part.get("type").and_then(Value::as_str) == Some("text"))
        .filter_map(|part| part.get("text").and_then(Value::as_str))
        .collect::<Vec<_>>()
        .join("\n");
    (!joined.is_empty()).then_some(joined)
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn claude_index_uses_cwd_and_first_user_message() {
        let prefix = concat!(
            "{\"type\":\"system\",\"subtype\":\"init\",\"cwd\":\"C:/repo\",\"timestamp\":\"2026-07-23T00:00:00Z\"}\n",
            "{\"type\":\"user\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"Review  this\"}]}}\n"
        );
        let metadata = ClaudeHistoryDecoder
            .index_metadata(Path::new("session-1.jsonl"), prefix)
            .expect("metadata");
        assert_eq!(metadata.native_id.0, "session-1");
        assert_eq!(metadata.workspace, "C:/repo");
        assert_eq!(metadata.title, "Review this");
    }

    #[test]
    fn claude_unknown_records_do_not_retain_values() {
        let outcome = ClaudeHistoryDecoder
            .decode_line("{\"type\":\"future\",\"token\":\"must-not-survive\"}");
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
    fn claude_index_rejects_injected_context_as_a_session_title() {
        let prefix = concat!(
            "{\"type\":\"system\",\"subtype\":\"init\",\"cwd\":\"C:/repo\",\"timestamp\":\"2026-07-23T00:00:00Z\"}\n",
            "{\"type\":\"user\",\"message\":{\"content\":\"<environment_context>private setup context</environment_context>\"}}\n"
        );
        let metadata = ClaudeHistoryDecoder
            .index_metadata(Path::new("session-1.jsonl"), prefix)
            .expect("metadata");
        assert_eq!(metadata.title, "Claude · repo · 2026-07-23");
    }

    #[test]
    fn claude_names_its_own_sessions() {
        let prefix = concat!(
            "{\"type\":\"user\",\"cwd\":\"C:/repo\",\"message\":{\"content\":\"do an audit\"}}\n",
            "{\"type\":\"ai-title\",\"aiTitle\":\"Audit the repo\",\"sessionId\":\"s\"}\n"
        );
        let metadata = ClaudeHistoryDecoder
            .index_metadata(Path::new("s.jsonl"), prefix)
            .expect("metadata");
        assert_eq!(metadata.title, "Audit the repo");
    }

    #[test]
    fn claude_code_2_1_records_decode() {
        let decode = |line: &str| ClaudeHistoryDecoder.decode_line(line);
        // A tool's answer comes back in a `user` record.
        assert_eq!(
            decode(
                r#"{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t","content":"ok"}]}}"#
            ),
            event(ChatEventContent::ToolCompleted {
                label: "Tool result".into(),
                succeeded: true
            })
        );
        assert_eq!(
            decode(
                r#"{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"t","is_error":true}]}}"#
            ),
            event(ChatEventContent::ToolCompleted {
                label: "Tool result".into(),
                succeeded: false
            })
        );
        // Thinking alone is known, not shown.
        assert_eq!(
            decode(
                r#"{"type":"assistant","message":{"role":"assistant","content":[{"type":"thinking","thinking":"…"}]}}"#
            ),
            DecodeOutcome::IgnoreKnown
        );
        assert_eq!(
            decode(r#"{"type":"pr-link","prNumber":42,"prUrl":"https://github.com/o/r/pull/42"}"#),
            event(ChatEventContent::StatusUpdated(
                "Pull request #42 — https://github.com/o/r/pull/42".into()
            ))
        );
        for kind in [
            "ai-title",
            "last-prompt",
            "mode",
            "permission-mode",
            "api-request",
            "attachment",
            "queue-operation",
        ] {
            assert_eq!(
                decode(&format!("{{\"type\":\"{kind}\"}}")),
                DecodeOutcome::IgnoreKnown,
                "{kind}"
            );
        }
    }

    #[test]
    fn claude_prices_its_own_calls_and_keeps_cache_separate() {
        let assistant = r#"{"type":"assistant","message":{"model":"claude-opus-5-5","usage":{"input_tokens":10,"cache_read_input_tokens":900,"cache_creation_input_tokens":50,"output_tokens":40}}}"#;
        let usage = ClaudeUsage.usage_from_line(assistant).expect("usage");
        assert_eq!(usage.input_tokens, Some(10));
        assert_eq!(usage.cache_read_tokens, Some(900));
        assert_eq!(usage.cache_write_tokens, Some(50));
        assert_eq!(usage.total_tokens, Some(1000));
        assert_eq!(
            ClaudeUsage.model_from_line(assistant).as_deref(),
            Some("claude-opus-5-5")
        );
        let result = r#"{"type":"result","total_cost_usd":0.0125}"#;
        assert_eq!(ClaudeUsage.cost_micros_from_line(result), Some(12_500));
        assert_eq!(
            ClaudeUsage.cost_micros_from_line(r#"{"type":"result","total_cost_usd":-1}"#),
            None
        );
    }
}
