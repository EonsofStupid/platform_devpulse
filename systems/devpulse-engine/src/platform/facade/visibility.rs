//! # Signal Visibility Classification
//!
//! Exhaustive match table for `InternalEvent` → `Visibility` tier.
//!
//! ## Design Decision (LOCKED)
//!
//! Visibility is a property of the *consumer* (`EventBridge`),
//! not the *producer* (Signal/InternalEvent). The event struct
//! stays a pure data atom with no audience awareness.
//!
//! ## Tiers
//!
//! - `Internal`  — Never crosses `EventBridge`. Minion deliberation,
//!                 raw scores, routing decisions.
//! - `Narrated`  — Crosses to webview after narration composer
//!                 transforms it into user-safe text.
//! - `Public`    — Crosses directly. Rendered as-is by the UI.
//! - `Debug`     — Lab only. Raw signal dump to Cortex viewer.

use serde::{Deserialize, Serialize};

use super::events::InternalEvent;

/// Visibility tier for an internal event.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Visibility {
    /// Never leaves the Rust process.
    Internal,
    /// Crosses `EventBridge` after narration rewrite.
    Narrated,
    /// Crosses `EventBridge` directly. Rendered as-is.
    Public,
    /// Lab-only. Full raw event to Cortex viewer.
    Debug,
}

/// Classify an `InternalEvent`'s visibility tier.
///
/// When adding a new variant to `InternalEvent`, the compiler
/// forces an arm here. Choose based on: "If a user saw this raw,
/// would it help them or confuse them?"
pub fn classify(event: &InternalEvent) -> Visibility {
    match event {
        // ── Model Lifecycle ─────────────────────────────────
        // User sees progress bar + "waking up..."
        InternalEvent::ModelLoadStarted { .. } => Visibility::Public,
        // Progress bar completes
        InternalEvent::ModelLoadComplete { .. } => Visibility::Public,
        // "Clyffy is resting this model..."
        InternalEvent::ModelUnloadStarted { .. } => Visibility::Narrated,
        // Bookkeeping — user already knows from started event
        InternalEvent::ModelUnloadComplete { .. } => Visibility::Internal,
        // Raw state machine transitions — meaningless to user
        InternalEvent::ModelStateChanged { .. } => Visibility::Internal,
        // "Adjusting for your other apps..."
        InternalEvent::VramPressureDetected { .. } => Visibility::Narrated,

        // ── Minion Signals ──────────────────────────────────
        // Orchestration plumbing — user doesn't know minions exist
        InternalEvent::MinionActivated { .. } => Visibility::Internal,
        // Core hidden CoT — feeds context assembly
        InternalEvent::MinionObservation { .. } => Visibility::Internal,
        // Raw mood score is internal telemetry — user experiences
        // the RESULT (empathetic tone shift), not the measurement
        InternalEvent::MinionMoodUpdate { .. } => Visibility::Internal,

        // ── Processing Traces ───────────────────────────────
        // "Thinking carefully about this..."
        InternalEvent::ProcessingLayerFired { .. } => Visibility::Narrated,
        // Retrieval plumbing — scores are internal
        InternalEvent::ContextRetrieved { .. } => Visibility::Internal,
        // Invisible background work
        InternalEvent::EmbeddingComputed { .. } => Visibility::Internal,
        // ML pipeline internals
        InternalEvent::RerankerScored { .. } => Visibility::Internal,

        // ── Prompt Assembly ─────────────────────────────────
        // "Preparing your request..."
        InternalEvent::PromptAssembled { .. } => Visibility::Narrated,
        // Gate result: red = ask for clarification, green = silent
        InternalEvent::PromptGateResult { .. } => Visibility::Narrated,
        // "You said 4 words, I turned that into a detailed spec."
        // THIS is the product demo moment per PHILOSOPHY.md
        InternalEvent::PromptTranslated { .. } => Visibility::Public,

        // ── Governance ──────────────────────────────────────
        // "Heads up — spotted something..."
        InternalEvent::GovernanceRuleTriggered { .. } => Visibility::Narrated,
        // "Noticed a potential issue in your code..."
        InternalEvent::DriftDetected { .. } => Visibility::Narrated,
        // "Caught something that could cause trouble..."
        InternalEvent::AntiPatternBlocked { .. } => Visibility::Narrated,

        // ── Signal Routing ──────────────────────────────────
        // Pure orchestration plumbing
        InternalEvent::SignalReceived { .. } => Visibility::Internal,
        InternalEvent::SignalRouted { .. } => Visibility::Internal,

        // ── Resource Arbiter ────────────────────────────────
        // "Adjusting resources..."
        InternalEvent::AllocationChanged { .. } => Visibility::Narrated,

        // ── Inference Metrics ───────────────────────────────
        // Developer telemetry — user sees characters appearing
        InternalEvent::TokenGenerated { .. } => Visibility::Internal,
        // ML runtime bookkeeping
        InternalEvent::KvCacheUsage { .. } => Visibility::Internal,
        // ROTI calculation, not user display
        InternalEvent::InferenceComplete { .. } => Visibility::Internal,
    }
}

/// Narration template hints for Narrated events.
///
/// NOT final user-facing strings. The narration composer adjusts
/// tone based on mood assessment and competency level.
pub fn narration_hint(event: &InternalEvent) -> Option<&'static str> {
    match event {
        InternalEvent::ModelUnloadStarted { .. } =>
            Some("Clyffy is resting this model for now..."),
        InternalEvent::VramPressureDetected { .. } =>
            Some("Adjusting for your other apps..."),
        InternalEvent::ProcessingLayerFired { .. } =>
            Some("Thinking about this..."),
        InternalEvent::PromptAssembled { .. } =>
            Some("Preparing your request..."),
        InternalEvent::PromptGateResult { .. } =>
            Some("Checking if I have enough context..."),
        InternalEvent::GovernanceRuleTriggered { .. } =>
            Some("Heads up — spotted something worth mentioning..."),
        InternalEvent::DriftDetected { .. } =>
            Some("Noticed a potential issue in your code..."),
        InternalEvent::AntiPatternBlocked { .. } =>
            Some("Caught something that could cause trouble..."),
        InternalEvent::AllocationChanged { .. } =>
            Some("Adjusting resources..."),
        _ => None,
    }
}

// Counts: Internal=14, Narrated=8, Public=3, Debug=lab-only-override
