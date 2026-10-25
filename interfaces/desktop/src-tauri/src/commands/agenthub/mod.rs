//! `AgentHub` — thin wrappers over the engine's `agenthub` facade
//! (`devpulse_engine::platform::agenthub`): your sessions with every agent,
//! found on this machine, and one session's pages. No logic here.

use std::sync::Arc;

use crate::commands::_util::CommandError;
use crate::state::PlatformState;
use devpulse_engine::platform::agenthub::{FoundPage, FoundSessions};
use devpulse_engine::platform::providers::ProviderId;
use devpulse_engine::platform::Platform;
use tauri::State;

/// The platform, once boot has published it. Before that nothing was asked
/// of the engine, so it is a pre-flight failure (`not-configured`).
fn platform(state: &PlatformState) -> Result<Arc<Platform>, CommandError> {
    state
        .platform
        .load_full()
        .ok_or_else(|| CommandError::not_configured("Platform is still booting"))
}

/// Every session found on this machine, newest first, and where each
/// agent's history was looked for.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn agenthub_sessions(
    state: State<'_, PlatformState>,
) -> Result<FoundSessions, CommandError> {
    Ok(platform(&state)?.agenthub().sessions().await?)
}

/// One page of a found session, oldest event first; `cursor` (from the
/// previous page) asks for the next older one.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn agenthub_session_page(
    provider_id: ProviderId,
    locator: String,
    cursor: Option<String>,
    state: State<'_, PlatformState>,
) -> Result<FoundPage, CommandError> {
    Ok(platform(&state)?
        .agenthub()
        .page(provider_id, locator, cursor)
        .await?)
}
