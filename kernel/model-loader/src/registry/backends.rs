//! # Backend matrix
//!
//! Enumerates every inference backend this build can actually
//! instantiate. The set is computed from Cargo features at compile
//! time via `cfg!(feature = "...")` so the resolver can reject
//! requests for backends whose feature flag is off without touching
//! runtime state.
//!
//! `BackendMatrix` is the serialised cross-product of
//! `architectures::ALL` × `installed_backends()`. The Tauri command
//! `list_backend_matrix` returns this to the frontend on boot so the
//! compatibility card can render immediately without additional IPC.

use super::architectures::{ArchId, ArchitectureSpec, SupportStatus, ALL as ARCHITECTURES};
use serde::{Deserialize, Serialize};

/// Stable identifier for an inference backend. Each variant maps to
/// one concrete Candle / ORT / llama.cpp loader path.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum BackendId {
    /// Candle quantized_llama — generic GGUF path with arch metadata
    /// rewriting. Fallback for archs without a dedicated quantized
    /// loader.
    CandleQuantizedLlama,
    /// Candle quantized_qwen3 — arch-native Qwen3 GGUF loader.
    CandleQuantizedQwen3,
    /// Candle quantized_phi3 — arch-native Phi-3 GGUF loader.
    CandleQuantizedPhi3,
    /// Candle qwen3::ModelForCausalLM — safetensors FP32.
    CandleSafetensorsQwen3,
    /// Candle qwen3_moe::ModelForCausalLM — safetensors FP32 MoE.
    CandleSafetensorsQwen3Moe,
    /// Candle qwen3_vl — vision-language safetensors. Planned.
    CandleSafetensorsQwen3Vl,
    /// Candle phi3::Model — safetensors FP32.
    CandleSafetensorsPhi3,
    /// Candle qwen2::ModelForCausalLM — legacy fallback safetensors.
    CandleSafetensorsQwen2,
    /// Candle SigLIP / SigLIP2 vision encoder — safetensors.
    CandleSiglipVision,
    /// ORT kokoro TTS.
    OrtKokoroTts,
    /// ORT whisper STT.
    OrtWhisperStt,
    /// ORT embedder (BGE, nomic, etc.).
    OrtEmbedder,
    /// ORT reranker (cross-encoder).
    OrtReranker,
    /// Sherpa-onnx streaming ASR — used by the always-on STS pipeline.
    SherpaOnnxStt,
    /// Sherpa-onnx keyword spotter — wake word detection for STS.
    SherpaOnnxKws,
    /// llama.cpp FFI — planned. Secondary GGUF path with broader
    /// arch coverage for fine-tunes candle-transformers hasn't ported.
    LlamaCppFfi,
}

/// Metadata for a single backend row. Field-level `pub` so specta can
/// walk the struct.
#[derive(Debug, Clone, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct BackendInfo {
    /// Canonical backend identifier used by the resolver and UI.
    pub id: BackendId,
    /// Short display name for the devtools matrix view.
    pub display: &'static str,
    /// Cargo feature that must be enabled for this backend. Empty
    /// string when the backend is part of the default build.
    pub feature_flag: &'static str,
    /// Whether the feature flag is currently compiled in.
    pub installed: bool,
    /// Which architectures this backend can load, and in which
    /// format. Flattened for the frontend.
    pub supports: &'static [FormatSupport],
}

/// A single `(arch, format)` support declaration. The resolver
/// iterates backends looking for an entry that matches its query.
///
/// Serialize-only — part of the static catalog, flows outbound
/// from `list_backend_matrix` → frontend, never accepted as input.
#[derive(Debug, Clone, Copy, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct FormatSupport {
    /// Architecture covered by this backend support row.
    pub arch: ArchId,
    /// File format covered by this support row.
    pub format: ModelFormat,
    /// Maturity of this `(arch, format)` path.
    pub status: SupportStatus,
}

/// High-level file format. Matches the frontend's storage convention.
///
/// Both `Serialize` and `Deserialize` are derived because this enum
/// crosses the Tauri command boundary in both directions — it's
/// returned from `list_backend_matrix` and accepted as an input
/// argument by `resolve_architecture_compatibility`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "kebab-case")]
pub enum ModelFormat {
    /// Quantized GGUF model weights.
    Gguf,
    /// Safetensors model shards and metadata.
    Safetensors,
    /// ONNX model assets.
    Onnx,
    /// Raw PyTorch checkpoints.
    Pytorch,
}

