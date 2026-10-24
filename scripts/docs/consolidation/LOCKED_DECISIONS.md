# Locked Decisions — Master Reference

| Field | Value |
|-------|-------|
| Status | LIVING — append-only as decisions land; corrections re-write the row |
| Version | 0.1.0 |
| Last Updated | 2026-05-13 |
| Owner | @jesse |
| Source of truth | This document supersedes any older spec drafts on the same topic |
| Companion docs | `AUDIT_EXISTING.md`, `ARCHITECTURE.md` (bridge), `PROMPT_PROGRAMS_SPEC.md`, `PLAN_GRAPH_SPEC.md`, `RECIPE_TASK_INTEGRATION.md` |

> **Why this doc exists.** Architecture decisions were landing across multiple sessions
> and being lost between chats. This is the single-source-of-truth ledger. Every
> lock is dated and attributed. Drift from this doc by other specs = the other spec
> is wrong, not this one. Update HERE first.

---

## Section A — SurrealDB topology

| Lock | Value | Date |
|------|-------|------|
| A-1 | **One master KV cloud instance.** Not per-project, not shared-namespaced cluster. | 2026-05-13 |
| A-2 | **Dispersed nodes connect to the master.** Each node (per-project / per-device / per-Minion) is a sync client of the master. | 2026-05-13 |
| A-3 | **Two sync modes available:** **full sync** (everything mirrors) and **namespace sync** (selective per-node). | 2026-05-13 |
| A-4 | **Namespace sync is what makes specialists true specialists.** A vision Minion''s node only syncs the `vision` namespace, so it stays uncluttered. | 2026-05-13 |
| A-5 | ~~SurrealDB is composed in, not forked.~~ **Superseded by the owner:** he wants to fork and own Surreal ("I want to fork and start owning surreal", April), approved as RRFlow 2026-10-01; until RRFlow replaces it, Surreal is upstream's built binary in a supervised subprocess, never compiled in (plan 0007 decision 6, 2026-10-24). | 2026-05-13, superseded 2026-10-24 |

## Section B — md ↔ DB sync

| Lock | Value | Date |
|------|-------|------|
| B-1 | **One-way DB → md.** System is the source of truth. md files are read-only mirrors for the user. | 2026-05-13 |
| B-2 | **No two-way reconciliation v1.** User-owned scratch files may get two-way later, deferred. | 2026-05-13 |

## Section C — Process model (Clyffy vs Minion)

| Lock | Value | Date |
|------|-------|------|
| C-1 | **Clyffy = orchestrator with SOME inline specialist capabilities.** A few of Clyffy''s competences run in-process for low latency. | 2026-05-13 |
| C-2 | **Every Minion = a designated SEPARATE PROCESS.** No exceptions. Process-level isolation is the lock. | 2026-05-13 |
| C-3 | **A2A protocol governs Clyffy ↔ Minion communication.** Network-style typed handoff even when on the same machine. | 2026-05-13 |
| C-4 | **Naming axis distinction:** "Council seat" = the role (Vision, Translator, Diary, etc.). "Minion" = the process implementation of a Council seat. Two axes, not synonyms. **PENDING CONFIRMATION** — Jesse to confirm wording. | 2026-05-13 |

## Section D — Council roster (9 seats)

> **PENDING — Jesse to confirm complete roster.** What I have from THIS conversation,
> dates, and prior memory. Marked with `?` where uncertain.

| # | Seat | Animal / Persona | Role | Confidence |
|---|------|------------------|------|-----------|
| 1 | Conductor | **Clyffy** (cow) | Supervisor / orchestrator with inline specialist capabilities | HIGH |
| 2 | Vision | **Siggy** the Johnny Crane | Eyes-out while Clyffy focuses. Process monitor, true pixel interpretation, **SigLIP-HD optimised** | HIGH |
| 3 | Translator | **Fox** | Prompt Programs owner. Bilingual intermediary (human ↔ AI). 6-stage rehab pipeline. NOT a censor. | HIGH |
| 4 | Diary | **Fleece** the sheep | Writes journal *while* working on the task at hand, not after | HIGH |
| 5 | Warden | **Warden** the badger | Backseat driver. Pivots Clyffy to plan mode, writes memories, slows things down, prevents rushing. **PENDING — confirm "Warden" is the name vs the role.** | MED |
| 6 | OverMind teacher | **Quincy** the pig | Dynamic popups + callouts for passively teaching the user | HIGH |
| 7 | Hardware specialist | **Rusty** the goat | One of the goat twins. Per prior memory: hardware (soldering, schematics, multimeter, tool vest) | HIGH (per prior memory) |
| 8 | Software specialist | **Pip** the goat | Other goat twin. Per prior memory: software (codebases, algorithms, VR, embedded LEDs) | HIGH (per prior memory) |
| 9 | **PENDING** | **PENDING** | Per prior memory blob there were also: Llama (Researcher), Mini Pony (Psych). One slot unaccounted for. Jesse to confirm. | LOW |

