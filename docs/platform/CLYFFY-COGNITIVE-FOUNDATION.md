# Clyffy's Cortex — Cognitive Foundation

| Field        | Value                                                    |
|--------------|----------------------------------------------------------|
| Status       | OFFICIAL — v1.0.0 (foundation lock)                      |
| Authored     | 2026-05-20                                               |
| Owner        | @jesse                                                   |
| Scope        | Platform-wide. DevPulse mainline + Clyffy.ai fork + Bifrost. |
| Supersedes   | scattered notes in PROGRAM-COLDLIGHT.md, RRO.md vocabulary line, prior `clyffy_dean` references in user memory. |
| Governs      | persona MCP surface, orchestrator crate, RRD/RRO extension work, online master, cross-version sync. |
| Governed by  | PHILOSOPHY.md, top-5 rules (Rust-only mainline, no `unwrap`), `systems/devpulse-engine/ip/kernel_terms.toml`. |

This is the single source of truth for Clyffy's Cortex. Every subsequent slice plan, sub-sprint, agent rule, and memory entry resolves against the definitions, contracts, and topology declared here.

---

## 1. Identity hierarchy

### Clyffy

Persona and orchestrator identity. One ID across desktop, online master, Bifrost, Claude Desktop, Claude Code, and Routines. Previous `clyffy_dean` separation is retired — there is only `clyffy`. Authentication subject in Authentik. The same persona blocks (`persona`, `human`, project-scoped pinned facts) follow the user across every surface.

### Clyffy's Cortex

The intelligence-layer umbrella. The set of all subsystems that produce, store, recall, and consume memory, facts, and reasoning artifacts on Clyffy's behalf. "Cortex" is a kernel term (per `kernel_terms.toml` → engine "knowledge engine"). Cortex is what runs *on top of* RRO; RRO does not call Cortex (per `scripts/docs/specs/cortex/rro/RRO.md` §2).

### RRD — Reason Ready Daemon

In-process orchestrator that runs the RRO cluster. Already authored at `kernel/rrd/` (daemon, lifecycle, state, traits, e2e tests). Owns the five-state lifecycle (`Loading | Running | Paused | Updating | Failed`), `PauseHandle`, `HotUpdateable` / `HotSwap` traits, and the `RRD_LIFECYCLE_TARGET` tracing taxonomy. The RRD does NOT own the public RRO API, embedding compute, storage, or reasoning logic — it is the conductor. Extension work in this program goes *into* `kernel/rrd/`; nothing is re-authored.

### RRO — Reason Ready Objects

Typed, grammar-conformant artifacts emitted by RRD. Each RRO is a vector + provenance + governance + concepts + relations bundle, `rkyv`-archivable for zero-copy reads (`cortex::intelligence::record::RroRecord`). **Constrained decoding (llguidance v1.7.5) is the mechanism that emits them — not the artifact itself.** This is the corrected definition. The prior "RRO = orchestrator" memory entry is retired. RRO is plural and the artifact.

The constraint-emission side is wired at `kernel/devpulse-clyffy/src/cortex/llguidance/` (config, handle, system_libsql). The artifact side is wired at `kernel/devpulse-clyffy/src/cortex/intelligence/` (record, schema, store trait). The cluster (encoder + embedder + Qdrant + RRD) is the production line; an RRO is what rolls off it.

### Persona MCP

The mesh hub. A stdio JSON-RPC MCP server (Streamable HTTP variant for online) that exposes `persona.*` / `cortex.*` / `rrd.*` verbs over the wire. Every surface (DevPulse desktop, Clyffy.ai online master, Claude Desktop, Claude Code, Bifrost, Routines) is an MCP client of this hub. The verb surface IS the adapter — see §2.

### Orchestrator

Small always-loaded supervisor model. Qwen3-4B-Instruct via `llama.cpp` FFI with llguidance grammars for tool calls. Holds the prefix-cacheable system prompt + tool schemas + frozen persona blocks (§1 Letta-style core memory tier). Dispatches to big workers (Nemotron 7.6B / Phi-4-mm / Burn-served Harrier 0.6B) for deep reasoning. Two-tier supervisor/worker is the canonical 2026 shape (Uber, Klarna, LinkedIn, Replit reference deployments).

### Memory subsystem

Bi-temporal graph + vector + KV. SurrealDB native: `memories` table (HNSW cosine), `rro_archive` table (rkyv blobs), edges via `RELATE` with `(t_valid, t_invalid, t_created, t_expired)` fact-edge timestamps. Qdrant embedded in-process via `rro::QdrantInstance::start` for vector hot path. Three retrieval primitives — cosine (φ_cos), full-text BM25 (φ_bm25), graph BFS (φ_bfs). Reciprocal Rank Fusion combines them. Tiers (Letta-style): core (RAM, char-limited blocks) → recall (full history, hybrid search) → archival (vector store, paged via tool call).

