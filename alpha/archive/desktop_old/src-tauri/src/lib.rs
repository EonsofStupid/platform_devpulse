//! DevPulse Desktop - Tauri backend
//!
//! Thin layer that exposes engine functionality to the SvelteKit frontend.
//! Desktop never touches orchestrator directly - all access through engine.

mod capture;

use engine::{ConfigEntry, Engine, EngineConfig, Project, Session, SystemStatusSnapshot};
use serde::Serialize;
use shared::types::ids::SessionId;
use std::io::Cursor;
use std::sync::Arc;
use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};
use tauri::{Manager, State};
use tokio::sync::{Mutex, OnceCell};

/// Application state - engine + active session
pub struct AppState {
    engine: OnceCell<Arc<Engine>>,
    /// Current active session for chat
    active_session: Mutex<Option<Session>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            engine: OnceCell::new(),
            active_session: Mutex::new(None),
        }
    }
}

impl AppState {
    /// Get or initialize the engine (Desktop mode - no analytics)
    async fn engine(&self) -> Result<&Arc<Engine>, String> {
        self.engine
            .get_or_try_init(|| async {
                Engine::init(EngineConfig::desktop())
                    .await
                    .map(Arc::new)
                    .map_err(|e| e.to_string())
            })
            .await
            .map_err(|e| e.to_string())
    }

    /// Get or create the active session
    async fn get_or_create_session(&self, engine: &Engine) -> Result<SessionId, String> {
        let mut session = self.active_session.lock().await;

        if let Some(ref s) = *session {
            // Parse existing session ID
            let uuid = s.id.parse::<uuid::Uuid>()
                .map_err(|e| format!("Invalid session ID: {}", e))?;
            return Ok(SessionId::from_uuid(uuid));
        }

        // Create new session (no project selected)
        let new_session = engine.sessions.create(None).await
            .map_err(|e| format!("Failed to create session: {}", e))?;

        let uuid = new_session.id.parse::<uuid::Uuid>()
            .map_err(|e| format!("Invalid session ID: {}", e))?;
        let session_id = SessionId::from_uuid(uuid);

        *session = Some(new_session);
        Ok(session_id)
    }
}

// ============== Response Types ==============

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

/// Engine status for frontend
#[derive(Debug, Clone, Serialize)]
pub struct StatusInfo {
    pub ai_ready: bool,
    pub voice_ready: bool,
    pub projects_count: usize,
    pub sessions_count: usize,
    pub active_adapter: String,
}

/// Hardware metrics for frontend dashboard
#[derive(Debug, Clone, Serialize)]
pub struct HardwareMetrics {
    /// CPU usage percentage (0-100)
    pub cpu_usage_pct: f32,
    /// Total RAM in GB
    pub ram_total_gb: f32,
    /// Used RAM in GB
    pub ram_used_gb: f32,
    /// RAM usage percentage (0-100)
    pub ram_usage_pct: f32,
    /// GPU info (if available)
    pub gpu: Option<GpuMetrics>,
}

/// GPU metrics (NVIDIA via NVML or Windows DXGI)
#[derive(Debug, Clone, Serialize)]
pub struct GpuMetrics {
    /// GPU name
    pub name: String,
    /// Total VRAM in GB
    pub vram_total_gb: f32,
    /// Used VRAM in GB
    pub vram_used_gb: f32,
    /// VRAM usage percentage (0-100)
    pub vram_usage_pct: f32,
    /// GPU utilization percentage (0-100), if available
    pub utilization_pct: Option<f32>,
    /// GPU temperature in Celsius, if available
    pub temperature_c: Option<f32>,
}

// ============== Tauri Commands ==============

/// Chat with the assistant
#[tauri::command]
async fn chat(message: String, state: State<'_, AppState>) -> Result<ChatResult, String> {
    let engine = state.engine().await?;
    let session_id = state.get_or_create_session(engine).await?;
    let response = engine.chat.send(&message, &session_id).await.map_err(|e| e.to_string())?;

    Ok(ChatResult {
        message: response.message,
        tokens_used: response.tokens_used,
        is_stub: response.is_stub,
    })
}

/// Get chat history for current session
#[tauri::command]
async fn get_chat_history(limit: Option<u32>, state: State<'_, AppState>) -> Result<Vec<HistoryMessage>, String> {
    let engine = state.engine().await?;
    let session_id = state.get_or_create_session(engine).await?;

    let messages = engine
        .get_chat_history(&session_id, limit.unwrap_or(100))
        .await
        .map_err(|e| e.to_string())?;

    Ok(messages
        .into_iter()
        .map(|m| HistoryMessage {
            role: match m.role {
                engine::facade::Role::User => "user".to_string(),
                engine::facade::Role::Assistant => "assistant".to_string(),
                engine::facade::Role::System => "system".to_string(),
            },
            content: m.content,
            timestamp: m.timestamp,
        })
        .collect())
}

