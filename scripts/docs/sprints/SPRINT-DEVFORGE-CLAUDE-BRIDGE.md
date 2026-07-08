# SPRINT: DevForge — Claude Extension ↔ DevPulse DB Bridge (Phase 5)

> **Status**: DESIGN — NOT READY FOR IMPLEMENTATION
> **Depends on**: Phase 3 frontend sprint merged (Full Editor window opens)
> **Goal**: Let Claude Code (and the Claude Desktop extension) running
> inside the DevForge Full Editor read/write DevPulse's `projects`,
> `sessions`, `turns`, and related tables so the IDE becomes a
> first-class view of the DevPulse data layer.

---

## Problem

When the user opens the Full Editor window, they get a VS Code running
inside REH at `http://127.0.0.1:<port>/?tkn=<hex>`. That VS Code is a
separate process tree (Node → REH → extension host). It has **no
native access** to:

- DevPulse's user-relational DB (projects, sessions, turns, profiles)
- DevPulse's analytics DB (DuckDB — daily_stats, span traces)
- DevPulse's platform engine services (model loader, voice, credentials)

The Claude Code extension, when installed inside that VS Code, needs to
see and mutate this data so the IDE experience is tied to the DevPulse
workspace the user is actually working in.

---

## Architecture: localhost HTTP bridge

Expose a narrow, token-authed HTTP API from the DevPulse Tauri backend,
bound to `127.0.0.1`, and inject its URL + token into the REH child
process via environment variables. The Claude extension reads those env
vars and makes requests.

```
┌─────────────── DevPulse Desktop (Tauri) ──────────────┐
│                                                        │
│  ┌───────────────┐     ┌────────────────────────────┐  │
│  │ Platform      │     │ bridge::server (new)       │  │
│  │ - LibSQL      │◄────┤ axum on 127.0.0.1:<bport>  │  │
│  │ - DuckDB      │     │ Bearer <bridge-token>      │  │
│  │ - SurrealDB   │     │ routes: /projects,         │  │
│  │ - Model loader│     │         /sessions, /turns, │  │
│  └───────────────┘     │         /models, /embed... │  │
│                        └─────────┬──────────────────┘  │
│                                  │                     │
│  ┌─────── RehManager::spawn ─────┴──────┐              │
│  │ env:                                  │              │
│  │   DEVPULSE_BRIDGE_URL=http://...      │              │
│  │   DEVPULSE_BRIDGE_TOKEN=<hex>         │              │
│  │   DEVPULSE_WORKSPACE=<abs path>       │              │
│  └─────────────┬─────────────────────────┘              │
│                │                                        │
└────────────────┼────────────────────────────────────────┘
                 │
                 ▼
      REH (Node child) → VS Code → Claude extension
      reads process.env.DEVPULSE_BRIDGE_URL + _TOKEN,
      calls the API.
```

Why this design:
- **No new transport**. Axum + reqwest already exist in DevPulse. No
  websockets, no named pipes, no shared-SQLite-file locking races.
- **Auth is trivial**. Single bearer token generated at bridge startup,
  rotated per DevPulse launch. Never written to disk.
- **Loopback only**. Bind to `127.0.0.1` with no external interface.
  The token is a second layer so other local processes can't snoop.
- **Standard extension idiom**. VS Code extensions already read
  `process.env` in their `activate()` function. No shim required.

---

## Backend deliverables

### 1. New crate or module: `commands/bridge/`

```
interfaces/desktop/src-tauri/src/commands/bridge/
├── mod.rs          # Tauri commands: start, stop, get_info
├── server.rs       # axum router + run loop
├── routes/
│   ├── projects.rs     # GET /projects, POST /projects, ...
│   ├── sessions.rs
│   ├── turns.rs
│   ├── models.rs       # GET /models, POST /models/:id/infer
│   └── telemetry.rs    # POST /spans (extension writes its own spans)
├── auth.rs         # bearer token middleware
└── types.rs        # request/response DTOs
```

### 2. Bridge lifecycle

- `BridgeServer::start(platform: Arc<Platform>) -> BridgeHandle`
- Generates a random port (reuse `portpicker`) and bridge token (reuse
  the 16-byte hex pattern from `sidecar.rs::generate_token`).
- Spawns an axum server on `127.0.0.1:<port>`, holding a clone of
  `Arc<Platform>` for service access.
- `BridgeHandle` has `url()`, `token()`, `shutdown()`.
- Stored on `PlatformState` as `bridge: RwLock<Option<BridgeHandle>>`.
- Started from `lib.rs::boot_task` once the platform is ready (must be
  after Platform::boot, not before — it needs the services).
- Shut down in the `Exit` handler alongside `reh`.

### 3. REH env injection

In `commands/devforge/sidecar.rs::RehManager::spawn`, before the
`cmd.spawn()` call, read the bridge handle (passed in via `RehConfig` or
a new argument) and add env vars:

```rust
cmd.env("DEVPULSE_BRIDGE_URL", bridge.url());
cmd.env("DEVPULSE_BRIDGE_TOKEN", bridge.token());
cmd.env("DEVPULSE_WORKSPACE", &config.workspace_path);
```

REH child inherits them; the VS Code extension host inherits them from
REH; the Claude extension reads them.

Update `RehConfig` with an optional `bridge: Option<BridgeEndpoint>`
field (`{ url: String, token: String }`) so the bootstrap orchestrator
can pass it through.

### 4. Route coverage (minimum viable set)

**Projects** (`routes/projects.rs`):
- `GET /projects` → list
- `GET /projects/:id` → single
- `POST /projects` → create
- `PATCH /projects/:id` → update

