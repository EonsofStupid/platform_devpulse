# Master POA&M — DevPulse MCP Bridge + Backend


| Field | Value |
|-------|-------|
| Status | DRAFT - Owner review |
| Version | 0.1.0 |
| Last Updated | 2026-05-08 |
| Owner | @jesse |
| Part of | DevPulse Platform |
| Depends on | LOCKED_DECISIONS.md (G, H, F); BLOCK_SCHEMA_SPEC.md; PERSISTENCE_LAYER_SPEC.md |
| Carves out | POAM_SHAPE_A_BRIDGE.md, POAM_SHAPE_B_BACKEND.md, POAM_SHAPE_C_UNIFIED.md |

---

## 1. Purpose

This is the **overarching plan-of-action and milestones** for getting DevPulse's MCP surface from where it is today (1,301 lines of internal-feature-gated hand-rolled JSON-RPC at systems/devpulse-engine/src/claude/mcp/) to a public, secure, bleeding-edge MCP integration that:

- Plugs into Claude Desktop, Cursor, Zed, Cline, Continue, VS Code via stdio
- Plugs into Claude.ai and other modern hosts via Streamable HTTP custom connectors
- Carries DevPulse's bleeding-edge primitives (rkyv-aware ReasoningObjects, memory blocks, Council dispatch, rumination)
- Exposes nothing dangerous, follows OAuth 2.1, validates Origin/Host, binds 127.0.0.1 in dev, HTTPS in prod
- Demos in days, not months — testable artifact users actually install

This master POA&M does NOT carry the full implementation detail. It carves the work into three sprint-shaped POA&Ms:

| Shape | File | Role |
|-------|------|------|
| **A** | POAM_SHAPE_A_BRIDGE.md | Stdio frontdoor bridge crate (kernel/devpulse-bridge) — first ship |
| **B** | POAM_SHAPE_B_BACKEND.md | Hosted Streamable HTTP MCP server (kernel/devpulse-mcp) — second ship |
| **C** | POAM_SHAPE_C_UNIFIED.md | Both unified: bridge wraps backend, single deploy story — third ship |

The order is deliberate. A first because it can demo against the existing engine MCP without writing a new backend. B second because it justifies its complexity only after A proves demand. C last because unification only matters once A and B exist.

---

## 2. Current State (verified 2026-05-08)

### What exists on disk

| Path | Lines | Status |
|------|-------|--------|
| systems/devpulse-engine/src/claude/mcp/ | 1,301 | Hand-rolled JSON-RPC, internal feature-gated, NOT using rmcp |
| protocol.rs | 187 | JSON-RPC 2.0 + MCP types (custom impl) |
| handler.rs | 151 | Dispatch: initialize, tools/list, tools/call |
| transport_sse.rs | 205 | axum GET /sse + POST /message on :9315 (legacy SSE, deprecated) |
| transport_stdio.rs | 55 | tokio stdin/stdout |
| 5 tools | ~525 | query_libsql, shell_execute, repo_list_files, repo_get_file, get_health |
| Older POA and M | 11.4 KB | scripts/docs/sprints/claude-integration/POAM-COUNCIL-MCP-COCKPIT.md |

### What is missing

- rmcp Rust SDK adoption (currently hand-rolled)
- Streamable HTTP transport (current SSE is deprecated since 2025-11-25 spec)
- OAuth 2.1 (no auth at all today)
- Origin/Host header validation (DNS rebinding, CVE-2025-66414 + CVE-2026-35568)
- Per-user state isolation (single-process, single-user assumed)
- rkyv-aware tools (ReasoningObjects, memory blocks)
- Council dispatch tools
- Public install path (currently behind internal feature gate)
- UI cockpit / Claude Code subprocess integration (per older POA and M)

---

## 3. Target State (end of all three shapes)

```
EVERY MCP CLIENT
  Claude Desktop / Cursor / Zed / Cline / Continue / VS Code (stdio)
  Claude.ai / future remote (Streamable HTTP)

  -> via stdio bridge OR direct Streamable HTTP

devpulse-bridge crate (Layer 2A)
  - rmcp 0.9 stdio server
  - rmcp 0.9 streamable_http client to backend
  - OAuth bearer forwarding
  - ~500 lines, single binary

OR direct connector (no install) -> Streamable HTTP

Both flow into:

devpulse-mcp crate (Layer 3, hosted)
  - rmcp 0.9 StreamableHttpService
  - axum 0.8 + LocalSessionManager
  - stateful_mode = true
  - OAuth 2.1 resource server
  - 127.0.0.1 dev / TLS terminator prod
  - Origin + Host validation
  - rkyv internal hot paths

  Tools (rmcp macros):
   - 5 utility tools migrated from engine
   - rkyv ReasoningObject tools
   - Memory block tools per BLOCK_SCHEMA_SPEC
   - Council dispatch tools

Backend uses DAL adapters (per PERSISTENCE_LAYER_SPEC):
  dal-libsql / dal-duckdb / dal-surrealdb / dal-moka
```



---

## 4. The Three Shapes — Carve-Out Summary

Each shape has a dedicated POA and M file with full sprint detail. This section is the executive cross-reference.

### Shape A — DevPulse Bridge (FIRST SHIP)

**File:** POAM_SHAPE_A_BRIDGE.md
**Crate:** kernel/devpulse-bridge
**Size:** ~500 lines Rust
**Purpose:** Stdio frontdoor for any MCP client, relays to backend over Streamable HTTP

