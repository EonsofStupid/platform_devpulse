// lab/src/routes/rumination.rs

//! Rumination state and thought tree endpoints

use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;
use std::sync::Arc;

use crate::state::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/state", get(get_state))
        .route("/tree", get(get_tree))
        .route("/layers", get(get_layers))
}

#[derive(Serialize)]
pub struct RuminationState {
    pub current_layer: String,
    pub layers: Vec<LayerStatus>,
    pub active_minions: Vec<String>,
    pub pending_signals: u32,
}

#[derive(Serialize)]
pub struct LayerStatus {
    pub name: String,
    pub active: bool,
    pub latency_budget_ms: u64,
    pub last_triggered: Option<String>,
    pub signals_processed: u64,
}

/// GET /api/rumination/state
async fn get_state(State(_state): State<Arc<AppState>>) -> Json<RuminationState> {
    // TODO: Wire to actual rumination system when implemented
    Json(RuminationState {
        current_layer: "idle".to_string(),
        layers: vec![
            LayerStatus {
                name: "keystroke".to_string(),
                active: false,
                latency_budget_ms: 50,
                last_triggered: None,
                signals_processed: 0,
            },
            LayerStatus {
                name: "pause".to_string(),
                active: false,
                latency_budget_ms: 500,
                last_triggered: None,
                signals_processed: 0,
            },
            LayerStatus {
                name: "send".to_string(),
                active: false,
                latency_budget_ms: 5000,
                last_triggered: None,
                signals_processed: 0,
            },
            LayerStatus {
                name: "background".to_string(),
                active: false,
                latency_budget_ms: 30000,
                last_triggered: None,
                signals_processed: 0,
            },
        ],
        active_minions: vec![],
        pending_signals: 0,
    })
}

#[derive(Serialize)]
pub struct ThoughtTree {
    pub session_id: Option<String>,
    pub root: Option<ThoughtNode>,
    pub active_path: Vec<String>,
}

#[derive(Serialize)]
pub struct ThoughtNode {
    pub id: String,
    pub content: String,
    pub node_type: String,
    pub children: Vec<ThoughtNode>,
    pub score: Option<f32>,
    pub source: Option<String>,
}

/// GET /api/rumination/tree
async fn get_tree(State(_state): State<Arc<AppState>>) -> Json<ThoughtTree> {
    // TODO: Wire to actual thought tree when implemented
    Json(ThoughtTree {
        session_id: None,
        root: None,
        active_path: vec![],
    })
}

/// GET /api/rumination/layers
async fn get_layers(State(_state): State<Arc<AppState>>) -> Json<Vec<LayerStatus>> {
    // TODO: Wire to actual layer system when implemented
    Json(vec![
        LayerStatus {
            name: "keystroke".to_string(),
            active: false,
            latency_budget_ms: 50,
            last_triggered: None,
            signals_processed: 0,
        },
        LayerStatus {
            name: "pause".to_string(),
            active: false,
            latency_budget_ms: 500,
            last_triggered: None,
            signals_processed: 0,
        },
        LayerStatus {
            name: "send".to_string(),
            active: false,
            latency_budget_ms: 5000,
            last_triggered: None,
            signals_processed: 0,
        },
        LayerStatus {
            name: "background".to_string(),
            active: false,
            latency_budget_ms: 30000,
            last_triggered: None,
            signals_processed: 0,
        },
    ])
}
