//! JSON-RPC 2.0 types for MCP protocol.
//!
//! Hand-rolled — no external JSON-RPC crate needed.
//! These are wire protocol types, NOT TS-exported (no specta::Type).

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// JSON-RPC 2.0 protocol version.
pub const JSONRPC_VERSION: &str = "2.0";

/// MCP protocol version supported by this server.
/// Updated to 2025-06-18 — Streamable HTTP transport, session management.
pub const MCP_PROTOCOL_VERSION: &str = "2025-06-18";

/// HTTP header for MCP session tracking.
pub const MCP_SESSION_HEADER: &str = "Mcp-Session-Id";

// ═════════════════════════════════════════════════════════════
// REQUEST / RESPONSE
// ═════════════════════════════════════════════════════════════

/// Incoming JSON-RPC request.
#[derive(Debug, Clone, Deserialize)]
pub struct JsonRpcRequest {
    /// Protocol version — must be `"2.0"`.
    pub jsonrpc: String,
    /// Request ID (absent for notifications).
    pub id: Option<Value>,
    /// Method name (e.g. `"initialize"`, `"tools/call"`).
    pub method: String,
    /// Method parameters, if any.
    #[serde(default)]
    pub params: Option<Value>,
}

/// Outgoing JSON-RPC response.
#[derive(Debug, Clone, Serialize)]
pub struct JsonRpcResponse {
    /// Protocol version — always `"2.0"`.
    pub jsonrpc: String,
    /// Request ID this response corresponds to.
    pub id: Value,
    /// Result payload on success.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
    /// Error payload on failure.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
}

impl JsonRpcResponse {
    /// Success response.
    pub fn success(id: Value, result: Value) -> Self {
        Self {
            jsonrpc: JSONRPC_VERSION.to_string(),
            id,
            result: Some(result),
            error: None,
        }
    }

    /// Error response.
    pub fn error(id: Value, error: JsonRpcError) -> Self {
        Self {
            jsonrpc: JSONRPC_VERSION.to_string(),
            id,
            result: None,
            error: Some(error),
        }
    }
}

/// JSON-RPC error object.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcError {
    /// Numeric error code (see [`error_codes`]).
    pub code: i32,
    /// Human-readable error description.
    pub message: String,
    /// Additional structured error data.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
}

/// Standard JSON-RPC error codes.
pub mod error_codes {
    /// Invalid JSON was received by the server.
    pub const PARSE_ERROR: i32 = -32700;
    /// The JSON sent is not a valid JSON-RPC request.
    pub const INVALID_REQUEST: i32 = -32600;
    /// The method does not exist or is not available.
    pub const METHOD_NOT_FOUND: i32 = -32601;
    /// Invalid method parameters.
    pub const INVALID_PARAMS: i32 = -32602;
    /// Internal server error.
    pub const INTERNAL_ERROR: i32 = -32603;
}

// ═════════════════════════════════════════════════════════════
// MCP-SPECIFIC TYPES
// ═════════════════════════════════════════════════════════════

/// MCP initialize request params.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InitializeParams {
    /// MCP protocol version the client supports.
    pub protocol_version: String,
    /// Client capabilities (opaque — server does not validate).
    #[serde(default)]
    pub capabilities: Value,
    /// Client identification (name + version).
    #[serde(default)]
    pub client_info: Option<ClientInfo>,
}

/// Client identification.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientInfo {
    /// Client application name (e.g. `"claude-code"`).
    pub name: String,
    /// Client version string.
    #[serde(default)]
    pub version: Option<String>,
}

/// MCP initialize response.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitializeResult {
    /// MCP protocol version the server supports.
    pub protocol_version: String,
    /// Server capabilities advertised to the client.
    pub capabilities: ServerCapabilities,
    /// Server identification (name + version).
    pub server_info: ServerInfo,
}

/// Server identification.
#[derive(Debug, Clone, Serialize)]
pub struct ServerInfo {
    /// Server application name (e.g. `"devpulse"`).
    pub name: String,
    /// Server version from `Cargo.toml`.
    pub version: String,
}

/// Server capabilities advertised during initialization.
#[derive(Debug, Clone, Serialize)]
pub struct ServerCapabilities {
    /// Tools capability — present if server exposes tools.
    pub tools: Option<ToolsCapability>,
}

/// Tools capability.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolsCapability {
    /// Whether the tool list can change after initialization.
    pub list_changed: bool,
}

// ═════════════════════════════════════════════════════════════
// TOOL TYPES
// ═════════════════════════════════════════════════════════════

/// Tool definition returned by tools/list.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolDefinition {
    /// Tool name used in `tools/call` requests.
    pub name: String,
    /// Human-readable tool description for the client.
    pub description: String,
    /// JSON Schema describing the tool's input parameters.
    pub input_schema: Value,
}

/// Tool call request params.
#[derive(Debug, Clone, Deserialize)]
pub struct ToolCallParams {
    /// Name of the tool to invoke.
    pub name: String,
    /// Arguments to pass to the tool handler.
    #[serde(default)]
    pub arguments: Value,
}

/// Tool call result.
#[derive(Debug, Clone, Serialize)]
pub struct ToolCallResult {
    /// Content blocks in the response.
    pub content: Vec<ToolContent>,
    /// `true` if the tool execution failed.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_error: Option<bool>,
}

/// Content block in a tool result.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum ToolContent {
    /// Plain text content.
    #[serde(rename = "text")]
    Text {
        /// The text payload.
        text: String,
    },
}
