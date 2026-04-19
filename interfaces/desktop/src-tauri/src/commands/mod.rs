//! Tauri command modules and the universal status push framework.
//!
//! Every domain pushes state to the frontend via [`emit_status`].
//! The frontend listens to `platform:{domain}-status` events and
//! sets rune state directly from the payload. Zero IPC polling.
//!
//! ## Pattern
//!
//! ```text
//! Rust:   emit_status(&app, "models", StatusKind::Data, &payload);
//! Event:  "platform:models-status"  →  { kind: "data", data: ... }
//! Svelte: listen("platform:models-status") → set $state from payload
//! ```
//!
//! Every domain. Every mutation. Same function. Same shape.

use serde::Serialize;
use tauri::Emitter;

// ── Status Push Framework ───────────────────────────────────────

/// Severity / purpose of a status update.
///
/// Frontend switches on this to decide how to handle the payload:
/// - `Data`  → full state snapshot, set rune state directly
/// - `Info`  → informational, show toast or log
/// - `Error` → recoverable, show error banner
/// - `Crash` → unrecoverable, show error overlay
#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "lowercase")]
pub enum StatusKind {
    /// Full state snapshot — frontend sets `$state` directly.
    Data,
    /// Informational message — frontend may show toast or log.
    Info,
    /// Recoverable error — frontend shows error banner.
    Error,
    /// Unrecoverable failure — frontend shows error overlay.
    Crash,
}

/// Universal status update envelope emitted to the frontend.
///
/// `T` is the domain-specific payload — `ModelsStatusData`,
/// `VoiceStatusData`, etc. Specta generates TypeScript types
/// for each concrete instantiation.
#[derive(Debug, Clone, Serialize)]
pub struct StatusUpdate<T: Serialize> {
    /// What kind of update this is.
    pub kind: StatusKind,
    /// Domain-specific payload.
    pub data: T,
}

/// Push a status update to all frontend windows.
///
/// Event name: `platform:{domain}-status`
///
/// This is THE function. Every domain. Every mutation. Every boot.
/// The frontend listens and sets `$state` directly from `data`.
///
/// ```rust
/// emit_status(&app, "models", StatusKind::Data, &models_payload);
/// emit_status(&app, "voice",  StatusKind::Error, &"TTS engine crashed");
/// ```
pub fn emit_status<T: Serialize>(
    app: &tauri::AppHandle,
    domain: &str,
    kind: StatusKind,
    data: &T,
) {
    let event_name = format!("platform:{domain}-status");
    let update = StatusUpdate {
        kind: kind.clone(),
        data,
    };
    let _ = app.emit(&event_name, &update);
    tracing::info!(
        domain,
        kind = ?kind,
        event = %event_name,
        "emit_status"
    );
}

// ── Domain Modules ──────────────────────────────────────────────

pub mod chat;
pub mod cloud;
pub mod credentials;
pub mod devclyffy;
pub mod devforge;
pub mod devpulse;
pub mod llama;
pub mod models;
pub mod sys;
pub mod thinkclyffy;
pub mod voice;
pub mod window;
pub mod wiredfront;
