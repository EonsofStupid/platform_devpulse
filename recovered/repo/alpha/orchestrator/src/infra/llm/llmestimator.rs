// orchestrator/src/infra/llm/llmestimator.rs

//! DevPulse Tools - LLM Memory Estimator
//!
//! Provides visual, accurate memory estimation for LLM deployment.
//!
//! ## Features
//! - All GGML quantization types (Q2-Q8, K-quants, IQ family)
//! - Visual terminal output with ANSI colors
//! - Lab UI integration with hex colors
//! - Memory tier classification (Extreme → Lossless)
//! - VRAM/RAM estimation with KV cache
//!
//! ## Usage
//! ```ignore
//! let estimate = quick_estimate(4.0, DataType::Q4_K_M, 8192);
//! println!("{}", estimate); // Colorful visual output
//!
//! // For Lab UI
//! let tier = DataType::Q4_K_M.memory_tier();
//! let color = tier.ui_color(); // "#84cc16"
//! ```

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

// ═══════════════════════════════════════════════════════════════
// Memory Tier (Visual Classification)
// ═══════════════════════════════════════════════════════════════

/// Memory efficiency tier for visual display
/// Pattern: like AffectiveState in gamification.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryTier {
    /// <1.75 bits/param - Extreme compression (IQ1)
    Extreme,
    /// 1.75-2.75 bits/param - Heavy compression (IQ2, Q2)
    Aggressive,
    /// 2.75-4.5 bits/param - Balanced (Q3, Q4)
    Balanced,
    /// 4.5-6.0 bits/param - Quality-focused (Q5, Q6)
    Quality,
    /// 6.0-8.5 bits/param - Near-lossless (Q8)
    Premium,
    /// 16+ bits/param - Full precision (F16, F32, BF16)
    Lossless,
}

impl MemoryTier {
    /// ANSI color for terminal display
    pub fn ansi_color(&self) -> &'static str {
        match self {
            Self::Extreme => "\x1b[95m",    // Magenta (ultra-compressed)
            Self::Aggressive => "\x1b[32m", // Green (small)
            Self::Balanced => "\x1b[92m",   // Bright green (sweet spot)
            Self::Quality => "\x1b[33m",    // Yellow (bigger)
            Self::Premium => "\x1b[93m",    // Bright yellow
            Self::Lossless => "\x1b[91m",   // Red (full size)
        }
    }

    /// ANSI reset code
    pub fn ansi_reset() -> &'static str {
        "\x1b[0m"
    }

    /// Tailwind CSS color for Lab UI
    pub fn ui_color(&self) -> &'static str {
        match self {
            Self::Extreme => "#d946ef",    // fuchsia-500
            Self::Aggressive => "#22c55e", // green-500
            Self::Balanced => "#84cc16",   // lime-500
            Self::Quality => "#eab308",    // yellow-500
            Self::Premium => "#f97316",    // orange-500
            Self::Lossless => "#ef4444",   // red-500
        }
    }

    /// Human-readable display name
    pub fn display_name(&self) -> &'static str {
        match self {
            Self::Extreme => "Extreme",
            Self::Aggressive => "Aggressive",
            Self::Balanced => "Balanced",
            Self::Quality => "Quality",
            Self::Premium => "Premium",
            Self::Lossless => "Lossless",
        }
    }

    /// Emoji for quick visual (like AffectiveState)
    pub fn emoji(&self) -> &'static str {
        match self {
            Self::Extreme => "🔬",    // microscopic
            Self::Aggressive => "📦", // compact
            Self::Balanced => "⚖️",   // balanced
            Self::Quality => "✨",    // quality
            Self::Premium => "💎",    // premium
            Self::Lossless => "🎯",   // full precision
        }
    }

    /// VRAM recommendation badge
    pub fn vram_badge(&self) -> &'static str {
        match self {
            Self::Extreme => "4GB GPU OK",
            Self::Aggressive => "6GB GPU OK",
            Self::Balanced => "8GB GPU OK",
            Self::Quality => "12GB GPU OK",
            Self::Premium => "16GB GPU OK",
            Self::Lossless => "24GB+ GPU",
        }
    }

    /// From bits per weight
    pub fn from_bits(bits: f64) -> Self {
        match bits {
            b if b <= 1.75 => Self::Extreme,
            b if b <= 2.75 => Self::Aggressive,
            b if b <= 4.5 => Self::Balanced,
            b if b <= 6.0 => Self::Quality,
            b if b <= 8.5 => Self::Premium,
            _ => Self::Lossless,
        }
    }
}

