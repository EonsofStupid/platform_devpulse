# Clyffy's connectome — Cognitive Foundation

- **Status:** CURRENT — v2.0.0 (2026-06-28 rearchitecture).
- **Supersedes:** v1.0.0 (2026-05-20) *for this phase* — its three-repo / Clyffy.ai-cloud-fork / TrueFoundry pieces are deferred to later phases, not retired (v1.0.0 content is in git history).
- **Owner:** @jesse.
- **Governed by:** the 2026-06-27 architecture corrections (`architecture-corrections-2026-06-27.md`), top-5 rules, `systems/devpulse-engine/ip/kernel_terms.toml`.
- **Scope:** DevPulse (frontend) ↔ headless ClyffyOS (on GB10).

> **Working assumptions flagged for owner correction** (chosen 2026-06-28, approach B = full rewrite). Veto either and this doc follows:
>
> 1. **connectome naming** — the intelligence system "connectome" and the existing `connectome` skill-dispatcher agent are treated as ONE concept (the agent is an entry point into the connectome). Code/agent disambiguation, if any, is a Phase-2 concern.
> 2. **control vs intelligence layer split** — the subsystem assignment in §2 is PROPOSED.

This is the single source of truth for Clyffy's connectome under the current
architecture. Subsequent plans, agent rules, and memory entries resolve against
the definitions here; sequencing is owned by the ClyffyOS extraction plan (§6).

---

## 1. Architecture — two sides, one wire

DevPulse is the **frontend**; ClyffyOS is the **headless backend**. They are
separate builds (separate repos after the extraction) that connect over a wire.

**What runs where (deployment split, owner-set 2026-06-28):**

- **DevPulse (local devstation)** — all the visuals / UI, plus **Turso** (local
  relational SSOT) + DuckDB (local analytics). Loads **fully standalone**.
- **GB10 (ClyffyOS, headless)** — **SurrealDB** (graph + bi-temporal facts),
  **qortex** (the Qdrant-based vector store), and the retrieval model stack
  (**encoder · embedder · reranker**), plus the rest of the connectome and all
  inference.

**DevPulse** (this repo, `interfaces/desktop/`):

- Tauri 2 + Svelte 5 UI shell, ColdLight design system, devtools, data collection.
- Boots **methodically and fully standalone regardless of connection**, powered
  by its OWN local **Turso** DB (replaces libSQL) + DuckDB for local analytics.
- Stats and every display surface render on local data with no backend reachable.
- Connecting Clyffy is **additive, never a boot prerequisite**.
- No inference, no kernel, no hardcoded endpoint — it discovers Clyffy and reads
  the current ceiling off the wire.

**ClyffyOS** (extracted headless repo, runs on **GB10** / networked VRAM pool):

- A `clyffyd` server binary embedding the ClyffyOS crates (connectome ·
  model-loader · rrd) + persona-mcp.
- Owns ALL inference and the connectome (§2).
- Advertises itself via Bonjour (`_clyffy._tcp.local.`) and exposes the wire
  contract (§4).

**Transports:** local direct (same machine) → WiFi / Ethernet → USB-C 20 Gbps.

**The cut landed (2026-07-08).** The AI crates left this repo via the
`/clean-extract` workflow (branch `refactor/kernel-severance`); they live at
`github.com/EonsofStupid/clyffyos` as clyffyos-connectome / clyffyos-model-loader
/ clyffyos-rrd (+ clyffyos-persona-mcp). DevPulse keeps the engine, the desktop,
and the `devpulse-gb10-client` wire — the engine is the seam, as designed.

---

## 2. connectome — control + intelligence layers

"connectome" replaces "cortex" (too restricting). It is the umbrella over
everything that produces, stores, recalls, and consumes memory, facts, and
reasoning on Clyffy's behalf, and it runs **headless on GB10**. Two layers.

### Control layer (PROPOSED assignment)

Orchestration · lifecycle · routing · governance.

- **RRD — Reason Ready Daemon** (`clyffyos-rrd`) — the conductor: five-state
  lifecycle (Loading / Running / Paused / Updating / Failed), `PauseHandle`,
  `HotUpdateable` / `HotSwap`. Extend, never reauthor.
- **Orchestrator / router** — the always-loaded supervisor that dispatches to
  workers; constrained tool-calls via llguidance.
- **Capability self-model** — Clyffy knows its own max capabilities and keeps
  baselines as they grow. **Computed** from runtime (hardware / loaded models /
  backends), **advertised over `/v1/capability`**, never hardcoded. This is how
  DevPulse and Clyffy share one source of truth for the current ceiling.
- **Governance / guardrails** — policy over every input.

### Intelligence layer (PROPOSED assignment)

Memory · deep reasoning · reasoning artifacts · operator context.

- **Memory + retrieval subsystem** — bi-temporal **SurrealDB** (persona graph +
  facts) + **qortex** (vector store, formerly Qdrant), plus the
  **encoder · embedder · reranker** retrieval stack. All GB10-resident.
- **Deep reasoning** — the large-model consumption layer; activates on
  pre-sorted content, never on the raw stream.
