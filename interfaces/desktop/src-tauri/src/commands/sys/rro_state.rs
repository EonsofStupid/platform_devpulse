//! RRO state machine commands — snapshot + control verbs.
//!
//! All 6 verbs map 1:1 to public vocabulary in `signals.registry.yaml`.
//! No kernel-internal names cross this boundary.
//!
//! # Event emission
//!
//! Transitions fire Tauri events on `platform:rro-state-changed` with the
//! new snapshot as payload. The frontend subscribes via `listen()` so the
//! UI updates live without polling. The event bridge is spawned from
//! `lib.rs` after the platform handle is installed.
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri command module — every Result-returning fn is a thin wrapper that resolves the `Platform` handle then forwards to `RroState::*`; failure is exclusively the `Platform is still booting` case documented at `resolve_platform`."
)]

use std::sync::Arc;

use crate::state::PlatformState;
use devpulse_engine::platform::{Platform, RroDepth, RroStateSnapshot};
use tauri::State;

/// Resolve the platform handle or surface a boot-in-progress error.
fn resolve_platform(state: &State<'_, PlatformState>) -> Result<Arc<Platform>, String> {
    state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_string())
}

/// Get the current RRO state snapshot.
#[tauri::command]
#[specta::specta]
pub async fn get_rro_state(state: State<'_, PlatformState>) -> Result<RroStateSnapshot, String> {
    let platform = resolve_platform(&state)?;
    Ok(platform.reasoning().snapshot().await)
}

/// Set the deliberation depth. Does not transition state.
#[tauri::command]
#[specta::specta]
pub async fn set_rro_depth(
    state: State<'_, PlatformState>,
    depth: RroDepth,
) -> Result<RroStateSnapshot, String> {
    let platform = resolve_platform(&state)?;
    Ok(platform.reasoning().set_depth(depth).await)
}

/// Trigger a gather. Transitions state → gathering.
#[tauri::command]
#[specta::specta]
pub async fn trigger_rro_gather(
    state: State<'_, PlatformState>,
    source: String,
) -> Result<RroStateSnapshot, String> {
    let platform = resolve_platform(&state)?;
    Ok(platform.reasoning().gather(source).await)
}

/// Trigger a purge. Transitions state → purged.
#[tauri::command]
#[specta::specta]
pub async fn trigger_rro_purge(
    state: State<'_, PlatformState>,
    reason: String,
) -> Result<RroStateSnapshot, String> {
    let platform = resolve_platform(&state)?;
    Ok(platform.reasoning().purge(reason).await)
}

/// Trigger a fork. Transitions state → forked.
#[tauri::command]
#[specta::specta]
pub async fn trigger_rro_fork(
    state: State<'_, PlatformState>,
    label: String,
) -> Result<RroStateSnapshot, String> {
    let platform = resolve_platform(&state)?;
    Ok(platform.reasoning().fork(label).await)
}

/// Set the proximity diagnostic indicator. Clamped to [0.0, 1.0].
#[tauri::command]
#[specta::specta]
pub async fn set_rro_proximity(
    state: State<'_, PlatformState>,
    value: f32,
) -> Result<RroStateSnapshot, String> {
    let platform = resolve_platform(&state)?;
    Ok(platform.reasoning().set_proximity(value).await)
}
