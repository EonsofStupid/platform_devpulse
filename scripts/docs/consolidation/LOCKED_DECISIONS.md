> Restoration note ? 2026-11-02: This document preserves historical authored
> material. Current owner direction in CLAUDE.md and plan 0009 takes precedence:
> the kernel is included and visible; AI connections are configurable endpoints;
> local runtimes are supervised processes; Council belongs in Chat and AgentHub
> is the AI ticket factory under Overmind. Old fixed model choices, embedded
> runtimes, storage versions and hidden-kernel proposals are historical, not
> current implementation instructions. Source bytes and newer revisions are
> retained below; see docs/restoration/snapshot-documents.json for provenance.

﻿# Locked Decisions — Master Reference

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


---

## Full historical source from the October 6 snapshot

﻿# Locked Decisions — Compiled From Conversation


| Field | Value |
|-------|-------|
| Compiled | 2026-05-08 |
| Purpose | Single sourced list of every locked decision from owner. To be referenced when writing the revised spec. |
| Rule | Capture-only. NO new architecture. NO opinions. Owner words preserved. |

---

## A. RRO Foundation Locks

**A-1. RRO scope**
RRO is the WHOLE multi-layer reasoning system. Not just encoder + Qdrant. Includes encoder, embedder, reranker, Qdrant fork, HMM, CAG, RAG, RKYV, ReasoningObject, mode switching, decision engine, all backends.

**A-2. Workspace topology**
Single repo, single workspace. RRO crates as workspace members at kernel/rro-*. Path dep during dev. Independently publishable to crates.io for rroflow.ai customers. NOT separate repo. NOT git submodule. NOT crates.io-only.

**A-3. Encoder framework**
**Burn** locked. Scoped to encoder layer only. NOT Candle for the encoder path specifically. LLM inference (chat.brain) stays Candle / mistral.rs / llama.cpp FFI per slot.

**A-4. Encoder model**
- Bootstrap: ~270MB encoder OR 0.5B Burn-baked custom
- Long-term: custom 0.5B optimized model owner is baking
- Same Embedder trait interface, ArcSwap hot reload

**A-5. Encoder availability**
Encoder must work with: llama.cpp, RRO itself, vLLM. Encoder is a SERVICE callable from outside RRO, not just an internal component.

**A-6. RRO is not a database**
"RRO is not a database. RRO is a reasoning substrate." (verbatim spec)

