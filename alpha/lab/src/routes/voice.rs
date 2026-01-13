// lab/src/routes/voice.rs

//! Voice profile and TTS endpoints
//!
//! Real implementations using libSQL for persistence and VoiceFacade for synthesis.

use axum::{
    body::Bytes,
    extract::{Multipart, Path, Query, State},
    routing::{get, post, delete},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use shared::config::paths::get_paths;
use std::sync::Arc;

use crate::error::AppResult;
use crate::state::AppState;

/// Max upload size: 50MB for voice samples
const MAX_UPLOAD_SIZE: usize = 50 * 1024 * 1024;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/status", get(get_status))
        .route("/profiles", get(list_profiles))
        .route("/profiles", post(create_profile))
        .route("/profiles/{id}", delete(delete_profile))
        .route("/active", post(set_active))
        .route("/samples", get(list_samples))
        .route("/samples/upload", post(upload_sample))
        .route("/samples/{id}", delete(delete_sample))
        .route("/test", post(test_tts))
        .route("/model-status", get(get_model_status))
        // Voice model discovery (scan any folder for whisper/kokoro)
        .route("/discovery/scan", post(scan_voice_models))
        .route("/discovery/models", get(get_voice_models))
        .route("/discovery/select-whisper", post(select_whisper))
        .route("/discovery/select-kokoro", post(select_kokoro))
}

#[derive(Serialize)]
pub struct VoiceStatus {
    pub stt_loaded: bool,
    pub tts_loaded: bool,
    pub active_profile_id: Option<String>,
    pub active_profile_name: Option<String>,
    pub sample_count: u32,
    pub profile_count: u32,
}

/// GET /api/voice/status
async fn get_status(State(state): State<Arc<AppState>>) -> Json<VoiceStatus> {
    let db = state.engine.database();

    // Get counts from database
    let profiles = db.list_voice_profiles().await.unwrap_or_default();
    let samples = db.list_voice_samples(None).await.unwrap_or_default();

    // Find active profile
    let active = profiles.iter().find(|p| p.is_active);

    Json(VoiceStatus {
        stt_loaded: state.engine.voice.is_stt_ready(),
        tts_loaded: state.engine.voice.is_tts_ready(),
        active_profile_id: active.map(|p| p.id.clone()),
        active_profile_name: active.map(|p| p.name.clone()),
        sample_count: samples.len() as u32,
        profile_count: profiles.len() as u32,
    })
}

#[derive(Serialize)]
pub struct VoiceProfile {
    pub id: String,
    pub name: String,
    pub gender: String,
    pub created_at: String,
    pub is_active: bool,
    pub is_default: bool,
    pub sample_count: u32,
}

/// GET /api/voice/profiles
async fn list_profiles(State(state): State<Arc<AppState>>) -> AppResult<Json<Vec<VoiceProfile>>> {
    let db = state.engine.database();
    let profiles = db.list_voice_profiles().await
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to list profiles: {}", e)))?;

    let mut result = Vec::with_capacity(profiles.len());
    for p in profiles {
        let sample_count = db.get_voice_sample_count(&p.id).await.unwrap_or(0);
        result.push(VoiceProfile {
            id: p.id,
            name: p.name,
            gender: p.gender,
            created_at: p.created_at,
            is_active: p.is_active,
            is_default: p.is_default,
            sample_count,
        });
    }

    Ok(Json(result))
}

#[derive(Deserialize)]
pub struct CreateProfileRequest {
    pub name: String,
    pub gender: String,
}

/// POST /api/voice/profiles
async fn create_profile(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreateProfileRequest>,
) -> AppResult<Json<VoiceProfile>> {
    let db = state.engine.database();
    let id = uuid::Uuid::new_v4().to_string();

    db.create_voice_profile(&id, &request.name, &request.gender, None).await
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to create profile: {}", e)))?;

    Ok(Json(VoiceProfile {
        id,
        name: request.name,
        gender: request.gender,
        created_at: chrono::Utc::now().to_rfc3339(),
        is_active: false,
        is_default: false,
        sample_count: 0,
    }))
}

#[derive(Serialize)]
pub struct DeleteResponse {
    pub success: bool,
}