impl std::fmt::Display for MemoryTier {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} {}", self.emoji(), self.display_name())
    }
}

// ═══════════════════════════════════════════════════════════════
// Data Types (All GGML Quantization Types)
// ═══════════════════════════════════════════════════════════════

/// Model quantization/data type
/// Covers ALL GGML types for comprehensive model support
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[allow(non_camel_case_types)]
pub enum DataType {
    // === Full Precision ===
    /// 32-bit floating point
    F32,
    /// 16-bit floating point
    F16,
    /// Llm float 16 (better range than F16)
    BF16,

    // === Legacy Q-types (original GGML) ===
    /// 4-bit quantization, no block scale
    Q4_0,
    /// 4-bit quantization, with block scale
    Q4_1,
    /// 5-bit quantization, no block scale
    Q5_0,
    /// 5-bit quantization, with block scale
    Q5_1,
    /// 8-bit quantization
    Q8_0,
    /// 8-bit quantization, with block scale
    Q8_1,

    // === K-Quant Family (newer, better quality) ===
    /// 2-bit k-quant
    Q2_K,
    /// 2-bit k-quant small variant
    Q2_K_S,
    /// 3-bit k-quant (alias for Q3_K_M)
    Q3_K,
    /// 3-bit k-quant small
    Q3_K_S,
    /// 3-bit k-quant medium
    Q3_K_M,
    /// 3-bit k-quant large
    Q3_K_L,
    /// 4-bit k-quant (alias for Q4_K_M)
    Q4_K,
    /// 4-bit k-quant small
    Q4_K_S,
    /// 4-bit k-quant medium (RECOMMENDED for most use)
    Q4_K_M,
    /// 5-bit k-quant (alias for Q5_K_M)
    Q5_K,
    /// 5-bit k-quant small
    Q5_K_S,
    /// 5-bit k-quant medium
    Q5_K_M,
    /// 6-bit k-quant
    Q6_K,

    // === IQ Family (Importance Quantization) ===
    /// 1.5 bits - extreme compression
    IQ1_S,
    /// 1.75 bits
    IQ1_M,
    /// 2.0625 bits - very aggressive
    IQ2_XXS,
    /// 2.3125 bits
    IQ2_XS,
    /// 2.5 bits
    IQ2_S,
    /// 2.7 bits
    IQ2_M,
    /// 3.0625 bits
    IQ3_XXS,
    /// 3.3 bits
    IQ3_XS,
    /// 3.4375 bits
    IQ3_S,
    /// 3.5 bits
    IQ3_M,
    /// 4.5 bits - non-linear
    IQ4_NL,
    /// 4.25 bits
    IQ4_XS,

    // === Fallback ===
    /// Unknown type - defaults to F16 for estimation
    Unknown,
}

impl DataType {
    /// Bits per weight (more intuitive than bytes)
    pub fn bits_per_weight(&self) -> f64 {
        self.bytes_per_param() * 8.0
    }

    /// Bytes per parameter (for size calculations)
    pub fn bytes_per_param(&self) -> f64 {
        match self {
            // Full precision
            Self::F32 => 4.0,
            Self::F16 | Self::BF16 => 2.0,

            // Q8 family (~8.5 bits)
            Self::Q8_0 | Self::Q8_1 => 1.0625,

            // Q6 family (~6.5 bits)
            Self::Q6_K => 0.8125,

            // Q5 family (~5.5 bits)
            Self::Q5_K | Self::Q5_K_S | Self::Q5_K_M => 0.6875,
            Self::Q5_0 | Self::Q5_1 => 0.6875,

            // Q4 family (~4.5 bits)
            Self::Q4_K | Self::Q4_K_S | Self::Q4_K_M => 0.5625,
            Self::Q4_0 | Self::Q4_1 => 0.5,
            Self::IQ4_NL | Self::IQ4_XS => 0.5625,

            // Q3 family (~3.5 bits)
            Self::Q3_K | Self::Q3_K_S | Self::Q3_K_M | Self::Q3_K_L => 0.4375,
            Self::IQ3_XXS | Self::IQ3_XS | Self::IQ3_S | Self::IQ3_M => 0.4375,

            // Q2 family (~2.5 bits)
            Self::Q2_K | Self::Q2_K_S => 0.3125,
            Self::IQ2_XXS | Self::IQ2_XS | Self::IQ2_S | Self::IQ2_M => 0.3125,

            // IQ1 family (~1.5 bits)
            Self::IQ1_S | Self::IQ1_M => 0.1875,

            Self::Unknown => 2.0, // Assume F16
        }
    }

