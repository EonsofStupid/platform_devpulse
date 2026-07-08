//! Event sink trait — consumers implement to receive loader lifecycle events.
//!
//! The model loader emits events for every state change: discovery, download,
//! loading, VRAM, hardware, and slot assignment. Consumers wire these into
//! their own persistence, UI, or logging systems.

use crate::hardware::metrics::HardwareMetrics;
use crate::loading::states::{LoadingStage, MemoryFootprint};
use crate::models::registry::ModelRegistryEntry;
use serde::{Deserialize, Serialize};

/// Identifies the engine fulfilling a capability slot at a moment in time.
///
/// The loader stamps a fingerprint on every successful load and caches
/// the previous one per slot. When the next load produces a different
/// `runtime_id`, the engine fires [`LoaderEvent::CapabilityRebound`] —
/// when only `crate_version` / `upstream_revision` / `model_revision`
/// differ, it fires [`LoaderEvent::RuntimeVersionChanged`] instead.
///
/// All four version fields are optional because they're discovered at
/// load time from heterogeneous sources (cargo metadata, vendored fork
/// SHA stamps, `HuggingFace` LFS oid). A missing field means "not known
/// for this runtime"; the loader still produces a stable fingerprint
/// because `runtime_id` alone is sufficient for rebind detection.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct RuntimeFingerprint {
    /// Stable runtime handle — `"candle"`, `"llama-cpp-2"`, `"ort"`,
    /// `"sherpa-onnx-asr"`, `"qwen3-tts-candle"`, `"ollama-external"`,
    /// `"mistralrs"`, `"siglip2-onnx-fixres"`, … Matches the
    /// `runtime_id` field on the frontend `DevtoolMeta` registry.
    pub runtime_id: String,
    /// Cargo crate version of the runtime crate
    /// (`env!("CARGO_PKG_VERSION")` at runtime). `None` for runtimes
    /// that don't ship as a Rust crate (Ollama, system services).
    pub crate_version: Option<String>,
    /// Git commit SHA for vendored forks (`deps/moshi/`, `deps/ort/`,
    /// kokoros, …). `None` when the runtime is consumed unmodified.
    pub upstream_revision: Option<String>,
    /// SHA-256 of the model weights — already computed by the LFS
    /// download verifier for HuggingFace-sourced models. Lets the UI
    /// distinguish "same runtime, new model file" from "same model,
    /// new runtime version".
    pub model_revision: Option<String>,
}

/// Why a capability rebind happened — drives layman-language UI
/// copy in the runtime devtool's Activity tab.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "snake_case")]
pub enum RebindReason {
    /// First load of this slot in the current session — no prior
    /// runtime to compare against.
    InitialLoad,
    /// User explicitly swapped runtimes via the UI / preset apply.
    UserSwap,
    /// Engine fell back to an alternate runtime because the primary
    /// failed (OOM, missing weights, build feature off).
    Fallback,
    /// User accepted an upstream update — the new runtime is the
    /// same engine at a newer version.
    HotUpdate,
}

/// How the Model Loader communicates state changes.
///
/// `DevPulse` implements this with Tauri events + Clyffy narration.
/// Other apps use callbacks, channels, log sinks — whatever fits.
pub trait LoaderEventSink: Send + Sync {
    /// Emit a loader event.
    fn emit(&self, event: LoaderEvent);
}

