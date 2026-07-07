//! KV-cache and context controls for slot configuration.
//!
//! Strongly-typed knobs that backend adapters (llama.cpp FFI, mistral.rs,
//! moshi) read at slot load time and apply to their context construction.
//! Each backend honours the fields it can support and ignores the rest
//! with a `tracing::debug!` log so misconfigurations are visible without
//! crashing the load.
//!
//! # Surface design (April 2026 research-driven)
//!
//! Five **must-have** knobs that every user benefits from:
//!
//! - [`KvCacheConfig::context_length`] — explicit context window, with
//!   model-trained-ctx as the default upper bound when unset
//! - [`KvCacheConfig::kv_cache_quant`] — single-dial quantisation
//!   (research consensus: `Q8_0` is the modal sweet spot)
//! - [`KvCacheConfig::cpu_offload`] — spill blocks to host DRAM when
//!   GPU is full (~10× latency, but unblocks long-context jobs)
//! - [`KvCacheConfig::prompt_cache_persist`] — save/restore KV-cache
//!   across sessions (llama.cpp `state_save_file`/`state_load_file`)
//! - [`KvCacheConfig::rope_scaling_mode`] — context-extension technique
//!   (`YaRN` is the production-ready 2026 choice)
//!
//! Five **power-user** knobs (default off, behind explicit opt-in):
//!
//! - [`KvCacheConfig::paged_block_size`] — `PagedAttention` block size
//! - [`KvCacheConfig::attention_sink_tokens`] — `StreamingLLM` sink (`n_keep`)
//! - [`KvCacheConfig::kv_cache_quant_k`] / [`KvCacheConfig::kv_cache_quant_v`]
//!   — asymmetric overrides for K vs V cache (K is more sensitive)
//! - [`KvCacheConfig::yarn`] — explicit `YaRN` parameters when auto-derive
//!   isn't enough
//! - [`KvCacheConfig::speculative_draft_model`] — speculative-decoding
//!   draft model. Research note: NEGATIVE on consumer GPUs with MoE-A3B
//!   models — only enable on dense ≥30B targets where benchmarks confirm
//!   gain. See <https://github.com/thc1006/qwen3.6-speculative-decoding-rtx3090>.
//!
//! Knobs **deliberately not exposed** for the vibecoder audience (research
//! showed complexity outweighs benefit): `num_gpu_blocks`/`num_cpu_blocks`
//! (auto-sized from VRAM probe), `prefix_cache_hash_algo` (sha256 default),
//! `radix_eviction_policy` (LRU is correct ~always), `swa_window_override`
//! (model-architecture coupled), `nvme_tier_offload` (enterprise-only).

use serde::{Deserialize, Serialize};

/// Slot-level KV-cache and context controls. Every field is optional —
/// the backend adapter applies whatever the runtime supports and falls
/// back to runtime defaults for the rest. `Default::default()` produces
/// the "use all runtime defaults" case so existing presets that don't
/// declare a `[presets.slots.kv_cache]` block keep working unchanged.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[derive(specta::Type)]
pub struct KvCacheConfig {
    /// Effective context window length in tokens. `None` defers to the
    /// model's trained max as reported by the loader.
    ///
    /// Backend mapping:
    /// - llama.cpp: `LlamaContextParams::with_n_ctx(NonZeroU32)`
    /// - mistral.rs: `with_paged_attn(MemoryGpuConfig::ContextSize(n))`
    ///   when `PagedAttention` is on; otherwise tracked internally
    /// - moshi: ignored (Moshi has fixed context length)
    pub context_length: Option<u32>,

    /// KV-cache element type. Single dial — sets both K and V to the
    /// same precision unless [`Self::kv_cache_quant_k`] /
    /// [`Self::kv_cache_quant_v`] override individually. Research
    /// consensus: `F16` is full quality, `Q8_0` is the modal sweet
    /// spot (~2.5% slowdown vs F16, half memory), `Q4_0` for tight
    /// rigs at meaningful quality cost.
    pub kv_cache_quant: Option<KvCacheQuant>,

    /// Spill KV-cache blocks to host DRAM when GPU memory is full. Off
    /// by default. Costs ~10× latency on the offloaded blocks but
    /// unblocks long-context jobs that would otherwise OOM the GPU.
    #[serde(default)]
    pub cpu_offload: bool,

    /// Save the KV-cache to disk at session end and restore it on the
    /// next start, preserving conversation context across launches.
    /// Disk usage scales with `context_length × per_token_cache_bytes`.
    /// llama.cpp implements via `state_save_file`/`state_load_file`;
    /// other runtimes log a "not supported" debug message and skip.
    #[serde(default)]
    pub prompt_cache_persist: bool,

