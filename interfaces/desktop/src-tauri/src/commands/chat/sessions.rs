//! Session listing, deletion, history wipe, and export for chat (user Turso / `turns` SSOT).

use crate::state::PlatformState;
use devpulse_engine::platform::{SqlAdapter, SqlValue};
use serde::Serialize;
use std::fmt::Write as _;
use std::fs;
use std::path::PathBuf;
use tauri::State;
use tauri_specta::Event;

use super::{ChatMessage, ChatSession, ExportFormat, ExportSummary};

/// List all chat sessions (most recently touched first).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn list_sessions(state: State<'_, PlatformState>) -> Result<Vec<ChatSession>, String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("The user database is not open (see the boot log)")?;
    let adapter = svc.adapter();

    let rows = adapter
		.query(
			"SELECT s.id, s.title, s.is_active, s.created_at, s.updated_at, s.ended_at, s.project_id, \
			 (SELECT COUNT(*) FROM turns t WHERE t.session_id = s.id) AS message_count \
			 FROM sessions s ORDER BY s.updated_at DESC",
			&[],
		)
		.await
		.map_err(|e| format!("Failed to list sessions: {e}"))?;

    Ok(rows
        .into_iter()
        .map(|row| ChatSession {
            id: row
                .first()
                .map(std::string::ToString::to_string)
                .unwrap_or_default(),
            title: row
                .get(1)
                .and_then(|v| v.as_text())
                .map(std::string::ToString::to_string),
            is_active: row.get(2).and_then(SqlValue::as_integer).unwrap_or(0) != 0,
            created_at: row.get(3).and_then(SqlValue::as_integer).unwrap_or(0),
            updated_at: row.get(4).and_then(SqlValue::as_integer).unwrap_or(0),
            ended_at: row.get(5).and_then(SqlValue::as_integer),
            project_id: row
                .get(6)
                .and_then(|v| v.as_text())
                .unwrap_or("")
                .to_string(),
            message_count: row.get(7).and_then(SqlValue::as_integer).unwrap_or(0),
        })
        .collect())
}

/// Delete one session — cascades `turns` / `anchors` / `open_loops` per engine schema.
///
/// # Errors
/// Returns the formatted Platform / `SurrealDB` error if the cascade
/// delete fails or the session is unknown.
#[tauri::command]
#[specta::specta]
pub async fn delete_session(
    session_id: String,
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("The user database is not open (see the boot log)")?;
    let adapter = svc.adapter();

    adapter
        .execute(
            "DELETE FROM sessions WHERE id = ?",
            &[session_id.as_str().into()],
        )
        .await
        .map_err(|e| format!("Failed to delete session: {e}"))?;

    let _ = crate::events::ChatSessionDeleted {
        session_id: session_id.clone(),
    }
    .emit(&app);

    Ok(())
}

/// Wipe all chat sessions for every project (cascades turns).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn clear_all_chat_history(state: State<'_, PlatformState>) -> Result<(), String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("The user database is not open (see the boot log)")?;
    let adapter = svc.adapter();

    adapter
        .execute("DELETE FROM sessions", &[])
        .await
        .map_err(|e| format!("Failed to clear chat history: {e}"))?;

    Ok(())
}

fn turns_to_markdown(session_title: Option<&str>, messages: &[ChatMessage]) -> String {
    let mut out = String::new();
    if let Some(t) = session_title {
        let _ = write!(out, "# {t}\n\n");
    }
    for m in messages {
        let _ = write!(out, "## {} ({})\n\n{}\n\n", m.role, m.created_at, m.content);
    }
    out
}

fn turns_to_json(session: &ChatSession, messages: &[ChatMessage]) -> String {
    #[derive(Serialize)]
    struct Export<'a> {
        session: &'a ChatSession,
        turns: &'a [ChatMessage],
    }
    serde_json::to_string_pretty(&Export {
        session,
        turns: messages,
    })
    .unwrap_or_else(|_| "{}".into())
}

async fn load_session_turns<A: SqlAdapter>(
    adapter: &A,
    session_id: &str,
) -> Result<Vec<ChatMessage>, String> {
    let rows = adapter
		.query(
			"SELECT id, session_id, role, content, created_at, token_count, model_used, latency_ms \
			 FROM turns WHERE session_id = ? ORDER BY sequence_num ASC, created_at ASC",
			&[session_id.into()],
		)
		.await
		.map_err(|e| format!("Failed to load turns: {e}"))?;

    Ok(rows
        .into_iter()
        .map(|row| ChatMessage {
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
            created_at: row.get(4).and_then(SqlValue::as_integer).unwrap_or(0),
            token_count: row.get(5).and_then(SqlValue::as_integer),
            model_used: row
                .get(6)
                .and_then(|v| v.as_text())
                .map(std::string::ToString::to_string),
            latency_ms: row.get(7).and_then(SqlValue::as_integer),
        })
        .collect())
}