- **RRO — Reason Ready Objects** — typed, grammar-conformant artifacts emitted
  via constrained decoding (llguidance). RRO is the *artifact*, not the
  orchestrator; `rkyv`-archivable for zero-copy reads.
- **Operator deep-context** — for final build plans / deep research, Clyffy
  carries deep operator context and, after internal deliberation (Councils +
  deep-research fan-out), acts AS the operator.

**Model size does not matter to this architecture: 8GB LLM floor, scales up.**
Specific model picks are **GB10-side configuration**, not architecture, and
nothing is hardcoded — paths/ids/dims/hosts flow from SSOT/config.

---

## 3. Identity

- **Clyffy** — one persona + orchestrator identity across every surface. There
  is no `clyffy_dean`. Persona persists in SurrealDB namespaces.
- **Minion** — a fast classification / pre-sort / background-worker role that
  runs on GB10. Deprioritized: not the architecture's focus, and not size-locked.

---

## 4. Wire contract (DevPulse ↔ ClyffyOS)

- **Discovery** — `clyffyd` broadcasts `_clyffy._tcp.local.` (Bonjour / mDNS);
  DevPulse discovers it. No hardcoded host or port.
- **`/v1/capability`** — ClyffyOS advertises its current ceiling (loaded models,
  backends, vision / voice availability) so DevPulse renders capability that is
  COMPUTED, never toggled.
- **Auth / idempotency / error envelope** — carried over from v1.0.0: OAuth
  bearer subject = Clyffy user id; every write verb takes an `idempotency_key`
  (24h dedup); JSON-RPC error envelope with a `kind` taxonomy
  (`auth|not_found|invalid_arg|rate_limit|backend|conflict`) + `trace_id`.

**MCP verb surface** (still valid; `cortex.*` → `connectome.*`):

- `persona.*` — identity + core memory blocks: `load`, `save`, `recall`, `list`.
- `connectome.*` — recall + thought emission: `thought_emit` (drives
  llguidance-constrained decoding, returns an RRO id), `thought_read` (returns
  archive bytes for local `rkyv` zero-copy access).
- `rrd.*` — lifecycle + facts: `episode_ingest` (always async),
  `fact_query` (bi-temporal, `valid_at` aware), `fact_invalidate` (never
  deletes — sets `t_invalid` + writes a contradiction edge), `lifecycle`,
  `pause`, `resume`.

---

## 5. Data + still-valid patterns

Embedded DBs are pulled / built **methodically and separately, only on a new
build**, released separately if customized (`[build.deps.*]` SSOT, no hardcoded
paths):

- **DevPulse-local** — Turso (relational SSOT) + DuckDB (analytics).
- **ClyffyOS / connectome on GB10** — SurrealDB (graph + bi-temporal facts) +
  qortex (vectors), working in harmony.

Patterns carried over UNCHANGED from v1.0.0 (architecture-independent, still
correct):

- **Bi-temporal facts** — never delete; a contradiction closes the old edge
  (`t_invalid = now`) and inserts a new one (`t_valid = now`). Both stay
  queryable; `valid_at` returns the edge valid at that instant.
- **Memory dedup cosine floor** — `> 0.85` force LLM-judge, `< 0.6` direct ADD,
  between → LLM-judged merge. Fixes Mem0-class junk at the schema level.
- **Retrieval** — three primitives (cosine, BM25, graph BFS) fused via
  Reciprocal Rank Fusion.
- **Context assembly** — prefix-cacheable static block (identity → tools →
  persona → skills) above the dynamic tail (memories → recent → turn); never let
  the tail eat the prefix.
- **Memory writes** — always async / background, off the agent hot path.

---

## 6. Build sequence

Sequencing is owned by `clyffyos-extraction-first` plus
`architecture-corrections-2026-06-27.md`, executed via `/clean-extract`:

1. ~~Finish the 2026-06-27 memory + build-spec re-baseline.~~ **DONE.**
2. ~~`/clean-extract` — phased extraction of the AI crates + persona-mcp into
   the headless ClyffyOS repo.~~ **DONE 2026-07-08** (kernel cut, branch
   `refactor/kernel-severance`). The `clyffyd` server binary (Bonjour
   discovery + `/v1/capability` + the verb surface in §4) is ClyffyOS's
   next build — it does not exist yet.
3. DevPulse-side `systems/devpulse-gb10-client` (the wire client) + standalone
   Turso boot — **SHIPPED**: DevPulse boots standalone, the endpoint wizard +
   persisted decided gate + capability-computed surfaces landed; runtime
   connect e2e awaits `clyffyd`.

---

## Out of scope for this phase (deferred, not retired)

These v1.0.0 pieces are simply **not part of this phase** — deferred to later
phases, not killed:

- Online master via a Clyffy.ai cloud fork · TrueFoundry hosted serving ·
  cloud-hosted Deep Reasoning.
- The owned-tooling cloud services (Helicone / Braintrust / Authentik) — revisit
  when their phase comes.
- The v1.0.0 8-slice plan — re-sequenced under the ClyffyOS extraction.

Genuinely replaced this phase (owner-directed renames / engine swaps):
"Cortex" → connectome · Qdrant → qortex · libSQL → Turso · model picks treated
as architecture → GB10-side config.
