//! Clyffy wire connection status command.
//!
//! Reports the current [`ConnectionState`] (Disconnected / Connecting /
//! Connected) computed by the background probe task (`clyffy_probe_loop` in
//! [`crate::lib`]). This is the seam the frontend reads to drive the no-AI
//! indicator and every Tier-2 surface gate — capability is always **computed**
//! from the live endpoint handshake, never assumed.
//!
//! The client is standalone and always present, so unlike the
//! [`crate::commands::sys::vector`] seam there is no `kernel-inproc` arm: a
//! `Disconnected` result is the honest standalone answer, not an error.

use crate::connection_store::{ClyffyConnectionRecord, ConnectionStore};
use crate::events::ClyffyConnectionChanged;
use crate::state::ClyffyConnectionState;
use devpulse_gb10_client::ConnectionState;
use tauri::{AppHandle, State};
use tauri_specta::Event;

/// Persist the operator's connection choice. Failures are surfaced in
/// the scoped log but never fail the live connect/disconnect — the
/// in-memory re-point already happened and is the operator's intent;
/// a persistence hiccup must not undo it.
fn persist_choice(app: &AppHandle, endpoint: Option<String>) {
    match crate::paths::resolve_data_dir(app) {
        Ok(data_dir) => {
            let store = ConnectionStore::new(&data_dir);
            let record = ClyffyConnectionRecord {
                endpoint,
                setup_decided: true,
            };
            if let Err(err) = store.save(&record) {
                tracing::warn!(
                    target: "clyffy.connection",
                    error = %err,
                    "couldn't persist connection choice — it will not survive restart"
                );
            }
        }
        Err(err) => {
            tracing::warn!(
                target: "clyffy.connection",
                error = %err,
                "couldn't resolve data dir — connection choice not persisted"
            );
        }
    }
}

/// Current Clyffy connection state.
///
/// Always succeeds — `Disconnected` is the honest standalone answer, not a
/// failure. The frontend derives `tier2Available` and the no-AI indicator from
/// the returned variant, and reads the computed `capability` when `Connected`.
///
/// # Errors
/// Never returns `Err` today; the `Result` keeps the specta signature stable if
/// a fallible read is introduced later.
#[tauri::command]
#[specta::specta]
pub async fn connection_status(
    state: State<'_, ClyffyConnectionState>,
) -> Result<ConnectionState, String> {
    Ok(state.current())
}

/// Connect the AI layer to a Clyffy endpoint (the operator's Local or GB10
/// address — discovered or entered, never hardcoded).
///
/// Sets the runtime target the probe loop dials; the connection lights up on the
/// next probe tick. Returns (and emits) the immediate `Connecting` cue so the
/// no-AI indicator flips instantly, then the probe settles it to `Connected`
/// (capability computed from the live handshake) or back to `Disconnected` if
/// unreachable — the loop keeps retrying so it reconnects seamlessly.
///
/// # Errors
/// Returns `Err` when `url` is empty/whitespace.
#[tauri::command]
#[specta::specta]
pub async fn connect_clyffy(
    app: AppHandle,
    url: String,
    state: State<'_, ClyffyConnectionState>,
) -> Result<ConnectionState, String> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err(
            "Endpoint is empty — enter a Local or GB10 Clyffy address to connect.".to_string(),
        );
    }
    let target = trimmed.to_string();
    state.set_endpoint(Some(target.clone()));
    tracing::info!(
        target: "clyffy.connection",
        endpoint = %target,
        "operator connect — probe re-pointed"
    );
    persist_choice(&app, Some(target.clone()));
    let connecting = ConnectionState::Connecting { url: target };
    state.store(connecting.clone());
    let _ = ClyffyConnectionChanged {
        connection: connecting.clone(),
    }
    .emit(&app);
    Ok(connecting)
}

/// Disconnect the AI layer — return DevPulse to standalone (Tier-1).
///
/// Clears the target endpoint; the probe loop settles to `Disconnected` on its
/// next tick. Returns (and emits) `Disconnected` immediately so the indicator
/// flips without waiting for the tick.
///
/// # Errors
/// Never returns `Err`; the `Result` keeps the specta signature stable.
#[tauri::command]
#[specta::specta]
pub async fn disconnect_clyffy(
    app: AppHandle,
    state: State<'_, ClyffyConnectionState>,
) -> Result<ConnectionState, String> {
    state.set_endpoint(None);
    tracing::info!(
        target: "clyffy.connection",
        "operator disconnect — returning to standalone (Tier-1)"
    );
    persist_choice(&app, None);
    state.store(ConnectionState::Disconnected);
    let _ = ClyffyConnectionChanged {
        connection: ConnectionState::Disconnected,
    }
    .emit(&app);
    Ok(ConnectionState::Disconnected)
}

/// Whether the operator has made the connect-or-skip decision at least
/// once. The boot gate reads this: undecided → the wizard auto-opens on
/// the connect step; decided → it never force-opens again (re-entry
/// stays available from the status surfaces).
///
/// # Errors
/// Returns `Err` when the data dir can't be resolved.
#[tauri::command]
#[specta::specta]
pub async fn is_clyffy_setup_decided(app: AppHandle) -> Result<bool, String> {
    let data_dir = crate::paths::resolve_data_dir(&app)?;
    Ok(ConnectionStore::new(&data_dir).load().setup_decided)
}

/// Record the operator's "not now" — standalone is their decision, a
/// mode, never an error. Leaves any previously persisted endpoint
/// untouched (skipping the wizard must not silently drop a working
/// connection choice).
///
/// # Errors
/// Returns `Err` when the data dir can't be resolved or the record
/// can't be written.
#[tauri::command]
#[specta::specta]
pub async fn skip_clyffy_setup(app: AppHandle) -> Result<(), String> {
    let data_dir = crate::paths::resolve_data_dir(&app)?;
    let store = ConnectionStore::new(&data_dir);
    let mut record = store.load();
    record.setup_decided = true;
    tracing::info!(
        target: "clyffy.connection",
        "operator skipped connect — standalone by choice"
    );
    store.save(&record)
}
