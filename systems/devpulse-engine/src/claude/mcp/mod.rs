//! MCP Server — `DevPulse` tools via official rmcp SDK.
//!
//! Exposes platform tools to Claude Code (stdio) and Claude Desktop (future HTTP).
//! Tools access Platform services via `Arc<Platform>`.
//!
//! Protocol version: 2025-06-18 (rmcp handles wire protocol).
//! Transport: stdio (primary for Claude Code CLI).

pub mod tools;

use std::sync::Arc;

use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::{CallToolResult, Implementation, ServerCapabilities, ServerInfo};
use rmcp::schemars;
use rmcp::tool;
use rmcp::ServerHandler;
use serde::Deserialize;

use crate::platform::Platform;

/// `DevPulse` MCP Server — tool-bearing server struct.
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

#[rmcp::tool_handler]
impl ServerHandler for DevPulseMcpServer {
    fn get_info(&self) -> ServerInfo {
        let mut info = ServerInfo::default();
        info.capabilities = ServerCapabilities::builder().enable_tools().build();
        info.server_info = Implementation::new("devpulse-mcp", env!("CARGO_PKG_VERSION"));
        info.instructions = Some(
            "DevPulse platform tools. Query databases, read project files, \
             check system health. All database queries are read-only."
                .into(),
        );
        info
    }
}

// ═══════════════════════════════════════════════════════════════
// Tool parameter structs (schemars-derived for MCP schema gen)
// ═══════════════════════════════════════════════════════════════

/// Parameters for `query_libsql` tool.
#[derive(Deserialize, schemars::JsonSchema, Default)]
struct QueryLibsqlParams {
    /// SQL query (SELECT or WITH only).
    sql: String,
    /// Database scope: "system" or "user".
    scope: Option<String>,
}

/// Parameters for `repo_get_file` tool.
#[derive(Deserialize, schemars::JsonSchema, Default)]
struct RepoGetFileParams {
    /// File path relative to project root.
    path: String,
}

/// Parameters for `repo_list_files` tool.
#[derive(Deserialize, schemars::JsonSchema, Default)]
struct RepoListFilesParams {
    /// Directory path relative to project root.
    path: String,
    /// Recurse into subdirectories.
    recursive: Option<bool>,
}

/// Parameters for `shell_execute` tool.
#[derive(Deserialize, schemars::JsonSchema, Default)]
struct ShellExecuteParams {
    /// Shell command to execute.
    command: String,
    /// Working directory (optional).
    cwd: Option<String>,
    /// Timeout in milliseconds (default 30000).
    timeout_ms: Option<u64>,
}

// ═══════════════════════════════════════════════════════════════
// Tool implementations
// ═══════════════════════════════════════════════════════════════

/// Tool implementations — each delegates to the `tools/` module for business logic.
#[rmcp::tool_router]
impl DevPulseMcpServer {
    /// Get platform health status — all services, boot time, uptime.
    #[tool(description = "Get platform health status — all subsystems with uptime")]
    async fn get_health(&self) -> Result<CallToolResult, rmcp::ErrorData> {
        let result = tools::get_health::execute(&self.platform).await;
        Ok(CallToolResult::success(vec![rmcp::model::Content::text(
            result,
        )]))
    }

    /// Query `LibSQL` database (read-only). Returns JSON rows.
    #[tool(description = "Execute a read-only SQL query against libSQL (SELECT/WITH only)")]
    async fn query_libsql(
        &self,
        Parameters(params): Parameters<QueryLibsqlParams>,
    ) -> Result<CallToolResult, rmcp::ErrorData> {
        let scope = params.scope.as_deref().unwrap_or("user");
        let result = tools::query_libsql::execute(&self.platform, &params.sql, scope).await;
        let is_error = result.starts_with("ERROR:");
        if is_error {
            Ok(CallToolResult::error(vec![rmcp::model::Content::text(
                result,
            )]))
        } else {
            Ok(CallToolResult::success(vec![rmcp::model::Content::text(
                result,
            )]))
        }
    }