/// List all registered projects
#[tauri::command]
async fn list_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let engine = state.engine().await?;
    Ok(engine.projects.list().await)
}

/// Add a new project by path
#[tauri::command]
async fn add_project(path: String, state: State<'_, AppState>) -> Result<Project, String> {
    let engine = state.engine().await?;
    engine.projects.add(&path).await.map_err(|e| e.to_string())
}

/// Remove a project
#[tauri::command]
async fn remove_project(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine.projects.remove(&id).await.map_err(|e| e.to_string())
}

/// Select a project as active
#[tauri::command]
async fn select_project(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine.projects.select(&id).await.map_err(|e| e.to_string())
}

/// Get selected project
#[tauri::command]
async fn get_selected_project(state: State<'_, AppState>) -> Result<Option<Project>, String> {
    let engine = state.engine().await?;
    Ok(engine.projects.selected().await)
}

/// Browse for a folder using native dialog
#[tauri::command]
async fn browse_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let folder = app.dialog().file().blocking_pick_folder();
    Ok(folder.map(|p| p.to_string()))
}

/// Get engine status
#[tauri::command]
async fn get_status(state: State<'_, AppState>) -> Result<StatusInfo, String> {
    let engine = state.engine().await?;
    let status = engine.status().await;

    Ok(StatusInfo {
        ai_ready: status.ai_ready,
        voice_ready: status.voice_ready,
        projects_count: status.projects_count,
        sessions_count: status.sessions_count,
        active_adapter: status.active_adapter,
    })
}

/// Get detailed system status (components: rro, embedder, llm, etc)
#[tauri::command]
async fn get_system_status(state: State<'_, AppState>) -> Result<SystemStatusSnapshot, String> {
    let engine = state.engine().await?;
    Ok(engine.system_status.snapshot())
}

/// Get available adapters
#[tauri::command]
async fn get_adapters(state: State<'_, AppState>) -> Result<Vec<engine::AdapterInfo>, String> {
    let engine = state.engine().await?;
    Ok(engine.adapters.list())
}

/// Set active adapter
#[tauri::command]
async fn set_adapter(kind: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine.adapters.set_active_str(&kind).map_err(|e| e.to_string())
}

/// Get analytics stats for dashboard (user-facing subset)
#[tauri::command]
async fn get_analytics(state: State<'_, AppState>) -> Result<engine::AnalyticsSummary, String> {
    let engine = state.engine().await?;
    engine.get_user_analytics().await.map_err(|e| e.to_string())
}

/// Get hardware metrics (CPU, RAM, GPU/VRAM)
#[tauri::command]
async fn get_hardware_metrics() -> Result<HardwareMetrics, String> {
    // CPU and RAM via sysinfo
    let mut sys = System::new();
    sys.refresh_specifics(
        RefreshKind::new()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything()),
    );

    // Need to wait a moment for CPU usage to be accurate
    std::thread::sleep(std::time::Duration::from_millis(100));
    sys.refresh_cpu_usage();

    let cpu_usage_pct = sys.global_cpu_usage();
    let ram_total_gb = sys.total_memory() as f32 / 1_073_741_824.0; // bytes to GB
    let ram_used_gb = sys.used_memory() as f32 / 1_073_741_824.0;
    let ram_usage_pct = if ram_total_gb > 0.0 {
        (ram_used_gb / ram_total_gb) * 100.0
    } else {
        0.0
    };

    // GPU metrics - Windows DXGI for now (NVML optional)
    let gpu = get_gpu_metrics();

    Ok(HardwareMetrics {
        cpu_usage_pct,
        ram_total_gb,
        ram_used_gb,
        ram_usage_pct,
        gpu,
    })
}