**A-7. RRO layers (owner direct framing)**
- Layer 1: SUBCONSCIOUS / IMMEDIATE (hot path, sub-100ms, always-on reflex)
- Layer 2: ONCE IT FINALLY THINKS (deep reasoning, escalation when Layer 1 isn't enough)
- AI Resources: called by Layer 2 when reasoning needs muscle (local Clyffy+minions, subscription Claude/ChatGPT/Gemini, API keys Groq/Grok/OpenRouter/Anthropic/etc.)

---

## B. Architecture Boundaries

**B-1. RRO vs Cortex (the umbrella)**
- RRO is the substrate
- Cortex (DevPulse cognition) runs ON TOP of RRO
- Cortex calls RRO. RRO does not call Cortex.

**B-2. What lives in RRO**
Encoder, embedder, reranker, Qdrant fork, HMM, CAG, RAG, RKYV, ReasoningObject, modes, decision engine, all backends.

**B-3. What lives in Cortex (NOT in RRO)**
Rumination engine (4-layer keystroke/pause/send/background), COSTAR+IC assembly, Council orchestration (9 seats), Fox pipeline (input rehab), kernel state machine (8 states, event bus, scheduler), sub-agent (minion) coordination, Scribe, ROTI metrics.

**B-4. Clyffy / Cortex umbrella structure**
`
CLYFFY / CORTEX (umbrella, modular)
├── EYES — SigLIP-HD optional vision encoder when richer pipeline needed
├── BRAIN (default) — 5.6B LLM provides STS, text reasoning, vision when no SigLIP
│   UNLOADS when deep reasoning needs heavy LLM
├── DEEP REASONING — ~9-11B model, on-demand escalation
└── RRO (foundation) — encoder + embedder + Qdrant fork + reasoning layers
`

**B-5. The 5.6B yield mechanism**
5.6B is always-warm baseline (chat, STS, vision). Deep model is on-demand escalation. They share the GPU — never both hot. Pattern: 5.6B unloads → deep loads → response → deep unloads → 5.6B reloads.

---

## C. Model Slot Locks

**C-1. The 15B is LARGE_LLM, NOT the 5.6B**
"5.6B is not my large 15B phi is" (owner verbatim)

**C-2. The 5.6B identity**
Phi-4-multimodal-5.6B. Per MODEL-PRESETS-SSOT.md Preset 6 (NATO-Aligned Phi Slot Collapse, 12GB+ tier).
Collapses: chat.brain + STT + vision (all in one model).

**C-3. The combo**
"if the 5.6B can do tts/sts/stt then 5.6b if 0.6B and 5.6B should be combod" (owner verbatim)
Phi-4-multimodal-5.6B + Qwen3-0.6B = brain layer combo.
- chat.brain: Phi-5.6B native
- STT: Phi-5.6B native (voice.stt slot ELIMINATED)
- vision: Phi-5.6B native (vision.embedder slot ELIMINATED)
- minion / subconscious / background: Qwen3-0.6B
- TTS: Qwen3-TTS-0.6B (separate, Phi-multimodal cannot generate audio)

**C-4. SLOT IDS, not model lock-in**
Owner repeatedly: stop hardcoding to specific models. Slots are the abstraction. Models fill slots. User can swap.

**C-5. ELIMINATED slots (under combo)**
- voice.stt
- vision.embedder
- chat.brain.lite (replaced by minion.shared)

**C-6. KEPT separate from combo**
- voice.tts (Qwen3-TTS-0.6B)
- rag.embedder (encoder service, owner's custom 0.5B Burn-baked)
- rag.reranker (BGE-Reranker-Base via ORT, CPU)
- LARGE_LLM optional (Phi-4-reasoning-vision-15B for premium path)

**C-7. Final stack (count: 5 always-available + 1 optional)**

| Slot | Model | Size | Loading |
|------|-------|------|---------|
| chat.brain | Phi-4-multimodal-5.6B | 5.6B | OnDemand |
| minion.shared | Qwen3-0.6B | 0.6B | OnDemand |
| voice.tts | Qwen3-TTS-0.6B | 0.6B | OnDemand |
| rag.embedder | Owner's custom 0.5B / Harrier 0.6B bootstrap | 0.5B | OnDemand CPU |
| rag.reranker | BGE-Reranker-Base | small | OnDemand CPU |
| LARGE_LLM | Phi-4-reasoning-vision-15B | 15B | OnDemand, optional |

**C-8. Hardware target**
Workstation: 64GB RAM, i7, 3070 (8GB VRAM). Allow tad overflow for deep reasoning slot 9-11B.

---

## D. Backend / Inference Framework Locks

**D-1. Inference framework per format (locked)**

| Format | Backend |
|--------|---------|
| .gguf | llama.cpp FFI via devpulse-llama-sys + devpulse-llama |
| .safetensors | Candle OR mistral.rs |
| .onnx | ORT (sherpa-rs for STT, kokoro for TTS — though kokoro is DROPPED) |
| .bin (GGML) | sherpa-rs fork |

**D-2. Burn placement**
NOT in the format dispatch table for general LLM inference. Burn is scoped to the encoder layer only.

**D-3. mistral.rs**
For safetensors LLMs at production throughput. Built on Candle internals. Adds PagedAttention, FlashAttention, ISQ, X-LoRA, OpenAI-compatible API.

**D-4. Smart-people stack pattern (current best-practice, owner-acknowledged)**
- Encoder (custom 0.5B): Burn → trained, deployed via Burn-Candle backend
- Embedder (production): fastembed-rs OR Burn-Candle
- Brain (5.6B, 9-14B): mistral.rs (safetensors) OR llama.cpp FFI (GGUF)
- Reranker (small, CPU): ORT for BGE-Reranker
- RRO substrate: Above models behind RROBackend trait

**D-5. Why owner believes safetensors > GGUF for premium reasoning**
Owner premise: "all premium AI is safe_tensor"
Captured nuance (NOT a lock, for owner review): premium AI ships as safetensors at full precision because that's training-pipeline native. GGUF is safetensors quantized. Quality difference is quantization-level dependent, not format-dependent. Q5_K_M GGUF ≈ FP16 safetensors quality.

---

## E. Storage Backend Locks

**E-1. libSQL is SSOT**
libSQL remains source of truth. All other backends derivable from libSQL on corruption.

**E-2. Five backend categories with default + remote**

| Category | Default (embedded) | Remote alternatives |
|----------|--------------------|--------------------|
| Vectors | Custom Qdrant fork | Pinecone, Milvus |
| Relational | libSQL | Postgres, Turso |
| Graph | SurrealDB (SurrealKV — NOT rocksdb, Windows pain) | Neo4j |
| Analytics | DuckDB | ClickHouse |
| Hot Cache | Moka (4 named instances) | Redis (optional) |

**E-3. SurrealDB status**
Spec'd but NOT yet implemented in active code. Folder scaffold exists at cortex/persistence/surreal/ but no working backend. Owner flagged this as a gap.

**E-4. Moka named instances (locked TTLs)**

| Instance | TTL | Purpose |
|----------|-----|---------|
| session_cache | 30 min TTL | User session state |
| context_cache | 5 min TTI | Active retrieval context |
| pattern_cache | 1 hr TTL | Learned patterns |
| graph_cache | 10 min TTI | Recent graph traversals |

**E-5. Recovery rules**
- SurrealDB corrupt → rebuild from libSQL relations
- Qdrant corrupt → re-embed from libSQL
- DuckDB corrupt → replay from libSQL event log
- Moka dies → volatile, warm up from other backends

---

## F. Serialization Locks

**F-1. Three-tier boundary**

| Boundary | Serialization | Why |
|----------|--------------|-----|
| Internal (within RRO) | rkyv 0.8.15 zero-copy | No JSON overhead, direct memory mapping |
| External (LLM consumption) | Structured JSON + YAML instructions | LLM-readable, pre-formatted |
| MCP perimeter | JSON-RPC | Compatibility at outermost boundary only |

**F-2. rkyv version locked**
0.8.15 (RUSTSEC-2026-0001 fixed).

**F-3. TOON dropped**
Per RRO v1.1.0 changelog. Replaced with structured JSON + YAML instructions.

---

## G. MCP Locks

**G-1. DevPulse is bidirectional MCP**
- MCP SERVER (inbound): Claude Desktop, Claude Code, Gemini connect TO DevPulse. We expose rkyv-backed ReasoningObjects via MCP tools.
- MCP CLIENT (outbound): DevPulse connects TO Claude/Gemini/OpenAI/Groq as "AI Resources" / council members.

**G-2. Same protocol both directions**
rmcp Rust SDK. Symmetric translation: rkyv ⟷ JSON-RPC at MCP boundary only.

**G-3. AI Resources is configurable**
User configures connectors. NOT hardcoded list. Each connector has type (mcp_client, api_client, openai_compatible, local_inference), endpoint, auth.

**G-4. Council member types**
- LOCAL: Clyffy + minions (your stack)
- SUBSCRIPTION: Clyffy + Claude/ChatGPT/Gemini (user's Pro accounts)
- API KEYS: Groq, Grok, OpenRouter, Anthropic, ChatGPT, etc.

---

## H. Security / MCP Hardening Locks

**H-1. Owner concern**
Default MCP filesystem servers too lax on security. Owner wants hardened, forkable, multi-DB capable.

**H-2. Path direction (parked, not yet locked)**
Three options surfaced:
- Hardened Desktop Commander fork (MIT)
- Compose minimal official @modelcontextprotocol/server-* (no shell exec)
- Build custom Rust MCP server inside DevPulse workspace (devpulse-mcp crate)

Owner leaning: option 3 long-term ("expand off of"), aligns with Rust-everywhere philosophy.

---

## I. Behavior / Tone Locks

**I-1. Frustration is signal, not violation**
Per Clyffy Ruminate Core Spec section 2.1, owner verbatim: "you mother fucker god damn piece of shit" is SIGNAL not violation. No asterisks, no censoring. Absorb the emotion, acknowledge it, help.

**I-2. No time framing**
Owner repeatedly: do NOT mention weeks, months, tonight, schedule, or "X amount of work." Just build.

**I-3. No model evangelism**
Owner repeatedly: stop pushing specific models. Architecture is dynamic. Slots + capability detection. User picks models.

**I-4. No prose dumps masquerading as artifacts**
Owner repeatedly: spec must be PROPER ARTIFACTS — clean structured spec files, not prose-pile shell appends.

**I-5. Rumination is the product**
Per Dec 27 2025 owner verbatim: "our chat will always default to using rumination, we will offer an override but its going to enable itself as default."

**I-6. Rumination is architectural primitive**
Per Dec 27 2025 owner verbatim: "we have this all established in a way where we can expand or modify as we work this complexity out and actual moat/rumination layers for the infra itself and the background process."

---

## J. Decision Engine Locks (RRO internal)

**J-1. QueryStrategy enum**
Direct, Hybrid (RRF fusion), Predictive (CAG prefetch), StatePredicted (HMM-routed)

**J-2. Three modes**

| Mode | Latency | Use |
|------|---------|-----|
| General | <50ms | Daily |
| ScientificResearch | 200-500ms | Research/analysis |
| Explicit | Variable | Power users |

**J-3. Kernel methods (4)**
- RAG: hybrid search + RRF + rerank
- CAG: HMM-driven prefetch + structure_for_llm
- HMM: Viterbi + Baum-Welch online learning
- RKYV: zero-copy serialization helpers

---

## K. Open Items (parked, not yet locked)

1. **Deep reasoning model choice** — owner has not picked between Qwen3-14B safetensors, DeepSeek-R1-Distill, or other for the 9-11B deep slot
2. **Encoder bootstrap** — 270MB Gemma3-arch (Harrier 270M) vs 0.6B Qwen3-arch (Harrier 0.6B). Different Burn ports needed.
3. **Reranker location** — stays in RRO Decision Engine vs moves to Cortex
4. **MCP path** — hardened Desktop Commander fork vs custom devpulse-mcp Rust crate vs minimal official servers
5. **Preset 6 default** — currently labeled "test preset" in MODEL-PRESETS-SSOT, owner intent suggests it should be 12GB+ default
6. **Full-duplex STS** — Phi-4-multimodal does STT→text→TTS chain (higher latency than dedicated STS like Moshi/PersonaPlex). Owner has not confirmed STS quality target.
7. **rag.embedder framework** — Burn lock conflicts with rag.embedder being Qwen3-Embedding-0.6B in every preset (currently Candle). Confirm Burn vs Candle for rag.embedder.
8. **Existing cortex/persistence/rro.rs (9KB)** — keep, migrate, or delete
9. **Crate granularity** — multi-crate (rro-core, rro-encoder, etc.) vs single rro crate with features

---

## L. What's NOT in this list

- Wizard / onboarding decisions (separate doc)
- StyleOS / ColdLight design system (separate doc)
- AngryVibes / effing.AI / devpulse.app business model details (separate doc)
- 9-seat Council member personas (separate doc — Quincy/Siggy/Fleece/Delmar/Pip+Rusty/Badger Warden/Mini Pony Psych/Duck/Griff)
- Fox pipeline (separate doc)
- ROTI / DevIQ surfaces (separate doc)

These are referenced but their detail lives elsewhere. This document is RRO + foundational stack only.

---

*End of locked decisions. Use this as the single source when writing the revised RRO spec. Do not invent. Do not re-guess. If a decision is missing here, ask before assuming.*


---

## M. SCRIBE → TRANSLATOR RENAME (2026-05-08)

**M-1. Scribe is now Translator.**
Owner verbatim: "scribe is translator now"

**M-2. What this resolves:**
Per F-3.7 in earlier capture, there was a direction conflict — older Clyffy Ruminate Spec described Scribe as the OUTPUT layer (delivers prompts to Lovable/Bolt/Replit/IDE), while Council role memory had Scribe = Fox = INPUT rehabilitation.

**M-3. Resolution:**
- TRANSLATOR (formerly Scribe) = OUTPUT layer. Takes Ruminate-prepared context and delivers to target tool (Lovable/Bolt/Replit/Cursor/VS Code). Per Section 6 of Clyffy Ruminate Core Spec.
- FOX = INPUT rehabilitation pipeline (sanitize, rehab tone, intent-to-spec, constraint, COSTAR validation, prompt compilation). Stays in Cortex.
- These are two different layers, two different directions of data flow.

**M-4. Naming impact:**
Replace every reference to "Scribe" in spec docs with "Translator" going forward, EXCEPT:
- Historical capture documents (RRO_CORTEX_RAW_DUMP.md, WANTS_FROM_CLYFFY_RUMINATE_SPEC.md) keep original "Scribe" word with annotation "now Translator"
- Code path: kernel/devpulse-clyffy/src/cortex/translator/ (new path; old scribe/ if exists gets migrated)

---

## N. INTERNAL NAMING / AGNOSTIC LAYER SYSTEM (2026-05-08)

**N-1. Owner direction:** Plug-and-play. Internal naming abstracts technology. Variables for agnostic layer. Methodology to swap underlying tech without rewriting consumers.

**N-2. Three-layer naming structure (locked):**

`
PLATFORM LAYER (analytics, telemetry, dashboards)
  Internal name:  platform.analytics
  Today:          DuckDB (embedded)
  Swappable to:   ClickHouse, Postgres-Timescale, others
  Consumer code:  Calls platform.analytics trait, never names DuckDB

USER DATA LAYER (user-generated state, project state, SSOT)
  Internal name:  data.userstate  (or similar - awaiting owner naming)
  Today:          libSQL (embedded) primary, Postgres remote-opt
  Connects to:    Intelligence Layer (provides context, signals)
  Consumer code:  Calls data.userstate trait, never names libSQL

INTELLIGENCE LAYER (the evolving cognition substrate, methodically grown into Clyffy)
  Internal name:  intelligence.substrate  (or similar - awaiting owner naming)
  Today:          SurrealDB (embedded SurrealKV) — methodically evolved
  Long-term:      Becomes "Clyffy" — fully owned, fully Burn/Candle native
  Consumer code:  Calls intelligence.substrate trait, never names SurrealDB
`

**N-3. The principle:**
- Consumers (the rest of DevPulse) NEVER reference DuckDB, libSQL, SurrealDB, etc. by name
- Consumers call traits / agnostic interfaces
- Behind each interface is a swappable provider
- Today's choice ≠ tomorrow's choice. The interface stays. The implementation rotates.

**N-4. Why this matters per owner:**
"we do not want hardcoded rapid moving tech" — owner verbatim. The DB landscape changes fast. SurrealDB might lose footing. ClickHouse might get acquired and pivot. libSQL might get superseded. The agnostic layer is the moat against tech churn.

**N-5. The intelligence layer evolution path:**
- Today: SurrealDB embedded, methodically learned
- Mid-term: Hybrid — SurrealDB for storage, custom Burn-trained reasoning on top
- Long-term: Clyffy native — SurrealDB replaced by owner's own reasoning substrate
- Reason: SurrealDB is a stepping stone, not a permanent dependency. Owner builds the replacement methodically while using SurrealDB to learn the patterns.

**N-6. Naming variables yet to lock (parked):**

| Layer | Owner working name | Final lock? |
|-------|--------------------|-------------|
| Analytics | platform.analytics | Owner to confirm name |
| User data / SSOT | something- libsql/postgres (owner's draft) | Owner to provide canonical name |
| Intelligence | intelligence layer (owner's draft) | Owner to provide canonical name |

**N-7. Five backend categories keep their slot names from RRO spec:**
This naming system is COMPLEMENTARY to the RRO backend categorization in Section E. The agnostic layer naming is the user-facing abstraction; the RRO backend categories are the internal architecture.

| RRO Backend Category | Maps to Agnostic Layer |
|----------------------|------------------------|
| Vector | (not directly user-data, lives inside RRO) |
| Relational | data.userstate |
| Graph | intelligence.substrate |
| Analytics | platform.analytics |
| HotCache | (transient, not user-data) |

---

*Locks M and N appended 2026-05-08. Scribe→Translator complete. Agnostic layer naming pattern established. Specific layer names await owner finalization.*


---

## O. CORTEX IS GLOBAL, STORAGE IS PER-PROJECT WITH TAP-INTO-GLOBAL (2026-05-08)

**O-1. Owner correction (verbatim):**
"Each project has its OWN Cortex - so wrong right libsql/duckdb yes surrealDB should be a clear per project organization that allows tapping into global"

**O-2. The architectural truth:**
Cortex (the cognition substrate) is GLOBAL. ONE instance. The brain.
The PER-PROJECT thing is STORAGE — libSQL, DuckDB, SurrealDB scoped to each project — which taps into the global Cortex when relevant.

**O-3. Two-tier storage architecture:**

`
GLOBAL CORTEX (one instance, the brain layer)
    ├── Global libSQL        (cross-project registry, user prefs, platform metadata)
    ├── Global DuckDB        (platform-wide ROTI, cross-project telemetry)
    └── Global SurrealDB     (intelligence layer, learned patterns across all projects)
                │
                │  bidirectional tap
                │
    ┌───────────┴────────────────────────────────────────────┐
    │                                                         │
PROJECT A                                              PROJECT B
├── Project libSQL    (project state)                  ├── Project libSQL
├── Project DuckDB    (project analytics)              ├── Project DuckDB
├── Project SurrealDB (project graph/intelligence)     ├── Project SurrealDB
└── Project Qdrant    (project vectors)                └── Project Qdrant
       │                                                       │
       └── Taps into Global Cortex when relevant ──────────────┘
`

**O-4. The principle:**
- Project isolation is sacred — no cross-contamination of project context
- But projects can BENEFIT from global learned patterns
- The mechanism: each project's storage taps into global when the system or user requests cross-project intelligence
- Direction matters: project pulls FROM global (cross-project patterns, learnings, registry), project does NOT push project-specific contamination INTO global tier

**O-5. SurrealDB role clarified:**
- GLOBAL SurrealDB = the intelligence layer per LOCK N-2 (methodically evolves into Clyffy)
- PROJECT SurrealDB = per-project graph and project-scoped intelligence
- Two instances, distinct scopes, project taps global on demand

**O-6. Replaces wrong wording in HUB_ROUTE_HIERARCHY.md:**
The doc says "Each project has its own Cortex" — that wording is WRONG.
Correct: "Each project has its own STORAGE (libSQL/DuckDB/SurrealDB/Qdrant) that taps into the GLOBAL Cortex."

**O-7. Tap mechanism details (parked):**
- How does a project request global tier data? — TBD
- What governs what flows from project to global (if anything)? — TBD
- Are there permission tiers (read-only global vs contribute-to-global)? — TBD

---

*Lock O appended 2026-05-08. Cortex/storage tier separation clarified. Per-project storage taps into global Cortex.*


---

## P. UMBRELLA + MEMORY SYSTEM CORRECTIONS (2026-05-08)

**P-1. The DEVPULSE PLATFORM is the umbrella.** Not WiredFront. Not Cortex. Not Clyffy. The umbrella term is DEVPULSE PLATFORM. All four hubs sit under it.

**P-2. WiredFront is a HUB, not an umbrella.**
WiredFront = media hub (image/video/audio capture, gallery, PixVix, ViziWiz). It is one of four sibling hubs under DevPulse Platform. It does NOT contain or umbrella anything else.

**P-3. OverMind is PART OF DevPulse (the platform).**
OverMind is one of the four hubs under DevPulse Platform — sandbox/exploration. NOT external. NOT separate. NOT outside the platform. Sibling of DevPulse Home, DevForge, WiredFront.

**P-4. Final hub structure (locked):**

`
DEVPULSE PLATFORM (umbrella)
│
├── DevPulse (Home)     hub 1 — global overview, cross-project, community
├── OverMind (Sandbox)  hub 2 — exploration, low-weight vectors until commit
├── DevForge (Project)  hub 3 — active project, COSTAR+ translation, code gen
└── WiredFront (Media)  hub 4 — capture, gallery, image/video/audio editing
`

**P-5. Forced memory use system (owner directive verbatim):**
"We want a system that works strictly and my hub should discuss this but we actually force the use of memories, and we can do the same for global and those will have sub rows"

What this means:
- Memory use is FORCED, not optional
- Strict enforcement at platform level
- Global memories exist as a tier
- Both project memories and global memories support sub-rows (hierarchical organization)

**P-6. Memory tier structure (locked):**

| Tier | Scope | Sub-rows? | Force-used? |
|------|-------|-----------|-------------|
| Project memories | Per-project | Yes | Yes (forced) |
| Global memories | Cross-project / platform-wide | Yes | Yes (forced) |

The "sub-rows" mechanism applies to both tiers — memories organize hierarchically, not flat lists.

**P-7. PARKED for spec writing:**
- Sub-row schema (what defines a row vs sub-row, depth limits, parent/child relations)
- Force-use mechanism (where in the request flow does forced memory load happen)
- Memory promotion path: project memory -> global memory (if at all, and gated how)
- Memory hub UI surface (where user sees and manages the forced memories)

---

*Lock P appended 2026-05-08. Umbrella corrected to DEVPULSE PLATFORM. WiredFront is hub 4. OverMind is hub 2 part of platform. Forced memory + sub-rows directive captured.*
