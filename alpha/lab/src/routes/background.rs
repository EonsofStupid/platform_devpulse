// lab/src/routes/background.rs

//! Background process and model status endpoints
//!
//! Provides real system status from Engine's SystemStatus tracker.

use axum::{extract::State, routing::get, Json, Router};
use engine::{ComponentStatus, LoadState, SystemStatusSnapshot};
use serde::Serialize;
use std::sync::Arc;

use crate::state::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/status", get(get_status))
        .route("/minions", get(get_minions))
        .route("/models", get(get_models))
        .route("/system", get(get_system_status))
        .route("/snapshot", get(get_snapshot))
}

// =============================================================================
// NEW: Real System Status Endpoint
// =============================================================================

#[derive(Serialize)]
pub struct SystemStatusResponse {
    pub uptime_secs: u64,
    pub health: String,
    pub total_vram_mb: u64,
    pub total_ram_mb: u64,
    pub components: Vec<ComponentInfo>,
}

#[derive(Serialize)]
pub struct ComponentInfo {
    pub id: String,
    pub name: String,
    pub status: String,
    pub memory_mb: u64,
    pub device: Option<String>,
    pub load_time_ms: Option<u64>,
    pub error: Option<String>,
}

fn load_state_to_string(state: &LoadState) -> (String, Option<String>) {
    match state {
        LoadState::NotLoaded => ("not_loaded".to_string(), None),
        LoadState::Loading => ("loading".to_string(), None),
        LoadState::Loaded => ("loaded".to_string(), None),
        LoadState::Failed { error } => ("failed".to_string(), Some(error.clone())),
        LoadState::Skipped => ("skipped".to_string(), None),
    }
}

fn component_to_info(id: &str, name: &str, status: &ComponentStatus) -> ComponentInfo {
    let (status_str, error) = load_state_to_string(&status.state);
    ComponentInfo {
        id: id.to_string(),
        name: name.to_string(),
        status: status_str,
        memory_mb: status.memory_mb,
        device: status.device.clone(),
        load_time_ms: status.load_time_ms,
        error,
    }
}

/// GET /api/background/system - Real system status from Engine
async fn get_system_status(State(state): State<Arc<AppState>>) -> Json<SystemStatusResponse> {
    let snapshot: SystemStatusSnapshot = state.engine.system_status.snapshot();

    let components = vec![
        component_to_info("database", "libSQL Database", &snapshot.database),
        component_to_info("analytics", "DuckDB Analytics", &snapshot.analytics),
        component_to_info("embedder", "Embedder (Qwen3-0.6B)", &snapshot.embedder),
        component_to_info("reranker", "Reranker (Qwen3-0.6B)", &snapshot.reranker),
        component_to_info("llm", "Llm (Qwen3-VL-4B)", &snapshot.llm),
        component_to_info("voice_tts", "TTS (Kokoro)", &snapshot.voice_tts),
        component_to_info("voice_stt", "STT (Whisper)", &snapshot.voice_stt),
        component_to_info("rro", "Vector Store (RRO)", &snapshot.rro),
    ];

    Json(SystemStatusResponse {
        uptime_secs: snapshot.uptime_secs,
        health: state.engine.system_status.overall_health().to_string(),
        total_vram_mb: state.engine.system_status.total_vram_mb(),
        total_ram_mb: state.engine.system_status.total_ram_mb(),
        components,
    })
}

/// GET /api/background/snapshot - Raw SystemStatusSnapshot from Engine
///
/// Returns the complete snapshot directly for full observability.
/// Use this for debugging and detailed diagnostics.
async fn get_snapshot(State(state): State<Arc<AppState>>) -> Json<SystemStatusSnapshot> {
    let snapshot: SystemStatusSnapshot = state.engine.system_status.snapshot();
    Json(snapshot)
}

// =============================================================================
// LEGACY: Backward-compatible endpoints (kept for existing UI)
// =============================================================================

#[derive(Serialize)]
pub struct BackgroundStatus {
    pub processes: Vec<ProcessStatus>,
    pub storage_sync: StorageSyncStatus,
}

#[derive(Serialize)]
pub struct ProcessStatus {
    pub id: String,
    pub name: String,
    pub status: String,
    pub last_run: Option<String>,
    pub cpu_percent: f32,
    pub memory_mb: f32,
}

#[derive(Serialize)]
pub struct StorageSyncStatus {
    pub hot_count: u32,
    pub warm_count: u32,
    pub cold_count: u32,
    pub sync_rate_per_sec: f32,
}

