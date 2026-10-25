//! What every history reader shares: reading a JSON record's fields, naming
//! a session, and keeping an unknown record's shape without its values.
//! Your Claude and Codex readers each carried a copy of these (in their own
//! crates); here they are one.

use serde_json::Value;

use super::events::{BoundedNativePayload, ChatEventContent};
use super::{DecodeOutcome, DecodedHistoryEvent};

/// The string at `path` inside `value`.
pub(super) fn string_at(value: &Value, path: &[&str]) -> Option<String> {
    let mut current = value;
    for segment in path {
        current = current.get(*segment)?;
    }
    current.as_str().map(str::to_owned)
}

/// The number at `path` inside `value`.
pub(super) fn u64_at(value: &Value, path: &[&str]) -> Option<u64> {
    let mut current = value;
    for segment in path {
        current = current.get(*segment)?;
    }
    current.as_u64()
}

/// A session's title: its first real request on one line (72 characters),
/// or `fallback` when there is none or it is context a tool injected.
pub(super) fn one_line_title(value: &str, fallback: &str) -> String {
    let title = value.split_whitespace().collect::<Vec<_>>().join(" ");
    if title.is_empty() || looks_like_injected_context(&title) {
        fallback.to_owned()
    } else {
        title.chars().take(72).collect()
    }
}

/// Text that can name a session: something you wrote, not context a tool
/// put in front of it.
pub(super) fn names_a_session(value: &str) -> bool {
    let title = value.split_whitespace().collect::<Vec<_>>().join(" ");
    !title.is_empty() && !looks_like_injected_context(&title)
}

/// Context a tool put in front of your request, which is no title.
fn looks_like_injected_context(value: &str) -> bool {
    let normalized = value.to_ascii_lowercase();
    normalized.starts_with('<')
        || normalized.starts_with("# agents.md instructions")
        || normalized.starts_with("# files mentioned")
        || normalized.contains("<recommended_plugins>")
        || normalized.contains("<in-app-browser-context")
        || normalized.contains("<environment_context")
}

/// "Claude · repo · 2026-07-23": the provider, the folder and the date, as
/// much of them as is known.
pub(super) fn history_title_fallback(
    provider: &str,
    workspace: &str,
    started_at: &str,
    native_id: &str,
) -> String {
    let workspace_name = workspace
        .rsplit(['/', '\\'])
        .find(|part| !part.is_empty())
        .unwrap_or_default();
    let date = started_at.get(..10).unwrap_or_default();
    match (workspace_name.is_empty(), date.is_empty()) {
        (false, false) => format!("{provider} · {workspace_name} · {date}"),
        (false, true) => format!("{provider} · {workspace_name}"),
        (true, false) => format!("{provider} session · {date}"),
        (true, true) => format!(
            "{provider} session · {}",
            native_id.chars().take(8).collect::<String>()
        ),
    }
}

/// An unknown record's type and keys — never its values.
pub(super) fn redacted_shape(record_type: &str, value: &Value) -> String {
    let keys = value
        .as_object()
        .map(|object| {
            let mut keys = object.keys().map(String::as_str).collect::<Vec<_>>();
            keys.sort_unstable();
            keys.join(",")
        })
        .unwrap_or_default();
    format!("type={record_type}; keys=[{keys}]")
}

/// An event with no turn id.
pub(super) fn event(content: ChatEventContent) -> DecodeOutcome {
    DecodeOutcome::Event(DecodedHistoryEvent {
        turn_id: None,
        content,
    })
}

/// A record shown only as its shape.
pub(super) fn unknown(schema: &str, summary: &str) -> DecodeOutcome {
    event(ChatEventContent::Unknown(BoundedNativePayload::redacted(
        schema, summary,
    )))
}
