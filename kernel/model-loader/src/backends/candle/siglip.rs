//! SigLIP2 vision encoder via Candle.
//!
//! Produces image embeddings using Google's SigLIP2 architecture.
//! Default model: `google/siglip2-so400m-patch14-384` (embedding dim 1152, 384x384).
//!
//! Pipeline: image file/bytes → resize → normalize → tensor → VisionModel.forward → pooled embedding
//!
//! Model file expectations (SafeTensors layout from HuggingFace):
//!   - `config.json` (HF config with `vision_config` block)
//!   - `model.safetensors` (single-file) OR `model.safetensors.index.json` + shards
//!
//! Used for: screenshot understanding, visual search, cross-modal retrieval.

use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::traits::capability::VisionEmbeddingBackend;
use std::path::{Path, PathBuf};
#[cfg(feature = "candle-backend")]
use std::sync::Mutex;

#[cfg(feature = "candle-backend")]
use candle_core::{DType, Device, Module, Tensor};
#[cfg(feature = "candle-backend")]
use candle_nn::VarBuilder;
#[cfg(feature = "candle-backend")]
use candle_transformers::models::siglip::{VisionConfig, VisionModel};

/// Image mean for ImageNet normalization (RGB).
#[cfg(feature = "candle-backend")]
const IMAGE_MEAN: [f32; 3] = [0.5, 0.5, 0.5];
/// Image std for ImageNet normalization (RGB). SigLIP uses 0.5/0.5/0.5.
#[cfg(feature = "candle-backend")]
const IMAGE_STD: [f32; 3] = [0.5, 0.5, 0.5];

/// SigLIP2 vision encoder backed by Candle.
pub struct SigLipVision {
    /// Path to the model directory or file.
    model_path: Option<PathBuf>,
    /// Whether the model is currently loaded.
    loaded: bool,
    /// Output embedding dimension.
    embedding_dim: usize,
    /// Expected input resolution (square, e.g. 384 for SigLIP2-SO400M-384).
    image_size: usize,
    /// Candle device (CPU or CUDA).
    #[cfg(feature = "candle-backend")]
    device: Device,
    /// Loaded vision model + config.
    #[cfg(feature = "candle-backend")]
    model: Mutex<Option<VisionModel>>,
    /// Vision config (patch size, hidden dim, etc.) — needed for pixel_values shape.
    #[cfg(feature = "candle-backend")]
    config: Option<VisionConfig>,
}

impl SigLipVision {
    /// Create a new unloaded SigLIP2 vision encoder.
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
            embedding_dim: 1152, // SO400M default
            image_size: 384,
            #[cfg(feature = "candle-backend")]
            device: Device::Cpu,
            #[cfg(feature = "candle-backend")]
            model: Mutex::new(None),
            #[cfg(feature = "candle-backend")]
            config: None,
        }
    }
}

impl Default for SigLipVision {
    fn default() -> Self {
        Self::new()
    }
}

impl VisionEmbeddingBackend for SigLipVision {
    fn load(&mut self, path: &Path, params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "SigLIP Vision",
            "Loading vision encoder"
        );

        if !path.exists() {
            anyhow::bail!("SigLIP model not found: {}", path.display());
        }

