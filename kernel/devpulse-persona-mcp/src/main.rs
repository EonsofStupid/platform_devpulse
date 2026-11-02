//! Persona MCP server binary.
//!
//! Stdio child process for Claude Desktop / Claude Code / future MCP
//! clients. Reads JSON-RPC 2.0 frames from stdin, dispatches to the
//! persona verb handlers, writes responses to stdout. Tracing goes
//! to stderr — stdout is reserved for the protocol.
//!
//! # Environment
//!
//! - `CLYFFY_OFFLINE` — set to `true`/`1` to enable v1 local mode.
//!   When unset, every request gets a typed [`devpulse_persona_mcp::error::ErrorKind::Auth`]
//!   envelope until Slice 6 wires Authentik JWT validation.
//! - `DEVPULSE_PERSONA_DB` is the required absolute path to the Turso database.
//!   The supervising application supplies its portable data location.

use anyhow::Context;
use devpulse_persona_mcp::auth::AuthGate;
use devpulse_persona_mcp::{server::Server, store::PersonaStore};
use std::env;
use std::path::PathBuf;
use tracing_subscriber::{EnvFilter, fmt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    init_tracing();

    let db_path = resolve_db_path()?;
    tracing::info!(
        target = "persona_mcp",
        path = %db_path.display(),
        "persona MCP server starting"
    );

    let store = open_store(&db_path).await?;
    let auth = AuthGate::from_env();
    let server = Server::new(store, auth);
    server.run().await?;

    tracing::info!(target = "persona_mcp", "persona MCP server stopped");
    Ok(())
}

fn init_tracing() {
    // Stdout is reserved for JSON-RPC protocol frames. Tracing MUST
    // go to stderr — `fmt::layer().with_writer(std::io::stderr)`.
    let filter =
        EnvFilter::try_from_env("DEVPULSE_PERSONA_LOG").unwrap_or_else(|_| EnvFilter::new("info"));
    let _ = fmt()
        .with_env_filter(filter)
        .with_writer(std::io::stderr)
        .with_target(true)
        .try_init();
}

fn resolve_db_path() -> anyhow::Result<PathBuf> {
    let configured = env::var_os("DEVPULSE_PERSONA_DB")
        .context("DEVPULSE_PERSONA_DB must name the configured absolute Turso database path")?;
    let path = PathBuf::from(configured);
    anyhow::ensure!(
        path.is_absolute(),
        "DEVPULSE_PERSONA_DB must be an absolute path"
    );
    Ok(path)
}

#[cfg(feature = "rro")]
async fn open_store(db_path: &std::path::Path) -> anyhow::Result<std::sync::Arc<PersonaStore>> {
    // No vector backend is connected by this standalone entry point.
    PersonaStore::open(db_path, None)
        .await
        .map_err(|e| anyhow::anyhow!(e))
        .context("open PersonaStore")
}

#[cfg(not(feature = "rro"))]
async fn open_store(db_path: &std::path::Path) -> anyhow::Result<std::sync::Arc<PersonaStore>> {
    PersonaStore::open(db_path)
        .await
        .map_err(|e| anyhow::anyhow!(e))
        .context("open PersonaStore")
}
