//! JSON-RPC 2.0 dispatch loop over stdio.
//!
//! Implements the subset of the MCP spec (2025-06-18) required for
//! Claude Desktop / Claude Code / `DevPulse` orchestrator interop:
//!
//! - `initialize` — handshake, returns server capabilities.
//! - `tools/list` — advertises the persona.* verb surface.
//! - `tools/call` — invokes a verb by name with JSON arguments.
//! - `ping` — health check.
//!
//! Framing is newline-delimited JSON on any stream: stdin and stdout in
//! direct mode, a pipe connection when `DevPulse` owns the store. In direct
//! mode stderr is reserved for tracing — writing to stdout outside the
//! JSON-RPC protocol breaks clients.
//!
//! # Concurrency
//!
//! One [`Server`] is one connection: it processes requests in order and writes
//! one complete response frame at a time. Connections share the store, and
//! each carries its own [`Binding`]. Logs are kept off the protocol stream.
//!
//! Background work (idempotency sweep, telemetry flush) belongs to
//! `main.rs` — keep the dispatch loop free of side tasks per
//! `feedback_no_process_flooding.md`.

use crate::auth::AuthGate;
use crate::binding::Binding;
use crate::error::{ErrorEnvelope, ErrorKind, PersonaError};
use crate::store::PersonaStore;
use crate::verbs::{self, PersonaListArgs, PersonaLoadArgs, PersonaRecallArgs, PersonaSaveArgs};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::sync::Arc;
use std::sync::atomic::{AtomicU8, Ordering};
use tokio::io::{AsyncBufReadExt, AsyncRead, AsyncWrite, AsyncWriteExt, BufReader};

/// MCP protocol version this server speaks.
pub const MCP_PROTOCOL_VERSION: &str = "2025-06-18";
/// `serverInfo.name` — matches the workspace-member crate name.
pub const SERVER_NAME: &str = "devpulse-persona-mcp";
/// `serverInfo.version` — kept in sync with `Cargo.toml`.
pub const SERVER_VERSION: &str = env!("CARGO_PKG_VERSION");

/// JSON-RPC 2.0 request envelope.
#[derive(Debug, Deserialize)]
struct JsonRpcRequest {
    jsonrpc: String,
    #[serde(default)]
    id: Option<Value>,
    method: String,
    #[serde(default)]
    params: Value,
}

/// JSON-RPC 2.0 success response envelope.
#[derive(Debug, Serialize)]
struct JsonRpcSuccess<T: Serialize> {
    jsonrpc: &'static str,
    id: Value,
    result: T,
}

/// JSON-RPC 2.0 error response envelope.
#[derive(Debug, Serialize)]
struct JsonRpcError {
    jsonrpc: &'static str,
    id: Value,
    error: ErrorEnvelope,
}

/// One MCP connection to the memory.
pub struct Server {
    store: Arc<PersonaStore>,
    auth: AuthGate,
    binding: Binding,
    initialization: AtomicU8,
}

impl Server {
    /// Construct over an open [`PersonaStore`] and auth gate, unbound.
    #[must_use]
    pub fn new(store: Arc<PersonaStore>, auth: AuthGate) -> Self {
        Self {
            store,
            auth,
            binding: Binding::Unbound,
            initialization: AtomicU8::new(0),
        }
    }

    /// Narrow this connection to what `binding` allows.
    #[must_use]
    pub fn bound(mut self, binding: Binding) -> Self {
        self.binding = binding;
        self
    }

    /// Serve on stdin/stdout. Returns when stdin reaches EOF (the parent
    /// process closed the pipe — Claude Desktop teardown).
    ///
    /// # Errors
    /// Returns `Err` only on irrecoverable I/O failure.
    pub async fn run(self) -> anyhow::Result<()> {
        self.serve(tokio::io::stdin(), tokio::io::stdout()).await
    }

