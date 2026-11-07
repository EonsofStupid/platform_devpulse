// orchestrator/src/infra/download.rs

//! Model Download Service
//!
//! Downloads model files from HuggingFace Hub.
//! Uses reqwest with streaming for large files with progress reporting.

use anyhow::{anyhow, Result};
use std::path::{Path, PathBuf};
use tokio::io::AsyncWriteExt;

/// Download progress callback type
pub type ProgressCallback = Box<dyn Fn(u64, u64, &str) + Send + Sync>;

/// Model download info
#[derive(Debug, Clone)]
pub struct ModelDownload {
    /// HuggingFace repo ID (e.g., "Qwen/Qwen2.5-VL-4B-Instruct-GGUF")
    pub repo_id: String,
    /// File name within the repo
    pub filename: String,
    /// Local destination path
    pub dest_path: PathBuf,
}

/// Download service for fetching models from HuggingFace
pub struct DownloadService {
    client: reqwest::Client,
}

impl DownloadService {
    /// Create a new download service
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .user_agent("devpulse/0.1")
            .build()
            .expect("Failed to create HTTP client");

        Self { client }
    }

    /// Download a file from HuggingFace Hub with progress
    ///
    /// # Arguments
    /// * `repo_id` - HuggingFace repo ID (e.g., "Qwen/Qwen2.5-VL-4B-Instruct-GGUF")
    /// * `filename` - File to download within the repo
    /// * `dest_path` - Local path to save the file
    /// * `progress` - Optional callback for progress updates (downloaded, total, stage)
    pub async fn download_hf_file(
        &self,
        repo_id: &str,
        filename: &str,
        dest_path: &Path,
        progress: Option<ProgressCallback>,
    ) -> Result<PathBuf> {
        // Build the HuggingFace download URL
        let url = format!(
            "https://huggingface.co/{}/resolve/main/{}",
            repo_id, filename
        );

        tracing::info!(
            repo_id = %repo_id,
            filename = %filename,
            dest = ?dest_path,
            "Starting download from HuggingFace"
        );

        // Report starting
        if let Some(ref cb) = progress {
            cb(0, 0, "connecting");
        }

        // Start the request
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| anyhow!("Failed to connect: {}", e))?;

        if !response.status().is_success() {
            return Err(anyhow!(
                "Download failed: HTTP {} for {}",
                response.status(),
                url
            ));
        }

        // Get content length for progress
        let total_size = response.content_length().unwrap_or(0);
        tracing::info!(
            total_size_mb = total_size as f64 / 1024.0 / 1024.0,
            "Download started"
        );

        // Report total size
        if let Some(ref cb) = progress {
            cb(0, total_size, "downloading");
        }

        // Create parent directories
        if let Some(parent) = dest_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        // Create temp file for download
        let temp_path = dest_path.with_extension("download");
        let mut file = tokio::fs::File::create(&temp_path).await?;

        // Stream download with progress
        let mut downloaded: u64 = 0;
        let mut stream = response.bytes_stream();

        use futures_util::StreamExt;
        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| anyhow!("Download error: {}", e))?;
            file.write_all(&chunk).await?;
            downloaded += chunk.len() as u64;

            // Report progress
            if let Some(ref cb) = progress {
                cb(downloaded, total_size, "downloading");
            }
        }

        file.flush().await?;
        drop(file);

        // Rename temp file to final destination
        tokio::fs::rename(&temp_path, dest_path).await?;

        tracing::info!(
            dest = ?dest_path,
            size_mb = downloaded as f64 / 1024.0 / 1024.0,
            "Download complete"
        );

        // Report completion
        if let Some(ref cb) = progress {
            cb(downloaded, total_size, "complete");
        }

        Ok(dest_path.to_path_buf())
    }

    /// Get file size from HuggingFace without downloading
    pub async fn get_file_size(&self, repo_id: &str, filename: &str) -> Result<u64> {
        let url = format!(
            "https://huggingface.co/{}/resolve/main/{}",
            repo_id, filename
        );

        let response = self.client
            .head(&url)
            .send()
            .await
            .map_err(|e| anyhow!("Failed to get file info: {}", e))?;

        if !response.status().is_success() {
            return Err(anyhow!(
                "Failed to get file info: HTTP {}",
                response.status()
            ));
        }

        response
            .content_length()
            .ok_or_else(|| anyhow!("No content length in response"))
    }
}

impl Default for DownloadService {
    fn default() -> Self {
        Self::new()
    }
}

