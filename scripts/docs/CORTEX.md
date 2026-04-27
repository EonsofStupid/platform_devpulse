# CORTEX: Rumination Pipeline, COSTAR+IC, RRO, Governance Graph

| Field | Value |
|-------|-------|
| **Status** | `LOCKED` |
| **Version** | `1.0.0` |
| **Last Updated** | `2026-04-27` |
| **Owner** | `@jesse` |
| **Part of** | DevPulse Platform |
| **Governed By** | `PHILOSOPHY.md` |

---

## Scope

This document specifies the four cognitive substrates that compose Clyffy's reasoning surface:

1. **Rumination pipeline** — the latency-budgeted layer ladder
2. **COSTAR+IC mechanics** — the prompt contract Clyffy assembles
3. **RRO state machine** — the lifecycle of context-readiness
4. **Governance graph** — the reasoning-tree workbench (operator-authored today, Clyffy-emitted later)

Each section either anchors to an existing SSOT or defines net-new contract. Where a SSOT exists, this doc cites; it does not redefine.

If this spec conflicts with `PHILOSOPHY.md`, this spec loses. If a sibling spec (`KERNEL.md`, `MODEL_STACK.md`, `RETRIEVAL.md`, etc.) conflicts with this spec on a cortex concern, the sibling loses for that concern only.

---

## Vocabulary Anchors

This document is a citation, not a redefinition, of the following SSOTs:

| Concept | SSOT | Note |
|---|---|---|
| RRO state members | `systems/devpulse-engine/ip/signals.registry.yaml` group `rro` | CI-enforced; never duplicated here |
| RRO layman narrations | `systems/devpulse-engine/ip/signals.narrations.yaml` `rro.state.*` | All UI strings flow from here |
| Rumination layer naming | `systems/devpulse-engine/ip/kernel_terms.toml` category `rumination` | Layer→layman translations |
| RRO runtime | `systems/devpulse-engine/src/platform/reasoning/rro_state.rs` | Implementation; this doc is the contract |

Drift between this doc and any SSOT above is a defect in this doc.

---

## 1. Rumination Pipeline

The pipeline is a four-layer latency ladder. `PHILOSOPHY.md` §"Two Layers Stop and Think" states the budget; this section states the contract that every layer must meet.

### 1.1 Layers

| Layer | Hard Budget | Job | Failure Mode |
|---|---|---|---|
| **Keystroke** | < 50ms | Tokenize input, classify intent, surface live state | Show stale state, NEVER block |
| **Pause** | < 500ms | Pre-fill COSTAR+IC slots, narrow context candidates | Drop low-confidence inferences silently |
| **Send** | 2-5s | Full rumination, governance-graph traversal, executor dispatch | Surface to user; the forward pass lives here |
| **Background** | minutes | Heavy analysis, learning loops, embedding refresh, KV-cache priming | Never user-blocking |

### 1.2 Layer Invariants

