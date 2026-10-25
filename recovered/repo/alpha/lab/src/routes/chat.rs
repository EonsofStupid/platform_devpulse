// lab/src/routes/chat.rs

//! Chat endpoints

use axum::{
    extract::{Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use shared::types::ids::SessionId;
use std::sync::Arc;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/history", get(get_history))
        .route("/send", post(send_message))
        .route("/sessions", get(list_sessions))
        .route("/sessions", post(create_session))
}

#[derive(Deserialize)]
pub struct HistoryParams {
    pub session_id: String,
}

#[derive(Serialize)]
pub struct ChatMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: String,
    pub tokens: Option<u32>,
}

/// GET /api/chat/history?session_id=xxx
async fn get_history(
    State(state): State<Arc<AppState>>,
    Query(params): Query<HistoryParams>,
) -> AppResult<Json<Vec<ChatMessage>>> {
    let history = state
        .engine
        .chat
        .history(&params.session_id)
        .await
        .map_err(|e| AppError::Engine(e))?;

    let messages: Vec<ChatMessage> = history
        .into_iter()
        .map(|m| ChatMessage {
            id: format!("{}", m.timestamp), // Use timestamp as ID for now
            role: format!("{:?}", m.role).to_lowercase(),
            content: m.content,
            timestamp: chrono::DateTime::from_timestamp_millis(m.timestamp)
                .map(|dt| dt.to_rfc3339())
                .unwrap_or_default(),
            tokens: None, // Not tracked in Message currently
        })
        .collect();

    Ok(Json(messages))
}

#[derive(Deserialize)]
pub struct SendRequest {
    pub message: String,
    pub session_id: String,
}

#[derive(Serialize)]
pub struct ChatResponse {
    pub message: String,
    pub tokens_used: u32,
    pub is_stub: bool,
}

/// POST /api/chat/send
async fn send_message(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SendRequest>,
) -> AppResult<Json<ChatResponse>> {
    // Parse session ID
    let session_uuid = request
        .session_id
        .parse::<uuid::Uuid>()
        .map_err(|_| AppError::BadRequest("Invalid session_id".to_string()))?;
    let session_id = SessionId::from_uuid(session_uuid);

    let response = state
        .engine
        .chat
        .send(&request.message, &session_id)
        .await
        .map_err(|e| AppError::Engine(e))?;

    Ok(Json(ChatResponse {
        message: response.message,
        tokens_used: response.tokens_used,
        is_stub: response.is_stub,
    }))
}

#[derive(Serialize)]
pub struct SessionInfo {
    pub id: String,
    pub project_id: Option<String>,
    pub title: String,
    pub created_at: String,
    pub message_count: u32,
}

/// GET /api/chat/sessions
async fn list_sessions(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Vec<SessionInfo>>> {
    let sessions = state.engine.sessions.list(None).await;

    let result: Vec<SessionInfo> = sessions
        .into_iter()
        .map(|s| SessionInfo {
            id: s.id,
            project_id: s.project_id,
            title: s.title,
            created_at: s.created_at,
            message_count: s.message_count,
        })
        .collect();

    Ok(Json(result))
}

#[derive(Deserialize)]
pub struct CreateSessionRequest {
    pub project_id: Option<String>,
}

/// POST /api/chat/sessions
async fn create_session(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreateSessionRequest>,
) -> AppResult<Json<SessionInfo>> {
    let session = state
        .engine
        .sessions
        .create(request.project_id)
        .await
        .map_err(|e| AppError::Engine(e))?;

    Ok(Json(SessionInfo {
        id: session.id,
        project_id: session.project_id,
        title: session.title,
        created_at: session.created_at,
        message_count: session.message_count,
    }))
}
