# Cloud Preflight — SurrealDB + Qdrant SSOT

**Audience:** DevPulse engineers + Claude Code sessions.
**Authority:** This file IS the truth. If a hook, script, or memory entry
disagrees with this doc, this doc wins and the other artifact gets fixed.

This is the single source of truth for:

- Which cloud instances exist
- Which credentials live where
- Which namespaces are owned by what
- How preflight + heartbeat keep everything green
- How local + cloud interact during active dev

If you are about to write a curl that hits cloud SurrealDB or cloud Qdrant,
read this file first.

---

## Cloud inventory

### SurrealDB Cloud (live, free-tier auto-pause after 7d idle)

| Field | Value |
|---|---|
| URL (HTTP) | `https://devpulse-06e6sbjhctrt511bgpdvd3d6c8.aws-use1.surreal.cloud` |
| URL (WebSocket) | `wss://devpulse-06e6sbjhctrt511bgpdvd3d6c8.aws-use1.surreal.cloud` |
| Header rule | **lowercase always** — `surreal-ns: <ns>` and `surreal-db: <db>`. UPPERCASE is silently rejected with empty results on cloud. |
| Auth | HTTP `Basic <base64(user:pass)>` — two principals (below). |

**Two principals, two purposes:**

| Principal | Password source | Owns | Scope |
|---|---|---|---|
| `clyffy` | Infisical `Clyffy/dev/SURREAL_PASS` (`changemelater`) | `clyffy/ai_memory` | **Product schema** — 50+ tables: `agent_message`, `agent_session`, `memory_item`, `rro_signal`, `projection_job`, `projects_to_qdrant`, `ai_provider`, `mcp_node`, etc. |
| `devpulse_engine` | Hardcoded in `scripts/surrealdb/seed-cloud.js` (`dp_sys_2026!`) | `platform_devpulse/chat`, `projects/devpulse`, `agents/claude`, `global/knowledge` | **Operator metadata** — Claude Code session log, project context, agent memory, restored learnings. Written by `.claude/hooks/*.js`. |

**Two principals on purpose** — `clyffy` writes the customer-facing
product surface, `devpulse_engine` writes operator telemetry. They share
a cloud instance but never share tables.

### Qdrant Cloud (live, AWS us-east-1)

| Field | Value |
|---|---|
| URL | `https://ab3a461b-ea81-49b9-9b9d-436a9e82d72a.us-east-1-1.aws.cloud.qdrant.io:6333` |
| Auth header | `api-key: <jwt>` |
| Key source | Infisical `Clyffy/dev/QDRANT_API_KEY` |
| Key scope | `access=m` (manage), `subject=api-key:963ff5ac-54b2-4d2f-9cf9-749d8cd84a14` |
| Version | 1.18.0 (Qdrant 1.x) |
| Existing collections | `clyffy_messages`, `clyffy_minion_capabilities`, `clyffy_route_entities` |

Collections pair 1:1 with `clyffy/ai_memory` table domains — vector
projection target for the `projects_to_qdrant` relation. The customer
.exe ships an **embedded Qdrant** via `rro::QdrantInstance::start`
(vendored `deps/qdrant`) — cloud Qdrant exists for dev iteration only.

### Local SurrealDB (port 8842)

| Field | Value |
|---|---|
| Bind | `127.0.0.1:8842` |
| Auth | `root:root` (dev-only) |
| Backend | `surrealkv://D:/localdev/deps/surrealdb/data` |
| Boot script | `scripts/surrealdb/start-surreal.cmd` |

**Port 8842 is intentional** — not SurrealDB's default 8000, not LibSQL's
8080, not SSH-adjacent 8822. Pick once, align local + every hook + every
preflight. Never collides with anything else on the dev box.

---

## Namespace ownership map

```
SurrealDB Cloud (single instance, two principals)
├── clyffy/                           ← clyffy:changemelater (product)
│   └── ai_memory/
│       ├── agent_message             ← Claude Code chat → here per spec
│       ├── agent_session
│       ├── memory_item (+ graph)
│       ├── rro_signal
│       ├── projection_job + projects_to_qdrant ← Qdrant integration
│       ├── ai_connector / ai_pool / ai_provider
│       ├── mcp_node / mcp_tool_registry
│       └── governance_decision / lesson / persona_catalog
│
├── platform_devpulse/                ← devpulse_engine:dp_sys_2026! (operator)
│   └── chat/                         ← banter-dump.js writes here
│       ├── turns (operator chat log)
│       └── sessions (operator session markers)
│
├── projects/                         ← devpulse_engine (operator)
│   └── devpulse/                     ← save-state.js writes here
│       ├── context (last_compact, compact_trigger)
│       ├── tasks
│       ├── architecture, decisions, lesson_progress
│       └── (12 rows verified 2026-05-20)
│
├── agents/                           ← devpulse_engine (operator)
│   └── claude/                       ← session-end.js + restore-memory.js
│       ├── sessions
│       ├── chat
│       └── blockers, files_touched
│
├── global/                           ← devpulse_engine (operator)
│   └── knowledge/                    ← restore-memory.js reads here
│       ├── preferences
│       └── learnings
│
└── wardenclyffe/                     ← clyffy:changemelater (sibling project)
    └── ai_memory/
```

```
Qdrant Cloud (single cluster, single key)
├── clyffy_messages              ← agent_message projection
├── clyffy_minion_capabilities   ← capability_catalog projection
└── clyffy_route_entities        ← routing entity projection
```

---

## Credential resolution order

Every component reads cloud credentials in this order:

