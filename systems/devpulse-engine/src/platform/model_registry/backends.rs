//! # Backend matrix
//!
//! Enumerates every inference backend, with its local install state.
//! Post-severance the engine is the model **management** layer and
//! compiles **no** inference backend, so `installed` is uniformly
//! `false` locally; live availability is **computed** from the
//! connected Clyffy capability over the wire, never a compile flag.
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
#[derive(specta::Type)]
#[serde(rename_all = "kebab-case")]
pub enum BackendId {
    /// Candle `quantized_llama` — generic GGUF path with arch metadata
    /// rewriting. Fallback for archs without a dedicated quantized
    /// loader.
    CandleQuantizedLlama,
    /// Candle `quantized_qwen3` — arch-native Qwen3 GGUF loader.
    CandleQuantizedQwen3,
    /// Candle `quantized_phi3` — arch-native Phi-3 GGUF loader.
    CandleQuantizedPhi3,
    /// Candle `qwen3::ModelForCausalLM` — safetensors FP32.
    CandleSafetensorsQwen3,
    /// Candle `qwen3_moe::ModelForCausalLM` — safetensors FP32 `MoE`.
    CandleSafetensorsQwen3Moe,
    /// Candle `qwen3_vl` — vision-language safetensors. Planned.
    CandleSafetensorsQwen3Vl,
    /// Candle `phi3::Model` — safetensors FP32.
    CandleSafetensorsPhi3,
    /// Candle `qwen2::ModelForCausalLM` — legacy fallback safetensors.
    CandleSafetensorsQwen2,
    /// Candle `SigLIP` / `SigLIP2` vision encoder — safetensors.
    CandleSiglipVision,
    /// Candle Gemma 3 text encoder — sentence-transformer embedder.
    /// Loads safetensors with the LM head stripped and pools the last
    /// hidden state. Used by Microsoft Harrier 270m.
    CandleSafetensorsGemma3Embedding,
    /// ORT kokoro TTS.
    OrtKokoroTts,
    /// ORT whisper STT.
    OrtWhisperStt,
    /// ORT embedder (BGE, nomic, etc.).
    OrtEmbedder,
    /// ORT reranker (cross-encoder).
    OrtReranker,
    /// mistral.rs Phi-4 multimodal — text + vision + audio loaded via the
    /// `mistralrs` umbrella crate (Candle-based). The April 2026 release
    /// (v0.8.x) is the only Rust path with native phi4mm support; the
    /// official Microsoft ONNX export needs `onnxruntime-genai` which has
    /// no Rust bindings as of this writing.
    MistralRsPhi4Mm,
    /// Sherpa-onnx streaming ASR — used by the always-on STS pipeline.
    SherpaOnnxStt,
    /// Sherpa-onnx keyword spotter — wake word detection for STS.
    SherpaOnnxKws,
    /// llama.cpp FFI — GGUF inference via the llama-cpp-2 crate. Carries
    /// archs Candle's arch-native loaders don't cover (Phi-4 vision /
    /// phi4-siglip with mmproj projection, future fine-tune families).
    LlamaCppFfi,
}

/// Metadata for a single backend row. Field-level `pub` so specta can
/// walk the struct.
#[derive(Debug, Clone, Serialize)]
#[derive(specta::Type)]
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
#[derive(specta::Type)]
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
#[derive(specta::Type)]
#[serde(rename_all = "kebab-case")]
pub enum ModelFormat {
    /// Quantized GGUF model weights.
    Gguf,
    /// Safetensors model shards and metadata.
    Safetensors,
    /// ONNX model assets.
    Onnx,
    /// Raw `PyTorch` checkpoints.
    Pytorch,
    /// Sherpa model directory (Whisper / Kokoro — a directory carrying
    /// `tokens.txt` + config, discovered as a unit rather than a single
    /// weight file). Folded in from the relocated model-loader management
    /// layer (kernel-severance); the loader's discovery scanner emits this
    /// for `tokens.txt`-bearing directories.
    SherpaDir,
}

impl std::fmt::Display for ModelFormat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Gguf => write!(f, "GGUF"),
            Self::Safetensors => write!(f, "SafeTensors"),
            Self::Onnx => write!(f, "ONNX"),
            Self::Pytorch => write!(f, "PyTorch"),
            Self::SherpaDir => write!(f, "Sherpa Directory"),
        }
    }
}

