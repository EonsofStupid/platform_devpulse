//! Grammar (structured-output) Tauri commands — snapshot + control verbs.
//!
//! Mirrors the shape of [`commands::sys::rro_state`] (same facade tier:
//! in-memory handle, broadcast events, public vocabulary). The kernel
//! grammar engine records enforcement / failure counts through the
//! handle; this command surface exposes the snapshot + mutator verbs.
//!
//! # Event emission
//!
//! Transitions fire Tauri events on `platform:grammar-changed` with the
//! new snapshot as payload. The event bridge is spawned from `lib.rs`
//! after the platform handle is installed — mirrors the RRO bridge.
//! Frontend subscribes via `listen()`; no polling.

use std::sync::Arc;

use crate::state::PlatformState;
use devpulse_engine::platform::{GrammarKind, GrammarSnapshot, Platform};
use tauri::State;

/// Resolve the platform handle or surface a boot-in-progress error.
fn resolve_platform(state: &State<'_, PlatformState>) -> Result<Arc<Platform>, String> {
    state
        .platform
        .load_full()
        .ok_or_else(|| "Platform is still booting".to_string())
}

/// Get the current grammar snapshot.
#[tauri::command]
#[specta::specta]
pub async fn get_grammar_state(state: State<'_, PlatformState>) -> Result<GrammarSnapshot, String> {
    let platform = resolve_platform(&state)?;
    Ok(platform.grammar().snapshot().await)
}

/// Set the active grammar kind (does not imply enforcement).
#[tauri::command]
#[specta::specta]
pub async fn set_grammar_kind(
    state: State<'_, PlatformState>,
    kind: GrammarKind,
) -> Result<GrammarSnapshot, String> {
    let platform = resolve_platform(&state)?;
    Ok(platform.grammar().set_kind(kind).await)
}

/// Enable the grammar engine with an opaque grammar id.
///
/// The caller supplies the id; it's treated as an opaque handle for
/// display (`active_grammar_id` in snapshots) and never parsed.
#[tauri::command]
#[specta::specta]
pub async fn enable_grammar(
    state: State<'_, PlatformState>,
    grammar_id: String,
) -> Result<GrammarSnapshot, String> {
    let platform = resolve_platform(&state)?;
    Ok(platform.grammar().enable(grammar_id).await)
}

/// Disable the grammar engine entirely.
#[tauri::command]
#[specta::specta]
pub async fn disable_grammar(state: State<'_, PlatformState>) -> Result<GrammarSnapshot, String> {
    let platform = resolve_platform(&state)?;
    Ok(platform.grammar().disable().await)
}
