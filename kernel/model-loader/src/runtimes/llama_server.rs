//! llama-server settings (user scope).
//!
//! Persists to `{data_dir}/user/llama_server.toml`. Each value is one of
//! llama-server's own flags: `-c` (context size), `-ngl` (GPU layers),
//! `--cache-type-k` / `--cache-type-v` (KV-cache type) and `-b` (batch).
//! When you have saved settings, the GGUF sidecar starts with them; without
//! a file it keeps its defaults (plan 0007).

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

const FILE_NAME: &str = "llama_server.toml";
/// Default context window in tokens when no preference is persisted.
pub const DEFAULT_CONTEXT_SIZE: u32 = 4096;
/// Default GPU offload layers. `u32::MAX` = "offload every layer."
pub const DEFAULT_GPU_LAYERS: u32 = u32::MAX;
/// Default KV-cache dtype: `"f16"` is the llama.cpp canonical balance
/// between memory and accuracy. `"q8_0"` halves it for long contexts.
pub const DEFAULT_KV_DTYPE: &str = "f16";
/// Default `n_batch` — how many tokens the server processes per forward
/// pass. 512 is llama.cpp's default; drop for weaker GPUs.
pub const DEFAULT_N_BATCH: u32 = 512;

/// Your llama-server settings.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct LlamaServerConfig {
    /// Context window in tokens (`-c`). Clamped to `[512, 131_072]`.
    pub context_size: u32,
    /// GPU layers to offload (`-ngl`). `0` = CPU only, `u32::MAX` = all.
    pub gpu_layers: u32,
    /// KV-cache element type (`--cache-type-k/-v`). `"f16" | "q8_0" | "q4_0"`.
    pub kv_dtype: String,
    /// Tokens per forward pass (`-b`). Clamped to `[1, 4096]`.
    pub n_batch: u32,
}

impl Default for LlamaServerConfig {
    fn default() -> Self {
        Self {
            context_size: DEFAULT_CONTEXT_SIZE,
            gpu_layers: DEFAULT_GPU_LAYERS,
            kv_dtype: DEFAULT_KV_DTYPE.to_string(),
            n_batch: DEFAULT_N_BATCH,
        }
    }
}

impl LlamaServerConfig {
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

    /// llama-server's flags for these settings. "Every layer" is passed as
    /// `999`, llama.cpp's own spelling of "all".
    #[must_use]
    pub fn server_args(&self) -> Vec<String> {
        let layers = if self.gpu_layers == u32::MAX {
            "999".to_owned()
        } else {
            self.gpu_layers.to_string()
        };
        vec![
            "-c".to_owned(),
            self.context_size.to_string(),
            "-ngl".to_owned(),
            layers,
            "--cache-type-k".to_owned(),
            self.kv_dtype.clone(),
            "--cache-type-v".to_owned(),
            self.kv_dtype.clone(),
            "-b".to_owned(),
            self.n_batch.to_string(),
        ]
    }
}

fn resolve_path(data_dir: &Path) -> PathBuf {
    data_dir.join("user").join(FILE_NAME)
}

/// Your saved settings, or `None` when you have not saved any (or the file
/// can't be read — the reason is logged).
#[must_use]
pub fn load_saved(data_dir: &Path) -> Option<LlamaServerConfig> {
    let path = resolve_path(data_dir);
    let raw = super::load_config(&path).ok()?;
    match toml::from_str::<LlamaServerConfig>(&raw) {
        Ok(cfg) => Some(cfg.clamp()),
        Err(err) => {
            tracing::warn!(
                path = %path.display(),
                error = %err,
                "llama-server settings not read — the server keeps its defaults"
            );
            None
        }
    }
}

/// Your saved settings, or the defaults — what the devtool shows.
#[must_use]
pub fn load(data_dir: &Path) -> LlamaServerConfig {
    load_saved(data_dir).unwrap_or_default()
}

/// Atomically persist the settings. Returns the clamped value.
///
/// # Errors
/// - Creating the `user/` directory fails.
/// - Serialization, temporary-file write, synchronization or replacement fails.
pub fn save(data_dir: &Path, cfg: &LlamaServerConfig) -> Result<LlamaServerConfig> {
    let clamped = cfg.clone().clamp();
    let path = resolve_path(data_dir);
    super::save_config(&path, &clamped)?;
    Ok(clamped)
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    fn temp_data_dir() -> PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_nanos());
        std::env::temp_dir().join(format!("devpulse-llama-server-{nanos}"))
    }

    #[test]
    fn nothing_saved_means_the_server_keeps_its_defaults() {
        let data = temp_data_dir();
        assert!(load_saved(&data).is_none());
        assert_eq!(load(&data).context_size, DEFAULT_CONTEXT_SIZE);
    }

    #[test]
    fn saved_settings_become_the_servers_flags() {
        let data = temp_data_dir();
        let saved = save(
            &data,
            &LlamaServerConfig {
                context_size: 16_384,
                gpu_layers: u32::MAX,
                kv_dtype: "Q8_0".into(),
                n_batch: 0,
            },
        )
        .unwrap();
        assert_eq!(saved.kv_dtype, "q8_0");
        assert_eq!(saved.n_batch, DEFAULT_N_BATCH);
        let args = load_saved(&data).expect("saved").server_args();
        assert_eq!(
            args,
            [
                "-c",
                "16384",
                "-ngl",
                "999",
                "--cache-type-k",
                "q8_0",
                "--cache-type-v",
                "q8_0",
                "-b",
                "512"
            ]
        );
        let _ = std::fs::remove_dir_all(data);
    }
}
