# DevPulse Architecture — SSOT

| Field | Value |
|-------|-------|
| **Status** | `RATIFIED` |
| **Version** | `1.0.0` |
| **Last Updated** | `2026-05-10` |
| **Owner** | `@jesse` |
| **Part of** | DevPulse Platform |
| **Governed by** | `PHILOSOPHY.md` (Clyffy approach) |
| **Governs** | All cognitive and runtime architecture downstream |

---

## How to read this document

Two markers appear next to every claim:

- **`[CODIFIED]`** — repeats a definition already locked in another on-disk SSOT. The cite is the authority; this doc never overrides.
- **`[RATIFIED HERE]`** — first time this concept is defined on disk. This doc IS the authority until a tighter SSOT supersedes it.

Drift between this doc and a `[CODIFIED]` cite is a defect in this doc.

---

## 0. Why this document exists

Before this file landed, the architecture vocabulary was scattered across five locations:

- [PHILOSOPHY.md](PHILOSOPHY.md) — Clyffy persona + three pillars
- [CORTEX.md](CORTEX.md) — Rumination latency pipeline + RRO state machine cite + governance graph
- [specs/cortex/rro/RRO.md](specs/cortex/rro/RRO.md) — RRO 5-component cluster
- [specs/cortex/rro/RRD.md](specs/cortex/rro/RRD.md) — RRD lifecycle daemon
- [systems/devpulse-engine/ip/kernel_terms.toml](../../systems/devpulse-engine/ip/kernel_terms.toml) — vocabulary lookup

Three core concepts were nowhere defined on disk:

1. **Minions as independent OS processes** (not threads) — only present as a project-memory directive
2. **MCP hive / cluster** — not defined as an architectural unit
3. **Four-layer memory model** (subconscious / active / ruminating / long-term) — the names appear in different scopes (`Long-Term Memory` in kernel_terms, `Ruminating` in `RroState` enum) but have never been stated together as a unified model

This document closes those gaps. Sections 1, 5, 6 ratify by citation. Sections 2, 3, 4, 7, 8 are first-pass definitional work.

---

## 1. Clyffy `[CODIFIED]`

> Cite: [PHILOSOPHY.md §"Naming & Boundary"](PHILOSOPHY.md)

Clyffy is **two things at once**, both reachable through one canonical name:

1. **The user-facing AI persona** — voice, tone, mascot, copy, narration.
2. **The kernel orchestrator** — the in-process Rust system that runs the entire cognitive surface (`kernel/devpulse-clyffy/`).

Persona state lives in SurrealDB namespaces. Sessions operate AS Clyffy through those namespaces; engineering work drives the product surface, not the persona roleplay.

**Three pillars** (`PHILOSOPHY.md §"Core Insight"`):

1. **Translation, not generation** — Clyffy turns vibe-speak into engineer-speak; executor models do the codegen.
2. **Economic protection, not learning tax** — Clyffy refuses bad prompts before they burn tokens.
3. **Rumination IS the generation loop** — owning the forward pass token-by-token is the moat.

**Naming discipline** is load-bearing — `MAESTRO` and `Gus`/`Gussette` are dead names; do not reintroduce.

---

## 2. Minions `[RATIFIED HERE]`

A **Minion** is a single-purpose AI worker that runs as an **independent operating-system process**, spawned and supervised by Cortex. Minions are never threads, tasks, coroutines, or async closures.

### 2.1 Why processes, not threads

- **Crash isolation.** A faulty minion (bad model load, OOM, FFI segfault) cannot take down Cortex.
- **Independent resource ceilings.** Each minion has its own VRAM/RAM budget the OS enforces.
- **Hot-update without Cortex restart.** Cortex can kill and respawn a minion when its model swaps.
- **Visible to the user.** PID + RSS show up in the OS task manager and in DevPulse's own dashboards (the same `sysinfo`-backed pattern DevForge already uses for the REH child — see [systems/devpulse-engine/src/platform/services/devforge.rs](../../systems/devpulse-engine/src/platform/services/devforge.rs) for the canonical pid+uptime pattern).

