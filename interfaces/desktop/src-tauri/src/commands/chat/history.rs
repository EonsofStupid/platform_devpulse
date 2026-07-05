//! Chat history — load turns from `LibSQL`.

use super::ChatMessage;
use crate::state::PlatformState;
use devpulse_engine::platform::SqlAdapter;
use tauri::State;

/// Load recent turns for a project. When `session_id` is `None`, uses the latest session for the project.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn load_recent(
    state: State<'_, PlatformState>,
    project_id: String,
    session_id: Option<String>,
) -> Result<Vec<ChatMessage>, String> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or("Platform is still booting")?;
    let svc = platform
        .user_relational()
        .ok_or("Relational service not available")?;
    let adapter = svc.adapter();

    let sid = if let Some(ref id) = session_id {
        let check = adapter
            .query(
                "SELECT id FROM sessions WHERE id = ? AND project_id = ? LIMIT 1",
                &[id.as_str(), project_id.as_str()],
            )
            .await
            .map_err(|e| format!("Failed to validate session: {e}"))?;
        if check.is_empty() {
            return Err("Session not found for this project".to_string());
        }
        id.clone()
    } else {
        let session_rows = adapter
            .query(
                "SELECT id FROM sessions WHERE project_id = ? ORDER BY updated_at DESC LIMIT 1",
                &[project_id.as_str()],
            )
            .await
            .map_err(|e| format!("Failed to query sessions: {e}"))?;
        match session_rows.first().and_then(|r| r.first()) {
            Some(id) => id.to_string(),
            None => return Ok(Vec::new()),
        }
    };

    let rows = adapter
		.query(
			"SELECT id, session_id, role, content, created_at, token_count, model_used, latency_ms \
			 FROM turns WHERE session_id = ? ORDER BY sequence_num ASC, created_at ASC LIMIT 200",
			&[sid.as_str()],
		)
		.await
		.map_err(|e| format!("Failed to load turns: {e}"))?;

    let messages: Vec<ChatMessage> = rows
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
        .collect();

    Ok(messages)
}
