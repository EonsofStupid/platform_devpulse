//! Ordinary Chat writes retain the explicit session chosen by the person.
use super::{Chat, ChatMessage};
use crate::platform::{
    SqlAdapter,
    agents::{TurnRow, save_turn},
};
use anyhow::{Result, ensure};
use uuid::Uuid;

pub(super) fn user_turn(content: &str) -> TurnRow<'_> {
    TurnRow {
        role: "user",
        content,
        token_count: None,
        model_used: None,
        finish_reason: None,
        latency_ms: None,
        metadata: None,
    }
}
impl Chat {
    async fn require_ordinary(&self, project: &str, session: &str) -> Result<()> {
        self.require_session(project, session, true).await?;
        let owned = self.db.query("SELECT session_id FROM agenthub_threads WHERE session_id = ? UNION ALL SELECT session_id FROM agenthub_room_threads WHERE session_id = ? UNION ALL SELECT session_id FROM chat_endpoint_sessions WHERE session_id = ?", &[session.into(), session.into(), session.into()]).await?;
        ensure!(
            owned.is_empty(),
            "This conversation must use its assigned agent, Council or endpoint"
        );
        Ok(())
    }
    /// Save to the selected ordinary conversation, or atomically create a new one.
    /// # Errors
    /// Invalid scope, empty content and writes to another conversation kind fail.
    pub async fn send_user(
        &self,
        project: &str,
        session: Option<&str>,
        content: &str,
    ) -> Result<ChatMessage> {
        let content = content.trim();
        ensure!(!content.is_empty(), "Message content is empty");
        self.require_project(project).await?;
        let id = if let Some(session) = session {
            self.require_ordinary(project, session).await?;
            save_turn(&self.db, session, project, &user_turn(content)).await?
        } else {
            let session = format!("sess-{}", Uuid::new_v4());
            let id = format!("turn-{}", Uuid::new_v4());
            let title: String = content.chars().take(80).collect();
            self.db.write_atomic(&[
                ("INSERT INTO sessions (id, project_id, title, interaction_count) VALUES (?, ?, ?, 1)", vec![session.as_str().into(), project.into(), title.into()]),
                ("INSERT INTO turns (id, session_id, project_id, role, content, sequence_num) VALUES (?, ?, ?, 'user', ?, 1)", vec![id.as_str().into(), session.as_str().into(), project.into(), content.into()]),
            ]).await?;
            id
        };
        self.message(&id).await
    }
    /// Save an ordinary model's completed answer. Missing token usage remains unknown.
    /// # Errors
    /// Refuses wrong scope, assigned conversations, blank answers and invalid metrics.
    pub async fn save_assistant(
        &self,
        project: &str,
        session: &str,
        content: &str,
        tokens: Option<i64>,
        model: &str,
        elapsed: i64,
    ) -> Result<ChatMessage> {
        self.require_ordinary(project, session).await?;
        ensure!(
            !content.trim().is_empty() && !model.trim().is_empty(),
            "A completed answer and model are required"
        );
        ensure!(
            tokens.is_none_or(|n| n >= 0) && elapsed >= 0,
            "Invalid response metrics"
        );
        let id = save_turn(
            &self.db,
            session,
            project,
            &TurnRow {
                role: "assistant",
                content,
                token_count: tokens,
                model_used: Some(model),
                finish_reason: None,
                latency_ms: Some(elapsed),
                metadata: None,
            },
        )
        .await?;
        self.message(&id).await
    }
}
