# Shape A POA&M — DevPulse Bridge (Stdio Frontdoor)

| Field | Value |
|-------|-------|
| Status | DRAFT |
| Version | 0.1.0 |
| Last Updated | 2026-05-08 |
| Owner | @jesse |
| Parent | POAM_MASTER_MCP_BRIDGE_BACKEND.md |
| Crate | kernel/devpulse-bridge |
| Reference impl | rmcp-proxy (Rust, 491 lines, MIT, by Stephen Lacy) |

---

## 1. Purpose

Build a tiny Rust binary that translates between **stdio MCP clients** (Claude Desktop, Cursor, Zed, Cline, Continue, VS Code) and the **DevPulse backend** speaking Streamable HTTP. One-time install on user box, ongoing reward.

The bridge is the public face of DevPulse for testing. Users install the binary, drop a 3-line config in their MCP client, and every supported client suddenly speaks to DevPulse.

## 2. Scope

**IN SCOPE:**
- Stdio server transport (rmcp 0.9 transport-io feature)
- Streamable HTTP client transport to backend (rmcp 0.9 transport-streamable-http-client-reqwest)
- Tool list discovery from backend, relay to client
- Tool call relay with parameter passthrough
- OAuth bearer token forwarding via Authorization header
- TOML config file at platform-appropriate location
- CLI args via clap
- Single-binary release for Windows, macOS, Linux

**OUT OF SCOPE:**
- Backend implementation (Shape B)
- Per-client install automation (Shape C)
- Eval harness (Shape C)
- UI, dashboards, telemetry beyond stderr logging



## 3. Crate Layout

```
kernel/devpulse-bridge/
├── Cargo.toml
├── README.md
└── src/
    ├── main.rs              # CLI entry, arg parsing, tracing init
    ├── config.rs            # TOML config loader, validation
    ├── bridge.rs            # The proxy handler (stdio in, streamable_http out)
    ├── relay.rs             # Tool list + tool call passthrough
    └── error.rs             # BridgeError enum
```

Total target: ~500 lines across all files.

## 4. Cargo.toml (locked dependencies)

```toml
[package]
name = "devpulse-bridge"
version = "0.1.0"
edition = "2021"
license = "MIT"
description = "Stdio frontdoor MCP bridge for DevPulse"

[dependencies]
rmcp = { version = "0.9", features = [
    "server",
    "client",
    "macros",
    "transport-io",
    "transport-streamable-http-client-reqwest",
    "auth",
    "schemars",
] }
tokio = { workspace = true }
serde = { workspace = true }
serde_json = { workspace = true }
tracing = { workspace = true }
tracing-subscriber = { workspace = true }
anyhow = "1.0"
clap = { version = "4.5", features = ["derive", "env"] }
toml = "0.8"
url = "2.5"
```



## 5. Sprints

### Sprint A.1 — Crate scaffold + stdio hello-world

**Goal:** New crate compiles and runs as an MCP server over stdio with one trivial tool.

**Work items:**
- Create kernel/devpulse-bridge/ crate, register in workspace Cargo.toml
- Add rmcp dependency with locked feature set
- main.rs: tokio runtime, tracing-subscriber writing to stderr
- Implement one no-op tool: bridge_health -> returns "ok"
- Wire stdio transport: rmcp_server.serve(stdio()).await

**Done when:**
- cargo build --release produces devpulse-bridge.exe
- Manual test: pipe initialize JSON-RPC into stdin, see initialize response on stdout
- Add to Claude Desktop config, see bridge_health tool listed

**Risks:** rmcp 0.9 API drift. Mitigation: lock to exact version 0.9.x in Cargo.lock.

### Sprint A.2 — Streamable HTTP client to backend