/// Get GPU metrics via Windows DXGI
#[cfg(target_os = "windows")]
fn get_gpu_metrics() -> Option<GpuMetrics> {
    use windows::Win32::Graphics::Dxgi::*;
    use windows::core::Interface;

    unsafe {
        // Create DXGI factory
        let factory: IDXGIFactory4 = match CreateDXGIFactory2(DXGI_CREATE_FACTORY_FLAGS(0)) {
            Ok(f) => f,
            Err(_) => return None,
        };

        // Get first adapter (primary GPU)
        let adapter: IDXGIAdapter3 = match factory.EnumAdapters1(0) {
            Ok(a) => match a.cast() {
                Ok(a3) => a3,
                Err(_) => return None,
            },
            Err(_) => return None,
        };

        // Get adapter description
        let desc = match adapter.GetDesc() {
            Ok(d) => d,
            Err(_) => return None,
        };

        // Convert name from wide string
        let name_len = desc.Description.iter().position(|&c| c == 0).unwrap_or(desc.Description.len());
        let name = String::from_utf16_lossy(&desc.Description[..name_len]);

        // Get memory info
        let mut mem_info = DXGI_QUERY_VIDEO_MEMORY_INFO::default();
        if adapter.QueryVideoMemoryInfo(0, DXGI_MEMORY_SEGMENT_GROUP_LOCAL, &mut mem_info).is_err() {
            return None;
        }

        let vram_total_gb = mem_info.Budget as f32 / 1_073_741_824.0;
        let vram_used_gb = mem_info.CurrentUsage as f32 / 1_073_741_824.0;
        let vram_usage_pct = if vram_total_gb > 0.0 {
            (vram_used_gb / vram_total_gb) * 100.0
        } else {
            0.0
        };

        Some(GpuMetrics {
            name,
            vram_total_gb,
            vram_used_gb,
            vram_usage_pct,
            utilization_pct: None, // DXGI doesn't provide this, need NVML
            temperature_c: None,   // DXGI doesn't provide this, need NVML
        })
    }
}

#[cfg(not(target_os = "windows"))]
fn get_gpu_metrics() -> Option<GpuMetrics> {
    // TODO: macOS/Linux GPU metrics via different APIs
    None
}

// ============== Project Indexing ==============

