//! # Translation Registry
//!
//! The 1:1 mapping from `InternalEvent` → `SurfaceEvent`.
//!
//! Every event category registers a translator. The translator receives
//! the raw internal event + the current whitelist config, and returns
//! either `Some(SurfaceEvent)` (translate it) or `None` (drop it).
//!
//! # Adding New Translations
//!
//! 1. Add the variant to `InternalEvent` in events.rs
//! 2. Map it to a category in `InternalEvent::category()`
//! 3. Add the translation logic in the appropriate translator below
//! 4. The whitelist config already handles allow/deny by category

use std::collections::HashMap;

use uuid::Uuid;

use super::config::{DetailLevel, WhitelistConfig};
use super::events::{
    AllocationMode, EventCategory, InternalEvent, LoadingState, MinionId, MoodLabel,
    PressureAction, ProcessingLayer, SlotId,
};
use super::surface::{Severity, SurfaceAction, SurfaceCategory, SurfaceEvent};

/// Trait for translating a category of internal events into surface events.
pub trait EventTranslator: Send + Sync {
    fn category(&self) -> EventCategory;

    fn translate(&self, event: &InternalEvent, config: &WhitelistConfig) -> Option<SurfaceEvent>;
}

/// Registry of all translators, keyed by event category.
pub struct TranslationRegistry {
    translators: HashMap<EventCategory, Box<dyn EventTranslator>>,
}

impl TranslationRegistry {
    /// Build the registry with all default translators.
    pub fn default_registry() -> Self {
        let mut registry = Self {
            translators: HashMap::new(),
        };

        registry.register(Box::new(ModelLifecycleTranslator));
        registry.register(Box::new(MinionSignalTranslator));
        registry.register(Box::new(ProcessingTraceTranslator));
        registry.register(Box::new(PromptAssemblyTranslator));
        registry.register(Box::new(GovernanceTranslator));
        registry.register(Box::new(SignalRoutingTranslator));
        registry.register(Box::new(ResourceArbiterTranslator));
        registry.register(Box::new(InferenceMetricsTranslator));

        registry
    }

    pub fn register(&mut self, translator: Box<dyn EventTranslator>) {
        self.translators.insert(translator.category(), translator);
    }

    pub fn translate(
        &self,
        event: &InternalEvent,
        config: &WhitelistConfig,
    ) -> Option<SurfaceEvent> {
        let category = event.category();
        self.translators
            .get(&category)
            .and_then(|t| t.translate(event, config))
    }
}

// ─────────────────────────────────────────────────────────────────
// Built-in translators
// ─────────────────────────────────────────────────────────────────

// ── Model Lifecycle ─────────────────────────────────────────────

struct ModelLifecycleTranslator;

impl EventTranslator for ModelLifecycleTranslator {
    fn category(&self) -> EventCategory {
        EventCategory::ModelLifecycle
    }

    fn translate(&self, event: &InternalEvent, config: &WhitelistConfig) -> Option<SurfaceEvent> {
        match event {
            InternalEvent::ModelLoadStarted {
                slot,
                estimated_vram_mb,
                ..
            } => {
                let name = slot_name(slot, config.show_model_names);
                Some(SurfaceEvent {
                    id: Uuid::now_v7(),
                    timestamp_ms: 0,
                    category: SurfaceCategory::Loading,
                    headline: format!("Loading {name}..."),
                    detail: config
                        .show_timing
                        .then(|| format!("Estimated {estimated_vram_mb}MB GPU memory")),
                    progress: Some(0.0),
                    severity: Severity::Status,
                    minion: Some(MinionId::Clyffy),
                    dismissible: false,
                    action: Some(SurfaceAction::ShowProgress {
                        label: format!("Loading {name}"),
                    }),
                })
            }
            InternalEvent::ModelLoadComplete {
                slot, load_time_ms, ..
            } => {
                let name = slot_name(slot, config.show_model_names);
                Some(SurfaceEvent {
                    id: Uuid::now_v7(),
                    timestamp_ms: 0,
                    category: SurfaceCategory::Complete,
                    headline: format!("{name} ready"),
                    detail: config
                        .show_timing
                        .then(|| format!("Loaded in {load_time_ms}ms")),
                    progress: Some(1.0),
                    severity: Severity::Info,
                    minion: Some(MinionId::Clyffy),
                    dismissible: true,
                    action: None,
                })
            }
            InternalEvent::ModelStateChanged { slot, from, to } => {
                let headline = match (from, to) {
                    (LoadingState::Cold, LoadingState::Warm) => {
                        Some("Preparing models...".to_string())
                    }
                    (LoadingState::Standby, LoadingState::Hot) => {
                        Some("Clyffy is ready".to_string())
                    }
                    (LoadingState::Hot, LoadingState::Standby) => {
                        Some("Clyffy is resting (still available)".to_string())
                    }
                    _ => None,
                };
                headline.map(|h| SurfaceEvent {
                    id: Uuid::now_v7(),
                    timestamp_ms: 0,
                    category: SurfaceCategory::SystemHealth,
                    headline: h,
                    detail: config
                        .show_model_names
                        .then(|| format!("{}: {from:?} → {to:?}", slot_name(slot, true))),
                    progress: None,
                    severity: Severity::Info,
                    minion: Some(MinionId::Clyffy),
                    dismissible: true,
                    action: None,
                })
            }
            InternalEvent::VramPressureDetected {
                free_gb, action, ..
            } => {
                let headline = match action {
                    PressureAction::EvictToRam { .. } => {
                        "Adjusting for your other apps...".to_string()
                    }
                    PressureAction::RequestRestart => {
                        "Restart recommended for best performance".to_string()
                    }
                    _ => return None,
                };
                Some(SurfaceEvent {
                    id: Uuid::now_v7(),
                    timestamp_ms: 0,
                    category: SurfaceCategory::SystemHealth,
                    headline,
                    detail: config.show_scores.then(|| format!("{free_gb:.1}GB free")),
                    progress: None,
                    severity: Severity::Notice,
                    minion: Some(MinionId::Clyffy),
                    dismissible: true,
                    action: None,
                })
            }
            InternalEvent::ModelUnloadStarted { .. }
            | InternalEvent::ModelUnloadComplete { .. } => (config.level
                >= DetailLevel::Intermediate)
                .then(|| SurfaceEvent::clyffy_status("Freeing up resources...")),
            _ => None,
        }
    }
}

