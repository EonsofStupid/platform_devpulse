//! llama.cpp (embedded, via `llama-cpp-2`) user-scope config.
//!
//! Persists to `{data_dir}/user/llama_cpp_embedded.toml`. Read by the
//! pool at slot-load time for any slot whose backend resolves to
//! `llama_cpp_embedded`.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::fs;
use std::io::Write as _;
use std::path::{Path, PathBuf};

const FILE_NAME: &str = "llama_cpp_embedded.toml";
/// Default context window in tokens when no preference is persisted.
pub const DEFAULT_CONTEXT_SIZE: u32 = 4096;
/// Default GPU offload layers. `u32::MAX` = "offload every layer."
pub const DEFAULT_GPU_LAYERS: u32 = u32::MAX;
/// Default KV-cache dtype: `"f16"` is the llama.cpp canonical balance
/// between memory and accuracy. `"q8_0"` halves it for long contexts.
pub const DEFAULT_KV_DTYPE: &str = "f16";
/// Default n_batch — how many tokens the backend processes per forward
/// pass. 512 is llama.cpp's default; drop for weaker GPUs.
pub const DEFAULT_N_BATCH: u32 = 512;

/// Persisted llama.cpp embedded runtime preferences.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct LlamaCppEmbeddedConfig {
    /// Context window in tokens. Clamped to `[512, 131_072]`.
    pub context_size: u32,
    /// GPU layers to offload. `0` = CPU only, `u32::MAX` = all.
    pub gpu_layers: u32,
    /// KV-cache element type. `"f16" | "q8_0" | "q4_0"`.
    pub kv_dtype: String,
    /// Tokens per forward pass. Clamped to `[1, 4096]`.
    pub n_batch: u32,
}

impl Default for LlamaCppEmbeddedConfig {
    fn default() -> Self {
        Self {
            context_size: DEFAULT_CONTEXT_SIZE,
            gpu_layers: DEFAULT_GPU_LAYERS,
            kv_dtype: DEFAULT_KV_DTYPE.to_string(),
            n_batch: DEFAULT_N_BATCH,
        }
    }
}

impl LlamaCppEmbeddedConfig {
    fn clamp(mut self) -> Self {
        self.context_size = self.context_size.clamp(512, 131_072);
        if self.n_batch == 0 {
            self.n_batch = DEFAULT_N_BATCH;
        }
        self.n_batch = self.n_batch.clamp(1, 4096);
        let lowered = self.kv_dtype.trim().to_ascii_lowercase();
        self.kv_dtype = match lowered.as_str() {
            "f16" | "q8_0" | "q4_0" => lowered,
            _ => DEFAULT_KV_DTYPE.to_string(),
        };
        self
    }
}

fn resolve_path(data_dir: &Path) -> PathBuf {
    data_dir.join("user").join(FILE_NAME)
}

/// Load the persisted config, or defaults on any error.
///
/// Never propagates parse/IO errors — the devtool should always render
/// even if the TOML file is missing or corrupt.
#[must_use]
pub fn load(data_dir: &Path) -> LlamaCppEmbeddedConfig {
    let path = resolve_path(data_dir);
    let Ok(raw) = fs::read_to_string(&path) else {
        return LlamaCppEmbeddedConfig::default();
    };
    match toml::from_str::<LlamaCppEmbeddedConfig>(&raw) {
        Ok(cfg) => cfg.clamp(),
        Err(err) => {
            tracing::warn!(
                path = %path.display(),
                error = %err,
                "llama_cpp_embedded config parse failed — using defaults"
            );
            LlamaCppEmbeddedConfig::default()
        }
    }
}

/// Atomically persist the config. Returns the clamped value.
///
/// # Errors
/// - Creating the `user/` directory fails.
/// - Temp-file write or rename fails.
pub fn save(
    data_dir: &Path,
    cfg: &LlamaCppEmbeddedConfig,
) -> Result<LlamaCppEmbeddedConfig> {
    let clamped = cfg.clone().clamp();
    let path = resolve_path(data_dir);
    let parent = path.parent().with_context(|| {
        format!("llama_cpp_embedded path has no parent: {}", path.display())
    })?;
    fs::create_dir_all(parent)
        .with_context(|| format!("create parent {}", parent.display()))?;
    let serialized =
        toml::to_string_pretty(&clamped).context("serialize llama_cpp_embedded config")?;
    let mut tmp = path.clone();
    let mut ext = tmp
        .extension()
        .and_then(|s| s.to_str())
        .map(str::to_owned)
        .unwrap_or_default();
    ext.push_str(".tmp");
    tmp.set_extension(ext);
    {
        let mut f = fs::File::create(&tmp)
            .with_context(|| format!("open tmp {}", tmp.display()))?;
        f.write_all(serialized.as_bytes())
            .with_context(|| format!("write tmp {}", tmp.display()))?;
        f.sync_all().ok();
    }
    fs::rename(&tmp, &path)
        .with_context(|| format!("rename {} -> {}", tmp.display(), path.display()))?;
    Ok(clamped)
}
