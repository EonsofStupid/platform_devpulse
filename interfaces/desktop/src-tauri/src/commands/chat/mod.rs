//! Chat commands — `turns` + `sessions` SSOT in user-scoped `LibSQL`.

pub mod history;
pub mod interactions;
pub mod sessions;
pub mod suggest;

use crate::state::PlatformState;
use devpulse_engine::platform::SqlAdapter;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;
use uuid::Uuid;

/// A chat turn returned to the frontend (`turns.id` is a string key).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    /// Turn primary key (UUID v7, string-encoded).
    pub id: String,
    /// Parent session this turn belongs to.
    pub session_id: String,
    /// Speaker role: `"user"`, `"assistant"`, or `"system"`.
    pub role: String,
    /// Message body (Markdown for assistant, plain text for user).
    pub content: String,
    /// Unix timestamp in milliseconds when this turn was created.
    pub created_at: i64,
    /// Token count consumed by this turn (populated for assistant turns).
    pub token_count: Option<i64>,
    /// Model identifier used for this turn (e.g. `"Qwen3-0.6B"`).
    pub model_used: Option<String>,
    /// Inference latency in milliseconds (populated for assistant turns).
    pub latency_ms: Option<i64>,
}

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
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub fn pick_save_file(default_name: String) -> Result<Option<String>, String> {
    Ok(rfd::FileDialog::new()
        .set_file_name(&default_name)
        .save_file()
        .map(|p| p.to_string_lossy().into_owned()))
}

