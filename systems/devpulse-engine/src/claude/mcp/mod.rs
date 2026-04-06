//! MCP server — JSON-RPC 2.0 over Streamable HTTP + stdio.
//!
//! Streamable HTTP (SSE + POST /mcp): always available.
//! Stdio: `#[cfg(feature = "internal")]` only (Claude Code).
//!
//! Protocol version: 2025-06-18
//! Security: Origin validation, session management (Mcp-Session-Id).

pub mod handler;
pub mod protocol;
pub mod tools;
pub mod transport_sse;

#[cfg(feature = "internal")]
pub mod transport_stdio;

use crate::claude::McpServerConfig;
use crate::platform::Platform;
use handler::McpHandler;
use std::sync::Arc;
use tokio::task::JoinHandle;

/// Running MCP server instance.
pub struct McpServer {
    sse_handle: Option<JoinHandle<()>>,
    #[cfg(feature = "internal")]
    stdio_handle: Option<JoinHandle<()>>,
}

impl McpServer {
    /// Start MCP server with configured transports.
    ///
    /// Requires `Arc<Platform>` — tools access services through this.
    pub async fn start(
        config: &McpServerConfig,
        platform: Arc<Platform>,
    ) -> anyhow::Result<Self> {
        let handler = Arc::new(McpHandler::new(platform));

        let mut server = Self {
            sse_handle: None,
            #[cfg(feature = "internal")]
            stdio_handle: None,
        };

        if config.sse.enabled {
            let handle =
                transport_sse::start(config.sse.port, &config.sse.bind, handler.clone()).await?;
            server.sse_handle = Some(handle);
        }

        #[cfg(feature = "internal")]
        if config.stdio.enabled {
            let handle = transport_stdio::start().await?;
            server.stdio_handle = Some(handle);
        }

        Ok(server)
    }

    /// Shutdown MCP server — abort all transport tasks.
    pub fn shutdown(&self) {
        if let Some(h) = &self.sse_handle {
            h.abort();
        }
        #[cfg(feature = "internal")]
        if let Some(h) = &self.stdio_handle {
            h.abort();
        }
    }
}
