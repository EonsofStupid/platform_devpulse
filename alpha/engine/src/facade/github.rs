// engine/src/facade/github.rs

//! GitHub facade - webhook receiver and signal emitter
//!
//! This is the PUBLIC API entry point for GitHub webhooks.
//! Engine receives webhook → validates → emits signals → returns 200 OK.
//!
//! Orchestrator subscribes to signals and does ML validation silently.

use crate::error::EngineError;
use shared::types::signal::SignalKind;
use serde::Deserialize;

/// GitHub webhook payload (push event)
#[derive(Debug, Clone, Deserialize)]
pub struct GitHubPushPayload {
    #[serde(rename = "ref")]
    pub git_ref: String,
    pub before: String,
    pub after: String,
    pub repository: Repository,
    pub pusher: Pusher,
    pub head_commit: Option<Commit>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Repository {
    pub id: u64,
    pub name: String,
    pub full_name: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Pusher {
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Commit {
    pub id: String,
    pub message: String,
    pub timestamp: String,
}

/// GitHub facade for webhook handling
pub struct GitHubFacade {
    // Signal emitter will be wired here
    // For now, just structure
}

impl GitHubFacade {
    /// Create new GitHub facade
    pub fn new() -> Self {
        Self {}
    }

    /// Handle incoming GitHub webhook
    ///
    /// 1. Validates webhook signature (TODO)
    /// 2. Emits GitHubPushReceived signal (orchestrator subscribes)
    /// 3. Emits GusCheckingCommit signal (desktop sees "🔍 Gus checking...")
    /// 4. Returns immediately (don't block webhook)
    pub async fn handle_push_webhook(
        &self,
        payload: GitHubPushPayload,
        _signature: &str, // TODO: validate HMAC signature
    ) -> Result<(), EngineError> {
        // Extract branch from ref (refs/heads/main → main)
        let branch = payload.git_ref
            .strip_prefix("refs/heads/")
            .unwrap_or(&payload.git_ref)
            .to_string();

        // Emit internal signal for orchestrator
        let _push_signal = SignalKind::GitHubPushReceived {
            repo_id: payload.repository.id.to_string(),
            repo_name: payload.repository.full_name.clone(),
            commit_sha: payload.after.clone(),
            before_sha: payload.before.clone(),
            branch: branch.clone(),
            pusher: payload.pusher.name.clone(),
        };

        // TODO: Emit signal to event bus
        // self.signal_bus.emit(push_signal).await?;

        // Emit user-facing signal
        let _checking_signal = SignalKind::GusCheckingCommit {
            repo_name: payload.repository.name.clone(),
            commit_message: payload.head_commit
                .map(|c| c.message)
                .unwrap_or_else(|| "Commit".to_string()),
        };

        // TODO: Emit signal to event bus
        // self.signal_bus.emit(checking_signal).await?;

        Ok(())
    }

    /// Enable protection for a GitHub repository
    ///
    /// Called from desktop wizard after OAuth flow.
    /// Sets up webhook, enables branch protection, stores config.
    pub async fn enable_protection(
        &self,
        _repo_id: &str,
        _repo_name: &str,
        _access_token: &str,
        _rules: Vec<shared::types::github::ProtectionRule>,
    ) -> Result<(), EngineError> {
        // TODO: Call orchestrator to:
        // 1. Create webhook on GitHub
        // 2. Enable branch protection
        // 3. Store config in libSQL
        // 4. Emit GusProtectionEnabled signal

        Ok(())
    }
}

impl Default for GitHubFacade {
    fn default() -> Self {
        Self::new()
    }
}