/// Index a project - walks files, chunks code, embeds, stores to RRO
/// Emits 'indexing-progress' events to frontend
#[tauri::command]
async fn index_project(
    project_id: String,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<IndexingResult, String> {
    use tauri::Emitter;

    let engine = state.engine().await?;

    // Verify project exists
    let _project = engine
        .projects
        .get(&project_id)
        .await
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    // Emit initial progress
    let _ = app.emit("indexing-progress", IndexProgressEvent {
        stage: "scanning".to_string(),
        current: 0,
        total: 0,
        files_scanned: 0,
        chunks_processed: 0,
        error: None,
    });

    // Clone app handle for the closure
    let app_clone = app.clone();

    // Start indexing
    match engine.index_project(&project_id, move |progress| {
        let stage_str = match &progress.stage {
            engine::IndexStage::Scanning => "scanning",
            engine::IndexStage::Chunking => "chunking",
            engine::IndexStage::Embedding => "embedding",
            engine::IndexStage::Uploading => "uploading",
            engine::IndexStage::Complete => "complete",
            engine::IndexStage::Error => "error",
        };
        let _ = app_clone.emit("indexing-progress", IndexProgressEvent {
            stage: stage_str.to_string(),
            current: progress.current as usize,
            total: progress.total as usize,
            files_scanned: progress.files_scanned as usize,
            chunks_processed: progress.chunks_processed as usize,
            error: None,
        });
    }).await {
        Ok(stats) => {
            // Emit completion
            let _ = app.emit("indexing-progress", IndexProgressEvent {
                stage: "complete".to_string(),
                current: stats.points_uploaded as usize,
                total: stats.points_uploaded as usize,
                files_scanned: stats.files_scanned as usize,
                chunks_processed: stats.chunks_created as usize,
                error: None,
            });

            Ok(IndexingResult {
                files_scanned: stats.files_scanned as usize,
                chunks_created: stats.chunks_created as usize,
                embeddings_generated: stats.embeddings_generated as usize,
                points_uploaded: stats.points_uploaded as usize,
                duration_ms: stats.duration_ms,
                errors: stats.errors,
            })
        }
        Err(e) => {
            // Emit error
            let _ = app.emit("indexing-progress", IndexProgressEvent {
                stage: "error".to_string(),
                current: 0,
                total: 0,
                files_scanned: 0,
                chunks_processed: 0,
                error: Some(e.to_string()),
            });
            Err(e.to_string())
        }
    }
}

/// Progress event payload for frontend (must match IndexingProgress.svelte)
#[derive(Debug, Clone, Serialize)]
struct IndexProgressEvent {
    stage: String,
    current: usize,
    total: usize,
    files_scanned: usize,
    chunks_processed: usize,
    error: Option<String>,
}

/// Indexing result
#[derive(Debug, Clone, Serialize)]
struct IndexingResult {
    files_scanned: usize,
    chunks_created: usize,
    embeddings_generated: usize,
    points_uploaded: usize,
    duration_ms: u64,
    errors: Vec<String>,
}

// ============== Voice Commands ==============

/// Voice status for frontend
#[derive(Debug, Clone, Serialize)]
pub struct VoiceStatus {
    pub stt_ready: bool,
    pub tts_ready: bool,
    pub stt_missing: Vec<String>,
    pub tts_missing: Vec<String>,
}

/// Get voice status
#[tauri::command]
async fn get_voice_status(state: State<'_, AppState>) -> Result<VoiceStatus, String> {
    let engine = state.engine().await?;
    let model_status = engine.voice.model_status();

    Ok(VoiceStatus {
        stt_ready: model_status.whisper_ready,
        tts_ready: model_status.kokoro_ready,
        stt_missing: model_status.whisper_missing.clone(),
        tts_missing: model_status.kokoro_missing.clone(),
    })
}

/// Speak text (TTS)
#[tauri::command]
async fn speak(text: String, state: State<'_, AppState>) -> Result<Vec<u8>, String> {
    let engine = state.engine().await?;
    let result = engine.voice.speak(&text).map_err(|e| e.to_string())?;

    let wav_bytes = samples_to_wav(&result.audio, result.sample_rate);
    Ok(wav_bytes)
}

/// Transcribe audio (STT)
#[tauri::command]
async fn transcribe(audio_bytes: Vec<u8>, state: State<'_, AppState>) -> Result<String, String> {
    let engine = state.engine().await?;
    let samples = wav_to_samples(&audio_bytes)?;
    engine.voice.transcribe(&samples).map_err(|e| e.to_string())
}

/// Check voice model status (for status monitoring)
#[tauri::command]
async fn check_voice_status(state: State<'_, AppState>) -> Result<VoiceStatus, String> {
    let engine = state.engine().await?;
    let status = engine.voice.model_status();

    Ok(VoiceStatus {
        stt_ready: status.whisper_ready,
        tts_ready: status.kokoro_ready,
        stt_missing: status.whisper_missing.clone(),
        tts_missing: status.kokoro_missing.clone(),
    })
}

/// Get voice download instructions
#[tauri::command]
async fn get_voice_download_instructions(state: State<'_, AppState>) -> Result<String, String> {
    let engine = state.engine().await?;
    Ok(engine.voice.download_instructions())
}

// WAV conversion using hound crate
fn samples_to_wav(samples: &[f32], sample_rate: u32) -> Vec<u8> {
    use hound::{SampleFormat, WavSpec, WavWriter};

    let spec = WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: SampleFormat::Int,
    };

    let mut cursor = Cursor::new(Vec::new());
    let mut writer = WavWriter::new(&mut cursor, spec).unwrap();
    for &sample in samples {
        let s = (sample * 32767.0).clamp(-32768.0, 32767.0) as i16;
        writer.write_sample(s).unwrap();
    }
    writer.finalize().unwrap();
    cursor.into_inner()
}

fn wav_to_samples(wav_bytes: &[u8]) -> Result<Vec<f32>, String> {
    use hound::WavReader;

    let cursor = Cursor::new(wav_bytes);
    let mut reader = WavReader::new(cursor).map_err(|e| e.to_string())?;

    let samples: Vec<f32> = reader
        .samples::<i16>()
        .filter_map(|s| s.ok())
        .map(|s| s as f32 / 32768.0)
        .collect();

    Ok(samples)
}

// ============== Model Commands ==============

/// List all available models
#[tauri::command]
async fn list_models(state: State<'_, AppState>) -> Result<Vec<shared::types::models::ModelInfo>, String> {
    let engine = state.engine().await?;
    engine.models.list_all().map_err(|e| e.to_string())
}

/// List models by family (vl, embed, rerank)
#[tauri::command]
async fn list_models_by_family(
    family: String,
    state: State<'_, AppState>,
) -> Result<Vec<shared::types::models::ModelInfo>, String> {
    let engine = state.engine().await?;
    let family = parse_model_family(&family)?;
    engine.models.list_family(family).map_err(|e| e.to_string())
}

/// Get model summary
#[tauri::command]
async fn get_model_summary(state: State<'_, AppState>) -> Result<shared::types::models::ModelSummary, String> {
    let engine = state.engine().await?;
    engine.models.summary().map_err(|e| e.to_string())
}

