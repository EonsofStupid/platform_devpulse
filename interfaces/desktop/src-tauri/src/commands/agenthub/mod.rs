//! `AgentHub` — thin wrappers over the engine's `agenthub` facade
//! (`devpulse_engine::platform::agenthub`): your sessions with every agent,
//! found on this machine, and one session's pages. No logic here.

use std::sync::Arc;

use crate::commands::_util::CommandError;
use crate::state::PlatformState;
use devpulse_engine::platform::Platform;
use devpulse_engine::platform::agenthub::live::{LiveSnapshot, LiveState};
use devpulse_engine::platform::agenthub::tickets::{self, Ticket};
use devpulse_engine::platform::agenthub::{FoundPage, FoundSessions};
use devpulse_engine::platform::providers::ProviderId;
use tauri::{Emitter, State};

/// Current execution observations, including text and unanswered permissions.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn agenthub_live(state: State<'_, PlatformState>) -> Result<LiveSnapshot, CommandError> {
    Ok(platform(&state)?.agenthub().live().snapshot())
}

/// Relay invalidations independently of the window that submitted a prompt.
pub(crate) fn spawn_bridge(app: tauri::AppHandle, live: &LiveState) {
    let mut changes = live.subscribe();
    devpulse_telemetry::spawn(async move {
        while changes.changed().await.is_ok() {
            // Coalesce token bursts without cloning their text or queueing deltas.
            tokio::time::sleep(std::time::Duration::from_millis(32)).await;
            let event = {
                let current = changes.borrow_and_update();
                crate::events::AgentHubChanged {
                    epoch: current.epoch.clone(),
                    revision: current.revision,
                }
            };
            if let Err(error) = tauri_specta::Event::emit(&event, &app) {
                tracing::warn!(target: "agenthub", %error, "live observation notification failed");
            }
        }
    });
}

/// The platform, once boot has published it. Before that nothing was asked
/// of the engine, so it is a pre-flight failure (`not-configured`).
fn platform(state: &PlatformState) -> Result<Arc<Platform>, CommandError> {
    state
        .platform
        .load_full()
        .ok_or_else(|| CommandError::not_configured("Platform is still booting"))
}

/// Tickets belong to a project in the platform's user database.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn agenthub_tickets(
    project_id: String,
    state: State<'_, PlatformState>,
) -> Result<Vec<Ticket>, CommandError> {
    let platform = platform(&state)?;
    let db = platform
        .user_relational()
        .ok_or_else(|| CommandError::not_configured("User database unavailable"))?;
    Ok(tickets::list(db.adapter(), &project_id).await?)
}

/// Create a durable work specification; this does not dispatch an agent.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn agenthub_create_ticket(
    project_id: String,
    title: String,
    goal: String,
    criteria: Vec<String>,
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
) -> Result<Ticket, CommandError> {
    let platform = platform(&state)?;
    let db = platform
        .user_relational()
        .ok_or_else(|| CommandError::not_configured("User database unavailable"))?;
    let ticket = tickets::create(db.adapter(), &project_id, &title, &goal, criteria).await?;
    if let Err(error) = app.emit("agenthub-tickets-changed", &project_id) {
        tracing::warn!(target: "agenthub", %error, "ticket notification failed");
    }
    Ok(ticket)
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