/// Export one session to disk at `dest_path`.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn export_session(
    session_id: String,
    format: ExportFormat,
    dest_path: PathBuf,
    state: State<'_, PlatformState>,
) -> Result<ExportSummary, String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("The user database is not open (see the boot log)")?;
    let adapter = svc.adapter();

    let sess_rows = adapter
        .query(
            "SELECT id, title, is_active, created_at, updated_at, ended_at, project_id, \
			 (SELECT COUNT(*) FROM turns t WHERE t.session_id = s.id) AS message_count \
			 FROM sessions s WHERE s.id = ? LIMIT 1",
            &[session_id.as_str().into()],
        )
        .await
        .map_err(|e| format!("Failed to load session: {e}"))?;

    let row = sess_rows.first().ok_or("Session not found")?;
    let session = ChatSession {
        id: row
            .first()
            .map(std::string::ToString::to_string)
            .unwrap_or_default(),
        title: row
            .get(1)
            .and_then(|v| v.as_text())
            .map(std::string::ToString::to_string),
        is_active: row.get(2).and_then(SqlValue::as_integer).unwrap_or(0) != 0,
        created_at: row.get(3).and_then(SqlValue::as_integer).unwrap_or(0),
        updated_at: row.get(4).and_then(SqlValue::as_integer).unwrap_or(0),
        ended_at: row.get(5).and_then(SqlValue::as_integer),
        project_id: row
            .get(6)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string(),
        message_count: row.get(7).and_then(SqlValue::as_integer).unwrap_or(0),
    };

    let messages = load_session_turns(adapter.as_ref(), session_id.as_str()).await?;
    let body = match format {
        ExportFormat::Json => turns_to_json(&session, &messages),
        ExportFormat::Markdown => turns_to_markdown(session.title.as_deref(), &messages),
    };

    fs::write(&dest_path, body).map_err(|e| format!("Failed to write export file: {e}"))?;

    Ok(ExportSummary {
        sessions_exported: 1,
        rows_exported: i64::try_from(messages.len()).unwrap_or(0),
        path: dest_path.display().to_string(),
    })
}

/// Export all sessions into one file (concatenated markdown or JSON array of sessions).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc, clippy::too_many_lines)]
pub async fn export_all_sessions(
    format: ExportFormat,
    dest_path: PathBuf,
    state: State<'_, PlatformState>,
) -> Result<ExportSummary, String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("The user database is not open (see the boot log)")?;
    let adapter = svc.adapter();

    let id_rows = adapter
        .query("SELECT id FROM sessions ORDER BY updated_at DESC", &[])
        .await
        .map_err(|e| format!("Failed to list session ids: {e}"))?;

    let session_ids: Vec<String> = id_rows
        .into_iter()
        .filter_map(|r| r.first().map(std::string::ToString::to_string))
        .collect();

    let session_count = i64::try_from(session_ids.len()).unwrap_or(0);
    let mut rows_total: i64 = 0;
    let mut body = String::new();

    match format {
        ExportFormat::Markdown => {
            for sid in &session_ids {
                let sess_meta = adapter
                    .query(
                        "SELECT id, title, project_id FROM sessions WHERE id = ? LIMIT 1",
                        &[sid.as_str().into()],
                    )
                    .await
                    .map_err(|e| format!("Failed to load session meta: {e}"))?;
                let Some(sm) = sess_meta.first() else {
                    continue;
                };
                let title = sm
                    .get(1)
                    .and_then(|v| v.as_text())
                    .map(std::string::ToString::to_string);
                let project_id = sm
                    .get(2)
                    .and_then(|v| v.as_text())
                    .unwrap_or("")
                    .to_string();
                let msgs = load_session_turns(adapter.as_ref(), sid.as_str()).await?;
                rows_total += i64::try_from(msgs.len()).unwrap_or(0);
                let _ = write!(body, "---\n\n# Session {sid} (project {project_id})\n\n");
                body.push_str(&turns_to_markdown(title.as_deref(), &msgs));
                body.push('\n');
            }
        }
        ExportFormat::Json => {
            #[derive(Serialize)]
            struct SessionExport {
                session: ChatSession,
                turns: Vec<ChatMessage>,
            }
            let mut all: Vec<SessionExport> = Vec::new();
            for sid in session_ids {
                let sess_rows = adapter
					.query(
						"SELECT s.id, s.title, s.is_active, s.created_at, s.updated_at, s.ended_at, s.project_id, \
						 (SELECT COUNT(*) FROM turns t WHERE t.session_id = s.id) AS message_count \
						 FROM sessions s WHERE s.id = ? LIMIT 1",
						&[sid.as_str().into()],
					)
					.await
					.map_err(|e| format!("Failed to load session: {e}"))?;
                let row = sess_rows.first().ok_or("Session not found")?;
                let session = ChatSession {
                    id: row
                        .first()
                        .map(std::string::ToString::to_string)
                        .unwrap_or_default(),
                    title: row
                        .get(1)
                        .and_then(|v| v.as_text())
                        .map(std::string::ToString::to_string),
                    is_active: row.get(2).and_then(SqlValue::as_integer).unwrap_or(0) != 0,
                    created_at: row.get(3).and_then(SqlValue::as_integer).unwrap_or(0),
                    updated_at: row.get(4).and_then(SqlValue::as_integer).unwrap_or(0),
                    ended_at: row.get(5).and_then(SqlValue::as_integer),
                    project_id: row
                        .get(6)
                        .and_then(|v| v.as_text())
                        .unwrap_or("")
                        .to_string(),
                    message_count: row.get(7).and_then(SqlValue::as_integer).unwrap_or(0),
                };
                let turns = load_session_turns(adapter.as_ref(), session.id.as_str()).await?;
                rows_total += i64::try_from(turns.len()).unwrap_or(0);
                all.push(SessionExport { session, turns });
            }
            body = serde_json::to_string_pretty(&all)
                .map_err(|e| format!("JSON encode failed: {e}"))?;
        }
    }

    fs::write(&dest_path, body).map_err(|e| format!("Failed to write export file: {e}"))?;

    Ok(ExportSummary {
        sessions_exported: session_count,
        rows_exported: rows_total,
        path: dest_path.display().to_string(),
    })
}
