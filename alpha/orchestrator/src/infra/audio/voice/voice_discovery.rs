// orchestrator/src/infra/audio/voice/voice_discovery.rs

//! Voice Model Discovery - Scan folders for Whisper/Kokoro models
//!
//! Adapter-style architecture for voice models:
//! - Point at ANY folder
//! - System discovers whisper-* and kokoro* directories
//! - Validates required files exist
//! - Returns ready-to-use voice models
//!
//! Expected structure in scanned folder:
//! ```
//! models/
//! ├── whisper-medium/     (or whisper-small, whisper-large, etc.)
//! │   ├── encoder.onnx
//! │   ├── decoder.onnx
//! │   └── tokens.txt
//! └── kokoro*/            (or kokoro-v1, kokoro-multi-lang, etc.)
//!     ├── model.onnx
//!     ├── voices.bin
//!     ├── tokens.txt
//!     ├── espeak-ng-data/
//!     └── ...
//! ```

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::sync::RwLock;
use tracing::info;

/// Discovered Whisper STT model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredWhisperModel {
    /// Unique ID based on directory name
    pub id: String,
    /// Display name (e.g., "whisper-medium")
    pub name: String,
    /// Path to model directory
    pub path: PathBuf,
    /// Size variant (small, medium, large, etc.)
    pub size: String,
    /// Whether all required files exist
    pub ready: bool,
    /// Missing files if not ready
    pub missing: Vec<String>,
}

/// Discovered Kokoro TTS model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredKokoroModel {
    /// Unique ID based on directory name
    pub id: String,
    /// Display name
    pub name: String,
    /// Path to model directory
    pub path: PathBuf,
    /// Whether all required files exist
    pub ready: bool,
    /// Missing files if not ready
    pub missing: Vec<String>,
    /// Available voice profiles
    pub voices: Vec<String>,
}

/// Voice discovery result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceDiscoveryResult {
    /// Scanned directory
    pub scanned_path: PathBuf,
    /// Found Whisper models
    pub whisper_models: Vec<DiscoveredWhisperModel>,
    /// Found Kokoro models
    pub kokoro_models: Vec<DiscoveredKokoroModel>,
    /// Any errors during scan
    pub errors: Vec<String>,
}

impl VoiceDiscoveryResult {
    /// Check if any ready STT model was found
    pub fn has_stt(&self) -> bool {
        self.whisper_models.iter().any(|m| m.ready)
    }

    /// Check if any ready TTS model was found
    pub fn has_tts(&self) -> bool {
        self.kokoro_models.iter().any(|m| m.ready)
    }

    /// Get the best (largest) ready Whisper model
    pub fn best_whisper(&self) -> Option<&DiscoveredWhisperModel> {
        // Prefer larger models
        let size_order = ["large", "medium", "small", "tiny", "base"];
        for size in size_order {
            if let Some(m) = self.whisper_models.iter().find(|m| m.ready && m.size == size) {
                return Some(m);
            }
        }
        self.whisper_models.iter().find(|m| m.ready)
    }

    /// Get the first ready Kokoro model
    pub fn best_kokoro(&self) -> Option<&DiscoveredKokoroModel> {
        self.kokoro_models.iter().find(|m| m.ready)
    }
}