/// Set active model (with persistence)
#[tauri::command]
async fn set_active_model(
    id: String,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    use tauri::Emitter;

    let engine = state.engine().await?;

    // Emit loading started
    let _ = app.emit("model-loading", ModelLoadEvent {
        model_id: id.clone(),
        stage: "starting".to_string(),
        progress_pct: 0,
        error: None,
    });

    // Get database reference and set active with persistence
    let db = engine.database();
    match engine.models.set_active_with_persistence(&id, &db).await {
        Ok(()) => {
            let _ = app.emit("model-loading", ModelLoadEvent {
                model_id: id,
                stage: "complete".to_string(),
                progress_pct: 100,
                error: None,
            });
            Ok(())
        }
        Err(e) => {
            let _ = app.emit("model-loading", ModelLoadEvent {
                model_id: id,
                stage: "error".to_string(),
                progress_pct: 0,
                error: Some(e.to_string()),
            });
            Err(e.to_string())
        }
    }
}

/// Get model load states
#[tauri::command]
async fn get_model_load_states(
    state: State<'_, AppState>,
) -> Result<std::collections::HashMap<String, shared::types::models::ModelLoadState>, String> {
    let engine = state.engine().await?;
    engine.models.get_load_states().map_err(|e| e.to_string())
}

/// Model loading event payload for frontend
#[derive(Debug, Clone, Serialize)]
struct ModelLoadEvent {
    model_id: String,
    stage: String,
    progress_pct: u8,
    error: Option<String>,
}

/// Parse model family string to enum
fn parse_model_family(s: &str) -> Result<shared::types::models::ModelFamily, String> {
    use shared::types::models::ModelFamily;
    match s.to_lowercase().replace('-', "_").as_str() {
        "qwen3_vl" | "qwen3vl" | "vl" => Ok(ModelFamily::Qwen3VL),
        "qwen3_embed" | "qwen3embed" | "embed" => Ok(ModelFamily::Qwen3Embed),
        "qwen3_rerank" | "qwen3rerank" | "rerank" => Ok(ModelFamily::Qwen3Rerank),
        "whisper" => Ok(ModelFamily::Whisper),
        "kokoro" => Ok(ModelFamily::Kokoro),
        _ => Err(format!("Unknown model family: {}", s)),
    }
}

/// Load a VL model into VRAM
///
/// This actually loads the model weights. Use this to load 4B or 8B VL models.
#[tauri::command]
async fn load_vl_model(
    model_id: String,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    use tauri::Emitter;

    let engine = state.engine().await?;

    // Emit loading started
    let _ = app.emit("model-loading", ModelLoadEvent {
        model_id: model_id.clone(),
        stage: "loading".to_string(),
        progress_pct: 0,
        error: None,
    });

    // Load the model (this actually loads into VRAM)
    match engine.models.load_vl_model(&model_id) {
        Ok(()) => {
            let _ = app.emit("model-loading", ModelLoadEvent {
                model_id,
                stage: "complete".to_string(),
                progress_pct: 100,
                error: None,
            });
            Ok(())
        }
        Err(e) => {
            let _ = app.emit("model-loading", ModelLoadEvent {
                model_id,
                stage: "error".to_string(),
                progress_pct: 0,
                error: Some(e.to_string()),
            });
            Err(e.to_string())
        }
    }
}

/// Unload current VL model from VRAM
#[tauri::command]
async fn unload_vl_model(state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    engine.models.unload_vl_model();
    Ok(())
}

/// Get currently loaded VL model ID
#[tauri::command]
async fn get_current_vl_model(state: State<'_, AppState>) -> Result<Option<String>, String> {
    let engine = state.engine().await?;
    Ok(engine.models.current_vl_model())
}

// ============== Window Commands ==============

/// Open chat as child window
#[tauri::command]
async fn open_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    let chat = app
        .get_webview_window("chat")
        .ok_or("Chat window not configured")?;

    // Apply platform glass effect
    #[cfg(target_os = "windows")]
    {
        use window_vibrancy::apply_mica;
        let _ = apply_mica(&chat, Some(true));
    }

    #[cfg(target_os = "macos")]
    {
        use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
        let _ = apply_vibrancy(&chat, NSVisualEffectMaterial::HudWindow, None, None);
    }

    chat.show().map_err(|e| e.to_string())
}

