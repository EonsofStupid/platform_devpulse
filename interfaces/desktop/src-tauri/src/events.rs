//! Typed Tauri events via `tauri-specta`.
//!
//! Every event defined here is type-safe across the Rust→TS boundary:
//! `specta::Type` emits the TypeScript shape into `bindings.ts`,
//! `tauri_specta::Event` derives `emit()` + `listen()` methods, and
//! `collect_events![...]` registers the set with the Tauri builder.
//!
//! # Migration policy
//!
//! Every NEW Tauri event lives here. Existing `app.emit("string", ...)`
//! callsites are migrated to typed variants in batches — each migration
//! replaces:
//!
//! - Rust: `app.emit("foo:bar", &payload)` → `FooBar { ... }.emit(&app)`
//! - TS:   `listen("foo:bar", cb)` → `events.fooBar.listen(cb)`
//!
//! When you add an event:
//! 1. Define the struct below with the required derives.
//! 2. Add it to the `collect_events!` macro in `build_specta_builder`
//!    (in [`crate::lib`]).
//! 3. Run `cargo xtask regen-bindings` to refresh `bindings.ts`.
//! 4. Update emit sites + frontend listeners in the same PR.
//!
//! # Required derives
//!
//! ```rust,ignore
//! #[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
//! ```
//!
//! `Deserialize` is needed because tauri-specta's `Event` trait
//! implements `listen()` which deserializes the payload back into the
//! Rust type — used both for backend-side listeners and for the
//! type contract that the frontend listener generation depends on.

use devpulse_engine::platform::HardwareMetrics;
use devpulse_gb10_client::ConnectionState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::Event;

// ── Platform boot lifecycle ─────────────────────────────────────────

/// Emitted as the boot task transitions between phases. Replaces the
/// stringly-typed `platform:boot-phase` event family.
///
/// Frontend listens via `events.bootPhaseChanged.listen(cb)` and
/// renders the appropriate splash / dashboard / error overlay based
/// on the phase.
///
/// The boot health snapshot is intentionally NOT a field here — it's
/// a deep `SystemHealth` tree that doesn't implement `specta::Type`
/// without a wider derive sweep. Consumers that need the post-boot
/// health blob call the `get_boot_state` Tauri command which returns
/// it inside a typed `BootSnapshot`.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct BootPhaseChanged {
    /// New phase value.
    pub phase: BootPhaseValue,
    /// Failure message — populated only when `phase == Failed`.
    pub error: Option<String>,
}

/// Boot phase value. Mirrors [`crate::state::BootPhase`] but lives in
/// the events module so the event-export crate doesn't pull the
/// managed-state surface.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum BootPhaseValue {
    /// Platform is still starting up.
    Initializing,
    /// All services booted successfully (or degraded gracefully).
    Ready,
    /// Boot failed — `BootPhaseChanged.error` carries the reason.
    Failed,
}

// ── Hardware push (2s tick) ─────────────────────────────────────────

/// Periodic hardware metrics push (CPU / RAM / GPU / VRAM). Replaces
/// the stringly-typed `model:hardware` event.
///
/// Emitted every 2s by the hardware push task in [`crate::lib`].
/// Frontend `hardwareState` rune listens and updates VRAM bar, GPU
/// utilization, etc.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct HardwareMetricsUpdated {
    /// Full metrics snapshot. The frontend overwrites its rune state
    /// from this struct directly — no diff merging.
    pub metrics: HardwareMetrics,
}

// ── llama-server sidecar lifecycle ──────────────────────────────────

/// The llama-server sidecar has bound to its port and is ready to
/// accept OpenAI-compatible chat completion requests. Replaces
/// `llama:server-ready`.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct LlamaServerReady {
    /// TCP port the sidecar bound to (loopback only).
    pub port: u16,
    /// Filesystem path of the GGUF model the sidecar loaded.
    pub model_path: String,
}

