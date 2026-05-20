//! Candle runtime user-scope config — applied at slot-load time.
//!
//! Persists to `{data_dir}/user/candle.toml`. The pool reads this at
//! slot-load time so tweaks take effect on the next load. Live
//! hot-apply to a loaded slot is a follow-up.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::io::Write as _;
use std::path::{Path, PathBuf};

const FILE_NAME: &str = "candle.toml";
/// Default context window tokens — conservative 4k so 4-8GB VRAM cards
/// don't OOM on first load. Can be bumped to 8192/16384 for bigger cards.
pub const DEFAULT_CONTEXT_SIZE: u32 = 4096;
/// Default GPU offload layers. 0 = CPU-only. `u32::MAX` = all layers.
pub const DEFAULT_GPU_LAYERS: u32 = u32::MAX;
/// Default dtype: `"auto"` lets the backend pick (usually Q4/Q5 GGUF → f16).
pub const DEFAULT_DTYPE: &str = "auto";

// Pre-existing configs (voice_tts, voice_stt, etc.) follow the same
// load/save/clamp shape; this module mirrors that surface without
// factoring a trait — the duplication is intentional so each service
// can evolve its clamp semantics independently.

/// Persisted Candle runtime preferences.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CandleConfig {
    /// Context window in tokens. Clamped to `[512, 131_072]`.
    pub context_size: u32,
    /// GPU layers to offload. `0` = CPU, `u32::MAX` = all. No upper clamp.
    pub gpu_layers: u32,
    /// Dtype hint: `"auto" | "f32" | "f16" | "bf16" | "q4" | "q5" | "q8"`.
    pub dtype: String,
}

impl Default for CandleConfig {
    fn default() -> Self {
        Self {
            context_size: DEFAULT_CONTEXT_SIZE,
            gpu_layers: DEFAULT_GPU_LAYERS,
            dtype: DEFAULT_DTYPE.to_string(),
        }
    }
}

impl CandleConfig {
    fn clamp(mut self) -> Self {
        self.context_size = self.context_size.clamp(512, 131_072);
        let lowered = self.dtype.trim().to_ascii_lowercase();
        self.dtype = match lowered.as_str() {
            "auto" | "f32" | "f16" | "bf16" | "q4" | "q5" | "q8" => lowered,
            _ => DEFAULT_DTYPE.to_string(),
        };
        self
    }
}

fn resolve_path(data_dir: &Path) -> PathBuf {
    data_dir.join("user").join(FILE_NAME)
}

/// Load the persisted Candle config, or defaults on any error.
///
/// Parse / IO failures are logged but never propagated — the devtool
/// degrades to defaults so the page always renders.
#[must_use]
pub fn load(data_dir: &Path) -> CandleConfig {
    let path = resolve_path(data_dir);
    let Ok(raw) = fs::read_to_string(&path) else {
        return CandleConfig::default();
    };
    match toml::from_str::<CandleConfig>(&raw) {
        Ok(cfg) => cfg.clamp(),
        Err(err) => {
            tracing::warn!(
                path = %path.display(),
                error = %err,
                "candle config parse failed — using defaults"
            );
            CandleConfig::default()
        }
    }
}

/// Atomically persist Candle config. Returns the clamped value.
///
/// # Errors
/// - Creating the `user/` directory fails.
/// - Temp-file write or rename fails.
pub fn save(data_dir: &Path, cfg: &CandleConfig) -> Result<CandleConfig> {
    let clamped = cfg.clone().clamp();
    let path = resolve_path(data_dir);
    let parent = path
        .parent()
        .with_context(|| format!("candle path has no parent: {}", path.display()))?;
    fs::create_dir_all(parent).with_context(|| format!("create parent {}", parent.display()))?;
    let serialized = toml::to_string_pretty(&clamped).context("serialize candle config")?;
    let mut tmp = path.clone();
    let mut ext = tmp
        .extension()
        .and_then(|s| s.to_str())
        .map(str::to_owned)
        .unwrap_or_default();
    ext.push_str(".tmp");
    tmp.set_extension(ext);
    {
        let mut f =
            fs::File::create(&tmp).with_context(|| format!("open tmp {}", tmp.display()))?;
        f.write_all(serialized.as_bytes())
            .with_context(|| format!("write tmp {}", tmp.display()))?;
        f.sync_all().ok();
    }
    fs::rename(&tmp, &path)
        .with_context(|| format!("rename {} -> {}", tmp.display(), path.display()))?;
    Ok(clamped)
}
