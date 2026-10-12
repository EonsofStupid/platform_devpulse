//! Onboarding analytics — typed event stream emitted across the
//! wizard / auth / model-load chain.
//!
//! Why analytics here, not a separate crate: the events instrument the
//! *automated portions* of the onboarding pipeline (system scan,
//! preset apply, model download, slot load, encoder activation). Those
//! all live in `model-loader` already, so the event types live next to
//! the code that emits them. The frontend can also emit events via the
//! `emit_analytics_event` Tauri command (auth sign-in, step viewed, etc.).
//!
//! # Discrimination
//!
//! `AnalyticsEvent` is a tagged enum (`#[serde(tag = "name", content =
//! "props")]`) so the wire shape is `{ "name": "slot-loaded", "props":
//! { ... } }` and the frontend can `switch (event.name)` without a
//! second type lookup.
//!
//! # What gets emitted today
//!
//! - Auth: `AuthSignedIn` / `AuthSignedUp` / `AuthSignedOut` (frontend
//!   calls Tauri command after a successful supabase-js round trip).
//! - Setup: `WizardStarted`, `SystemScanCompleted`, `PresetApplied`,
//!   `ModelDownloadStarted` / `Completed` / `Failed`, `SlotLoaded` /
//!   `SlotLoadFailed`, `EmbedderFirstQuery`, `EncoderActivationFailed`.
//!
//! Wiring the backend emit sites into the existing scan / load / activate
//! call sites is a follow-up slice — `emit_event` is the integration
//! point. Today's shell records via `tracing::info!` only; future
//! enhancement: persist to Turso `analytics_events`, batch-upload to
//! Supabase via the signed-in user's RLS-scoped insert.

use serde::{Deserialize, Serialize};

/// One typed analytics record. Variant name is the event name; the
/// variant's struct payload is the event props.
///
/// Wire shape: `{ "name": "slot-loaded", "props": { ... } }`.
///
/// `kebab-case` rename keeps the JSON output consistent with the rest
/// of the platform's external event vocabulary (`platform:models-status`,
/// `model:hardware`, etc.).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(tag = "name", content = "props", rename_all = "kebab-case")]
pub enum AnalyticsEvent {
    /// User has reached the wizard entry point.
    WizardStarted {
        /// Stable per-session id generated at app boot — links all
        /// events emitted during one `DevPulse` run.
        session_id: String,
    },
    /// Hardware probe finished — tier picked, key metrics captured.
    SystemScanCompleted {
        /// Wall-clock duration of the scan.
        duration_ms: u64,
        /// Detected tier (`Floor` / `Minimal` / `CpuOnly` / `Mid` /
        /// `High` / `Workstation`, etc.). Wire-stable kebab-case.
        tier: String,
        /// GPU model string. `None` for CPU-only boxes.
        gpu_name: Option<String>,
        /// Detected VRAM in MB. `0` for CPU-only.
        vram_mb: u64,
    },
    /// A preset (tier-adaptive model bundle) was applied. Tracks
    /// success rate so the recommendation engine can iterate.
    PresetApplied {
        /// Preset identifier (e.g. `auto.recommended`, `manual.harrier`).
        preset_name: String,
        /// `true` if every slot in the preset loaded successfully.
        success: bool,
        /// End-to-end apply latency.
        duration_ms: u64,
    },
    /// HF download initiated.
    ModelDownloadStarted {
        /// `<owner>/<repo>` form.
        repo_id: String,
        /// Bundle total size in MB.
        size_mb: u64,
        /// `auto` (preset apply), `manual` (downloader UI), `wizard`.
        source: String,
    },
    /// HF download finished successfully.
    ModelDownloadCompleted {
        /// `<owner>/<repo>` form.
        repo_id: String,
        /// Wall-clock duration end-to-end.
        duration_ms: u64,
        /// Actual bytes pulled (may be less than `size_mb` if files
        /// were already on disk and resumed).
        bytes_downloaded: u64,
    },
    /// HF download failed.
    ModelDownloadFailed {
        /// `<owner>/<repo>` form.
        repo_id: String,
        /// Error message from the kernel.
        error: String,
    },
    /// A slot was loaded into a runtime. The unit of "the model is
    /// runnable now" — this proves the chain past on-disk into RAM.
    SlotLoaded {
        /// Slot id (`chat.brain`, `rag.embedder`, etc.).
        slot_id: String,
        /// Runtime that took the load (`llama-cpp`, `burn`, `candle`,
        /// `mistralrs`, etc.).
        runtime: String,
        /// `<owner>/<repo>` form.
        repo_id: String,
        /// Wall-clock load latency.
        duration_ms: u64,
    },
    /// Slot load failed. The chain broke before "runnable."
    SlotLoadFailed {
        /// Slot id (`chat.brain`, `rag.embedder`, etc.).
        slot_id: String,
        /// Runtime that attempted the load (`llama-cpp`, `burn`, etc.).
        runtime: String,
        /// Error message from the kernel.
        error: String,
    },
    /// First embedding query against a newly-loaded embedder
    /// completed. Proves the on-disk → loaded → callable chain
    /// end-to-end. Fires exactly once per `(slot_id, assignment)`
    /// pair — `assign_model` clears the seen-set so a swap re-arms
    /// the trigger.
    EmbedderFirstQuery {
        /// Slot id that just served its first query
        /// (`rag.embedder`, `minion.embedder`).
        slot_id: String,
        /// Runtime that hosted the embedder
        /// (`candle`, `burn-cpu`, `llama-cpp-2`).
        runtime: String,
        /// Round-trip latency for the first query (ms).
        latency_ms: u64,
    },
    /// Encoder activation failed — usually surfaces when the loaded
    /// model can't service a query (tokenizer mismatch, missing
    /// kernel, OOM). Distinct from `SlotLoadFailed` which fires
    /// before any query.
    EncoderActivationFailed {
        /// Slot id (`rag.embedder`, `rag.encoder`, etc.).
        slot_id: String,
        /// Error message from the kernel.
        error: String,
        /// Runtime that hosted the encoder.
        runtime: String,
    },
    /// User signed in via Supabase. Emitted by the frontend after a
    /// successful supabase-js `signInWithPassword` round trip.
    AuthSignedIn {
        /// Supabase user id (UUID).
        user_id: String,
    },
    /// User created a Supabase account. Fires once per signup; the
    /// subsequent first sign-in fires `AuthSignedIn`.
    AuthSignedUp {
        /// Supabase user id (UUID).
        user_id: String,
    },
    /// User signed out.
    AuthSignedOut {
        /// Supabase user id of the signed-out session.
        user_id: String,
    },
}