/// Close chat window
#[tauri::command]
async fn close_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(chat) = app.get_webview_window("chat") {
        chat.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Dock chat to main window edge
#[tauri::command]
async fn dock_chat_window(app: tauri::AppHandle, edge: String) -> Result<(), String> {
    let main = app
        .get_webview_window("main")
        .ok_or("No main window")?;
    let chat = app
        .get_webview_window("chat")
        .ok_or("No chat window")?;

    let main_pos = main.outer_position().map_err(|e| e.to_string())?;
    let main_size = main.outer_size().map_err(|e| e.to_string())?;
    let chat_size = chat.outer_size().map_err(|e| e.to_string())?;

    let (x, y) = match edge.as_str() {
        "right" => (main_pos.x + main_size.width as i32, main_pos.y),
        "left" => (main_pos.x - chat_size.width as i32, main_pos.y),
        _ => (main_pos.x + main_size.width as i32, main_pos.y),
    };

    chat.set_position(tauri::PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())
}

/// Navigate main window to a route (for chat window control)
#[tauri::command]
async fn navigate_main_window(app: tauri::AppHandle, route: String) -> Result<(), String> {
    let main = app
        .get_webview_window("main")
        .ok_or("No main window")?;

    // Use eval to navigate via SvelteKit's goto
    let script = format!(
        r#"
        if (window.__TAURI_INTERNALS__) {{
            window.location.href = '{}';
        }}
        "#,
        route
    );

    main.eval(&script).map_err(|e| e.to_string())
}

/// Focus the main window (bring to front)
#[tauri::command]
async fn focus_main_window(app: tauri::AppHandle) -> Result<(), String> {
    let main = app
        .get_webview_window("main")
        .ok_or("No main window")?;

    main.set_focus().map_err(|e| e.to_string())
}

/// Restore main window if minimized
#[tauri::command]
async fn restore_main_window(app: tauri::AppHandle) -> Result<(), String> {
    let main = app
        .get_webview_window("main")
        .ok_or("No main window")?;

    // Unminimize if minimized
    if main.is_minimized().unwrap_or(false) {
        main.unminimize().map_err(|e| e.to_string())?;
    }

    // Show if hidden
    if !main.is_visible().unwrap_or(true) {
        main.show().map_err(|e| e.to_string())?;
    }

    Ok(())
}

// ============== Config Commands ==============

/// Get model base path
#[tauri::command]
async fn get_model_path(app: tauri::AppHandle) -> Result<String, String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    let config_file = config_dir.join("config.json");

    if config_file.exists() {
        let content = std::fs::read_to_string(&config_file).map_err(|e| e.to_string())?;
        if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(path) = config.get("model_path").and_then(|v| v.as_str()) {
                return Ok(path.to_string());
            }
        }
    }

    // Default path
    Ok(r"D:\localdev\dp_alpha\models".to_string())
}

/// Set model base path
#[tauri::command]
async fn set_model_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;

    let config_file = config_dir.join("config.json");

    // Read existing config or create new
    let mut config: serde_json::Value = if config_file.exists() {
        let content = std::fs::read_to_string(&config_file).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // Update model_path
    config["model_path"] = serde_json::json!(path);

    // Write back
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    std::fs::write(&config_file, content).map_err(|e| e.to_string())?;

    Ok(())
}

/// Check if a path exists and contains models
#[tauri::command]
async fn check_model_path(path: String) -> Result<ModelPathCheck, String> {
    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Ok(ModelPathCheck {
            exists: false,
            model_count: 0,
            models: vec![],
        });
    }

    // Look for model directories (folders containing .gguf files)
    let mut models = Vec::new();
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            if entry.path().is_dir() {
                // Check if directory contains .gguf files
                if let Ok(files) = std::fs::read_dir(entry.path()) {
                    let has_gguf = files
                        .flatten()
                        .any(|f| f.path().extension().map(|e| e == "gguf").unwrap_or(false));
                    if has_gguf {
                        models.push(entry.file_name().to_string_lossy().to_string());
                    }
                }
            }
        }
    }

    Ok(ModelPathCheck {
        exists: true,
        model_count: models.len(),
        models,
    })
}

#[derive(Serialize)]
struct ModelPathCheck {
    exists: bool,
    model_count: usize,
    models: Vec<String>,
}

// ============== Discovery Commands ==============

/// Discovered model info for frontend
#[derive(Debug, Clone, Serialize)]
struct DiscoveredModel {
    id: String,
    name: String,
    path: String,
    mmproj_path: Option<String>,
    params_b: Option<f32>,
    quantization: Option<String>,
    family: Option<String>,
    is_vl: bool,
    vram_gb: f32,
    size_human: String,
}

