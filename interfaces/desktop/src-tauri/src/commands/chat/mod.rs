//! Chat commands — `turns` + `sessions` SSOT in user-scoped Turso.

pub mod endpoints;
pub mod history;
pub mod interactions;
pub mod sessions;
pub mod suggest;

use crate::state::PlatformState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

pub use devpulse_engine::platform::chat::ChatMessage;

/// Session row for sidebar / grouping.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ChatSession {
    /// Session primary key (UUID v7, string-encoded).
    pub id: String,
    /// Human-readable title (auto-generated from first turn or user-set).
    pub title: Option<String>,
    /// Project this session is scoped to.
    pub project_id: String,
    /// Whether this session is the active one in the UI.
    pub is_active: bool,
    /// Unix timestamp in milliseconds when this session was created.
    pub created_at: i64,
    /// Unix timestamp of the most recent turn in this session.
    pub updated_at: i64,
    /// Unix timestamp when the session was explicitly ended (archive).
    pub ended_at: Option<i64>,
    /// Total number of turns in this session.
    pub message_count: i64,
}

/// Export format for chat transcripts.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    /// JSON array of turns with metadata.
    Json,
    /// Markdown document with headers per session.
    Markdown,
}

/// Result summary after an export command writes to disk.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ExportSummary {
    /// Number of sessions included in the export.
    pub sessions_exported: i64,
    /// Total number of turn rows written.
    pub rows_exported: i64,
    /// Absolute filesystem path where the export was saved.
    pub path: String,
}

/// Native save dialog — returns absolute path or `None` if cancelled.
///
/// # Errors
/// Always returns `Ok(...)` — the dialog itself surfaces `None` on
/// cancel. The `Result` shape is preserved for tauri-specta binding
/// compatibility with sibling save-file commands.
#[tauri::command]
#[specta::specta]
#[expect(
    clippy::needless_pass_by_value,
    reason = "Tauri command macro deserializes `String` args from the IPC JSON payload; `&str` would not have a 'static lifetime for the command surface."
)]
pub fn pick_save_file(default_name: String) -> Result<Option<String>, String> {
    Ok(rfd::FileDialog::new()
        .set_file_name(&default_name)
        .save_file()
        .map(|p| p.to_string_lossy().into_owned()))
}

/// Save a user turn to the explicitly selected conversation, or create a new one.
/// # Errors
/// Returns platform, scope or persistence errors from the engine.
#[tauri::command]
#[specta::specta]
pub async fn send_message(
    project_id: String,
    session_id: Option<String>,
    content: String,
    state: State<'_, PlatformState>,
) -> Result<ChatMessage, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    platform
        .chat()
        .ok_or("Chat is unavailable")?
        .send_user(&project_id, session_id.as_deref(), &content)
        .await
        .map_err(|e| format!("{e:#}"))
}

/// Save a completed ordinary-model answer to its owning conversation.
/// # Errors
/// Returns platform, scope or persistence errors from the engine.
#[tauri::command]
#[specta::specta]
pub async fn store_assistant_turn(
    session_id: String,
    project_id: String,
    content: String,
    token_count: Option<i64>,
    model_used: String,
    latency_ms: i64,
    state: State<'_, PlatformState>,
) -> Result<ChatMessage, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    platform
        .chat()
        .ok_or("Chat is unavailable")?
        .save_assistant(
            &project_id,
            &session_id,
            &content,
            token_count,
            &model_used,
            latency_ms,
        )
        .await
        .map_err(|e| format!("{e:#}"))
}