**Goal:** Bridge can connect outbound to a Streamable HTTP MCP server (initially just rmcp's counter example).

**Work items:**
- config.rs: load TOML with backend_url, optional bearer token, optional timeout
- relay.rs: instantiate StreamableHttpClientTransport from config
- Forward Authorization header if token configured
- bridge.rs: store Arc<RunningService<RoleClient, ()>> after backend connect
- Health check: on startup, ping backend tools/list and log count

**Done when:**
- bridge.toml with backend_url pointing at rmcp counter example connects successfully
- Logs show "Connected to backend, N tools discovered"
- Bearer token forwarding verified via test backend that requires auth

**Risks:** TLS cert validation issues on Windows. Mitigation: rmcp uses rustls by default, ship rustls-native-roots feature if needed.



### Sprint A.3 — Tool relay (the actual proxy)

**Goal:** Bridge dynamically exposes backend tools to the stdio client.

**Work items:**
- relay.rs: on initialize, fetch backend tools/list, cache the list
- Implement custom ServerHandler that responds to tools/list with cached backend list
- On tools/call: forward params verbatim to backend, return response verbatim
- Handle backend disconnect: reconnect with backoff, return McpError::server_error during outage
- Pass through structured tool errors (don't swallow)

**Done when:**
- Pointing at engine MCP, all 5 utility tools (query_libsql, shell_execute, repo_list_files, repo_get_file, get_health) are visible in Claude Desktop
- Calling any tool from Claude works end-to-end
- Tool errors surface to Claude unchanged

**Risks:** Engine MCP is hand-rolled JSON-RPC, not rmcp. Wire compat may need adjustment.
**Mitigation A:** rmcp client speaks raw JSON-RPC 2.0 like any client; engine should respond compatibly.
**Mitigation B:** If incompatible, write 1-page wire-diff doc and either (a) tweak engine response shape, or (b) add small adapter layer in bridge.

### Sprint A.4 — OAuth, config, CLI polish

**Goal:** Production-ready single binary with sane defaults and clean UX.

**Work items:**
- clap CLI: --backend-url, --token, --config, --log-level, all with env var fallback
- Config precedence: CLI args > env > TOML file > defaults
- TOML schema documented in README
- Default config path: %APPDATA%/devpulse/bridge.toml on Windows, ~/.config/devpulse/bridge.toml on Linux/macOS
- OAuth bearer rotation: re-read config on SIGHUP (Unix) or file watch (Windows)
- Graceful shutdown on SIGTERM/Ctrl-C: flush logs, close backend connection

**Done when:**
- devpulse-bridge --help prints clean usage
- Config can be supplied three ways and precedence is documented
- Token rotation works without restart

**Risks:** Config path conventions differ across OS. Mitigation: use directories crate (1.0) for canonical paths.

### Sprint A.5 — Release + install instructions

**Goal:** Public, downloadable, install-in-3-steps.

**Work items:**
- GitHub Actions workflow: build for x86_64-pc-windows-msvc, x86_64-apple-darwin, aarch64-apple-darwin, x86_64-unknown-linux-gnu
- Release artifacts: zipped binary + bridge.toml.example + README
- README includes copy-paste claude_desktop_config.json snippet
- README includes Cursor, Zed, Cline config snippets
- cargo install path: cargo install devpulse-bridge from crates.io
- Smoke test: fresh VM, install binary, drop config, verify Claude Desktop sees tools

**Done when:**
- Released on GitHub with checksums
- Published to crates.io
- Documentation tested by someone other than owner

**Risks:** crates.io publish flow on first time. Mitigation: dry-run with cargo publish --dry-run first.



## 6. Gate A Definition

**Bridge is GATE A pass when:**
- All five sprints closed
- Fresh-machine smoke test passes (Windows + macOS + Linux)
- A non-Jesse human installs from instructions and gets working tool calls in Claude Desktop
- No DNS rebinding risk (bridge does NOT bind a port; stdio only)
- README has copy-paste config for at least 4 MCP clients

## 7. Open Questions

- Crates.io publish: under EonsofStupid org or new devpulse org?
- Bridge versioning: semver from 0.1.0 or jump to 1.0 once stable?
- Should bridge cache tool list locally for offline browse, or always require live backend?
- License: MIT to match rmcp-proxy, or Apache-2.0?
- Telemetry: emit anonymous "bridge connected to backend" pings for usage tracking, or zero phone-home?

---

*End of Shape A POA and M. See POAM_MASTER_MCP_BRIDGE_BACKEND.md for cross-shape context.*