    /// Get memory tier for this dtype
    pub fn memory_tier(&self) -> MemoryTier {
        MemoryTier::from_bits(self.bits_per_weight())
    }

    /// Quality loss description (for tooltips)
    pub fn quality_note(&self) -> &'static str {
        match self.memory_tier() {
            MemoryTier::Extreme => "Significant quality loss, testing only",
            MemoryTier::Aggressive => "Noticeable quality loss, lightweight use",
            MemoryTier::Balanced => "Minimal quality loss, recommended for most",
            MemoryTier::Quality => "Near-original quality",
            MemoryTier::Premium => "Imperceptible quality loss",
            MemoryTier::Lossless => "Original precision",
        }
    }

    /// Parse from string (case-insensitive, handles filenames)
    pub fn from_str(s: &str) -> Self {
        let s_upper = s.to_uppercase();

        // Check specific variants first (longer matches)
        // IQ family
        if s_upper.contains("IQ1_S") {
            return Self::IQ1_S;
        }
        if s_upper.contains("IQ1_M") {
            return Self::IQ1_M;
        }
        if s_upper.contains("IQ2_XXS") {
            return Self::IQ2_XXS;
        }
        if s_upper.contains("IQ2_XS") {
            return Self::IQ2_XS;
        }
        if s_upper.contains("IQ2_S") {
            return Self::IQ2_S;
        }
        if s_upper.contains("IQ2_M") {
            return Self::IQ2_M;
        }
        if s_upper.contains("IQ3_XXS") {
            return Self::IQ3_XXS;
        }
        if s_upper.contains("IQ3_XS") {
            return Self::IQ3_XS;
        }
        if s_upper.contains("IQ3_S") {
            return Self::IQ3_S;
        }
        if s_upper.contains("IQ3_M") {
            return Self::IQ3_M;
        }
        if s_upper.contains("IQ4_NL") {
            return Self::IQ4_NL;
        }
        if s_upper.contains("IQ4_XS") {
            return Self::IQ4_XS;
        }

        // K-quant family (check longer variants first)
        if s_upper.contains("Q2_K_S") {
            return Self::Q2_K_S;
        }
        if s_upper.contains("Q2_K") {
            return Self::Q2_K;
        }
        if s_upper.contains("Q3_K_S") {
            return Self::Q3_K_S;
        }
        if s_upper.contains("Q3_K_M") {
            return Self::Q3_K_M;
        }
        if s_upper.contains("Q3_K_L") {
            return Self::Q3_K_L;
        }
        if s_upper.contains("Q3_K") {
            return Self::Q3_K;
        }
        if s_upper.contains("Q4_K_S") {
            return Self::Q4_K_S;
        }
        if s_upper.contains("Q4_K_M") {
            return Self::Q4_K_M;
        }
        if s_upper.contains("Q4_K") {
            return Self::Q4_K;
        }
        if s_upper.contains("Q5_K_S") {
            return Self::Q5_K_S;
        }
        if s_upper.contains("Q5_K_M") {
            return Self::Q5_K_M;
        }
        if s_upper.contains("Q5_K") {
            return Self::Q5_K;
        }
        if s_upper.contains("Q6_K") {
            return Self::Q6_K;
        }

        // Legacy Q-types
        if s_upper.contains("Q8_1") {
            return Self::Q8_1;
        }
        if s_upper.contains("Q8_0") || s_upper.contains("Q8") {
            return Self::Q8_0;
        }
        if s_upper.contains("Q5_1") {
            return Self::Q5_1;
        }
        if s_upper.contains("Q5_0") {
            return Self::Q5_0;
        }
        if s_upper.contains("Q4_1") {
            return Self::Q4_1;
        }
        if s_upper.contains("Q4_0") || s_upper.contains("Q4") {
            return Self::Q4_0;
        }

        // Full precision
        if s_upper.contains("F32") || s_upper.contains("FLOAT32") {
            return Self::F32;
        }
        if s_upper.contains("BF16") || s_upper.contains("BFLOAT16") {
            return Self::BF16;
        }
        if s_upper.contains("F16") || s_upper.contains("FLOAT16") {
            return Self::F16;
        }

        // Unknown
        tracing::warn!(input = %s, "Unknown quantization type, defaulting to F16 estimate");
        Self::Unknown
    }

    /// Short display name
    pub fn short_name(&self) -> &'static str {
        match self {
            Self::F32 => "F32",
            Self::F16 => "F16",
            Self::BF16 => "BF16",
            Self::Q4_0 => "Q4_0",
            Self::Q4_1 => "Q4_1",
            Self::Q5_0 => "Q5_0",
            Self::Q5_1 => "Q5_1",
            Self::Q8_0 => "Q8_0",
            Self::Q8_1 => "Q8_1",
            Self::Q2_K => "Q2_K",
            Self::Q2_K_S => "Q2_K_S",
            Self::Q3_K => "Q3_K",
            Self::Q3_K_S => "Q3_K_S",
            Self::Q3_K_M => "Q3_K_M",
            Self::Q3_K_L => "Q3_K_L",
            Self::Q4_K => "Q4_K",
            Self::Q4_K_S => "Q4_K_S",
            Self::Q4_K_M => "Q4_K_M",
            Self::Q5_K => "Q5_K",
            Self::Q5_K_S => "Q5_K_S",
            Self::Q5_K_M => "Q5_K_M",
            Self::Q6_K => "Q6_K",
            Self::IQ1_S => "IQ1_S",
            Self::IQ1_M => "IQ1_M",
            Self::IQ2_XXS => "IQ2_XXS",
            Self::IQ2_XS => "IQ2_XS",
            Self::IQ2_S => "IQ2_S",
            Self::IQ2_M => "IQ2_M",
            Self::IQ3_XXS => "IQ3_XXS",
            Self::IQ3_XS => "IQ3_XS",
            Self::IQ3_S => "IQ3_S",
            Self::IQ3_M => "IQ3_M",
            Self::IQ4_NL => "IQ4_NL",
            Self::IQ4_XS => "IQ4_XS",
            Self::Unknown => "Unknown",
        }
    }
}

