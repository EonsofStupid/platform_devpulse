// orchestrator/src/infra/audio/voice/voice.rs

//! Voice backend - Whisper STT + Kokoro TTS via sherpa-onnx
//!
//! Uses sherpa-rs bindings to sherpa-onnx runtime.
//! Models located at: D:\localdev\dp_alpha\models\
//!
//! Required model structure:
//! ```
//! models/
//! ├── whisper-medium/          (sherpa-onnx format, NOT gguf!)
//! │   ├── encoder.onnx
//! │   ├── decoder.onnx
//! │   └── tokens.txt
//! └── kokoro/
//!     ├── model.onnx
//!     ├── voices.bin           (or individual voice files)
//!     ├── tokens.txt
//!     ├── espeak-ng-data/
//!     ├── dict/
//!     └── lexicon-*.txt
//! ```
//!
//! Download models from: https://github.com/k2-fsa/sherpa-onnx/releases

use anyhow::{anyhow, Result};
use sherpa_rs::whisper::{WhisperConfig, WhisperRecognizer};
use sherpa_rs::tts::{KokoroTts, KokoroTtsConfig};
use std::path::PathBuf;
use std::sync::Mutex;

/// Model paths configuration
#[derive(Debug, Clone)]
pub struct ModelPaths {
    /// Root models directory
    pub root: PathBuf,
    /// Whisper model directory (sherpa-onnx format)
    pub whisper_dir: PathBuf,
    /// Kokoro TTS directory
    pub kokoro_dir: PathBuf,
}

// Removed Default impl for ModelPaths as it contained hardcoded paths.
// Paths must be provided via config now.

impl ModelPaths {
    pub fn new(root: PathBuf) -> Self {
        Self {
            whisper_dir: root.join("whisper-medium"),
            kokoro_dir: root.join("kokoro"),
            root,
        }
    }

    // Whisper paths (sherpa-onnx format)
    pub fn whisper_encoder(&self) -> PathBuf {
        self.whisper_dir.join("encoder.onnx")
    }

    pub fn whisper_decoder(&self) -> PathBuf {
        self.whisper_dir.join("decoder.onnx")
    }

    pub fn whisper_tokens(&self) -> PathBuf {
        self.whisper_dir.join("tokens.txt")
    }

    // Kokoro TTS paths
    pub fn kokoro_model(&self) -> PathBuf {
        self.kokoro_dir.join("model.onnx")
    }

    pub fn kokoro_voices(&self) -> PathBuf {
        self.kokoro_dir.join("voices.bin")
    }

    pub fn kokoro_tokens(&self) -> PathBuf {
        self.kokoro_dir.join("tokens.txt")
    }

    pub fn kokoro_data_dir(&self) -> PathBuf {
        self.kokoro_dir.join("espeak-ng-data")
    }

    pub fn kokoro_dict_dir(&self) -> PathBuf {
        self.kokoro_dir.join("dict")
    }

    pub fn kokoro_lexicon(&self) -> PathBuf {
        self.kokoro_dir.join("lexicon-us-en.txt")
    }
}

/// Voice backend handle with lazy-loaded recognizers
pub struct VoiceBackend {
    paths: ModelPaths,
    /// Whisper recognizer (lazy-loaded, requires mutex for mutable transcribe)
    whisper: Mutex<Option<WhisperRecognizer>>,
    /// Kokoro TTS (lazy-loaded)
    kokoro: Mutex<Option<KokoroTts>>,
}

/// STT result from Whisper
#[derive(Debug, Clone)]
pub struct TranscriptResult {
    pub text: String,
    pub language: Option<String>,
    pub duration_ms: u64,
}

/// TTS result from Kokoro
#[derive(Debug, Clone)]
pub struct SpeechResult {
    pub audio: Vec<f32>,
    pub sample_rate: u32,
    pub duration_ms: u64,
}

/// Model verification status
#[derive(Debug, Clone)]
pub struct ModelStatus {
    pub whisper_ready: bool,
    pub whisper_missing: Vec<String>,
    pub kokoro_ready: bool,
    pub kokoro_missing: Vec<String>,
    pub voices: Vec<String>,
}

impl std::fmt::Display for ModelStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Whisper: {} (missing: {:?}), Kokoro: {} (missing: {:?}), Voices: {:?}",
            if self.whisper_ready { "READY" } else { "INCOMPLETE" },
            self.whisper_missing,
            if self.kokoro_ready { "READY" } else { "INCOMPLETE" },
            self.kokoro_missing,
            self.voices
        )
    }
}