        #[cfg(feature = "candle-backend")]
        {
            // Resolve directory: contains config.json + model.safetensors
            let model_dir = if path.is_dir() {
                path.to_path_buf()
            } else {
                path.parent()
                    .ok_or_else(|| anyhow::anyhow!("SigLIP model has no parent directory"))?
                    .to_path_buf()
            };

            let config_path = model_dir.join("config.json");
            if !config_path.exists() {
                anyhow::bail!("config.json not found in {}", model_dir.display());
            }

            // Parse config — HF siglip config wraps vision_config in a top-level key
            let config_bytes = std::fs::read(&config_path)
                .map_err(|e| anyhow::anyhow!("Failed to read config.json: {e}"))?;
            let config_json: serde_json::Value = serde_json::from_slice(&config_bytes)
                .map_err(|e| anyhow::anyhow!("Failed to parse config.json: {e}"))?;

            let vision_cfg_json = config_json
                .get("vision_config")
                .ok_or_else(|| anyhow::anyhow!("config.json missing 'vision_config' block"))?;
            let vision_config: VisionConfig = serde_json::from_value(vision_cfg_json.clone())
                .map_err(|e| anyhow::anyhow!("Failed to parse vision_config: {e}"))?;

            self.embedding_dim = vision_config.hidden_size;
            self.image_size = vision_config.image_size;

            // Find SafeTensors files — either single model.safetensors or sharded
            let safetensor_files = find_safetensor_files(&model_dir)?;
            if safetensor_files.is_empty() {
                anyhow::bail!("No .safetensors files found in {}", model_dir.display());
            }

            // Select device: cuda if compiled + requested, else CPU
            let device = if params.device == "cpu" {
                Device::Cpu
            } else {
                #[cfg(feature = "cuda")]
                {
                    Device::new_cuda(0).unwrap_or(Device::Cpu)
                }
                #[cfg(not(feature = "cuda"))]
                {
                    tracing::debug!("CUDA not compiled, using CPU for SigLIP");
                    Device::Cpu
                }
            };
            self.device = device.clone();

            // Load weights via VarBuilder with mmap.
            // SAFETY: candle's mmap API is unsafe because the backing files must not
            // be mutated while mapped. We hold them for the lifetime of the model and
            // make no assumptions about concurrent writers — model dirs are read-only.
            #[allow(unsafe_code)]
            let vb = unsafe {
                VarBuilder::from_mmaped_safetensors(&safetensor_files, DType::F32, &device)
                    .map_err(|e| anyhow::anyhow!("Failed to mmap safetensors: {e}"))?
            };

            // Most HF SigLIP checkpoints nest under `vision_model.` — but the candle
            // module expects you to pass the prefix yourself. Try both common layouts.
            let model = match VisionModel::new(&vision_config, true, vb.pp("vision_model")) {
                Ok(m) => m,
                Err(_) => {
                    // Some exports have no prefix (bare vision checkpoint)
                    #[allow(unsafe_code)]
                    let vb2 = unsafe {
                        VarBuilder::from_mmaped_safetensors(
                            &safetensor_files,
                            DType::F32,
                            &device,
                        )
                        .map_err(|e| anyhow::anyhow!("Failed to mmap safetensors (retry): {e}"))?
                    };
                    VisionModel::new(&vision_config, true, vb2)
                        .map_err(|e| anyhow::anyhow!("Failed to load SigLIP weights: {e}"))?
                }
            };

            // Compute total size from files on disk
            let total_size: u64 = safetensor_files
                .iter()
                .filter_map(|p| std::fs::metadata(p).ok().map(|m| m.len()))
                .sum();

            *self
                .model
                .lock()
                .map_err(|e| anyhow::anyhow!("SigLIP model mutex poisoned: {e}"))? = Some(model);
            self.config = Some(vision_config);
            self.model_path = Some(model_dir);
            self.loaded = true;

            tracing::info!(
                component = "SigLIP Vision",
                size_mb = total_size / 1_048_576,
                image_size = self.image_size,
                embedding_dim = self.embedding_dim,
                "SigLIP vision encoder loaded"
            );

            let (ram, vram) = match &self.device {
                Device::Cpu => (total_size, 0u64),
                _ => (0u64, total_size),
            };

            Ok(MemoryFootprint {
                ram_bytes: ram,
                vram_bytes: vram,
                kv_cache_bytes: 0,
            })
        }

