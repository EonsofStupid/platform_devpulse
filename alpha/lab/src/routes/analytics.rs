// lab/src/routes/analytics.rs

//! Analytics endpoints for Lab dashboard
//!
//! Exposes DuckDB analytics data for developer monitoring and baseline.

use axum::{
    extract::State,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use shared::types::analytics::{FullAnalytics, HopStats, InferenceStats};
use std::sync::Arc;

use crate::error::AppResult;
use crate::state::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/summary", get(get_summary))
        .route("/inference", get(get_inference))
        .route("/hops", get(get_hops))
        .route("/count", get(get_count))
}

/// GET /api/analytics/summary
/// Returns full internal analytics for Lab dashboard
async fn get_summary(State(state): State<Arc<AppState>>) -> AppResult<Json<FullAnalytics>> {
    let analytics = state.engine.get_full_analytics()
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to get analytics: {}", e)))?;

    Ok(Json(analytics))
}

/// GET /api/analytics/inference
/// Returns inference statistics
async fn get_inference(State(state): State<Arc<AppState>>) -> AppResult<Json<InferenceStats>> {
    let stats = state.engine.get_inference_stats()
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to get inference stats: {}", e)))?;

    Ok(Json(stats))
}

/// GET /api/analytics/hops
/// Returns hop/routing statistics
async fn get_hops(State(state): State<Arc<AppState>>) -> AppResult<Json<HopStats>> {
    let stats = state.engine.get_hop_stats()
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to get hop stats: {}", e)))?;

    Ok(Json(stats))
}

#[derive(Serialize)]
pub struct EventCountResponse {
    pub count: u64,
}

/// GET /api/analytics/count
/// Returns total event count
async fn get_count(State(state): State<Arc<AppState>>) -> AppResult<Json<EventCountResponse>> {
    let count = state.engine.get_event_count()
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to get event count: {}", e)))?;

    Ok(Json(EventCountResponse { count }))
}
