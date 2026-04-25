//! SigLIP 2 vision encoder via ONNX Runtime — HD path.
//!
//! Loads `onnx-community/siglip2-so400m-patch14-384-ONNX` (FixRes export)
//! and produces image embeddings. Same preprocessing as the candle path
//! (`backends/candle/siglip.rs`) so embeddings are interchangeable
//! within the same model family — the dispatcher in `voice_pool.rs`
//! picks candle vs ort based on `LoadParams.backend_variant`.
//!
//! NaFlex (variable-resolution + dynamic position-embedding interpolation)
//! is intentionally deferred to V-11. The file is named `siglip_naflex`
//! so the same module can grow into NaFlex without a follow-up rename
//! that breaks consumers.
//!
//! # Cast lints
//!
//! Image-tensor math: `u8` pixel values, `f32` normalized tensors,
//! `usize` spatial indices, `i64` ONNX dim specs. Domain-safe
//! representation changes throughout.

#![allow(
    clippy::cast_possible_truncation,
    clippy::cast_precision_loss,
    clippy::cast_sign_loss,
    clippy::cast_possible_wrap,
    clippy::cast_lossless
)]

use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::traits::capability::VisionEmbeddingBackend;
use std::path::{Path, PathBuf};
#[cfg(feature = "ort-backend")]
use std::sync::Mutex;

/// Image mean for SigLIP normalization (RGB).
#[cfg(feature = "ort-backend")]
const IMAGE_MEAN: [f32; 3] = [0.5, 0.5, 0.5];
/// Image std for SigLIP normalization (RGB).
#[cfg(feature = "ort-backend")]
const IMAGE_STD: [f32; 3] = [0.5, 0.5, 0.5];

/// Default FixRes input resolution for `siglip2-so400m-patch14-384-ONNX`.
const DEFAULT_IMAGE_SIZE: usize = 384;
/// Default embedding dimension for SO400M.
const DEFAULT_EMBEDDING_DIM: usize = 1152;

/// SigLIP 2 vision encoder backed by ONNX Runtime (FixRes).
pub struct SigLip2OrtFixRes {
    /// Path to the loaded ONNX file (or directory containing it).
    model_path: Option<PathBuf>,
    /// Whether the model is currently loaded.
    loaded: bool,
    /// Output embedding dimension.
    embedding_dim: usize,
    /// Expected square input resolution. Only consumed by the ort-backend
    /// `encode_rgb` resize; under default features the field is set-but-unread.
    #[cfg_attr(not(feature = "ort-backend"), allow(dead_code))]
    image_size: usize,
    /// ONNX Runtime session.
    #[cfg(feature = "ort-backend")]
    session: Mutex<Option<ort::session::Session>>,
}

impl SigLip2OrtFixRes {
    /// Create a new unloaded SigLIP 2 ONNX encoder.
    #[must_use]
    pub fn new() -> Self {
        Self {
            model_path: None,
            loaded: false,
            embedding_dim: DEFAULT_EMBEDDING_DIM,
            image_size: DEFAULT_IMAGE_SIZE,
            #[cfg(feature = "ort-backend")]
            session: Mutex::new(None),
        }
    }

    /// Stable identifier consumed by the dispatcher / metrics surface.
    #[must_use]
    pub fn backend_name() -> &'static str {
        "siglip2-onnx-fixres"
    }
}

impl Default for SigLip2OrtFixRes {
    fn default() -> Self {
        Self::new()
    }
}