        #[cfg(not(feature = "candle-backend"))]
        {
            let _ = params;
            anyhow::bail!("SigLIP Vision requires candle-backend feature — not compiled")
        }
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        #[cfg(feature = "candle-backend")]
        {
            *self
                .model
                .lock()
                .map_err(|e| anyhow::anyhow!("SigLIP model mutex poisoned: {e}"))? = None;
            self.config = None;
        }
        self.model_path = None;
        self.loaded = false;
        tracing::info!(component = "SigLIP Vision", "SigLIP unloaded");
        Ok(())
    }

    #[cfg(feature = "candle-backend")]
    fn encode_image(&self, path: &Path) -> anyhow::Result<Vec<f32>> {
        let img = image::open(path)
            .map_err(|e| anyhow::anyhow!("Failed to open image {}: {e}", path.display()))?;
        let rgb = img.to_rgb8();
        let (width, height) = (rgb.width(), rgb.height());
        self.encode_rgb(rgb.as_raw(), width, height)
    }

    #[cfg(not(feature = "candle-backend"))]
    fn encode_image(&self, _path: &Path) -> anyhow::Result<Vec<f32>> {
        anyhow::bail!("SigLIP Vision requires candle-backend feature — not compiled")
    }

    #[cfg(feature = "candle-backend")]
    #[tracing::instrument(skip(self, rgb_bytes), fields(width, height))]
    fn encode_rgb(&self, rgb_bytes: &[u8], width: u32, height: u32) -> anyhow::Result<Vec<f32>> {
        if !self.loaded {
            anyhow::bail!("SigLIP not loaded");
        }

        let expected = (width as usize) * (height as usize) * 3;
        if rgb_bytes.len() != expected {
            anyhow::bail!(
                "RGB byte length mismatch: got {}, expected {} for {}x{}",
                rgb_bytes.len(),
                expected,
                width,
                height
            );
        }

        // Resize to model's input resolution
        let resized = image::imageops::resize(
            &image::ImageBuffer::<image::Rgb<u8>, Vec<u8>>::from_raw(
                width,
                height,
                rgb_bytes.to_vec(),
            )
            .ok_or_else(|| anyhow::anyhow!("Failed to build ImageBuffer from RGB bytes"))?,
            self.image_size as u32,
            self.image_size as u32,
            image::imageops::FilterType::CatmullRom,
        );

        // Normalize to [-1, 1] via (pixel/255 - 0.5) / 0.5
        let size = self.image_size;
        let mut tensor_data = vec![0.0f32; 3 * size * size];
        for y in 0..size {
            for x in 0..size {
                let pixel = resized.get_pixel(x as u32, y as u32);
                for c in 0..3 {
                    let v = f32::from(pixel[c]) / 255.0;
                    let normalized = (v - IMAGE_MEAN[c]) / IMAGE_STD[c];
                    // CHW layout: channel * H * W + y * W + x
                    tensor_data[c * size * size + y * size + x] = normalized;
                }
            }
        }

        // Build pixel_values tensor: [1, 3, H, W]
        let pixel_values = Tensor::from_vec(tensor_data, (1, 3, size, size), &self.device)
            .map_err(|e| anyhow::anyhow!("Failed to build pixel tensor: {e}"))?;

        // Forward pass
        let guard = self
            .model
            .lock()
            .map_err(|e| anyhow::anyhow!("SigLIP model mutex poisoned: {e}"))?;
        let model = guard
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("SigLIP model not initialized"))?;

        let output = model
            .forward(&pixel_values)
            .map_err(|e| anyhow::anyhow!("SigLIP forward pass failed: {e}"))?;

        // Output is [1, embedding_dim] after pooling head
        let output = output
            .squeeze(0)
            .map_err(|e| anyhow::anyhow!("Failed to squeeze output: {e}"))?;

        // Extract to Vec<f32>
        let vec: Vec<f32> = output
            .to_vec1::<f32>()
            .map_err(|e| anyhow::anyhow!("Failed to extract embedding as Vec<f32>: {e}"))?;

        // L2 normalize
        let norm = vec.iter().map(|v| v * v).sum::<f32>().sqrt();
        let normalized: Vec<f32> = if norm > 0.0 {
            vec.iter().map(|v| v / norm).collect()
        } else {
            vec
        };

        tracing::debug!(
            component = "SigLIP Vision",
            dim = normalized.len(),
            "Image encoded"
        );

        Ok(normalized)
    }

    #[cfg(not(feature = "candle-backend"))]
    fn encode_rgb(&self, _rgb_bytes: &[u8], _width: u32, _height: u32) -> anyhow::Result<Vec<f32>> {
        anyhow::bail!("SigLIP Vision requires candle-backend feature — not compiled")
    }

    fn embedding_dim(&self) -> usize {
        self.embedding_dim
    }

    fn memory_usage(&self) -> MemoryFootprint {
        if let Some(ref path) = self.model_path {
            let size = dir_size(path);
            MemoryFootprint {
                ram_bytes: size,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            }
        } else {
            MemoryFootprint {
                ram_bytes: 0,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            }
        }
    }
}

/// Find all `*.safetensors` files in a model directory.
#[cfg(feature = "candle-backend")]
fn find_safetensor_files(dir: &Path) -> anyhow::Result<Vec<PathBuf>> {
    let mut files = Vec::new();
    let entries = std::fs::read_dir(dir)
        .map_err(|e| anyhow::anyhow!("Failed to read directory {}: {e}", dir.display()))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("safetensors") {
            files.push(path);
        }
    }
    files.sort();
    Ok(files)
}

/// Recursively compute total size of files in a directory.
fn dir_size(path: &Path) -> u64 {
    if path.is_file() {
        return std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    }
    let mut total = 0u64;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Ok(meta) = std::fs::metadata(&p) {
                    total += meta.len();
                }
            }
        }
    }
    total
}