/// Full `(arch × backend)` compatibility grid, ready for the frontend.
#[derive(Debug, Clone, Serialize)]
#[derive(specta::Type)]
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
    FormatSupport {
        arch: ArchId::Llama,
        format: ModelFormat::Gguf,
        status: SupportStatus::Stable,
    },
    FormatSupport {
        arch: ArchId::Mistral,
        format: ModelFormat::Gguf,
        status: SupportStatus::Stable,
    },
    FormatSupport {
        arch: ArchId::Qwen2,
        format: ModelFormat::Gguf,
        status: SupportStatus::Stable,
    },
    FormatSupport {
        arch: ArchId::Qwen25,
        format: ModelFormat::Gguf,
        status: SupportStatus::Stable,
    },
    FormatSupport {
        arch: ArchId::Gemma,
        format: ModelFormat::Gguf,
        status: SupportStatus::Stable,
    },
];

const CANDLE_QUANTIZED_QWEN3_SUPPORT: &[FormatSupport] = &[
    FormatSupport {
        arch: ArchId::Qwen3,
        format: ModelFormat::Gguf,
        status: SupportStatus::Stable,
    },
    FormatSupport {
        arch: ArchId::Qwen3Moe,
        format: ModelFormat::Gguf,
        status: SupportStatus::Stable,
    },
];

const CANDLE_QUANTIZED_PHI3_SUPPORT: &[FormatSupport] = &[
    FormatSupport {
        arch: ArchId::Phi3,
        format: ModelFormat::Gguf,
        status: SupportStatus::Stable,
    },
    FormatSupport {
        arch: ArchId::Phi3Moe,
        format: ModelFormat::Gguf,
        status: SupportStatus::Stable,
    },
];

const CANDLE_SAFETENSORS_QWEN3_SUPPORT: &[FormatSupport] = &[
    FormatSupport {
        arch: ArchId::Qwen3,
        format: ModelFormat::Safetensors,
        status: SupportStatus::Stable,
    },
    FormatSupport {
        arch: ArchId::Qwen35,
        format: ModelFormat::Safetensors,
        status: SupportStatus::Planned,
    },
];

const CANDLE_SAFETENSORS_QWEN3_MOE_SUPPORT: &[FormatSupport] = &[FormatSupport {
    arch: ArchId::Qwen3Moe,
    format: ModelFormat::Safetensors,
    status: SupportStatus::Stable,
}];

const CANDLE_SAFETENSORS_QWEN3_VL_SUPPORT: &[FormatSupport] = &[FormatSupport {
    arch: ArchId::Qwen3Vl,
    format: ModelFormat::Safetensors,
    status: SupportStatus::Experimental,
}];

const CANDLE_SAFETENSORS_PHI3_SUPPORT: &[FormatSupport] = &[
    FormatSupport {
        arch: ArchId::Phi3,
        format: ModelFormat::Safetensors,
        status: SupportStatus::Stable,
    },
    FormatSupport {
        arch: ArchId::Phi3Moe,
        format: ModelFormat::Safetensors,
        status: SupportStatus::Stable,
    },
];

const CANDLE_SAFETENSORS_QWEN2_SUPPORT: &[FormatSupport] = &[
    FormatSupport {
        arch: ArchId::Qwen2,
        format: ModelFormat::Safetensors,
        status: SupportStatus::Stable,
    },
    FormatSupport {
        arch: ArchId::Qwen25,
        format: ModelFormat::Safetensors,
        status: SupportStatus::Stable,
    },
];

const CANDLE_SIGLIP_SUPPORT: &[FormatSupport] = &[];
const CANDLE_SAFETENSORS_GEMMA3_EMBEDDING_SUPPORT: &[FormatSupport] = &[FormatSupport {
    arch: ArchId::Gemma3Text,
    format: ModelFormat::Safetensors,
    status: SupportStatus::Stable,
}];
const ORT_KOKORO_SUPPORT: &[FormatSupport] = &[];
const ORT_WHISPER_SUPPORT: &[FormatSupport] = &[];
const ORT_EMBEDDER_SUPPORT: &[FormatSupport] = &[];
const ORT_RERANKER_SUPPORT: &[FormatSupport] = &[];
const MISTRALRS_PHI4MM_SUPPORT: &[FormatSupport] = &[FormatSupport {
    arch: ArchId::Phi4Mm,
    format: ModelFormat::Safetensors,
    status: SupportStatus::Stable,
}];
const SHERPA_STT_SUPPORT: &[FormatSupport] = &[];
const SHERPA_KWS_SUPPORT: &[FormatSupport] = &[];
const LLAMA_CPP_FFI_SUPPORT: &[FormatSupport] = &[FormatSupport {
    arch: ArchId::Phi4Vision,
    format: ModelFormat::Gguf,
    status: SupportStatus::Stable,
}];