### 2.2 Minion lifecycle (Cortex-owned)

```
   spawn ──▶ Loading ──▶ Ready ──▶ Active ──┬──▶ Idle ──▶ Active (loop)
                  │                          │
                  └──▶ Failed ◀──────────────┴──▶ Draining ──▶ Stopped
```

Cortex owns:
- Spawn (with model path, VRAM ceiling, role tag)
- Health (per-minion heartbeat)
- Drain → kill on hot-update or shutdown
- Restart policy (configurable; default = restart on Failed unless in shutdown)

### 2.3 Minion roles

A Minion is identified by its **role tag**, not its model. Multiple minions may share a model file via the model-loader pool ([kernel/model-loader/src/backends/pool.rs](../../kernel/model-loader/src/backends/pool.rs)).

Initial role catalog:

| Role tag | Purpose | Default model class |
|---|---|---|
| `chat.brain` | Primary user-facing dialogue | Phi-4-multimodal-instruct or 5.6B+ |
| `chat.thinking` | Deep-rumination Send-layer worker | Same as `chat.brain` (KV-shared) |
| `minion.shared` | Short-turn dialogue + consolidation | 5-7B STS class |
| `vision.embedder` | Image → vector | SigLIP / Phi vision tower |
| `rag.encoder` | Text → vector | Harrier 0.6B (RRO bootstrap) |
| `governance.guard` | Constrained-decoding sampler host | llguidance + small judge model |
| `consolidator` | Branch checkpoint summarizer | `minion.shared` by default |

Adding a role = one entry in the [model-loader slot registry](../../kernel/model-loader/src/slots/) + one Cortex spawn rule. No threadpool config, no tokio task plumbing.

### 2.4 Inter-minion coordination

Minions **never call each other directly.** Cortex is the only writer of minion-bound work.

- Cortex → Minion: typed RPC over a per-minion local Unix-socket / named-pipe (Windows) — the same surface the model-loader already exposes per backend.
- Minion → Cortex: typed events on the platform's `InternalEvent` broadcast bus. Tracing AND `InternalEvent` are both required (see project memory: *"Tracing AND InternalEvent — both must be wired"*).

### 2.5 What Minions are NOT

- **Not MCP servers.** MCPs serve external tool capabilities (§3); minions run AI inference.
- **Not the engine.** The engine facade (`systems/devpulse-engine/`) hosts Cortex; it does not impersonate minions.
- **Not user-visible by name.** UI surfaces the role label (e.g. "Thinking", "Vision", "Reranker") — never the word "minion."

---

## 3. MCP Hive `[RATIFIED HERE]`

The **MCP hive** is the cluster of Model-Context-Protocol servers DevPulse aggregates so Clyffy can call external tool capabilities (filesystem, browser, git, search, etc.) under one governance perimeter.

### 3.1 Why "hive" not "list"

A flat list of MCP endpoints is easy to misuse:
- The same tool name (e.g. `read_file`) registered by two MCPs → silent collision.
- A new MCP added by the user → no audit of what capabilities it actually exposes.
- One MCP's failure → unclear whether to fail the request or fall back.

The **hive** model treats the cluster as a typed registry with:

1. **Capability schemas** — every MCP's tool list is registered with schema-typed inputs/outputs.
2. **Routing policy** — for a given capability (`fs.read`, `web.fetch`), the hive picks the highest-priority healthy MCP.
3. **Single governance pass** — every MCP call goes through the same llguidance grammar + Council sign-off, regardless of which MCP serves it.
4. **Per-capability health** — one MCP's `web.fetch` failing does not de-list its `fs.read`.

### 3.2 Hive components