/// Full `(arch × backend)` compatibility grid, ready for the frontend.
#[derive(Debug, Clone, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct BackendMatrix {
    /// Every backend declaration, with `installed` reflecting this
    /// build's Cargo features.
    pub backends: Vec<BackendInfo>,
    /// Every architecture the registry knows about.
    pub architectures: Vec<&'static ArchitectureSpec>,
}

// ── Static catalog ─────────────────────────────────────────────

/// Candle GGUF fallback — covers llama-family architectures.
const CANDLE_LLAMA_SUPPORT: &[FormatSupport] = &[
    FormatSupport { arch: ArchId::Llama,   format: ModelFormat::Gguf, status: SupportStatus::Stable },
    FormatSupport { arch: ArchId::Mistral, format: ModelFormat::Gguf, status: SupportStatus::Stable },
    FormatSupport { arch: ArchId::Qwen2,   format: ModelFormat::Gguf, status: SupportStatus::Stable },
    FormatSupport { arch: ArchId::Qwen25,  format: ModelFormat::Gguf, status: SupportStatus::Stable },
    FormatSupport { arch: ArchId::Gemma,   format: ModelFormat::Gguf, status: SupportStatus::Stable },
];

const CANDLE_QUANTIZED_QWEN3_SUPPORT: &[FormatSupport] = &[
    FormatSupport { arch: ArchId::Qwen3,    format: ModelFormat::Gguf, status: SupportStatus::Stable },
    FormatSupport { arch: ArchId::Qwen3Moe, format: ModelFormat::Gguf, status: SupportStatus::Stable },
];

const CANDLE_QUANTIZED_PHI3_SUPPORT: &[FormatSupport] = &[
    FormatSupport { arch: ArchId::Phi3,    format: ModelFormat::Gguf, status: SupportStatus::Stable },
    FormatSupport { arch: ArchId::Phi3Moe, format: ModelFormat::Gguf, status: SupportStatus::Stable },
];

const CANDLE_SAFETENSORS_QWEN3_SUPPORT: &[FormatSupport] = &[
    FormatSupport { arch: ArchId::Qwen3,  format: ModelFormat::Safetensors, status: SupportStatus::Stable },
    FormatSupport { arch: ArchId::Qwen35, format: ModelFormat::Safetensors, status: SupportStatus::Planned },
];

const CANDLE_SAFETENSORS_QWEN3_MOE_SUPPORT: &[FormatSupport] = &[
    FormatSupport { arch: ArchId::Qwen3Moe, format: ModelFormat::Safetensors, status: SupportStatus::Stable },
];

const CANDLE_SAFETENSORS_QWEN3_VL_SUPPORT: &[FormatSupport] = &[
    FormatSupport { arch: ArchId::Qwen3Vl, format: ModelFormat::Safetensors, status: SupportStatus::Experimental },
];

const CANDLE_SAFETENSORS_PHI3_SUPPORT: &[FormatSupport] = &[
    FormatSupport { arch: ArchId::Phi3,    format: ModelFormat::Safetensors, status: SupportStatus::Stable },
    FormatSupport { arch: ArchId::Phi3Moe, format: ModelFormat::Safetensors, status: SupportStatus::Stable },
];

const CANDLE_SAFETENSORS_QWEN2_SUPPORT: &[FormatSupport] = &[
    FormatSupport { arch: ArchId::Qwen2,  format: ModelFormat::Safetensors, status: SupportStatus::Stable },
    FormatSupport { arch: ArchId::Qwen25, format: ModelFormat::Safetensors, status: SupportStatus::Stable },
];

const CANDLE_SIGLIP_SUPPORT: &[FormatSupport] = &[];
const ORT_KOKORO_SUPPORT: &[FormatSupport] = &[];
const ORT_WHISPER_SUPPORT: &[FormatSupport] = &[];
const ORT_EMBEDDER_SUPPORT: &[FormatSupport] = &[];
const ORT_RERANKER_SUPPORT: &[FormatSupport] = &[];
const SHERPA_STT_SUPPORT: &[FormatSupport] = &[];
const SHERPA_KWS_SUPPORT: &[FormatSupport] = &[];
const LLAMA_CPP_FFI_SUPPORT: &[FormatSupport] = &[];

