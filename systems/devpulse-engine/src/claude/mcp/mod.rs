//! MCP Server — DevPulse tools via official rmcp SDK.
//!
//! Exposes platform tools to Claude Code (stdio) and Claude Desktop (future HTTP).
//! Tools access Platform services via `Arc<Platform>`.
//!
//! Protocol version: 2025-06-18 (rmcp handles wire protocol).
//! Transport: stdio (primary for Claude Code CLI).

pub mod tools;

use std::sync::Arc;

use rmcp::handler::server::tool::ToolCallContext;
use rmcp::model::{
    CallToolResult, Implementation, ProtocolVersion, ServerCapabilities, ServerInfo,
};
use rmcp::schemars;
use rmcp::tool;
use rmcp::{ServerHandler, tool_router};

use crate::platform::Platform;

/// DevPulse MCP Server — tool-bearing server struct.
///
/// Holds `Arc<Platform>` for tool handlers to access all services.
/// Each `#[tool]` method receives `&self` and can query databases,
/// read files, execute commands, etc.
#[derive(Clone)]
pub struct DevPulseMcpServer {
    platform: Arc<Platform>,
}

impl DevPulseMcpServer {
    /// Create a new MCP server instance with access to the platform.
    pub fn new(platform: Arc<Platform>) -> Self {
        Self { platform }
    }
}

#[tool(tool_box)]
impl ServerHandler for DevPulseMcpServer {
    fn get_info(&self) -> ServerInfo {
        ServerInfo {
            protocol_version: ProtocolVersion::V_2025_03_26,
            capabilities: ServerCapabilities::builder()
                .enable_tools()
                .build(),
            server_info: Implementation {
                name: "devpulse-mcp".into(),
                version: env!("CARGO_PKG_VERSION").into(),
            },
            instructions: Some(
                "DevPulse platform tools. Query databases, read project files, \
                 check system health. All database queries are read-only."
                    .into(),
            ),
        }
    }
}

/// Tool implementations — each delegates to the `tools/` module for business logic.
#[tool(tool_box)]
impl DevPulseMcpServer {
    /// Get platform health status — all services, boot time, uptime.
    #[tool(description = "Get platform health status — all subsystems with uptime")]
    async fn get_health(&self) -> Result<CallToolResult, rmcp::Error> {
        let result = tools::get_health::execute(&self.platform).await;
        Ok(CallToolResult::success(vec![rmcp::model::Content::text(result)]))
    }

    /// Query LibSQL database (read-only). Returns JSON rows.
    #[tool(description = "Execute a read-only SQL query against libSQL (SELECT/WITH only)")]
    async fn query_libsql(
        &self,
        #[tool(param, description = "SQL query (SELECT or WITH only)")] sql: String,
        #[tool(param, description = "Database scope: 'system' or 'user'")] scope: Option<String>,
    ) -> Result<CallToolResult, rmcp::Error> {
        let scope = scope.as_deref().unwrap_or("user");
        let result = tools::query_libsql::execute(&self.platform, &sql, scope).await;
        let is_error = result.starts_with("ERROR:");
        if is_error {
            Ok(CallToolResult::error(vec![rmcp::model::Content::text(result)]))
        } else {
            Ok(CallToolResult::success(vec![rmcp::model::Content::text(result)]))
        }
    }

    /// Read a file from the project repository.
    #[tool(description = "Read a file from the project workspace (500KB max)")]
    async fn repo_get_file(
        &self,
        #[tool(param, description = "File path relative to project root")] path: String,
    ) -> Result<CallToolResult, rmcp::Error> {
        let result = tools::repo_get_file::execute(&self.platform, &path).await;
        let is_error = result.starts_with("ERROR:");
        if is_error {
            Ok(CallToolResult::error(vec![rmcp::model::Content::text(result)]))
        } else {
            Ok(CallToolResult::success(vec![rmcp::model::Content::text(result)]))
        }
    }

    /// List files in a directory.
    #[tool(description = "List files in a directory with sizes (recursive to depth 3)")]
    async fn repo_list_files(
        &self,
        #[tool(param, description = "Directory path relative to project root")] path: String,
        #[tool(param, description = "Recurse into subdirectories")] recursive: Option<bool>,
    ) -> Result<CallToolResult, rmcp::Error> {
        let recursive = recursive.unwrap_or(false);
        let result = tools::repo_list_files::execute(&self.platform, &path, recursive).await;
        let is_error = result.starts_with("ERROR:");
        if is_error {
            Ok(CallToolResult::error(vec![rmcp::model::Content::text(result)]))
        } else {
            Ok(CallToolResult::success(vec![rmcp::model::Content::text(result)]))
        }
    }

    /// Execute a shell command (dev builds only).
    #[cfg(feature = "kernel")]
    #[tool(description = "Execute a shell command in the project workspace (dev builds only)")]
    async fn shell_execute(
        &self,
        #[tool(param, description = "Shell command to execute")] command: String,
        #[tool(param, description = "Working directory (optional)")] cwd: Option<String>,
        #[tool(param, description = "Timeout in milliseconds (default 30000)")] timeout_ms: Option<u64>,
    ) -> Result<CallToolResult, rmcp::Error> {
        let result = tools::shell_execute::execute(
            &self.platform,
            &command,
            cwd.as_deref(),
            timeout_ms,
        )
        .await;
        let is_error = result.starts_with("ERROR:");
        if is_error {
            Ok(CallToolResult::error(vec![rmcp::model::Content::text(result)]))
        } else {
            Ok(CallToolResult::success(vec![rmcp::model::Content::text(result)]))
        }
    }
}

/// Start the MCP server on stdio transport.
///
/// Called during platform boot when `config.mcp.auto_start` is true.
/// Blocks until the connection closes (stdin EOF).
pub async fn start_stdio(platform: Arc<Platform>) -> anyhow::Result<()> {
    use rmcp::transport::io::stdio;

    tracing::info!("MCP stdio server starting — tools registered");
    let server = DevPulseMcpServer::new(platform);
    let service = server.serve(stdio()).await
        .map_err(|e| anyhow::anyhow!("MCP server failed to start: {e}"))?;
    tracing::info!("MCP stdio server connected — waiting for requests");
    service.waiting().await
        .map_err(|e| anyhow::anyhow!("MCP server error: {e}"))?;
    tracing::info!("MCP stdio server disconnected");
    Ok(())
}