| Component | Role | Owner |
|---|---|---|
| **Registry** | The map `capability → ordered list of MCP endpoints` | libsql table (SSOT) |
| **Router** | Picks the healthy endpoint for a request | In-process kernel module |
| **Probe** | Periodic health check per registered MCP | Cortex-spawned task |
| **Adapter** | One per MCP transport flavor (stdio, HTTP, WebSocket) | Pluggable trait |
| **Audit log** | Every MCP call recorded with cap, request, response, governance verdict | DuckDB analytics |

### 3.3 Hive vs Minions

| Aspect | Minions | MCP hive |
|---|---|---|
| What runs in them | DevPulse-owned models (Burn / llama.cpp / Candle) | External tool servers (anything MCP-compliant) |
| Lifecycle owner | Cortex | User (registers MCPs); Cortex (probes/routes) |
| Trust boundary | Inside DevPulse; full trust | External; treated as adversarial input by default |
| Governance | Per-minion role guardrails | Single grammar + Council per call |
| Failure isolation | OS process crash | Network/IPC error |

### 3.4 Initial hive surface

The hive lands as a kernel module under `kernel/devpulse-clyffy/src/cortex/mcp/` with this initial trait shape (`[RATIFIED HERE]`):

```rust
pub trait McpServer: Send + Sync {
    fn id(&self) -> &str;
    fn capabilities(&self) -> &[Capability];
    async fn invoke(&self, cap: &str, args: serde_json::Value) -> Result<serde_json::Value>;
    async fn health(&self) -> McpHealth;
}

pub struct McpHive {
    registry: Arc<Mutex<HashMap<String, Vec<Arc<dyn McpServer>>>>>,
    audit: Arc<DuckDbAuditSink>,
}
```

The hive is **not yet implemented**. This section is the contract for the implementation when Sprint 03+ reaches it.

---

## 4. Memory Layers `[RATIFIED HERE]`

DevPulse's memory model is a **four-layer hierarchy** ordered by latency, durability, and access cost. Every byte of context Clyffy holds lives in exactly one layer at any moment, with explicit promotion/demotion rules between layers.

> ⚠️ Distinct from the **rumination pipeline** in [CORTEX.md §1](CORTEX.md). The rumination pipeline is a latency ladder (Keystroke / Pause / Send / Background — *time budget*); memory layers are a storage hierarchy (*where state lives*). They are orthogonal: the Send rumination layer reads from all four memory layers and writes to the Ruminating one.

### 4.1 The four layers

```
                                        Latency       Durability      Backed by
   ┌─────────────────────────┐         ───────────  ─────────────  ──────────────────
   │  1. Subconscious        │  ◀──    100ms-1s     persistent     Qdrant fork (RRO)
   │  (background associations,│
   │   semantic neighborhood)  │
   ├─────────────────────────┤
   │  2. Active              │  ◀──    sub-ms        per-request    KV cache (llama.cpp),
   │  (current request's     │                                      working-memory rune,
   │   working set)          │                                      Moka context_cache
   ├─────────────────────────┤
   │  3. Ruminating          │  ◀──    100ms-5s      transient      RRD-held tensors,
   │  (in-flight deep        │                       (per-thread)   reasoning-tree branch
   │   reasoning context)    │
   ├─────────────────────────┤
   │  4. Long-term           │  ◀──    10ms-100ms    persistent     libsql (SSOT) +
   │  (consolidated facts,   │                                      SurrealDB (graph) +
   │   diary, project memory)│                                      DuckDB (analytics)
   └─────────────────────────┘
```

### 4.2 Layer definitions

#### Subconscious

The **passive associative store**. Everything Clyffy *might* recall but isn't currently using.

- **Backing:** Qdrant fork (the RRO vector store) + the BM25 sparse index.
- **Population:** Long-term entries promote into Subconscious on session warm-start; user-explicit "remember this" pins.
- **Read path:** RRO `query()` — top-K retrieval feeds the Active layer's prefix.
- **Write path:** Background-rumination layer writes consolidated knowledge here as a side-effect of the Send layer.