impl std::fmt::Display for DataType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.short_name())
    }
}

// ═══════════════════════════════════════════════════════════════
// Memory Estimate Result
// ═══════════════════════════════════════════════════════════════

/// Detailed memory estimate for a model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEstimate {
    /// Model identifier (HF repo or local path)
    pub model_id: String,
    /// Total parameters (actual count)
    pub total_params: u64,
    /// Parameters in billions (human-readable)
    pub params_billions: f64,
    /// Detected data type
    pub dtype: DataType,
    /// Model weights size in bytes
    pub weights_bytes: u64,
    /// KV cache size for given context/batch
    pub kv_cache_bytes: u64,
    /// Activation memory estimate
    pub activation_bytes: u64,
    /// Total VRAM needed (GPU inference)
    pub vram_gb: f64,
    /// Total RAM needed (CPU inference)
    pub ram_gb: f64,
    /// Minimum VRAM for partial offload
    pub min_vram_gb: f64,
    /// Architecture details
    pub architecture: ArchitectureInfo,
    /// Estimation config used
    pub config: EstimationConfig,
}

impl std::fmt::Display for MemoryEstimate {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let tier = self.dtype.memory_tier();
        let c = tier.ansi_color();
        let r = MemoryTier::ansi_reset();

        writeln!(f, "╔══════════════════════════════════════════════════════════════════╗")?;
        writeln!(f, "║ {}{} {:8}{}  {:<42} ║", c, tier.emoji(), tier.display_name(), r, truncate_str(&self.model_id, 42))?;
        writeln!(f, "╠══════════════════════════════════════════════════════════════════╣")?;
        writeln!(f, "║  Parameters:     {:>10} ({:.2}B)                            ║",
            format_billions(self.total_params), self.params_billions)?;
        writeln!(f, "║  Quantization:   {}{:>10}{} ({:.1} bits/weight)                 ║",
            c, self.dtype, r, self.dtype.bits_per_weight())?;
        writeln!(f, "╠══════════════════════════════════════════════════════════════════╣")?;
        writeln!(f, "║  {}Weights:        {:>10}{}                                     ║",
            c, format_gb(self.weights_bytes), r)?;
        writeln!(f, "║  KV Cache:       {:>10} (ctx={}, batch={})               ║",
            format_gb(self.kv_cache_bytes), self.config.context_length, self.config.batch_size)?;
        writeln!(f, "║  Activations:    {:>10}                                     ║",
            format_gb(self.activation_bytes))?;
        writeln!(f, "╠══════════════════════════════════════════════════════════════════╣")?;
        writeln!(f, "║  {}VRAM Required:  {:>10}{}   ← {}                 ║",
            c, format!("{:.2} GB", self.vram_gb), r, tier.vram_badge())?;
        writeln!(f, "║  RAM Required:   {:>10}   (CPU fallback)                   ║",
            format!("{:.2} GB", self.ram_gb))?;
        writeln!(f, "╚══════════════════════════════════════════════════════════════════╝")?;
        writeln!(f, "  {} {}", tier.emoji(), self.dtype.quality_note())?;
        Ok(())
    }
}