### Deep Reasoning

Large-model consumption layer. Burn 0.21 owns Harrier 0.6B (BF16 CPU = Flex backend + runtime DType). llama.cpp owns Nemotron 7.6B. Candle owns SigLIP HD. mistral.rs owns Phi-4-multimodal. These engines co-run; they don't chain. Deep Reasoning absorbs RROs as input and produces final outputs.

---

## 2. Adapter contract

The adapter IS the MCP verb surface. Every component on every surface speaks the same verbs.

### Transport

| Surface                          | Transport                                          |
|----------------------------------|----------------------------------------------------|
| DevPulse desktop (local)         | stdio JSON-RPC (child process spawned at boot)     |
| Clyffy.ai online master          | Streamable HTTP (MCP spec 2025-06-18, SSE-resumable) |
| Bifrost (Discord)                | Streamable HTTP (subscribes to online master)      |
| Claude Desktop / Claude Code     | stdio JSON-RPC (registered in `~/.claude/.mcp.json` and `claude_desktop_config.json`) |
| Routines (scheduled tasks)       | Streamable HTTP                                    |

### Auth

OAuth bearer from Authentik. The token's `sub` claim is the Clyffy user ID. Local stdio transport reads the token from `$DEVPULSE_AUTHENTIK_TOKEN`; HTTP transport requires `Authorization: Bearer <jwt>`. Online master rejects unauthenticated calls. Local desktop accepts unauthenticated calls only when `clyffy.offline=true` is set in the project config.

### Idempotency

Every write verb accepts an `idempotency_key: string` (UUIDv7 recommended). The server stores `(key, response)` for 24 hours; duplicate keys return the cached response. Read verbs ignore the key.

### Error envelope

```json
{
  "jsonrpc": "2.0",
  "id": "<request id>",
  "error": {
    "code": -32000,
    "message": "human-readable summary",
    "data": {
      "kind": "auth|not_found|invalid_arg|rate_limit|backend|conflict",
      "trace_id": "<W3C traceparent>",
      "retry_after_ms": 0
    }
  }
}
```

### Verb surface

Namespaces are flat: `persona.*` (identity + core memory blocks), `cortex.*` (recall + thought emission), `rrd.*` (lifecycle + episode ingestion + fact queries).

```text
persona.load(scope: "user" | "project", slug?: string)
  -> { blocks: [{ id, label, body, char_limit, updated_at }] }

persona.save(scope, slug?, block_id, body, idempotency_key)
  -> { id, version, conflict?: "last_write_wins" }

persona.recall(scope, slug?, query, top_k, kinds?[], mode: "cos"|"bm25"|"bfs"|"rrf")
  -> { hits: [{ record_id, text, kind, score, t_valid, t_invalid? }] }

persona.list(scope, slug?, kind?, since?: ISO-8601, limit)
  -> { items: [...], cursor?: string }

cortex.thought_emit(slug, prompt, schema_id, grammar_id?, idempotency_key)
  -> { rro_id, archive_bytes_len, latency_ms }
  # Drives llguidance-constrained decoding on the orchestrator.
  # Returns the RRO id; archive bytes live in rro_archive table.

cortex.thought_read(rro_id)
  -> { bytes: base64 }
  # Caller does rkyv::access locally for zero-copy.

rrd.episode_ingest(slug, turns: [{role, content, ts}], triggers?: ["explicit"|"topic_shift"|"turn_count"], idempotency_key)
  -> { episode_id, queued, est_completion_ms }
  # Always async. Extract -> resolve -> invalidate runs background.

rrd.fact_query(slug, subject?, predicate?, object?, valid_at?: ISO-8601, top_k)
  -> { facts: [{ id, s, p, o, t_valid, t_invalid, sources[] }] }

rrd.fact_invalidate(slug, fact_id, reason, idempotency_key)
  -> { invalidated_at }
  # Never deletes. Sets t_invalid + writes contradiction edge.

rrd.lifecycle(slug)
  -> { state: "Loading|Running|Paused|Updating|Failed", phase?, since }

rrd.pause(slug, idempotency_key)
  -> { handle_id, expires_at }

rrd.resume(slug, handle_id)
  -> { ok: true }
```

Server capability advertisement (per MCP spec) lists `tools`, `prompts`, `resources`, and `logging`. The verbs above register as tools.

---

## 3. Stack split + repo topology

### Three repos, three roles

