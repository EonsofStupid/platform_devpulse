// lab/src/routes/models.rs

//! Model management endpoints
//!
//! List models, check availability, switch active model.

use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use shared::types::models::{ModelFamily, ModelInfo, ModelSummary};
use std::sync::Arc;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_models))
        .route("/summary", get(get_summary))
        .route("/{id}", get(get_model))
        .route("/{id}/verify", get(verify_model))
        .route("/active", post(set_active))
        .route("/family/{family}", get(list_by_family))
}

/// GET /api/models
async fn list_models(State(state): State<Arc<AppState>>) -> AppResult<Json<Vec<ModelInfo>>> {
    let models = state
        .engine
        .models
        .list_all()
        .map_err(|e| AppError::Internal(format!("Failed to list models: {}", e)))?;

    Ok(Json(models))
}

/// GET /api/models/summary
async fn get_summary(State(state): State<Arc<AppState>>) -> AppResult<Json<ModelSummary>> {
    let summary = state
        .engine
        .models
        .summary()
        .map_err(|e| AppError::Internal(format!("Failed to get summary: {}", e)))?;

    Ok(Json(summary))
}

/// GET /api/models/:id
async fn get_model(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<ModelInfo>> {
    let model = state
        .engine
        .models
        .get(&id)
        .map_err(|e| AppError::Internal(format!("Failed to get model: {}", e)))?
        .ok_or_else(|| AppError::NotFound(format!("Model not found: {}", id)))?;

    Ok(Json(model))
}

/// GET /api/models/:id/verify
async fn verify_model(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<VerifyResponse>> {
    let available = state
        .engine
        .models
        .verify(&id)
        .map_err(|e| AppError::Internal(format!("Failed to verify model: {}", e)))?;

    Ok(Json(VerifyResponse {
        id,
        available,
        message: if available {
            "All model files present".to_string()
        } else {
            "Some model files missing".to_string()
        },
    }))
}

#[derive(Serialize)]
pub struct VerifyResponse {
    pub id: String,
    pub available: bool,
    pub message: String,
}

#[derive(Deserialize)]
pub struct SetActiveRequest {
    pub model_id: String,
}

#[derive(Serialize)]
pub struct SetActiveResponse {
    pub success: bool,
    pub model_id: String,
    pub message: String,
}

/// POST /api/models/active
async fn set_active(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SetActiveRequest>,
) -> AppResult<Json<SetActiveResponse>> {
    state
        .engine
        .models
        .set_active(&request.model_id)
        .map_err(|e| AppError::Internal(format!("Failed to set active model: {}", e)))?;

    tracing::info!("Set active model: {}", request.model_id);

    Ok(Json(SetActiveResponse {
        success: true,
        model_id: request.model_id.clone(),
        message: format!("Model {} is now active", request.model_id),
    }))
}

/// GET /api/models/family/:family
async fn list_by_family(
    State(state): State<Arc<AppState>>,
    Path(family): Path<String>,
) -> AppResult<Json<Vec<ModelInfo>>> {
    let family = parse_family(&family)?;
    let models = state
        .engine
        .models
        .list_family(family)
        .map_err(|e| AppError::Internal(format!("Failed to list models: {}", e)))?;

    Ok(Json(models))
}

fn parse_family(s: &str) -> AppResult<ModelFamily> {
    match s.to_lowercase().as_str() {
        "qwen3-vl" | "qwen3vl" | "vl" => Ok(ModelFamily::Qwen3VL),
        "qwen3-embed" | "qwen3embed" | "embed" | "embedder" => Ok(ModelFamily::Qwen3Embed),
        "qwen3-rerank" | "qwen3rerank" | "rerank" | "reranker" => Ok(ModelFamily::Qwen3Rerank),
        "whisper" | "stt" => Ok(ModelFamily::Whisper),
        "kokoro" | "tts" => Ok(ModelFamily::Kokoro),
        _ => Err(AppError::BadRequest(format!("Unknown model family: {}", s))),
    }
}