/// DELETE /api/voice/profiles/:id
async fn delete_profile(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<DeleteResponse>> {
    let db = state.engine.database();

    db.delete_voice_profile(&id).await
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to delete profile: {}", e)))?;

    tracing::info!("Deleted voice profile: {}", id);
    Ok(Json(DeleteResponse { success: true }))
}

#[derive(Deserialize)]
pub struct SetActiveRequest {
    pub profile_id: String,
}

/// POST /api/voice/active
async fn set_active(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SetActiveRequest>,
) -> AppResult<Json<VoiceProfile>> {
    let db = state.engine.database();

    db.set_active_voice_profile(&request.profile_id).await
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to set active profile: {}", e)))?;

    // Fetch the updated profile
    let profile = db.get_voice_profile(&request.profile_id).await
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to get profile: {}", e)))?
        .ok_or_else(|| crate::error::AppError::NotFound("Profile not found".to_string()))?;

    let sample_count = db.get_voice_sample_count(&profile.id).await.unwrap_or(0);

    Ok(Json(VoiceProfile {
        id: profile.id,
        name: profile.name,
        gender: profile.gender,
        created_at: profile.created_at,
        is_active: true,
        is_default: profile.is_default,
        sample_count,
    }))
}

#[derive(Serialize)]
pub struct VoiceSample {
    pub id: String,
    pub profile_id: String,
    pub filename: String,
    pub size_bytes: u64,
    pub duration_ms: Option<i64>,
    pub mime_type: String,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct ListSamplesQuery {
    pub profile_id: Option<String>,
}

/// GET /api/voice/samples
async fn list_samples(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ListSamplesQuery>,
) -> AppResult<Json<Vec<VoiceSample>>> {
    let db = state.engine.database();
    let samples = db.list_voice_samples(query.profile_id.as_deref()).await
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to list samples: {}", e)))?;

    Ok(Json(samples.into_iter().map(|s| VoiceSample {
        id: s.id,
        profile_id: s.profile_id,
        filename: s.filename,
        size_bytes: s.size_bytes,
        duration_ms: s.duration_ms,
        mime_type: s.mime_type,
        created_at: s.created_at,
    }).collect()))
}

#[derive(Serialize)]
pub struct UploadResponse {
    pub id: String,
    pub filename: String,
    pub size_bytes: u64,
}

/// POST /api/voice/samples/upload
/// Multipart form with fields: profile_id, file
async fn upload_sample(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> AppResult<Json<UploadResponse>> {
    let mut profile_id: Option<String> = None;
    let mut filename: Option<String> = None;
    let mut file_data: Option<Bytes> = None;
    let mut mime_type = "audio/mpeg".to_string();

    while let Some(field) = multipart.next_field().await
        .map_err(|e| crate::error::AppError::BadRequest(format!("Multipart error: {}", e)))?
    {
        let name = field.name().unwrap_or("").to_string();

        match name.as_str() {
            "profile_id" => {
                profile_id = Some(field.text().await
                    .map_err(|e| crate::error::AppError::BadRequest(format!("Invalid profile_id: {}", e)))?);
            }
            "file" => {
                filename = field.file_name().map(|s| s.to_string());
                if let Some(ct) = field.content_type() {
                    mime_type = ct.to_string();
                }
                file_data = Some(field.bytes().await
                    .map_err(|e| crate::error::AppError::BadRequest(format!("Failed to read file: {}", e)))?);
            }
            _ => {}
        }
    }

    let profile_id = profile_id.ok_or_else(|| crate::error::AppError::BadRequest("Missing profile_id".to_string()))?;
    let filename = filename.ok_or_else(|| crate::error::AppError::BadRequest("Missing file".to_string()))?;
    let file_data = file_data.ok_or_else(|| crate::error::AppError::BadRequest("Missing file data".to_string()))?;

    // Check size
    if file_data.len() > MAX_UPLOAD_SIZE {
        return Err(crate::error::AppError::BadRequest(format!(
            "File too large: {} bytes (max {} MB)",
            file_data.len(),
            MAX_UPLOAD_SIZE / (1024 * 1024)
        )));
    }

    // Validate mime type
    if !mime_type.starts_with("audio/") {
        return Err(crate::error::AppError::BadRequest(format!(
            "Invalid file type: {}. Must be audio/*",
            mime_type
        )));
    }

    // Create storage directory and save file
    let paths = get_paths();
    let samples_dir = paths.data_dir.join("voice_samples").join(&profile_id);
    std::fs::create_dir_all(&samples_dir)
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to create samples dir: {}", e)))?;

    let sample_id = uuid::Uuid::new_v4().to_string();
    let ext = std::path::Path::new(&filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("mp3");
    let storage_filename = format!("{}.{}", sample_id, ext);
    let storage_path = samples_dir.join(&storage_filename);

    std::fs::write(&storage_path, &file_data)
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to write file: {}", e)))?;

    // Calculate relative storage path from data_dir
    let relative_path = format!("voice_samples/{}/{}", profile_id, storage_filename);

    // Save to database
    let db = state.engine.database();
    let size_bytes = file_data.len() as u64;

    db.save_voice_sample(
        &sample_id,
        &profile_id,
        &filename,
        size_bytes,
        None, // TODO: Extract duration from audio
        &mime_type,
        &relative_path,
    ).await.map_err(|e| crate::error::AppError::Internal(format!("Failed to save sample: {}", e)))?;

    tracing::info!(
        "Uploaded voice sample: {} ({} bytes) for profile {}",
        filename, size_bytes, profile_id
    );

    Ok(Json(UploadResponse {
        id: sample_id,
        filename,
        size_bytes,
    }))
}

/// DELETE /api/voice/samples/:id
async fn delete_sample(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<DeleteResponse>> {
    let db = state.engine.database();

    // Delete from DB and get storage path
    let storage_path = db.delete_voice_sample(&id).await
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to delete sample: {}", e)))?;

    // Delete file from disk
    if let Some(relative_path) = storage_path {
        let paths = get_paths();
        let full_path = paths.data_dir.join(&relative_path);
        if full_path.exists() {
            std::fs::remove_file(&full_path).ok(); // Ignore errors
        }
    }

    tracing::info!("Deleted voice sample: {}", id);
    Ok(Json(DeleteResponse { success: true }))
}

#[derive(Deserialize)]
pub struct TestRequest {
    pub text: String,
    pub profile_id: Option<String>,
    pub speaker_id: Option<i32>,
    pub speed: Option<f32>,
}

#[derive(Serialize)]
pub struct TestResponse {
    pub success: bool,
    pub message: String,
    pub duration_ms: Option<u64>,
    pub sample_rate: Option<u32>,
    pub samples: Option<usize>,
}

/// POST /api/voice/test
async fn test_tts(
    State(state): State<Arc<AppState>>,
    Json(request): Json<TestRequest>,
) -> AppResult<Json<TestResponse>> {
    if !state.engine.voice.is_tts_ready() {
        return Ok(Json(TestResponse {
            success: false,
            message: state.engine.voice.download_instructions(),
            duration_ms: None,
            sample_rate: None,
            samples: None,
        }));
    }

    // Resolve speaker_id: explicit > profile > default (0)
    let speaker_id = match (request.speaker_id, &request.profile_id) {
        (Some(id), _) => id,
        (None, Some(profile_id)) => {
            // Look up profile to get its speaker_id
            let db = state.engine.database();
            match db.get_voice_profile(profile_id).await {
                Ok(Some(profile)) => profile.speaker_id.unwrap_or(0),
                _ => 0,
            }
        }
        (None, None) => 0,
    };

    // Use synthesize if custom speaker/speed, otherwise speak
    let result = if speaker_id != 0 || request.speed.is_some() {
        state.engine.voice.synthesize(
            &request.text,
            speaker_id,
            request.speed.unwrap_or(1.0),
        )
    } else {
        state.engine.voice.speak(&request.text)
    };

    match result {
        Ok(tts_result) => {
            let duration_ms = (tts_result.audio.len() as f64 / tts_result.sample_rate as f64 * 1000.0) as u64;
            Ok(Json(TestResponse {
                success: true,
                message: format!("Synthesized {} samples", tts_result.audio.len()),
                duration_ms: Some(duration_ms),
                sample_rate: Some(tts_result.sample_rate),
                samples: Some(tts_result.audio.len()),
            }))
        }
        Err(e) => Ok(Json(TestResponse {
            success: false,
            message: format!("TTS failed: {}", e),
            duration_ms: None,
            sample_rate: None,
            samples: None,
        })),
    }
}

#[derive(Serialize)]
pub struct ModelStatusResponse {
    pub whisper_ready: bool,
    pub whisper_missing: Vec<String>,
    pub kokoro_ready: bool,
    pub kokoro_missing: Vec<String>,
    pub voices: Vec<String>,
    pub download_instructions: String,
}

/// GET /api/voice/model-status
async fn get_model_status(State(state): State<Arc<AppState>>) -> Json<ModelStatusResponse> {
    let status = state.engine.voice.model_status();

    Json(ModelStatusResponse {
        whisper_ready: status.whisper_ready,
        whisper_missing: status.whisper_missing.clone(),
        kokoro_ready: status.kokoro_ready,
        kokoro_missing: status.kokoro_missing.clone(),
        voices: status.voices.clone(),
        download_instructions: state.engine.voice.download_instructions(),
    })
}

// ========================================
// Voice Model Discovery Endpoints
// ========================================

#[derive(Deserialize)]
pub struct ScanRequest {
    pub path: String,
}

#[derive(Serialize)]
pub struct DiscoveredWhisperModel {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size: String,
    pub ready: bool,
    pub missing: Vec<String>,
}

#[derive(Serialize)]
pub struct DiscoveredKokoroModel {
    pub id: String,
    pub name: String,
    pub path: String,
    pub ready: bool,
    pub missing: Vec<String>,
    pub voices: Vec<String>,
}

#[derive(Serialize)]
pub struct VoiceDiscoveryResponse {
    pub scanned_path: String,
    pub whisper_models: Vec<DiscoveredWhisperModel>,
    pub kokoro_models: Vec<DiscoveredKokoroModel>,
    pub errors: Vec<String>,
}

/// POST /api/voice/discovery/scan
/// Scan a directory for Whisper and Kokoro voice models
async fn scan_voice_models(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ScanRequest>,
) -> AppResult<Json<VoiceDiscoveryResponse>> {
    let path = std::path::Path::new(&request.path);

    let result = state.engine.voice_discovery
        .set_model_directory(path)
        .await
        .map_err(|e| crate::error::AppError::Internal(format!("Scan failed: {}", e)))?;

    Ok(Json(VoiceDiscoveryResponse {
        scanned_path: result.scanned_path.to_string_lossy().to_string(),
        whisper_models: result.whisper_models.into_iter().map(|m| DiscoveredWhisperModel {
            id: m.id,
            name: m.name,
            path: m.path.to_string_lossy().to_string(),
            size: m.size,
            ready: m.ready,
            missing: m.missing,
        }).collect(),
        kokoro_models: result.kokoro_models.into_iter().map(|m| DiscoveredKokoroModel {
            id: m.id,
            name: m.name,
            path: m.path.to_string_lossy().to_string(),
            ready: m.ready,
            missing: m.missing,
            voices: m.voices,
        }).collect(),
        errors: result.errors,
    }))
}

#[derive(Serialize)]
pub struct VoiceModelsResponse {
    pub whisper_models: Vec<DiscoveredWhisperModel>,
    pub kokoro_models: Vec<DiscoveredKokoroModel>,
    pub selected_whisper: Option<DiscoveredWhisperModel>,
    pub selected_kokoro: Option<DiscoveredKokoroModel>,
}

/// GET /api/voice/discovery/models
/// Get currently discovered voice models and selections
async fn get_voice_models(State(state): State<Arc<AppState>>) -> Json<VoiceModelsResponse> {
    let whisper_models: Vec<DiscoveredWhisperModel> = state.engine.voice_discovery
        .get_whisper_models()
        .await
        .into_iter()
        .map(|m| DiscoveredWhisperModel {
            id: m.id,
            name: m.name,
            path: m.path.to_string_lossy().to_string(),
            size: m.size,
            ready: m.ready,
            missing: m.missing,
        })
        .collect();

    let kokoro_models: Vec<DiscoveredKokoroModel> = state.engine.voice_discovery
        .get_kokoro_models()
        .await
        .into_iter()
        .map(|m| DiscoveredKokoroModel {
            id: m.id,
            name: m.name,
            path: m.path.to_string_lossy().to_string(),
            ready: m.ready,
            missing: m.missing,
            voices: m.voices,
        })
        .collect();

    let selected_whisper = state.engine.voice_discovery
        .get_selected_whisper()
        .await
        .map(|m| DiscoveredWhisperModel {
            id: m.id,
            name: m.name,
            path: m.path.to_string_lossy().to_string(),
            size: m.size,
            ready: m.ready,
            missing: m.missing,
        });

    let selected_kokoro = state.engine.voice_discovery
        .get_selected_kokoro()
        .await
        .map(|m| DiscoveredKokoroModel {
            id: m.id,
            name: m.name,
            path: m.path.to_string_lossy().to_string(),
            ready: m.ready,
            missing: m.missing,
            voices: m.voices,
        });

    Json(VoiceModelsResponse {
        whisper_models,
        kokoro_models,
        selected_whisper,
        selected_kokoro,
    })
}

#[derive(Deserialize)]
pub struct SelectModelRequest {
    pub id: String,
}

/// POST /api/voice/discovery/select-whisper
async fn select_whisper(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SelectModelRequest>,
) -> AppResult<Json<DiscoveredWhisperModel>> {
    let model = state.engine.voice_discovery
        .select_whisper(&request.id)
        .await
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to select Whisper: {}", e)))?;

    Ok(Json(DiscoveredWhisperModel {
        id: model.id,
        name: model.name,
        path: model.path.to_string_lossy().to_string(),
        size: model.size,
        ready: model.ready,
        missing: model.missing,
    }))
}

/// POST /api/voice/discovery/select-kokoro
async fn select_kokoro(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SelectModelRequest>,
) -> AppResult<Json<DiscoveredKokoroModel>> {
    let model = state.engine.voice_discovery
        .select_kokoro(&request.id)
        .await
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to select Kokoro: {}", e)))?;

    Ok(Json(DiscoveredKokoroModel {
        id: model.id,
        name: model.name,
        path: model.path.to_string_lossy().to_string(),
        ready: model.ready,
        missing: model.missing,
        voices: model.voices,
    }))
}
