//! An explicit, versioned execution snapshot; credentials never leave the kernel.
use super::{Connections, registry, store, supports_text_test};
use crate::providers::{
    ProviderId,
    adapters::openai_compatible::{
        self, EndpointChatMessage, EndpointChatRequest, EndpointChatResult,
    },
};
use anyhow::{Result, ensure};
use serde::{Deserialize, Serialize};

/// Public identity of the connection and model a conversation was started with.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct TextTarget {
    /// Saved endpoint identity.
    pub connection_id: String,
    /// Exact configuration generation approved when starting the conversation.
    pub revision: i64,
    /// Connection name at creation, retained even after removal.
    pub label: String,
    /// Explicit model, never selected by a fallback.
    pub model: String,
}

/// Private execution snapshot. Deliberately neither serializable nor debuggable.
pub struct PreparedText {
    target: TextTarget,
    endpoint: String,
    key: Option<String>,
    hosted_openai: bool,
}

impl Connections {
    /// Resolve only this saved connection's credential and check its generation.
    /// # Errors
    /// Refuses removed/edited connections, unsupported protocols and missing keys.
    pub async fn prepare_text(&self, id: &str, revision: i64, model: &str) -> Result<PreparedText> {
        let _guard = self.checks.lock().await;
        let record = store::get(self.db.as_ref(), id).await?;
        ensure!(
            record.revision == revision,
            "This connection changed. Start a new chat with its current configuration before sending history."
        );
        ensure!(
            registry::find(record.provider).is_some_and(supports_text_test),
            "This connection does not implement text conversations"
        );
        ensure!(
            !model.trim().is_empty(),
            "Choose a model for this conversation"
        );
        let key = self.key(&record).await?;
        Ok(PreparedText {
            target: TextTarget {
                connection_id: record.id,
                revision: record.revision,
                label: record.label,
                model: model.to_owned(),
            },
            endpoint: record.endpoint,
            key,
            hosted_openai: record.provider == ProviderId::OpenAi,
        })
    }
}

impl PreparedText {
    /// The public identity resolved with this request's private credentials.
    #[must_use]
    pub fn target(&self) -> &TextTarget {
        &self.target
    }

    /// Bound complete conversation input without silently discarding old turns.
    /// # Errors
    /// Oversized histories require a new conversation or explicit context management.
    pub fn validate_messages(messages: &[EndpointChatMessage]) -> Result<()> {
        ensure!(
            !messages.is_empty() && messages.len() <= 2000,
            "This conversation exceeds the 2,000-message request limit; start a new chat"
        );
        let bytes = messages
            .iter()
            .try_fold(0usize, |sum, m| sum.checked_add(m.content.len()));
        ensure!(
            bytes.is_some_and(|n| n <= 1024 * 1024),
            "This conversation exceeds the 1 MiB request limit; start a new chat"
        );
        ensure!(
            messages.iter().all(|m| !m.content.trim().is_empty()),
            "Conversation messages cannot be empty"
        );
        Ok(())
    }

    /// Stream this conversation through its explicitly prepared endpoint.
    /// # Errors
    /// Context validation, transport, response and consumer failures remain failures.
    pub async fn stream(
        &self,
        messages: Vec<EndpointChatMessage>,
        on_delta: impl FnMut(&str) -> Result<()>,
    ) -> Result<EndpointChatResult> {
        Self::validate_messages(&messages)?;
        let request = EndpointChatRequest {
            model: Some(self.target.model.clone()),
            messages,
            max_tokens: (!self.hosted_openai).then_some(1024),
            max_completion_tokens: self.hosted_openai.then_some(4096),
            temperature: None,
            top_p: None,
            stop: Vec::new(),
        };
        openai_compatible::stream(&self.endpoint, self.key.as_deref(), &request, on_delta).await
    }
}
