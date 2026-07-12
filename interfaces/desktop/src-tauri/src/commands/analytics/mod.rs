//! Analytics Tauri command surface — frontend emits typed events
//! into the platform's tracing pipeline.
//!
//! The event vocabulary is owned by `model_loader::wizard::analytics`
//! so the same Rust enum drives both the frontend SDK (via specta
//! codegen) and the backend emit sites. Today this module is the only
//! ingestion endpoint; future enhancements (libSQL persistence,
//! Supabase batch upload, devtool analytics inspector) hang off the
//! same Tauri command — the surface stays stable.

use crate::commands::_util::CommandError;
use devpulse_engine::platform::services::model_loader::{
    emit_analytics_event as emit_to_tracing, AnalyticsEvent,
};

/// Record a single analytics event.
///
/// The frontend calls this after a user-visible action that should be
/// counted (auth sign-in, wizard step viewed, etc.). The backend emit
/// sites (slot load, encoder activation) call
/// `devpulse_engine::platform::services::model_loader::emit_analytics_event`
/// directly — no Tauri round-trip.
///
/// # Errors
/// Reserved for the future persistence layer; today the call always
/// succeeds because tracing never fails synchronously.
#[tauri::command]
#[specta::specta]
pub async fn emit_analytics_event(event: AnalyticsEvent) -> Result<(), CommandError> {
    emit_to_tracing(&event);
    Ok(())
}