**Sessions** (`routes/sessions.rs`):
- `GET /sessions?projectId=<id>` → list
- `GET /sessions/:id` → single with turns
- `POST /sessions` → create
- `PATCH /sessions/:id` → update
- `DELETE /sessions/:id` → delete

**Turns** (`routes/turns.rs`):
- `GET /turns?sessionId=<id>` → list
- `POST /turns` → append
- `PATCH /turns/:id` → edit

**Models** (`routes/models.rs`):
- `GET /models` → registry + slot assignments
- `POST /models/infer` → run inference against a slot
  (reuses `commands::models::inference_generate` internals)

**Telemetry** (`routes/telemetry.rs`):
- `POST /spans` → extension writes span records into the analytics
  pipeline (reuses `SpanTraceWriter`)

All routes behind a bearer auth middleware that checks
`Authorization: Bearer <bridge-token>` against the runtime token.
Return `401` on mismatch, `403` on valid token but missing scope
(future-proofing — scopes default to "all" for now).

### 5. DTOs

Reuse the existing serde-derived types from `devpulse_engine::platform`
wherever possible. Project, Session, Turn all have serialization already.
Add `specta::Type` derives if missing so we could also expose these to
the Tauri frontend later (not required for Phase 5).

---

## Extension-side (outside this repo)

The Claude VS Code extension implementation is not in this sprint, but
the contract it relies on:

```ts
// Inside the extension's activate()
const bridgeUrl   = process.env.DEVPULSE_BRIDGE_URL;
const bridgeToken = process.env.DEVPULSE_BRIDGE_TOKEN;
const workspace   = process.env.DEVPULSE_WORKSPACE;

if (!bridgeUrl || !bridgeToken) {
  // Not running inside DevForge — fall back to standalone mode
  return;
}

const api = new DevpulseClient(bridgeUrl, bridgeToken);
const projects = await api.listProjects();
// ...
```

A lightweight `DevpulseClient` TypeScript package lives in the
`devpulse-hub` extension tree (or a new `devpulse-client` package) and
is depended on by the Claude extension. Out of scope here — track as a
follow-up once the bridge is live.

---

## Security model

| Concern | Mitigation |
|---|---|
| Other local processes snooping | Bearer token, rotated per app launch, never written to disk, 16-byte random |
| Token leaking via process list (`/proc/*/environ`) | Accept the risk — same as REH's own connection token, which already leaks the same way. Documented. |
| External network access | Bind to `127.0.0.1` only. Axum's `TcpListener::bind("127.0.0.1:0")` |
| CSRF from browser tabs hitting localhost | Require `Authorization` header on every request — browsers won't auto-send that. Additionally reject requests missing a custom `X-Devpulse-Client: devforge` header |
| Privilege escalation via bridge | Bridge exposes a deliberately narrow API — no filesystem read/write outside the workspace, no shell exec, no settings writes |

---

## Acceptance criteria

1. **Bridge boots** — `cargo run`, watch logs for `Bridge listening on
   127.0.0.1:<port>`. Store the token from logs.
2. **Unauthed rejection** — `curl http://127.0.0.1:<port>/projects` →
   401.
3. **Authed success** — `curl -H "Authorization: Bearer <token>" -H
   "X-Devpulse-Client: devforge" http://127.0.0.1:<port>/projects` →
   JSON array with the seed projects from `seed_dev_data`.
4. **REH inheritance** — open Full Editor window, open the VS Code
   integrated terminal, run `echo $env:DEVPULSE_BRIDGE_URL` (or
   `printenv` on Unix). The URL appears. Same for the token.
5. **CRUD round-trip** — from the VS Code terminal, `curl` a `POST
   /sessions` and a `GET /sessions?projectId=...`. The new session
   appears. Restart DevPulse; the session persists (LibSQL is the
   backing store).
6. **Inference round-trip** — `POST /models/infer` with a test prompt,
   confirm a response streams back from the same model loader that
   serves the DevPulse chat.
7. **Clean shutdown** — quit DevPulse. The axum server shuts down; the
   port is released (verify with `netstat -an | findstr <port>`).
8. **Token rotation** — relaunch DevPulse, confirm a new token is
   generated and old tokens are rejected.

---

## Out of scope

- Writing the actual Claude extension TypeScript code.
- Implementing a WebSocket/SSE side-channel for streaming (start with
  chunked HTTP responses — add streaming only when a use case appears).
- Scoped tokens (per-extension, per-operation). Single all-powers
  token for now.
- Multi-user / remote bridge access. Loopback only.
- Exposing the bridge API to the DevPulse frontend — that already has
  the Tauri command IPC layer.
- Installing the Claude extension automatically on first run. Manual
  `code --install-extension` for now; extension management UI is
  Phase 6.

---

## Open questions for the owner

1. Should the bridge be feature-gated behind a Cargo feature
   (`--features bridge`)? Default on? Default off in prod?
2. Are there fields in the existing DTOs (Project, Session, Turn) that
   should **not** be exposed to extensions for privacy reasons?
3. When Claude extension issues a `POST /models/infer`, does it count
   against the same quota/rate limits as the main DevPulse chat, or is
   it tracked separately? (Affects the `lane_config` telemetry lookup.)
4. Should the extension be able to write into the user-relational DB
   directly (POST /turns), or should every write go through a higher
   level endpoint like `POST /chat/send` that runs the full platform
   pipeline (governance, guardrails, etc.)?

These are blockers for writing the actual routes. Owner must answer
before implementation starts.
