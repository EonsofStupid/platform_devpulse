// lab/src/routes/persona.rs

//! Persona management endpoints
//!
//! CRUD operations for Maestro personas (system prompts, personality config).

use axum::{
    extract::{Path, State},
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use shared::config::{Persona, PersonaSummary, ResponseStyle, DEFAULT_INSTRUCTIONS};
use std::sync::Arc;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_personas))
        .route("/", post(create_persona))
        .route("/active", get(get_active))
        .route("/active", post(set_active))
        .route("/default-instructions", get(get_default_instructions))
        .route("/{id}", get(get_persona))
        .route("/{id}", put(update_persona))
        .route("/{id}", delete(delete_persona))
}

/// GET /api/persona
async fn list_personas(State(state): State<Arc<AppState>>) -> AppResult<Json<Vec<PersonaSummary>>> {
    let personas = state
        .engine
        .persona
        .list_summaries()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to list personas: {}", e)))?;

    Ok(Json(personas))
}

/// GET /api/persona/active
async fn get_active(State(state): State<Arc<AppState>>) -> AppResult<Json<Persona>> {
    let persona = state
        .engine
        .persona
        .get_active()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to get active persona: {}", e)))?;

    Ok(Json(persona))
}

/// GET /api/persona/default-instructions
async fn get_default_instructions() -> Json<DefaultInstructionsResponse> {
    Json(DefaultInstructionsResponse {
        instructions: DEFAULT_INSTRUCTIONS.to_string(),
    })
}

#[derive(Serialize)]
pub struct DefaultInstructionsResponse {
    pub instructions: String,
}

/// GET /api/persona/:id
async fn get_persona(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<Persona>> {
    let persona = state
        .engine
        .persona
        .get(&id)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to get persona: {}", e)))?
        .ok_or_else(|| AppError::NotFound(format!("Persona not found: {}", id)))?;

    Ok(Json(persona))
}

#[derive(Deserialize)]
pub struct CreatePersonaRequest {
    pub name: String,
    pub instructions: String,
    #[serde(default)]
    pub personality: Option<String>,
    #[serde(default)]
    pub style: Option<ResponseStyle>,
}

/// POST /api/persona
async fn create_persona(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreatePersonaRequest>,
) -> AppResult<Json<Persona>> {
    let mut persona = Persona::new(&request.name, &request.instructions);

    if let Some(personality) = request.personality {
        persona.personality = personality;
    }
    if let Some(style) = request.style {
        persona.style = style;
    }

    state
        .engine
        .persona
        .save(&persona)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to create persona: {}", e)))?;

    tracing::info!("Created persona: {} ({})", persona.name, persona.id);

    Ok(Json(persona))
}

#[derive(Deserialize)]
pub struct UpdatePersonaRequest {
    pub name: Option<String>,
    pub instructions: Option<String>,
    pub personality: Option<String>,
    pub style: Option<ResponseStyle>,
}

/// PUT /api/persona/:id
async fn update_persona(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
    Json(request): Json<UpdatePersonaRequest>,
) -> AppResult<Json<Persona>> {
    // Get existing persona
    let mut persona = state
        .engine
        .persona
        .get(&id)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to get persona: {}", e)))?
        .ok_or_else(|| AppError::NotFound(format!("Persona not found: {}", id)))?;

    // Update fields
    if let Some(name) = request.name {
        persona.name = name;
    }
    if let Some(instructions) = request.instructions {
        persona.instructions = instructions;
    }
    if let Some(personality) = request.personality {
        persona.personality = personality;
    }
    if let Some(style) = request.style {
        persona.style = style;
    }

    // Update timestamp
    persona.updated_at = chrono::Utc::now().timestamp();

    state
        .engine
        .persona
        .save(&persona)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to update persona: {}", e)))?;

    tracing::info!("Updated persona: {} ({})", persona.name, persona.id);

    Ok(Json(persona))
}

#[derive(Deserialize)]
pub struct SetActiveRequest {
    pub persona_id: String,
}

#[derive(Serialize)]
pub struct SetActiveResponse {
    pub success: bool,
    pub persona_id: String,
    pub persona_name: String,
}

/// POST /api/persona/active
async fn set_active(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SetActiveRequest>,
) -> AppResult<Json<SetActiveResponse>> {
    // Get persona to get its name
    let persona = state
        .engine
        .persona
        .get(&request.persona_id)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to get persona: {}", e)))?
        .ok_or_else(|| AppError::NotFound(format!("Persona not found: {}", request.persona_id)))?;

    state
        .engine
        .persona
        .set_active(&request.persona_id)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to set active persona: {}", e)))?;

    tracing::info!("Set active persona: {} ({})", persona.name, persona.id);

    Ok(Json(SetActiveResponse {
        success: true,
        persona_id: persona.id,
        persona_name: persona.name,
    }))
}

#[derive(Serialize)]
pub struct DeleteResponse {
    pub success: bool,
    pub message: String,
}

/// DELETE /api/persona/:id
async fn delete_persona(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<DeleteResponse>> {
    let deleted = state
        .engine
        .persona
        .delete(&id)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to delete persona: {}", e)))?;

    if deleted {
        tracing::info!("Deleted persona: {}", id);
        Ok(Json(DeleteResponse {
            success: true,
            message: format!("Persona {} deleted", id),
        }))
    } else {
        Err(AppError::BadRequest(
            "Cannot delete default persona".to_string(),
        ))
    }
}