- Every layer owns a hard latency cap. Exceeding the cap is a regression, not a tunable.
- A layer MAY bail to its successor with partial work; it MUST NOT block past its cap.
- The **Send** layer is the only layer that owns the forward pass (`PHILOSOPHY.md` pillar #3 — "Rumination IS the generation loop").
- Every layer emits a transition into the RRO state machine (§3) for the live monitor and traces.

### 1.3 Layman Translation

Per `kernel_terms.toml` category `rumination`, customer-facing copy uses the engine/prod terms — never the kernel terms:

| Kernel | Engine / Prod (customer-facing) |
|---|---|
| rumination | thinking |
| rumination layer / send layer | thinking step / deep thinking |
| keystroke layer | quick read |
| pause layer | context check |
| background layer | background analysis |
| latency budget | response time |
| KV cache warmth | context ready |

---

## 2. COSTAR+IC Mechanics

Eight dimensions. Four of the six original COSTAR slots are inferable from session state — only **Objective** and **Constraints** reliably need user input. `PHILOSOPHY.md` §"COSTAR+IC" states the table; this section states the assembly contract.

### 2.1 Slot Sources

| Slot | Source of truth |
|---|---|
| C — Context | Guardian + Diary + Repo scan |
| O — Objective | User input (only reliably user-required slot) |
| S — Style | Repo patterns (project scan) |
| T — Tone | Psych × Teacher signals |
| A — Audience | Teacher + executor model-config |
| R — Response | Task-type default (BUILD / FIX / EXPLORE / PLAN / EXPLAIN) |
| I — Instruction | Fox-compiled, executor-specific frame |
| C — Constraints | Hardware profile + scope + anti-drift guards |

### 2.2 Slot Auto-Promotion

After **3 accepted inferences at confidence > 0.8** for a given (user × project × slot) triple, the inferred answer becomes the templated default. Future Send layers consume the template without re-inferring. The promotion is reversible — one explicit override demotes the template back to inference.

### 2.3 Slot Conflict Resolution

Authority order, highest first:

1. User-provided value (this turn)
2. Per-session lock
3. Per-project override
4. Per-user override
5. Inferred value (this turn)
6. Static default

A locked slot at Send time blocks rumination. The block surfaces in the devtool with the depth narration from `signals.narrations.yaml` so the operator sees *why* without reading code.

---

## 3. RRO State Machine

### 3.1 Members (canonical)

Per `signals.registry.yaml` group `rro`. This doc cites; it never redefines:

`idle` · `gathering` · `processing` · `ruminating` · `ready` · `purged` · `forked`

### 3.2 Transition Contract

Every transition carries:

- `from: Option<RroState>` — `None` only at boot
- `to: RroState`
- `reason: String` — free-form, traceable, surfaced in the devtool history
- `at_ms: u64` — wall-clock ms since UNIX epoch
- `proximity: f32 ∈ [0.0, 1.0]` — friction diagnostic (§3.4)

Transitions emit `platform:rro-state-changed` to subscribed Tauri windows. Transition history is retained in a 256-entry in-memory ring (`TRANSITION_HISTORY_CAP` in `rro_state.rs`); future kernel work promotes this to a DuckDB-backed stream without changing the handle's API.

### 3.3 Depth (canonical)

Per registry: `shallow` (fast path) · `normal` (standard) · `deep` (extended). Depth is operator-controlled at the devtool surface and feeds the Send layer's internal latency-budget allocator. Depth selection is per-session, with operator override surviving a session restart only when explicitly persisted.

### 3.4 Proximity Diagnostic

| Value | Meaning | Send-layer behaviour |
|---|---|---|
| 0.0 | Comfortably safe — no friction predicted | Normal flow |
| 0.5 | Neutral (default at boot, `DEFAULT_PROXIMITY`) | Normal flow |
| > 0.7 | Approaching friction (staleness, contradiction, cost-cliff) | SHOULD throttle; SHOULD warn the operator |
| 1.0 sustained | At friction | MUST checkpoint — see §4.4 |

Proximity is updated by diagnostics that observe context staleness, evidence contradiction, and projected token cost against the current budget.

---

## 4. Governance Graph

The reasoning-tree workbench. Operator-authored today; Clyffy emits trees as a side-effect of his own reasoning in a later phase (the dream).

### 4.1 Data Model

Surreal is the SSOT for the governance graph. Trees live in the project's namespace under the existing per-project Surreal scope:

```surrealql
DEFINE TABLE thought SCHEMAFULL;
DEFINE FIELD content    ON thought TYPE string;
DEFINE FIELD rro_state  ON thought TYPE string;   -- mirror of RRO members (§3.1)
DEFINE FIELD depth      ON thought TYPE int;     -- 1-based, capped per §4.3
DEFINE FIELD proximity  ON thought TYPE float;   -- frozen at thought-creation time
DEFINE FIELD branch_id  ON thought TYPE string;
DEFINE FIELD checkpoint ON thought TYPE option<record<thought>>;  -- set => this is a consolidation
DEFINE FIELD created_at ON thought TYPE datetime;

DEFINE TABLE leads_to   TYPE RELATION FROM thought TO thought;
DEFINE TABLE refines    TYPE RELATION FROM thought TO thought;
DEFINE TABLE summarizes TYPE RELATION FROM thought TO thought;
```

### 4.2 Edge Types

| Edge | Direction | Cycles allowed | Purpose |
|---|---|---|---|
| `leads_to` | one-way | NO | Forward reasoning step |
| `refines` | bidirectional semantically | YES | Mutual refinement between two thoughts |
| `summarizes` | one-way | NO | Consolidation pointer; tail = summary, head = subtree root |

The three built-in edge types ship together. Custom edge types load via a plugin registry; the plugin loader is the **last** phase of the workbench rollout — three built-in types ship first to prove the foundation.

### 4.3 Working Memory Cap

Branch depth is bounded by an architectural ceiling, not a tunable.

| Depth | UI signal | Engine behaviour |
|---|---|---|
| 1 - 8 | Normal flow | No restrictions |
| 9 - 12 | Warning halo on frontier nodes | Suggest checkpoint |
| 13 | Banner: "approaching consolidation" | Surface checkpoint button |
| 14 | **Hard block** — branch cannot extend | Refuse new `leads_to` until checkpoint fires |

The cap of 14 is **not operator-tunable**. 14 is the architectural ceiling — Miller's 7±2 extended by note-offload, beyond which downstream reasoning starts confabulating regardless of model size.

### 4.4 Checkpoint Mechanism

When a checkpoint fires (operator-triggered or automatic at depth 14):

1. The **configurable consolidator** summarizes the current frontier into one dense paragraph that captures conclusions and open questions.
2. A new `thought` row is created with `rro_state = "ready"`, `content = <summary>`, and `checkpoint` pointing at the root of the subtree being consolidated.
3. The collapsed subtree fades to 30% opacity in the UI; the summary node renders bright with a "consolidated from N" badge.
4. The branch may extend from the summary; the new branch's depth resets to 1 + summary.

**Default consolidator:** the shared 5-7B STS / minion model already loaded for short-turn dialogue. This is **configurable** — a project may swap to a heavier model at the cost of latency and VRAM.

The operator may:
- Force a checkpoint at any depth.
- Reject Clyffy's summary, edit it in place, and regenerate.
- Expand a consolidated subtree to inspect what was rolled up.
- Configure the consolidation prompt per project template.

### 4.5 Scope (per-project default)

Reasoning trees are **scoped per project by default**. Cross-project references require an explicit `@<project>` mention in the thought's content; the referenced project must already exist in the Surreal namespace registry. Implicit cross-project bleed is forbidden — silent drift across project boundaries poisons the consolidator's summaries.

### 4.6 Authoring Source

| Phase | Source |
|---|---|
| **v1 (now)** | Operator-authored via the devtool. Baseline. |
| **v2 (the dream)** | Clyffy emits trees as a side-effect of his own reasoning. Each user message → new branch in the active project. Operator can curate, fork, or purge. |

v2 reuses the v1 data model unchanged. The v1 devtool surface is the v2 authoring surface — they share the same code path.

---

## 5. Devtool Architecture

### 5.1 Route

The reasoning-tree workbench mounts at **`/devtools/cortex/`**, replacing the current "Planned — not yet shipped" placeholder. The Live RRO monitor stays at `/devtools/rro/state` (already shipped) and is linked from the cortex shell rather than duplicated.

### 5.2 Tabs

| Tab | Stack | Purpose |
|---|---|---|
| **Tree (2D)** | Svelte Flow (`@xyflow/svelte`) | Authoring surface — drag-to-create, edge variants, snap-to-grid, mini-map |
| **Graph (3D)** | Threlte + 3d-force-graph | Force-directed view for dense fan-outs (>30 nodes) |
| **Templates** | Wizard | Common reasoning patterns (troubleshoot / decide / explore / post-mortem) |
| **History** | Saved trees | JSON import/export, replayable step-by-step |
| **Logs** | Scoped log tail | `cortex.*` prefix via `query_scoped_log` |
| **Debug** | Step-through | Pause-on-transition, override depth/proximity, inspector |

The Tab toggle between 2D and 3D preserves selection — same node/edge data, different visualizer.

### 5.3 Domain Layout

`interfaces/desktop/src/lib/domains/sys/cortex/` — Nx library types per `Desktop.md` §1.1.1:

```
sys/cortex/
├─ data-access/   # rune state, Tauri IPC services, consolidator client
├─ feature/       # CortexDevtool.svelte + tab panels
├─ ui/            # ThoughtNode, edge variants, halo gauges
├─ util/          # types, formatters, narrations, capability manifest
└─ index.ts       # public barrel
```

### 5.4 Engine Surface

The cortex devtool talks to the engine through `platform.cortex()` — a façade that wraps the kernel's reasoning module and the Surreal graph store. The kernel can swap any consolidation algorithm or graph backend without devtool churn. Tauri command names follow the bare-product convention: `cortex_thought_create`, `cortex_thought_link`, `cortex_thought_load_branch`, `cortex_thought_consolidate`.

### 5.5 Layman Affordances

The devtool is layman-friendly **without being dumbed down**:

- Hover a node → tooltip explains the RRO state in plain language (sourced from `signals.narrations.yaml`).
- Hover an edge → shows direction + relationship in plain language.
- Color = RRO state (gathering=teal, processing=blue, ruminating=violet, ready=green, purged=red, forked=gold).
- Halo intensity = proximity to friction.
- "Why is this paused?" banner when checkpoint fires, with the consolidation reason.
- Undo/redo on every action; auto-save every transition.

Power affordances stay accessible:

- Keyboard shortcuts for drag-free authoring.
- Raw SurrealQL pane behind a "Power user" toggle.
- Custom node types via Svelte component plugin.
- Subgraph extraction → save as reusable template.

---

## 6. Open Questions (deferred — not blocking v1)

- Multi-operator collaborative authoring (out of scope for v1).
- Webhook on checkpoint fire (planned, not specified here).
- Real-time tree sharing across DevPulse instances over WiredFront P2P (planned, sibling spec `CHANNELS.md`).
- Differential consolidation (only re-summarize the changed subtree) — performance optimization, deferred until profiling shows the need.

---

## 7. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-27 | Initial spec. Rumination pipeline cites `PHILOSOPHY.md` §"Two Layers Stop and Think". RRO contract cites `signals.registry.yaml` group `rro` and `rro_state.rs`. Governance graph 9-14 cap, three built-in edge types, per-project default scope, configurable consolidator (default 5-7B STS/minion), and operator-baseline authoring all ratified by `@jesse` on 2026-04-27. |

---

*Governed by `PHILOSOPHY.md`. When this spec conflicts with `PHILOSOPHY.md`, this spec loses.*