impl VoiceBackend {
    // Removed new() which relied on ModelPaths::default()
    // Use with_paths() instead.

    /// Create with custom paths
    pub fn with_paths(paths: ModelPaths) -> Self {
        Self {
            paths,
            whisper: Mutex::new(None),
            kokoro: Mutex::new(None),
        }
    }

    /// Verify which models are present and return status
    pub fn verify_models(&self) -> ModelStatus {
        let mut whisper_missing = Vec::new();
        let mut kokoro_missing = Vec::new();

        // Check Whisper files
        if !self.paths.whisper_encoder().exists() {
            whisper_missing.push("encoder.onnx".to_string());
        }
        if !self.paths.whisper_decoder().exists() {
            whisper_missing.push("decoder.onnx".to_string());
        }
        if !self.paths.whisper_tokens().exists() {
            whisper_missing.push("tokens.txt".to_string());
        }

        // Check Kokoro files
        if !self.paths.kokoro_model().exists() {
            kokoro_missing.push("model.onnx".to_string());
        }
        if !self.paths.kokoro_voices().exists() {
            kokoro_missing.push("voices.bin".to_string());
        }
        if !self.paths.kokoro_tokens().exists() {
            kokoro_missing.push("tokens.txt".to_string());
        }
        if !self.paths.kokoro_data_dir().exists() {
            kokoro_missing.push("espeak-ng-data/".to_string());
        }

        ModelStatus {
            whisper_ready: whisper_missing.is_empty(),
            whisper_missing,
            kokoro_ready: kokoro_missing.is_empty(),
            kokoro_missing,
            voices: self.list_voices().unwrap_or_default(),
        }
    }

    /// List available voice profiles
    pub fn list_voices(&self) -> Result<Vec<String>> {
        let voices_dir = self.paths.kokoro_dir.join("voices");
        if !voices_dir.exists() {
            return Ok(vec![]);
        }

        let mut voices = Vec::new();
        for entry in std::fs::read_dir(voices_dir)? {
            let entry = entry?;
            if let Some(name) = entry.path().file_stem() {
                voices.push(name.to_string_lossy().to_string());
            }
        }
        Ok(voices)
    }

    /// Initialize Whisper recognizer (lazy-loaded)
    fn ensure_whisper(&self) -> Result<()> {
        let mut guard = self.whisper.lock().map_err(|e| anyhow!("Lock error: {}", e))?;
        if guard.is_some() {
            return Ok(());
        }

        let status = self.verify_models();
        if !status.whisper_ready {
            return Err(anyhow!(
                "Whisper models incomplete. Missing: {:?}\n\
                Download from: https://github.com/k2-fsa/sherpa-onnx/releases\n\
                Look for sherpa-onnx-whisper-medium.tar.bz2",
                status.whisper_missing
            ));
        }

        let config = WhisperConfig {
            encoder: self.paths.whisper_encoder().to_string_lossy().to_string(),
            decoder: self.paths.whisper_decoder().to_string_lossy().to_string(),
            tokens: self.paths.whisper_tokens().to_string_lossy().to_string(),
            language: "en".to_string(),
            provider: Some("cpu".to_string()),
            num_threads: Some(4),
            ..Default::default()
        };

        let recognizer = WhisperRecognizer::new(config)
            .map_err(|e| anyhow!("Failed to create Whisper recognizer: {}", e))?;

        *guard = Some(recognizer);
        tracing::info!("Whisper recognizer initialized");
        Ok(())
    }

    /// Initialize Kokoro TTS (lazy-loaded)
    fn ensure_kokoro(&self) -> Result<()> {
        let mut guard = self.kokoro.lock().map_err(|e| anyhow!("Lock error: {}", e))?;
        if guard.is_some() {
            return Ok(());
        }

        let status = self.verify_models();
        if !status.kokoro_ready {
            return Err(anyhow!(
                "Kokoro models incomplete. Missing: {:?}\n\
                Download from: https://github.com/k2-fsa/sherpa-onnx/releases\n\
                Look for kokoro-multi-lang-v1_0.tar.bz2",
                status.kokoro_missing
            ));
        }

        let config = KokoroTtsConfig {
            model: self.paths.kokoro_model().to_string_lossy().to_string(),
            voices: self.paths.kokoro_voices().to_string_lossy().to_string(),
            tokens: self.paths.kokoro_tokens().to_string_lossy().to_string(),
            data_dir: self.paths.kokoro_data_dir().to_string_lossy().to_string(),
            dict_dir: self.paths.kokoro_dict_dir().to_string_lossy().to_string(),
            lexicon: self.paths.kokoro_lexicon().to_string_lossy().to_string(),
            length_scale: 1.0,
            ..Default::default()
        };

        let tts = KokoroTts::new(config);
        *guard = Some(tts);
        tracing::info!("Kokoro TTS initialized");
        Ok(())
    }