| Repo                | Path                                  | Role                                                                                  | Languages                       |
|---------------------|---------------------------------------|---------------------------------------------------------------------------------------|---------------------------------|
| DevPulse mainline   | `D:\localdev\platform_devpulse\`      | Tauri 2 desktop app. RRD/RRO production. Persona MCP server. Orchestrator crate.      | Rust + TypeScript + Svelte 5    |
| Clyffy.ai fork      | new repo (forked from DevPulse alpha) | Online master. Hosts Deep Reasoning on TrueFoundry. Replaces wardenclyffe's role.     | Rust (server) + Go (AI portion) |
| Wardenclyffe legacy | `D:\localdev\wardenclyffe\`           | Live until Clyffy.ai online master replaces it. `warden` = production Go panel. `clyffe` = planned client/KB. | Go                              |

### What lives where

**DevPulse mainline owns:**
- `kernel/rrd/` — Reason Ready Daemon (already authored).
- `kernel/devpulse-clyffy/src/cortex/` — intelligence, llguidance, persistence, persona, reasoning, rro, suggest, governance, knowledge.
- `kernel/model-loader/` — model registry, slot resolution, backend pool.
- `systems/devpulse-engine/` — platform facade, IP-NOTE re-exports, telemetry lanes.
- `systems/devpulse-persona-mcp/` (Slice 1, new) — persona MCP server crate.
- `systems/devpulse-orchestrator/` (Slice 2, new) — Qwen3-4B supervisor.
- `interfaces/desktop/` — Tauri shell, ColdLight design system, devtools.

Top-5 rule #1 holds: **no Python, no Docker, no external services** in mainline.

**Clyffy.ai fork owns:**
- Online master MCP server (Streamable HTTP variant of `systems/devpulse-persona-mcp/`).
- TrueFoundry deployment for Deep Reasoning models.
- Bifrost Discord surface (migrated from wardenclyffe).
- Go AI portion (migrated from `wardenclyffe/warden/`) — pattern recognition, capability gating, agent dispatch.
- SurrealDB cloud SSOT client (read + write, full replication target).

Go is allowed in this repo ONLY. Mainline stays pure Rust.

**Wardenclyffe legacy keeps:**
- `warden/` running on server1.probablydns.com (104.176.44.101) until cutover.
- `clyffe/` planning docs (client/KB) — superseded by this document, archived after Slice 6 ships.

### Migration path (warden -> Clyffy.ai)

| Wardenclyffe asset                     | Destination in Clyffy.ai fork                     | Slice  |
|----------------------------------------|---------------------------------------------------|--------|
| `warden/agent/` Go AI dispatch         | `clyffy-ai/agent/` (Go preserved)                 | 6      |
| `warden/intelligence/` capability gate | `clyffy-ai/intelligence/`                         | 6      |
| Bifrost Discord bot                    | `clyffy-ai/bifrost/` (Go)                         | 8      |
| Authentik instance config              | reused via OAuth federation; no copy              | 0      |
| Production traffic                     | DNS cutover after Clyffy.ai online master green   | 7      |

Wardenclyffe is not deleted. It is decommissioned by traffic cutover. Repo stays read-only as historical reference.

### Language boundaries (enforced)

- Mainline `kernel/` and `systems/`: Rust only. Any new `*.py`, `*.go`, `*.ts` (outside frontend) in these dirs is a CI failure.
- Mainline frontend (`interfaces/desktop/`): TypeScript + Svelte 5 only.
- Clyffy.ai fork `clyffy-ai/`: Go allowed. Server scaffold stays Rust.
- Cross-repo communication is MCP (verbs from §2) and SurrealDB cloud SSOT only. No shared in-memory state, no shared filesystem.

---

## 4. Cross-version sync

### SSOT

Cloud SurrealDB is the single source of truth across DevPulse mainline (desktop), Clyffy.ai online master, and Bifrost.

```text
Endpoint: devpulse-06e6sbjhctrt511bgpdvd3d6c8.aws-use1.surreal.cloud
Namespace: projects
Database: devpulse
Headers (lowercase, locked): surreal-ns: projects / surreal-db: devpulse
```

### Replication model

- **Mainline desktop** writes to local embedded SurrealDB (`SurrealAdapter`, kernel term) AND publishes the same change to cloud via the persona MCP server's outbound queue. Local-first; cloud is the durable copy.
- **Online master / Bifrost** write directly to cloud. They have no local mirror; cloud is the working store.
- **Desktop reads** check local first, fall back to cloud on miss. Recent-write window (60 s) is served from local only to avoid read-after-write skew.

### Conflict semantics

- **Persona blocks** (core memory): last-write-wins on `updated_at`. The losing write surfaces in `persona.save` response as `conflict: "last_write_wins"` for caller-side telemetry. No merge UX in v1.
- **Facts** (graph edges with bi-temporal stamps): never overwrite. A contradiction closes the old edge (`t_invalid = now`) and inserts a new edge with `t_valid = now`. Both edges remain queryable. `valid_at` parameter on `rrd.fact_query` returns the edge that was valid at that instant.
- **RRO archive bytes**: immutable. New extraction produces a new RRO id; old id is referenced by `t_invalid`-closed edges.

### Offline mode

When `clyffy.offline=true` (set in project config or by `--offline` boot flag):

- Persona MCP server suspends the outbound cloud queue. Queue persists to local SQLite.
- All reads serve from local SurrealDB only.
- On reconnect, the queue drains in insertion order. Cloud applies the bi-temporal rules — old offline writes can land with `t_valid < now` and be marked superseded by cloud writes that happened during the offline window.
- Persona blocks reconcile via last-write-wins on `updated_at`; the offline client may lose a block edit if cloud changed it during the offline window. UI shows a "reconciled — view history" affordance.

---

## 5. UI surfaces

The four Cortex Surfaces render in BOTH desktop AND online AND Bifrost, using the same component contracts but different containers.

| Surface           | Desktop container                                    | Online container                  | Bifrost container          |
|-------------------|------------------------------------------------------|-----------------------------------|----------------------------|
| System Memory     | ColdLight `<Card preset="cortex-node">` grid in devtools | Web `<CortexNodeGrid>` (same primitives) | Discord embed list         |
| Working Memory    | ColdLight `<Timeline>` + `<Pill>`                    | Web `<Timeline>`                  | Discord ephemeral message  |
| Thinking          | ColdLight `<RuminationStream>` (renders RRD phase tracing) | Web `<RuminationStream>`          | Discord typing indicator + status reply |
| Councils          | ColdLight `<CouncilSeats>` (9 seats per CORTEX.md §4) | Web `<CouncilSeats>`              | Discord poll (seat votes)  |

The kernel-term-to-engine-term mapping is non-negotiable. Per `systems/devpulse-engine/ip/kernel_terms.toml`:

- "System Memory" surfaces what kernel calls `SurrealAdapter` (prod label: "Cortex").
- "Working Memory" surfaces what kernel calls `MokaAdapter` (prod label: "Memory Cache").
- "Thinking" surfaces what kernel calls `rumination` (prod label: "thinking") with phase labels from the RRD lifecycle table.
- "Councils" surfaces what kernel calls Council orchestration (Cow/Sheep/Pig/Mini Pony/Crane/Llama/Fox/Badger/Goat Twins per RRO.md §2).

ColdLight OWNS ARIA by default (WAI-ARIA APG). Melt UI is `dsAdapter` exception only. No surface re-rolls markup that exists as a ColdLight primitive — that rule is enforced by the `coldlight-curator` agent (Sprint 00 of PROGRAM-COLDLIGHT).

The kernel term registry MUST be extended this slice (Slice 0) to add `RRO` as plural (it already exists in `[CATEGORY: Algorithm Names]` as singular but the "Reasoning Ready Object" engine entry conflicts with the corrected vocabulary — update to "Reason Ready Object(s)"; engine label "prepared context" stays).

---

## 6. Owned-tooling map

### Authentik

| Field      | Value                                                                       |
|------------|-----------------------------------------------------------------------------|
| Role       | Single sign-on across desktop, online master, Bifrost, Helicone, Braintrust |
| Runs       | Cloud (wardenclyffe lxc/103 today; migrates to managed instance in Slice 7) |
| Integrates | OAuth 2.0 / OIDC. Bearer token issued to each surface.                      |
| Owns       | User identity, group membership, OAuth client registrations, JWT signing.   |
| Not        | Authorization policy (each service owns its own RBAC against the `sub`).    |

### Bifrost

| Field      | Value                                                                       |
|------------|-----------------------------------------------------------------------------|
| Role       | Discord surface — third UI alongside desktop + online master                |
| Runs       | Clyffy.ai fork (Go, migrated from wardenclyffe in Slice 8)                  |
| Integrates | MCP client over Streamable HTTP to persona MCP server                       |
| Owns       | Discord gateway connection, slash command registration, message dispatch.   |
| Not        | Reasoning, memory writes, fact extraction — those go through MCP verbs.     |

### Helicone

| Field      | Value                                                                       |
|------------|-----------------------------------------------------------------------------|
| Role       | LLM-call observability — orchestrator, workers, extractors proxied through it |
| Runs       | Helicone Cloud (managed)                                                    |
| Integrates | HTTP proxy in front of every llama.cpp / mistral.rs / TrueFoundry endpoint  |
| Owns       | Request/response logs, cost rollup, latency p50/p95/p99, prompt hash dedup. |
| Not        | Prompt content storage beyond retention window; routing decisions.          |

### TrueFoundry

| Field      | Value                                                                       |
|------------|-----------------------------------------------------------------------------|
| Role       | Hosted serving for Deep Reasoning on the Clyffy.ai online master            |
| Runs       | Cloud (managed). Mainline desktop does NOT call TrueFoundry directly.       |
| Integrates | HTTP behind Helicone proxy. Orchestrator on online master invokes it for big-worker delegation. |
| Owns       | GPU lifecycle, model weight hosting, autoscale, batched inference.          |
| Not        | Orchestrator state, memory, persona — those stay on the online master process. |

### Braintrust

| Field      | Value                                                                       |
|------------|-----------------------------------------------------------------------------|
| Role       | Evals on memory writes, tool calls, RRO output quality                      |
| Runs       | Braintrust Cloud                                                            |
| Integrates | SDK call from the persona MCP server's write path; sampled, async, off the hot path. |
| Owns       | Eval suites, regression baselines, dashboards, alerting on quality drops.   |
| Not        | Production routing decisions — eval results inform but never gate writes.   |

### SurrealDB

| Field      | Value                                                                       |
|------------|-----------------------------------------------------------------------------|
| Role       | Persona graph + bi-temporal facts. Cloud SSOT + local mirror.               |
| Runs       | Cloud (managed, lowercase headers locked) + local embedded (`SurrealAdapter`) |
| Integrates | Native Rust client. Schema from `cortex::intelligence::schema::MEMORY_SCHEMA`. |
| Owns       | `memories` (HNSW), `rro_archive` (bytes), edge tables, per-project namespaces. |
| Not        | Vector hot path (Qdrant handles that); LLM call logs (Helicone).            |

### Qdrant

| Field      | Value                                                                       |
|------------|-----------------------------------------------------------------------------|
| Role       | Vector index. Embedded in-process via `rro::QdrantInstance::start`.         |
| Runs       | Local in mainline desktop. Online master uses its own embedded instance.    |
| Integrates | Direct Rust API. Wired through `cortex::persistence::rro::RroAdapter` (feature `rro`). |
| Owns       | HNSW vector store, payload filtering, hot-path recall (sub-100 ms cached).  |
| Not        | Durable storage of source content — SurrealDB owns that.                    |

### HF encoder (Burn)

| Field      | Value                                                                       |
|------------|-----------------------------------------------------------------------------|
| Role       | Semantic feature production for RRD. Powers the rerank signal.              |
| Runs       | Local in-process (mainline desktop). Online master runs same crate.         |
| Integrates | Burn 0.21 BF16 CPU = Flex backend + runtime `DType`. Hot-swappable via `HotUpdateable` impl in `cortex::persistence::burn::embedder`. |
| Owns       | Encoder forward pass. Currently Harrier 0.6B; long-term custom 0.5B owned model. |
| Not        | Tokenization (that's the embedder pipeline); storage; routing.              |

### HF embedder

| Field      | Value                                                                       |
|------------|-----------------------------------------------------------------------------|
| Role       | Text -> dense vectors for SurrealDB + Qdrant writes                         |
| Runs       | Local in-process (Candle-backed, `CandleEmbedder` at `cortex::persistence::embedder`) |
| Integrates | `TextEmbedder` trait at `cortex::intelligence::pipeline`. Default `all-MiniLM-L6-v2`, 384-dim (locked in `EMBEDDING_DIM`). |
| Owns       | Tokenizer + forward pass + last-token pool + L2 normalize.                  |
| Not        | Sparse BM25 (SurrealDB native full-text); rerank (the encoder).             |

---

## Foundation Slice Plan

Slices are sequential except where marked parallel-safe. Each slice opens with file paths, closes with acceptance criteria, and does not start until the prior slice's exit gate clears (per `PROGRAM-COLDLIGHT.md` cross-cutting discipline).

### Slice 0 — SSOT doc landing + memory + term registry

**Goal:** This document lands. Memory and term registry reflect the corrected vocabulary.

| Action                                                                                  | Path                                                               | Est. LOC |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------------|----------|
| Land this document                                                                      | `docs/platform/CLYFFY-COGNITIVE-FOUNDATION.md`                     | ~500     |
| Update RRO term: kernel `RRO` engine `prepared context`; kernel `Reason Ready Object` (replaces "Reasoning Ready Object" string) | `systems/devpulse-engine/ip/kernel_terms.toml` (line 439–454)      | ~10 diff |
| Update user memory: retire `clyffy_dean`; correct RRO definition to "Reason Ready Objects"; register the nine owned services. | `~/.claude/CLAUDE.md` or `memories/*.md` (locked-memory side)      | ~30      |
| Add cross-reference paragraph to `RRO.md` pointing here                                 | `scripts/docs/specs/cortex/rro/RRO.md`                             | ~5 diff  |

**Dependencies:** none.

**Acceptance:**
- `cargo check -p devpulse-engine` zero/zero after term update.
- `pnpm generate:terminology` regenerates frontend TS with new RRO label.
- User memory grep for `clyffy_dean` returns zero results.
- `coldlight-curator` reads this document and signs off.

### Slice 1 — Persona MCP server crate

**Goal:** Stdio JSON-RPC MCP server exposing the 4 minimum verbs (`persona.load`, `persona.save`, `persona.recall`, `persona.list`). SurrealDB-backed via the existing `IntelligenceStore` trait.

| Path to create                                                  | Purpose                                                         | Est. LOC |
|-----------------------------------------------------------------|-----------------------------------------------------------------|----------|
| `systems/devpulse-persona-mcp/Cargo.toml`                       | Crate manifest. Deps: `tokio`, `serde_json`, `anyhow`, `tracing`, `devpulse-clyffy` (workspace path), `mcp-server` (chosen crate from Slice 1 research). | ~30      |
| `systems/devpulse-persona-mcp/src/lib.rs`                       | Re-exports.                                                     | ~20      |
| `systems/devpulse-persona-mcp/src/server.rs`                    | JSON-RPC dispatch loop, stdio framing per MCP spec.             | ~250     |
| `systems/devpulse-persona-mcp/src/verbs/persona.rs`             | `load`, `save`, `recall`, `list` handlers calling `IntelligenceStore`. | ~200     |
| `systems/devpulse-persona-mcp/src/auth.rs`                      | Authentik JWT validation (deferred for Slice 6; `clyffy.offline=true` accepted in v1). | ~80      |
| `systems/devpulse-persona-mcp/src/idempotency.rs`               | 24h LRU keyed on `idempotency_key`.                             | ~60      |
| `systems/devpulse-persona-mcp/src/main.rs`                      | Bin entry. Reads env, boots server, attaches tracing.           | ~50      |
| `systems/devpulse-persona-mcp/tests/e2e.rs`                     | Spawns server, drives 4 verbs over stdio, asserts responses.    | ~150     |
| `.mcp.json` update                                              | Register `devpulse-persona` command path for Claude Code.       | ~5 diff  |
| `claude_desktop_config.json` snippet in docs                    | Doc-only example for Claude Desktop registration.               | ~10      |

**Dependencies:** Slice 0 (term registry must accept "persona" / "cortex" / "rrd" verbs without flagging).

**Acceptance:**
- `cargo test -p devpulse-persona-mcp` green.
- `cargo run --bin devpulse-persona-mcp` accepts stdio JSON-RPC; manual `persona.load` returns frozen test fixture blocks.
- Claude Code `.mcp.json` registers the server; verbs callable from a Claude Code session.
- All 4 verbs satisfy the error-envelope shape from §2.

### Slice 2 — Orchestrator crate

**Goal:** Qwen3-4B-Instruct supervisor via llama.cpp FFI. llguidance grammars constrain tool-call emission. The orchestrator is an MCP CLIENT of Slice 1.

| Path to create                                                  | Purpose                                                         | Est. LOC |
|-----------------------------------------------------------------|-----------------------------------------------------------------|----------|
| `systems/devpulse-orchestrator/Cargo.toml`                      | Crate manifest. Deps: `llama-cpp-2` (FFI), `llguidance` v1.7.5, `tokio`, `serde_json`, `devpulse-persona-mcp` (client side from same crate, OR a `mcp-client` crate). | ~30      |
| `systems/devpulse-orchestrator/src/lib.rs`                      | Re-exports.                                                     | ~20      |
| `systems/devpulse-orchestrator/src/model.rs`                    | Qwen3-4B-Instruct load via llama.cpp. Hermes chat template.     | ~200     |
| `systems/devpulse-orchestrator/src/grammars/tool_call.lark`     | llguidance grammar for tool-call JSON.                          | ~80      |
| `systems/devpulse-orchestrator/src/context.rs`                  | Prefix-cacheable assembly (identity -> tools -> persona -> skills -> memories -> recent -> turn). | ~250     |
| `systems/devpulse-orchestrator/src/dispatch.rs`                 | Tool dispatch — MCP verbs from §2 + local skills.               | ~200     |
| `systems/devpulse-orchestrator/src/loop.rs`                     | Generate -> tool-call -> execute -> feed back -> repeat.        | ~200     |
| `systems/devpulse-orchestrator/tests/tool_call.rs`              | Asserts grammar-constrained JSON validates.                     | ~120     |

**Dependencies:** Slice 1 (verb surface exists), Slice 0 (term registry).

**Acceptance:**
- `cargo test -p devpulse-orchestrator` green.
- Smoke test: orchestrator boots with Qwen3-4B-Instruct gguf, accepts a prompt, calls `persona.recall` via MCP, returns synthesized reply.
- Constrained-decoding test: 100/100 emitted tool-calls parse as valid JSON against grammar (proves the llguidance unlock).

### Slice 3 — Memory write pipeline (extract -> dedup)

**Goal:** Async/background pipeline that turns episodes into memories. Hybrid triggers. Cosine floor for dedup.

| Path to create / extend                                                            | Purpose                                                  | Est. LOC |
|------------------------------------------------------------------------------------|----------------------------------------------------------|----------|
| `kernel/devpulse-clyffy/src/cortex/intelligence/pipeline.rs` (extend)              | Add `WritePipeline` with extract/dedup stages.           | +250     |
| `kernel/devpulse-clyffy/src/cortex/intelligence/triggers.rs` (new)                 | Heuristic (turn count, topic-shift via embedding distance > 0.4), constrained `should_remember(content) -> bool` LLM judge, explicit events. | ~180     |
| `kernel/devpulse-clyffy/src/cortex/intelligence/dedup.rs` (new)                    | `> 0.85` force LLM consideration, `< 0.6` direct ADD, between -> LLM-judged merge. | ~150     |
| `systems/devpulse-orchestrator/src/grammars/extract.lark` (new)                    | llguidance grammar for extracted memory schema.          | ~60      |
| `systems/devpulse-orchestrator/src/grammars/dedup_judge.lark` (new)                | llguidance grammar for `{"action":"merge"|"add"|"skip"}`. | ~30     |

**Dependencies:** Slices 1, 2.

**Acceptance:**
- Unit test: 100 synthetic episodes -> no LLM-only dedup junk (the Mem0 fix proven by injecting near-duplicates and asserting direct-ADD path on cosine `< 0.6`).
- Background: pipeline never runs on the agent hot path; latency p99 of `rrd.episode_ingest` < 50 ms (returns queued immediately).
- Trigger test: identical 5-turn conversation with topic-shift in turn 4 ingests exactly 1 memory at turn 4, none in turns 1–3.

### Slice 4 — Big-worker delegation

**Goal:** Orchestrator dispatches Deep Reasoning to cold big workers (Nemotron 7.6B via llama.cpp / Phi-4-mm via mistral.rs / Burn-served Harrier 0.6B) per the engine-↔-model lock.

| Path to create / extend                                                            | Purpose                                                  | Est. LOC |
|------------------------------------------------------------------------------------|----------------------------------------------------------|----------|
| `systems/devpulse-orchestrator/src/workers/mod.rs` (new)                           | Worker trait, dispatch by capability.                    | ~120     |
| `systems/devpulse-orchestrator/src/workers/nemotron.rs` (new)                      | llama.cpp Nemotron 7.6B adapter.                         | ~180     |
| `systems/devpulse-orchestrator/src/workers/phi4_mm.rs` (new)                       | mistral.rs Phi-4-mm adapter (multimodal in, text out).   | ~180     |
| `systems/devpulse-orchestrator/src/workers/harrier.rs` (new)                       | Burn-served Harrier 0.6B adapter.                        | ~150     |
| `systems/devpulse-orchestrator/src/decision.rs` (new)                              | Cost/latency/quality routing (Helicone-informed).        | ~120     |

**Dependencies:** Slices 2, 3.

**Acceptance:**
- Orchestrator routes 100 sampled prompts to the correct worker (text-only -> Nemotron, image+text -> Phi-4-mm, embed-rerank -> Harrier).
- Helicone shows worker calls with correct labels.
- No worker holds GPU between calls (cold by design).

### Slice 5 — Bi-temporal RRO production pipeline

**Goal:** Three-call extraction pipeline in RRD (collapsed from Graphiti's six). Entity + fact + temporal extraction; resolve; invalidate.

| Path to create / extend                                                            | Purpose                                                  | Est. LOC |
|------------------------------------------------------------------------------------|----------------------------------------------------------|----------|
| `kernel/rrd/src/rro_pipeline.rs` (new module, extends existing crate)              | Three-call pipeline orchestration.                       | ~280     |
| `kernel/rrd/src/extraction.rs` (new)                                               | Call 1: entity + fact joint extraction (grammar-constrained). | ~200 |
| `kernel/rrd/src/resolution.rs` (new)                                               | Call 2: entity resolution against existing graph.        | ~180     |
| `kernel/rrd/src/invalidation.rs` (new)                                             | Call 3: contradiction detection + `t_invalid` close.     | ~180     |
| `kernel/devpulse-clyffy/src/cortex/intelligence/schema.rs` (extend)                | Add bi-temporal fields to edge table.                    | +60      |
| `systems/devpulse-orchestrator/src/grammars/triple_extract.lark` (new)             | llguidance grammar for `{subject, predicate, object, t_valid?}`. | ~80 |
| `kernel/rrd/tests/bi_temporal.rs` (new)                                            | Asserts: contradiction never deletes; old edge has `t_invalid` set; `fact_query(valid_at=t1)` returns old edge. | ~200 |

**Dependencies:** Slices 3, 4.

**Acceptance:**
- Test suite: contradiction "Alice works at Acme" then "Alice works at Beta" produces two edges; querying at the original timestamp returns Acme, at present returns Beta.
- Grammar conformance: 100/100 triple-extract outputs validate.
- p99 pipeline latency < 5 s per episode on local Qwen3-4B (budget; Slice 3 already async).

### Slice 6 — Clyffy.ai fork initialization

**Goal:** New repo. Rust server scaffold (mirrors mainline `systems/devpulse-persona-mcp/` Streamable HTTP variant). Go AI scaffold migrated from wardenclyffe.

| Action                                                                           | Path                                                | Est. LOC |
|----------------------------------------------------------------------------------|-----------------------------------------------------|----------|
| `git clone D:\localdev\platform_devpulse` -> new repo `D:\localdev\clyffy_ai\`   | new repo init                                       | n/a      |
| Strip mainline Tauri/desktop dirs                                                | delete `interfaces/desktop/`, `interfaces/tauri/`   | n/a      |
| Add Streamable HTTP transport to persona MCP                                     | `systems/devpulse-persona-mcp/src/transport_http.rs` (new) | ~250 |
| Migrate `wardenclyffe/warden/agent/` Go                                          | `clyffy-ai/agent/` (Go, unchanged paths)            | n/a      |
| Migrate `wardenclyffe/intelligence/` Go                                          | `clyffy-ai/intelligence/`                           | n/a      |
| `go.work` at repo root                                                           | `clyffy-ai/go.work`                                 | ~10      |
| TrueFoundry deployment manifest                                                  | `clyffy-ai/deploy/truefoundry.yaml`                 | ~80      |
| Authentik OAuth client registration script                                       | `clyffy-ai/scripts/register-authentik.ts`           | ~60      |

**Dependencies:** Slices 1, 2, 3, 4, 5.

**Acceptance:**
- `clyffy-ai/` builds (Rust + Go).
- Online master accepts Streamable HTTP MCP calls.
- A test client (curl + bearer JWT) calls `persona.load` against the online master and gets the same shape as desktop.

### Slice 7 — Online master <-> local desktop sync

**Goal:** SurrealDB cloud replication. Outbound queue on desktop. Bi-temporal conflict semantics live.

| Path to create / extend                                                            | Purpose                                                  | Est. LOC |
|------------------------------------------------------------------------------------|----------------------------------------------------------|----------|
| `kernel/devpulse-clyffy/src/cortex/persistence/cloud_sync.rs` (new)                | Outbound queue, retry, exponential backoff.              | ~280     |
| `kernel/devpulse-clyffy/src/cortex/persistence/conflict.rs` (new)                  | Conflict reporter (last-write-wins for blocks; bi-temporal for facts). | ~180 |
| `systems/devpulse-persona-mcp/src/sync.rs` (new)                                   | Hook into save/recall to publish to cloud.               | ~150     |
| `kernel/devpulse-clyffy/tests/offline_reconcile.rs` (new)                          | Simulate offline writes, reconnect, assert reconciliation. | ~200   |

**Dependencies:** Slices 1, 5, 6.

**Acceptance:**
- Desktop write -> cloud read within p99 2 s online.
- Offline test: 10 writes while offline -> reconnect -> all 10 land in cloud in order, with correct `t_valid` stamps.
- Conflict test: two desktops edit the same persona block; later `updated_at` wins; both clients see the same final state within 5 s.

### Slice 8 — Bifrost Discord surface migration

**Goal:** Bifrost moves from wardenclyffe into the Clyffy.ai fork. Subscribes to the online master via Streamable HTTP MCP.

| Action                                                                           | Path                                                | Est. LOC |
|----------------------------------------------------------------------------------|-----------------------------------------------------|----------|
| Migrate `wardenclyffe/edge/bifrost/` (or wherever current Bifrost lives) -> `clyffy-ai/bifrost/` | Go preserved                                | n/a      |
| Replace direct Go-internal calls with MCP client calls to online master          | `clyffy-ai/bifrost/mcp_client.go` (new)             | ~250     |
| Discord slash commands map to MCP verbs (`/recall`, `/remember`, `/think`)       | `clyffy-ai/bifrost/commands.go`                     | ~200     |
| Authentik OAuth flow for Discord users                                           | `clyffy-ai/bifrost/auth.go`                         | ~150     |

**Dependencies:** Slices 6, 7.

**Acceptance:**
- Discord `/recall <query>` returns same hits as desktop `persona.recall`.
- Bifrost OAuth flow links Discord user -> Authentik user -> Clyffy user.
- Wardenclyffe Bifrost can be shut down without breaking Discord.

### Slice boundaries — what is NOT in scope here

- `cortex.thought_emit` ships in Slice 2 (orchestrator). Streaming variant deferred.
- Council orchestration (9-seat voting) is post-foundation. Logged in PARKING-LOT.
- ColdLight UI surfaces (System Memory / Working Memory / Thinking / Councils Svelte components) live under PROGRAM-COLDLIGHT, not here. This document declares the contract those components render against.
- Routines (scheduled tasks) is post-Slice-8.