fn truncate_str(s: &str, max: usize) -> String {
    if s.len() <= max {
        s.to_string()
    } else {
        format!("{}...", &s[..max.saturating_sub(3)])
    }
}

fn format_billions(n: u64) -> String {
    if n >= 1_000_000_000 {
        format!("{:.2}B", n as f64 / 1_000_000_000.0)
    } else if n >= 1_000_000 {
        format!("{:.2}M", n as f64 / 1_000_000.0)
    } else if n >= 1_000 {
        format!("{:.2}K", n as f64 / 1_000.0)
    } else {
        format!("{}", n)
    }
}

fn format_gb(bytes: u64) -> String {
    format!("{:.2} GB", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
}

// ═══════════════════════════════════════════════════════════════
// Architecture Info
// ═══════════════════════════════════════════════════════════════

/// Model architecture details (from config.json)
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ArchitectureInfo {
    pub model_type: String,
    pub hidden_size: usize,
    pub num_layers: usize,
    pub num_attention_heads: usize,
    pub num_key_value_heads: usize,
    pub intermediate_size: usize,
    pub vocab_size: usize,
    pub head_dim: usize,
    pub max_position_embeddings: usize,
}

impl ArchitectureInfo {
    /// Parse from HF config.json
    pub fn from_config(config: &HfConfig) -> Self {
        let head_dim = config.head_dim.unwrap_or_else(|| {
            config.hidden_size / config.num_attention_heads
        });

        Self {
            model_type: config.model_type.clone().unwrap_or_default(),
            hidden_size: config.hidden_size,
            num_layers: config.num_hidden_layers,
            num_attention_heads: config.num_attention_heads,
            num_key_value_heads: config.num_key_value_heads.unwrap_or(config.num_attention_heads),
            intermediate_size: config.intermediate_size,
            vocab_size: config.vocab_size,
            head_dim,
            max_position_embeddings: config.max_position_embeddings.unwrap_or(4096),
        }
    }

    /// Estimate total parameters
    pub fn estimate_params(&self) -> u64 {
        let embed_params = self.vocab_size * self.hidden_size;
        let lm_head_params = 0; // Assume tied weights

        // Per layer params
        let qkv_params = self.hidden_size * (self.hidden_size + 2 * self.num_key_value_heads * self.head_dim);
        let out_proj_params = self.hidden_size * self.hidden_size;
        let mlp_params = self.hidden_size * self.intermediate_size * 3; // gate, up, down
        let norm_params = self.hidden_size * 2;

        let per_layer = qkv_params + out_proj_params + mlp_params + norm_params;
        let total_layers = per_layer * self.num_layers;

        let final_norm = self.hidden_size;

        (embed_params + total_layers + final_norm + lm_head_params) as u64
    }
}

// ═══════════════════════════════════════════════════════════════
// Estimation Config
// ═══════════════════════════════════════════════════════════════

/// Configuration for memory estimation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EstimationConfig {
    /// Context length for KV cache calculation
    pub context_length: usize,
    /// Batch size
    pub batch_size: usize,
    /// Whether to include activation memory
    pub include_activations: bool,
    /// Overhead multiplier (for fragmentation, etc.)
    pub overhead_multiplier: f64,
}

impl Default for EstimationConfig {
    fn default() -> Self {
        Self {
            context_length: 4096,
            batch_size: 1,
            include_activations: true,
            overhead_multiplier: 1.1,
        }
    }
}

impl EstimationConfig {
    pub fn with_context(mut self, ctx: usize) -> Self {
        self.context_length = ctx;
        self
    }

    pub fn with_batch_size(mut self, bs: usize) -> Self {
        self.batch_size = bs;
        self
    }
}

// ═══════════════════════════════════════════════════════════════
// HF Config JSON
// ═══════════════════════════════════════════════════════════════