    /// Serve one connection until its input reaches EOF.
    ///
    /// # Errors
    /// Returns `Err` only on irrecoverable I/O failure on the streams.
    /// Per-request errors are reported in-band via JSON-RPC error envelopes
    /// and do not abort the loop.
    pub async fn serve<R, W>(&self, input: R, mut output: W) -> anyhow::Result<()>
    where
        R: AsyncRead + Unpin,
        W: AsyncWrite + Unpin,
    {
        let mut reader = BufReader::new(input);
        let mut line = String::new();

        loop {
            line.clear();
            let read = reader.read_line(&mut line).await?;
            if read == 0 {
                // EOF — the other side closed its end.
                tracing::info!(target = "persona_mcp", "input EOF, dispatch loop exiting");
                break;
            }
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            let response_text = self.dispatch(trimmed).await;
            if let Some(text) = response_text {
                output.write_all(text.as_bytes()).await?;
                output.write_all(b"\n").await?;
                output.flush().await?;
            }
        }

        Ok(())
    }

    /// Parse one inbound frame and return the serialised response (or
    /// `None` if the frame was a JSON-RPC notification — no `id`).
    async fn dispatch(&self, raw: &str) -> Option<String> {
        let envelope: Value = match serde_json::from_str(raw) {
            Ok(value) => value,
            Err(error) => {
                return Some(serialise_error(
                    Value::Null,
                    protocol_error(-32_700, format!("parse error: {error}")),
                ));
            }
        };
        let request: JsonRpcRequest = match serde_json::from_value(envelope.clone()) {
            Ok(request) => request,
            Err(error) => {
                return Some(serialise_error(
                    Value::Null,
                    protocol_error(-32_600, format!("invalid request: {error}")),
                ));
            }
        };
        if request.jsonrpc != "2.0"
            || envelope
                .get("id")
                .is_some_and(|id| !id.is_string() && !id.is_i64() && !id.is_u64())
        {
            return Some(serialise_error(
                Value::Null,
                protocol_error(-32_600, "invalid JSON-RPC version or request id"),
            ));
        }
        let Some(id) = request.id else {
            if request.method == "notifications/initialized" {
                let _ =
                    self.initialization
                        .compare_exchange(1, 2, Ordering::AcqRel, Ordering::Acquire);
            }
            // Tool invocations require request IDs. Notifications must never
            // execute a write and cannot produce a response.
            return None;
        };
        let outcome = self.dispatch_method(&request.method, request.params).await;

        match outcome {
            Ok(result) => Some(serialise_success(id, result)),
            Err(env) => Some(serialise_error(id, env)),
        }
    }

    /// Method-name router.
    async fn dispatch_method(&self, method: &str, params: Value) -> Result<Value, ErrorEnvelope> {
        if !matches!(method, "initialize" | "ping")
            && self.initialization.load(Ordering::Acquire) != 2
        {
            return Err(protocol_error(
                -32_600,
                "initialize the MCP session before calling tools",
            ));
        }
        match method {
            "initialize" => {
                if !params["protocolVersion"].is_string()
                    || !params["capabilities"].is_object()
                    || !params["clientInfo"]["name"].is_string()
                    || !params["clientInfo"]["version"].is_string()
                {
                    return Err(protocol_error(
                        -32_602,
                        "initialize requires protocolVersion, capabilities and clientInfo",
                    ));
                }
                self.initialization
                    .compare_exchange(0, 1, Ordering::AcqRel, Ordering::Acquire)
                    .map_err(|_| protocol_error(-32_600, "session already initialized"))?;
                Ok(self.initialize())
            }
            "ping" => Ok(json!({})),
            "tools/list" => Ok(self.tools_list()),
            "tools/call" => self.tools_call(params).await,
            other => Err(ErrorEnvelope {
                code: -32_601,
                message: format!("method not found: {other}"),
                data: crate::error::ErrorEnvelopeData {
                    kind: ErrorKind::InvalidArg,
                    trace_id: String::new(),
                    retry_after_ms: 0,
                },
            }),
        }
    }

