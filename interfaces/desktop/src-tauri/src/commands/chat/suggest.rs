//! Type-time chat-input suggestion commands.
//!
//! Two verbs:
//! - [`suggest_query`] — embed the partial the user is currently
//!   typing and recall top-`k` similar past prompts. Sub-50 ms p99
//!   target; the chat-input surface debounces at 150-250 ms idle and
//!   calls this on every keystroke past the trigger threshold.
//! - [`suggest_record`] — capture a committed prompt into the
//!   `chat_prompt` corpus so future recall has it. Called on send.

use crate::state::PlatformState;
use devpulse_engine::platform::Suggestion;
use tauri::State;

/// Recall top-`k` historical prompts most similar to the partial input
/// the user is currently typing.
///
/// `persona_id` may be empty — the service falls back to the default
/// persona for single-user installs.
///
/// # Errors
/// - Platform is still booting.
/// - Suggestion service cannot construct (`model_loader` or `user_graph`
///   not yet ready).
/// - Embedder failure (model not loaded).
/// - `SurrealDB` query failure.
#[tauri::command]
#[specta::specta]
pub async fn suggest_query(
    state: State<'_, PlatformState>,
    partial: String,
    persona_id: String,
    k: u32,
) -> Result<Vec<Suggestion>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_string())?;
    let svc = platform.ensure_suggest_service().await?;
    svc.query(&partial, &persona_id, k as usize)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Capture a committed prompt into the corpus for future recall.
///
/// `accepted` records whether the user accepted a prior suggestion to
/// build this prompt — used by the recency × similarity × accepted
/// ranking.
///
/// # Errors
/// - Platform is still booting.
/// - Suggestion service cannot construct.
/// - Embedder failure.
/// - `SurrealDB` write failure.
#[tauri::command]
#[specta::specta]
pub async fn suggest_record(
    state: State<'_, PlatformState>,
    text: String,
    persona_id: String,
    accepted: bool,
) -> Result<(), String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_string())?;
    let svc = platform.ensure_suggest_service().await?;
    svc.record_prompt(&text, &persona_id, accepted)
        .await
        .map_err(|e| format!("{e:#}"))
}