/// Return the installed backend matrix for this build. Installation
/// state is derived from Cargo features evaluated at compile time.
#[must_use]
pub fn installed_backends() -> BackendMatrix {
    let candle_installed = cfg!(feature = "candle-backend");
    let ort_installed = cfg!(feature = "ort-backend");
    // Sherpa + FFI backends have their own feature flags. They're
    // disabled by default in this build but declared in the matrix
    // so the frontend surfaces them as "available after enabling".
    let sherpa_installed = cfg!(feature = "sherpa-backend");
    let ffi_installed = cfg!(feature = "llama-cpp-ffi");

    let backends = vec![
        BackendInfo {
            id: BackendId::CandleQuantizedLlama,
            display: "Candle · quantized_llama (generic GGUF)",
            feature_flag: "candle-backend",
            installed: candle_installed,
            supports: CANDLE_LLAMA_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleQuantizedQwen3,
            display: "Candle · quantized_qwen3 (arch-native GGUF)",
            feature_flag: "candle-backend",
            installed: candle_installed,
            supports: CANDLE_QUANTIZED_QWEN3_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleQuantizedPhi3,
            display: "Candle · quantized_phi3 (arch-native GGUF)",
            feature_flag: "candle-backend",
            installed: candle_installed,
            supports: CANDLE_QUANTIZED_PHI3_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSafetensorsQwen3,
            display: "Candle · Qwen3 safetensors",
            feature_flag: "candle-backend",
            installed: candle_installed,
            supports: CANDLE_SAFETENSORS_QWEN3_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSafetensorsQwen3Moe,
            display: "Candle · Qwen3 MoE safetensors",
            feature_flag: "candle-backend",
            installed: candle_installed,
            supports: CANDLE_SAFETENSORS_QWEN3_MOE_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSafetensorsQwen3Vl,
            display: "Candle · Qwen3 VL safetensors (experimental)",
            feature_flag: "candle-backend",
            installed: candle_installed,
            supports: CANDLE_SAFETENSORS_QWEN3_VL_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSafetensorsPhi3,
            display: "Candle · Phi-3 safetensors",
            feature_flag: "candle-backend",
            installed: candle_installed,
            supports: CANDLE_SAFETENSORS_PHI3_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSafetensorsQwen2,
            display: "Candle · Qwen2 safetensors (legacy)",
            feature_flag: "candle-backend",
            installed: candle_installed,
            supports: CANDLE_SAFETENSORS_QWEN2_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSiglipVision,
            display: "Candle · SigLIP vision encoder",
            feature_flag: "candle-backend",
            installed: candle_installed,
            supports: CANDLE_SIGLIP_SUPPORT,
        },
        BackendInfo {
            id: BackendId::OrtKokoroTts,
            display: "ORT · Kokoro TTS",
            feature_flag: "ort-backend",
            installed: ort_installed,
            supports: ORT_KOKORO_SUPPORT,
        },
        BackendInfo {
            id: BackendId::OrtWhisperStt,
            display: "ORT · Whisper STT",
            feature_flag: "ort-backend",
            installed: ort_installed,
            supports: ORT_WHISPER_SUPPORT,
        },
        BackendInfo {
            id: BackendId::OrtEmbedder,
            display: "ORT · Embedder",
            feature_flag: "ort-backend",
            installed: ort_installed,
            supports: ORT_EMBEDDER_SUPPORT,
        },
        BackendInfo {
            id: BackendId::OrtReranker,
            display: "ORT · Reranker",
            feature_flag: "ort-backend",
            installed: ort_installed,
            supports: ORT_RERANKER_SUPPORT,
        },
        BackendInfo {
            id: BackendId::SherpaOnnxStt,
            display: "Sherpa-onnx · streaming ASR",
            feature_flag: "sherpa-backend",
            installed: sherpa_installed,
            supports: SHERPA_STT_SUPPORT,
        },
        BackendInfo {
            id: BackendId::SherpaOnnxKws,
            display: "Sherpa-onnx · wake-word keyword spotter",
            feature_flag: "sherpa-backend",
            installed: sherpa_installed,
            supports: SHERPA_KWS_SUPPORT,
        },
        BackendInfo {
            id: BackendId::LlamaCppFfi,
            display: "llama.cpp · FFI GGUF (planned)",
            feature_flag: "llama-cpp-ffi",
            installed: ffi_installed,
            supports: LLAMA_CPP_FFI_SUPPORT,
        },
    ];

    BackendMatrix {
        backends,
        architectures: ARCHITECTURES.iter().collect(),
    }
}