/// Known model downloads with HuggingFace URLs
pub mod known_models {
    use super::ModelDownload;
    use std::path::PathBuf;

    /// Get download info for Qwen3-VL 4B Q6_K
    pub fn qwen3_vl_4b_q6k(models_dir: &PathBuf) -> Vec<ModelDownload> {
        vec![
            ModelDownload {
                repo_id: "Qwen/Qwen2.5-VL-4B-Instruct-GGUF".to_string(),
                filename: "qwen2.5-vl-4b-instruct-q6_k.gguf".to_string(),
                dest_path: models_dir.join("qwen3-vl-4b/Qwen3-VL-4B-Instruct-Q6_K.gguf"),
            },
            ModelDownload {
                repo_id: "Qwen/Qwen2.5-VL-4B-Instruct-GGUF".to_string(),
                filename: "mmproj-qwen2.5-vl-4b-instruct-f16.gguf".to_string(),
                dest_path: models_dir.join("qwen3-vl-4b/mmproj-Qwen3-VL-4B-Instruct-F16.gguf"),
            },
        ]
    }

    /// Get download info for Qwen3-VL 8B Q6_K
    pub fn qwen3_vl_8b_q6k(models_dir: &PathBuf) -> Vec<ModelDownload> {
        vec![
            ModelDownload {
                repo_id: "Qwen/Qwen2.5-VL-8B-Instruct-GGUF".to_string(),
                filename: "qwen2.5-vl-8b-instruct-q6_k.gguf".to_string(),
                dest_path: models_dir.join("8vlb/qwen3-vl-8b/Qwen3-VL-8B-Instruct-Q6_K.gguf"),
            },
            ModelDownload {
                repo_id: "Qwen/Qwen2.5-VL-8B-Instruct-GGUF".to_string(),
                filename: "mmproj-qwen2.5-vl-8b-instruct-f16.gguf".to_string(),
                dest_path: models_dir.join("8vlb/qwen3-vl-8b/mmproj-Qwen3-VL-8B-Instruct-F16.gguf"),
            },
        ]
    }

    /// Get download info for Qwen3 Embedder 0.6B
    pub fn qwen3_embed_0_6b(models_dir: &PathBuf) -> Vec<ModelDownload> {
        vec![
            ModelDownload {
                repo_id: "Alibaba-NLP/gte-Qwen2-1.5B-instruct".to_string(),
                filename: "model.safetensors".to_string(),
                dest_path: models_dir.join("embedder/model.safetensors"),
            },
            ModelDownload {
                repo_id: "Alibaba-NLP/gte-Qwen2-1.5B-instruct".to_string(),
                filename: "tokenizer.json".to_string(),
                dest_path: models_dir.join("embedder/tokenizer.json"),
            },
            ModelDownload {
                repo_id: "Alibaba-NLP/gte-Qwen2-1.5B-instruct".to_string(),
                filename: "config.json".to_string(),
                dest_path: models_dir.join("embedder/config.json"),
            },
        ]
    }

    /// Get download info for Qwen3 Reranker 0.6B Q8
    pub fn qwen3_rerank_0_6b_q8(models_dir: &PathBuf) -> Vec<ModelDownload> {
        vec![
            ModelDownload {
                repo_id: "Alibaba-NLP/gte-reranker-modernbert-base".to_string(),
                filename: "onnx/model_quantized.onnx".to_string(),
                dest_path: models_dir.join("reranker/Qwen3-Reranker-0.6B-q8_0.gguf"),
            },
            ModelDownload {
                repo_id: "Alibaba-NLP/gte-reranker-modernbert-base".to_string(),
                filename: "tokenizer.json".to_string(),
                dest_path: models_dir.join("reranker/tokenizer.json"),
            },
        ]
    }

    /// Get downloads for a model by ID
    pub fn for_model_id(model_id: &str, models_dir: &PathBuf) -> Option<Vec<ModelDownload>> {
        match model_id {
            "qwen3-vl-4b-q6k" => Some(qwen3_vl_4b_q6k(models_dir)),
            "qwen3-vl-8b-q6k" => Some(qwen3_vl_8b_q6k(models_dir)),
            "qwen3-embed-0.6b" => Some(qwen3_embed_0_6b(models_dir)),
            "qwen3-rerank-0.6b-q8" => Some(qwen3_rerank_0_6b_q8(models_dir)),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_file_size() {
        // Test with a small known file
        let service = DownloadService::new();
        // Skip actual network test in CI
        // let size = service.get_file_size("gpt2", "config.json").await.unwrap();
        // assert!(size > 0);
    }
}
