//! MCP method dispatch — routes JSON-RPC requests to handlers.
//!
//! The handler holds `Arc<Platform>` and `Arc<ToolRegistry>` for real tool execution.

use serde_json::{json, Value};
use std::sync::Arc;

use super::protocol::{
    InitializeParams, InitializeResult, JsonRpcError, JsonRpcRequest, JsonRpcResponse,
    MCP_PROTOCOL_VERSION, ServerCapabilities, ServerInfo, ToolCallParams, ToolsCapability,
    error_codes,
};
use super::tools::ToolRegistry;
use crate::platform::Platform;

/// MCP request handler with access to platform services and tool registry.
pub struct McpHandler {
    platform: Arc<Platform>,
    tools: Arc<ToolRegistry>,
}

impl McpHandler {
    /// Create a new handler with platform access and tool registry.
    pub fn new(platform: Arc<Platform>) -> Self {
        Self {
            platform: platform.clone(),
            tools: Arc::new(ToolRegistry::new()),
        }
    }

    /// Dispatch a JSON-RPC request to the appropriate handler.
    ///
    /// Returns `None` for notifications (no response expected).
    pub async fn dispatch(&self, request: &JsonRpcRequest) -> Option<JsonRpcResponse> {
        let id = match &request.id {
            Some(id) => id.clone(),
            None => {
                // Notification — handle known notification methods
                match request.method.as_str() {
                    "notifications/initialized" => {
                        tracing::info!("MCP client confirmed initialization");
                    }
                    "notifications/cancelled" => {
                        tracing::debug!("MCP client cancelled a request");
                    }
                    _ => {
                        tracing::debug!(method = %request.method, "Unknown MCP notification");
                    }
                }
                return None;
            }
        };

        let response = match request.method.as_str() {
            "initialize" => self.handle_initialize(id.clone(), &request.params),
            "ping" => JsonRpcResponse::success(id.clone(), json!({})),
            "tools/list" => self.handle_tools_list(id.clone()),
            "tools/call" => self.handle_tools_call(id.clone(), &request.params).await,
            _ => JsonRpcResponse::error(
                id.clone(),
                JsonRpcError {
                    code: error_codes::METHOD_NOT_FOUND,
                    message: format!("Method not found: {}", request.method),
                    data: None,
                },
            ),
        };

        Some(response)
    }

    /// Handle `initialize` — return server info and capabilities.
    fn handle_initialize(&self, id: Value, params: &Option<Value>) -> JsonRpcResponse {
        if let Some(params) = params {
            match serde_json::from_value::<InitializeParams>(params.clone()) {
                Ok(init) => {
                    tracing::info!(
                        client_version = %init.protocol_version,
                        client = ?init.client_info,
                        "MCP client connected"
                    );
                }
                Err(e) => {
                    tracing::warn!("Failed to parse initialize params: {e}");
                }
            }
        }

        let result = InitializeResult {
            protocol_version: MCP_PROTOCOL_VERSION.to_string(),
            capabilities: ServerCapabilities {
                tools: Some(ToolsCapability { list_changed: false }),
            },
            server_info: ServerInfo {
                name: "devpulse".to_string(),
                version: env!("CARGO_PKG_VERSION").to_string(),
            },
        };

        match serde_json::to_value(result) {
            Ok(val) => JsonRpcResponse::success(id, val),
            Err(e) => JsonRpcResponse::error(
                id,
                JsonRpcError {
                    code: error_codes::INTERNAL_ERROR,
                    message: format!("Failed to serialize initialize result: {e}"),
                    data: None,
                },
            ),
        }
    }

    /// Handle `tools/list` — return all registered tool definitions.
    fn handle_tools_list(&self, id: Value) -> JsonRpcResponse {
        let definitions = self.tools.list();
        JsonRpcResponse::success(id, json!({ "tools": definitions }))
    }

    /// Handle `tools/call` — execute a tool by name with arguments.
    async fn handle_tools_call(&self, id: Value, params: &Option<Value>) -> JsonRpcResponse {
        let call_params = match params {
            Some(p) => match serde_json::from_value::<ToolCallParams>(p.clone()) {
                Ok(cp) => cp,
                Err(e) => {
                    return JsonRpcResponse::error(
                        id,
                        JsonRpcError {
                            code: error_codes::INVALID_PARAMS,
                            message: format!("Invalid tool call params: {e}"),
                            data: None,
                        },
                    );
                }
            },
            None => {
                return JsonRpcResponse::error(
                    id,
                    JsonRpcError {
                        code: error_codes::INVALID_PARAMS,
                        message: "Missing params for tools/call".to_string(),
                        data: None,
                    },
                );
            }
        };

        tracing::info!(tool = %call_params.name, "MCP tool call");

        let result = self
            .tools
            .call(&call_params.name, call_params.arguments, self.platform.clone())
            .await;

        match serde_json::to_value(result) {
            Ok(val) => JsonRpcResponse::success(id, val),
            Err(e) => JsonRpcResponse::error(
                id,
                JsonRpcError {
                    code: error_codes::INTERNAL_ERROR,
                    message: format!("Serialization error: {e}"),
                    data: None,
                },
            ),
        }
    }
}
