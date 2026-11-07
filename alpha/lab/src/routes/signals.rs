// lab/src/routes/signals.rs

//! Signal streaming endpoints (SSE + WebSocket + History)

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse,
    },
    routing::get,
    Json, Router,
};
use futures::stream::Stream;
use orchestrator::infra::duckdb::StoredEvent;
use serde::Deserialize;
use std::{convert::Infallible, sync::Arc, time::Duration};
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;

use crate::error::AppResult;
use crate::state::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/stream", get(signal_stream))
        .route("/ws", get(signal_websocket))
        .route("/history", get(signal_history))
        .route("/count", get(signal_count))
}

/// Query params for signal history
#[derive(Deserialize)]
pub struct HistoryParams {
    /// Maximum number of events to return (default 100)
    #[serde(default = "default_limit")]
    pub limit: u32,
    /// Optional event type filter (e.g., "Chat", "Inference", "Debug")
    pub event_type: Option<String>,
}

fn default_limit() -> u32 {
    100
}

/// GET /api/signals/history - Query persisted signals from lab_analytics.duckdb
///
/// Returns signals in reverse chronological order (newest first).
/// Use `limit` to control how many to return, `event_type` to filter.
async fn signal_history(
    State(state): State<Arc<AppState>>,
    Query(params): Query<HistoryParams>,
) -> AppResult<Json<Vec<StoredEvent>>> {
    let events = state
        .lab_analytics
        .get_events(params.limit, params.event_type.as_deref())
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to query signals: {}", e)))?;

    Ok(Json(events))
}

/// GET /api/signals/count - Get total count of persisted signals
async fn signal_count(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<SignalCountResponse>> {
    let count = state
        .lab_analytics
        .get_event_count()
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to count signals: {}", e)))?;

    Ok(Json(SignalCountResponse { count }))
}

#[derive(serde::Serialize)]
pub struct SignalCountResponse {
    pub count: u64,
}

/// GET /api/signals/stream - Server-Sent Events stream
async fn signal_stream(
    State(state): State<Arc<AppState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let rx = state.subscribe();

    let stream = BroadcastStream::new(rx).filter_map(|result| {
        result.ok().map(|event| {
            let data = serde_json::to_string(&event).unwrap_or_default();
            Ok(Event::default()
                .event(&event.signal_type)
                .data(data))
        })
    });

    Sse::new(stream).keep_alive(
        KeepAlive::new()
            .interval(Duration::from_secs(15))
            .text("ping"),
    )
}

/// WS /api/signals/ws - WebSocket for bidirectional communication
async fn signal_websocket(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_websocket(socket, state))
}

async fn handle_websocket(mut socket: WebSocket, state: Arc<AppState>) {
    let mut rx = state.subscribe();

    loop {
        tokio::select! {
            // Send signals to client
            result = rx.recv() => {
                match result {
                    Ok(event) => {
                        let msg = serde_json::to_string(&event).unwrap_or_default();
                        if socket.send(Message::Text(msg.into())).await.is_err() {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
            // Receive from client (for Lab triggers)
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        // Handle Lab triggers from client
                        if let Ok(trigger) = serde_json::from_str::<LabTrigger>(&text) {
                            handle_lab_trigger(&state, trigger).await;
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    _ => {}
                }
            }
        }
    }
}

#[derive(serde::Deserialize)]
struct LabTrigger {
    action: String,
    #[allow(dead_code)]
    params: serde_json::Value,
}

async fn handle_lab_trigger(state: &AppState, trigger: LabTrigger) {
    // Emit Lab trigger signal through engine
    use engine::{Signal, SignalSource, SignalVariant, DebugPayload, DebugLevel};

    // For now, emit as debug signal - later we can add proper LabTrigger variant
    let signal = Signal::new(
        SignalSource::System,
        SignalVariant::Debug(DebugPayload {
            level: DebugLevel::Info,
            message: format!("Lab trigger: {}", trigger.action),
        }),
    );

    state.engine.router.emit(signal);
}