// ── Minion Signals ──────────────────────────────────────────────

struct MinionSignalTranslator;

impl EventTranslator for MinionSignalTranslator {
    fn category(&self) -> EventCategory {
        EventCategory::MinionSignal
    }

    fn translate(&self, event: &InternalEvent, config: &WhitelistConfig) -> Option<SurfaceEvent> {
        match event {
            InternalEvent::MinionMoodUpdate { mood_score, label } => {
                let headline = match label {
                    MoodLabel::Enraged => "Clyffy sees you're really frustrated. Let's step back.",
                    MoodLabel::Frustrated => {
                        "Clyffy noticed you might be stuck. Taking a careful look..."
                    }
                    MoodLabel::Neutral => return None,
                    MoodLabel::Encouraged => "Nice progress!",
                    MoodLabel::Happy => "You're on a roll!",
                    MoodLabel::PicassoMode => {
                        "You're in the zone! Clyffy's staying out of the way."
                    }
                };
                Some(SurfaceEvent {
                    id: Uuid::now_v7(),
                    timestamp_ms: 0,
                    category: SurfaceCategory::Observing,
                    headline: headline.to_string(),
                    detail: config
                        .show_scores
                        .then(|| format!("Mood: {mood_score:.2} ({label:?})")),
                    progress: None,
                    severity: Severity::Info,
                    minion: Some(MinionId::Psych),
                    dismissible: true,
                    action: None,
                })
            }
            InternalEvent::MinionObservation {
                minion,
                observation,
            } => {
                if config.level == DetailLevel::Surface && observation.confidence < 0.7 {
                    return None;
                }
                Some(SurfaceEvent {
                    id: Uuid::now_v7(),
                    timestamp_ms: 0,
                    category: SurfaceCategory::Observing,
                    headline: observation.summary.clone(),
                    detail: config.show_scores.then(|| {
                        format!(
                            "{minion:?}: {} (confidence: {:.2})",
                            observation.kind, observation.confidence
                        )
                    }),
                    progress: None,
                    severity: Severity::Info,
                    minion: Some(*minion),
                    dismissible: true,
                    action: None,
                })
            }
            _ => None,
        }
    }
}

// ── Processing Traces ───────────────────────────────────────────

struct ProcessingTraceTranslator;

impl EventTranslator for ProcessingTraceTranslator {
    fn category(&self) -> EventCategory {
        EventCategory::RuminationTrace
    }

