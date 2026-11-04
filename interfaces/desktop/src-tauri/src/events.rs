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

use devpulse_engine::signals::Signal;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_specta::Event;

// ── Signal fabric bridge ────────────────────────────────────────────

/// One engine signal forwarded to the UI.
///
/// The desktop shell subscribes to the engine's `SignalRouter` once and
/// re-emits every signal whose variant routes to `SinkKind::Broadcast`.
/// The frontend signal fabric (`#lib/sys/events/signal-fabric.svelte.ts`)
/// is the single listener and dispatches on `signal.payload.type`.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
pub struct SignalBroadcast {
    /// Provenance header + typed payload.
    pub signal: Signal,
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
    /// New provider identifier (matches `RoutingMode` on the kernel
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

// ── Agent threads ───────────────────────────────────────────────────

/// One event of an agent thread's running turn (plan 0001 B3.3): part of
/// the answer, its reasoning, a tool it uses, a permission it asks for, the
/// turn's end or its failure.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct AgentStreamed {
    /// The thread (its chat session id).
    pub session_id: String,
    /// What happened.
    pub event: devpulse_engine::platform::agents::AgentEvent,
}

/// Retained `AgentHub` observations changed. Fetch a snapshot; notifications may coalesce.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct AgentHubChanged {
    /// Runtime identity; revisions are only comparable inside this epoch.
    pub epoch: String,
    /// Latest observed revision.
    pub revision: u64,
}

// ── Rooms ───────────────────────────────────────────────────────────

/// One event of a room answering (plan 0001 B4.2): part of a place's
/// running turn, a place's finished turn, or the room's outcome.
#[derive(Debug, Clone, Serialize, Deserialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct RoomStreamed {
    /// The room (its chat session id).
    pub session_id: String,
    /// What happened.
    pub event: devpulse_engine::platform::rooms::RoomEvent,
}