impl VisionEmbeddingBackend for SigLip2OrtFixRes {
    fn load(&mut self, path: &Path, _params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        tracing::info!(
            path = %path.display(),
            component = "SigLIP2 ONNX",
            "Loading vision encoder"
        );

        if !path.exists() {
            anyhow::bail!("SigLIP2 ONNX model not found: {}", path.display());
        }

        #[cfg(feature = "ort-backend")]
        {
            let model_file = if path.is_dir() {
                find_onnx_file(path)?
            } else {
                path.to_path_buf()
            };

            let session = ort::session::Session::builder()
                .map_err(|e| anyhow::anyhow!("Failed to create ort session builder: {e}"))?
                .commit_from_file(&model_file)
                .map_err(|e| anyhow::anyhow!("Failed to load SigLIP2 ONNX: {e}"))?;

            *self
                .session
                .lock()
                .map_err(|e| anyhow::anyhow!("SigLIP2 ONNX session mutex poisoned: {e}"))? =
                Some(session);
            self.model_path = Some(model_file.clone());
            self.loaded = true;

            let file_size = std::fs::metadata(&model_file).map(|m| m.len()).unwrap_or(0);

            tracing::info!(
                component = "SigLIP2 ONNX",
                size_mb = file_size / 1_048_576,
                image_size = self.image_size,
                embedding_dim = self.embedding_dim,
                "SigLIP2 ONNX vision encoder loaded"
            );

            Ok(MemoryFootprint {
                ram_bytes: file_size,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            })
        }

        #[cfg(not(feature = "ort-backend"))]
        anyhow::bail!("SigLIP2 ONNX requires ort-backend feature — not compiled")
    }

    fn unload(&mut self) -> anyhow::Result<()> {
        #[cfg(feature = "ort-backend")]
        {
            *self
                .session
                .lock()
                .map_err(|e| anyhow::anyhow!("SigLIP2 ONNX session mutex poisoned: {e}"))? = None;
        }
        self.model_path = None;
        self.loaded = false;
        tracing::info!(component = "SigLIP2 ONNX", "SigLIP2 ONNX unloaded");
        Ok(())
    }

    #[cfg(feature = "ort-backend")]
    fn encode_image(&self, path: &Path) -> anyhow::Result<Vec<f32>> {
        let img = image::open(path)
            .map_err(|e| anyhow::anyhow!("Failed to open image {}: {e}", path.display()))?;
        let rgb = img.to_rgb8();
        let (width, height) = (rgb.width(), rgb.height());
        self.encode_rgb(rgb.as_raw(), width, height)
    }

    #[cfg(not(feature = "ort-backend"))]
    fn encode_image(&self, _path: &Path) -> anyhow::Result<Vec<f32>> {
        anyhow::bail!("SigLIP2 ONNX requires ort-backend feature — not compiled")
    }

