//! Chat history — load messages from LibSQL.

use crate::state::PlatformState;
use devpulse_engine::platform::SqlAdapter;
use super::ChatMessage;
use tauri::State;

/// Load recent chat messages from LibSQL.
///
/// Returns the last 50 messages from the most recent active session.
#[tauri::command]
pub async fn load_recent(
    state: State<'_, PlatformState>,
) -> Result<Vec<ChatMessage>, String> {
    let lock = state.platform.read().await;
    let platform = lock.as_ref().ok_or("Platform is still booting")?;

    let store = platform
        .relational()
        .ok_or("Relational store not available")?;
    let adapter = store.adapter();

    // Get most recent session
    let session_rows = adapter
        .query(
            "SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1",
            &[],
        )
        .await
        .map_err(|e| format!("Failed to query sessions: {e}"))?;

    let session_id = match session_rows.first().and_then(|r| r.first()) {
        Some(id) => id.clone(),
        None => return Ok(Vec::new()),
    };

    // Load messages for this session
    let rows = adapter
        .query(
            "SELECT id, session_id, role, content, created_at FROM messages \
             WHERE session_id = ? ORDER BY created_at ASC, id ASC LIMIT 50",
            &[&session_id],
        )
        .await
        .map_err(|e| format!("Failed to load messages: {e}"))?;

    let messages: Vec<ChatMessage> = rows
        .into_iter()
        .map(|row| ChatMessage {
            id: row.first().and_then(|s| s.parse().ok()).unwrap_or(0),
            session_id: row.get(1).cloned().unwrap_or_default(),
            role: row.get(2).cloned().unwrap_or_default(),
            content: row.get(3).cloned().unwrap_or_default(),
            created_at: row.get(4).and_then(|s| s.parse().ok()).unwrap_or(0),
        })
        .collect();

    Ok(messages)
}
