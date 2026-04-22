//! `SurrealDB` HTTP server — exposes the embedded graph store.
//!
//! This is the official SurrealDB-recommended pattern: wrap the embedded
//! `Surreal<Db>` instance with axum routes. No extra process, no extra
//! binary — the Tauri app IS the `SurrealDB` server.
//!
//! Endpoints:
//! - `POST /sql` — execute `SurrealQL` (NS/DB headers for scope, Basic Auth required)
//! - `GET /health` — server liveness check (no auth)
//! - `GET /version` — returns `SurrealDB` + `DevPulse` version (no auth)
//!
//! External tools (Claude Code, `surreal sql`, custom scripts) connect to
//! the configured port (default :8822) and authenticate with the system
//! account credentials from `[services.system.graph]` in platform.default.toml.
//!
//! Auth: HTTP Basic Auth. The username/password are the `system_user`/`system_password`
//! from config, which match the `DEFINE USER` statements created during boot.

use anyhow::Result;
use devpulse_telemetry::spawn;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Router;
use devpulse_clyffy::cortex::persistence::SurrealAdapter;
use std::sync::Arc;
use tokio::net::TcpListener;

/// Default bind address for the `SurrealDB` HTTP server.
const DEFAULT_BIND: &str = "127.0.0.1";

/// Max request body size: 1 MB. Prevents local processes from
/// sending unbounded queries that consume all available memory.
const MAX_BODY_SIZE: usize = 1024 * 1024;

/// Shared state for the axum server.
#[derive(Clone)]
struct ServerState {
    adapter: Arc<SurrealAdapter>,
    /// Expected credentials for Basic Auth (username:password base64 encoded).
    auth_token: String,
}

/// Start the `SurrealDB` HTTP server in a background tokio task.
///
/// Takes the shared `SurrealAdapter` that already has all namespaces
/// initialized (system, user, global). Returns immediately — the server
/// runs until the tokio runtime shuts down.
///
/// # Auth
/// Basic Auth is always enforced. Empty `system_user` is rejected at
/// start time — auth cannot be disabled.
///
/// # Errors
/// Returns error if:
/// - `system_user` is empty (auth cannot be disabled)
/// - The TCP listener cannot bind to the configured port
pub async fn start(
    adapter: Arc<SurrealAdapter>,
    port: u16,
    system_user: &str,
    system_password: &str,
) -> Result<u16> {
    // Reject empty credentials — auth must always be enabled
    if system_user.is_empty() {
        anyhow::bail!(
            "SurrealDB HTTP server requires system_user to be configured. \
             Set [services.system.graph].system_user in platform.default.toml. \
             Auth cannot be disabled."
        );
    }

    // Pre-compute the expected Basic Auth header value
    use base64::Engine;
    let credentials = format!("{system_user}:{system_password}");
    let encoded = base64::engine::general_purpose::STANDARD.encode(credentials);
    let auth_token = format!("Basic {encoded}");

    let state = ServerState { adapter, auth_token };

    let app = Router::new()
        .route("/sql", post(handle_sql))
        .route("/health", get(handle_health))
        .route("/version", get(handle_version))
        .layer(axum::extract::DefaultBodyLimit::max(MAX_BODY_SIZE))
        .with_state(state);

    let bind = format!("{DEFAULT_BIND}:{port}");
    let listener = TcpListener::bind(&bind).await.map_err(|e| {
        anyhow::anyhow!(
            "SurrealDB HTTP server failed to bind {bind}: {e}\n  \
             Port {port} is already in use. Check for stale DevPulse processes \
             or another SurrealDB instance.\n  \
             Fix: kill the process on port {port}, or change \
             [services.network.graph_api].port in platform.default.toml"
        )
    })?;

    tracing::info!(
        bind = %bind,
        user = system_user,
        max_body_bytes = MAX_BODY_SIZE,
        "SurrealDB HTTP server listening (Basic Auth enforced)"
    );

    spawn(async move {
        if let Err(e) = axum::serve(listener, app).await {
            tracing::error!(error = %e, "SurrealDB HTTP server error");
        }
    });

    Ok(port)
}

/// `POST /sql` — execute `SurrealQL` query.
///
/// Requires Basic Auth (always enforced).
///
/// Headers:
/// - `Authorization: Basic <base64(user:pass)>` — required
/// - `NS` or `surreal-ns`: target namespace (default: "global")
/// - `DB` or `surreal-db`: target database (default: "knowledge")
///
/// Body: raw `SurrealQL` text.
async fn handle_sql(
    State(state): State<ServerState>,
    headers: HeaderMap,
    body: String,
) -> impl IntoResponse {
    // ── Auth check ────────────────────────────────────────────
    let auth_header = headers
        .get("Authorization")
        .or_else(|| headers.get("authorization"))
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    // Constant-time comparison to prevent timing side-channel attacks.
    // Even though this is localhost-only, do it right.
    if !constant_time_eq(auth_header.as_bytes(), state.auth_token.as_bytes()) {
        return (
            StatusCode::UNAUTHORIZED,
            axum::Json(serde_json::json!({
                "error": "Unauthorized — provide Basic Auth credentials. \
                          See [services.system.graph].system_user in platform.default.toml"
            })),
        );
    }

    // ── Execute query ─────────────────────────────────────────
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

/// `GET /health` — liveness check. No auth required.
///
/// Runs `SELECT * FROM kv LIMIT 1` in `global/knowledge` to verify
/// the WAL can serve reads, not just that the connection exists.
async fn handle_health(State(state): State<ServerState>) -> impl IntoResponse {
    match state.adapter.query_in_ns("global", "knowledge", "SELECT * FROM kv LIMIT 1").await {
        Ok(_) => (
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

/// `GET /version` — server version info. No auth required.
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

/// Constant-time byte comparison to prevent timing side-channel attacks.
///
/// XORs all bytes and reduces to a single equality check. Always
/// processes both slices fully regardless of where they differ.
fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut result: u8 = 0;
    for (x, y) in a.iter().zip(b.iter()) {
        result |= x ^ y;
    }
    result == 0
}