    #[cfg(feature = "ort-backend")]
    #[tracing::instrument(skip(self, rgb_bytes), fields(width, height))]
    fn encode_rgb(&self, rgb_bytes: &[u8], width: u32, height: u32) -> anyhow::Result<Vec<f32>> {
        if !self.loaded {
            anyhow::bail!("SigLIP2 ONNX not loaded");
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

        // Resize to model's input resolution (CatmullRom matches the candle path).
        let size = self.image_size;
        let resized = image::imageops::resize(
            &image::ImageBuffer::<image::Rgb<u8>, Vec<u8>>::from_raw(
                width,
                height,
                rgb_bytes.to_vec(),
            )
            .ok_or_else(|| anyhow::anyhow!("Failed to build ImageBuffer from RGB bytes"))?,
            size as u32,
            size as u32,
            image::imageops::FilterType::CatmullRom,
        );

        // Normalize to [-1, 1] via (pixel/255 - 0.5) / 0.5, CHW layout.
        let mut tensor_data = vec![0.0f32; 3 * size * size];
        for y in 0..size {
            for x in 0..size {
                let pixel = resized.get_pixel(x as u32, y as u32);
                for c in 0..3 {
                    let v = f32::from(pixel[c]) / 255.0;
                    let normalized = (v - IMAGE_MEAN[c]) / IMAGE_STD[c];
                    tensor_data[c * size * size + y * size + x] = normalized;
                }
            }
        }

        // ndarray shape [1, 3, H, W] feeding the ONNX `pixel_values` input.
        let pixel_values =
            ndarray::Array4::<f32>::from_shape_vec((1, 3, size, size), tensor_data)
                .map_err(|e| anyhow::anyhow!("Failed to build pixel tensor: {e}"))?;

        let mut guard = self
            .session
            .lock()
            .map_err(|e| anyhow::anyhow!("SigLIP2 ONNX session mutex poisoned: {e}"))?;
        let session = guard
            .as_mut()
            .ok_or_else(|| anyhow::anyhow!("SigLIP2 ONNX session not initialized"))?;

        let v_pixels = ort::value::Value::from_array(pixel_values)
            .map_err(|e| anyhow::anyhow!("Failed to create ort Value for pixel_values: {e}"))?;

        let outputs = session
            .run(ort::inputs!["pixel_values" => v_pixels])
            .map_err(|e| anyhow::anyhow!("SigLIP2 ONNX inference failed: {e}"))?;

        // Output is the pooled image embedding [1, embedding_dim].
        let output_value = &outputs[0];
        let (shape, data) = output_value
            .try_extract_tensor::<f32>()
            .map_err(|e| anyhow::anyhow!("Failed to extract SigLIP2 output: {e}"))?;

        if shape.len() < 2 {
            anyhow::bail!(
                "Unexpected SigLIP2 output shape: {:?} (expected [1, dim])",
                shape
            );
        }
        let embedding_dim = shape[shape.len() - 1] as usize;
        let vec: Vec<f32> = data[..embedding_dim].to_vec();

        // L2 normalize so candle / ort embeddings live in the same space.
        let norm = vec.iter().map(|v| v * v).sum::<f32>().sqrt();
        let normalized: Vec<f32> = if norm > 0.0 {
            vec.iter().map(|v| v / norm).collect()
        } else {
            vec
        };

        tracing::debug!(
            component = "SigLIP2 ONNX",
            dim = normalized.len(),
            "Image encoded"
        );

        Ok(normalized)
    }

    #[cfg(not(feature = "ort-backend"))]
    fn encode_rgb(&self, _rgb_bytes: &[u8], _width: u32, _height: u32) -> anyhow::Result<Vec<f32>> {
        anyhow::bail!("SigLIP2 ONNX requires ort-backend feature — not compiled")
    }

    fn embedding_dim(&self) -> usize {
        self.embedding_dim
    }

    fn memory_usage(&self) -> MemoryFootprint {
        if let Some(ref p) = self.model_path {
            let bytes = std::fs::metadata(p).map(|m| m.len()).unwrap_or(0);
            MemoryFootprint {
                ram_bytes: bytes,
                vram_bytes: 0,
                kv_cache_bytes: 0,
            }
        } else {
            MemoryFootprint::default()
        }
    }
}

/// Find the first `*.onnx` file in a directory.
#[cfg(feature = "ort-backend")]
fn find_onnx_file(dir: &Path) -> anyhow::Result<PathBuf> {
    let entries = std::fs::read_dir(dir)
        .map_err(|e| anyhow::anyhow!("Failed to read directory {}: {e}", dir.display()))?;
    for entry in entries.flatten() {
        let p = entry.path();
        if p.extension().and_then(|s| s.to_str()) == Some("onnx") {
            return Ok(p);
        }
    }
    anyhow::bail!("No .onnx file found in {}", dir.display())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_reports_so400m_defaults() {
        let backend = SigLip2OrtFixRes::new();
        assert_eq!(backend.embedding_dim(), DEFAULT_EMBEDDING_DIM);
        assert_eq!(backend.image_size, DEFAULT_IMAGE_SIZE);
        assert!(!backend.loaded);
    }

    #[test]
    fn backend_name_is_stable_identifier() {
        assert_eq!(SigLip2OrtFixRes::backend_name(), "siglip2-onnx-fixres");
    }

    #[test]
    fn load_missing_path_returns_informative_error() {
        let mut backend = SigLip2OrtFixRes::new();
        let err = backend
            .load(Path::new("/definitely/does/not/exist.onnx"), LoadParams::default())
            .unwrap_err();
        let msg = err.to_string();
        assert!(
            msg.contains("not found") || msg.contains("ort-backend feature"),
            "expected 'not found' or feature error, got: {msg}"
        );
    }

    #[test]
    fn unload_when_never_loaded_is_idempotent() {
        let mut backend = SigLip2OrtFixRes::new();
        backend.unload().expect("unload should not error on cold backend");
        assert!(!backend.loaded);
    }

    #[test]
    fn memory_usage_zero_when_unloaded() {
        let backend = SigLip2OrtFixRes::new();
        let mem = backend.memory_usage();
        assert_eq!(mem.ram_bytes, 0);
        assert_eq!(mem.vram_bytes, 0);
    }
}
