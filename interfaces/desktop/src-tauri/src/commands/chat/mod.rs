//! Chat commands — message persistence via `LibSQL`.
//!
//! Messages are stored in the `messages` table with session tracking.
//! Each message gets a session — creates one if none active.

pub mod history;
pub mod interactions;

use crate::state::PlatformState;
use devpulse_engine::platform::SqlAdapter;
use serde::Serialize;
use specta::Type;
use tauri::State;

/// A chat message returned to the frontend.
///
/// Serialized as JSON over IPC via `send_message`. The frontend renders
/// these in the chat panel, keyed by `id` for dedup.
#[derive(Debug, Clone, Serialize, Type)]
pub struct ChatMessage {
    /// Auto-increment primary key from the `messages` table.
    pub id: i64,
    /// Format: `"sess-{epoch_millis}"`. Auto-created if no open session exists.
    pub session_id: String,
    /// Either `"user"` or `"assistant"` — no other values currently.
    pub role: String,
    /// Raw text as entered. No markdown processing server-side.
    pub content: String,
    /// `SQLite` `DEFAULT (strftime('%s','now'))` — epoch seconds, not millis.
    pub created_at: i64,
}

/// Send a chat message — persists to `LibSQL` and returns the stored message.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn send_message(
    content: String,
    state: State<'_, PlatformState>,
) -> Result<ChatMessage, String> {
    let lock = state.platform.read().await;
    let platform = lock.as_ref().ok_or("Platform is still booting")?;

    let svc = platform
        .relational()
        .ok_or("Relational service not available")?;
    let adapter = svc.adapter();

    // Get or create active session
    let session_rows = adapter
        .query(
            "SELECT id FROM sessions WHERE ended_at IS NULL ORDER BY created_at DESC LIMIT 1",
            &[],
        )
        .await
        .map_err(|e| format!("Failed to query sessions: {e}"))?;

    let session_id = if let Some(id) = session_rows.first().and_then(|r| r.first()) {
        id.to_string()
    } else {
        let new_id = format!("sess-{}", chrono::Utc::now().timestamp_millis());
        adapter
            .execute("INSERT INTO sessions (id) VALUES (?)", &[new_id.as_str()])
            .await
            .map_err(|e| format!("Failed to create session: {e}"))?;
        new_id
    };

    // Insert user message
    adapter
        .execute(
            "INSERT INTO messages (session_id, role, content) VALUES (?, 'user', ?)",
            &[session_id.as_str(), content.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to insert message: {e}"))?;

    // Get the inserted message back (with id and timestamp)
    let rows = adapter
        .query(
            "SELECT id, session_id, role, content, created_at FROM messages \
             WHERE session_id = ? ORDER BY id DESC LIMIT 1",
            &[session_id.as_str()],
        )
        .await
        .map_err(|e| format!("Failed to read back message: {e}"))?;

    let row = rows.first().ok_or("No message returned after insert")?;

    Ok(ChatMessage {
        id: row.first().and_then(devpulse_engine::platform::SqlValue::as_integer).unwrap_or(0),
        session_id: row.get(1).and_then(|v| v.as_text()).unwrap_or("").to_string(),
        role: row.get(2).and_then(|v| v.as_text()).unwrap_or("").to_string(),
        content: row.get(3).and_then(|v| v.as_text()).unwrap_or("").to_string(),
        created_at: row.get(4).and_then(devpulse_engine::platform::SqlValue::as_integer).unwrap_or(0),
    })
}