**Naming corrections to capture:**
- "Meistro" / "MAESTRO" / "Gus" are dead names. Clyffy is the orchestrator. | DATE: confirmed prior + reinforced this conversation
- "Scribe" was the prior name; renamed to **Translator**. Output compiler / wire-level prompt emitter. | DATE: confirmed prior
- "Fox" handles input rehab (the 6-stage pipeline) and owns Prompt Programs. Distinct from Translator (output) — they are different seats. | DATE: this conversation
- "Eight Minions" naming is dead. Council = 9 seats. **Minion** is alive as the process-model term (a Council seat that runs as its own process). | DATE: this conversation

## Section E — Build order

| Lock | Value | Date |
|------|-------|------|
| E-1 | **Slowly, one specialist at a time.** Build Minion N fully (process + estate + Programs + agent-card + memory blocks + analytics) BEFORE starting Minion N+1''s spec. | 2026-05-13 |
| E-2 | **PENDING — which Minion ships first?** Jesse to pick. | 2026-05-13 |

## Section F — Chat distillation (real subsystem, not a parking item)

| Lock | Value | Date |
|------|-------|------|
| F-1 | **Continuous trajectory capture is a real subsystem, locked.** While Jesse chats, raw chat content dumps to raw tables in the intelligence layer. | 2026-05-13 |
| F-2 | **Cortex distills raw chat → decisions, discussion, parking items.** When Jesse and Claude make decisions in chat, the Cortex extracts them in case Claude failed to capture faithfully. | 2026-05-13 |
| F-3 | **Markable events get auto-tagged in the trajectory.** Examples Jesse named: "X process ran for Y," "ram spiked," "user got frustrated," "major milestone reached." | 2026-05-13 |
| F-4 | **This is its own spec.** Working title: `CHAT_DISTILLATION_SPEC.md`. Slots into the Clyffy Mesh spec pack as #6. | 2026-05-13 |

## Section G — Three hypotheses (eval framework)

These three must be measurable. They become the eval contract for the whole mesh.

### Hypothesis 1 — Context preservation
**Claim:** Two specialists with full domain context outperform one generalist with compressed cross-domain context on tasks crossing those domains.
**Measure:** task success rate × token cost × latency on a held-out benchmark of cross-domain tasks.
**Tools:** VeriLA (verifier framework) + promptfoo (harness).

### Hypothesis 2 — Handoff fidelity
**Claim:** Typed A2A handoffs preserve more context than free-text handoffs.
**Measure:** answer quality with structured AgentCard handoff vs unstructured conversational pass-through on the same task.

### Hypothesis 3 — KV-cache reuse benefit
**Claim:** Cached CARRO objects reduce TTFT and token spend without quality loss.
**Measure:** A/B with LMCache on/off across realistic Clyffy workloads.