/// All events the Model Loader can emit.
///
/// Each variant carries the minimum data needed for the consumer to react.
/// Events are serializable so they can cross IPC boundaries (Tauri events,
/// WebSocket, log files).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LoaderEvent {
    // ── Discovery ──────────────────────────────────────────
    /// Model directory scan started.
    RegistryScanStarted,
    /// Scan complete — found N models.
    RegistryScanComplete {
        /// Number of models discovered in the scan.
        models_found: usize,
    },
    /// A model was discovered during scan.
    ModelDiscovered(ModelRegistryEntry),

    // ── Download ───────────────────────────────────────────
    /// Download started from `HuggingFace`.
    DownloadStarted {
        /// Unique download identifier (UUID v7).
        download_id: String,
        /// `HuggingFace` repository ID (e.g. `"bartowski/Qwen3-14B-GGUF"`).
        repo_id: String,
        /// Target filename (e.g. `"Qwen3-14B-Q4_K_M.gguf"`).
        filename: String,
        /// Total expected bytes (0 if unknown until download begins).
        total_bytes: u64,
    },
    /// Download progress update.
    DownloadProgress {
        /// Download identifier matching the `DownloadStarted` event.
        download_id: String,
        /// Bytes downloaded so far.
        bytes_downloaded: u64,
        /// Total expected bytes (from `DownloadStarted`).
        total_bytes: u64,
        /// Current download speed in bytes per second.
        speed_bps: u64,
    },
    /// Download completed successfully.
    DownloadComplete {
        /// Download identifier matching the `DownloadStarted` event.
        download_id: String,
        /// Registry entry for the newly downloaded model.
        registry_entry: ModelRegistryEntry,
    },
    /// Download failed.
    DownloadFailed {
        /// Download identifier matching the `DownloadStarted` event.
        download_id: String,
        /// Human-readable error description.
        error: String,
    },
    /// Download was cancelled by user.
    DownloadCancelled {
        /// Download identifier that was cancelled.
        download_id: String,
    },

    // ── Loading ────────────────────────────────────────────
    /// Model loading started for a slot.
    LoadingStarted {
        /// Slot being loaded (e.g. `"chat.brain"`).
        slot_id: String,
        /// Registry ID of the model being loaded.
        model_id: String,
    },
    /// Loading stage progress.
    LoadingStage {
        /// Slot being loaded.
        slot_id: String,
        /// Current loading stage.
        stage: LoadingStage,
        /// Progress percentage (0.0–100.0).
        progress_pct: f32,
    },
    /// Loading completed successfully.
    LoadingComplete {
        /// Slot that finished loading.
        slot_id: String,
        /// Memory consumed by the loaded model.
        memory: MemoryFootprint,
    },
    /// Loading failed.
    LoadingFailed {
        /// Slot that failed to load.
        slot_id: String,
        /// Human-readable error description.
        error: String,
    },
    /// Model unloaded, memory freed.
    UnloadComplete {
        /// Slot that was unloaded.
        slot_id: String,
        /// Memory freed by the unload.
        freed: MemoryFootprint,
    },

    // ── Swap ───────────────────────────────────────────────
    /// Atomic model swap started (unload → reassign → load).
    SwapStarted {
        /// Slot being swapped.
        slot_id: String,
        /// Registry ID of the model being replaced (None if slot was empty).
        from_model: Option<String>,
        /// Registry ID of the new model being loaded.
        to_model: String,
    },
    /// Swap completed successfully — new model is loaded and ready.
    SwapComplete {
        /// Slot that finished swapping.
        slot_id: String,
        /// Registry ID of the now-loaded model.
        model_id: String,
    },
    /// Swap failed — slot may be in an unloaded state.
    SwapFailed {
        /// Slot that failed to swap.
        slot_id: String,
        /// Human-readable error description.
        error: String,
    },

    // ── VRAM ───────────────────────────────────────────────
    /// VRAM budget exceeded — load cannot proceed without action.
    VramInsufficient {
        /// VRAM needed for the requested load (MB).
        needed_mb: u64,
        /// VRAM currently available (MB).
        available_mb: u64,
        /// Human-readable suggestions for freeing VRAM.
        suggestions: Vec<String>,
    },

    // ── Hardware ───────────────────────────────────────────
    /// Hardware metrics updated (emitted on poll).
    HardwareMetricsUpdated(HardwareMetrics),

    // ── Slot ───────────────────────────────────────────────
    /// A model was assigned to a slot.
    SlotAssigned {
        /// Slot that received the assignment.
        slot_id: String,
        /// Registry ID of the assigned model.
        model_id: String,
    },
    /// A slot was unassigned.
    SlotUnassigned {
        /// Slot that was cleared.
        slot_id: String,
    },

    // ── Wizard connectome lifecycle ────────────────────────────
    //
    // Paired with `tracing::info!(target: "wizard.lifecycle", …)`
    // emissions in `service::assign_model` / `service::load_slot` /
    // `service::run_install_chain`. Both axes (`InternalEvent` and
    // tracing) MUST be wired together per
    // `feedback_dual_observability` — the devtool subscribes to
    // these `LoaderEvent`s for live connectome-tile state mirroring,
    // while the tracing target is for log replay + telemetry.
    /// Wizard customer hit Apply on a connectome tile. Fires BEFORE
    /// the install chain begins so the UI can flip the tile to
    /// "saving" state immediately, before any IO blocks.
    WizardTileApplied {
        /// Slot the customer applied (matches kernel slot id).
        slot_id: String,
        /// Registry model id about to be wired into the slot.
        /// `None` when the install chain is still resolving the
        /// `HuggingFace` download → registry entry mapping.
        model_id: Option<String>,
    },
    /// The slot symlink at
    /// `{userdata_dir}/slots/{slot_id}/model.<ext>` is now armed
    /// and points at the registry target. Chat / STS / vision
    /// callers probing that path will see the model from this
    /// instant forward. Emitted from `service::assign_model`
    /// regardless of whether load succeeds afterwards.
    WizardSymlinkArmed {
        /// Slot whose symlink was created or refreshed.
        slot_id: String,
        /// Absolute symlink path (the link, not the target).
        link_path: String,
        /// Absolute target path the symlink resolves to.
        target_path: String,
    },
    /// Symlink creation failed for a wizard apply. Distinct from
    /// the generic `InstallFailed` so the wizard can surface the
    /// Developer-Mode hint specifically when
    /// `ERROR_PRIVILEGE_NOT_HELD` (Windows 1314) is the cause.
    WizardSymlinkFailed {
        /// Slot whose symlink failed.
        slot_id: String,
        /// Human-readable failure reason (preserves the underlying
        /// IO error message, including any layman hint the symlink
        /// helper produced).
        error: String,
    },
    /// Every connectome slot in the wizard reached the `saved` state.
    /// Fired by the wizard view layer once `slotSaves.every(s =>
    /// s.state === "saved")` flips true.
    WizardConnectomeComplete {
        /// How many slots are now armed (typically 5 for the
        /// baseline foundation, but the constant is not enforced
        /// here — extending the constellation shouldn't require
        /// touching the event).
        slots_saved: u32,
        /// End-to-end wall time from first Apply to last Saved,
        /// in milliseconds. The wizard view starts the timer on
        /// first apply; the event fires when `allSaved` flips.
        duration_ms: u64,
    },

    // ── Intelligence pipeline lifecycle ────────────────────────
    //
    // Fired by the connectome `process_chat_message` pipeline on every
    // chat turn. The devtool's `/devtools/clyffy/memory/intelligence`
    // live mirror subscribes to all three so the operator sees text
    // → embed → save in real time. Tracing partner emits on the
    // `intel.pipeline` target. See [[feedback-dual-observability]].
    /// Chat turn entered the intelligence pipeline. Fires before
    /// any embed/storage work so the devtool can light up the
    /// "in flight" row immediately.
    IntelligenceClassifyStarted {
        /// Project slug — the `SurrealDB` database name under the
        /// `projects` namespace. Derived via `slug_for_cwd`.
        project_slug: String,
        /// Byte length of the chat content (no PII in the event).
        content_len: u64,
    },
    /// Burn embedder produced a vector for the chat content. Fired
    /// before the storage write so devtool sees the embed step
    /// separately from the persist step.
    IntelligenceEmbedComplete {
        /// Project slug (matches the corresponding
        /// `IntelligenceClassifyStarted`).
        project_slug: String,
        /// Vector dimension actually produced (sanity-check
        /// against `EMBEDDING_DIM`).
        dim: u32,
        /// Wall time to compute the embedding in milliseconds.
        duration_ms: u64,
    },
    /// `IntelligenceStore::save_memory` succeeded. Carries the row
    /// id the connector returned so the devtool can pivot into
    /// `SurrealDB` / Qdrant inspectors with one click.
    IntelligenceMemorySaved {
        /// Project slug.
        project_slug: String,
        /// Connector-returned memory id (Surreal record id today,
        /// future connectors may shape this differently).
        memory_id: String,
    },
    /// A chat turn escalated from the minion classifier to a
    /// heavier reasoning backend. `backend` is the human-readable
    /// route — currently `"chat.brain"` (local llama.cpp) or
    /// `"claude"` (Claude API or subscription).
    ReasoningEscalated {
        /// Project slug.
        project_slug: String,
        /// Which backend the router selected.
        backend: String,
    },
    /// Claude API key was set or cleared in the OS keyring. The
    /// boolean reflects the post-change presence, not the value.
    ClaudeApiActivated {
        /// `true` after a successful `set_claude_api_key`,
        /// `false` after `clear_claude_api_key`.
        key_present: bool,
    },

    // ── Install (one-button download → assign → load) ─────
    /// The atomic install chain started — download → scan → assign →
    /// load, sequenced inside `ModelLoaderService::install_to_slot`.
    /// Surfaces the install identity so the UI can correlate the
    /// downstream `DownloadProgress`, `LoadingStage`, and final
    /// `InstallComplete`/`InstallFailed` events back to a single
    /// "install this model into this slot" user action.
    InstallStarted {
        /// Unique install identifier (UUID v7).
        install_id: String,
        /// `HuggingFace` repository ID.
        repo_id: String,
        /// Primary filename within the repo. The download manager
        /// auto-resolves shards + companions from this entry point.
        primary_filename: String,
        /// Slot the model is being installed into.
        slot_id: String,
    },
    /// The install chain finished successfully — download committed,
    /// model registered, slot assigned, slot loaded into memory.
    InstallComplete {
        /// Install identifier matching the `InstallStarted` event.
        install_id: String,
        /// Slot that received the model.
        slot_id: String,
        /// Registry ID of the now-loaded model.
        model_id: String,
    },
    /// The install chain failed. The stage at which it failed is encoded
    /// in `error` (prefixed with `download:`/`scan:`/`assign:`/`load:`)
    /// so the UI can surface which step the user can retry.
    InstallFailed {
        /// Install identifier matching the `InstallStarted` event.
        install_id: String,
        /// Slot the install was targeting.
        slot_id: String,
        /// Stage-prefixed error description.
        error: String,
    },

    // ── Capability / runtime ───────────────────────────────
    /// A capability slot is now fulfilled by a different runtime.
    ///
    /// Fired when the loader observes that the same `slot_id` (treated
    /// as the capability handle — `voice.stt`, `voice.tts`,
    /// `vision.embedder`, `chat.brain`) now resolves to a different
    /// `runtime_id` than the prior load. Frontend consumers of the
    /// capability channel rebind to the new runtime without restart.
    ///
    /// `from_runtime` is `None` on the very first load of a slot in
    /// the current session — `reason == InitialLoad` in that case.
    CapabilityRebound {
        /// Capability handle — slot id verbatim (`voice.stt`, …).
        capability: String,
        /// Previous runtime, if there was one.
        from_runtime: Option<String>,
        /// Newly active runtime.
        to_runtime: String,
        /// Why the rebind happened.
        reason: RebindReason,
    },
    /// A runtime's version changed without the runtime itself changing.
    ///
    /// Fired when the loader observes that the same `runtime_id` is
    /// now reporting a different `crate_version` / `upstream_revision`
    /// / `model_revision` than the prior load. Lets the UI surface
    /// "Sherpa-ONNX upgraded to 1.13.4" without conflating it with a
    /// runtime swap.
    RuntimeVersionChanged {
        /// Runtime that changed version.
        runtime_id: String,
        /// Fingerprint at the previous load. `None` on first load.
        old_fingerprint: Option<RuntimeFingerprint>,
        /// Fingerprint at the current load.
        new_fingerprint: RuntimeFingerprint,
    },
}