    /// Read a file from the project repository.
    #[tool(description = "Read a file from the project workspace (500KB max)")]
    async fn repo_get_file(
        &self,
        Parameters(params): Parameters<RepoGetFileParams>,
    ) -> Result<CallToolResult, rmcp::ErrorData> {
        let result = tools::repo_get_file::execute(&self.platform, &params.path).await;
        let is_error = result.starts_with("ERROR:");
        if is_error {
            Ok(CallToolResult::error(vec![rmcp::model::Content::text(
                result,
            )]))
        } else {
            Ok(CallToolResult::success(vec![rmcp::model::Content::text(
                result,
            )]))
        }
    }

    /// List files in a directory.
    #[tool(description = "List files in a directory with sizes (recursive to depth 3)")]
    async fn repo_list_files(
        &self,
        Parameters(params): Parameters<RepoListFilesParams>,
    ) -> Result<CallToolResult, rmcp::ErrorData> {
        let recursive = params.recursive.unwrap_or(false);
        let result = tools::repo_list_files::execute(&self.platform, &params.path, recursive).await;
        let is_error = result.starts_with("ERROR:");
        if is_error {
            Ok(CallToolResult::error(vec![rmcp::model::Content::text(
                result,
            )]))
        } else {
            Ok(CallToolResult::success(vec![rmcp::model::Content::text(
                result,
            )]))
        }
    }

    /// Execute a shell command (`full`-feature builds only).
    ///
    /// The method itself is unconditional so the `#[rmcp::tool_router]`
    /// proc macro always sees it — proc-macro expansion runs before cfg
    /// evaluation, so a `#[cfg(feature = "full")]` on the method made
    /// the generated router reference a method that vanished under
    /// `--no-default-features --features engine` (IP protection gate).
    /// The body is cfg-switched instead: when `full` is off (restricted
    /// engine build) it returns a structured error; when on it delegates
    /// to `tools::shell_execute::execute` as before.
    #[tool(description = "Execute a shell command in the project workspace (dev builds only)")]
    async fn shell_execute(
        &self,
        Parameters(params): Parameters<ShellExecuteParams>,
    ) -> Result<CallToolResult, rmcp::ErrorData> {
        #[cfg(feature = "full")]
        {
            let result = tools::shell_execute::execute(
                &self.platform,
                &params.command,
                params.cwd.as_deref(),
                params.timeout_ms,
            )
            .await;
            let is_error = result.starts_with("ERROR:");
            if is_error {
                Ok(CallToolResult::error(vec![rmcp::model::Content::text(
                    result,
                )]))
            } else {
                Ok(CallToolResult::success(vec![rmcp::model::Content::text(
                    result,
                )]))
            }
        }
        #[cfg(not(feature = "full"))]
        {
            let ShellExecuteParams {
                command,
                cwd,
                timeout_ms,
            } = params;
            let _ = (command, cwd, timeout_ms);
            Ok(CallToolResult::error(vec![rmcp::model::Content::text(
                "shell_execute is disabled: this build was compiled without the `kernel` feature \
                 (engine-only / IP-protected build)."
                    .to_string(),
            )]))
        }
    }
}

/// Start the MCP server on stdio transport.
///
/// Called during platform boot when `config.mcp.auto_start` is true.
/// Blocks until the connection closes (stdin EOF).
///
/// # Errors
/// Returns an error if the stdio transport cannot be attached, the MCP server
/// fails to start, or the active MCP session terminates with an error.
pub async fn start_stdio(platform: Arc<Platform>) -> anyhow::Result<()> {
    use rmcp::transport::io::stdio;
    use rmcp::ServiceExt;

    tracing::info!("MCP stdio server starting — tools registered");
    let server = DevPulseMcpServer::new(platform);
    let service = server
        .serve(stdio())
        .await
        .map_err(|e| anyhow::anyhow!("MCP server failed to start: {e}"))?;
    tracing::info!("MCP stdio server connected — waiting for requests");
    service
        .waiting()
        .await
        .map_err(|e| anyhow::anyhow!("MCP server error: {e}"))?;
    tracing::info!("MCP stdio server disconnected");
    Ok(())
}