/// GET /api/background/status - Legacy endpoint with real data
async fn get_status(State(state): State<Arc<AppState>>) -> Json<BackgroundStatus> {
    let snapshot: SystemStatusSnapshot = state.engine.system_status.snapshot();

    // Convert component status to process status for backward compatibility
    let mut processes = Vec::new();

    let add_process = |processes: &mut Vec<ProcessStatus>, id: &str, name: &str, cs: &ComponentStatus| {
        let (status_str, _) = load_state_to_string(&cs.state);
        processes.push(ProcessStatus {
            id: id.to_string(),
            name: name.to_string(),
            status: status_str,
            last_run: cs.last_used.clone(),
            cpu_percent: 0.0, // Not tracked yet
            memory_mb: cs.memory_mb as f32,
        });
    };

    add_process(&mut processes, "signal-router", "Signal Router", &ComponentStatus {
        name: "signal-router".to_string(),
        state: LoadState::Loaded,
        memory_mb: 2,
        device: None,
        load_time_ms: None,
        last_used: Some(chrono::Utc::now().to_rfc3339()),
        details: None,
    });
    add_process(&mut processes, "database", "libSQL Database", &snapshot.database);
    add_process(&mut processes, "analytics", "DuckDB Analytics", &snapshot.analytics);
    add_process(&mut processes, "embedder", "Embedder Backend", &snapshot.embedder);
    add_process(&mut processes, "reranker", "Reranker Backend", &snapshot.reranker);
    add_process(&mut processes, "llm", "Llm (VLM)", &snapshot.llm);

    Json(BackgroundStatus {
        processes,
        storage_sync: StorageSyncStatus {
            hot_count: 0,
            warm_count: 0,
            cold_count: 0,
            sync_rate_per_sec: 0.0,
        },
    })
}

#[derive(Serialize)]
pub struct MinionStatus {
    pub name: String,
    pub active: bool,
    pub signals_pending: u32,
    pub last_signal: Option<String>,
    pub health: String,
}

/// GET /api/background/minions
async fn get_minions(State(_state): State<Arc<AppState>>) -> Json<Vec<MinionStatus>> {
    // Minion system not implemented yet - return placeholder
    Json(vec![
        MinionStatus {
            name: "keystroke-prefetch".to_string(),
            active: false,
            signals_pending: 0,
            last_signal: None,
            health: "not_implemented".to_string(),
        },
        MinionStatus {
            name: "pause-assembler".to_string(),
            active: false,
            signals_pending: 0,
            last_signal: None,
            health: "not_implemented".to_string(),
        },
        MinionStatus {
            name: "context-retriever".to_string(),
            active: false,
            signals_pending: 0,
            last_signal: None,
            health: "not_implemented".to_string(),
        },
    ])
}

#[derive(Serialize)]
pub struct ModelStatus {
    pub embedder: ModelInfo,
    pub reranker: ModelInfo,
    pub llm: ModelInfo,
    pub voice_tts: ModelInfo,
    pub voice_stt: ModelInfo,
}

#[derive(Serialize)]
pub struct ModelInfo {
    pub name: String,
    pub loaded: bool,
    pub status: String,
    pub memory_mb: u64,
    pub device: Option<String>,
    pub load_time_ms: Option<u64>,
    pub error: Option<String>,
}

fn component_to_model_info(name: &str, cs: &ComponentStatus) -> ModelInfo {
    let (status_str, error) = load_state_to_string(&cs.state);
    ModelInfo {
        name: name.to_string(),
        loaded: matches!(cs.state, LoadState::Loaded),
        status: status_str,
        memory_mb: cs.memory_mb,
        device: cs.device.clone(),
        load_time_ms: cs.load_time_ms,
        error,
    }
}

/// GET /api/background/models - Model status from real system state
async fn get_models(State(state): State<Arc<AppState>>) -> Json<ModelStatus> {
    let snapshot = state.engine.system_status.snapshot();

    Json(ModelStatus {
        embedder: component_to_model_info("Qwen3-Embedding-0.6B", &snapshot.embedder),
        reranker: component_to_model_info("Qwen3-Reranker-0.6B", &snapshot.reranker),
        llm: component_to_model_info("Qwen3-VL-4B", &snapshot.llm),
        voice_tts: component_to_model_info("Kokoro TTS", &snapshot.voice_tts),
        voice_stt: component_to_model_info("Whisper", &snapshot.voice_stt),
    })
}