1. **Infisical CLI** (canonical SoT) — `infisical secrets get <KEY> --env=dev --projectId=<id> --plain`
2. **OS keyring** (offline mirror) — `devpulse:<key>` per `project_secrets_keyring_ssot`
3. **Hardcoded fallback** (one-shot bootstrap only) — `scripts/surrealdb/seed-cloud.js`

The two **Infisical workspaces**:

| Workspace | ID | Used for |
|---|---|---|
| **Clyffy** | `4a897376-3cbd-4aeb-8550-c7d3ed7ad113` | Production-ready API keys + cloud URLs. ANTHROPIC, OPENAI, QDRANT_API_KEY, QDRANT_CLOUD_URL, GROK, GEMINI, ELEVENLABS, GITHUB_PAT_CLASSIC_KEY, TAILSCALE_AUTH_KEY, etc. |
| **DevPULSE** | `aa1b61d2-aa89-4d19-8273-c0bccd2f86e3` | Project-scoped Discord/SurrealDB legacy. Less canonical than Clyffy; treat as secondary. |

When Claude Code is searching for a secret and the canonical place is
ambiguous, **try Clyffy first** — that's where the latest values live.

---

## Heartbeat policy

SurrealDB Cloud free-tier **auto-pauses after 7 days of zero SQL traffic**.
Once paused, the next request takes ~30s to wake the instance and may
return transient errors.

**Heartbeat = single INSERT issued by `restore-memory.js` on every
SessionStart hook.** Target table: `platform_devpulse.chat.heartbeats`.
Lightweight row, never queried, exists solely to keep the timer reset.

```sql
INSERT INTO heartbeats { ts: time::now(), source: 'restore-memory' };
```

`cargo xtask preflight --cloud` also writes one heartbeat per invocation,
so opening the project in VS Code (via the auto-run task) defeats the
timer even when Claude Code is not the trigger.

If you ever see the cloud dashboard warning "X days of no activity," it
means the SessionStart hook is broken or VS Code hasn't been opened in
that period. The fix is to invoke `cargo xtask preflight --cloud` once.

---

## Common patterns

### Probe order — local first, cloud fallback

Every hook probes local **127.0.0.1:8842** first with a 2-second timeout,
then falls back to cloud with a 5-second timeout. Local is the runtime
target once the app is shipped; cloud is for dev iteration when local
isn't running.

```javascript
const LOCAL_BASE = "http://127.0.0.1:8842";
const CLOUD_BASE = "https://devpulse-06e6sbjhctrt511bgpdvd3d6c8.aws-use1.surreal.cloud";
const NULL_DEVICE = process.platform === "win32" ? "NUL" : "/dev/null";
```

### Bootstrap a namespace before first write

Cloud rejects writes to namespaces/databases that haven't been DEFINEd.
The SurrealDB error message **"Couldn't write to a read only transaction"
means the namespace is not defined**, NOT a permission issue. Always
bootstrap before the first INSERT:

```sql
DEFINE NAMESPACE IF NOT EXISTS <ns>;
USE NS <ns>;
DEFINE DATABASE IF NOT EXISTS <db>;
```

### Lowercase headers everywhere

```
surreal-ns: <namespace>      ← canonical
surreal-db: <database>       ← canonical
NS: <namespace>              ← FORBIDDEN — silently returns wrong scope on cloud
DB: <database>               ← FORBIDDEN
```

Verified against SurrealDB v3 HTTP docs 2026-05-09. The cloud accepts
uppercase but returns the wrong namespace context, which manifests as
"empty results" or "table not found" errors that look like config bugs.

---

## Preflight tasks

### `cargo xtask preflight` (default — toolchain only, no network)

- pnpm + Node + cargo present
- Version policies match `package.json` `packageManager` and `.nvmrc`
- Exits in <2s, safe to chain into `run-dev`

### `cargo xtask preflight --cloud` (full — toolchain + cloud)

Additional checks:

- **SurrealDB Cloud reachable** as `devpulse_engine` (operator)
- **SurrealDB Cloud reachable** as `clyffy` (product)
- **Qdrant Cloud reachable** with `clyffy_*` collections present
- **Heartbeat write** to `platform_devpulse.chat.heartbeats`
- **Local SurrealDB optional** — green if reachable on 8842, skipped otherwise
- Reads creds via Infisical CLI (Clyffy workspace, dev env)

Failure modes:

- Infisical CLI not logged in → preflight warns, falls back to OS keyring
- OS keyring missing entries → preflight fails red with remediation hint
- Cloud unreachable → preflight fails red with specific endpoint
- Heartbeat write fails → preflight fails red (this is the auto-pause defender)

### VS Code on folderOpen

`.vscode/tasks.json` runs `cargo xtask preflight --cloud` automatically
when the workspace is opened — so every dev session starts with a clean
status line and a fresh heartbeat. Failure surfaces as a notification but
does not block work.

---

## When this doc is wrong

If you make a change that contradicts a section here, **update this doc
in the same commit**. Treat divergence as a bug — never as "the spec is
outdated, I'll fix later."

The artifacts that depend on this doc:

- `.claude/hooks/banter-dump.js`
- `.claude/hooks/save-state.js`
- `.claude/hooks/session-end.js`
- `.claude/hooks/restore-memory.js`
- `.claude/hooks/_surreal.js` (shared probe lib)
- `scripts/surrealdb/start-surreal.cmd`
- `scripts/surrealdb/seed-cloud.js`
- `scripts/surrealdb/seed-all.cmd`
- `xtask/src/commands/preflight.rs`
- `.vscode/tasks.json`

When any of these drifts from this doc, the doc is the canon. Reconcile
the artifact, not the doc.