/// Hugging Face config.json structure
#[derive(Debug, Clone, Deserialize)]
pub struct HfConfig {
    pub model_type: Option<String>,
    pub hidden_size: usize,
    pub num_hidden_layers: usize,
    pub num_attention_heads: usize,
    pub num_key_value_heads: Option<usize>,
    pub intermediate_size: usize,
    pub vocab_size: usize,
    pub head_dim: Option<usize>,
    pub max_position_embeddings: Option<usize>,
    pub torch_dtype: Option<String>,
}

// ═══════════════════════════════════════════════════════════════
// HF Model Estimator
// ═══════════════════════════════════════════════════════════════

/// Main estimator struct
pub struct HfModelEstimator {
    client: reqwest::Client,
}

impl HfModelEstimator {
    /// Create new estimator
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .user_agent("devpulse-hf-estimator/0.1")
                .build()
                .expect("Failed to create HTTP client"),
        }
    }

    /// Estimate memory from HF Hub model
    pub async fn estimate_from_hub(&self, model_id: &str) -> Result<MemoryEstimate> {
        self.estimate_from_hub_with_config(model_id, EstimationConfig::default()).await
    }

    /// Estimate with custom config
    pub async fn estimate_from_hub_with_config(
        &self,
        model_id: &str,
        config: EstimationConfig,
    ) -> Result<MemoryEstimate> {
        let hf_config = self.fetch_config(model_id).await?;
        let arch = ArchitectureInfo::from_config(&hf_config);

        let dtype = hf_config.torch_dtype
            .as_ref()
            .map(|s| DataType::from_str(s))
            .unwrap_or(DataType::F16);

        self.calculate_estimate(model_id, &arch, dtype, config)
    }

    /// Estimate from local config.json file
    pub fn estimate_from_config_file(
        &self,
        path: &Path,
        dtype: DataType,
        config: EstimationConfig,
    ) -> Result<MemoryEstimate> {
        let content = std::fs::read_to_string(path)?;
        let hf_config: HfConfig = serde_json::from_str(&content)?;
        let arch = ArchitectureInfo::from_config(&hf_config);
        let model_id = path.parent()
            .and_then(|p| p.file_name())
            .and_then(|n| n.to_str())
            .unwrap_or("local");

        self.calculate_estimate(model_id, &arch, dtype, config)
    }

    /// Estimate from GGUF file (reads metadata)
    pub fn estimate_from_gguf(&self, path: &Path, config: EstimationConfig) -> Result<MemoryEstimate> {
        let file = std::fs::File::open(path)?;
        let file_size = file.metadata()?.len();

        let filename = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("model.gguf");

        let dtype = DataType::from_str(filename);
        let estimated_params = (file_size as f64 / dtype.bytes_per_param()) as u64;

        let model_id = path.to_string_lossy().to_string();

        let arch = ArchitectureInfo {
            model_type: "gguf".to_string(),
            hidden_size: 4096,
            num_layers: estimate_layers_from_params(estimated_params),
            num_attention_heads: 32,
            num_key_value_heads: 8,
            intermediate_size: 14336,
            vocab_size: 152064,
            head_dim: 128,
            max_position_embeddings: config.context_length,
        };

        self.calculate_estimate(&model_id, &arch, dtype, config)
    }

    /// Core calculation
    fn calculate_estimate(
        &self,
        model_id: &str,
        arch: &ArchitectureInfo,
        dtype: DataType,
        config: EstimationConfig,
    ) -> Result<MemoryEstimate> {
        let total_params = arch.estimate_params();
        let params_billions = total_params as f64 / 1_000_000_000.0;

        let weights_bytes = (total_params as f64 * dtype.bytes_per_param()) as u64;
        let kv_cache_bytes = self.calculate_kv_cache(arch, &config, dtype);

        let activation_bytes = if config.include_activations {
            self.calculate_activation_memory(arch, &config)
        } else {
            0
        };

        let total_bytes = weights_bytes + kv_cache_bytes + activation_bytes;
        let total_with_overhead = (total_bytes as f64 * config.overhead_multiplier) as u64;

        let vram_gb = total_with_overhead as f64 / (1024.0 * 1024.0 * 1024.0);
        let ram_gb = vram_gb * 1.3;

        let min_vram_bytes = weights_bytes + (kv_cache_bytes / 4);
        let min_vram_gb = min_vram_bytes as f64 / (1024.0 * 1024.0 * 1024.0);

        Ok(MemoryEstimate {
            model_id: model_id.to_string(),
            total_params,
            params_billions,
            dtype,
            weights_bytes,
            kv_cache_bytes,
            activation_bytes,
            vram_gb,
            ram_gb,
            min_vram_gb,
            architecture: arch.clone(),
            config,
        })
    }

    fn calculate_kv_cache(&self, arch: &ArchitectureInfo, config: &EstimationConfig, dtype: DataType) -> u64 {
        let bytes_per_element = match dtype {
            DataType::F32 => 4.0,
            _ => 2.0,
        };

        let kv_size = 2.0
            * arch.num_layers as f64
            * config.batch_size as f64
            * config.context_length as f64
            * arch.num_key_value_heads as f64
            * arch.head_dim as f64
            * bytes_per_element;

        kv_size as u64
    }

    fn calculate_activation_memory(&self, arch: &ArchitectureInfo, config: &EstimationConfig) -> u64 {
        let batch_seq = config.batch_size * config.context_length;
        let attn_bytes = batch_seq * arch.num_attention_heads * config.context_length * 2;
        let mlp_bytes = batch_seq * arch.intermediate_size * 2;

        (attn_bytes + mlp_bytes) as u64
    }

    async fn fetch_config(&self, model_id: &str) -> Result<HfConfig> {
        let url = format!(
            "https://huggingface.co/{}/resolve/main/config.json",
            model_id
        );

        let response = self.client.get(&url)
            .send()
            .await
            .map_err(|e| anyhow!("Failed to fetch config: {}", e))?;

        if !response.status().is_success() {
            return Err(anyhow!(
                "Failed to fetch config.json for {}: HTTP {}",
                model_id,
                response.status()
            ));
        }

        let config: HfConfig = response.json()
            .await
            .map_err(|e| anyhow!("Failed to parse config.json: {}", e))?;

        Ok(config)
    }
}