#### Active

The **here-and-now** working set for the current request.

- **Backing:** llama.cpp KV cache (token-aligned), the `working-memory` rune on the Svelte side, Moka `context_cache` (5-min idle TTL — see [RRO.md §3 cache table](specs/cortex/rro/RRO.md)).
- **Lifetime:** Per-request. Forks into Ruminating when the user triggers deep thinking; consolidates back into Long-term at session end.
- **Cap:** Bounded by the model's context window AND the working-memory cap of 14 (CORTEX.md §4.3).

#### Ruminating

The **in-flight deep reasoning context** — what the user sees as "Clyffy is thinking."

- **Backing:** RRD-managed tensors held by the Encoder + Embedder; the active reasoning-tree branch in Surreal (per CORTEX.md §4.1).
- **Trigger:** User explicit "think harder" gesture, or Send layer auto-escalation when Pause-layer confidence is low.
- **Surface:** Lifecycle state of the Ruminating layer is what the [CORTEX.md §3 RRO state machine](CORTEX.md) calls `ruminating` — same word, two views: state machine vs memory layer.
- **Drain:** Either consolidates into a checkpoint thought (CORTEX.md §4.4) which writes to Long-term, or discards.

#### Long-term

**Persisted facts that survive a process restart.**

- **Backing:** libsql is the SSOT (per RRO.md §3); SurrealDB holds the graph; DuckDB holds analytics replays.
- **Population:** Checkpoint summaries from Ruminating; explicit user diary entries; project-scan results; learned COSTAR+IC slot promotions (CORTEX.md §2.2).
- **Read path:** Background-rumination layer warm-starts Subconscious from here; explicit recalls hit libsql directly.

### 4.3 Promotion / demotion rules

| From | To | Trigger |
|---|---|---|
| Long-term | Subconscious | Session warm-start; user pin |
| Subconscious | Active | RRO retrieval injects top-K into prefix |
| Active | Ruminating | "Think harder" trigger or Pause-layer low-confidence escalation |
| Ruminating | Long-term | Checkpoint at depth 14 (forced) or operator-triggered consolidation |
| Ruminating | discard | User aborts; latency cap exceeded |
| Active | Long-term | Session end consolidation pipeline |

### 4.4 Layer ↔ rumination-pipeline cross-reference

| Rumination layer (CORTEX.md §1) | Memory layers it reads | Memory layers it writes |
|---|---|---|
| Keystroke (<50ms) | Active | — (read-only) |
| Pause (<500ms) | Active + Subconscious (top-K) | — |
| Send (2-5s) | Active + Subconscious + Ruminating | Ruminating (working tensors) |
| Background (minutes) | All four | Long-term + Subconscious |

---

## 5. RRD — Reason Ready Daemon `[CODIFIED]`

> Cite: [specs/cortex/rro/RRD.md](specs/cortex/rro/RRD.md) (OFFICIAL v1.0.0). Implementation: [kernel/rrd/src/daemon.rs](../../kernel/rrd/src/daemon.rs).

The RRD is the in-process orchestrator that **wraps the encoder + embedder + active retrieval context** and exposes them as a single hot-swappable unit.

The user's framing — "RRD is the wrapper that brings encoder, embedder, active context, then connects with Cortex" — matches RRD.md exactly. RRD owns **lifecycle**; it does not own queries.

### 5.1 What RRD owns (RRD.md §1)

- Lifecycle state of the RRO cluster
- Encoder hot-reload (atomic via `ArcSwap`)
- Pause/resume protocol (the "Clyffy maintenance" window the user sees)
- Health aggregation across backends
- Failure recovery from libsql SSOT
- Resource budget tracking

### 5.2 Lifecycle states (RRD.md §2)

