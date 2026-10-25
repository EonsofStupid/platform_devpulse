//! Lab Voice Implementation
//!
//! Direct access to Sherpa-ONNX for model training and verification.
//! Provides independent voice stack for experimentation separate from main app.

use anyhow::{anyhow, Result};
use std::path::PathBuf;
use std::sync::Mutex;

/// Independent Voice Stack for Lab
///
/// Provides direct access to voice models for training, A/B testing,
/// and development without affecting the main application.
pub struct LabVoice {
    models_dir: PathBuf,
    loaded_tts: Mutex<Option<LoadedTtsModel>>,
    loaded_stt: Mutex<Option<LoadedSttModel>>,
}

/// A loaded TTS model instance
#[allow(dead_code)]
struct LoadedTtsModel {
    name: String,
    model_path: PathBuf,
}

/// A loaded STT model instance
#[allow(dead_code)]
struct LoadedSttModel {
    name: String,
    model_path: PathBuf,
}

impl LabVoice {
    pub fn new(models_dir: PathBuf) -> Self {
        Self {
            models_dir,
            loaded_tts: Mutex::new(None),
            loaded_stt: Mutex::new(None),
        }
    }

    /// Get the models directory
    pub fn models_dir(&self) -> &PathBuf {
        &self.models_dir
    }

    /// List available TTS models in the models directory
    pub fn list_tts_models(&self) -> Result<Vec<String>> {
        let mut models = Vec::new();
        let tts_dir = self.models_dir.join("tts");

        if tts_dir.exists() {
            for entry in std::fs::read_dir(&tts_dir)? {
                let entry = entry?;
                if entry.path().is_dir() {
                    if let Some(name) = entry.file_name().to_str() {
                        models.push(name.to_string());
                    }
                }
            }
        }

        // Also check for kokoro directly in models_dir
        if self.models_dir.join("kokoro").exists() {
            models.push("kokoro".to_string());
        }

        Ok(models)
    }

    /// List available STT models
    pub fn list_stt_models(&self) -> Result<Vec<String>> {
        let mut models = Vec::new();
        let stt_dir = self.models_dir.join("stt");

        if stt_dir.exists() {
            for entry in std::fs::read_dir(&stt_dir)? {
                let entry = entry?;
                if entry.path().is_dir() {
                    if let Some(name) = entry.file_name().to_str() {
                        models.push(name.to_string());
                    }
                }
            }
        }

        // Check for whisper directly
        for whisper_variant in ["whisper-tiny", "whisper-base", "whisper-small", "whisper-medium", "whisper-large"] {
            if self.models_dir.join(whisper_variant).exists() {
                models.push(whisper_variant.to_string());
            }
        }

        Ok(models)
    }

    /// Load a specific TTS model for testing/training
    pub async fn load_tts(&self, model_name: &str) -> Result<()> {
        let model_path = self.resolve_tts_path(model_name)?;

        if !model_path.exists() {
            return Err(anyhow!("TTS model '{}' not found at {:?}", model_name, model_path));
        }

        // Verify required files exist
        let model_onnx = model_path.join("model.onnx");
        if !model_onnx.exists() {
            return Err(anyhow!("TTS model missing model.onnx at {:?}", model_path));
        }

        tracing::info!("Loading TTS model '{}' from {:?}", model_name, model_path);

        let loaded = LoadedTtsModel {
            name: model_name.to_string(),
            model_path: model_path.clone(),
        };

        let mut guard = self.loaded_tts.lock().map_err(|e| anyhow!("Lock error: {}", e))?;
        *guard = Some(loaded);

        tracing::info!("TTS model '{}' loaded successfully", model_name);
        Ok(())
    }

    /// Load a specific STT model
    pub async fn load_stt(&self, model_name: &str) -> Result<()> {
        let model_path = self.resolve_stt_path(model_name)?;

        if !model_path.exists() {
            return Err(anyhow!("STT model '{}' not found at {:?}", model_name, model_path));
        }

        // Verify required files exist
        let encoder = model_path.join("encoder.onnx");
        let decoder = model_path.join("decoder.onnx");
        if !encoder.exists() || !decoder.exists() {
            return Err(anyhow!("STT model missing encoder.onnx or decoder.onnx at {:?}", model_path));
        }

        tracing::info!("Loading STT model '{}' from {:?}", model_name, model_path);

        let loaded = LoadedSttModel {
            name: model_name.to_string(),
            model_path: model_path.clone(),
        };

        let mut guard = self.loaded_stt.lock().map_err(|e| anyhow!("Lock error: {}", e))?;
        *guard = Some(loaded);

        tracing::info!("STT model '{}' loaded successfully", model_name);
        Ok(())
    }

    /// Unload current TTS model
    pub fn unload_tts(&self) -> Result<()> {
        let mut guard = self.loaded_tts.lock().map_err(|e| anyhow!("Lock error: {}", e))?;
        if let Some(model) = guard.take() {
            tracing::info!("Unloaded TTS model '{}'", model.name);
        }
        Ok(())
    }

    /// Unload current STT model
    pub fn unload_stt(&self) -> Result<()> {
        let mut guard = self.loaded_stt.lock().map_err(|e| anyhow!("Lock error: {}", e))?;
        if let Some(model) = guard.take() {
            tracing::info!("Unloaded STT model '{}'", model.name);
        }
        Ok(())
    }

    /// Get currently loaded TTS model name
    pub fn current_tts(&self) -> Option<String> {
        self.loaded_tts.lock().ok()
            .and_then(|guard| guard.as_ref().map(|m| m.name.clone()))
    }

    /// Get currently loaded STT model name
    pub fn current_stt(&self) -> Option<String> {
        self.loaded_stt.lock().ok()
            .and_then(|guard| guard.as_ref().map(|m| m.name.clone()))
    }

    fn resolve_tts_path(&self, model_name: &str) -> Result<PathBuf> {
        // Check direct path first
        let direct = self.models_dir.join(model_name);
        if direct.exists() {
            return Ok(direct);
        }

        // Check in tts/ subdirectory
        let in_tts = self.models_dir.join("tts").join(model_name);
        if in_tts.exists() {
            return Ok(in_tts);
        }

        // Return the direct path (will fail with clear error message)
        Ok(direct)
    }

    fn resolve_stt_path(&self, model_name: &str) -> Result<PathBuf> {
        // Check direct path first
        let direct = self.models_dir.join(model_name);
        if direct.exists() {
            return Ok(direct);
        }

        // Check in stt/ subdirectory
        let in_stt = self.models_dir.join("stt").join(model_name);
        if in_stt.exists() {
            return Ok(in_stt);
        }

        Ok(direct)
    }
}
