//! Default DevPulse slot configuration.

use devpulse_clyffy::model_loader::{
    BackendType, DevicePreference, LoadingStrategy, ModelCapability, ModelSourceTier, Slot,
};
use std::collections::HashMap;

/// Generate the default DevPulse slot configuration.
///
/// 8 slots: chat (1), minions (2), RAG (2), vision (1), voice (2).
/// 3 bundled (voice TTS, voice STT, vision) + 5 user-managed.
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
            runtime: None,
            default_model: None,
            requires: Vec::new(),
            overrides: None,
            source_tier: ModelSourceTier::UserManaged,
            extensions: HashMap::new(),
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
            runtime: None,
            default_model: None,
            requires: Vec::new(),
            overrides: None,
            source_tier: ModelSourceTier::UserManaged,
            extensions: HashMap::new(),
        },
        Slot {
            id: "minion.escalation".into(),
            label: "Deep Reasoning".into(),
            capability: ModelCapability::TextGeneration,
            preferred_device: DevicePreference::Gpu,
            loading: LoadingStrategy::Warm,
            assigned_model: None,
            fallback: Some("chat.brain".into()),
            runtime: None,
            default_model: None,
            requires: Vec::new(),
            overrides: None,
            source_tier: ModelSourceTier::UserManaged,
            extensions: HashMap::new(),
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
            runtime: None,
            default_model: None,
            requires: Vec::new(),
            overrides: None,
            source_tier: ModelSourceTier::UserManaged,
            extensions: HashMap::new(),
        },
        Slot {
            id: "rag.reranker".into(),
            label: "Relevance Scorer".into(),
            capability: ModelCapability::Reranking,
            preferred_device: DevicePreference::Cpu,
            loading: LoadingStrategy::OnDemand,
            assigned_model: None,
            fallback: None,
            runtime: None,
            default_model: None,
            requires: Vec::new(),
            overrides: None,
            source_tier: ModelSourceTier::UserManaged,
            extensions: HashMap::new(),
        },
        // ── Vision (BUNDLED) ──────────────────────────────
        Slot {
            id: "vision.embedder".into(),
            label: "Vision System".into(),
            capability: ModelCapability::VisionEmbedding,
            preferred_device: DevicePreference::Cpu,
            loading: LoadingStrategy::Signal("screenshot.captured".into()),
            assigned_model: None,
            fallback: None,
            runtime: Some(BackendType::Ort),
            default_model: Some("vision_model_int8.onnx".into()),
            requires: Vec::new(),
            overrides: None,
            source_tier: ModelSourceTier::Bundled {
                bundled_path: "vision/siglip2-base/vision_model_int8.onnx".into(),
            },
            extensions: HashMap::new(),
        },
        // ── Voice TTS (BUNDLED) ───────────────────────────
        Slot {
            id: "voice.tts".into(),
            label: "Clyffy's Voice".into(),
            capability: ModelCapability::TextToSpeech,
            preferred_device: DevicePreference::Cpu,
            loading: LoadingStrategy::Signal("speech.requested".into()),
            assigned_model: None,
            fallback: None,
            runtime: Some(BackendType::Ort),
            default_model: Some("model_quantized.onnx".into()),
            requires: Vec::new(),
            overrides: None,
            source_tier: ModelSourceTier::Bundled {
                bundled_path: "voice/kokoro/model_quantized.onnx".into(),
            },
            extensions: HashMap::from([("voice_profile".into(), "af_heart".into())]),
        },
        // ── Voice STT (BUNDLED) ───────────────────────────
        Slot {
            id: "voice.stt".into(),
            label: "Voice Input".into(),
            capability: ModelCapability::SpeechToText,
            preferred_device: DevicePreference::Cpu,
            loading: LoadingStrategy::Signal("voice.activated".into()),
            assigned_model: None,
            fallback: None,
            runtime: Some(BackendType::Ort),
            default_model: Some("small-encoder.int8.onnx".into()),
            requires: Vec::new(),
            overrides: None,
            source_tier: ModelSourceTier::Bundled {
                bundled_path: "voice/whisper-small/".into(),
            },
            extensions: HashMap::new(),
        },
    ]
}
