//! Default DevPulse slot configuration — the 8 slots from the spec.

use devpulse_clyffy::model_loader::{DevicePreference, LoadingStrategy, ModelCapability, Slot};

/// Generate the default DevPulse slot configuration.
///
/// These are the 8 slots from MODEL_LOADER_SPEC §2.3.
/// Other apps using the model-loader crate would register different slots.
#[must_use]
pub fn devpulse_default_slots() -> Vec<Slot> {
    vec![
        // ── Chat ───────────────────────────────────────────
        Slot {
            id: "chat.brain".into(),
            label: "AI Brain".into(),
            capability: ModelCapability::TextGeneration,
            preferred_device: DevicePreference::Gpu,
            loading: LoadingStrategy::Hot,
            assigned_model: None,
            fallback: None,
        },
        // ── Minions ────────────────────────────────────────
        Slot {
            id: "minion.shared".into(),
            label: "Minion Engine".into(),
            capability: ModelCapability::TextGeneration,
            preferred_device: DevicePreference::GpuWithCpuFallback,
            loading: LoadingStrategy::Hot,
            assigned_model: None,
            fallback: None,
        },
        Slot {
            id: "minion.escalation".into(),
            label: "Deep Reasoning".into(),
            capability: ModelCapability::TextGeneration,
            preferred_device: DevicePreference::Gpu,
            loading: LoadingStrategy::Warm,
            assigned_model: None,
            fallback: Some("chat.brain".into()),
        },
        // ── RAG Pipeline ───────────────────────────────────
        Slot {
            id: "rag.embedder".into(),
            label: "Search Engine".into(),
            capability: ModelCapability::Embedding,
            preferred_device: DevicePreference::Cpu,
            loading: LoadingStrategy::OnDemand,
            assigned_model: None,
            fallback: None,
        },
        Slot {
            id: "rag.reranker".into(),
            label: "Relevance Scorer".into(),
            capability: ModelCapability::Reranking,
            preferred_device: DevicePreference::Cpu,
            loading: LoadingStrategy::OnDemand,
            assigned_model: None,
            fallback: None,
        },
        // ── Vision ─────────────────────────────────────────
        Slot {
            id: "vision.embedder".into(),
            label: "Vision System".into(),
            capability: ModelCapability::VisionEmbedding,
            preferred_device: DevicePreference::GpuWithCpuFallback,
            loading: LoadingStrategy::Signal("screenshot.captured".into()),
            assigned_model: None,
            fallback: None,
        },
        // ── Voice ──────────────────────────────────────────
        Slot {
            id: "voice.stt".into(),
            label: "Voice Input".into(),
            capability: ModelCapability::SpeechToText,
            preferred_device: DevicePreference::GpuWithCpuFallback,
            loading: LoadingStrategy::Signal("voice.activated".into()),
            assigned_model: None,
            fallback: None,
        },
        Slot {
            id: "voice.tts".into(),
            label: "Voice Output".into(),
            capability: ModelCapability::TextToSpeech,
            preferred_device: DevicePreference::GpuWithCpuFallback,
            loading: LoadingStrategy::Signal("speech.requested".into()),
            assigned_model: None,
            fallback: None,
        },
    ]
}