**Why first:**
- Smallest surface area
- Demoable against existing engine MCP without writing new backend
- Validates the bridge pattern before investing in backend rewrite
- Distributable as a single binary (cargo install devpulse-bridge)

**Done when:**
- User installs binary, drops 3-line config in Claude Desktop
- Can call all 5 existing engine tools through Claude



### Shape B — DevPulse Backend MCP (SECOND SHIP)

**File:** POAM_SHAPE_B_BACKEND.md
**Crate:** kernel/devpulse-mcp (NEW)
**Size:** ~2000-3000 lines initially
**Purpose:** Production-grade hosted multi-user Streamable HTTP MCP server with rkyv-aware tools

**Why second:**
- Justifies its complexity only after Shape A proves user demand
- Replaces engine MCP gradually (engine MCP stays as internal lab tool)
- Adds OAuth 2.1, sessions, Origin/Host validation, multi-user isolation

**Done when:**
- Hosted at https://mcp.devpulse.app/mcp
- Claude.ai connector works via custom connector URL
- Bridge (Shape A) can point at it
- Memory block tools and Council dispatch tools live

**Risks:**
- Complexity of OAuth 2.1 (separated auth server vs resource server)
- Hosting cost and operational burden
- Security CVE class (DNS rebinding, token passthrough, confused deputy)



### Shape C — Unified Distribution (THIRD SHIP)

**File:** POAM_SHAPE_C_UNIFIED.md
**Purpose:** Polish: bridge wraps backend, single deploy story, install instructions per client, telemetry

**Why third:**
- Only meaningful once both A and B exist
- Marketing/distribution focus, not architecture
- One install command produces working setup for any user

**Done when:**
- One-line install produces working bridge pointing at backend
- Documentation site at devpulse.app/docs/mcp covers all clients
- Public test harness with promptfoo eval suite
- AngryViber community can install and use without dev help



---

## 5. Cross-Shape Dependencies

| Item | Used by | Decision |
|------|---------|----------|
| rmcp Rust SDK 0.9+ | A, B, C | Locked. Both bridge and backend use the same crate. |
| rkyv 0.8.15 | B (internal hot paths only) | Per LOCK F-1 |
| OAuth 2.1 | B, C (A passes through) | Resource server pattern, separated auth server |
| DAL adapters (dal-libsql etc) | B | Per PERSISTENCE_LAYER_SPEC |
| Memory blocks | B | Per BLOCK_SCHEMA_SPEC |
| Council dispatch | B | Future spec, parked but referenced |
| Promptfoo (or equivalent eval) | C | Eval suite for tools and prompts |
| Existing engine MCP | A (target), B (replaces) | Stays as internal lab tool after B ships |



---

## 6. Sequencing and Gates

```
SHAPE A
  Sprint A.1: Crate scaffold + rmcp deps + stdio server hello-world
  Sprint A.2: streamable_http client to engine MCP (verify wire compat)
  Sprint A.3: Tool relay (forward 5 existing tools end-to-end)
  Sprint A.4: OAuth bearer pass-through + config TOML + CLI args
  Sprint A.5: Single-binary release + Claude Desktop install instructions
  GATE A: User can install binary and call tools from Claude Desktop. Demo.

SHAPE B
  Sprint B.1: Crate scaffold + rmcp deps + StreamableHttpService hello-world
  Sprint B.2: Migrate 5 utility tools to rmcp macros
  Sprint B.3: Domain port wiring (BlockRepository, AnalyticsStore, etc)
  Sprint B.4: rkyv ReasoningObject tools
  Sprint B.5: Memory block tools (per BLOCK_SCHEMA_SPEC)
  Sprint B.6: OAuth 2.1 resource server + .well-known endpoint
  Sprint B.7: Origin/Host validation + DNS rebinding defense
  Sprint B.8: Stateful session management + multi-user isolation
  Sprint B.9: TLS deployment + production hardening
  GATE B: Bridge points at backend. Both demoable. Multi-user safe.

SHAPE C
  Sprint C.1: Install script producing working setup
  Sprint C.2: Per-client config templates (Claude Desktop, Cursor, Zed, etc)
  Sprint C.3: Promptfoo eval suite for tools
  Sprint C.4: Documentation site at devpulse.app/docs/mcp
  Sprint C.5: Telemetry and observability (opt-in)
  GATE C: Public ship. AngryViber community can install and use.
```

Each sprint must close before the next opens. Each shape gate must pass before the next shape opens.

---

## 7. Open Questions

- Existing engine MCP migration: full rewrite to rmcp in Shape B, or keep as separate internal lab tool forever?
- OAuth provider: self-hosted (own auth server) or use existing (Auth0, Clerk, WorkOS)?
- Hosting target for backend: own VPS, Cloudflare Workers, Fly.io, AWS?
- Bridge config location: ~/.devpulse/bridge.toml or platform-specific (XDG on Linux, %APPDATA% on Windows)?
- rkyv tools cross MCP boundary: serialize to JSON at perimeter (per LOCK F-1) or expose archived bytes?

---

*End of master POA and M. See POAM_SHAPE_A_BRIDGE.md, POAM_SHAPE_B_BACKEND.md, POAM_SHAPE_C_UNIFIED.md for sprint detail.*