    /// `initialize` — return MCP server capabilities.
    #[expect(
        clippy::unused_self,
        reason = "kept on Server impl for protocol consistency; Slice 6 will wire per-session capability gating via self.auth_gate"
    )]
    fn initialize(&self) -> Value {
        json!({
            "protocolVersion": MCP_PROTOCOL_VERSION,
            "serverInfo": {
                "name": SERVER_NAME,
                "version": SERVER_VERSION,
            },
            "capabilities": {
                "tools": {}
            }
        })
    }

    /// `tools/list` — advertise the persona.* verb surface.
    #[expect(
        clippy::unused_self,
        reason = "kept on Server impl for protocol consistency; Slice 6 will scope tool visibility per auth context via self.auth_gate"
    )]
    fn tools_list(&self) -> Value {
        json!({
            "tools": [
                tool_descriptor(
                    "persona.load",
                    "Load all core-memory blocks under (scope, slug).",
                    json!({
                        "type": "object",
                        "required": ["scope"],
                        "properties": {
                            "scope": { "type": "string", "enum": ["user", "project"] },
                            "slug":  { "type": ["string", "null"] }
                        }
                    }),
                ),
                tool_descriptor(
                    "persona.save",
                    "Upsert a core-memory block by (scope, slug, label).",
                    json!({
                        "type": "object",
                        "required": ["scope", "label", "body", "idempotency_key"],
                        "properties": {
                            "scope":           { "type": "string", "enum": ["user", "project"] },
                            "slug":            { "type": ["string", "null"] },
                            "label":           { "type": "string" },
                            "body":            { "type": "string" },
                            "idempotency_key": { "type": "string" }
                        }
                    }),
                ),
                tool_descriptor(
                    "persona.recall",
                    "Retrieve blocks by text search. Other modes require configured retrieval backends.",
                    json!({
                        "type": "object",
                        "required": ["scope", "query"],
                        "properties": {
                            "scope": { "type": "string", "enum": ["user", "project"] },
                            "slug":  { "type": ["string", "null"] },
                            "query": { "type": "string" },
                            "top_k": { "type": "integer", "minimum": 1, "maximum": 100, "default": 10 },
                            "kinds": { "type": ["array", "null"], "items": { "type": "string" } },
                            "mode":  { "type": "string", "enum": ["text", "cos", "bm25", "bfs", "rrf"], "default": "text" }
                        }
                    }),
                ),
                tool_descriptor(
                    "persona.list",
                    "List blocks under (scope, slug), filtered by kind and updated-since cutoff.",
                    json!({
                        "type": "object",
                        "required": ["scope"],
                        "properties": {
                            "scope":  { "type": "string", "enum": ["user", "project"] },
                            "slug":   { "type": ["string", "null"] },
                            "kind":   { "type": ["string", "null"] },
                            "since":  { "type": ["string", "null"], "format": "date-time" },
                            "limit":  { "type": "integer", "minimum": 1, "maximum": 1000, "default": 100 }
                        }
                    }),
                ),
            ]
        })
    }

    /// `tools/call` — extract `(name, arguments)` and route to the
    /// matching verb handler.
    async fn tools_call(&self, params: Value) -> Result<Value, ErrorEnvelope> {
        // Items FIRST — at the very top of the function body, before any
        // statement, per clippy::items_after_statements. The params DTO
        // is local to this function so it stays inside the body rather
        // than at module scope.
        #[derive(Deserialize)]
        struct ToolsCallParams {
            name: String,
            #[serde(default)]
            arguments: Value,
        }

        // Authentication gate. v1: when CLYFFY_OFFLINE is set, all
        // requests pass without inspecting a bearer.
        if let Err(e) = self.auth.check(None) {
            return Err(e.into_envelope());
        }

        let parsed: ToolsCallParams = match serde_json::from_value(params) {
            Ok(p) => p,
            Err(e) => {
                return Err(ErrorEnvelope::new(
                    ErrorKind::InvalidArg,
                    format!("tools/call params: {e}"),
                ));
            }
        };

        let result = match parsed.name.as_str() {
            "persona.load" => {
                let mut args: PersonaLoadArgs = decode_args(parsed.arguments)?;
                async {
                    self.binding.read(&args.scope, &mut args.slug)?;
                    encode_result(verbs::persona::load(&self.store, args).await?)
                }
                .await
            }
            "persona.save" => {
                let mut args: PersonaSaveArgs = decode_args(parsed.arguments)?;
                async {
                    self.binding.write(&args.scope, &mut args.slug)?;
                    encode_result(verbs::persona::save(&self.store, args).await?)
                }
                .await
            }
            "persona.recall" => {
                let mut args: PersonaRecallArgs = decode_args(parsed.arguments)?;
                async {
                    self.binding.read(&args.scope, &mut args.slug)?;
                    encode_result(verbs::persona::recall(&self.store, args).await?)
                }
                .await
            }
            "persona.list" => {
                let mut args: PersonaListArgs = decode_args(parsed.arguments)?;
                async {
                    self.binding.read(&args.scope, &mut args.slug)?;
                    encode_result(verbs::persona::list(&self.store, args).await?)
                }
                .await
            }
            other => {
                return Err(ErrorEnvelope::new(
                    ErrorKind::InvalidArg,
                    format!("unknown tool: {other}"),
                ));
            }
        };

        match result {
            Ok(value) => Ok(json!({
                "content": [{"type": "text", "text": value.to_string()}],
                "structuredContent": value,
                "isError": false,
            })),
            Err(error) => {
                let envelope = error.into_envelope();
                Ok(json!({
                    "content": [{"type": "text", "text": envelope.message}],
                    "structuredContent": {"error": envelope},
                    "isError": true,
                }))
            }
        }
    }
}