    fn translate(&self, event: &InternalEvent, config: &WhitelistConfig) -> Option<SurfaceEvent> {
        match event {
            InternalEvent::ProcessingLayerFired { layer, latency_ms } => {
                let headline = match layer {
                    ProcessingLayer::Keystroke | ProcessingLayer::Pause => return None,
                    ProcessingLayer::Send => "Thinking carefully about this...".to_string(),
                    ProcessingLayer::Background => {
                        "Doing some deeper analysis in the background...".to_string()
                    }
                };
                Some(SurfaceEvent {
                    id: Uuid::now_v7(),
                    timestamp_ms: 0,
                    category: SurfaceCategory::Thinking,
                    headline,
                    detail: config.show_timing.then(|| format!("{latency_ms}ms")),
                    progress: None,
                    severity: Severity::Status,
                    minion: Some(MinionId::Clyffy),
                    dismissible: true,
                    action: None,
                })
            }
            InternalEvent::ContextRetrieved {
                results_count,
                top_score,
                ..
            } => (config.level >= DetailLevel::Intermediate).then(|| SurfaceEvent {
                id: Uuid::now_v7(),
                timestamp_ms: 0,
                category: SurfaceCategory::Thinking,
                headline: format!("Found {results_count} relevant sections"),
                detail: config
                    .show_scores
                    .then(|| format!("Best match: {:.0}%", top_score * 100.0)),
                progress: None,
                severity: Severity::Info,
                minion: None,
                dismissible: true,
                action: None,
            }),
            _ => None,
        }
    }
}

// ── Prompt Assembly ─────────────────────────────────────────────

struct PromptAssemblyTranslator;

impl EventTranslator for PromptAssemblyTranslator {
    fn category(&self) -> EventCategory {
        EventCategory::CostarAssembly
    }

    fn translate(&self, event: &InternalEvent, config: &WhitelistConfig) -> Option<SurfaceEvent> {
        match event {
            InternalEvent::PromptTranslated {
                user_words,
                assembled_tokens,
            } => {
                let headline = if *user_words <= 6 {
                    format!("You said {user_words} words — Clyffy expanded that into a detailed request")
                } else {
                    "Preparing your request...".to_string()
                };
                Some(SurfaceEvent {
                    id: Uuid::now_v7(),
                    timestamp_ms: 0,
                    category: SurfaceCategory::Translating,
                    headline,
                    detail: (config.level >= DetailLevel::Intermediate).then(|| format!("{user_words} words → {assembled_tokens} tokens")),
                    progress: Some(0.8),
                    severity: Severity::Status,
                    minion: Some(MinionId::Clyffy),
                    dismissible: true,
                    action: (*user_words <= 6).then(|| SurfaceAction::OfferLearning {
                        topic: "Prompt expansion".to_string(),
                        content: "Clyffy structures your request so the AI understands exactly what you need.".to_string(),
                    }),
                })
            }
            InternalEvent::PromptGateResult { gate, reason } => match gate {
                super::events::GateColor::Red => Some(SurfaceEvent::protection_alert(
                    "Clyffy needs a bit more context",
                    if config.level >= DetailLevel::Intermediate {
                        reason.clone()
                    } else {
                        "Could you give a few more details about what you'd like?".to_string()
                    },
                )),
                super::events::GateColor::Teal => Some(SurfaceEvent {
                    id: Uuid::now_v7(),
                    timestamp_ms: 0,
                    category: SurfaceCategory::Translating,
                    headline: "Proceeding, but Clyffy has a heads-up for you...".to_string(),
                    detail: (config.level >= DetailLevel::Intermediate).then(|| reason.clone()),
                    progress: None,
                    severity: Severity::Notice,
                    minion: Some(MinionId::Enforcer),
                    dismissible: true,
                    action: None,
                }),
                super::events::GateColor::Green => None,
            },
            _ => None,
        }
    }
}

// ── Governance ──────────────────────────────────────────────────

struct GovernanceTranslator;

impl EventTranslator for GovernanceTranslator {
    fn category(&self) -> EventCategory {
        EventCategory::GovernanceDecision
    }

    fn translate(&self, event: &InternalEvent, config: &WhitelistConfig) -> Option<SurfaceEvent> {
        match event {
            InternalEvent::DriftDetected { file, drift_type } => {
                let file_ref = if config.show_file_paths {
                    file.display().to_string()
                } else {
                    "a file in your project".to_string()
                };
                let headline = match drift_type {
                    super::events::DriftType::Duplication => {
                        format!("Heads up: spotted duplicate code in {file_ref}")
                    }
                    super::events::DriftType::OutOfBoundaryWrite => {
                        format!("Blocked a write outside your project in {file_ref}")
                    }
                    super::events::DriftType::AbandonedTodo => {
                        format!("Found an abandoned TODO in {file_ref}")
                    }
                    super::events::DriftType::PatternViolation(p) => {
                        if config.show_file_paths {
                            format!("Pattern violation in {file_ref}: {p}")
                        } else {
                            "Caught a pattern that doesn't match your project style".to_string()
                        }
                    }
                    super::events::DriftType::DeleteWithoutBackup => {
                        format!("Prevented deletion without backup in {file_ref}")
                    }
                };
                Some(SurfaceEvent::protection_alert(
                    headline,
                    "Project structure protection is active",
                ))
            }
            InternalEvent::AntiPatternBlocked {
                pattern,
                suggestion,
            } => Some(SurfaceEvent {
                id: Uuid::now_v7(),
                timestamp_ms: 0,
                category: SurfaceCategory::Protecting,
                headline: if config.level >= DetailLevel::Intermediate {
                    format!("Blocked: {pattern}")
                } else {
                    "Clyffy caught a potential issue before it reached your code".to_string()
                },
                detail: Some(suggestion.clone()),
                progress: None,
                severity: Severity::Warning,
                minion: Some(MinionId::Guardian),
                dismissible: false,
                action: None,
            }),
            _ => None,
        }
    }
}

