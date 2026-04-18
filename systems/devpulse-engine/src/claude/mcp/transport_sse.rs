//! Streamable HTTP transport for MCP server (2025-06-18 spec).
//!
//! Single endpoint: `/mcp`
//! - POST /mcp — JSON-RPC requests, response as JSON or SSE stream
//! - GET /mcp — SSE stream for server-initiated events
//!
//! Security: Origin header validated on all requests (DNS rebinding prevention).
//! Sessions: Mcp-Session-Id assigned on initialize, required on subsequent requests.
//!
//! Always available — release gets project-scoped tools, internal gets full surface.

use axum::{
    Router,
    body::Body,
    extract::State,
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
    response::sse::{Event, Sse},
    routing::post,
};
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use tokio::task::JoinHandle;
use uuid::Uuid;

use super::handler::McpHandler;
use super::protocol::{JsonRpcRequest, MCP_SESSION_HEADER};

/// Shared state for the Streamable HTTP transport.
struct McpTransportState {
    /// Broadcast channel for SSE events (server → all clients).
    tx: broadcast::Sender<String>,
    /// Active session ID (set on first initialize).
    session_id: RwLock<Option<String>>,
    /// MCP request handler with platform access.
    handler: Arc<McpHandler>,
    /// Allowed origins for DNS rebinding protection.
    allowed_origins: Vec<String>,
}

impl McpTransportState {
    fn new(tx: broadcast::Sender<String>, handler: Arc<McpHandler>) -> Self {
        Self {
            tx,
            session_id: RwLock::new(None),
            handler,
            allowed_origins: vec![
                "http://localhost".to_string(),
                "http://127.0.0.1".to_string(),
                "https://localhost".to_string(),
                "https://127.0.0.1".to_string(),
                "null".to_string(), // Tauri webview sends "null" origin
            ],
        }
    }

    /// Validate Origin header. Returns true if origin is allowed.
    fn validate_origin(&self, headers: &HeaderMap) -> bool {
        match headers.get(header::ORIGIN) {
            Some(origin) => {
                let origin_str = origin.to_str().unwrap_or("");
                self.allowed_origins.iter().any(|allowed| {
                    origin_str == allowed.as_str()
                        || origin_str.starts_with(&format!("{allowed}:"))
                })
            }
            // No Origin header — allow (stdio clients, curl, etc. don't send Origin)
            None => true,
        }
    }
}

/// Start the Streamable HTTP transport on the given port and bind address.
pub async fn start(port: u16, bind: &str, handler: Arc<McpHandler>) -> anyhow::Result<JoinHandle<()>> {
    let (tx, _) = broadcast::channel::<String>(256);
    let state = Arc::new(McpTransportState::new(tx, handler));

    let app = Router::new()
        .route("/mcp", post(mcp_post_handler).get(mcp_get_handler))
        .with_state(state);

    let addr: std::net::SocketAddr = format!("{bind}:{port}").parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;

    tracing::info!(%addr, "MCP Streamable HTTP server listening");

    let handle = tokio::spawn(async move {
        if let Err(e) = axum::serve(listener, app).await {
            tracing::error!("MCP server error: {e}");
        }
    });

    Ok(handle)
}

/// POST /mcp — Client sends JSON-RPC request, server responds with JSON or SSE.
///
/// Per spec:
/// - Validates Origin header (403 if invalid)
/// - Validates Mcp-Session-Id on non-initialize requests (400 if missing, 404 if wrong)
/// - Returns JSON response for most requests
/// - Broadcasts to SSE subscribers for connected clients
async fn mcp_post_handler(
    State(state): State<Arc<McpTransportState>>,
    headers: HeaderMap,
    body: String,
) -> Response {
    // Origin validation — MCP spec security requirement
    if !state.validate_origin(&headers) {
        tracing::warn!("MCP request rejected — invalid Origin header");
        return (StatusCode::FORBIDDEN, "Invalid Origin header").into_response();
    }

    // Parse JSON-RPC request
    let request: JsonRpcRequest = match serde_json::from_str(&body) {
        Ok(req) => req,
        Err(e) => {
            tracing::warn!("Invalid JSON-RPC request: {e}");
            return (StatusCode::BAD_REQUEST, format!("Invalid JSON-RPC: {e}")).into_response();
        }
    };

    // Session validation (skip for initialize — that's where session is created)
    let is_initialize = request.method == "initialize";
    if !is_initialize {
        let session = state.session_id.read().await;
        if let Some(expected_id) = session.as_ref() {
            // Session exists — client must send matching Mcp-Session-Id
            let client_session = headers
                .get(MCP_SESSION_HEADER)
                .and_then(|v| v.to_str().ok())
                .unwrap_or("");
            if client_session != expected_id {
                return (StatusCode::BAD_REQUEST, "Missing or invalid Mcp-Session-Id").into_response();
            }
        }
    }

    // Dispatch to handler
    let response = match state.handler.dispatch(&request).await {
        Some(resp) => resp,
        None => {
            // Notification — no response body, 202 Accepted
            return StatusCode::ACCEPTED.into_response();
        }
    };

    // If this was initialize, generate and store session ID
    if is_initialize {
        let new_session = Uuid::new_v4().to_string();
        *state.session_id.write().await = Some(new_session.clone());
        tracing::info!(session_id = %new_session, "MCP session created");

        // Return response with Mcp-Session-Id header
        let json = match serde_json::to_string(&response) {
            Ok(j) => j,
            Err(e) => {
                return (StatusCode::INTERNAL_SERVER_ERROR, format!("Serialization error: {e}")).into_response();
            }
        };

        // Broadcast to SSE subscribers
        let _ = state.tx.send(json.clone());

        return Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "application/json")
            .header(MCP_SESSION_HEADER, &new_session)
            .body(Body::from(json))
            .unwrap_or_else(|_| StatusCode::INTERNAL_SERVER_ERROR.into_response());
    }

    // Standard JSON response
    let json = match serde_json::to_string(&response) {
        Ok(j) => j,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, format!("Serialization error: {e}")).into_response();
        }
    };

    // Broadcast to SSE subscribers
    let _ = state.tx.send(json.clone());

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(json))
        .unwrap_or_else(|_| StatusCode::INTERNAL_SERVER_ERROR.into_response())
}

/// GET /mcp — SSE stream for server-initiated events.
///
/// Clients subscribe to receive server notifications and responses.
/// Per spec: sends an initial event with ID to prime reconnection.
async fn mcp_get_handler(
    State(state): State<Arc<McpTransportState>>,
    headers: HeaderMap,
) -> Response {
    // Origin validation
    if !state.validate_origin(&headers) {
        tracing::warn!("MCP SSE request rejected — invalid Origin header");
        return (StatusCode::FORBIDDEN, "Invalid Origin header").into_response();
    }

    let mut rx = state.tx.subscribe();
    let mut event_id: u64 = 0;

    let stream = async_stream::stream! {
        // Prime event — spec says server SHOULD send initial event with ID
        yield Ok::<Event, Infallible>(Event::default().id(event_id.to_string()).data(""));
        event_id += 1;

        loop {
            match rx.recv().await {
                Ok(msg) => {
                    yield Ok(Event::default().id(event_id.to_string()).event("message").data(msg));
                    event_id += 1;
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!(skipped = n, "MCP SSE client lagged");
                    continue;
                }
                Err(broadcast::error::RecvError::Closed) => {
                    break;
                }
            }
        }
    };

    Sse::new(stream).into_response()
}
