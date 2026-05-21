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
//!   When unset, every request gets a typed [`crate::error::ErrorKind::Auth`]
//!   envelope until Slice 6 wires Authentik JWT validation.
//! - `DEVPULSE_PERSONA_DB` — absolute path to the LibSQL file backing
//!   `persona_blocks` + `persona_idempotency`. Defaults to
//!   `${data_dir}/devpulse/persona.libsql` when unset; on Windows
//!   `data_dir` resolves via `dirs::data_local_dir`.

use anyhow::Context;
use devpulse_persona_mcp::{server::Server, store::PersonaStore};
use devpulse_persona_mcp::auth::AuthGate;
use std::env;
use std::path::PathBuf;
use tracing_subscriber::{fmt, EnvFilter};

const DEFAULT_DB_NAME: &str = "persona.libsql";
const DEFAULT_DATA_SUBDIR: &str = "devpulse";

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
    let filter = EnvFilter::try_from_env("DEVPULSE_PERSONA_LOG")
        .unwrap_or_else(|_| EnvFilter::new("info"));
    let _ = fmt()
        .with_env_filter(filter)
        .with_writer(std::io::stderr)
        .with_target(true)
        .try_init();
}

fn resolve_db_path() -> anyhow::Result<PathBuf> {
    if let Ok(p) = env::var("DEVPULSE_PERSONA_DB") {
        return Ok(PathBuf::from(p));
    }

    // Fallback: ${LOCALAPPDATA}/devpulse/persona.libsql on Windows,
    // ${XDG_DATA_HOME:-$HOME/.local/share}/devpulse/persona.libsql on
    // Unix. We avoid pulling in the `dirs` crate dependency for one
    // call by replicating the resolution manually.
    let base = match env::var_os("LOCALAPPDATA") {
        Some(v) => PathBuf::from(v),
        None => env::var_os("XDG_DATA_HOME")
            .map(PathBuf::from)
            .or_else(|| {
                env::var_os("HOME").map(|h| {
                    let mut p = PathBuf::from(h);
                    p.push(".local");
                    p.push("share");
                    p
                })
            })
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "no LOCALAPPDATA, XDG_DATA_HOME, or HOME set — \
                     supply DEVPULSE_PERSONA_DB explicitly"
                )
            })?,
    };

    Ok(base.join(DEFAULT_DATA_SUBDIR).join(DEFAULT_DB_NAME))
}

#[cfg(feature = "rro")]
async fn open_store(db_path: &std::path::Path) -> anyhow::Result<std::sync::Arc<PersonaStore>> {
    // Slice 3 wires the embedded Qdrant adapter here. For v1 the
    // adapter is `None` even with the feature on — vector recall path
    // still uses the LIKE fallback until the embedder lands.
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