// ── Signal Routing ──────────────────────────────────────────────

struct SignalRoutingTranslator;

impl EventTranslator for SignalRoutingTranslator {
    fn category(&self) -> EventCategory {
        EventCategory::SignalRouting
    }
    fn translate(&self, _: &InternalEvent, _: &WhitelistConfig) -> Option<SurfaceEvent> {
        None
    }
}

// ── Resource Arbiter ────────────────────────────────────────────

struct ResourceArbiterTranslator;

impl EventTranslator for ResourceArbiterTranslator {
    fn category(&self) -> EventCategory {
        EventCategory::ResourceArbiter
    }

    fn translate(&self, event: &InternalEvent, config: &WhitelistConfig) -> Option<SurfaceEvent> {
        match event {
            InternalEvent::AllocationChanged {
                from,
                to,
                free_vram_gb,
            } => {
                let headline = match to {
                    AllocationMode::CpuOnly => {
                        "Running on CPU — things may be slower but still working".to_string()
                    }
                    _ if to < from => "Adjusting resources for your other apps...".to_string(),
                    _ if to > from => {
                        "More GPU available — Clyffy can think faster now".to_string()
                    }
                    _ => return None,
                };
                Some(SurfaceEvent {
                    id: Uuid::now_v7(),
                    timestamp_ms: 0,
                    category: SurfaceCategory::SystemHealth,
                    headline,
                    detail: config
                        .show_scores
                        .then(|| format!("{free_vram_gb:.1}GB GPU memory free")),
                    progress: None,
                    severity: Severity::Notice,
                    minion: Some(MinionId::Clyffy),
                    dismissible: true,
                    action: None,
                })
            }
            _ => None,
        }
    }
}

// ── Inference Metrics ───────────────────────────────────────────

struct InferenceMetricsTranslator;

impl EventTranslator for InferenceMetricsTranslator {
    fn category(&self) -> EventCategory {
        EventCategory::InferenceMetrics
    }

    fn translate(&self, event: &InternalEvent, config: &WhitelistConfig) -> Option<SurfaceEvent> {
        if config.level < DetailLevel::Intermediate {
            return None;
        }
        match event {
            InternalEvent::InferenceComplete {
                total_tokens,
                latency_ms,
                ..
            } => Some(SurfaceEvent {
                id: Uuid::now_v7(),
                timestamp_ms: 0,
                category: SurfaceCategory::Complete,
                headline: format!("Generated {total_tokens} tokens"),
                detail: config.show_timing.then(|| format!("{latency_ms}ms total")),
                progress: Some(1.0),
                severity: Severity::Info,
                minion: None,
                dismissible: true,
                action: None,
            }),
            _ => None,
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// Slot name helpers
// ─────────────────────────────────────────────────────────────────

fn slot_name(slot: &SlotId, show_model_names: bool) -> String {
    if show_model_names {
        match slot {
            SlotId::ChatBrain => "Clyffy brain (14B/7B)".to_string(),
            SlotId::MinionShared => "Minion brain (0.6B)".to_string(),
            SlotId::MinionEscalation => "Escalation model".to_string(),
            SlotId::RagEmbedder => "Embedder (0.6B CPU)".to_string(),
            SlotId::RagReranker => "Reranker (0.6B CPU)".to_string(),
            SlotId::VisionEmbedder => "SigLIP2 vision".to_string(),
            SlotId::VoiceStt => "Whisper STT".to_string(),
            SlotId::VoiceTts => "Kokoro TTS".to_string(),
            SlotId::VoiceBrain => "Voice conversation (LLM)".to_string(),
            SlotId::Custom(name) => name.clone(),
        }
    } else {
        match slot {
            SlotId::ChatBrain => "Clyffy's brain".to_string(),
            SlotId::MinionShared => "the helper system".to_string(),
            SlotId::MinionEscalation => "the backup thinker".to_string(),
            SlotId::RagEmbedder => "the search system".to_string(),
            SlotId::RagReranker => "the ranking system".to_string(),
            SlotId::VisionEmbedder => "the vision system".to_string(),
            SlotId::VoiceStt => "the listening system".to_string(),
            SlotId::VoiceTts => "Clyffy's voice".to_string(),
            SlotId::VoiceBrain => "the voice conversation system".to_string(),
            SlotId::Custom(name) => name.clone(),
        }
    }
}
