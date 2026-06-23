# Clyffy MCP Server — Interface Spec (Phase 1 keystone)

> Build-ready contract for exposing the RRD context engine + inference as an MCP
> server. Author this crate ON a machine where the workspace compiles (the
> Blackwell or the Windows dev box) — it cannot be compile-verified in the cloud
> sandbox (private `rro` dep + CI-enforced kernel-vocabulary boundary).
>
> SDK: official `rmcp` v1.7.0 (`modelcontextprotocol/rust-sdk`). Spec rev
> `2025-11-25` (stable), forward-compatible with the `2026-07-28` RC.

## 1. Placement & IP boundary (decide first)

The MCP server is a **public edge**, so it must NOT live in `kernel/` and must NOT
use kernel vocabulary (CI-enforced per `systems/devpulse-engine/ip/kernel_terms.toml`).

- **Crate:** `systems/devpulse-mcp/` (dev-facing name; "RRD"/"Clyffy" are dev terms,
  kernel internals stay behind the facade).
- **Depends on:** `devpulse-engine` (the public facade + services) — NOT
  `kernel/devpulse-clyffy` or `kernel/model-loader` directly. The engine already
  brokers inference + context; the MCP server is a transport adapter over it.
- **Add to** workspace `members` in root `Cargo.toml`.

```
systems/devpulse-mcp/
  Cargo.toml          # rmcp, tokio, serde, schemars, devpulse-engine (path)
  src/
    main.rs           # binary: build engine facade, serve Streamable HTTP
    server.rs         # ServerHandler impl + capabilities
    tools/            # one module per tool
      reason.rs
      context_search.rs
    resources.rs      # RRD context resources (read-only)
    auth.rs           # OAuth 2.1 resource-server validation
```

## 2. Capabilities to expose (v1)

**Tools** (model-invoked, typed):
| Tool | Purpose | Params | Result |
|---|---|---|---|
| `reason` | Run an inference/reasoning pass through RRD on the Blackwell | `prompt: string`, `context_ids?: string[]`, `stream?: bool` | text / structured; streams over SSE |
| `context_search` | Retrieve RRD context records (vector search) | `query: string`, `k?: int`, `filter?: object` | array of `{id, score, snippet}` |
| `context_upsert` | Push context into RRD (gated by auth scope) | `documents: {id, text, meta}[]` | `{upserted: int}` |

**Resources** (read-only, URI-addressed):
- `rrd://context/{id}` — a single context record.
- `rrd://collections` — available collections/namespaces.

**Client capabilities consumed:** `elicitation` (for human-in-the-loop confirmations
on `context_upsert`), `sampling` (optional, for agentic sub-calls).

Params derive `serde::Deserialize + schemars::JsonSchema`. rmcp macro shape:

```rust
#[tool_router]
impl DevpulseMcp {
    #[tool(description = "Run a reasoning pass through the RRD engine")]
    async fn reason(&self, Parameters(p): Parameters<ReasonParams>)
        -> Result<CallToolResult, ErrorData> { /* delegate to engine facade */ }
}
#[tool_handler(name = "devpulse-mcp", version = "0.1.0")]
impl ServerHandler for DevpulseMcp {}
```

## 3. Transport

- **Streamable HTTP** (`StreamableHttpService`) — the official remote transport.
- Single endpoint (POST + GET). POST `Accept: application/json, text/event-stream`;
  stream `reason` token output as `text/event-stream`.
- **Build stateless-ready**: `sessionIdGenerator`-equivalent off by default so it runs
  behind the 2U load balancer (aligns with the `2026-07-28` stateless-core RC).
- Bind on the 2U; reach RRD on the Blackwell over the 10 GbE internal fabric.

## 4. Auth (OAuth 2.1, server = Resource Server)

- MCP server is the **Resource Server**; a separate AS (self-hosted Supabase
  GoTrue / Keycloak / your IdP) issues tokens.
- Implement **RFC 9728** Protected Resource Metadata at
  `/.well-known/oauth-protected-resource` advertising the AS.
- Validate token **audience** (RFC 8707 / RFC 9068) == this server's canonical URI.
- **Never** pass the client's token upstream — mint the server's own creds for any
  downstream calls.
- Unauthenticated request → `401` + `WWW-Authenticate` with `resource_metadata`.

## 5. Relationship to the OpenAI/Anthropic-compatible API

Complementary layers (per research): the inference API answers "how the model talks";
MCP answers "how clients reach RRD as a tool." Expose **both** —
- OpenAI/Anthropic-compatible `/v1/messages` for raw low-latency inference clients;
- this MCP server for portable tool/context access from Claude Desktop et al.
Both delegate to the same `devpulse-engine` facade; no logic duplication.

## 6. Acceptance (verify on the build box)

1. `cargo check -p devpulse-mcp` clean (kernel-vocab boundary passes:
   `cargo xtask verify-ip-boundary`).
2. `npx @modelcontextprotocol/inspector` connects via Streamable HTTP, lists
   `reason` / `context_search`, executes `context_search` against a seeded collection.
3. Added as a custom connector in Claude Desktop; `reason` streams a token response.
4. `server.json` drafted for later MCP Registry publication.

---
*Next after this: package `psych-translator` + the memory ledger as Skills (Phase 2),
then bundle the WardenClyffe Plugin (Phase 3).*