/// Emit an event into the platform's tracing pipeline. Today this is
/// the only persistence — every wire-emitted event lands in the
/// session JSONL via `tracing-subscriber`. The Supabase batch upload
/// is a follow-up.
///
/// Kept as a free function (not a method) so backend call sites can
/// emit without holding any state — they just `analytics::emit_event(&evt)`.
pub fn emit_event(event: &AnalyticsEvent) {
    // serde_json is the cheapest serialization that's compatible with
    // the existing JSONL tracing pipeline. The frontend / backend
    // converge on the same wire shape.
    match serde_json::to_string(event) {
        Ok(json) => tracing::info!(target: "analytics", event = %json, "onboarding-event"),
        Err(e) => {
            tracing::warn!(target: "analytics", error = %e, "failed to serialize analytics event");
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn slot_loaded_serializes_to_kebab_name_with_props() {
        let evt = AnalyticsEvent::SlotLoaded {
            slot_id: "rag.embedder".to_string(),
            runtime: "burn".to_string(),
            repo_id: "microsoft/harrier-oss-v1-0.6b".to_string(),
            duration_ms: 1234,
        };
        let json = serde_json::to_string(&evt).expect("serialize");
        assert!(json.contains("\"name\":\"slot-loaded\""), "actual: {json}");
        assert!(
            json.contains("\"slot_id\":\"rag.embedder\""),
            "actual: {json}"
        );
        assert!(json.contains("\"runtime\":\"burn\""), "actual: {json}");
    }

    #[test]
    fn auth_signed_in_serializes_with_user_id() {
        let evt = AnalyticsEvent::AuthSignedIn {
            user_id: "00000000-0000-0000-0000-000000000001".to_string(),
        };
        let json = serde_json::to_string(&evt).expect("serialize");
        assert!(
            json.contains("\"name\":\"auth-signed-in\""),
            "actual: {json}"
        );
        assert!(json.contains("\"user_id\":\"00000000"), "actual: {json}");
    }

    #[test]
    fn embedder_first_query_props_minimal() {
        let evt = AnalyticsEvent::EmbedderFirstQuery {
            slot_id: "rag.embedder".to_string(),
            runtime: "candle".to_string(),
            latency_ms: 42,
        };
        let json = serde_json::to_string(&evt).expect("serialize");
        assert!(
            json.contains("\"name\":\"embedder-first-query\""),
            "actual: {json}"
        );
        assert!(
            json.contains("\"slot_id\":\"rag.embedder\""),
            "actual: {json}"
        );
        assert!(json.contains("\"runtime\":\"candle\""), "actual: {json}");
        assert!(json.contains("\"latency_ms\":42"), "actual: {json}");
    }
}