    /// `RoPE` position-embedding scaling for context-window extension
    /// beyond the model's trained max. `YaRN` is the production-ready
    /// 2026 default.
    #[serde(default)]
    pub rope_scaling_mode: RopeScalingMode,

    // ── Power-user knobs (default off, opt-in only) ──────────────
    /// `PagedAttention` block size. Only honoured by runtimes that
    /// support paged attention (mistral.rs on CUDA-Linux/WSL or Metal,
    /// vLLM). `None` = runtime default (32 for mistral.rs, 16 for
    /// vLLM).
    pub paged_block_size: Option<u32>,

    /// `StreamingLLM` attention-sink size (`n_keep`) — keep the first N
    /// tokens always in cache for infinite-context streaming. `0`
    /// disables. Default `0` keeps the standard sliding-window
    /// behaviour.
    #[serde(default)]
    pub attention_sink_tokens: u32,

    /// Asymmetric override for K-cache quantisation. If `None`, uses
    /// [`Self::kv_cache_quant`]. Empirically K is more sensitive to
    /// quantisation than V — only override if you know why.
    pub kv_cache_quant_k: Option<KvCacheQuant>,

    /// Asymmetric override for V-cache quantisation. If `None`, uses
    /// [`Self::kv_cache_quant`].
    pub kv_cache_quant_v: Option<KvCacheQuant>,

    /// Explicit `YaRN` parameters. When `None` and
    /// [`Self::rope_scaling_mode`] is [`RopeScalingMode::Yarn`], the
    /// loader auto-derives the factor from `context_length` vs the
    /// model's trained context. Provide explicit values to reproduce
    /// known-good configurations.
    pub yarn: Option<YarnConfig>,

    /// Speculative-decoding draft model in the form
    /// `repo_id/filename.gguf`. The draft model proposes tokens that
    /// the target model verifies in batch — yields throughput when
    /// the draft is fast and accurate. `None` = disabled.
    ///
    /// **Research caution**: NEGATIVE on consumer GPUs with MoE-A3B
    /// models as of April 2026 — only enable on dense ≥30B targets
    /// where benchmarks on your hardware confirm gain.
    pub speculative_draft_model: Option<String>,
}

/// KV-cache element type — directly maps to the runtime's cache
/// quantisation settings. Lower precision halves memory at modest
/// quality cost (mostly imperceptible at `Q8_0`, perceptible at
/// `Q4_0` for long contexts).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[derive(specta::Type)]
#[serde(rename_all = "lowercase")]
#[allow(non_camel_case_types)]
pub enum KvCacheQuant {
    /// 32-bit float — full precision, double memory of F16. Rarely
    /// useful in production; exposed for debugging numerical issues.
    F32,
    /// 16-bit float — runtime default for most backends.
    F16,
    /// bfloat16 — same memory as F16, different range characteristics.
    Bf16,
    /// `Q8_0` quantised cache — half `F16` memory, ~2.5% slowdown vs `F16`.
    /// The modal sweet spot for production use.
    Q8_0,
    /// `Q4_0` quantised cache — quarter `F16` memory, perceptible quality
    /// drop on long contexts. Use only when memory is the binding
    /// constraint.
    Q4_0,
    /// `IQ4_NL` non-linear 4-bit cache — better quality than `Q4_0` at
    /// the same memory footprint, slightly slower.
    Iq4_Nl,
}

/// `RoPE` position-embedding scaling mode for context-window extension.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[derive(specta::Type)]
#[serde(rename_all = "lowercase")]
pub enum RopeScalingMode {
    /// No scaling — use the model's native trained context length.
    /// Default; users hitting context overflow should opt into a
    /// scaling mode explicitly.
    #[default]
    None,
    /// `YaRN` scaling. Auto-derives the factor from the requested
    /// `context_length` vs the model's trained max if explicit
    /// [`YarnConfig`] is not provided. Production-ready 2026 default
    /// for new context-extension deployments.
    Yarn,
    /// Linear position interpolation. Deprecated for production but
    /// kept for reproducing legacy configs that pre-date `YaRN`.
    LinearPi,
}

/// Explicit `YaRN` parameters. Defaults match `llama.cpp` upstream
/// (which match the original `YaRN` paper).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[derive(specta::Type)]
pub struct YarnConfig {
    /// Linear extrapolation factor. Default `1.0`.
    #[serde(default = "yarn_default_one")]
    pub ext_factor: f32,
    /// Attention scaling factor. Default `1.0`.
    #[serde(default = "yarn_default_one")]
    pub attn_factor: f32,
    /// "Fast" beta. Default `32.0`.
    #[serde(default = "yarn_default_beta_fast")]
    pub beta_fast: f32,
    /// "Slow" beta. Default `1.0`.
    #[serde(default = "yarn_default_one")]
    pub beta_slow: f32,
}