/// Blanket impl for Arc — allows `Arc<dyn LoaderEventSink>` to be used directly.
impl<T: LoaderEventSink + ?Sized> LoaderEventSink for std::sync::Arc<T> {
    fn emit(&self, event: LoaderEvent) {
        (**self).emit(event);
    }
}

/// No-op event sink for testing or headless operation.
#[derive(Debug, Default)]
pub struct NullEventSink;

impl LoaderEventSink for NullEventSink {
    fn emit(&self, _event: LoaderEvent) {
        // Intentionally empty — events discarded.
    }
}

/// Logging event sink — writes events to tracing.
#[derive(Debug, Default)]
pub struct TracingEventSink;

impl LoaderEventSink for TracingEventSink {
    fn emit(&self, event: LoaderEvent) {
        if trace_load_swap_event(&event) {
            return;
        }
        if trace_wizard_event(&event) {
            return;
        }
        if trace_intelligence_event(&event) {
            return;
        }
        tracing::debug!("LoaderEvent: {event:?}");
    }
}

/// Trace load / swap / capability / runtime-version events.
/// Returns `true` when `event` matched one of the variants this helper
/// owns (so the caller can short-circuit instead of falling through
/// to the next family).
fn trace_load_swap_event(event: &LoaderEvent) -> bool {
    match event {
        LoaderEvent::LoadingStarted { slot_id, model_id } => {
            tracing::info!(slot = %slot_id, model = %model_id, "Model loading started");
        }
        LoaderEvent::LoadingComplete { slot_id, memory } => {
            tracing::info!(
                slot = %slot_id,
                ram_mb = memory.ram_mb(),
                vram_mb = memory.vram_mb(),
                "Model loading complete"
            );
        }
        LoaderEvent::LoadingFailed { slot_id, error } => {
            tracing::error!(slot = %slot_id, error = %error, "Model loading failed");
        }
        LoaderEvent::VramInsufficient {
            needed_mb,
            available_mb,
            ..
        } => {
            tracing::warn!(
                needed_mb,
                available_mb,
                "VRAM insufficient for requested load"
            );
        }
        LoaderEvent::SwapStarted {
            slot_id,
            from_model,
            to_model,
        } => {
            tracing::info!(
                slot = %slot_id,
                from = ?from_model,
                to = %to_model,
                "Model swap started"
            );
        }
        LoaderEvent::SwapComplete { slot_id, model_id } => {
            tracing::info!(slot = %slot_id, model = %model_id, "Model swap complete");
        }
        LoaderEvent::SwapFailed { slot_id, error } => {
            tracing::error!(slot = %slot_id, error = %error, "Model swap failed");
        }
        LoaderEvent::CapabilityRebound {
            capability,
            from_runtime,
            to_runtime,
            reason,
        } => {
            tracing::info!(
                capability = %capability,
                from = ?from_runtime,
                to = %to_runtime,
                reason = ?reason,
                "Capability rebound to new runtime"
            );
        }
        LoaderEvent::RuntimeVersionChanged {
            runtime_id,
            old_fingerprint,
            new_fingerprint,
        } => {
            tracing::info!(
                runtime = %runtime_id,
                old_crate_version = ?old_fingerprint.as_ref().and_then(|f| f.crate_version.as_ref()),
                new_crate_version = ?new_fingerprint.crate_version,
                old_upstream = ?old_fingerprint.as_ref().and_then(|f| f.upstream_revision.as_ref()),
                new_upstream = ?new_fingerprint.upstream_revision,
                "Runtime version changed"
            );
        }
        _ => return false,
    }
    true
}