/// Candle backend rows — one entry per registered Candle loader.
fn candle_backends(installed: bool) -> Vec<BackendInfo> {
    vec![
        BackendInfo {
            id: BackendId::CandleQuantizedLlama,
            display: "Candle · quantized_llama (generic GGUF)",
            feature_flag: "candle-backend",
            installed,
            supports: CANDLE_LLAMA_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleQuantizedQwen3,
            display: "Candle · quantized_qwen3 (arch-native GGUF)",
            feature_flag: "candle-backend",
            installed,
            supports: CANDLE_QUANTIZED_QWEN3_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleQuantizedPhi3,
            display: "Candle · quantized_phi3 (arch-native GGUF)",
            feature_flag: "candle-backend",
            installed,
            supports: CANDLE_QUANTIZED_PHI3_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSafetensorsQwen3,
            display: "Candle · Qwen3 safetensors",
            feature_flag: "candle-backend",
            installed,
            supports: CANDLE_SAFETENSORS_QWEN3_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSafetensorsQwen3Moe,
            display: "Candle · Qwen3 MoE safetensors",
            feature_flag: "candle-backend",
            installed,
            supports: CANDLE_SAFETENSORS_QWEN3_MOE_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSafetensorsQwen3Vl,
            display: "Candle · Qwen3 VL safetensors (experimental)",
            feature_flag: "candle-backend",
            installed,
            supports: CANDLE_SAFETENSORS_QWEN3_VL_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSafetensorsPhi3,
            display: "Candle · Phi-3 safetensors",
            feature_flag: "candle-backend",
            installed,
            supports: CANDLE_SAFETENSORS_PHI3_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSafetensorsQwen2,
            display: "Candle · Qwen2 safetensors (legacy)",
            feature_flag: "candle-backend",
            installed,
            supports: CANDLE_SAFETENSORS_QWEN2_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSiglipVision,
            display: "Candle · SigLIP vision encoder",
            feature_flag: "candle-backend",
            installed,
            supports: CANDLE_SIGLIP_SUPPORT,
        },
        BackendInfo {
            id: BackendId::CandleSafetensorsGemma3Embedding,
            display: "Candle · Gemma 3 text encoder (embedder)",
            feature_flag: "candle-backend",
            installed,
            supports: CANDLE_SAFETENSORS_GEMMA3_EMBEDDING_SUPPORT,
        },
    ]
}

/// ORT backend rows — TTS / STT / embedder / reranker.
fn ort_backends(installed: bool) -> Vec<BackendInfo> {
    vec![
        BackendInfo {
            id: BackendId::OrtKokoroTts,
            display: "ORT · Kokoro TTS",
            feature_flag: "ort-backend",
            installed,
            supports: ORT_KOKORO_SUPPORT,
        },
        BackendInfo {
            id: BackendId::OrtWhisperStt,
            display: "ORT · Whisper STT",
            feature_flag: "ort-backend",
            installed,
            supports: ORT_WHISPER_SUPPORT,
        },
        BackendInfo {
            id: BackendId::OrtEmbedder,
            display: "ORT · Embedder",
            feature_flag: "ort-backend",
            installed,
            supports: ORT_EMBEDDER_SUPPORT,
        },
        BackendInfo {
            id: BackendId::OrtReranker,
            display: "ORT · Reranker",
            feature_flag: "ort-backend",
            installed,
            supports: ORT_RERANKER_SUPPORT,
        },
    ]
}

/// Auxiliary backend rows — mistral.rs, Sherpa-onnx, llama.cpp FFI.
fn aux_backends(
    mistralrs_installed: bool,
    sherpa_installed: bool,
    ffi_installed: bool,
) -> Vec<BackendInfo> {
    vec![
        BackendInfo {
            id: BackendId::MistralRsPhi4Mm,
            display: "mistral.rs · Phi-4 multimodal (text + vision + audio)",
            feature_flag: "mistralrs-backend",
            installed: mistralrs_installed,
            supports: MISTRALRS_PHI4MM_SUPPORT,
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
            display: "llama.cpp · FFI GGUF",
            feature_flag: "llama-cpp-ffi",
            installed: ffi_installed,
            supports: LLAMA_CPP_FFI_SUPPORT,
        },
    ]
}

/// Return the backend matrix — the full catalog of inference backends
/// with their local install state.
///
/// Post-severance no inference backend is compiled into the engine
/// (inference is Clyffy's, served over the wire), so every backend is
/// catalogued with `installed = false`. The frontend overlays live
/// availability from the connected Clyffy capability (`capability.slots`),
/// keeping availability capability-computed, never hardcoded.
#[must_use]
pub fn installed_backends() -> BackendMatrix {
    // Engine = management layer: no inference backend is compiled in
    // (inference is Clyffy's, over the wire), so every backend is
    // catalogued as not-locally-installed. The frontend overlays live
    // availability from the connected Clyffy capability.
    let mut backends = candle_backends(false);
    backends.extend(ort_backends(false));
    backends.extend(aux_backends(false, false, false));

    BackendMatrix {
        backends,
        architectures: ARCHITECTURES.iter().collect(),
    }
}