#[expect(
    clippy::needless_pass_by_value,
    reason = "json! macro moves the value into the resulting object; passing &Value would force a manual .clone() at every call site"
)]
fn tool_descriptor(name: &str, description: &str, input_schema: Value) -> Value {
    json!({
        "name": name,
        "description": description,
        "inputSchema": input_schema,
    })
}

fn encode_result<T: Serialize>(value: T) -> Result<Value, PersonaError> {
    serde_json::to_value(value).map_err(|error| PersonaError::Backend(error.into()))
}

fn protocol_error(code: i32, message: impl Into<String>) -> ErrorEnvelope {
    let mut envelope = ErrorEnvelope::new(ErrorKind::InvalidArg, message);
    envelope.code = code;
    envelope
}

fn decode_args<T: serde::de::DeserializeOwned>(v: Value) -> Result<T, ErrorEnvelope> {
    serde_json::from_value(v)
        .map_err(|e| ErrorEnvelope::new(ErrorKind::InvalidArg, format!("argument decode: {e}")))
}

fn serialise_success(id: Value, result: Value) -> String {
    serde_json::to_string(&JsonRpcSuccess {
        jsonrpc: "2.0",
        id,
        result,
    })
    .unwrap_or_else(|e| {
        // Construction of the success frame should never fail because
        // the result has already been serialised. Fall back to an
        // inline error string so the client still sees *something*
        // resembling JSON.
        format!(
            "{{\"jsonrpc\":\"2.0\",\"id\":null,\"error\":{{\"code\":-32603,\
             \"message\":\"response serialise failure: {e}\"}}}}"
        )
    })
}

