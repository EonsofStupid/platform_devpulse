//! Strict project/session reads shared by ordinary and endpoint chats.
use super::{Chat, ChatMessage};
use crate::platform::{SqlAdapter, SqlRow, SqlValue};
use anyhow::{Context, Result, ensure};
use devpulse_clyffy::providers::adapters::openai_compatible::{EndpointChatMessage, EndpointRole};

pub(super) fn text(row: &SqlRow, i: usize) -> Result<&str> {
    row.get(i)
        .and_then(SqlValue::as_text)
        .context("Invalid stored chat text")
}
fn message(row: &SqlRow) -> Result<ChatMessage> {
    Ok(ChatMessage {
        id: text(row, 0)?.into(),
        session_id: text(row, 1)?.into(),
        role: text(row, 2)?.into(),
        content: text(row, 3)?.into(),
        created_at: row
            .get(4)
            .and_then(SqlValue::as_integer)
            .context("Invalid chat timestamp")?,
        token_count: row.get(5).and_then(SqlValue::as_integer),
        model_used: row.get(6).and_then(SqlValue::as_text).map(str::to_owned),
        latency_ms: row.get(7).and_then(SqlValue::as_integer),
    })
}
impl Chat {
    pub(super) async fn require_project(&self, project: &str) -> Result<()> {
        ensure!(
            !self
                .db
                .query("SELECT id FROM projects WHERE id = ?", &[project.into()])
                .await?
                .is_empty(),
            "This project is not available"
        );
        Ok(())
    }
    pub(super) async fn require_session(
        &self,
        project: &str,
        session: &str,
        writable: bool,
    ) -> Result<()> {
        let rows = self
            .db
            .query(
                "SELECT ended_at FROM sessions WHERE id = ? AND project_id = ?",
                &[session.into(), project.into()],
            )
            .await?;
        let row = rows.first().context("Session not found for this project")?;
        ensure!(
            !writable || matches!(row.first(), Some(SqlValue::Null)),
            "This conversation is read-only"
        );
        Ok(())
    }
    pub(super) async fn message(&self, id: &str) -> Result<ChatMessage> {
        let rows = self.db.query("SELECT id, session_id, role, content, created_at, token_count, model_used, latency_ms FROM turns WHERE id = ?", &[id.into()]).await?;
        message(rows.first().context("Saved turn was not found")?)
    }
    /// Read the latest 200 turns in conversation order. No selection means a new chat.
    /// # Errors
    /// Refuses unknown sessions and cross-project reads instead of selecting another session.
    pub async fn recent(&self, project: &str, session: Option<&str>) -> Result<Vec<ChatMessage>> {
        let Some(session) = session else {
            return Ok(Vec::new());
        };
        self.require_session(project, session, false).await?;
        let rows = self.db.query("SELECT id, session_id, role, content, created_at, token_count, model_used, latency_ms FROM (SELECT * FROM turns WHERE session_id = ? AND project_id = ? ORDER BY sequence_num DESC, created_at DESC LIMIT 200) ORDER BY sequence_num ASC, created_at ASC", &[session.into(), project.into()]).await?;
        rows.iter().map(message).collect()
    }
    pub(super) async fn context(
        &self,
        project: &str,
        session: &str,
    ) -> Result<Vec<EndpointChatMessage>> {
        let rows = self.db.query("SELECT role, content FROM turns WHERE session_id = ? AND project_id = ? ORDER BY sequence_num ASC, created_at ASC LIMIT 2001", &[session.into(), project.into()]).await?;
        rows.iter()
            .map(|row| {
                let role = match text(row, 0)? {
                    "system" => EndpointRole::System,
                    "developer" => EndpointRole::Developer,
                    "user" => EndpointRole::User,
                    "assistant" => EndpointRole::Assistant,
                    _ => anyhow::bail!(
                        "This conversation contains a role the text endpoint cannot handle"
                    ),
                };
                Ok(EndpointChatMessage {
                    role,
                    content: text(row, 1)?.to_owned(),
                })
            })
            .collect()
    }
}