impl Default for YarnConfig {
    fn default() -> Self {
        Self {
            ext_factor: 1.0,
            attn_factor: 1.0,
            beta_fast: 32.0,
            beta_slow: 1.0,
        }
    }
}

fn yarn_default_one() -> f32 {
    1.0
}

fn yarn_default_beta_fast() -> f32 {
    32.0
}

impl KvCacheConfig {
    /// Resolve the K-cache quantisation: explicit
    /// [`Self::kv_cache_quant_k`] wins, else falls back to
    /// [`Self::kv_cache_quant`], else `None` for runtime default.
    #[must_use]
    pub fn effective_quant_k(&self) -> Option<KvCacheQuant> {
        self.kv_cache_quant_k.or(self.kv_cache_quant)
    }

    /// Resolve the V-cache quantisation: explicit
    /// [`Self::kv_cache_quant_v`] wins, else falls back to
    /// [`Self::kv_cache_quant`], else `None` for runtime default.
    #[must_use]
    pub fn effective_quant_v(&self) -> Option<KvCacheQuant> {
        self.kv_cache_quant_v.or(self.kv_cache_quant)
    }

    /// True when any non-default field is set. Useful for log lines
    /// that should only fire when a slot actually customises its
    /// cache config (most slots run on defaults).
    #[must_use]
    pub fn has_overrides(&self) -> bool {
        *self != Self::default()
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)] // tests panic on parse failure by design
mod tests {
    use super::*;

    #[test]
    fn default_is_all_unset() {
        let cfg = KvCacheConfig::default();
        assert!(cfg.context_length.is_none());
        assert!(cfg.kv_cache_quant.is_none());
        assert!(!cfg.cpu_offload);
        assert!(!cfg.prompt_cache_persist);
        assert_eq!(cfg.rope_scaling_mode, RopeScalingMode::None);
        assert_eq!(cfg.attention_sink_tokens, 0);
        assert!(!cfg.has_overrides());
    }

    #[test]
    fn effective_quant_falls_back_through_layers() {
        let cfg = KvCacheConfig {
            kv_cache_quant: Some(KvCacheQuant::Q8_0),
            kv_cache_quant_k: None,
            kv_cache_quant_v: Some(KvCacheQuant::F16),
            ..Default::default()
        };
        assert_eq!(cfg.effective_quant_k(), Some(KvCacheQuant::Q8_0));
        assert_eq!(cfg.effective_quant_v(), Some(KvCacheQuant::F16));
    }

    #[test]
    fn deserialise_must_have_set_from_toml() {
        let toml = r#"
            context_length = 32768
            kv_cache_quant = "q8_0"
            cpu_offload = true
            prompt_cache_persist = true
            rope_scaling_mode = "yarn"
        "#;
        let cfg: KvCacheConfig = toml::from_str(toml).unwrap();
        assert_eq!(cfg.context_length, Some(32768));
        assert_eq!(cfg.kv_cache_quant, Some(KvCacheQuant::Q8_0));
        assert!(cfg.cpu_offload);
        assert!(cfg.prompt_cache_persist);
        assert_eq!(cfg.rope_scaling_mode, RopeScalingMode::Yarn);
        assert!(cfg.has_overrides());
    }

    #[test]
    fn deserialise_power_user_yarn_block() {
        let toml = r#"
            rope_scaling_mode = "yarn"
            attention_sink_tokens = 4
            paged_block_size = 32
            kv_cache_quant_k = "q8_0"
            kv_cache_quant_v = "f16"

            [yarn]
            ext_factor = 0.7
            attn_factor = 0.85
            beta_fast = 16.0
            beta_slow = 0.5
        "#;
        let cfg: KvCacheConfig = toml::from_str(toml).unwrap();
        let yarn = cfg.yarn.unwrap();
        assert!((yarn.ext_factor - 0.7).abs() < 1e-6);
        assert!((yarn.attn_factor - 0.85).abs() < 1e-6);
        assert!((yarn.beta_fast - 16.0).abs() < 1e-6);
        assert!((yarn.beta_slow - 0.5).abs() < 1e-6);
        assert_eq!(cfg.attention_sink_tokens, 4);
        assert_eq!(cfg.paged_block_size, Some(32));
    }

    #[test]
    fn yarn_defaults_match_llama_cpp_upstream() {
        let yarn = YarnConfig::default();
        assert!((yarn.ext_factor - 1.0).abs() < 1e-6);
        assert!((yarn.attn_factor - 1.0).abs() < 1e-6);
        assert!((yarn.beta_fast - 32.0).abs() < 1e-6);
        assert!((yarn.beta_slow - 1.0).abs() < 1e-6);
    }

    #[test]
    fn empty_toml_round_trips_to_default() {
        let cfg: KvCacheConfig = toml::from_str("").unwrap();
        assert_eq!(cfg, KvCacheConfig::default());
    }
}
