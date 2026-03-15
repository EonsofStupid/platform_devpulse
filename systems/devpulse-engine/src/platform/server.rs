//! `SurrealDB` HTTP server — exposes the embedded graph store.
//!
//! This is the official SurrealDB-recommended pattern: wrap the embedded
//! `Surreal<Db>` instance with axum routes. No extra process, no extra
//! binary — the Tauri app IS the `SurrealDB` server.
//!
//! Endpoints:
//! - `POST /sql` — execute `SurrealQL` (NS/DB headers for scope)
//! - `GET /health` — server liveness check
//! - `GET /version` — returns `SurrealDB` + `DevPulse` version
//!
//! External tools (Claude Code, `surreal sql`, custom scripts) connect to
//! the configured port (default :8822) and query any namespace/database in the
//! consolidated graph store.

use anyhow::{Context, Result};
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Router;
use devpulse_maestro::cortex::persistence::SurrealAdapter;
use std::sync::Arc;
use tokio::net::TcpListener;

/// Default bind address for the `SurrealDB` HTTP server.
const DEFAULT_BIND: &str = "127.0.0.1";

// Port is now config-driven — read from [services.network.graph_api] in platform.default.toml.
// No hardcoded constant. Callers pass the port from PlatformBootConfig.

/// Shared state for the axum server.
#[derive(Clone)]
struct ServerState {
    adapter: Arc<SurrealAdapter>,
}

/// Start the `SurrealDB` HTTP server in a background tokio task.
///
/// Takes the shared `SurrealAdapter` that already has all namespaces
/// initialized (system, user, global). Returns immediately — the server
/// runs until the tokio runtime shuts down.
///
/// # Errors
/// Returns error if the TCP listener cannot bind.
pub async fn start(adapter: Arc<SurrealAdapter>, port: u16) -> Result<()> {
    let bind = format!("{DEFAULT_BIND}:{port}");

    let state = ServerState { adapter };

    let app = Router::new()
        .route("/sql", post(handle_sql))
        .route("/health", get(handle_health))
        .route("/version", get(handle_version))
        .with_state(state);

    let listener = TcpListener::bind(&bind)
        .await
        .with_context(|| format!("Failed to bind SurrealDB HTTP server to {bind}"))?;

    tracing::info!(
        bind = %bind,
        "SurrealDB HTTP server listening"
    );

    // Spawn the server — runs until process exits
    tokio::spawn(async move {
        if let Err(e) = axum::serve(listener, app).await {
            tracing::error!(error = %e, "SurrealDB HTTP server error");
        }
    });

    Ok(())
}

/// `POST /sql` — execute `SurrealQL` query.
///
/// Headers:
/// - `NS` or `surreal-ns`: target namespace (default: "global")
/// - `DB` or `surreal-db`: target database (default: "knowledge")
///
/// Body: raw `SurrealQL` text.
///
/// Returns JSON array of statement results.
async fn handle_sql(
    State(state): State<ServerState>,
    headers: HeaderMap,
    body: String,
) -> impl IntoResponse {
    let ns = extract_header(&headers, "NS", "surreal-ns")
        .unwrap_or_else(|| "global".to_string());
    let db = extract_header(&headers, "DB", "surreal-db")
        .unwrap_or_else(|| "knowledge".to_string());

    let query = body.trim();
    if query.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            axum::Json(serde_json::json!({
                "error": "Empty query body"
            })),
        );
    }

    tracing::debug!(ns = %ns, db = %db, query = %query, "SurrealDB HTTP query");

    match state.adapter.query_in_ns(&ns, &db, query).await {
        Ok(results) => (StatusCode::OK, axum::Json(results)),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            axum::Json(serde_json::json!({
                "error": format!("{e:#}")
            })),
        ),
    }
}

/// `GET /health` — liveness check.
async fn handle_health(State(state): State<ServerState>) -> impl IntoResponse {
    match state.adapter.ping().await {
        Ok(()) => (
            StatusCode::OK,
            axum::Json(serde_json::json!({
                "status": "healthy",
                "engine": "surrealkv"
            })),
        ),
        Err(e) => (
            StatusCode::SERVICE_UNAVAILABLE,
            axum::Json(serde_json::json!({
                "status": "unhealthy",
                "error": format!("{e:#}")
            })),
        ),
    }
}

/// `GET /version` — server version info.
async fn handle_version() -> impl IntoResponse {
    axum::Json(serde_json::json!({
        "platform": "devpulse",
        "platform_version": env!("CARGO_PKG_VERSION"),
        "surrealdb": "3.0",
        "engine": "surrealkv",
        "protocol": "http"
    }))
}

/// Extract a header value, trying primary name then fallback.
fn extract_header(headers: &HeaderMap, primary: &str, fallback: &str) -> Option<String> {
    headers
        .get(primary)
        .or_else(|| headers.get(fallback))
        .and_then(|v| v.to_str().ok())
        .map(String::from)
}