/// One token of streamed completion text from the llama-server
/// sidecar. Replaces `llama:token`.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct LlamaTokenStreamed {
    /// Decoded text fragment (typically 1–6 chars; whitespace
    /// preserved).
    pub content: String,
}

// ── In-process inference token stream ───────────────────────────────

/// One token of streamed completion text from the in-process Candle
/// or llama.cpp FFI inference engine. Replaces `inference-token`.
///
/// Distinct from [`LlamaTokenStreamed`] which carries tokens from the
/// llama-server child process (OpenAI-compatible HTTP). This event
/// fires for the embedded Rust inference path.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct InferenceTokenStreamed {
    /// Decoded text fragment.
    pub text: String,
}

// ── Cloud inference (Anthropic Messages API streaming) ──────────────

/// The user changed the active inference provider (local / cloud /
/// hybrid). Replaces `provider:changed`. Frontend uses this to
/// invalidate slot-bound runes that depend on the active provider.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct InferenceProviderChanged {
    /// New provider identifier (matches `RoutingMode` on the engine
    /// side, surfaced as a plain string here).
    pub provider: String,
}

/// One token of streamed completion text from the cloud inference
/// path (Anthropic Messages API). Replaces `cloud:token`.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct CloudTokenStreamed {
    /// Decoded text fragment.
    pub content: String,
}

/// Final summary of a completed cloud inference request — model used,
/// input + output token counts. Fires once at end-of-stream. Replaces
/// `cloud:complete`.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct CloudCompletionFinished {
    /// Anthropic model identifier that actually served the request
    /// (may differ from the requested alias).
    pub model: String,
    /// Total input tokens consumed.
    pub input_tokens: u64,
    /// Total output tokens emitted.
    pub output_tokens: u64,
}

// ── Chat sessions ───────────────────────────────────────────────────

/// A chat session was deleted. Frontend uses this to drop the session
/// from the sidebar list without polling. Replaces
/// `platform:chat-session-deleted`.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct ChatSessionDeleted {
    /// Identifier of the deleted session row.
    pub session_id: String,
}

// ── Auto-updater lifecycle ──────────────────────────────────────────

/// Emitted every time the updater finishes a probe. Subscribers (the
/// Latest tab, a sidebar badge) flip their "update available" indicator
/// without having to call [`crate::commands::updates::check_for_update`]
/// themselves.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAvailable {
    /// Whether a newer build is available.
    pub available: bool,
    /// Version this build currently identifies as.
    pub current_version: String,
    /// Version offered by the endpoint, when one is offered.
    pub latest_version: Option<String>,
    /// Release notes from `latest.json` — markdown body.
    pub notes: Option<String>,
}

/// Streamed progress while the update payload downloads. Frontend
/// converts `downloaded_bytes / total_bytes` into a progress bar; a
/// missing `total_bytes` means the server did not advertise a length
/// (rare for GitHub Releases) and the UI shows an indeterminate bar.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDownloadProgress {
    /// Bytes received so far this download.
    pub downloaded_bytes: u64,
    /// Total bytes expected, when the server advertised a length.
    pub total_bytes: Option<u64>,
}

/// Fires once the installer has been launched. The frontend transitions
/// into a "restarting…" state; the process exits shortly after via
/// `app.restart()`.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct UpdateInstallFinished {}

// ── Clyffy wire connection ──────────────────────────────────────────

/// The Clyffy (headless AI layer) connection state changed — emitted by the
/// background probe task on every transition (Disconnected ↔ Connecting ↔
/// Connected). Frontend listens via `events.clyffyConnectionChanged.listen(cb)`
/// to flip the no-AI indicator and light up Tier-2 surfaces. The `capability`
/// inside a `Connected` payload is always **computed** from the endpoint
/// handshake, never assumed.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct ClyffyConnectionChanged {
    /// New connection state (carries the computed capability when Connected).
    pub connection: ConnectionState,
}