All three locked as the test framework for the mesh. Spec `CLYFFY_MESH_ANALYTICS_SPEC.md` (#5 in pack) operationalizes them.

## Section H — Industry-locked terminology

| Draft term | Locked industry name | Lock date |
|-----------|---------------------|-----------|
| Clyffy_Dean | **Supervisor Clyffy** (LangGraph supervisor pattern) | 2026-05-13 |
| Domain-master Clyffy | **Specialist Clyffy** or **Domain Clyffy** | 2026-05-13 |
| Their own nuclear MCP | **Specialist MCP Estate** (aligns to SEP-2076 Skills) | 2026-05-13 |
| md ↔ SurrealDB auto-sync | **CDC bridge + SurrealFS** | 2026-05-13 |
| COSTAR-maxed Clyffy ↔ Clyffy Q&A | **A2A protocol** (Google open standard, April 2025) | 2026-05-13 |
| Internal Clyffy node network | **Clyffy mesh** | 2026-05-13 |
| Reason-ready objects with cache hints | **CARRO** (Cache-aware Reason-Ready Objects) | 2026-05-13 |
| HMM/fabric scheduling | **Tiered inference fabric** (NVIDIA Dynamo term) | 2026-05-13 |

## Section I — Existing locked architecture (carry-forward, not modified)

These were locked PRIOR to this conversation and remain unchanged. Captured here for the record.

| Concern | Lock |
|---------|------|
| Council = 9 seats | LOCKED (per prior memory + this conversation) |
| Prompt Programs spec | EXISTS at `/scripts/docs/specs/programs/PROMPT_PROGRAMS_SPEC.md` — each Specialist owns its Programs registry |
| Plan Graph spec | EXISTS at `/scripts/docs/specs/tasks/PLAN_GRAPH_SPEC.md` — Supervisor owns the Plan Graph; AgentPlan tasks are the cross-Minion DAG |
| Plan Graph executor variant | `Executor::SpecialistClyffy(clyffy_id)` — Supervisor delegates via A2A |
| Memory Blocks | Become derived views over SurrealDB. Live queries push updates to any Clyffy holding that block in context. |
| Persistence layer DAL | Turso (OLTP; owner 2026-07-01 "actually turso not libsql"), DuckDB (OLAP), SurrealDB (agent-memory + graph-context, a supervised subprocess). All three coexist, none replaced. |
| Bridge resilience | Tower::Service stack — Bulkhead > Circuit > Retry > Timeout > backend. Spec drafted; code not yet rebuilt. |
| Rumination | The product, the default mode |
| RRO | Multi-layer reasoning substrate — not a database. Subconscious/Immediate (sub-100ms) + Deep (escalation). |
| Storage stack | Turso SSOT (owner 2026-07-01; was libSQL) + 5 categories: vectors (Qdrant fork), relational (Turso), graph (SurrealDB, a supervised subprocess), analytics (DuckDB), hot cache (Moka 4 instances). |
| Serialization | rkyv 0.8.15 internal MCP / JSON+YAML for LLM / JSON-RPC perimeter. |
| Model stack | Phi-4-multimodal-5.6B chat.brain + Qwen3-0.6B minion.shared + custom 0.5B encoder + BGE-Reranker-Base. PARKED items: Kokoro dropped, Whisper dropped, SigLIP2 dropped — SigLIP-HD is the vision lock per Siggy''s seat. **NOTE — verify against MODEL_STACK.md; this is a domain where I''ve drifted before.** |
| MCP role | DevPulse is bidirectional (SERVER + CLIENT). rmcp Rust SDK both ways. |

## Section J — Open parking lot (PENDING decisions)

| # | Item | Why parked |
|---|------|------------|
| J-1 | The 9th Council seat name | Roster incomplete in §D |
| J-2 | "Warden" — name or role? | §D row 5 |
| J-3 | "Council seat" vs "Minion" terminology — confirm exact phrasing | §C-4 |
| J-4 | Which Minion ships first? | §E-2 |
| J-5 | The Anthropic wedge product (Chrome ext + VS Code ext + MCP server prefiltering every Claude prompt through Fox + Translator) | Mentioned in prior memory; not re-confirmed this session |
| J-6 | Fox training pipeline (T1 0.6B / T2 1.7B / T3 4B) | Locked in prior memory; verify still active |
| J-7 | Companion phone app + enterprise white-label | Mentioned as future scope earlier this conversation |
| J-8 | LMCache integration timing | Spec #4 covers it but no implementation date locked |
| J-9 | SurrealDB master cloud — own infra or managed? | Topology locked; hosting model not |
| J-10 | Premium / starter package tiers for the RRD daemon distribution | Mentioned in passing earlier this conversation |

## Section K — Self-correction protocol

When this doc and any other spec disagree:
1. **This doc wins by default** for architectural decisions.
2. **Other spec wins** if it post-dates this doc''s row AND has Jesse''s explicit lock note.
3. **Either way, sync the loser to match.** Don''t leave drift sitting.

When Jesse corrects a decision in chat:
1. **Update this doc FIRST** in the next response.
2. **Then** continue the work.
3. **Never** make Jesse repeat the same correction twice.

---

*End of locked decisions. Next move: Jesse fills the PENDING rows; audit resumes; specs proceed.*