impl Default for HfModelEstimator {
    fn default() -> Self {
        Self::new()
    }
}

/// Estimate layer count from param count
fn estimate_layers_from_params(params: u64) -> usize {
    match params {
        p if p < 1_000_000_000 => 12,
        p if p < 3_000_000_000 => 24,
        p if p < 8_000_000_000 => 32,
        p if p < 15_000_000_000 => 40,
        p if p < 35_000_000_000 => 60,
        p if p < 75_000_000_000 => 80,
        _ => 96,
    }
}

// ═══════════════════════════════════════════════════════════════
// Quick Estimate Functions
// ═══════════════════════════════════════════════════════════════

/// Quick estimate from just parameter count and dtype
pub fn quick_estimate(params_billions: f64, dtype: DataType, context_length: usize) -> MemoryEstimate {
    let total_params = (params_billions * 1_000_000_000.0) as u64;
    let weights_bytes = (total_params as f64 * dtype.bytes_per_param()) as u64;

    let num_layers = estimate_layers_from_params(total_params);
    let kv_cache_bytes = (2 * num_layers * context_length * 4096 * 2) as u64;

    let activation_bytes = (context_length * 4096 * 4) as u64;

    let total_bytes = weights_bytes + kv_cache_bytes + activation_bytes;
    let vram_gb = total_bytes as f64 / (1024.0 * 1024.0 * 1024.0) * 1.1;

    MemoryEstimate {
        model_id: format!("{}B-{}", params_billions, dtype),
        total_params,
        params_billions,
        dtype,
        weights_bytes,
        kv_cache_bytes,
        activation_bytes,
        vram_gb,
        ram_gb: vram_gb * 1.3,
        min_vram_gb: weights_bytes as f64 / (1024.0 * 1024.0 * 1024.0),
        architecture: ArchitectureInfo::default(),
        config: EstimationConfig::default().with_context(context_length),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_all_dtypes_have_valid_bpp() {
        // Ensure ordering makes sense: smaller quant = smaller bytes
        assert!(DataType::IQ1_S.bytes_per_param() < DataType::IQ2_XXS.bytes_per_param());
        assert!(DataType::IQ2_XXS.bytes_per_param() <= DataType::Q3_K_S.bytes_per_param());
        assert!(DataType::Q3_K_S.bytes_per_param() < DataType::Q4_K_M.bytes_per_param());
        assert!(DataType::Q4_K_M.bytes_per_param() < DataType::Q5_K_M.bytes_per_param());
        assert!(DataType::Q5_K_M.bytes_per_param() < DataType::Q6_K.bytes_per_param());
        assert!(DataType::Q6_K.bytes_per_param() < DataType::Q8_0.bytes_per_param());
        assert!(DataType::Q8_0.bytes_per_param() < DataType::F16.bytes_per_param());
        assert!(DataType::F16.bytes_per_param() < DataType::F32.bytes_per_param());
    }

    #[test]
    fn test_memory_tiers() {
        assert_eq!(DataType::IQ1_S.memory_tier(), MemoryTier::Extreme);
        assert_eq!(DataType::IQ2_XS.memory_tier(), MemoryTier::Aggressive);
        assert_eq!(DataType::Q4_K_M.memory_tier(), MemoryTier::Balanced);
        assert_eq!(DataType::Q5_K_M.memory_tier(), MemoryTier::Quality);
        assert_eq!(DataType::Q8_0.memory_tier(), MemoryTier::Premium);
        assert_eq!(DataType::F16.memory_tier(), MemoryTier::Lossless);
    }

    #[test]
    fn test_from_str_all_k_quants() {
        assert_eq!(DataType::from_str("Q4_K_M"), DataType::Q4_K_M);
        assert_eq!(DataType::from_str("q4_k_s"), DataType::Q4_K_S);
        assert_eq!(DataType::from_str("Q5_K_M"), DataType::Q5_K_M);
        assert_eq!(DataType::from_str("Q3_K_L"), DataType::Q3_K_L);
        assert_eq!(DataType::from_str("Q6_K"), DataType::Q6_K);
    }

    #[test]
    fn test_from_str_all_iq() {
        assert_eq!(DataType::from_str("IQ2_XXS"), DataType::IQ2_XXS);
        assert_eq!(DataType::from_str("iq3_xs"), DataType::IQ3_XS);
        assert_eq!(DataType::from_str("IQ4_NL"), DataType::IQ4_NL);
        assert_eq!(DataType::from_str("IQ1_S"), DataType::IQ1_S);
    }

    #[test]
    fn test_from_filename_patterns() {
        assert_eq!(DataType::from_str("Qwen3-VL-4B-Instruct-Q4_K_M.gguf"), DataType::Q4_K_M);
        assert_eq!(DataType::from_str("model-iq3_xxs.gguf"), DataType::IQ3_XXS);
        assert_eq!(DataType::from_str("llama-7b-q5_k_s.gguf"), DataType::Q5_K_S);
    }

    #[test]
    fn test_ui_colors_are_valid_hex() {
        for tier in [MemoryTier::Extreme, MemoryTier::Aggressive, MemoryTier::Balanced,
                     MemoryTier::Quality, MemoryTier::Premium, MemoryTier::Lossless] {
            let color = tier.ui_color();
            assert!(color.starts_with('#'), "Color should start with #: {}", color);
            assert_eq!(color.len(), 7, "Color should be #RRGGBB: {}", color);
        }
    }

    #[test]
    fn test_memory_tier_badges() {
        assert!(MemoryTier::Extreme.vram_badge().contains("4GB"));
        assert!(MemoryTier::Balanced.vram_badge().contains("8GB"));
        assert!(MemoryTier::Lossless.vram_badge().contains("24GB"));
    }

    #[test]
    fn test_quick_estimate() {
        let est = quick_estimate(7.0, DataType::F16, 4096);
        assert!(est.vram_gb > 12.0 && est.vram_gb < 20.0);

        let est_q4 = quick_estimate(7.0, DataType::Q4_K_M, 4096);
        assert!(est_q4.vram_gb < est.vram_gb);
    }

    #[test]
    fn test_dtype_display() {
        assert_eq!(format!("{}", DataType::Q4_K_M), "Q4_K_M");
        assert_eq!(format!("{}", DataType::IQ3_XXS), "IQ3_XXS");
        assert_eq!(format!("{}", DataType::F16), "F16");
    }

    #[test]
    fn test_tier_display() {
        let tier = MemoryTier::Balanced;
        let display = format!("{}", tier);
        assert!(display.contains("Balanced"));
    }

    #[tokio::test]
    async fn test_fetch_config() {
        // Network test - skip in CI
        let _estimator = HfModelEstimator::new();
        // let est = estimator.estimate_from_hub("Qwen/Qwen2.5-0.5B").await.unwrap();
        // println!("{}", est);
    }
}
