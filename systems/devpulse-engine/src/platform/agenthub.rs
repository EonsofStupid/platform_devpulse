//! Engine facade for the bundled `AgentHub` process.
//!
//! History has one owner in the child. Live execution observations remain
//! here until agent and room extraction in plan 0009 R3b.0 is complete.

use std::path::PathBuf;
use std::sync::Arc;

use anyhow::{Result, anyhow};
use devpulse_agenthub::client::Client;
use devpulse_clyffy::providers::ProviderId;

pub use devpulse_agenthub::history::{
    FoundEvent, FoundPage, FoundSession, FoundSessions, HistorySourceReport, ParentResolution,
};

pub mod live;

/// One typed process client shared by all windows.
pub struct AgentHub {
    client: Result<Client, String>,
    live: Arc<live::LiveState>,
}

impl AgentHub {
    /// Connect lazily to the executable shipped beside `DevPulse`.
    #[must_use]
    pub fn new(data_dir: PathBuf) -> Self {
        Self {
            client: Client::bundled(data_dir).map_err(|error| format!("{error:#}")),
            live: Arc::default(),
        }
    }

    /// Retained execution observations shared with the agent and room owners.
    pub fn live(&self) -> &Arc<live::LiveState> {
        &self.live
    }

    /// Observe the bundled runtime without starting it or reading history.
    pub async fn status(&self) -> devpulse_agenthub::client::RuntimeStatus {
        match &self.client {
            Ok(client) => client.status().await,
            Err(error) => devpulse_agenthub::client::RuntimeStatus {
                state: devpulse_agenthub::client::RuntimeState::Failed,
                message: Some(error.clone()),
            },
        }
    }

    fn client(&self) -> Result<&Client> {
        self.client.as_ref().map_err(|error| anyhow!("{error}"))
    }

    /// Every session found on this machine, newest first.
    ///
    /// # Errors
    /// Runtime startup, connection or catalog failure.
    pub async fn sessions(&self) -> Result<FoundSessions> {
        self.client()?.sessions().await
    }

    /// One bounded transcript page, newest first when no cursor is supplied.
    ///
    /// # Errors
    /// Runtime failure, changed or unavailable transcript, or invalid locator.
    pub async fn page(
        &self,
        provider_id: ProviderId,
        locator: String,
        cursor: Option<String>,
    ) -> Result<FoundPage> {
        self.client()?.page(provider_id, locator, cursor).await
    }

    /// End the owned runtime before platform services close.
    ///
    /// # Errors
    /// When the OS cannot stop the runtime.
    pub async fn shutdown(&self) -> Result<()> {
        if let Ok(client) = &self.client {
            client.shutdown().await?;
        }
        Ok(())
    }
}