/// Scan a directory for voice models
pub fn discover_voice_models(root: &Path) -> Result<VoiceDiscoveryResult> {
    info!("Scanning for voice models in: {}", root.display());

    let mut result = VoiceDiscoveryResult {
        scanned_path: root.to_path_buf(),
        whisper_models: Vec::new(),
        kokoro_models: Vec::new(),
        errors: Vec::new(),
    };

    if !root.exists() {
        result.errors.push(format!("Directory does not exist: {}", root.display()));
        return Ok(result);
    }

    // Scan for whisper-* and kokoro* directories
    let entries = match std::fs::read_dir(root) {
        Ok(e) => e,
        Err(e) => {
            result.errors.push(format!("Cannot read directory: {}", e));
            return Ok(result);
        }
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let name = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_lowercase();

        // Check for Whisper models
        if name.starts_with("whisper") || name.contains("whisper") {
            if let Some(model) = check_whisper_model(&path) {
                info!("Found Whisper model: {} (ready={})", model.name, model.ready);
                result.whisper_models.push(model);
            }
        }

        // Check for Kokoro models
        if name.starts_with("kokoro") || name.contains("kokoro") {
            if let Some(model) = check_kokoro_model(&path) {
                info!("Found Kokoro model: {} (ready={})", model.name, model.ready);
                result.kokoro_models.push(model);
            }
        }
    }

    info!(
        "Voice discovery complete: {} Whisper, {} Kokoro models found",
        result.whisper_models.len(),
        result.kokoro_models.len()
    );

    Ok(result)
}

/// Check a directory for valid Whisper model files
fn check_whisper_model(path: &Path) -> Option<DiscoveredWhisperModel> {
    let name = path.file_name()?.to_str()?.to_string();
    let id = name.to_lowercase().replace(' ', "_");

    // Extract size from name
    let size = extract_whisper_size(&name);

    // Required files
    let required = ["encoder.onnx", "decoder.onnx", "tokens.txt"];
    let mut missing = Vec::new();

    for file in required {
        if !path.join(file).exists() {
            missing.push(file.to_string());
        }
    }

    Some(DiscoveredWhisperModel {
        id,
        name,
        path: path.to_path_buf(),
        size,
        ready: missing.is_empty(),
        missing,
    })
}

/// Check a directory for valid Kokoro model files
fn check_kokoro_model(path: &Path) -> Option<DiscoveredKokoroModel> {
    let name = path.file_name()?.to_str()?.to_string();
    let id = name.to_lowercase().replace(' ', "_");

    // Required files
    let required = [
        "model.onnx",
        "voices.bin",
        "tokens.txt",
    ];
    let mut missing = Vec::new();

    for file in required {
        if !path.join(file).exists() {
            missing.push(file.to_string());
        }
    }

    // Required directories
    if !path.join("espeak-ng-data").exists() {
        missing.push("espeak-ng-data/".to_string());
    }

    // List available voices
    let voices = list_kokoro_voices(path);

    Some(DiscoveredKokoroModel {
        id,
        name,
        path: path.to_path_buf(),
        ready: missing.is_empty(),
        missing,
        voices,
    })
}

/// Extract Whisper size from directory name
fn extract_whisper_size(name: &str) -> String {
    let lower = name.to_lowercase();
    if lower.contains("large") {
        "large".to_string()
    } else if lower.contains("medium") {
        "medium".to_string()
    } else if lower.contains("small") {
        "small".to_string()
    } else if lower.contains("tiny") {
        "tiny".to_string()
    } else if lower.contains("base") {
        "base".to_string()
    } else {
        "unknown".to_string()
    }
}

/// List voice profiles in a Kokoro model directory
fn list_kokoro_voices(path: &Path) -> Vec<String> {
    let voices_dir = path.join("voices");
    if !voices_dir.exists() {
        return vec![];
    }

    std::fs::read_dir(voices_dir)
        .ok()
        .map(|entries| {
            entries
                .flatten()
                .filter_map(|e| {
                    e.path()
                        .file_stem()
                        .and_then(|n| n.to_str())
                        .map(|s| s.to_string())
                })
                .collect()
        })
        .unwrap_or_default()
}

/// Voice model manager - tracks discovered models and active selection
pub struct VoiceModelManager {
    /// Current model directory
    model_dir: RwLock<Option<PathBuf>>,
    /// Cached discovery result
    discovery: RwLock<Option<VoiceDiscoveryResult>>,
    /// Selected Whisper model ID
    selected_whisper: RwLock<Option<String>>,
    /// Selected Kokoro model ID
    selected_kokoro: RwLock<Option<String>>,
}