```rust
pub enum RRDState {
    Loading,                  // Cold start: reading config, loading encoder weights
    Running,                  // Fully operational
    Paused,                   // Maintenance window: queries queue or get RRDUnavailable
    Updating,                 // Atomic encoder swap in progress
    Failed(FailureReason),    // Unrecoverable error; required for diagnostics
}
```

These names also appear in user-facing terminology — the engine/prod/dev label translation is in [terminology.ts:397-548](../../interfaces/desktop/src/lib/sys/generated/terminology.ts#L397) (auto-generated from `kernel_terms.toml`).

### 5.3 Pause/resume sequence (RRD.md §3)

1. `rro.pause_for_update()` called.
2. State → `Paused`; new queries queue or fail with `RRDUnavailable`.
3. Drain in-flight (typically <500ms).
4. State → `Updating`; encoder swap begins.
5. Load new weights (~2-5s for 0.6B safetensors).
6. Validate (test embedding shape + dim match).
7. `ArcSwap` atomic pointer swap.
8. State → `Running`; queued queries resume.

Total user-visible pause: ~5-10s. UI shows the "Clyffy maintenance" indicator throughout.

### 5.4 Implementation pointers

| Concern | Path |
|---|---|
| State machine | [kernel/rrd/src/state.rs](../../kernel/rrd/src/state.rs) |
| Daemon loop | [kernel/rrd/src/daemon.rs:77-353](../../kernel/rrd/src/daemon.rs#L77) |
| `HotUpdateable` trait | [kernel/rrd/src/traits.rs](../../kernel/rrd/src/traits.rs) |
| `BurnEmbedder` impl | [kernel/devpulse-clyffy/src/cortex/persistence/burn/hot_update.rs:79-178](../../kernel/devpulse-clyffy/src/cortex/persistence/burn/hot_update.rs#L79) |
| Engine bridge | [systems/devpulse-engine/src/platform/services/rrd_translator.rs:73](../../systems/devpulse-engine/src/platform/services/rrd_translator.rs#L73) |

---

## 6. RRO — Reason Ready Object System `[CODIFIED]`

> Cite: [specs/cortex/rro/RRO.md](specs/cortex/rro/RRO.md) (OFFICIAL v2.0.0).

RRO is the **multi-layer reasoning substrate** — a cluster of five components designed together as one pipeline:

| # | Component | Role |
|---|-----------|------|
| 1 | **RRD** (§5) | Orchestrator: lifecycle, hot-reload, pause/resume, health |
| 2 | **Reason Ready Object** (data unit) | Vector + provenance + governance + concepts + relations |
| 3 | **Encoder** | Burn-based; bootstrap on Harrier 0.6B; long-term: custom 0.5B |
| 4 | **Embedder pipeline** | Tokenizer + encoder forward + last-token pool + L2 norm + sparse BM25 |
| 5 | **Qdrant fork** | Vector storage backbone (the Subconscious layer's primary backing) |

### 6.1 What RRO is NOT (RRO.md §2)

RRO is **the substrate**. The following belong in Cortex, not RRO:

- Rumination pipeline (the four-layer Keystroke/Pause/Send/Background ladder)
- COSTAR+IC assembly
- Council orchestration (9 seats: Cow / Sheep / Pig / Mini Pony / Crane / Llama / Fox / Badger / Goat Twins)
- Fox pipeline (input rehab)
- Kernel state machine (8 states, event bus, scheduler)
- Sub-agent (minion) coordination (§2)
- Scribe (output to Cursor / Bolt / Replit / IDE)
- ROTI metrics

**Cortex calls RRO. RRO does not call Cortex.** This is the standalone-substrate test: if it can be sold via rroflow.ai without Council/Fox/COSTAR+IC/minions, it belongs in RRO.

### 6.2 Backend matrix (RRO.md §3)

| Category | Default (embedded) | Remote alternatives |
|----------|--------------------|--------------------|
| Vectors | Qdrant fork | Pinecone, Milvus |
| Relational | libsql (SSOT) | Postgres, Turso |
| Graph | SurrealDB (kv-surrealkv) | Neo4j |
| Analytics | DuckDB | ClickHouse |
| Hot Cache | Moka (4 named instances) | Redis |

**libsql is SSOT.** All other backends are derivable from libsql; corruption recovery rebuilds them from the libsql event log.

---

## 7. Cortex `[RATIFIED HERE]`

Cortex is the **outer wrap** that closes over RRO, Minions, the MCP hive, governance, and dynamic reasoning, and exposes one cognitive surface to the user.

CORTEX.md (LOCKED v1.0.0) defines the **rumination pipeline + COSTAR+IC + governance graph** that lives inside Cortex; it does not state Cortex's relationship to Minions or the MCP hive. This section closes that gap.

### 7.1 What Cortex owns

| Concern | Owner inside Cortex |
|---|---|
| Rumination pipeline (Keystroke / Pause / Send / Background) | [CORTEX.md §1](CORTEX.md) |
| COSTAR+IC assembly | [CORTEX.md §2](CORTEX.md) |
| RRO state machine (`idle` · `gathering` · `processing` · `ruminating` · `ready` · `purged` · `forked`) | [CORTEX.md §3](CORTEX.md) — cites `signals.registry.yaml` |
| Governance graph (reasoning-tree workbench) | [CORTEX.md §4](CORTEX.md) |
| Council orchestration (9 seats: Cow/Sheep/Pig/Mini-Pony/Crane/Llama/Fox/Badger/Goat-Twins) | [RRO.md §2](specs/cortex/rro/RRO.md) (declared out-of-RRO) |
| Fox pipeline (input rehab) | RRO.md §2 (declared out-of-RRO) |
| Scribe (output to Cursor/Bolt/Replit/IDE) | RRO.md §2 (declared out-of-RRO) |
| **Minion lifecycle** (spawn, drain, restart) | §2 of THIS doc |
| **MCP hive** (registry, router, probe, audit) | §3 of THIS doc |
| **Memory layer transitions** (promotion/demotion between Subconscious / Active / Ruminating / Long-term) | §4 of THIS doc |

### 7.2 What Cortex delegates

| Concern | Delegate |
|---|---|
| Vector retrieval | RRO (via RRD) |
| Encoder hot-update | RRD pause/resume |
| Token-by-token forward pass | The minion holding `chat.brain` (llama.cpp FFI dedicated worker thread) |
| External tool calls | MCP hive |
| Constrained decoding | llguidance, hooked into the sampler chain on the `chat.brain` minion (TODO — currently half-wired; see audit) |
| Persistence | libsql / SurrealDB / DuckDB / Moka per RRO §3 |

### 7.3 Cortex's two-direction interface

**Inbound (UI → Cortex):**
- User input enters via the engine facade (`systems/devpulse-engine/`).
- Cortex runs the rumination pipeline (CORTEX.md §1).
- Cortex calls RRO for retrieval, Minions for inference, MCP hive for tools.

**Outbound (Cortex → UI):**
- Every transition emits to `InternalEvent` broadcast bus AND `tracing` (project memory: dual observability is required).
- The Tauri bindings layer translates engine events into Svelte rune updates.
- Customer-facing strings flow through `kernel_terms.toml` engine→prod translation; never raw kernel vocabulary.

### 7.4 Governance — the permission gate around generation

Cortex applies **three governance passes** to every model output:

1. **Pre-flight (Fox):** Input rehab + intent classification before any minion sees the prompt.
2. **In-flight (llguidance):** Constrained decoding hooks gate the sampler chain on the `chat.brain` minion. Grammar-rejected tokens never reach the user.
3. **Post-flight (Council):** The 9-seat Council signs off on the assembled output. Single dissent surfaces to the operator before the output ships.

The audit log of every governance verdict lands in DuckDB (per RRO §3 backend matrix).

---

## 8. Integration map `[RATIFIED HERE]`

```
                                  ┌──────────────────────────────────────────┐
                                  │           USER (Tauri windows)           │
                                  └──────────────────┬───────────────────────┘
                                                     │ tauri::invoke / events
                                  ┌──────────────────▼───────────────────────┐
                                  │         systems/devpulse-engine          │
                                  │       (engine facade — public API)       │
                                  └──────────────────┬───────────────────────┘
                                                     │
                                  ┌──────────────────▼───────────────────────┐
                                  │                                          │
                                  │            ╔═══════════════╗             │
                                  │            ║    CORTEX     ║             │
                                  │            ║ (devpulse-clyffy)           │
                                  │            ╚═══════════════╝             │
                                  │            ┌───────┬───────┬─────────┐   │
                                  │            ▼       ▼       ▼         ▼   │
                                  │    ┌─────────┐ ┌─────┐ ┌────────┐ ┌────┐ │
                                  │    │Rumination│ │ RRO │ │Governance│ │MCP│ │
                                  │    │ Pipeline │ │ ──► │ │  (Fox + │ │Hive│ │
                                  │    │ (4-layer)│ │ RRD │ │llguidance│ │   │ │
                                  │    │          │ │ ──► │ │+Council)│ │   │ │
                                  │    └─────┬────┘ └──┬──┘ └────┬────┘ └─┬──┘ │
                                  │          │        │         │        │    │
                                  │          ▼        ▼         ▼        ▼    │
                                  │     ┌────────────────────────────────┐    │
                                  │     │       MINIONS (OS procs)       │    │
                                  │     │ chat.brain · vision · rag.enc  │    │
                                  │     │ governance.guard · consolidator│    │
                                  │     └────────────────────────────────┘    │
                                  │                    │                      │
                                  └────────────────────┼──────────────────────┘
                                                       │
       ┌───────────────────────────────────────────────┼───────────────────────────────────┐
       │                          MEMORY LAYERS (storage hierarchy)                        │
       │   ┌──────────┐   ┌──────────┐   ┌────────────┐   ┌──────────────────────────┐   │
       │   │Subconscious│ │ Active   │   │Ruminating  │   │     Long-term            │   │
       │   │(Qdrant)    │ │(KV cache,│   │(RRD-held   │   │(libsql · Surreal · Duck) │   │
       │   │            │ │ Moka)    │   │ tensors)   │   │                          │   │
       │   └──────────┘   └──────────┘   └────────────┘   └──────────────────────────┘   │
       └───────────────────────────────────────────────────────────────────────────────────┘
```

### 8.1 The seven edges that matter

| # | Edge | Description | Status |
|---|---|---|---|
| 1 | Engine → Cortex | Tauri command invokes Cortex via the engine facade | ✅ codified |
| 2 | Cortex → Rumination Pipeline | Send-layer dispatches forward pass | ✅ codified (CORTEX.md §1) |
| 3 | Rumination → RRO/RRD | Top-K retrieval injects into Active layer prefix | ⚠ partial — RRD wired; mid-generation injection not yet |
| 4 | Cortex → Minions | Spawn / drain / route requests | ⚠ partial — model-loader pool exists; minion = dedicated OS process model not yet codified in code |
| 5 | Cortex → MCP hive | Capability-routed external tool call | ❌ first definitional pass; no kernel module yet |
| 6 | Governance → Sampler | llguidance constrains sampler chain on `chat.brain` minion | ❌ stubbed — `GrammarHandle` exists; sampler integration missing (audit confirmed) |
| 7 | Memory layer promotions | Background layer promotes Ruminating → Long-term | ⚠ partial — checkpoint mechanism in CORTEX.md §4.4; auto-promotion not wired |

### 8.2 Hot-path data flow (a single Send-layer turn)

```
1. User keystroke              ──▶ Keystroke layer (50ms cap)
                                    │
2. Pause-layer pre-fill        ──▶  ├─ COSTAR+IC slot pre-fill from Long-term
                                    └─ RRO query → top-K → Active layer prefix
                                    │
3. Send layer fires            ──▶  ├─ chat.brain minion: forward pass
                                    │   │
                                    │   ├─ KV cache (Active layer)
                                    │   ├─ llguidance sampler hook (Governance)
                                    │   └─ Mid-generation retrieval injection (RRO)
                                    │
                                    ├─ Council post-flight sign-off
                                    │
                                    └─ Output streamed to UI
                                    │
4. Background layer (async)    ──▶  ├─ Embed turn into Subconscious
                                    ├─ If checkpoint due: consolidate Ruminating → Long-term
                                    └─ Refresh COSTAR+IC slot promotions
```

### 8.3 Implementation gates (what to build, in order)

The audit identified these as the keystone unlocks:

1. **llguidance ↔ llama.cpp sampler binding** — Sprint 03 V-15 in the project todo. Closes governance edge #6 and unlocks mid-generation injection (#3).
2. **Minion-as-OS-process supervisor** — refactor the model-loader pool into a process-per-role spawner. Closes edge #4.
3. **Memory layer promotion daemons** — wire Background layer to write Subconscious + Long-term. Closes edge #7.
4. **MCP hive** — kernel module + Cortex routing pass. Closes edge #5.
5. **Cuda<bf16> boot path** — construct `CortexBurnAdapter::<Cuda<bf16>>` and wire to the GPU-present probe. Independent slice; unblocks GPU-class deployments.

---

## 9. Vocabulary index

| Term | Defined in | Section |
|---|---|---|
| Clyffy | [PHILOSOPHY.md](PHILOSOPHY.md) | §1 |
| Minion | THIS doc `[RATIFIED HERE]` | §2 |
| MCP hive | THIS doc `[RATIFIED HERE]` | §3 |
| Subconscious / Active / Ruminating / Long-term | THIS doc `[RATIFIED HERE]` | §4 |
| RRD | [specs/cortex/rro/RRD.md](specs/cortex/rro/RRD.md) | §5 |
| RRO | [specs/cortex/rro/RRO.md](specs/cortex/rro/RRO.md) | §6 |
| Cortex | [CORTEX.md](CORTEX.md) + THIS doc §7 | §7 |
| RRO state members | [signals.registry.yaml](../../systems/devpulse-engine/ip/signals.registry.yaml) `rro` group | — |
| Kernel terms | [kernel_terms.toml](../../systems/devpulse-engine/ip/kernel_terms.toml) | — |
| Council (9 seats) | [PHILOSOPHY.md](PHILOSOPHY.md) + [RRO.md](specs/cortex/rro/RRO.md) §2 | — |
| Fox (input rehab) | [PHILOSOPHY.md](PHILOSOPHY.md) | — |
| Rumination layers (Keystroke/Pause/Send/Background) | [CORTEX.md §1](CORTEX.md) | — |

---

## 10. Drift checklist

When you change something in this document, verify:

- [ ] If you cited a `[CODIFIED]` source and the cite no longer matches, fix the cite OR fix the source — never let the two diverge silently.
- [ ] If you change a `[RATIFIED HERE]` definition, bump the version and add a changelog row.
- [ ] If a new concept lands that's load-bearing across two or more sections, it gets a `§n.x` entry — never inline-only.
- [ ] If an integration edge (§8.1) changes status, update the checkbox in the same PR.
- [ ] If a kernel term changes label translation, the change goes to `kernel_terms.toml` first, then `terminology.ts` regenerates.

## 11. Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-05-10 | Initial ratification. Sections 1, 5, 6 cite locked specs; sections 2, 3, 4, 7, 8 first ratification of Minions / MCP hive / four-layer memory model / Cortex outer-wrap / integration edges. |