/// Persist a user turn into `turns` for the active (or new) session in `project_id`.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc, clippy::too_many_lines)]
pub async fn send_message(
    project_id: String,
    content: String,
    state: State<'_, PlatformState>,
) -> Result<ChatMessage, String> {
    tracing::info!(project = %project_id, content_len = content.len(), "cmd send_message: entry");
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let svc = platform
        .relational()
        .ok_or("Relational service not available")?;
    let adapter = svc.adapter();

    let proj = adapter
        .query(
            "SELECT id FROM projects WHERE id = ? LIMIT 1",
            &[project_id.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to resolve project: {e}"))?;
    if proj.is_empty() {
        return Err(format!("Unknown project_id: {project_id}"));
    }

    let session_rows = adapter
        .query(
            "SELECT id FROM sessions WHERE project_id = ? AND ended_at IS NULL \
			 ORDER BY updated_at DESC LIMIT 1",
            &[project_id.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to query sessions: {e}"))?;

    let session_id = if let Some(id) = session_rows.first().and_then(|r| r.first()) {
        id.to_string()
    } else {
        let new_id = format!("sess-{}", Uuid::new_v4());
        adapter
            .execute(
                "INSERT INTO sessions (id, project_id, title, is_active) VALUES (?, ?, NULL, 1)",
                &[new_id.as_str(), project_id.as_str()],
            )
            .await
            .map_err(|e| format!("Failed to create session: {e}"))?;
        new_id
    };

    let seq_rows = adapter
        .query(
            "SELECT COALESCE(MAX(sequence_num), 0) + 1 AS next_seq FROM turns WHERE session_id = ?",
            &[session_id.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to read sequence: {e}"))?;
    let sequence_num = seq_rows
        .first()
        .and_then(|r| r.first())
        .and_then(devpulse_engine::platform::SqlValue::as_integer)
        .unwrap_or(1);

    let turn_id = format!("turn-{}", Uuid::new_v4());
    let trimmed = content.trim();
    if trimmed.is_empty() {
        return Err("Message content is empty".to_string());
    }
    let body = trimmed.to_string();
    let seq_str = sequence_num.to_string();

    adapter
        .execute(
            "INSERT INTO turns (id, session_id, project_id, role, content, sequence_num, \
			 token_count, model_used, latency_ms) VALUES (?, ?, ?, 'user', ?, ?, NULL, NULL, NULL)",
            &[
                turn_id.as_str(),
                session_id.as_str(),
                project_id.as_str(),
                body.as_str(),
                seq_str.as_str(),
            ],
        )
        .await
        .map_err(|e| format!("Failed to insert turn: {e}"))?;

    adapter
		.execute(
			"UPDATE sessions SET updated_at = unixepoch(), interaction_count = interaction_count + 1 \
			 WHERE id = ?",
			&[session_id.as_str()],
		)
		.await
		.map_err(|e| format!("Failed to touch session: {e}"))?;

    let created_rows = adapter
		.query(
			"SELECT id, session_id, role, content, created_at, token_count, model_used, latency_ms \
			 FROM turns WHERE id = ? LIMIT 1",
			&[turn_id.as_str()],
		)
		.await
		.map_err(|e| format!("Failed to read turn: {e}"))?;

    let row = created_rows.first().ok_or("Turn not found after insert")?;

    tracing::info!(
        project = %project_id,
        session = %session_id,
        turn = %turn_id,
        "cmd send_message: exit ok"
    );
    Ok(ChatMessage {
        id: row
            .first()
            .map(std::string::ToString::to_string)
            .unwrap_or_default(),
        session_id: row
            .get(1)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string(),
        role: row
            .get(2)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string(),
        content: row
            .get(3)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string(),
        created_at: row
            .get(4)
            .and_then(devpulse_engine::platform::SqlValue::as_integer)
            .unwrap_or(0),
        token_count: row
            .get(5)
            .and_then(devpulse_engine::platform::SqlValue::as_integer),
        model_used: row
            .get(6)
            .and_then(|v| v.as_text())
            .map(std::string::ToString::to_string),
        latency_ms: row
            .get(7)
            .and_then(devpulse_engine::platform::SqlValue::as_integer),
    })
}

/// Store an assistant turn (inference response) into the active session.
///
/// Called by the frontend after streaming inference completes.
/// Accepts metadata that only the inference pipeline knows: token count,
/// model identity, and latency.
#[tauri::command]
#[specta::specta]
pub async fn store_assistant_turn(
    session_id: String,
    project_id: String,
    content: String,
    token_count: i64,
    model_used: String,
    latency_ms: i64,
    state: State<'_, PlatformState>,
) -> Result<ChatMessage, String> {
    tracing::info!(
        session = %session_id,
        project = %project_id,
        tokens = token_count,
        model = %model_used,
        latency_ms,
        "cmd store_assistant_turn: entry"
    );

    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let svc = platform
        .relational()
        .ok_or("Relational service not available")?;
    let adapter = svc.adapter();

    let seq_rows = adapter
        .query(
            "SELECT COALESCE(MAX(sequence_num), 0) + 1 AS next_seq FROM turns WHERE session_id = ?",
            &[session_id.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to read sequence: {e}"))?;
    let sequence_num = seq_rows
        .first()
        .and_then(|r| r.first())
        .and_then(devpulse_engine::platform::SqlValue::as_integer)
        .unwrap_or(1);

    let turn_id = format!("turn-{}", Uuid::new_v4());
    let seq_str = sequence_num.to_string();
    let tc_str = token_count.to_string();
    let lat_str = latency_ms.to_string();

    adapter
        .execute(
            "INSERT INTO turns (id, session_id, project_id, role, content, sequence_num, \
			 token_count, model_used, latency_ms) VALUES (?, ?, ?, 'assistant', ?, ?, ?, ?, ?)",
            &[
                turn_id.as_str(),
                session_id.as_str(),
                project_id.as_str(),
                content.as_str(),
                seq_str.as_str(),
                tc_str.as_str(),
                model_used.as_str(),
                lat_str.as_str(),
            ],
        )
        .await
        .map_err(|e| format!("Failed to insert assistant turn: {e}"))?;

    adapter
		.execute(
			"UPDATE sessions SET updated_at = unixepoch(), interaction_count = interaction_count + 1 \
			 WHERE id = ?",
			&[session_id.as_str()],
		)
		.await
		.map_err(|e| format!("Failed to touch session: {e}"))?;

    let created_rows = adapter
		.query(
			"SELECT id, session_id, role, content, created_at, token_count, model_used, latency_ms \
			 FROM turns WHERE id = ? LIMIT 1",
			&[turn_id.as_str()],
		)
		.await
		.map_err(|e| format!("Failed to read turn: {e}"))?;

    let row = created_rows.first().ok_or("Turn not found after insert")?;

    tracing::info!(turn = %turn_id, "cmd store_assistant_turn: exit ok");
    Ok(ChatMessage {
        id: row
            .first()
            .map(std::string::ToString::to_string)
            .unwrap_or_default(),
        session_id: row
            .get(1)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string(),
        role: row
            .get(2)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string(),
        content: row
            .get(3)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string(),
        created_at: row
            .get(4)
            .and_then(devpulse_engine::platform::SqlValue::as_integer)
            .unwrap_or(0),
        token_count: row
            .get(5)
            .and_then(devpulse_engine::platform::SqlValue::as_integer),
        model_used: row
            .get(6)
            .and_then(|v| v.as_text())
            .map(std::string::ToString::to_string),
        latency_ms: row
            .get(7)
            .and_then(devpulse_engine::platform::SqlValue::as_integer),
    })
}