/// Trace wizard connectome lifecycle events on the `wizard.lifecycle`
/// target. Consistent field names so log replay tools can correlate
/// `slot_id` across events without per-variant adapters.
fn trace_wizard_event(event: &LoaderEvent) -> bool {
    match event {
        LoaderEvent::WizardTileApplied { slot_id, model_id } => {
            tracing::info!(
                target: "wizard.lifecycle",
                slot_id = %slot_id,
                model_id = ?model_id,
                "Wizard tile applied"
            );
        }
        LoaderEvent::WizardSymlinkArmed {
            slot_id,
            link_path,
            target_path,
        } => {
            tracing::info!(
                target: "wizard.lifecycle",
                slot_id = %slot_id,
                link_path = %link_path,
                target_path = %target_path,
                "Wizard slot symlink armed"
            );
        }
        LoaderEvent::WizardSymlinkFailed { slot_id, error } => {
            tracing::warn!(
                target: "wizard.lifecycle",
                slot_id = %slot_id,
                error = %error,
                "Wizard slot symlink failed"
            );
        }
        LoaderEvent::WizardConnectomeComplete {
            slots_saved,
            duration_ms,
        } => {
            tracing::info!(
                target: "wizard.lifecycle",
                slots_saved,
                duration_ms,
                "Wizard connectome complete"
            );
        }
        _ => return false,
    }
    true
}