/// Scan a directory for GGUF models
#[tauri::command]
async fn scan_models(path: String, state: State<'_, AppState>) -> Result<Vec<DiscoveredModel>, String> {
    let engine = state.engine().await?;

    let models = engine.discovery.scan_directory(&path)
        .map_err(|e| e.to_string())?;

    Ok(models.into_iter().map(|m| DiscoveredModel {
        id: m.id.clone(),
        name: m.name.clone(),
        path: m.path.to_string_lossy().to_string(),
        mmproj_path: m.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
        params_b: m.params_b,
        quantization: m.quantization.clone(),
        family: m.family.clone(),
        is_vl: m.is_vl,
        vram_gb: m.vram_estimate_gb,
        size_human: m.size_human(),
    }).collect())
}

/// Set model directory and refresh discovery
#[tauri::command]
async fn set_model_directory(path: String, state: State<'_, AppState>) -> Result<Vec<DiscoveredModel>, String> {
    let engine = state.engine().await?;

    // Set the path (this also refreshes models)
    engine.discovery.set_model_path(&path).await
        .map_err(|e| e.to_string())?;

    // Return discovered models
    let models = engine.discovery.models().await;

    Ok(models.into_iter().map(|m| DiscoveredModel {
        id: m.id.clone(),
        name: m.name.clone(),
        path: m.path.as_ref().map(|p| p.to_string_lossy().to_string()).unwrap_or_default(),
        mmproj_path: m.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
        params_b: m.params_b,
        quantization: m.quantization.clone(),
        family: m.family.clone(),
        is_vl: m.is_vl,
        vram_gb: m.vram_gb,
        size_human: m.size_human.clone(),
    }).collect())
}

/// Get discovered models (cached)
#[tauri::command]
async fn get_discovered_models(state: State<'_, AppState>) -> Result<Vec<DiscoveredModel>, String> {
    let engine = state.engine().await?;
    let models = engine.discovery.models().await;

    Ok(models.into_iter().map(|m| DiscoveredModel {
        id: m.id.clone(),
        name: m.name.clone(),
        path: m.path.as_ref().map(|p| p.to_string_lossy().to_string()).unwrap_or_default(),
        mmproj_path: m.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
        params_b: m.params_b,
        quantization: m.quantization.clone(),
        family: m.family.clone(),
        is_vl: m.is_vl,
        vram_gb: m.vram_gb,
        size_human: m.size_human.clone(),
    }).collect())
}

/// Get VL models only
#[tauri::command]
async fn get_vl_models(state: State<'_, AppState>) -> Result<Vec<DiscoveredModel>, String> {
    let engine = state.engine().await?;
    let models = engine.discovery.vl_models().await;

    Ok(models.into_iter().map(|m| DiscoveredModel {
        id: m.id.clone(),
        name: m.name.clone(),
        path: m.path.as_ref().map(|p| p.to_string_lossy().to_string()).unwrap_or_default(),
        mmproj_path: m.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
        params_b: m.params_b,
        quantization: m.quantization.clone(),
        family: m.family.clone(),
        is_vl: m.is_vl,
        vram_gb: m.vram_gb,
        size_human: m.size_human.clone(),
    }).collect())
}

/// Select a model for use
#[tauri::command]
async fn select_discovered_model(id: String, state: State<'_, AppState>) -> Result<DiscoveredModel, String> {
    let engine = state.engine().await?;
    let model = engine.discovery.select_model(&id).await
        .map_err(|e| e.to_string())?;

    Ok(DiscoveredModel {
        id: model.id.clone(),
        name: model.name.clone(),
        path: model.path.as_ref().map(|p| p.to_string_lossy().to_string()).unwrap_or_default(),
        mmproj_path: model.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
        params_b: model.params_b,
        quantization: model.quantization.clone(),
        family: model.family.clone(),
        is_vl: model.is_vl,
        vram_gb: model.vram_gb,
        size_human: model.size_human.clone(),
    })
}

/// Get selected model
#[tauri::command]
async fn get_selected_model(state: State<'_, AppState>) -> Result<Option<DiscoveredModel>, String> {
    let engine = state.engine().await?;
    let model = engine.discovery.selected_model().await;

    Ok(model.map(|m| DiscoveredModel {
        id: m.id.clone(),
        name: m.name.clone(),
        path: m.path.as_ref().map(|p| p.to_string_lossy().to_string()).unwrap_or_default(),
        mmproj_path: m.mmproj_path.as_ref().map(|p| p.to_string_lossy().to_string()),
        params_b: m.params_b,
        quantization: m.quantization.clone(),
        family: m.family.clone(),
        is_vl: m.is_vl,
        vram_gb: m.vram_gb,
        size_human: m.size_human.clone(),
    }))
}