impl VoiceModelManager {
    /// Create new manager
    pub fn new() -> Self {
        Self {
            model_dir: RwLock::new(None),
            discovery: RwLock::new(None),
            selected_whisper: RwLock::new(None),
            selected_kokoro: RwLock::new(None),
        }
    }

    /// Set model directory and scan for models
    pub async fn set_model_directory(&self, path: &Path) -> Result<VoiceDiscoveryResult> {
        let result = discover_voice_models(path)?;

        // Auto-select best models if found
        if let Some(whisper) = result.best_whisper() {
            *self.selected_whisper.write().await = Some(whisper.id.clone());
        }
        if let Some(kokoro) = result.best_kokoro() {
            *self.selected_kokoro.write().await = Some(kokoro.id.clone());
        }

        *self.model_dir.write().await = Some(path.to_path_buf());
        *self.discovery.write().await = Some(result.clone());

        Ok(result)
    }

    /// Get current discovery result
    pub async fn get_discovery(&self) -> Option<VoiceDiscoveryResult> {
        self.discovery.read().await.clone()
    }

    /// Get selected Whisper model
    pub async fn get_selected_whisper(&self) -> Option<DiscoveredWhisperModel> {
        let discovery = self.discovery.read().await;
        let selected = self.selected_whisper.read().await;

        if let (Some(disc), Some(id)) = (discovery.as_ref(), selected.as_ref()) {
            disc.whisper_models.iter().find(|m| &m.id == id).cloned()
        } else {
            None
        }
    }

    /// Get selected Kokoro model
    pub async fn get_selected_kokoro(&self) -> Option<DiscoveredKokoroModel> {
        let discovery = self.discovery.read().await;
        let selected = self.selected_kokoro.read().await;

        if let (Some(disc), Some(id)) = (discovery.as_ref(), selected.as_ref()) {
            disc.kokoro_models.iter().find(|m| &m.id == id).cloned()
        } else {
            None
        }
    }

    /// Select a Whisper model by ID
    pub async fn select_whisper(&self, id: &str) -> Result<DiscoveredWhisperModel> {
        let discovery = self.discovery.read().await;
        let disc = discovery.as_ref().ok_or_else(|| anyhow!("No models scanned yet"))?;

        let model = disc.whisper_models
            .iter()
            .find(|m| m.id == id)
            .ok_or_else(|| anyhow!("Whisper model not found: {}", id))?
            .clone();

        *self.selected_whisper.write().await = Some(id.to_string());
        Ok(model)
    }

    /// Select a Kokoro model by ID
    pub async fn select_kokoro(&self, id: &str) -> Result<DiscoveredKokoroModel> {
        let discovery = self.discovery.read().await;
        let disc = discovery.as_ref().ok_or_else(|| anyhow!("No models scanned yet"))?;

        let model = disc.kokoro_models
            .iter()
            .find(|m| m.id == id)
            .ok_or_else(|| anyhow!("Kokoro model not found: {}", id))?
            .clone();

        *self.selected_kokoro.write().await = Some(id.to_string());
        Ok(model)
    }

    /// Check if ready for STT
    pub async fn is_stt_ready(&self) -> bool {
        if let Some(model) = self.get_selected_whisper().await {
            model.ready
        } else {
            false
        }
    }

    /// Check if ready for TTS
    pub async fn is_tts_ready(&self) -> bool {
        if let Some(model) = self.get_selected_kokoro().await {
            model.ready
        } else {
            false
        }
    }
}

impl Default for VoiceModelManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_discover_voice_models() {
        // Test with default dp_alpha path
        let result = discover_voice_models(Path::new(r"D:\localdev\dp_alpha\models"));
        println!("Discovery result: {:?}", result);
    }

    #[test]
    fn test_extract_whisper_size() {
        assert_eq!(extract_whisper_size("whisper-medium"), "medium");
        assert_eq!(extract_whisper_size("whisper-large-v3"), "large");
        assert_eq!(extract_whisper_size("sherpa-onnx-whisper-small"), "small");
    }
}
