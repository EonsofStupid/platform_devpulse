//! Response types for Tauri commands
//!
//! All types that are serialized to the frontend live here.
//! This provides a single source of truth for the API contract.

use engine::ConfigEntry;
use serde::Serialize;

// ============== Chat Types ==============

/// Chat response for frontend
#[derive(Debug, Clone, Serialize)]
pub struct ChatResult {
    pub message: String,
    pub tokens_used: u32,
    pub is_stub: bool,
}

/// History message for frontend
#[derive(Debug, Clone, Serialize)]
pub struct HistoryMessage {
    pub role: String,
    pub content: String,
    pub timestamp: i64,
}

// ============== Status Types ==============

/// Engine status for frontend
#[derive(Debug, Clone, Serialize)]
pub struct StatusInfo {
    pub ai_ready: bool,
    pub voice_ready: bool,
    pub projects_count: usize,
    pub sessions_count: usize,
    pub active_adapter: String,
}

// ============== Voice Types ==============

/// Voice status for frontend
#[derive(Debug, Clone, Serialize)]
pub struct VoiceStatus {
    pub stt_ready: bool,
    pub tts_ready: bool,
    pub stt_missing: Vec<String>,
    pub tts_missing: Vec<String>,
}

/// Voice discovery result for frontend
#[derive(Debug, Clone, Serialize)]
pub struct VoiceDiscoveryJson {
    pub scanned_path: String,
    pub whisper_models: Vec<WhisperModelJson>,
    pub kokoro_models: Vec<KokoroModelJson>,
    pub errors: Vec<String>,
    pub has_stt: bool,
    pub has_tts: bool,
}

/// Discovered Whisper model for frontend
#[derive(Debug, Clone, Serialize)]
pub struct WhisperModelJson {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size: String,
    pub ready: bool,
    pub missing: Vec<String>,
}

/// Discovered Kokoro model for frontend
#[derive(Debug, Clone, Serialize)]
pub struct KokoroModelJson {
    pub id: String,
    pub name: String,
    pub path: String,
    pub ready: bool,
    pub missing: Vec<String>,
    pub voices: Vec<String>,
}

impl From<orchestrator::infra::audio::voice::voice_discovery::VoiceDiscoveryResult> for VoiceDiscoveryJson {
    fn from(result: orchestrator::infra::audio::voice::voice_discovery::VoiceDiscoveryResult) -> Self {
        Self {
            scanned_path: result.scanned_path.to_string_lossy().to_string(),
            has_stt: result.has_stt(),
            has_tts: result.has_tts(),
            whisper_models: result
                .whisper_models
                .into_iter()
                .map(|m| WhisperModelJson {
                    id: m.id,
                    name: m.name,
                    path: m.path.to_string_lossy().to_string(),
                    size: m.size,
                    ready: m.ready,
                    missing: m.missing,
                })
                .collect(),
            kokoro_models: result
                .kokoro_models
                .into_iter()
                .map(|m| KokoroModelJson {
                    id: m.id,
                    name: m.name,
                    path: m.path.to_string_lossy().to_string(),
                    ready: m.ready,
                    missing: m.missing,
                    voices: m.voices,
                })
                .collect(),
            errors: result.errors,
        }
    }
}

// ============== Indexing Types ==============

/// Progress event payload for frontend (must match IndexingProgress.svelte)
#[derive(Debug, Clone, Serialize)]
pub struct IndexProgressEvent {
    pub stage: String,
    pub current: usize,
    pub total: usize,
    pub files_scanned: usize,
    pub chunks_processed: usize,
    pub error: Option<String>,
}

/// Indexing result
#[derive(Debug, Clone, Serialize)]
pub struct IndexingResult {
    pub files_scanned: usize,
    pub chunks_created: usize,
    pub embeddings_generated: usize,
    pub points_uploaded: usize,
    pub duration_ms: u64,
    pub errors: Vec<String>,
}

// ============== Model Types ==============

/// Model loading event payload for frontend
#[derive(Debug, Clone, Serialize)]
pub struct ModelLoadEvent {
    pub model_id: String,
    pub stage: String,
    pub progress_pct: u8,
    pub error: Option<String>,
}

/// Model path check result
#[derive(Debug, Clone, Serialize)]
pub struct ModelPathCheck {
    pub exists: bool,
    pub model_count: usize,
    pub models: Vec<String>,
}

/// Discovered model info for frontend
#[derive(Debug, Clone, Serialize)]
pub struct DiscoveredModel {
    pub id: String,
    pub name: String,
    pub path: String,
    pub mmproj_path: Option<String>,
    pub params_b: Option<f32>,
    pub quantization: Option<String>,
    pub family: Option<String>,
    pub is_vl: bool,
    pub vram_gb: f32,
    pub size_human: String,
}

// ============== Config Types ==============

/// Serializable config entry for frontend
#[derive(Debug, Clone, Serialize)]
pub struct ConfigEntryJson {
    pub key: String,
    pub value: String,
    pub category: String,
    pub description: Option<String>,
    pub updated_at: i64,
}

impl From<ConfigEntry> for ConfigEntryJson {
    fn from(entry: ConfigEntry) -> Self {
        Self {
            key: entry.key,
            value: entry.value,
            category: entry.category,
            description: entry.description,
            updated_at: entry.updated_at,
        }
    }
}