    /// Transcribe audio to text (STT)
    /// Audio must be 16kHz mono f32 samples
    pub fn transcribe(&self, audio: &[f32], sample_rate: u32) -> Result<TranscriptResult> {
        if sample_rate != 16000 {
            return Err(anyhow!("Sample rate must be 16000Hz, got {}Hz", sample_rate));
        }

        self.ensure_whisper()?;

        let start = std::time::Instant::now();

        let mut guard = self.whisper.lock().map_err(|e| anyhow!("Lock error: {}", e))?;
        let recognizer = guard.as_mut().ok_or_else(|| anyhow!("Whisper not initialized"))?;

        let result = recognizer.transcribe(sample_rate, audio);
        let elapsed = start.elapsed();

        tracing::debug!(
            "Transcribed {} samples in {:?}: '{}'",
            audio.len(),
            elapsed,
            result.text
        );

        Ok(TranscriptResult {
            text: result.text,
            language: Some("en".to_string()), // TODO: detect from result
            duration_ms: elapsed.as_millis() as u64,
        })
    }

    /// Synthesize text to speech (TTS)
    /// Returns f32 audio samples
    pub fn synthesize(&self, text: &str, speaker_id: i32, speed: f32) -> Result<SpeechResult> {
        self.ensure_kokoro()?;

        let start = std::time::Instant::now();

        let mut guard = self.kokoro.lock().map_err(|e| anyhow!("Lock error: {}", e))?;
        let tts = guard.as_mut().ok_or_else(|| anyhow!("Kokoro not initialized"))?;

        let audio = tts.create(text, speaker_id, speed)
            .map_err(|e| anyhow!("TTS synthesis failed: {}", e))?;

        let elapsed = start.elapsed();

        tracing::debug!(
            "Synthesized '{}' with speaker {} in {:?} ({} samples)",
            text,
            speaker_id,
            elapsed,
            audio.samples.len()
        );

        Ok(SpeechResult {
            audio: audio.samples,
            sample_rate: audio.sample_rate,
            duration_ms: elapsed.as_millis() as u64,
        })
    }

    /// Synthesize with default speaker (0) and normal speed (1.0)
    pub fn speak(&self, text: &str) -> Result<SpeechResult> {
        self.synthesize(text, 0, 1.0)
    }

    /// Get download instructions for missing models
    pub fn download_instructions(&self) -> String {
        let status = self.verify_models();
        let mut instructions = String::new();

        if !status.whisper_ready {
            instructions.push_str(&format!(
                "=== Whisper STT Model ===\n\
                Missing: {:?}\n\
                Download and extract to: {}\n\
                \n\
                wget https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-medium.tar.bz2\n\
                tar xf sherpa-onnx-whisper-medium.tar.bz2\n\
                mv sherpa-onnx-whisper-medium/* {}/\n\n",
                status.whisper_missing,
                self.paths.whisper_dir.display(),
                self.paths.whisper_dir.display()
            ));
        }

        if !status.kokoro_ready {
            instructions.push_str(&format!(
                "=== Kokoro TTS Model ===\n\
                Missing: {:?}\n\
                Download and extract to: {}\n\
                \n\
                wget https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2\n\
                tar xf kokoro-multi-lang-v1_0.tar.bz2\n\
                # Copy contents to kokoro/ directory\n\n",
                status.kokoro_missing,
                self.paths.kokoro_dir.display()
            ));
        }

        if instructions.is_empty() {
            instructions = "All models are ready!".to_string();
        }

        instructions
    }
}

// Removed Default impl for VoiceBackend

#[cfg(test)]
mod tests {
    use super::*;

    fn test_paths() -> ModelPaths {
        // Use a temp directory for tests - models won't exist but that's OK
        ModelPaths::new(std::path::PathBuf::from(r"D:\localdev\dp_alpha\models"))
    }

    #[test]
    fn test_verify_models() {
        let backend = VoiceBackend::with_paths(test_paths());
        let status = backend.verify_models();
        println!("Model status: {}", status);
        println!("\nDownload instructions:\n{}", backend.download_instructions());
    }

    #[test]
    fn test_list_voices() {
        let backend = VoiceBackend::with_paths(test_paths());
        let voices = backend.list_voices().unwrap();
        println!("Available voices: {:?}", voices);
    }
}