/// Trace intelligence-pipeline events on the `intel.pipeline` target.
fn trace_intelligence_event(event: &LoaderEvent) -> bool {
    match event {
        LoaderEvent::IntelligenceClassifyStarted {
            project_slug,
            content_len,
        } => {
            tracing::info!(
                target: "intel.pipeline",
                project_slug = %project_slug,
                content_len,
                "Chat turn entered intelligence pipeline"
            );
        }
        LoaderEvent::IntelligenceEmbedComplete {
            project_slug,
            dim,
            duration_ms,
        } => {
            tracing::info!(
                target: "intel.pipeline",
                project_slug = %project_slug,
                dim,
                duration_ms,
                "Embedding produced"
            );
        }
        LoaderEvent::IntelligenceMemorySaved {
            project_slug,
            memory_id,
        } => {
            tracing::info!(
                target: "intel.pipeline",
                project_slug = %project_slug,
                memory_id = %memory_id,
                "Memory persisted"
            );
        }
        LoaderEvent::ReasoningEscalated {
            project_slug,
            backend,
        } => {
            tracing::info!(
                target: "intel.pipeline",
                project_slug = %project_slug,
                backend = %backend,
                "Reasoning escalated"
            );
        }
        LoaderEvent::ClaudeApiActivated { key_present } => {
            tracing::info!(
                target: "intel.pipeline",
                key_present,
                "Claude API key state changed"
            );
        }
        _ => return false,
    }
    true
}
