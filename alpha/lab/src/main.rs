// lab/src/main.rs

//! Lab - DevPulse Internal Monitoring UI Backend
//!
//! **DEVELOPMENT ONLY** - This binary is excluded from production builds.
//! Lab uses `#[cfg(debug_assertions)]` to ensure it never ships to users.
//!
//! Provides HTTP + WebSocket API for the Lab SvelteKit frontend.
//! Subscribes to Engine's SignalRouter and broadcasts to connected clients.
//!
//! Usage:
//!   cargo run -p lab           # Start Axum server on :3001
//!   cargo run -p lab -- --cli  # Run CLI model tools (legacy)

use axum::Router;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

// Use lib.rs exports
use lab::{routes, state::AppState};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args: Vec<String> = std::env::args().collect();

    // Check for --cli flag for legacy CLI mode
    #[cfg(feature = "cli")]
    if args.iter().any(|a| a == "--cli" || a == "-c") {
        return lab::cli::run_cli(args).await;
    }

    // Initialize tracing for server mode
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "lab=debug,tower_http=debug,engine=info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting DevPulse Lab server...");

    // Initialize state (connects to Engine)
    let state = Arc::new(AppState::init().await?);

    // Build router with nested route modules
    let app = Router::new()
        .nest("/api/analytics", routes::analytics::router())
        .nest("/api/health", routes::health::router())
        .nest("/api/chat", routes::chat::router())
        .nest("/api/signals", routes::signals::router())
        .nest("/api/rumination", routes::rumination::router())
        .nest("/api/voice", routes::voice::router())
        .nest("/api/background", routes::background::router())
        .nest("/api/models", routes::models::router())
        .nest("/api/persona", routes::persona::router())
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    tracing::info!("Lab server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
