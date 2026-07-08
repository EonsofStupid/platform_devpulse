# Sprint 3: MCP Server Core — SSE + Stdio Transports

| Field | Value |
|-------|-------|
| **Parent** | Claude Integration Plan |
| **Status** | `PLANNED` |
| **Depends on** | Sprint 1 (config), Sprint 2 (signals) |
| **Files** | 5 new, 1 modified |

---

## PRE-FLIGHT

- [ ] Read MCP protocol spec: JSON-RPC 2.0, `initialize`, `tools/list`, `tools/call`, `ping`
- [ ] Read `platform/server.rs` — understand existing axum server pattern (SurrealDB on :8822)
- [ ] Verify axum 0.8 SSE support: `axum::response::sse::Sse`
- [ ] Verify tokio stdin/stdout: `tokio::io::{stdin, stdout, AsyncBufReadExt, AsyncWriteExt}`

---

## MCP PROTOCOL REFERENCE

Protocol version: `2024-11-05`

**Handshake:**
1. Client sends `initialize` with `protocolVersion`, `capabilities`, `clientInfo`
2. Server responds with `protocolVersion`, `capabilities`, `serverInfo`
3. Client sends `initialized` notification (no response)

**Methods:**
- `initialize` — handshake
- `tools/list` — return available tools
- `tools/call` — execute a tool
- `ping` — heartbeat

**Transport:**
- SSE: HTTP GET `/sse` returns event stream. Client POSTs JSON-RPC to `/message`.
- Stdio: Newline-delimited JSON on stdin/stdout.

---

## CHANGES

### 1. CREATE `claude/mcp/mod.rs`

```rust
//! MCP server — JSON-RPC 2.0 over SSE + stdio.
//!
//! SSE: always available (release gets project-scoped tools).
//! Stdio: `#[cfg(feature = "internal")]` only (Claude Code).

pub mod handler;
pub mod protocol;
pub mod transport_sse;

#[cfg(feature = "internal")]
pub mod transport_stdio;

use crate::claude::McpServerConfig;
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
    pub async fn start(config: &McpServerConfig) -> anyhow::Result<Self> {
        let mut server = Self {
            sse_handle: None,
            #[cfg(feature = "internal")]
            stdio_handle: None,
        };

        if config.sse.enabled {
            let handle = transport_sse::start(config.sse.port, &config.sse.bind).await?;
            server.sse_handle = Some(handle);
        }

        #[cfg(feature = "internal")]
        if config.stdio.enabled {
            let handle = transport_stdio::start().await?;
            server.stdio_handle = Some(handle);
        }

        Ok(server)
    }

    /// Shutdown MCP server.
    pub async fn shutdown(&self) {
        if let Some(h) = &self.sse_handle {
            h.abort();
        }
        #[cfg(feature = "internal")]
        if let Some(h) = &self.stdio_handle {
            h.abort();
        }
    }
}
```

### 2. CREATE `claude/mcp/protocol.rs`

JSON-RPC 2.0 types. Minimal — no dep, hand-rolled:

- `JsonRpcRequest { jsonrpc, id, method, params }`
- `JsonRpcResponse { jsonrpc, id, result, error }`
- `JsonRpcError { code, message, data }`
- `JsonRpcNotification { jsonrpc, method, params }`
- Standard error codes: -32600 (invalid request), -32601 (method not found), -32602 (invalid params), -32603 (internal error)
- MCP-specific: `InitializeParams`, `InitializeResult`, `ServerInfo`, `ServerCapabilities`

All derive `Serialize, Deserialize`. NO `Type` (specta) — these are wire protocol only, not TS-exported.

### 3. CREATE `claude/mcp/transport_sse.rs`

axum SSE transport:
- `GET /sse` — returns `Sse<impl Stream<Item = Event>>`
- `POST /message` — receives JSON-RPC requests, responds via SSE channel
- Uses `tokio::sync::mpsc` to bridge POST → SSE stream
- Binds to `config.sse.bind:config.sse.port` (default 127.0.0.1:9315)

### 4. CREATE `claude/mcp/transport_stdio.rs` (`#[cfg(feature = "internal")]`)

tokio stdin/stdout transport:
- Read lines from stdin (`tokio::io::BufReader<tokio::io::stdin()>`)
- Parse as JSON-RPC, dispatch to handler
- Write response as newline-delimited JSON to stdout
- Loop until EOF

### 5. CREATE `claude/mcp/handler.rs`

Method dispatch:
- `initialize` → return server info + capabilities
- `initialized` → no-op (notification)
- `tools/list` → placeholder empty list (tools added in Sprint 4)
- `tools/call` → placeholder "not implemented"
- `ping` → return `{}`
- Unknown → error -32601

### 6. MODIFY `claude/mod.rs`

Add `pub mod mcp;`

---

## VERIFICATION

- [ ] `cargo check -p devpulse-engine` — 0 errors (SSE only, no stdio)
- [ ] `cargo check -p devpulse-engine --features internal` — 0 errors (SSE + stdio)
- [ ] Server binds :9315 on start
- [ ] `curl -X POST http://127.0.0.1:9315/message -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}'` returns valid response
- [ ] `tools/list` returns empty tools array
- [ ] `ping` returns `{}`
- [ ] No `internal`-gated code in SSE transport
- [ ] Stdio transport fully behind `#[cfg(feature = "internal")]`

**If ANY checkbox unchecked, sprint is NOT done.**
