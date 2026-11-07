// engine/src/signals/sinks/durable.rs

//! Durable sink - routes signals to libSQL
//!
//! Handles: Chat signals (persistent history)

use super::SignalSink;
use crate::signals::payloads::Role;
use crate::{Signal, SignalVariant};
use orchestrator::infra::persistence::sql::Database;
use std::sync::Arc;
use tracing::instrument;

/// Durable sink - writes to libSQL for persistence
pub struct DurableSink {
    db: Arc<Database>,
}

impl DurableSink {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }
}

#[async_trait::async_trait]
impl SignalSink for DurableSink {
    #[instrument(skip(self, signal), fields(signal_id = %signal.header.id))]
    async fn process(&self, signal: &Signal) {
        match &*signal.payload {
            SignalVariant::Chat(payload) => {
                // Convert Role enum to string for storage
                let role_str = match payload.role {
                    Role::User => "user",
                    Role::Assistant => "assistant",
                    Role::System => "system",
                };

                // Persist chat message to libSQL
                match self
                    .db
                    .record_message(&payload.session_id, role_str, &payload.content, None)
                    .await
                {
                    Ok(msg_id) => {
                        tracing::debug!(
                            msg_id,
                            role = role_str,
                            len = payload.content.len(),
                            "Chat message persisted to libSQL"
                        );
                    }
                    Err(e) => {
                        tracing::error!(
                            error = %e,
                            role = role_str,
                            "Failed to persist chat message to libSQL"
                        );
                    }
                }
            }
            _ => {
                // Other signal types don't go to durable storage directly
            }
        }
    }

    fn name(&self) -> &'static str {
        "durable"
    }
}