fn serialise_error(id: Value, error: ErrorEnvelope) -> String {
    serde_json::to_string(&JsonRpcError {
        jsonrpc: "2.0",
        id,
        error,
    })
    .unwrap_or_else(|_| {
        "{\"jsonrpc\":\"2.0\",\"id\":null,\"error\":{\"code\":-32603,\
         \"message\":\"error serialise failure\"}}"
            .to_string()
    })
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, reason = "test assertions")]
    //! JSON-RPC framing coverage above the verb-handler layer covered
    //! by `tests/e2e.rs`. These tests do NOT touch real stdin/stdout —
    //! they exercise `Server::dispatch` directly so the framing logic
    //! is verifiable without spawning a child process.

    use super::*;
    use crate::store::PersonaStore;
    use std::sync::Arc;
    use tempfile::tempdir;

    async fn fresh_server() -> Server {
        let dir = tempdir().expect("tempdir");
        let path = dir.path().join("dispatch-test.libsql");
        Box::leak(Box::new(dir));
        #[cfg(feature = "rro")]
        let store: Arc<PersonaStore> = PersonaStore::open(&path, None).await.expect("open store");
        #[cfg(not(feature = "rro"))]
        let store: Arc<PersonaStore> = PersonaStore::open(&path).await.expect("open store");
        Server::new(store, AuthGate::offline())
    }

    async fn ready_server() -> Server {
        let server = fresh_server().await;
        server.dispatch(r#"{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}"#).await.expect("initialize");
        server
            .dispatch(r#"{"jsonrpc":"2.0","method":"notifications/initialized"}"#)
            .await;
        server
    }

    #[tokio::test]
    async fn parse_error_returns_invalid_arg_envelope() {
        let s = ready_server().await;
        let response = s.dispatch("{not json").await.expect("response present");
        let parsed: Value = serde_json::from_str(&response).expect("response is JSON");
        assert_eq!(parsed["jsonrpc"], "2.0");
        assert_eq!(parsed["id"], Value::Null);
        assert_eq!(parsed["error"]["data"]["kind"], "invalid_arg");
    }

    #[tokio::test]
    async fn notification_produces_no_response() {
        let s = ready_server().await;
        let raw = r#"{"jsonrpc":"2.0","method":"ping"}"#;
        let response = s.dispatch(raw).await;
        assert!(response.is_none(), "notifications must not reply");
    }

    #[tokio::test]
    async fn initialize_returns_protocol_version_and_server_info() {
        let s = fresh_server().await;
        let raw = r#"{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}"#;
        let response = s.dispatch(raw).await.expect("response present");
        let parsed: Value = serde_json::from_str(&response).expect("JSON");
        assert_eq!(parsed["result"]["protocolVersion"], MCP_PROTOCOL_VERSION);
        assert_eq!(parsed["result"]["serverInfo"]["name"], SERVER_NAME);
        assert!(parsed["result"]["capabilities"]["tools"].is_object());
    }

    #[tokio::test]
    async fn tools_list_advertises_four_persona_verbs() {
        let s = ready_server().await;
        let raw = r#"{"jsonrpc":"2.0","id":2,"method":"tools/list"}"#;
        let response = s.dispatch(raw).await.expect("response present");
        let parsed: Value = serde_json::from_str(&response).expect("JSON");
        let tools = parsed["result"]["tools"].as_array().expect("tools array");
        let names: Vec<&str> = tools.iter().filter_map(|t| t["name"].as_str()).collect();
        assert_eq!(names.len(), 4);
        assert!(names.contains(&"persona.load"));
        assert!(names.contains(&"persona.save"));
        assert!(names.contains(&"persona.recall"));
        assert!(names.contains(&"persona.list"));
    }

    #[tokio::test]
    async fn tools_call_persona_save_then_load_roundtrip() {
        let s = ready_server().await;
        let save = r#"{
            "jsonrpc": "2.0",
            "id": 10,
            "method": "tools/call",
            "params": {
                "name": "persona.save",
                "arguments": {
                    "scope": "user",
                    "label": "persona",
                    "body": "MCP framing test body",
                    "idempotency_key": "01HPQ-DISPATCH-0001"
                }
            }
        }"#;
        let save_resp = s.dispatch(save).await.expect("save response");
        let save_parsed: Value = serde_json::from_str(&save_resp).expect("JSON");
        assert_eq!(save_parsed["result"]["structuredContent"]["version"], 1);
        assert!(save_parsed["result"]["structuredContent"]["id"].is_string());

        let load = r#"{
            "jsonrpc": "2.0",
            "id": 11,
            "method": "tools/call",
            "params": {
                "name": "persona.load",
                "arguments": { "scope": "user" }
            }
        }"#;
        let load_resp = s.dispatch(load).await.expect("load response");
        let load_parsed: Value = serde_json::from_str(&load_resp).expect("JSON");
        let blocks = load_parsed["result"]["structuredContent"]["blocks"]
            .as_array()
            .expect("blocks array");
        assert_eq!(blocks.len(), 1);
        assert_eq!(blocks[0]["body"], "MCP framing test body");
    }

    #[tokio::test]
    async fn tools_call_unknown_tool_returns_invalid_arg() {
        let s = ready_server().await;
        let raw = r#"{
            "jsonrpc": "2.0",
            "id": 20,
            "method": "tools/call",
            "params": { "name": "nope.does_not_exist", "arguments": {} }
        }"#;
        let response = s.dispatch(raw).await.expect("response");
        let parsed: Value = serde_json::from_str(&response).expect("JSON");
        assert_eq!(parsed["error"]["data"]["kind"], "invalid_arg");
        assert!(
            parsed["error"]["message"]
                .as_str()
                .unwrap_or_default()
                .contains("unknown tool")
        );
    }

    #[tokio::test]
    async fn unknown_method_returns_method_not_found_code() {
        let s = ready_server().await;
        let raw = r#"{"jsonrpc":"2.0","id":30,"method":"frobnicate"}"#;
        let response = s.dispatch(raw).await.expect("response");
        let parsed: Value = serde_json::from_str(&response).expect("JSON");
        assert_eq!(parsed["error"]["code"], -32_601);
    }
}