// ============== Config Management Commands ==============
// Desktop accesses its own global database for platform/user config

/// Serializable config entry for frontend
#[derive(Debug, Clone, Serialize)]
struct ConfigEntryJson {
    key: String,
    value: String,
    category: String,
    description: Option<String>,
    updated_at: i64,
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

/// Set platform config (global settings like max_context_tokens, legal text)
#[tauri::command]
async fn set_platform_config(
    key: String,
    value: String,
    category: String,
    description: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let engine = state.engine().await?;
    let db = engine.database();
    
    db.set_platform_config(&key, &value, &category, description.as_deref())
        .await
        .map_err(|e| e.to_string())
}

/// Get platform config value
#[tauri::command]
async fn get_platform_config(key: String, state: State<'_, AppState>) -> Result<Option<ConfigEntryJson>, String> {
    let engine = state.engine().await?;
    let db = engine.database();
    
    db.get_platform_config(&key)
        .await
        .map(|opt| opt.map(ConfigEntryJson::from))
        .map_err(|e| e.to_string())
}

/// List platform config (optionally filtered by category)
#[tauri::command]
async fn list_platform_config(
    category: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<ConfigEntryJson>, String> {
    let engine = state.engine().await?;
    let db = engine.database();
    
    db.list_platform_config(category.as_deref())
        .await
        .map(|entries| entries.into_iter().map(ConfigEntryJson::from).collect())
        .map_err(|e| e.to_string())
}

/// Delete platform config entry
#[tauri::command]
async fn delete_platform_config(key: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    let db = engine.database();
    
    db.delete_platform_config(&key)
        .await
        .map_err(|e| e.to_string())
}

/// Set user config (global user preferences like theme, API keys)
#[tauri::command]
async fn set_user_config(
    key: String,
    value: String,
    category: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let engine = state.engine().await?;
    let db = engine.database();
    
    db.set_user_config(&key, &value, &category)
        .await
        .map_err(|e| e.to_string())
}

/// Get user config value
#[tauri::command]
async fn get_user_config(key: String, state: State<'_, AppState>) -> Result<Option<ConfigEntryJson>, String> {
    let engine = state.engine().await?;
    let db = engine.database();
    
    db.get_user_config(&key)
        .await
        .map(|opt| opt.map(ConfigEntryJson::from))
        .map_err(|e| e.to_string())
}

/// List user config (optionally filtered by category)
#[tauri::command]
async fn list_user_config(
    category: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<ConfigEntryJson>, String> {
    let engine = state.engine().await?;
    let db = engine.database();
    
    db.list_user_config(category.as_deref())
        .await
        .map(|entries| entries.into_iter().map(ConfigEntryJson::from).collect())
        .map_err(|e| e.to_string())
}

/// Delete user config entry
#[tauri::command]
async fn delete_user_config(key: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    let db = engine.database();
    
    db.delete_user_config(&key)
        .await
        .map_err(|e| e.to_string())
}

/// Initialize and run the Tauri application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            chat,
            get_chat_history,
            list_projects,
            add_project,
            remove_project,
            select_project,
            get_selected_project,
            browse_folder,
            index_project,
            get_status,
            get_system_status,
            get_adapters,
            set_adapter,
            get_analytics,
            get_hardware_metrics,
            // Voice commands
            get_voice_status,
            check_voice_status,
            get_voice_download_instructions,
            speak,
            transcribe,
            // Model commands
            list_models,
            list_models_by_family,
            get_model_summary,
            set_active_model,
            get_model_load_states,
            load_vl_model,
            unload_vl_model,
            get_current_vl_model,
            // Window commands
            open_chat_window,
            close_chat_window,
            dock_chat_window,
            navigate_main_window,
            focus_main_window,
            restore_main_window,
            // Config commands
            get_model_path,
            set_model_path,
            check_model_path,
            // Platform/User config commands
            set_platform_config,
            get_platform_config,
            list_platform_config,
            delete_platform_config,
            set_user_config,
            get_user_config,
            list_user_config,
            delete_user_config,
            // Discovery commands
            scan_models,
            set_model_directory,
            get_discovered_models,
            get_vl_models,
            select_discovered_model,
            get_selected_model,
            // Capture commands
            capture::capture_screen,
            capture::capture_region,
            capture::list_screens,
            capture::copy_capture_to_clipboard,
            capture::save_capture,
            capture::list_captures,
            capture::load_capture,
            capture::delete_capture,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
