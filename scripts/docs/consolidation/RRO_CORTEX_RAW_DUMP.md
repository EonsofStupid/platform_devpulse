> Restoration note ? 2026-11-02: This document preserves historical authored
> material. Current owner direction in CLAUDE.md and plan 0009 takes precedence:
> the kernel is included and visible; AI connections are configurable endpoints;
> local runtimes are supervised processes; Council belongs in Chat and AgentHub
> is the AI ticket factory under Overmind. Old fixed model choices, embedded
> runtimes, storage versions and hidden-kernel proposals are historical, not
> current implementation instructions. Source bytes and newer revisions are
> retained below; see docs/restoration/snapshot-documents.json for provenance.

﻿# RRO + CORTEX — Raw Capture Dump

| Field | Value |
|-------|-------|
| Status | CAPTURE IN PROGRESS |
| Created | 2026-05-01 |
| Purpose | Receive owner dumps verbatim, tag by source, categorize without interpretation |
| Rule | NO architecture decisions, NO consolidation, NO opinions — capture only |
| Output | After all dumps received: a single sourced document for owner review |

---

## Chunk Manifest

| Chunk | Source | Topic |
|-------|--------|-------|
| 1 | KERNEL_ARCHITECTURE.md v3.0.0 (2025-12-24) | Kernel state machine, event bus, scheduler |
| 2 | KERNEL_ARCHITECTURE v3.0.0 cont'd + Dec 24-27 sessions | Kernel integration points, telemetry, config, SigLIP2 research, context isolation, rumination as default |


---

## CHUNK 1 — KERNEL_ARCHITECTURE v3.0.0 (Part 1)

**Source metadata:** Status ACTIVE, Version 3.0.0, Last Updated 2025-12-24, Owner @jesse, Location `orchestrator/src/kernel/`, Governed by PHILOSOPHY.md

**Pre-amble note from owner:** Inference section should reference actual model stack (4B + 0.6B Minions). Scheduler should reflect that Minions run on 0.6B, not 4B. Background tasks use Minions (0.6B), 4B is for user queries. Resource budgets should align with ~5.3GB VRAM reality.

### [C1-A] Stated purpose / boundary

- Kernel = central nervous system, handles MECHANICS (state transitions, event routing, task scheduling)
- Cortex handles THINKING; Kernel handles COORDINATION
- Kernel asks "What needs to happen?" — Cortex asks "How do I respond thoughtfully?"
- Analogy: Kernel = OS scheduler, Cortex = application logic

### [C1-B] State machine — 8 states

| State | Category | Description |
|-------|----------|-------------|
| IdleObserve | Idle | Sub-agents collecting (0.6B), telemetry intake |
| IdleMaintain | Idle | Background: embed, rerank, dedupe (0.6B models) |
| ActiveTriage | Active | Classify user intent |
| ActiveRetrieve | Active | Fetch context from Memory |
| ActiveGenerate | Active | LLM response generation (4B via Cortex) |
| ActiveValidate | Active | Validation gate, GUARDIAN checks |
| ReflectWriteback | Reflect | Memory consolidation (MANDATORY) |
| HaltPause | Error | Hard stop after N critical failures |

### [C1-C] State invariants (3 rules)

1. User preempts background — any user input immediately Idle → Active
2. Mandatory reflection — every interaction MUST pass through ReflectWriteback before returning to Idle
3. Halt recovery — HaltPause requires explicit reset OR auto-recovers after cooldown

### [C1-D] Event bus — pub/sub topics

| Event | Publisher | Subscribers | Purpose |
|-------|-----------|-------------|---------|
| user.message | UI | Kernel | User typed something |
| user.approve | UI | Kernel | User approved COSTAR+ spec |
| kernel.state | Kernel | UI, Lab | State machine transitioned |
| cortex.response | Cortex | Kernel | Generation complete |
| cortex.thinking | Cortex | UI | "Working it out…" updates |
| agent.diary | DIARY | Memory | Session note written |
| agent.repo | REPO | Memory | Structure/drift update |
| agent.psych | PSYCH | Memory | Mood signal |
| agent.guardian | GUARDIAN | Kernel, UI | Real-time quality alert |
| fs.change | notify | REPO, GUARDIAN | File modified |
| memory.updated | Memory | Cortex | New datapoints available |

### [C1-E] Scheduler — priority-based, model-aware

- Three queues: high_priority, normal_priority, low_priority (each VecDeque<Task>)
- ResourceBudget: cpu_percent, memory_mb, gpu_percent (e.g. 30% CPU max for background)

| Priority | Tasks | Model | Behavior |
|----------|-------|-------|----------|
| High | User messages, approvals | 4B | Immediate, preempts everything |
| Normal | Sub-agent datapoints, retrieval | 0.6B | Runs when no high-priority |
| Low | Re-indexing, consolidation | 0.6B | Runs when idle, respects budgets |

- Preemption rule: user interactions ALWAYS interrupt background. No exceptions.
- Model separation: background runs on 0.6B. Never blocks 4B which stays available for user queries.

### [C1-F] Architecture flow (6 steps)

1. Sub-agents observe independently using 0.6B LLM, write datapoints to Memory
2. UI/Lab send events to Kernel via Event Bus
3. Kernel transitions state, routes to Cortex
4. Cortex reads from Memory, assembles COSTAR+, generates via 4B
5. Kernel delivers response to UI
6. MANDATORY: ReflectWriteback consolidates before returning to Idle

### [C1-G] GPU resource model — ~5.3GB VRAM total

- Qwen3-VL-4B (~3GB) — Clyffy brain, user queries
- Qwen3-0.6B (~600MB) — Minion reasoning, background
- Embedder (~400MB) — text embedding
- Reranker (~400MB) — cross-encoder scoring
- SigLIP2 (~400MB) — vision embedding
- Whisper (~500MB) — voice to text
- IDLE: GPU ~0%, VRAM unchanged
- INFERENCE: GPU spikes 2-5s then idle
- BACKGROUND: 0.6B runs without blocking 4B

### [C1-H] Kernel vs Cortex separation

| Aspect | Kernel | Cortex |
|--------|--------|--------|
| Responsibility | Mechanics | Thinking |
| Knows about | States, events, scheduling | Rumination, COSTAR+, context |
| Doesn't know about | LLM prompts, retrieval strategy | Task priorities, state machine |
| Analogous to | OS scheduler | Application logic |

### [C1-I] Sub-agent coordination rules

- Kernel does NOT dispatch sub-agents. They run independently on 0.6B LLM.
- Kernel DOES: route their events to Memory, respect resource budgets, expose alerts to UI
- Kernel DOES NOT: tell them when to run, orchestrate logic, read datapoints directly
- Sub-agents write to Memory. Cortex reads from Memory. Kernel just routes events.
- EXCEPTION: GUARDIAN alerts can trigger Kernel state transitions (e.g., block commit)

### [C1-J] Module structure

```
orchestrator/src/kernel/
├── mod.rs              ← Public exports
├── state_machine.rs    ← 8-state FSM implementation
├── event_bus.rs        ← Pub/sub routing
├── scheduler.rs        ← Priority-based task management
├── config.rs           ← Resource budgets, timeouts
└── metrics.rs          ← State transition telemetry
```

### [C1-K] Key Rust types

- `pub enum KernelState` — 8 variants (IdleObserve, IdleMaintain, ActiveTriage, ActiveRetrieve, ActiveGenerate, ActiveValidate, ReflectWriteback, HaltPause)
- `pub enum KernelEvent` — UserMessage, UserApprove, UserCancel, CortexResponse, CortexThinking, GuardianAlert, FileChange, Timeout, Reset
- `impl KernelState::transition(self, event) -> KernelState` — match-table state transitions

### [C1-L] Cross-references / connections to other modules

- Cortex (consumes events, emits cortex.response and cortex.thinking)
- Sub-agents — DIARY, REPO, PSYCH, TEACHER, SCRIBE, VISION, RESEARCHER, GUARDIAN (8-minion roster, predates 9-seat Council rename)
- Memory: libSQL + Moka + Qdrant + DuckDB
- UI (Tauri), Lab (TUI)
- Inference (Candle): 4B Clyffy brain, 0.6B Minions, 0.6B Embed, 0.6B Rerank, SigLIP2, Whisper

### [C1-M] FLAGS — contradictions / open items for later reconciliation

- ROSTER MISMATCH: 8 sub-agents listed (DIARY, REPO, PSYCH, TEACHER, SCRIBE, VISION, RESEARCHER, GUARDIAN). Memory + Apr 2026 specs show 9-seat Council with Goat Twins (Rusty + Pip) Enforcer plus animal characters (Cow, Sheep, Pig, Mini Pony, Johnny Crane, Llama, Fox, Badger).
- 4B HARDCODE: "Generation via 4B" predates "Never hardcode model sizes" rule from memory. Should be `LARGE_LLM` slot reference.
- "MAESTRO" not present in this doc — already past Gus → Clyffy rename, uses "Cortex" as thinking layer name (consistent with CORTEX.md branch).


---

## CHUNK 2 — KERNEL_ARCHITECTURE v3.0.0 (Part 2) + Dec 24-27 Sessions

**Source metadata:** Same KERNEL_ARCHITECTURE.md v3.0.0 continuation, plus three follow-up Claude sessions dated Dec 24, Dec 27 (twice), 2025.

### [C2-A] Integration points — receives from / sends to

**Receives from:**

| Source | Events |
|--------|--------|
| UI | User messages, approvals, cancellations |
| Lab | Debug commands, test triggers |
| Cortex | Responses, thinking updates |
| GUARDIAN | Real-time alerts, pre-commit blocks |
| File watcher | FS change notifications |

**Sends to:**

| Target | Events |
|--------|--------|
| UI | State updates, responses, alerts |
| Lab | State updates, metrics |
| Cortex | Routed user messages |
| Memory | Sub-agent datapoint routing |

### [C2-B] Telemetry — kernel transition trace structure

```
trace: kernel.transition
├── from_state: "IdleObserve"
├── to_state: "ActiveTriage"
├── trigger: "user.message"
├── latency_ms: 2
└── queue_depth: { high: 1, normal: 3, low: 12 }

trace: kernel.scheduler
├── task: "repo.scan"
├── priority: "low"
├── action: "preempted"
├── reason: "user.message arrived"
└── will_resume: true
```

### [C2-C] Configuration — kernel.toml

```toml
[kernel]
# State machine
halt_after_failures = 3
halt_cooldown_seconds = 60

# Scheduler
background_cpu_percent = 30
background_memory_mb = 512
background_gpu_percent = 10

# Timeouts (ms)
triage_timeout_ms = 100
retrieve_timeout_ms = 1000
generate_timeout_ms = 30000
validate_timeout_ms = 5000

# Event bus
max_queue_depth = 1000
event_ttl_seconds = 300

# Model allocation
[kernel.models]
user_queries = "4B"      # Clyffy uses 4B for user responses
background = "0.6B"      # Minions use 0.6B for observations
```

### [C2-D] Kernel changelog history

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2025-12-24 | Added GPU resource model, clarified 4B vs 0.6B model separation, Minions on 0.6B |
| 2.0.0 | 2025-12-22 | Aligned with embedded storage, all 8 sub-agents, standard header |
| 1.0.0 | 2024-12 | Initial spec |

### [C2-E] SigLIP2 vision embedding research (Dec 24, 2025)

**Question owner asked:** "please make sure there is not a newer SigLIP2 option or better alternative that has very recently started trending we should consider with our rust setup"

**Findings (as of Dec 24, 2025):**

- SigLIP2 NOT in Candle as of survey date. Open issue #2799 from March 2025 requesting support, no resolution yet.
- What IS available in Candle:

| Model | Status | Use Case |
|-------|--------|----------|
| SigLIP (v1) | Supported | Text-image similarity, our use case |
| DINOv2 | Supported | Pure vision (no text alignment) |
| CLIP | Supported | Text-image, older than SigLIP |
| EVA | Supported | High-res vision |

- Recent arrivals NOT in Candle yet:

| Model | Released | Notes |
|-------|----------|-------|
| SigLIP2 | Feb 2025 | Best performing, waiting on Candle support |
| DINOv3 | Aug 2025 | Just added to timm, not in Candle |
| MobileCLIP-2 | Aug 2025 | Efficient mobile variant |

**Recommendation captured:** Stick with SigLIP v1 for now — `google/siglip-so400m-patch14-384`. Already works in Candle. Good enough for screenshot similarity. Upgrade to SigLIP2 when Candle lands it. Architecture identical so switch will be trivial. No spec change needed.

**Alternative noted:** DINOv2 if pure image-to-image without text. SigLIP gives text-image alignment which is more versatile.

### [C2-F] Context Isolation Architecture (Dec 27, 2025)

Three-tier separation:

```
GENERAL CHAT
- "What is React?"
- Tool landscape discussions
- Learning LLM terminology
- "Should I use Cursor or Bolt?"
- Planning methodology education

Vectors + Postgres: user_general space
NEVER touches project context
```

```
PROJECT: my-saas-app
Isolated namespace in:
- Qdrant (shard key = project_id)
- Postgres (project_id foreign key everywhere)
- libSQL (project-scoped tables)

Three domains within project: FRONTEND, BACKEND, INFRA
Each with own hot ↔ cold gradient
Cross-domain retrieval only when relevant
```

```
PROJECT: other-project
Zero contamination from my-saas-app
Own vectors, own memories, own hot/cold ranking
```

### [C2-G] Hot-to-Cold per project per domain

For PROJECT: my-saas-app / FRONTEND domain:

**HOT (immediate context window):**
- Currently open file
- Files modified this session
- Recent REPO signals (last 10 min)
- Active conversation turns

**WARM (fast retrieval, rerank into hot):**
- Files touched this week
- Related components (by import graph)
- Recent decisions in this domain
- DIARY rolling summary

**COLD (background, surfaces on relevance):**
- Older session memories
- Archived decisions
- Historical patterns
- Initial planning docs

Each domain (frontend/backend/infra) maintains own temperature gradient. When user asks about auth, pull from BACKEND hot/warm, not pollute with FRONTEND component chatter.

### [C2-H] General Chat purpose

- Teach the landscape without tainting projects
- Guide tool setup (Cursor install, etc.)
- Answer "what is X" questions
- Discuss methodology
- Let them explore before committing to a project
- When they're ready to build, they create/enter a project. That context is sacred.

### [C2-I] Key Junctions (decision anchors)

```
PROJECT: my-saas-app

Key Junctions Logged:
├── 2025-01-15: Chose Supabase over Firebase (auth domain)
├── 2025-01-18: Decided on App Router vs Pages (frontend domain)
├── 2025-01-20: Locked component library: shadcn (frontend domain)
└── [pending]: Deployment target not decided (infra domain)
```

These become high-weight retrieval anchors. When user asks about auth → Supabase decision surfaces first.

### [C2-J] Rumination as DEFAULT (Dec 27, 2025) — owner direct quote

> "our chat will always default to using rumination, we will offer an override but its going to enable itself as default. that is what i need you to understand"

**Captured interpretation:** Rumination is not a feature. Rumination is the product. Every chat — general or project — runs through the 4-layer architecture by default:

1. Keystroke layer is watching
2. Pause layer is preparing context
3. Send layer assembles and generates
4. Background layer consolidates

Toggle exists for validation (A/B testing) and as user escape hatch. Shipped product = rumination on. Question is never "when do we turn on rumination?" but "when would someone ever turn it off?" (almost never, because that's choosing worse results).

### [C2-K] Rumination as architectural primitive (Dec 27, 2025) — owner direct quote

> "yes and we have this all established in a way where we can expand or modify as we work this complexity out and actual moat/rumination layers for the infra itself and the background process"

**Captured interpretation:** The 4-layer pattern isn't just for user queries. It's the architectural primitive that applies to:

- User chat → rumination
- Infrastructure monitoring → rumination
- Background optimization → rumination
- Minion coordination → rumination

The signal buffer, the watchers, the NATS event bus, the configurable layers in `rumination.rs` — all of it built to be the foundation to extend, not a fixed feature. The moat compounds: rumination watching rumination, context quality improving context quality.

### [C2-L] FLAGS — contradictions / open items

- NATS REFERENCE: C2-K mentions "NATS event bus" — this contradicts later DEVPULSE_FOUNDATION specs (Dec 31, 2025) that locked `tokio::broadcast` as the event bus and explicitly removed NATS. Reconcile during consolidation.
- Configuration `kernel.models` hardcodes "4B" and "0.6B" strings — same hardcoding flag as C1-M, should be slot references.
- Vision stack: doc captures SigLIP v1 as v1 due to Candle support gap as of Dec 24, 2025. Memory now says SigLIP2 is locked. Need to verify Candle SigLIP2 status as of May 2026 separately.

---

*End of Chunk 2. Awaiting Chunk 3.*

---

## CHUNK 3 — CORTEX v1.0.0 + RUMINATION v3.0.0 + RUMINATION v4.0.0 + Clyffy Ruminate Core Spec v1.0 + RRO v1.1.0 (header)

**Source metadata:** Multiple specs in one paste. Captured separately below.

### [C3-A] CORTEX.md v1.0.0 → v2.0.0 alignment session (Dec 27, 2025)

**Original CORTEX.md v1.0.0 metadata:** Status ACTIVE, Version 1.0.0, Last Updated 2025-12-22, Owner @jesse, Location `orchestrator/src/cortex/`, Integrates with Kernel.

**Discrepancies identified during alignment session (Dec 27, 2025):**

| Current | Should Be |
|---------|-----------|
| Redis mentions | Moka (local in-memory) |
| 14B in Background layer | 4B max, 0.6B for background work |
| Postgres framed as external | Postgres is local |
| Rumination framed as feature | Rumination is the baseline |
| No context isolation mention | General chat vs project isolation |
| No domain segmentation | Frontend/backend/infra hot-to-cold |

**Key changes locked v1.0 → v2.0:**

| Section | Before | After |
|---------|--------|-------|
| Background layer model | 14B | 0.6B (matches locked stack) |
| Hot cache | Redis | Moka (in-memory, local) |
| Rumination framing | Feature | "Rumination is the product, not a feature" |
| Context isolation | Not mentioned | Full section on general vs project chat |
| Domain segmentation | Not mentioned | Frontend/backend/infra hot-to-cold |
| Key junctions | Not mentioned | Decision anchors for retrieval |
| Storage | Postgres implied external | Explicit "All local" table |
| Pause layer | No domain awareness | `active_domain: Option<ProjectDomain>` |
| Module structure | Missing | Added `isolation.rs` for context routing |

**Outcome:** CORTEX.md bumped to v2.0.0 with breaking changes noted in changelog.

### [C3-B] RUMINATION v3.0.0 → v4.0.0 alignment session (Dec 27, 2025)

**Original RUMINATION v3.0.0 metadata:** Status ACTIVE, Version 3.0.0, Last Updated 2025-12-24, Owner @jesse, Location `orchestrator/src/cortex/rumination/`, "this IS how Cortex thinks"

**Discrepancies identified:**

| Current | Should Be |
|---------|-----------|
| Future section mentions "14B+ model" | 4B max, 0.6B for background |
| Postgres framing unclear | Explicitly local |
| No context isolation | General vs project chat |
| No domain segmentation | Frontend/backend/infra hot-to-cold |
| Turso cloud sync framed as standard | Optional, internal build only |
| Rumination framed as feature | Baseline, always on |
| "Future (Network)" implies external server | Clarify local-first |

**Key changes locked v3.0 → v4.0:**

| Section | Before | After |
|---------|--------|-------|
| Executive summary | Feature framing | "Rumination is the product, not a feature" |
| Future section | "14B+ model" on server | Removed entirely — 4B max, 0.6B for background |
| Background layer | Implied could use any model | Explicitly "Uses 0.6B only to avoid blocking 4B" |
| Storage framing | Turso sync implied standard | "All storage is local" with explicit table |
| Context isolation | Not mentioned | Full section: general vs project namespaces |
| Domain segmentation | Not mentioned | Frontend/backend/infra hot-to-cold per project |
| Key junctions | Not mentioned | Decision anchors for retrieval |
| Signal buffer | Generic | Project-scoped with project_id field |
| Qdrant queries | Generic | Namespace-scoped collections |
| Pause layer | No domain awareness | `active_domain` classification |
| Module structure | Missing isolation | Added `isolation/` directory with namespace, domain, temperature |
| Complexity scorer | No cross-domain | Added `crosses_domains` factor |
| Parking lot schema | No project scope | Added `project_id` and `domain` columns |

**Outcome:** RUMINATION.md bumped to v4.0.0 with breaking changes noted.

### [C3-C] RUMINATION v4.0.0 verification pass (Dec 27, 2025)

**Verification checklist passed:**

- Rumination as baseline, not feature ✓
- 4B max, 0.6B for background ✓
- All storage local (Moka, libSQL, Qdrant, Postgres, DuckDB) ✓
- No Redis references ✓
- No 14B references ✓
- Context isolation (general vs project) ✓
- Domain segmentation (frontend/backend/infra) ✓
- Key junctions as retrieval anchors ✓
- DIARY ≠ TODOs, Parking Lot for follow-ups ✓
- No Turso cloud sync framed as default ✓
- Project-scoped signals ✓
- Namespace-scoped Qdrant queries ✓

**Verdict:** Document aligned. No updates needed at v4.0.0.


### [C3-Q] **OWNER LIVE CORRECTION (May 1, 2026) — supersedes earlier model stack references**

> "its not 4b it is 5.6B that is to be for standard all are properly on demand"

> "it needs to be phrased — so its 2 LLMs — sts/minions/idle the smaller LLM then the larger LLM"

**Captured corrections (replaces 4B references throughout earlier chunks):**

- **Model count:** TWO LLMs total (not many tiered)
- **Smaller LLM:** powers STS + minions + idle (formerly the 0.6B role)
- **Larger LLM:** **5.6B** (NOT 4B) — the standard / chat brain
- **Loading strategy:** ALL models on-demand (not always-resident, not hot-loaded at startup)

**Reconciliation note for later consolidation:**

- All previous "4B" references in CHUNK 1, CHUNK 2, and earlier sections of CHUNK 3 should be read as **"5.6B"** going forward
- The "always resident" / "stay loaded" framing in C1-G GPU model is contradicted — owner says on-demand
- The two-LLM phrasing is the canonical framing — NOT 4-tier or N-model


### [C3-D] Clyffy Ruminate Core Spec v1.0 — Executive Summary

**Source title:** "Clyffy Ruminate Core Specification — Version 1.0 — Complete Implementation Guide"

> "Core Mission: 'It strengthens the user.' Clyffy is a TRANSLATOR, not just a chatbot. The LLM is the VOICE, not the brain. Ruminate IS the brain."

> "The Antigravity Principle: AI assistants systematically create architectural debt by always adding new abstractions. Ruminate prevents this by enforcing pattern consistency and blocking drift before it reaches the repository."

> "Value Proposition: User types 'Please add the topbar now.' → Ruminate transforms this into a senior-engineer-quality prompt with proper context, architecture guidance, COSTAR structure, and pattern consistency. The frontier model then executes correctly."

### [C3-E] Ruminating Philosophy — 5 Core Principles

1. **Seamless** — Chat is always inviting. No ugly prompts. No boring checkboxes. Transparency without friction.
2. **Absorbing** — During the prompt, Ruminate has already processed a screenshot, talked to the minions, and is now absorbing the user's input.
3. **Teaching** — Subtle education through friction and feedback. User learns COSTAR, learns patterns, becomes a "real dev."
4. **Persistent** — Memory survives crashes. State persists. The system NEVER loses context.
5. **Frustration-Tolerant** — verbatim from owner: "you mother fucker god damn piece of shit" is SIGNAL, not violation. No asterisks. No censoring. Absorb the emotion, acknowledge it, help the user.


### [C3-F] What Ruminate Does

Ruminate is the transformation engine:
- Knows the project — patterns, folder structure, build plan, Constitution
- Knows COSTAR — how to structure prompts so AI actually succeeds
- Knows industry terminology — kernel, lanes (not "Clyffy folder")
- Enriches — transforms lazy human prompt into something a frontier model executes at a senior level

### [C3-G] Transformation Engine — before/after example (verbatim)

USER TYPES:
```
Please add the topbar now.
```

RUMINATE OUTPUTS TO SCRIBE:
```
We are now going to introduce the topbar for the layout. This will be for the web portion and needs to be established for public members.

Requirements:
- layout.tsx as the main import
- Components: topbar, footer, leftside
- Separation of concerns
- Properly nested under layout
- Consistent with existing patterns
- Modular feature-based folder structure
```

### [C3-H] Context Loading (Pre-Prompt)

Before the user even finishes typing, Ruminate has:
- Processed a screenshot of current IDE state
- Queried relevant context from Qdrant (semantically related files)
- Checked build plan alignment
- Consulted minions (RepoWatcher, Psychiatrist)
- Loaded Constitution constraints


---

## OWNER OVERRIDE — 2026-05-01 (applies retroactively to all chunks)

> **"its not 4b it is 5.6B that is to be for standard all are properly on demand"**

**Captured interpretation (verbatim quote preserved above):**

- The standard brain model is **5.6B**, NOT 4B as written in the historical specs (chunks 1 and 2)
- ALL models load **on demand** — not "load at startup and stay resident" as KERNEL_ARCHITECTURE v3.0.0 stated in C1-G
- Every prior reference to "4B" or "Qwen3-VL-4B" in chunks 1 and 2 should be read as a stale model-size value subject to the slot-reference rule from memory ("Never hardcode model sizes")
- The "5.3GB VRAM total / all resident" GPU resource model in [C1-G] is therefore stale — supplant with on-demand loading discipline

**FLAG:** Reconcile during consolidation. Every "4B" mention in C1-E, C1-F, C1-G, C1-K, C2-C (kernel.toml `user_queries = "4B"`) is now under correction.

---

## CHUNK 3 — RUMINATION & CORTEX ALIGNMENT, CLYFFY RUMINATE CORE SPEC, RRO v1.1.0 HEADER

**Source metadata:** Kernel doc re-paste (already captured), plus three new artifacts:
- CORTEX.md alignment review (2025-12-27)
- RUMINATION v3.0 → v4.0 alignment (2025-12-27)
- "Clyffy Ruminate Core Specification v1.0" — Complete Implementation Guide
- RRO v1.1.0 header (2026-03-14, draft)

### [C3-A] CORTEX.md alignment review (2025-12-27)

Owner asked for documentation alignment. Captured fix table:

| Current (was) | Should Be (is) |
|---|---|
| Redis mentions | Moka (local in-memory) |
| 14B in Background layer | 4B max, 0.6B for background work (NOTE: now superseded by 5.6B owner override) |
| Postgres framed as external | Postgres is local |
| Rumination framed as feature | Rumination is the baseline |
| No context isolation mention | General chat vs project isolation |
| No domain segmentation | Frontend/backend/infra hot-to-cold |

CORTEX.md version bumped 1.0.0 → 2.0.0 with breaking changes.

Specific section-level changes captured:

| Section | Before | After |
|---|---|---|
| Background layer model | 14B | 0.6B (locked stack) |
| Hot cache | Redis | Moka (in-memory, local) |
| Rumination framing | Feature | "Rumination is the product, not a feature" |
| Context isolation | Not mentioned | Full section on general vs project chat |
| Domain segmentation | Not mentioned | Frontend/backend/infra hot-to-cold |
| Key junctions | Not mentioned | Decision anchors for retrieval |
| Storage | Postgres implied external | Explicit "All local" table |
| Pause layer | No domain awareness | `active_domain: Option<ProjectDomain>` |
| Module structure | Missing | Added `isolation.rs` for context routing |

### [C3-B] RUMINATION v3 → v4 alignment (2025-12-27)

Same alignment pass, this time on RUMINATION spec. Captured fix table:

| Current (was) | Should Be (is) |
|---|---|
| Future section mentions "14B+ model" | 4B max, 0.6B for background (NOTE: superseded by 5.6B override) |
| Postgres framing unclear | Explicitly local |
| No context isolation | General vs project chat |
| No domain segmentation | Frontend/backend/infra hot-to-cold |
| Turso cloud sync framed as standard | Optional, internal build only |
| Rumination framed as feature | Baseline, always on |
| "Future (Network)" implies external server | Clarify local-first |

RUMINATION version bumped 3.0.0 → 4.0.0.

Section-level v3 → v4 changes:

| Section | v3 | v4 |
|---|---|---|
| Executive summary | Feature framing | "Rumination is the product, not a feature" |
| Future section | "14B+ model" on server | Removed entirely — 4B max, 0.6B background |
| Background layer | Implied could use any model | "Uses 0.6B only to avoid blocking 4B" |
| Storage framing | Turso sync implied standard | "All storage is local" with explicit table |
| Context isolation | Not mentioned | Full section: general vs project namespaces |
| Domain segmentation | Not mentioned | Frontend/backend/infra hot-to-cold per project |
| Key junctions | Not mentioned | Decision anchors for retrieval |
| Signal buffer | Generic | Project-scoped with `project_id` field |
| Qdrant queries | Generic | Namespace-scoped collections |
| Pause layer | No domain awareness | `active_domain` classification |
| Module structure | Missing isolation | Added `isolation/` directory: namespace, domain, temperature |
| Complexity scorer | No cross-domain | Added `crosses_domains` factor |
| Parking lot schema | No project scope | Added `project_id` and `domain` columns |

### [C3-C] RUMINATION v4 verification checklist (2025-12-27)

Owner asked: "any updates needed?" — these checks all returned ✓ (passed):

- Rumination as baseline, not feature ✓
- 4B max, 0.6B for background ✓ (NOTE: now 5.6B per override — checklist needs re-verification)
- All storage local (Moka, libSQL, Qdrant, Postgres, DuckDB) ✓
- No Redis references ✓
- No 14B references ✓
- Context isolation (general vs project) ✓
- Domain segmentation (frontend/backend/infra) ✓
- Key junctions as retrieval anchors ✓
- DIARY ≠ TODOs, Parking Lot for follow-ups ✓
- No Turso cloud sync framed as default ✓
- Project-scoped signals ✓
- Namespace-scoped Qdrant queries ✓

**Owner verdict:** "Document is aligned. No updates needed."


### [C3-D] CLYFFY RUMINATE CORE SPECIFICATION — Complete Implementation Guide v1.0

This is a separate, fully captured spec document. Sections preserved verbatim.

#### [C3-D-1] Section 1 — Executive Summary

- **Core Mission:** "It strengthens the user." Clyffy is a TRANSLATOR, not just a chatbot. The LLM is the VOICE, not the brain. Ruminate IS the brain.
- **The Antigravity Principle:** AI assistants systematically create architectural debt by always adding new abstractions. Ruminate prevents this by enforcing pattern consistency and blocking drift before it reaches the repository.
- **Value Proposition:** User types "Please add the topbar now." → Ruminate transforms this into a senior-engineer-quality prompt with proper context, architecture guidance, COSTAR structure, and pattern consistency. The frontier model then executes correctly.

#### [C3-D-2] Section 2 — The Ruminating Philosophy

> "Ruminating is 'a mix of antigravity and Claude' — seamless cognition that happens invisibly while the user types."

**2.1 Core Principles** (5 listed):

- **Seamless** — Chat is always inviting. No ugly prompts. No boring checkboxes. Transparency without friction.
- **Absorbing** — During the prompt, Ruminate has already processed a screenshot, talked to the minions, and is now absorbing the user's input.
- **Teaching** — Subtle education through friction and feedback. User learns COSTAR, learns patterns, becomes a "real dev."
- **Persistent** — Memory survives crashes. State persists. The system NEVER loses context.
- **Frustration-Tolerant** — "you mother fucker god damn piece of shit" is SIGNAL, not violation. No asterisks. No censoring. Absorb the emotion, acknowledge it, help the user.

**2.2 What Ruminate Does** (4 items, the "transformation engine"):

- Knows the project — patterns, folder structure, build plan, Constitution
- Knows COSTAR — how to structure prompts so AI actually succeeds
- Knows industry terminology — kernel, lanes (not "Clyffy folder")
- Enriches — transforms lazy human prompt into something a frontier model executes at a senior level

#### [C3-D-3] Section 3 — The Transformation Engine

**3.1 Before/After example (verbatim):**

USER TYPES:
```
Please add the topbar now.
```

RUMINATE OUTPUTS TO SCRIBE:
```
We are now going to introduce the topbar for the layout. This will be for the web portion and needs to be established for public members.

Requirements:
- layout.tsx as the main import
- Components: topbar, footer, leftside
- Separation of concerns
- Properly nested under layout
- Consistent with existing patterns
- Modular feature-based folder structure
```

**3.2 Context Loading (Pre-Prompt)** — before user finishes typing, Ruminate has:

- Processed a screenshot of current IDE state
- Queried relevant context from Qdrant (semantically related files)
- Checked build plan alignment
- Consulted minions (RepoWatcher, Psychiatrist)
- Loaded Constitution constraints

#### [C3-D-4] Section 4 — Memory Lifecycle (4-tier system with importance scoring 0-100)

| Tier | Purpose | Storage | Action |
|---|---|---|---|
| Short-Term | Working memory (current chat) | RAM / Redis | FILTER (drop noise) |
| Medium-Term | Episodic (~2 weeks) | Qdrant Fast Collection | SUMMARIZE (compress) |
| Long-Term | Semantic core knowledge | Qdrant Archive + Postgres | REINFORCE (strengthen) |
| Critical | The Soul (user prefs) | System Prompt / Pinned | PROTECT (never delete) |

**4.1 Importance Score Signals:**
- +5: Injected into prompt (actively used)
- +2: Retrieved but not top result
- -1: Retrieved but ignored by user
- →100: User pins item (becomes Critical)
- -0.5/day: Natural decay if unused

#### [C3-D-5] Section 5 — Ruminator State Machine

```
┌─────────────────────────────────────────────────────┐
│  IDLE ──(5min)──> SCANNING ──> AGGREGATING         │
│    ▲                              │                 │
│    │                              ▼                 │
│ SLEEPING <──(done)── DECIDING <───┘                │
│                   │                                │
│             [PROMOTE│FLAG│DELETE]                  │
└─────────────────────────────────────────────────────┘
```

**5.1 State Definitions:**
- **IDLE** — User is active. Ruminator waits. Timeout: 5 minutes of no input.
- **SCANNING** — Collect Short-Term memories with low importance scores.
- **AGGREGATING** — Group related memories. Identify clusters.
- **DECIDING** — Small model (Qwen-1.5B) evaluates each cluster: PROMOTE, FLAG, or DELETE.
- **SLEEPING** — Cycle complete. Log to Dream Log. Return to IDLE.

**5.2 Decision Algorithm — three questions per cluster:**
1. Contradiction Check — Does this contradict Long-Term or Critical memory?
2. Value Assessment — Does this add new, actionable knowledge?
3. Redundancy Check — Is this substantially similar to existing memory?

**Outcomes:**
- PROMOTE — Valuable + no conflict → Move to higher tier
- FLAG — Contradicts Critical → Alert user for resolution
- DELETE — No value or redundant → Remove

#### [C3-D-6] Section 6 — Scribe Integration

Scribe is the **output layer**. After Ruminate transforms the prompt, Scribe delivers it seamlessly to:

- **Lovable** — Browser extension injects enhanced prompt
- **Bolt** — Same mechanism
- **Replit** — Same mechanism
- **Local IDE** — Cursor, VS Code via MCP

> "The user types casually. Clyffy handles the complexity. The AI executes correctly."

#### [C3-D-7] Section 7 — PeerGuardian / LeftHook

Clyffy as advanced pre-commit hook catching antigravity drift:

- Drift Detection — Code that duplicates existing patterns
- Build Plan Validation — Does this commit advance a planned task?
- Pattern Consistency — Does this match established folder structure?
- Blocking — Prevents bad code from reaching repo. "Clyffy blocked 3 drift commits."

#### [C3-D-8] Section 8 — ROTI Metrics ("fun stat" for users)

> "Return on Time Invested"

Examples:
- "Clyffy blocked 3 drift commits this session" ← Savings
- "Clyffy transformed 12 prompts" ← Value delivered
- "Saved X using DevPulse" ← User-facing badge

**Critical clarification:** ROTI is NOT about time saved. It's about QUALITY TRANSFORMATION.

#### [C3-D-9] Section 9 — Hardware & Model Requirements

| Component | Model | VRAM | Location |
|---|---|---|---|
| Ruminator | Qwen2.5-1.5B-Instruct (Q4) | ~1.5GB | 100% LOCAL |
| Embedder | Nomic-Embed 0.6B | ~0.5GB | 100% LOCAL |
| Scribe/Translator | Qwen2.5-7B or 14B | ~8-16GB | LOCAL |
| Heavy Lift | Claude/GPT-4 | N/A | API |

> "Critical Design Principle: Ruminator NEVER uses 'Big Brain.' Small fast model runs background without lag. 'You don't need a genius model to say "User worked on Auth."'"

#### [C3-D-10] Section 10 — Implementation Checklist (4 weeks)

**Week 1: Contracts & Storage**
- Define MemoryItem, RuminateDecision, DreamLogEntry schemas
- Set up Postgres tables for metadata
- Implement MemoryStore trait in Rust
- Write unit tests for tier transitions

**Week 2: State Machine**
- Implement RuminatorState enum in Rust
- Add idle detection (5 min timeout)
- Build Cortex Viewer UI panel
- Wire up state transitions with telemetry

**Week 3: Decision Engine**
- Integrate Qwen-1.5B via llama.cpp
- Write contradiction detection prompts
- Implement PROMOTE/FLAG/DELETE logic
- Add Dream Log persistence

**Week 4: Proof of Life**
- "Force Ruminate" button in UI
- Visual state machine transitions
- Decision log display
- End-to-end test: inject memory → trigger ruminate → verify promotion

#### [C3-D-11] Section 11 — Data Contracts (TypeScript-typed interfaces)

**11.1 MemoryItem:**
```ts
interface MemoryItem {
  id: string;                    // UUID
  content: string;               // The actual memory
  embedding: number[];           // Vector from Nomic-Embed
  tier: 'short'|'medium'|'long'|'critical';
  importance: number;            // 0-100
  created_at: Date;
  last_accessed: Date;
  source: 'chat'|'file'|'commit'|'screenshot';
}
```

**11.2 RuminateDecision:**
```ts
interface RuminateDecision {
  memory_id: string;
  action: 'PROMOTE'|'FLAG'|'DELETE';
  reason: string;                // Model's explanation
  confidence: number;            // 0.0-1.0
  new_tier?: 'medium'|'long'|'critical';
  conflict_with?: string;        // ID of conflicting memory
}
```

End of Clyffy Ruminate Core Specification v1.0.

### [C3-E] RRO v1.1.0 header (2026-03-14, DRAFT)

| Field | Value |
|---|---|
| Status | DRAFT → Owner review required |
| Version | 1.1.0 |
| Last Updated | 2026-03-14 |
| Owner | @jesse |
| Part of | DevPulse Platform |
| Also | Standalone open-source crate (`rro`) |
| License | TBD (Apache 2.0 / MIT dual likely) |
| Qdrant Status | Star Ambassador, partnership discussions active |
| Precedence | PHILOSOPHY.md governs |

(Body content for RRO v1.1.0 not in this chunk — header only. Full body to be captured in subsequent chunks if pasted.)

### [C3-F] FLAGS — contradictions / open items in Chunk 3

| # | Source | Issue |
|---|---|---|
| F-3.1 | C3-D-4 | "Short-Term storage: RAM / Redis" — contradicts the locked Moka decision in [C3-A]. Older spec uses Redis terminology. |
| F-3.2 | C3-D-9 | "Scribe/Translator: Qwen2.5-7B or 14B" — contradicts owner override of 5.6B and the "no 14B" rule from [C3-C]. |
| F-3.3 | C3-D-9 | "Ruminator: Qwen2.5-1.5B-Instruct" — different model from Qwen3-0.6B locked in C1-G. Older Qwen2.5 generation. |
| F-3.4 | C3-D-9 | "Embedder: Nomic-Embed 0.6B" — contradicts the Harrier-OSS-v1-0.6B (Qwen3 architecture) priority order locked in current memory. |
| F-3.5 | C3-D-11 | Data contracts use TypeScript `interface` — but Rust ownership rule from PHILOSOPHY says Rust owns all policy/logic, Svelte owns presentation. These contracts would need Rust struct equivalents as the SSOT. |
| F-3.6 | C3-D-2 | The frustration-tolerant quote: "you mother fucker god damn piece of shit is SIGNAL, not violation" — captures owner's explicit policy. PSYCH minion routing rule. |
| F-3.7 | C3-D-6 | Scribe described here as OUTPUT layer (delivers prompt to Lovable/Bolt/Replit/IDE). Council role from memory has Scribe = Fox = INPUT rehabilitation (sanitize → rehab → intent → spec → COSTAR+IC). Direction conflict. |
| F-3.8 | OWNER OVERRIDE | All "4B" references in chunks 1, 2, 3-A, 3-B, 3-C now under "5.6B / on demand" correction. |

---

*End of Chunk 3. Awaiting Chunk 4.*

---

## CHUNK 4 — RRO v1.1.0 BODY (Sections 1-2)

**Source metadata:** RRO: Reasoning Ready Objects v1.1.0, 2026-03-14, DRAFT, header already captured in [C3-E]. This chunk captures the body.

**Note on duplication:** Chunk 4 paste also re-included KERNEL_ARCHITECTURE v3.0.0 (already in C1) and Clyffy Ruminate Core Spec (already in C3-D). Skipping those — only new RRO content captured below.

### [C4-A] RRO Section 1 — Core Concept

**Definition (verbatim):**
> "RRO is not a database. RRO is a reasoning substrate."

**Distribution model — three identities:**

- **(B) Reusable library** — `rro` crate usable in any Rust project
- **(C) Open-source offering** — Qdrant-compatible but purpose-built for reasoning pipelines
- **Qdrant relationship** — "They're watching; potential partnership or acquisition path"

**What RRO IS — five responsibilities:**

- Unified query/access layer
- Abstracts multiple storage backends behind one interface
- Pre-structures all data for immediate LLM consumption (no transform step)
- Uses the **0.6B encoder network** as the decision-making layer
- Operates in configurable modes (general vs scientific research)
- Config-driven and open-source friendly — customizable for community innovation

### [C4-B] RRO Architecture Diagram (verbatim ASCII art)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              RRO LAYER                                   │
│                    (Query Interface + Reasoning Layer)                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    DECISION ENGINE (0.6B Network)                   │ │
│  │                                                                      │ │
│  │   Embedder (Qwen3-Embedding-0.6B)  ←→  Reranker (Qwen3-Reranker)   │ │
│  │                                                                      │ │
│  │   Mode: GENERAL | SCIENTIFIC_RESEARCH | EXPLICIT                    │ │
│  │                                                                      │ │
│  │   Responsibilities:                                                  │ │
│  │   • Route queries to optimal backend(s)                             │ │
│  │   • Score relevance (rerank before return)                          │ │
│  │   • Prefetch context (CAG)                                          │ │
│  │   • Predict next state (HMM)                                        │ │
│  │   • Fuse results (RRF)                                              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                    ┌───────────────┼───────────────┐                    │
│                    ▼               ▼               ▼                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      BACKEND ABSTRACTION                          │  │
│  │                                                                    │  │
│  │  trait RROBackend {                                               │  │
│  │      fn backend_type() -> BackendType;                            │  │
│  │      fn capabilities() -> BackendCapabilities;                    │  │
│  │      async fn query(&self, q: RROQuery) -> RROResult;             │  │
│  │      async fn upsert(&self, obj: ReasoningObject) -> Result<()>;  │  │
│  │      async fn health_check(&self) -> HealthStatus;                │  │
│  │  }                                                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│         ┌──────────────┬───────────┼───────────┬──────────────┐         │
│         ▼              ▼           ▼           ▼              ▼         │
│  ┌───────────┐  ┌───────────┐  ┌────────┐  ┌────────┐  ┌───────────┐   │
│  │  VECTORS  │  │ RELATIONAL│  │ GRAPH  │  │ANALYTICS│ │ HOT CACHE │   │
│  │           │  │           │  │        │  │         │  │           │   │
│  │  Default: │  │  Default: │  │Default:│  │ Default:│  │  Default: │   │
│  │  Qdrant   │  │  libSQL   │  │Surreal │  │ DuckDB  │  │   Moka    │   │
│  │  (embed)  │  │  (embed)  │  │(embed) │  │ (embed) │  │  (4 inst) │   │
│  │           │  │           │  │        │  │         │  │           │   │
│  │  Remote:  │  │  Remote:  │  │Remote: │  │ Remote: │  │  Remote:  │   │
│  │  Pinecone │  │  Postgres │  │ Neo4j  │  │ Click-  │  │  Redis    │   │
│  │  Milvus   │  │  Turso    │  │        │  │ House   │  │  (opt)    │   │
│  └───────────┘  └───────────┘  └────────┘  └────────┘  └───────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### [C4-C] Decision Engine — capabilities (extracted from diagram)

- **Encoder pair:** Qwen3-Embedding-0.6B + Qwen3-Reranker (bi-directional arrow indicates they work together)
- **Three modes:** `GENERAL`, `SCIENTIFIC_RESEARCH`, `EXPLICIT`
- **Five core responsibilities:**
  1. Route queries to optimal backend(s)
  2. Score relevance (rerank before return)
  3. Prefetch context (CAG)
  4. Predict next state (HMM)
  5. Fuse results (RRF)

### [C4-D] RROBackend trait (verbatim Rust signature)

```rust
trait RROBackend {
    fn backend_type() -> BackendType;
    fn capabilities() -> BackendCapabilities;
    async fn query(&self, q: RROQuery) -> RROResult;
    async fn upsert(&self, obj: ReasoningObject) -> Result<()>;
    async fn health_check(&self) -> HealthStatus;
}
```

### [C4-E] Five backend categories with default + remote options

| Category | Default (embedded) | Remote option(s) |
|---|---|---|
| VECTORS | Qdrant | Pinecone, Milvus |
| RELATIONAL | libSQL | Postgres, Turso |
| GRAPH | SurrealDB | Neo4j |
| ANALYTICS | DuckDB | ClickHouse |
| HOT CACHE | Moka (4 instances) | Redis (optional) |

**Note:** All defaults are embedded. Remote variants exist as opt-in.

### [C4-F] RRO Section 2 — Why RRO Beats SurrealDB (verbatim comparison table)

| SurrealDB | RRO |
|---|---|
| Multi-model (doc, graph, relational) | Multi-model + vector-native + reasoning-ready |
| Generic SurrealQL | LLM-optimized query patterns (CAG prefetch, HMM state prediction) |
| JSON at all boundaries | RKYV zero-copy internally, structured JSON + YAML instructions for LLM context |
| HTTP or embedded | Embedded only, in-process, <5ms |
| General purpose | Purpose-built for AI/ML reasoning pipelines |
| Query → Transform → Use | Query → Use (pre-structured for consumption) |
| No semantic layer | 0.6B encoder IS the semantic layer |
| Fixed query planning | Mode-switchable query strategies |

### [C4-G] FLAGS — contradictions / open items in Chunk 4

| # | Source | Issue |
|---|---|---|
| F-4.1 | C4-A | "0.6B encoder network as the decision-making layer" — uses Qwen3-Embedding-0.6B + Qwen3-Reranker. Memory says Harrier-OSS-v1-0.6B is now default. Reconcile encoder model. |
| F-4.2 | C4-E | RRO uses SurrealDB as a BACKEND (graph category). [C2-G] context isolation puts it as Postgres-equivalent. Need to clarify SurrealDB role across all RRO consumers. |
| F-4.3 | C4-E | "Moka (4 instances)" — 4 distinct cache instances. This needs naming/role definition for each. Captured for later spec. |
| F-4.4 | C4-F | "RKYV zero-copy internally" — confirms rkyv dependency lock from memory. Memory pinned at 0.8.15 (RUSTSEC-2026-0001 fixed). |
| F-4.5 | C4-F | "Embedded only, in-process, <5ms" — clear stance against HTTP boundaries. Aligns with owner statement that sidecar HTTP defeats rumination latency. |
| F-4.6 | OWNER OVERRIDE PROPAGATION | Decision Engine still says 0.6B. The 5.6B override applies to the BRAIN (chat.brain slot), not necessarily the embedder/reranker (which stay 0.6B). Confirming this distinction during consolidation. |

---

*End of Chunk 4. Awaiting Chunk 5.*

---

## CHUNK 5 — RRO v1.1.0 BODY (Sections 3-6)

**Source metadata:** RRO: Reasoning Ready Objects v1.1.0, 2026-03-14, DRAFT — sections 3 through 6.

**Note on duplication:** Chunk 5 paste re-included RUMINATION v4 checklist, Clyffy Ruminate spec, and RRO sections 1-2 (already captured in C3-C, C3-D, C4). Skipping those — only new section 3+ content captured below.

### [C5-A] RRO Section 3 — The Decision Engine (0.6B Network)

**Stated purpose:**
> "The 0.6B encoder network is not just for embedding. It's the decision-making layer."

#### [C5-A-1] Section 3.1 — Query Routing (verbatim Rust)

```rust
pub enum QueryStrategy {
    /// Fast path: single backend, no fusion
    Direct { backend: BackendType },

    /// Hybrid: multiple backends, RRF fusion
    Hybrid { backends: Vec<BackendType>, fusion: FusionMethod },

    /// CAG: prefetch before query even executes
    Predictive { prefetch: Vec<PrefetchTarget>, then: Box<QueryStrategy> },

    /// HMM: state-aware routing based on session context
    StatePredicted { hmm_state: StateId, strategy: Box<QueryStrategy> },
}

impl DecisionEngine {
    /// The 0.6B reranker decides routing
    pub async fn plan_query(&self, query: &RROQuery, mode: QueryMode) -> QueryStrategy {
        let query_embedding = self.embedder.embed(&query.text).await?;

        // Score each backend's relevance to this query
        let backend_scores = self.score_backends(query_embedding, &query.hints).await;

        // Mode affects strategy selection
        match mode {
            QueryMode::General => self.fast_strategy(backend_scores),
            QueryMode::ScientificResearch => self.exhaustive_strategy(backend_scores),
            QueryMode::Explicit => self.user_specified_strategy(&query.explicit_backends),
        }
    }
}
```

#### [C5-A-2] Section 3.2 — Query Modes (3 modes, verbatim table)

| Mode | Behavior | Latency | Use Case |
|---|---|---|---|
| General | Fast path, single best backend, rerank top-k | <50ms | Daily coding, quick lookups |
| Scientific Research | Exhaustive, all backends, deep rerank, full provenance | 200-500ms | Research, analysis, learning |
| Explicit | User specifies backends, no inference | Variable | Debugging, testing, power users |

#### [C5-A-3] Section 3.3 — rro.toml mode configuration (verbatim)

```toml
# rro.toml (config-driven)
[rro]
default_mode = "general"

[rro.modes.general]
max_backends = 2
rerank_top_k = 10
latency_budget_ms = 50
prefetch_enabled = true

[rro.modes.scientific_research]
max_backends = 4  # all
rerank_top_k = 50
latency_budget_ms = 500
prefetch_enabled = true
provenance_tracking = true
citation_generation = true

[rro.modes.explicit]
# User controls everything
allow_backend_override = true
allow_fusion_override = true
```

### [C5-B] RRO Section 4 — Reasoning Ready Objects

**Stated purpose:**
> "Every piece of data in RRO is stored as a ReasoningObject — pre-structured for immediate LLM consumption."

#### [C5-B-1] Section 4.1 — Core Type (verbatim Rust)

```rust
/// A Reasoning Ready Object — pre-structured for LLM consumption
#[derive(Archive, Deserialize, Serialize)]  // rkyv for zero-copy
pub struct ReasoningObject {
    /// Unique identifier
    pub id: ObjectId,

    /// What kind of object this is
    pub kind: ObjectKind,

    /// The raw content (code, text, etc.)
    pub content: Content,

    /// Pre-computed dense embedding (1024-dim from Qwen3-Embedding)
    pub dense_vector: Vector1024,

    /// Pre-computed sparse embedding (BM25 tokens)
    pub sparse_vector: SparseVector,

    /// Pre-computed metadata for LLM context assembly
    pub reasoning_metadata: ReasoningMetadata,

    /// Relationships to other objects (graph edges)
    pub relations: Vec<Relation>,

    /// Which backends currently store this object
    pub storage_locations: StorageLocations,

    /// Lifecycle state
    pub lifecycle: ObjectLifecycle,
}

#[derive(Archive, Deserialize, Serialize)]
pub struct ReasoningMetadata {
    /// Token count (already computed, no re-counting needed)
    pub token_count: u32,

    /// Pre-structured JSON representation (ready for LLM prompt)
    /// Follows YAML instruction format for methodical processing
    pub structured_context: Option<StructuredContext>,

    /// Summary (pre-generated for context windows)
    pub summary: Option<String>,

    /// Key concepts (for CAG prefetch matching)
    pub concepts: Vec<ConceptId>,

    /// Relevance scores from last access (cached rerank)
    pub cached_relevance: Option<CachedRelevance>,

    /// Provenance (where did this come from)
    pub provenance: Provenance,
}

/// Structured context for LLM consumption
/// JSON body with YAML-style instruction headers
#[derive(Archive, Deserialize, Serialize)]
pub struct StructuredContext {
    /// YAML-style instruction block
    pub instructions: String,

    /// Clean JSON payload (methodically processable)
    pub payload: serde_json::Value,

    /// Format version for backward compatibility
    pub format_version: u8,
}
```

#### [C5-B-2] Section 4.2 — Object Kinds (verbatim Rust enum)

```rust
pub enum ObjectKind {
    // Code artifacts
    CodeChunk { language: Language, chunk_type: ChunkType },
    Function { signature: FunctionSig },
    Module { exports: Vec<ExportId> },

    // Documentation
    DocBlock { doc_type: DocType },
    Comment { comment_type: CommentType },

    // Knowledge
    Concept { domain: Domain },
    Pattern { pattern_type: PatternType },
    Decision { adr_id: Option<AdrId> },

    // Session/runtime
    Turn { session_id: SessionId },
    Finding { expert_id: ExpertId },

    // External
    ExternalDoc { source: ExternalSource },
    Embedding { model: EmbeddingModel },
}
```

### [C5-C] RRO Section 5 — Backend Trait Contract (full version)

**Stated purpose:**
> "All backends implement the same trait. Config decides which ones are active."

#### [C5-C-1] Full RROBackend trait (extends C4-D shorter version)

```rust
#[async_trait]
pub trait RROBackend: Send + Sync {
    /// What type of backend is this
    fn backend_type(&self) -> BackendType;

    /// What can this backend do
    fn capabilities(&self) -> BackendCapabilities;

    /// Query this backend
    async fn query(&self, query: &BackendQuery) -> Result<BackendResult>;

    /// Upsert a reasoning object
    async fn upsert(&self, obj: &ReasoningObject) -> Result<()>;

    /// Batch upsert
    async fn upsert_batch(&self, objs: &[ReasoningObject]) -> Result<BatchResult>;

    /// Delete by ID
    async fn delete(&self, id: &ObjectId) -> Result<bool>;

    /// Health check
    async fn health(&self) -> HealthStatus;

    /// Sync state (for backends that cache)
    async fn sync(&self) -> Result<SyncReport>;
}
```

#### [C5-C-2] BackendType enum

```rust
#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub enum BackendType {
    Vector,
    Relational,
    Graph,
    Analytics,
    HotCache,
}
```

#### [C5-C-3] BackendCapabilities struct

```rust
pub struct BackendCapabilities {
    pub supports_vector_search: bool,
    pub supports_full_text: bool,
    pub supports_graph_traversal: bool,
    pub supports_aggregations: bool,
    pub supports_transactions: bool,
    pub supports_subscriptions: bool,
    pub max_vector_dimensions: Option<usize>,
    pub max_batch_size: Option<usize>,
}
```

### [C5-D] RRO Section 6 — Config-Driven Backend Selection (rro.toml verbatim)

```toml
# rro.toml
[backends]
# Which backends are enabled
enabled = ["vector", "relational", "graph", "analytics", "cache"]

[backends.vector]
# Default: embedded Qdrant (your fork)
provider = "qdrant_embedded"
path = "${DATA_DIR}/vectors"

# Alternative: remote Qdrant
# provider = "qdrant_remote"
# url = "https://qdrant.example.com"
# api_key = "${QDRANT_API_KEY}"

# Alternative: Pinecone
# provider = "pinecone"
# api_key = "${PINECONE_API_KEY}"
# environment = "us-east-1-aws"

# Alternative: Milvus
# provider = "milvus"
# url = "localhost:19530"

[backends.relational]
# Default: embedded libSQL
provider = "libsql_embedded"
path = "${DATA_DIR}/state.db"

# Alternative: Turso (remote libSQL)
# provider = "turso"
# url = "${TURSO_URL}"
# auth_token = "${TURSO_TOKEN}"

# Alternative: Postgres
# provider = "postgres"
# connection_string = "${DATABASE_URL}"

[backends.graph]
# Default: embedded SurrealDB with SurrealKV
provider = "surrealdb_embedded"
path = "${DATA_DIR}/graph"
storage_engine = "surrealkv"  # NOT rocksdb (Windows pain)

# Alternative: remote SurrealDB
# provider = "surrealdb_remote"
# url = "wss://surreal.example.com"

# Alternative: Neo4j
# provider = "neo4j"
# url = "bolt://localhost:7687"
# username = "${NEO4J_USER}"
# password = "${NEO4J_PASSWORD}"

[backends.analytics]
# Default: embedded DuckDB
provider = "duckdb_embedded"
path = "${DATA_DIR}/analytics.duckdb"

# Alternative: ClickHouse
# provider = "clickhouse"
# url = "http://localhost:8123"

[backends.cache]
# Default: Moka (in-process)
provider = "moka"

[backends.cache.moka]
# Four named instances (from your spec)
session_cache_ttl_sec = 1800      # 30min
context_cache_tti_sec = 300       # 5min idle
pattern_cache_ttl_sec = 3600      # 1hr
graph_cache_tti_sec = 600         # 10min idle

# Alternative: Redis (if needed for distributed)
# provider = "redis"
# url = "redis://localhost:6379"
```

### [C5-E] FLAGS — contradictions / open items in Chunk 5

| # | Source | Issue |
|---|---|---|
| F-5.1 | C5-A-1 `QueryStrategy` enum | Four strategy variants confirmed: Direct, Hybrid, Predictive (CAG), StatePredicted (HMM). Names match the on-disk code structure (`adapters/reasoning/chains.rs`, `hmm.rs`, `transition_matrix.rs`) — alignment confirmed. |
| F-5.2 | C5-A-2 Modes | Three modes locked: General (<50ms), ScientificResearch (200-500ms), Explicit (variable). Aligns with C4-C three-mode declaration. |
| F-5.3 | C5-B-1 `Vector1024` | Hardcodes 1024-dim from Qwen3-Embedding-0.6B. If embedder swaps to Harrier-OSS-v1-0.6B (Qwen3 architecture, also 1024-dim per disk config.json) the type works. If embedder swaps to BGE-M3 (1024-dim) it works. If swapped to a different-dim model, type system breaks. Generic over D needed for slot-aware encoder. |
| F-5.4 | C5-B-1 `StorageLocations` | Field exists but no struct definition in spec — implies an object can live in multiple backends simultaneously. Need clarification on consistency model. |
| F-5.5 | C5-B-2 `ObjectKind::Embedding { model: EmbeddingModel }` | Embeddings themselves can be stored as ReasoningObjects. Recursive shape — embedding-of-an-embedding scenario. Worth flagging. |
| F-5.6 | C5-D backends.cache.moka | Four named Moka instances confirmed: `session_cache` (30min TTL), `context_cache` (5min TTI), `pattern_cache` (1hr TTL), `graph_cache` (10min TTI). Resolves F-4.3 (Moka 4 instances naming). |
| F-5.7 | C5-D backends.graph | "SurrealDB embedded with SurrealKV (NOT rocksdb — Windows pain)" — engine choice locked, with reason. |
| F-5.8 | C5-C-1 trait method `sync` | "for backends that cache" — implies cache backends have local-vs-remote sync. Distributed cache mode (Redis fallback) implies this matters. |

---

*End of Chunk 5. Awaiting Chunk 6.*

---

## CHUNK 6 — RRO v1.1.0 BODY (Section 7: Kernel IP Integration)

**Source metadata:** RRO: Reasoning Ready Objects v1.1.0, 2026-03-14, DRAFT — Section 7 (RAG, CAG, HMM, RKYV).

**Note on duplication:** Chunk 6 paste re-included the SurrealDB comparison table (already in C4-F). Skipping — only Section 7 captured below.

### [C6-A] RRO Section 7 — Kernel IP Integration

**Stated framing:**
> "Each kernel component lives in RRO."

This section explicitly maps four well-known IR/ML techniques (RAG, CAG, HMM, RKYV) to their RRO implementations. They are not separate subsystems — they are kernel methods inside the `impl RRO` block.

### [C6-B] Section 7.1 — RAG (Retrieval-Augmented Generation)

#### [C6-B-1] `rag_search` implementation (verbatim Rust)

```rust
impl RRO {
    /// Hybrid search: dense + sparse + RRF fusion
    pub async fn rag_search(&self, query: &str, opts: RagOptions) -> Result<Vec<ScoredObject>> {
        // 1. Embed query (0.6B embedder)
        let dense = self.decision_engine.embed(query).await?;
        let sparse = self.decision_engine.sparse_encode(query);

        // 2. Search vector backend (both dense and sparse)
        let vector_backend = self.get_backend(BackendType::Vector)?;

        let dense_results = vector_backend.query(&BackendQuery::Dense {
            vector: dense.clone(),
            top_k: opts.candidate_count,
            filter: opts.filter.clone(),
        }).await?;

        let sparse_results = vector_backend.query(&BackendQuery::Sparse {
            tokens: sparse.clone(),
            top_k: opts.candidate_count,
            filter: opts.filter.clone(),
        }).await?;

        // 3. RRF fusion
        let fused = self.rrf_fuse(&dense_results, &sparse_results, opts.rrf_k);

        // 4. Cross-encoder rerank (0.6B reranker)
        let reranked = self.decision_engine.rerank(query, &fused, opts.rerank_top_k).await?;

        Ok(reranked)
    }
}
```

#### [C6-B-2] `rrf_fuse` — Reciprocal Rank Fusion (verbatim Rust)

```rust
fn rrf_fuse(&self, a: &[ScoredObject], b: &[ScoredObject], k: f32) -> Vec<ScoredObject> {
    // Reciprocal Rank Fusion
    // score = Σ 1 / (k + rank)
    let mut scores: HashMap<ObjectId, f32> = HashMap::new();

    for (rank, obj) in a.iter().enumerate() {
        *scores.entry(obj.id.clone()).or_default() += 1.0 / (k + rank as f32 + 1.0);
    }
    for (rank, obj) in b.iter().enumerate() {
        *scores.entry(obj.id.clone()).or_default() += 1.0 / (k + rank as f32 + 1.0);
    }

    // Sort by fused score
    let mut results: Vec<_> = scores.into_iter().collect();
    results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    // Hydrate and return
    results.into_iter()
        .filter_map(|(id, score)| {
            self.hydrate(&id).ok().map(|obj| ScoredObject { obj, score })
        })
        .collect()
}
```

**Captured: 4-step RAG pipeline:**
1. Embed query — 0.6B embedder + sparse_encode (BM25 tokens)
2. Search vector backend — dense + sparse, both with `candidate_count` top-k
3. RRF fusion — combine ranked lists with Reciprocal Rank Fusion
4. Cross-encoder rerank — 0.6B reranker, returns `rerank_top_k`

### [C6-C] Section 7.2 — CAG (Context-Augmented Generation)

#### [C6-C-1] `cag_prefetch` implementation (verbatim Rust)

```rust
impl RRO {
    /// Pre-generate context BEFORE the hop executes
    pub async fn cag_prefetch(&self, session: &SessionContext) -> Result<PrefetchedContext> {
        // 1. HMM predicts what user will likely need next
        let predicted_concepts = self.hmm.predict_next_concepts(&session.recent_turns)?;

        // 2. Pre-fetch objects matching those concepts
        let mut prefetched = Vec::new();

        for concept in &predicted_concepts {
            let objects = self.rag_search(
                &concept.to_query_string(),
                RagOptions {
                    candidate_count: 20,
                    rerank_top_k: 5,
                    ..Default::default()
                }
            ).await?;

            prefetched.extend(objects);
        }

        // 3. Dedupe and store in hot cache
        let deduped = self.dedupe_by_id(prefetched);
        self.cache.prefetch_store(&session.id, deduped.clone()).await?;

        // 4. Structure as JSON with YAML instructions (ready for LLM prompt)
        let structured = self.structure_for_llm(&deduped)?;

        Ok(PrefetchedContext {
            objects: deduped,
            structured_context: structured,
            predicted_concepts,
            prefetch_timestamp: Instant::now(),
        })
    }
}
```

#### [C6-C-2] `structure_for_llm` — JSON+YAML for LLM consumption (verbatim Rust)

```rust
/// Structure objects for LLM consumption
/// JSON payload with YAML instruction headers
fn structure_for_llm(&self, objects: &[ScoredObject]) -> Result<StructuredContext> {
    let instructions = r#"
# Context Instructions
- Process each item methodically
- Relationships indicate semantic connections
- Relevance scores are pre-computed by cross-encoder
- Summaries are authoritative; full content available if needed
"#.to_string();

    let payload = serde_json::json!({
        "items": objects.iter().map(|o| {
            serde_json::json!({
                "id": o.obj.id,
                "kind": format!("{:?}", o.obj.kind),
                "summary": o.obj.reasoning_metadata.summary,
                "relevance": o.score,
                "concepts": o.obj.reasoning_metadata.concepts,
                "relations": o.obj.relations,
            })
        }).collect::<Vec<_>>(),
        "total_tokens": objects.iter()
            .map(|o| o.obj.reasoning_metadata.token_count)
            .sum::<u32>(),
    });

    Ok(StructuredContext {
        instructions,
        payload,
        format_version: 1,
    })
}
```

**Captured: 4-step CAG pipeline:**
1. HMM predicts next-needed concepts from recent turns
2. Pre-fetch via `rag_search` for each concept (candidate_count=20, rerank_top_k=5)
3. Dedupe by ID → store in hot cache (`cache.prefetch_store`)
4. Structure as JSON+YAML for immediate LLM consumption

**Captured: Verbatim YAML instruction text shipped to LLM:**
> "Process each item methodically / Relationships indicate semantic connections / Relevance scores are pre-computed by cross-encoder / Summaries are authoritative; full content available if needed"

### [C6-D] Section 7.3 — HMM (Hidden Markov Model for State Prediction)

#### [C6-D-1] `HMM` struct (verbatim Rust)

```rust
/// Context swapping and state prediction
pub struct HMM {
    /// Transition probabilities between states
    transition_matrix: TransitionMatrix,

    /// Emission probabilities (what objects are accessed in each state)
    emission_matrix: EmissionMatrix,

    /// Current state distribution
    state_distribution: StateDistribution,
}
```

#### [C6-D-2] `predict_next_concepts` (verbatim Rust)

```rust
impl HMM {
    /// Predict what concepts will be needed next
    pub fn predict_next_concepts(&self, recent_turns: &[Turn]) -> Result<Vec<Concept>> {
        // 1. Observe recent turn sequence
        let observations = self.extract_observations(recent_turns);

        // 2. Run Viterbi to find most likely current state
        let current_state = self.viterbi(&observations)?;

        // 3. Use transition matrix to predict next state
        let next_state_probs = self.transition_matrix.get_row(current_state);

        // 4. Use emission matrix to get likely concepts for predicted states
        let mut concept_scores: HashMap<ConceptId, f32> = HashMap::new();

        for (state, prob) in next_state_probs.iter().enumerate() {
            if *prob > 0.1 {  // Only consider probable states
                let emissions = self.emission_matrix.get_row(state);
                for (concept, emission_prob) in emissions {
                    *concept_scores.entry(concept.clone()).or_default() += prob * emission_prob;
                }
            }
        }

        // 5. Return top-k concepts
        let mut concepts: Vec<_> = concept_scores.into_iter().collect();
        concepts.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        Ok(concepts.into_iter().take(10).map(|(c, _)| c).collect())
    }

    /// Update HMM from observed behavior (online learning)
    pub fn update(&mut self, observation: &Observation) {
        // Baum-Welch update or similar
        // This is where the system learns user patterns over time
    }
}
```

**Captured: 5-step HMM prediction:**
1. Extract observations from recent turn sequence
2. Run Viterbi → most likely current state
3. Transition matrix → predict next state probabilities
4. Emission matrix → score concepts for probable states (threshold 0.1)
5. Return top-10 concepts

**Captured: Online learning hook:** `HMM::update(&mut self, observation)` — Baum-Welch or similar. Comment: "This is where the system learns user patterns over time."

### [C6-E] Section 7.4 — RKYV (Zero-Copy Serialization)

#### [C6-E-1] Three serialization tiers (verbatim Rust)

```rust
use rkyv::{Archive, Deserialize, Serialize, archived_root, to_bytes};

impl RRO {
    /// Internal transfer: zero-copy via rkyv
    pub fn internal_transfer<T: Archive>(&self, data: &T) -> ArchivedRef<T> {
        // No JSON, no serde_json::to_string
        // Direct memory mapping
        let bytes = to_bytes::<_, 256>(data).unwrap();
        unsafe { archived_root::<T>(&bytes) }
    }

    /// External API: Structured JSON with YAML instructions for LLM consumption
    pub fn external_encode(&self, objects: &[ReasoningObject]) -> StructuredContext {
        self.structure_for_llm(objects).unwrap()
    }

    /// MCP boundary: JSON-RPC (compatibility at perimeter only)
    pub fn mcp_encode(&self, response: &McpResponse) -> String {
        serde_json::to_string(response).unwrap()
    }
}
```

**Captured: Three serialization boundaries:**
- **Internal** — rkyv zero-copy via `archived_root`. No JSON. Direct memory mapping.
- **External (LLM)** — Structured JSON with YAML instructions via `structure_for_llm`.
- **MCP perimeter** — JSON-RPC for compatibility. Only at the outermost boundary.

### [C6-F] FLAGS — contradictions / open items in Chunk 6

| # | Source | Issue |
|---|---|---|
| F-6.1 | C6-B-1 | RAG uses `decision_engine.embed` + `decision_engine.sparse_encode`. The DecisionEngine owns BOTH dense and sparse encoding. Sparse encoder is BM25 tokens — not a separate model, just lexical. Confirms encoder/embedder boundary: 0.6B model handles dense, BM25 handles sparse. |
| F-6.2 | C6-B-2 | `rrf_fuse` k parameter — RRF requires a constant k (typically 60). Spec passes `opts.rrf_k`. Configurable per query. |
| F-6.3 | C6-C-1 | CAG prefetch uses `candidate_count: 20, rerank_top_k: 5` — hardcoded numerics inside the function. Should likely be derived from mode (general vs scientific_research). |
| F-6.4 | C6-C-2 | `structure_for_llm` instructions are hardcoded English text. Localization not addressed. |
| F-6.5 | C6-D-1 | `HMM` struct uses `TransitionMatrix`, `EmissionMatrix`, `StateDistribution` — these types not defined in the spec. Implementation detail flagged for separate type catalog. |
| F-6.6 | C6-D-2 | `concept_scores` threshold `0.1` is a magic number. Configurable in `rro.toml`? Not specified. |
| F-6.7 | C6-D-2 | `take(10)` for top-k concepts — hardcoded. Should be configurable via `RagOptions` or mode. |
| F-6.8 | C6-D-2 | `update` method has placeholder body: "Baum-Welch update or similar. This is where the system learns user patterns over time." Implementation deferred. |
| F-6.9 | C6-E-1 | rkyv `to_bytes::<_, 256>` — 256-byte scratch space. Reasonable for small objects but may need to grow for large ReasoningObjects. |
| F-6.10 | C6-E-1 | Three `.unwrap()` calls in serialization paths — one for rkyv, one for structure_for_llm, one for serde_json. Production code should propagate errors. |
| F-6.11 | C6-A scope | Section title "Kernel IP Integration" — uses "kernel" to mean RRO's internal methods, NOT the DevPulse `kernel/` crate. Naming collision with KERNEL_ARCHITECTURE.md. Worth clarifying during consolidation. |

---

*End of Chunk 6. Awaiting Chunk 7.*

---

## CHUNK 7 — RRO v1.1.0 BODY (Sections 8-13: Write Path, Read Path, Recovery, Implementation, API, Distribution, Changelog)

**Source metadata:** RRO: Reasoning Ready Objects v1.1.0, 2026-03-14, DRAFT — sections 8 through end.

### [C7-A] RRO Section 8 — Write Path

```
Event (signal, user input, file change)
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ Decision Engine: "Where does this belong?"          │
│                                                      │
│ 1. Embed content (0.6B)                             │
│ 2. Extract relationships                            │
│ 3. Compute metadata (tokens, summary, concepts)     │
│ 4. Create ReasoningObject                           │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ Parallel Write (all relevant backends)              │
│                                                      │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Vector  │ │Relational│ │  Graph  │ │Analytics│    │
│ │ (Qdrant)│ │ (libSQL) │ │(Surreal)│ │(DuckDB) │    │
│ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘    │
│      │          │          │          │             │
│      └──────────┴──────────┴──────────┘             │
│                     │                                │
│                     ▼                                │
│              Moka Hot Cache                          │
│              (immediate access)                      │
└─────────────────────────────────────────────────────┘
```

**Captured: 4-step write decision phase + parallel multi-backend write + Moka hot-cache write.**

### [C7-B] RRO Section 9 — Read Path

```
Query (user question, context assembly)
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ Decision Engine: "What's the optimal strategy?"     │
│                                                      │
│ 1. Check hot cache (Moka) → hit? return immediately │
│ 2. Embed query (0.6B)                               │
│ 3. Check mode (general vs scientific_research)      │
│ 4. Plan query strategy (which backends, fusion?)    │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ Execute Strategy                                     │
│                                                      │
│ General Mode:                                        │
│   → Vector search (dense + sparse + RRF)            │
│   → Rerank top-k                                    │
│   → Return                                          │
│                                                      │
│ Scientific Research Mode:                            │
│   → Vector search                                   │
│   → Graph traversal (related concepts)              │
│   → Relational join (metadata enrichment)           │
│   → Analytics query (usage patterns)                │
│   → Full fusion                                     │
│   → Deep rerank                                     │
│   → Provenance tracking                             │
│   → Return with citations                           │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ Response Assembly                                    │
│                                                      │
│ 1. RKYV deserialization (zero-copy)                 │
│ 2. TOON encoding (for LLM context)                  │
│ 3. Update hot cache                                 │
│ 4. Return ReasoningReadyContext                     │
└─────────────────────────────────────────────────────┘
```

**Mode-specific behavior captured:**

- **General Mode** — Vector (dense + sparse + RRF) → Rerank top-k → Return
- **Scientific Research Mode** — Vector + Graph traversal + Relational join + Analytics query → Full fusion → Deep rerank → Provenance → Return with citations

**Response assembly: 4 steps** — RKYV deserialization (zero-copy), TOON encoding, hot cache update, return ReasoningReadyContext.

### [C7-C] RRO Section 10 — Recovery & Safety

**Stated invariant:**
> "libSQL remains SSOT. If any backend corrupts:"

**Recovery paths (per backend):**

| Backend | Recovery Strategy | Data Loss |
|---|---|---|
| SurrealDB corrupt | Rebuild graph from libSQL relations | Zero |
| Qdrant corrupt | Re-embed all content from libSQL | Zero |
| DuckDB corrupt | Replay analytics from libSQL event log | Zero |
| Moka dies | Volatile, nothing to recover; warm up from other backends on restart | N/A |

### [C7-D] RRO Section 11 — Implementation Checklist (5 phases)

**Phase 1: Core Traits & Types**
- shared/src/rro/mod.rs
- shared/src/rro/types.rs (ReasoningObject, ObjectKind, etc.)
- shared/src/rro/traits.rs (RROBackend trait)
- shared/src/rro/config.rs (Config parsing)
- shared/src/rro/query.rs (Query types, strategies)

**Phase 2: Decision Engine**
- orchestrator/src/rro/engine/mod.rs
- orchestrator/src/rro/engine/embedder.rs (wrap existing 0.6B)
- orchestrator/src/rro/engine/reranker.rs (wrap existing 0.6B)
- orchestrator/src/rro/engine/router.rs (query planning)
- orchestrator/src/rro/engine/fusion.rs (RRF implementation)

**Phase 3: Backend Implementations**
- orchestrator/src/rro/backends/mod.rs
- orchestrator/src/rro/backends/qdrant.rs (your fork)
- orchestrator/src/rro/backends/libsql.rs
- orchestrator/src/rro/backends/surrealdb.rs
- orchestrator/src/rro/backends/duckdb.rs
- orchestrator/src/rro/backends/moka.rs

**Phase 4: Kernel IP**
- orchestrator/src/rro/kernel/mod.rs
- orchestrator/src/rro/kernel/rag.rs (hybrid search + RRF + rerank)
- orchestrator/src/rro/kernel/cag.rs (prefetch, TOON encoding)
- orchestrator/src/rro/kernel/hmm.rs (state prediction)
- orchestrator/src/rro/kernel/rkyv.rs (zero-copy helpers)

**Phase 5: Remote Backends (Optional)**
- orchestrator/src/rro/backends/remote/pinecone.rs
- orchestrator/src/rro/backends/remote/postgres.rs
- orchestrator/src/rro/backends/remote/neo4j.rs
- orchestrator/src/rro/backends/remote/clickhouse.rs

### [C7-E] RRO Section 12 — API Surface

```rust
// The main entry point
pub struct RRO {
    config: RROConfig,
    decision_engine: DecisionEngine,
    backends: HashMap<BackendType, Box<dyn RROBackend>>,
    hmm: HMM,
}

impl RRO {
    // Lifecycle
    pub async fn init(config: RROConfig) -> Result<Self>;
    pub async fn shutdown(&self) -> Result<()>;

    // Core operations
    pub async fn search(&self, query: &str, opts: SearchOptions) -> Result<Vec<ScoredObject>>;
    pub async fn upsert(&self, obj: ReasoningObject) -> Result<()>;
    pub async fn delete(&self, id: &ObjectId) -> Result<bool>;

    // Kernel IP
    pub async fn rag_search(&self, query: &str, opts: RagOptions) -> Result<Vec<ScoredObject>>;
    pub async fn cag_prefetch(&self, session: &SessionContext) -> Result<PrefetchedContext>;
    pub fn hmm_predict(&self, turns: &[Turn]) -> Result<Vec<Concept>>;

    // Mode switching
    pub fn set_mode(&mut self, mode: QueryMode);
    pub fn current_mode(&self) -> QueryMode;

    // Health & diagnostics
    pub async fn health(&self) -> HealthReport;
    pub async fn sync_all(&self) -> Result<SyncReport>;
}
```

**Captured 5 API categories:**
1. Lifecycle (init, shutdown)
2. Core operations (search, upsert, delete)
3. Kernel IP (rag_search, cag_prefetch, hmm_predict)
4. Mode switching (set_mode, current_mode)
5. Health & diagnostics (health, sync_all)

### [C7-F] RRO Section 13 — Open-Source Distribution Model

#### [C7-F-1] Section 13.1 — Crate Structure (verbatim)

```
rro/                           # Root crate (published to crates.io)
├── Cargo.toml
├── src/
│   ├── lib.rs                 # Public API
│   ├── types/                 # ReasoningObject, ObjectKind, etc.
│   ├── traits/                # RROBackend, DecisionEngine traits
│   ├── config/                # Config parsing, validation
│   └── query/                 # Query types, strategies
│
├── rro-backends/              # Optional backend crates
│   ├── rro-qdrant/            # Qdrant implementation
│   ├── rro-libsql/            # libSQL implementation
│   ├── rro-surrealdb/         # SurrealDB implementation
│   ├── rro-duckdb/            # DuckDB implementation
│   └── rro-moka/              # Moka cache implementation
│
├── rro-kernel/                # Kernel IP (separate crate, same repo)
│   ├── rag/                   # Hybrid search + RRF + rerank
│   ├── cag/                   # Prefetch, context structuring
│   ├── hmm/                   # State prediction
│   └── rkyv/                  # Zero-copy helpers
│
└── rro-decision/              # 0.6B decision engine
    ├── embedder/
    ├── reranker/
    └── router/
```

#### [C7-F-2] Section 13.2 — Feature Flags (verbatim)

```toml
[features]
default = ["qdrant", "libsql", "moka"]

# Backends
qdrant = ["rro-qdrant"]
libsql = ["rro-libsql"]
surrealdb = ["rro-surrealdb"]
duckdb = ["rro-duckdb"]
moka = ["rro-moka"]

# Remote backends (optional)
remote-pinecone = ["rro-backends/pinecone"]
remote-postgres = ["rro-backends/postgres"]
remote-neo4j = ["rro-backends/neo4j"]

# Kernel components
kernel-full = ["rag", "cag", "hmm", "rkyv"]
rag = ["rro-kernel/rag"]
cag = ["rro-kernel/cag"]
hmm = ["rro-kernel/hmm"]

# Decision engine (requires models)
decision-engine = ["rro-decision"]
```

#### [C7-F-3] Section 13.3 — Usage Examples (verbatim)

**Minimal (just vector search):**

```rust
use rro::prelude::*;

let rro = RRO::builder()
    .with_backend(QdrantBackend::embedded("./vectors"))
    .build()
    .await?;

let results = rro.search("find auth bugs", SearchOptions::default()).await?;
```

**Full DevPulse stack:**

```rust
use rro::prelude::*;
use rro_kernel::{rag, cag, hmm};
use rro_decision::DecisionEngine;

let rro = RRO::builder()
    .with_backend(QdrantBackend::embedded("./vectors"))
    .with_backend(LibSqlBackend::embedded("./state.db"))
    .with_backend(SurrealDbBackend::embedded("./graph"))
    .with_backend(DuckDbBackend::embedded("./analytics.duckdb"))
    .with_backend(MokaBackend::new(MokaConfig::devpulse_defaults()))
    .with_decision_engine(DecisionEngine::load("./models/qwen3-0.6b")?)
    .with_kernel(KernelConfig {
        rag: rag::Config::default(),
        cag: cag::Config::default(),
        hmm: hmm::Config::default(),
    })
    .build()
    .await?;
```

#### [C7-F-4] Section 13.4 — Qdrant Relationship (verbatim table)

| Status | Details |
|---|---|
| Current | Star Ambassador |
| Interest | Partnership discussions, potential acquisition |
| Compatibility | RRO can use stock Qdrant as vector backend |
| Differentiation | RRO adds reasoning layer, decision engine, multi-backend orchestration |
| Not competing on | Raw vector performance |
| Competing on | Reasoning-ready context assembly, CAG, HMM, mode-switching |

#### [C7-F-5] Section 13.5 — Community Extensibility

**Five extensibility points** (config-driven architecture):

1. Add new backends — Implement RROBackend trait
2. Customize decision logic — Swap DecisionEngine implementation
3. Create new modes — Add to QueryMode enum, implement strategy
4. Extend kernel — Add new kernel components alongside RAG/CAG/HMM
5. Custom serialization — Replace JSON+YAML with whatever works

**Open questions for community (verbatim):**
- Best practices for multi-tenant RRO?
- Edge deployment patterns (WASM, mobile)?
- Streaming/real-time modes?

### [C7-G] Changelog (verbatim)

| Version | Date | Changes |
|---|---|---|
| 1.1.0 | 2026-03-14 | Dropped TOON (dead in 2026), using structured JSON + YAML instructions. Added open-source distribution model. Clarified Qdrant partnership. |
| 1.0.0 | 2026-03-14 | Initial spec from consolidated conversations |

**Closing note (verbatim):**
> "This document derived from hundreds of hours of discussion. PHILOSOPHY.md governs."

### [C7-H] FLAGS — contradictions / open items in Chunk 7

| # | Source | Issue |
|---|---|---|
| F-7.1 | C7-B Read Path "TOON encoding" | Contradicts Changelog [C7-G] which says TOON was DROPPED in v1.1.0. The Read Path diagram still references TOON encoding even though the changelog says it was replaced with JSON+YAML. Stale text in v1.1.0 spec. |
| F-7.2 | C7-D Phase 4 "cag.rs (prefetch, TOON encoding)" | Same TOON contradiction — Phase 4 line still says "TOON encoding" in the comment. Spec needs scrub. |
| F-7.3 | C7-D paths "shared/src/rro/" + "orchestrator/src/rro/" | Path structure references both `shared/` and `orchestrator/` — contradicts owner memory rule "NO `shared/` — only kernel/systems/interfaces/config" (March 2026 path-structure correction). Spec written before that correction. |
| F-7.4 | C7-C "libSQL remains SSOT" | Locked invariant — if any backend corrupts, libSQL is the recovery source. All other backends are derived from libSQL. Worth elevating to a top-level invariant during consolidation. |
| F-7.5 | C7-E `pub fn hmm_predict` | API method is sync (`fn`, not `async fn`) while RAG/CAG are async. Implementation detail — HMM prediction stays in-memory, no I/O. |
| F-7.6 | C7-F-1 crate structure | Two distinct crate trees defined: (1) `rro/` standalone open-source root, (2) `orchestrator/src/rro/` from Phase 1-5. Need to clarify if these are the SAME tree (with workspace structure) or TWO separate codebases. |
| F-7.7 | C7-F-3 "DevPulse defaults" | `MokaConfig::devpulse_defaults()` factory method implies DevPulse-specific config presets shipped with the open-source crate. May need to extract DevPulse defaults into a separate non-OSS crate. |
| F-7.8 | C7-F-4 Qdrant relationship | "Potential acquisition" path — strategic context. Affects whether RRO crate publishes to crates.io independently or stays internal until partnership clarifies. |
| F-7.9 | C7-G changelog | v1.0.0 and v1.1.0 both dated 2026-03-14 — same day. Suggests v1.0.0 was internal-only and v1.1.0 was the first public version. |
| F-7.10 | C7-D paths "TOON encoding" reference | TOON references in source comments (Phase 4 cag.rs description) need cleanup pass. |

---

*End of Chunk 7. Awaiting Chunk 8 (or signal that RRO v1.1.0 spec is complete).*

---

## CHUNK 8 — clyffy/DevPulse Master Specification (December 2024)

**Source metadata:** Document Version 1.0, Generated December 2024. Marked "All decisions are LOCKED" but predates current stack by ~17 months. This is the EARLIEST captured spec — historical reference, NOT current truth.

### [C8-A] Executive Summary

> "clyffy/DevPulse is a local-first AI coding assistant that prioritizes Return on Time Invested (ROTI) through intelligent context management, memory persistence, and governance enforcement. Unlike cloud-dependent chatbots, clyffy runs primarily on user hardware with optional API escalation for complex tasks."

### [C8-B] Core Philosophy: The Ruminating Assistant

> "clyffy 'ruminates' - continuously processing, compacting, and preparing context so that when the user needs help, the right information is immediately available."

Achieved through:
- Two-layer Ruminator (typing-time and send-time)
- Intelligent memory staging
- Proactive retrieval

### [C8-C] Complete Technology Stack (Dec 2024 baseline — STALE)

| Component | Implementation | Notes |
|---|---|---|
| Primary LLM | Qwen3-14B Q3_K_M | Baseline for 8GB+ VRAM |
| Embedder | Nomic 0.6B | CPU-offloaded, 2 collections/project |
| Reranker | Jina v3 (local) | CPU-offloaded |
| Vector Store | Qdrant | Per-project collections |
| SSOT Database | Postgres | All canonical data |
| Analytics | DuckDB | Telemetry, dashboards |
| Vision | SigLIP/SigLIP2 | Screenshot embeddings |
| STT | Whisper | Voice input |
| Protocol | MCP | External tool integration |
| Inference | llama.cpp + KvCache | Local LLM runtime |
| Retrieval | HyDE (toggle) | Hypothetical doc expansion |

### [C8-D] Part 1 — Foundation Contracts (SSOT)

> "These contracts are enforced by Rust, used by Python, and surfaced in the UI."

| Contract | Enforced By | Used By | Surfaced In |
|---|---|---|---|
| ContextFrame | Rust | Python | UI (what LLM sees) |
| MemoryItem | Rust | Python | UI (memory inspector) |
| RetrievalResult | Rust | Python | UI (retrieval debug) |
| TraceStep/RunTrace | Rust | Python | UI (Cortex Viewer) |
| ToolSpec | Rust | Python/MCP | UI (permissions) |
| PolicySpec | Rust | Python | UI (governance) |

### [C8-E] Part 2 — Project Isolation

**Rule:** No query can execute without `project_id`. Enforced at Rust boundary.

- **Qdrant** — Separate collection per project: `{project_id}_text` and `{project_id}_code`
- **Postgres** — Single tables with `project_id` column + Row Level Security (RLS)
- **Enforcement** — Rust boundary validates `project_id` before any query reaches Python. Filter injected at ToolSpec/PolicySpec boundary.

### [C8-F] Part 3 — Kernel State Machine (8 states — matches C1-B)

| State | Description |
|---|---|
| Idle.Observe | Connectors, watchers, telemetry intake |
| Idle.Maintain | CPU-only background: embed/reweight/dedupe |
| Active.Triage | Classify user intent |
| Active.Retrieve | Fetch context from memory/repo |
| Active.Generate | LLM response generation |
| Active.Validate | Costar + Verified Artifacts gate |
| Reflect.Writeback | Ruminate + memory staging (mandatory) |
| Halt.Pause | Hard stop after N critical failures |

**Transitions:**
- Observe → Maintain: background queue non-empty + budgets allow
- Any state → Active.Triage: user interaction (PREEMPT)
- Generate → Validate: ALWAYS for actions (writes/exec/offload/api)
- Validate fail → Generate: self-correct attempt
- Validate fail (N times) → Halt.Pause: N=3 default, user configurable
- Reflect.Writeback: runs after EVERY completed interaction (mandatory)

**User Active Signals:** Keystrokes in IDE, mouse movement/clicks, active window = IDE, chat typing, build/test running

**Wake Events:** AppStart + IDE/BrowsersDetected, UserMessageSubmitted, ChatTypingDebounced, FileSaved, DiagnosticsChanged, Build/Test Started/Failed, TimerTick

**Preemption Rules:**
- Interactive lane events preempt ALL background work immediately
- CPU-only background may continue if under budget and not blocking interactive
- Hard stop after N serious critical fix attempts (default N=3)

### [C8-G] Part 4 — Depth Slider

| Mode | Behavior |
|---|---|
| Tactical (512) | Fast, focused excerpts for quick tasks |
| Deep (1024) | Strategic, expanded context via adjacent chunk expansion |

> "Slider controls INJECTION size, not canonical chunk size. Canonical chunks stay stable (no re-index cost)."

### [C8-H] Part 5 — Chunking Strategy

| Parameter | repo_code | repo_text |
|---|---|---|
| Method | AST-first (tree-sitter) | Structure-first (headings/paragraphs) |
| Canonical Size | ~512 tokens | ~512-768 tokens |
| Overlap | 0% when AST clean, ~64 tokens at splits | ~96 tokens (~18-20%) |
| Lang Detect | Extension → tree-sitter → fallback | Extension → tree-sitter → fallback |
| Diff Updates | Re-chunk file → re-embed changed via hash | Re-chunk file → re-embed changed via hash |

**Storage Split:**
- Postgres: canonical text + metadata + hash + provenance (SSOT)
- Qdrant: chunk_id + embedding + short snippet + metadata filters

### [C8-I] Part 6 — Retrieval Pipeline

```
Query → Nomic 0.6B → [HyDE if Deep or low confidence] → Qdrant → Jina v3 Rerank → Top-K
```

**Routing:** Intent-based routing + fallback to both collections when low confidence
**Fusion:** Retrieve per collection → union → single Jina v3 rerank across the union

**Top-K (Slider-Aware):**

| Profile | Mode | Candidates | Injected |
|---|---|---|---|
| Engineer (32GB) | Tactical | 24/12 (code/text) | 6 × 512 |
| Engineer (32GB) | Deep | 32/16 (code/text) | 3 × 1024 |
| Architect (64GB) | Tactical | 48/24 (code/text) | 10 × 512 |
| Architect (64GB) | Deep | 64/32 (code/text) | 8 × 1024 |

**HyDE Gating:** OFF in Tactical (default), ON in Deep, auto-trigger when retrieval confidence low

### [C8-J] Part 7 — Ruminator (Two-Layer, NOT four)

**Typing-Time (debounced 250-400ms, cheap):**
- Quick intent guess
- Prefetch retrieval candidates
- Update 'working set plan' (shown in Cortex Viewer)

**Send-Time (full, every turn):**
- rolling_summary (512 or 1024 per slider)
- anchors (must-keep facts)
- open_loops (actionables/unresolved)
- drop_list (safe to discard)
- Update memory stage weights + retrieval boosts

### [C8-K] Part 8 — Context Packing Budgets

**Engineer Profile (14B, ~8K effective):**

| Slot | Tactical | Deep |
|---|---|---|
| System+profile | 700 | 800 |
| Ruminate | 512 | 1024 |
| Retrieved | 3072 (6×512) | 3072 (3×1024) |
| Active diffs/errors | 1400 | 1300 |
| Recent turns | 500 | 500 |
| User msg | 300 | 300 |
| Reserve | 1516 | 1004 |

**Architect Profile (32B, ~16K effective):**

| Slot | Tactical | Deep |
|---|---|---|
| System+profile | 900 | 1100 |
| Ruminate | 512 | 1024 |
| Retrieved | 5120 (10×512) | 8192 (8×1024) |
| Active diffs/errors | 3500 | 3800 |
| Recent turns | 900 | 900 |
| User msg | 500 | 500 |
| Reserve | 4568 | 484 |

**Drop Order (ROTI-optimized):**
1. Lowest rerank score retrieved chunks
2. Shrink chunks to excerpts (not summaries)
3. Reduce active files to diff windows
4. Drop oldest verbatim turns
5. Truncate Ruminate but preserve anchors/open loops

**Citation Format:** Inline `[src:file:Lx-Ly|chunk:id]` + deduped Sources block

### [C8-L] Part 9 — Memory Lifecycle

| Stage | TTL | Description |
|---|---|---|
| Hot (Short/Session) | 24h or session end | Working set, active context |
| Warm (Medium/Project) | 30 days | Episodic, Ruminate summaries |
| Cold (Long/Global) | 180 days | Archive |
| Frozen (Critical) | Forever | Immutable, tamper-evident |

**Promotion Triggers:** Access spike, recency, matches task, error repeats, Ruminate-driven
**Demotion Triggers:** Not accessed N days, redundant, low score, summarized
**Frozen Implementation:** Postgres append-only SSOT, every entry has `content_hash`, hash chain for tamper-evidence

### [C8-M] Part 10 — Verified Artifacts Pipeline

```
Provisional → Verifying → Verified → Promoted
                ↓
           Rejected (terminal, stderr + trace back to agent)
```

| State | Description |
|---|---|
| Provisional | Written only to `.devpulse/staging` |
| Verifying | Tier 1 syntax, Tier 2 unit/logic sandbox |
| Verified | Promote into repo, store hash |
| Rejected | Terminal, feedback to agent |

**Preemption Hook (Rust supervisor can interrupt Python):** Critical Stress, Infinite Loop, Watchdog timeout

### [C8-N] Part 11 — Costar (Gatekeeper)

**Gates (runs BEFORE action):**
- File writes / patches
- Test/build exec
- Offload + API sends
- Memory writes with potential secrets/PII
- External 'scribe exports'
- Seamless typing to external apps

**Override Tiers:**

| Tier | Behavior |
|---|---|
| Hard block | No override (secrets, credentials, forbidden paths) |
| Soft block | Override with signed reason (logged) |
| Educational | Acknowledge + proceed (logged) |

### [C8-O] Part 12 — Correction Memory (Anti-Fragility)

**Trigger:** User says 'wrong/stupid/no'

**Capture:**
- The claim that was wrong
- The correction
- `trace_id` + context sources
- Implied rule/preference

**Storage:** Warm → Frozen if governance-level ('never do X again')

**Use:**
- Retrieval boost/avoid
- Costar checks (prevent repeating known bad patterns)

### [C8-P] Part 13 — Scribe Stage

**Targets v1:** Cursor, Bolt, Lovable, Replit, Windsurf, Kira-style, Codex, user-defined

**Delivery Modes:**
- Scribe UI: Preview + copy/paste (tweakable recipes)
- MCP integration: External tools call DevPulse directly
- Seamless typing: DevPulse types into IDE/browser (explicit permission, per-session, revocable)

**Pipeline:** Draft → Plan → Pack (ContextFrame) → Preview (recipe editor) → Execute

**Customizations:**
- Target-specific 'vibe adapters'
- Knowledge bits / constraints
- Cloned recipes with starting templates ('antigravity presets')

### [C8-Q] Part 14 — MCP Tool Registry v1

**Categories:**
- read-only: no approval required
- write: always gated
- exec: always gated
- network: disabled by default

**Read Tools (No Approval):** repo.search, repo.list_files, repo.get_file, repo.get_diff, repo.get_symbols, repo.find_references, git.status, git.diff, memory.search, memory.get, context.get_frame, diagnostics.get, build.status

**Exec Tools (Gated):** test.run, lint.run, format.run, build.run

**Write Tools (Gated):** file.apply_patch (default), file.write (allowed but discouraged)

**Internal Only (Not MCP-Exposed):** shell.exec, network.fetch (disabled by default)

### [C8-R] Part 15 — Simulation / Playground

**Behavior:**
- Ephemeral sandbox workspace
- Evaporates after 30 days unless saved
- UI shows countdown + Save/Extend/Export/Delete actions
- Temperature = 0 for determinism

**Eviction Thresholds:**
- Disk tight: free space < 20% → trigger early eviction
- Workspace caps: > 20 workspaces OR > 50 GB total

**Eviction Order:**
1. Oldest unsaved sandbox workspaces
2. Oldest saved-but-exportable (after warning)

**Version Pinning:** Model, embedder, reranker, prompt recipe, tool registry, repo state (git commit hash)

**Assertions:** retrieval_contains, governance_passed/blocked, tool_sequence, response_includes_fix, no_secrets_leaked (hard)

### [C8-S] Part 16 — Commit Hooks

**Hooks v1:** pre-commit, pre-push (commit-msg optional later)

**Hard Blocks:** Secrets detected, forbidden paths/imports, failing tests (if policy), failing lint/format (if policy)

Wired to Costar → Verified Artifacts pipeline

### [C8-T] Part 17 — Escalation Policy

**Order:** Local → Offload → API

**Consent Rules:**
- Any offload/API visible in Cortex Viewer + trace
- Scope expansion requires confirmation
- PII/secrets triggers block + redaction/preview flow

**Cost Projection:**
- Display: per-run estimate, running total, projected month
- User sets max $/month (hard cap) and max $/run (warn+confirm)

**Offload Trust:**
- Default: 'user-owned but external-risk' (same scope/PII rules as API, no $ cost)
- Optional: mark as 'trusted LAN box' to reduce prompts

### [C8-U] Part 18 — Job Persistence

**Decision:** Postgres job table (no Redis dependency in v1)

**Outbox Pattern:**
- Postgres commit first
- Qdrant updates async via outbox worker
- Qdrant corrupt → rebuild from Postgres

### [C8-V] Part 19 — Crash Recovery

| Job State | On Restart |
|---|---|
| Running | Prompt user: resume/retry/mark failed |
| Queued | Resume |
| Completed | No action |
| Failed | Preserved for inspection |

**Idempotency:**
- Every write/exec has `idempotency_key`
- Patch tools detect 'already applied' → no-op
- Traces record executed vs skipped

**Auto-Retry:**
- Read-only jobs: auto-retry
- Write/exec: user preference per tool class

### [C8-W] Part 20 — Baseline Hardware Profile

| Component | Specification |
|---|---|
| GPU VRAM | 8GB+ (RTX 3070 or higher) |
| System RAM | 32GB |
| CPU | i7 or equivalent |
| Primary LLM | Qwen3-14B Q3_K_M (fits in 8GB) |
| Embedder | Nomic 0.6B (CPU-offloaded) |
| Reranker | Jina v3 (CPU-offloaded) |
| Vision | SigLIP-base (CPU-offloaded) |
| STT | Whisper-small (CPU-offloaded) |
| Max Context | 8192 tokens |
| Default Slider | Tactical (512 excerpts) |
| Background GPU Budget | 60 seconds/hour |

### [C8-X] SSOT File Locations

```
profiles/manifesto/prime_directives.md
profiles/policies/costar.policy.json
profiles/routing/depth_slider.policy.json
libs/shared-contracts/{ContextFrame, MemoryItem, TraceStep, ToolSpec}.ts|.py
```

### [C8-Y] FLAGS — major historical drift in Chunk 8

| # | Source | Issue |
|---|---|---|
| F-8.1 | C8-C Stack | Qwen3-14B as primary LLM. STALE — owner override is 5.6B. The whole context budget math (C8-K) assumes 8K effective context from a 14B model. Numbers need full recalculation under 5.6B/on-demand. |
| F-8.2 | C8-C Stack | Embedder = Nomic 0.6B. STALE — current memory locks Harrier-OSS-v1-0.6B as default with Nomic as priority 2. |
| F-8.3 | C8-C Stack | Reranker = Jina v3. STALE — current memory locks BGE-Reranker-Base as default, Qwen3-Reranker-0.6B as fallback. |
| F-8.4 | C8-D | "These contracts are enforced by Rust, used by Python" — STALE. Current rule: NO Python at runtime. Python permitted only in dev environment for ONNX export and training. DevPulse orchestrates but never embeds Python. |
| F-8.5 | C8-D | Postgres as SSOT. Aligns with C7-C "libSQL remains SSOT" only by accident — different DB. Current stack: libSQL local, Postgres remote-only opt-in. SSOT is libSQL. |
| F-8.6 | C8-J | TWO-layer Ruminator (Typing-Time + Send-Time). Contradicts FOUR-layer model from RUMINATION v4 (Keystroke / Pause / Send / Background). The Send-Time = Send. Typing-Time encompasses Keystroke + Pause. Background not represented. |
| F-8.7 | C8-K | Architect Profile = 32B model. STALE — never adopted. Current ceiling is whatever user has hardware for. |
| F-8.8 | C8-W | "Qwen3-14B Q3_K_M (fits in 8GB)" — STALE per F-8.1. |
| F-8.9 | C8-W | "Whisper-small" — current memory lists Whisper-small as fallback STT, NOT primary. Primary is sherpa-rs (also Whisper-based but different runtime). |
| F-8.10 | C8-W | "SigLIP-base" — current memory locks SigLIP2. C2-E confirmed Candle SigLIP2 status was open issue as of Dec 2024. By May 2026, SigLIP2 status needs re-verification. |
| F-8.11 | C8-X | File paths reference `profiles/` and `libs/shared-contracts/` — neither exists in current path structure (kernel/systems/interfaces/config). |
| F-8.12 | C8-X | "TraceStep, ToolSpec.ts|.py" — TypeScript and Python contracts. Per F-8.4 the Python rule is gone; only Rust + TypeScript bindings (via specta). |
| F-8.13 | C8-N "Costar" | Spelled "Costar" (no plus). Current is COSTAR+IC (8 dimensions: C/O/S/T/A/R/I/C). Older 6-dimension or 7-dimension version. |
| F-8.14 | C8-D Foundation Contracts | Concept of Rust-enforced contracts surfacing in UI is solid. Aligns with current memory + bindings.ts pattern. |

### [C8-Z] What this chunk captures that's still GENUINE today

Despite the stale stack, several architectural decisions captured here remain in current memory or specs:

- **8-state kernel state machine** — matches KERNEL_ARCHITECTURE v3.0.0 [C1-B] exactly
- **Project isolation rule** — `project_id` enforcement at Rust boundary aligns with current isolation thinking
- **4-tier memory lifecycle** — Hot/Warm/Cold/Frozen with TTLs matches Clyffy Ruminate Core Spec [C3-D-4]
- **Scribe targets** — Cursor, Bolt, Lovable, Replit, Windsurf, Codex match the locked target tool list
- **Verified Artifacts pipeline** — Provisional → Verifying → Verified → Promoted is genuine architectural pattern
- **Idempotency keys + outbox pattern** — solid distributed-systems practice, still applicable
- **Citation format `[src:file:Lx-Ly|chunk:id]`** — explicit format spec, useful for current consolidation
- **Drop order for context packing (5-step ROTI prioritization)** — algorithmic pattern that survives stack changes
- **Eviction thresholds for sandbox workspaces** — operational detail worth carrying forward
- **Costar override tiers** (hard block / soft block / educational) — three-tier governance still applicable

---

*End of Chunk 8. Awaiting Chunk 9 (or signal that dump is complete).*

---

## OWNER LOCK — 2026-05-01 — RRO Architecture Decisions

> **"Option 2 — RRO as workspace member inside DevPulse"**
> **"burn ~270MB encoder or 0.5b if we can optimize it and have it work with embedder qdrant and all of my notes that finally get worked out as one"**

### [LOCK-1] RRO scope
RRO is the **whole multi-layer reasoning system** — not just encoder + Qdrant. Includes everything in v1.1.0 spec sections 1-13:
- Encoder + embedder pipeline
- Custom Qdrant fork
- Reranker
- HMM (state prediction, Viterbi, Baum-Welch)
- CAG (prefetch + JSON+YAML structuring for LLM)
- RAG (hybrid search + RRF + rerank)
- RKYV (zero-copy serialization with three-tier boundary)
- ReasoningObject + all data types
- Mode switching (General / Scientific Research / Explicit)
- Decision Engine (query routing, backend selection)
- Five backend categories (Vector / Relational / Graph / Analytics / HotCache) with default + remote options
- libSQL as SSOT recovery anchor

### [LOCK-2] Workspace topology
Single repo, single workspace. RRO crates live as workspace members at `kernel/rro-*/`. Path dep during dev (`rro = { path = "../rro-core" }`). Independently publishable to crates.io for rroflow.ai customers.

NOT separate `D:\localdev\rro\` repo. NOT git submodule. NOT crates.io-only dependency.

### [LOCK-3] Encoder framework
**Burn** — locked as the encoder framework. Not Candle, not llama.cpp FFI for the encoder path specifically.

Reasoning captured from owner sentence: encoder + embedder + qdrant + custom 0.5b need to "work out as one." Burn is the framework that owns the custom 0.5b training pipeline (per memory). Single framework end-to-end for the encoder layer eliminates the swap problem when the custom model is ready.

LLM inference for chat.brain stays separate (Candle / llama.cpp FFI per existing model-loader code). Burn ownership is scoped to the RRO encoder layer.

### [LOCK-4] Encoder model
- **Bootstrap:** ~270MB encoder (Harrier 270M Gemma-based, or comparable size class)
- **Long-term target:** Custom 0.5B optimized model (currently in training)
- **The trait:** Same `Embedder` interface for both. Hot reload via ArcSwap when custom 0.5B is ready. No code rewrite for the swap.

### [LOCK-5] Customization goal
Encoder must "work with embedder qdrant" as integrated pipeline. Implies the Embedder trait, the Qdrant fork wrapper, and the reasoning-ready object format are designed together — not as independent components glued at the API layer.

### [PARKED] Open items before any code moves

| ID | Question |
|----|----------|
| OL-1 | Verify `mike-marcacci/qwen3-burn` is suitable as the architectural reference for Harrier (Qwen3-arch encoder), license check, fork vs vendor decision |
| OL-2 | The 270MB Harrier 270m variant is **Gemma3** architecture, not Qwen3 — different from the 0.6B Harrier. Need to confirm which size you want as bootstrap (Gemma3-arch 270M vs Qwen3-arch 0.6B) |
| OL-3 | All 4B/14B references in old specs (chunks 1-3, 8) need batch correction to 5.6B / on-demand under owner override |
| OL-4 | Path structure remap — old specs reference `shared/`, `orchestrator/`, `profiles/`, `libs/` which contradict locked `kernel/`+`systems/`+`interfaces/`+`config/` rule |
| OL-5 | The cortex/persistence/rro.rs (9KB existing file) — read contents and decide migrate vs delete |
| OL-6 | Crate naming convention — `rro-core`, `rro-encoder-burn`, `rro-qdrant`, `rro-kernel-rag` etc. vs flatter `rro` single-crate-with-features |
| OL-7 | Reranker home — currently in v1.1.0 spec lives inside Decision Engine (paired with embedder). Confirm reranker stays in RRO not Cortex. |

### [DO-NOT-DO] Tonight
- Do NOT create new directories
- Do NOT move existing files
- Do NOT add Burn to any Cargo.toml yet
- Do NOT delete cortex/persistence/rro.rs
- Do NOT publish anything
- Do NOT write any new Rust code

This lock captures the architectural decision. Implementation gated on resolving OL-1 through OL-7.

---

*End of architectural lock. Returning to capture mode for any remaining chunks.*
---

## OWNER CORRECTION 2026-05-01 — The 5.6B Mystery Solved

Owner statement: 5.6B is not my large 15B phi is
Owner clarification: the 5.6B is sts/tts/stt minions/subconscious my primary llm my spec talks about this 20 million ways

### LOCK-6 Stack identity verified from disk

Source file: scripts/docs/specs/MODEL-PRESETS-SSOT.md lines 95-130

Preset 6 NATO-Aligned Phi Slot Collapse (12GB+):

| Slot | Model | Notes |
|------|-------|-------|
| chat.brain | Phi-4-multimodal-5.6B | Collapses STT + vision |
| voice.stt | ELIMINATED | Phi-4 handles audio natively |
| vision.embedder | ELIMINATED | Phi-4 handles vision natively |
| minion.shared | Qwen3-0.6B | (kept) |
| rag.embedder | Qwen3-Embedding-0.6B | (kept) |
| voice.tts | Qwen3-TTS-0.6B | Still needed |

The 5.6B = Phi-4-multimodal-5.6B. It collapses:
- Chat brain (text reasoning)
- STT (speech-to-text natively)
- Vision (image understanding natively)

Phi-4-multimodal-5.6B does NOT handle TTS. voice.tts stays separate (Qwen3-TTS-0.6B).

### LOCK-7 Reconciling owner statement vs spec

Owner said 5 things: sts/tts/stt minions/subconscious. Spec says 3: STT + vision + chat.brain.

| Owner said | Spec reality | Reconciliation |
|---|---|---|
| STS | NOT single-pass | Achieved via chain: Phi-4 (STT+think) -> Qwen3-TTS (speech out) |
| TTS | Separate Qwen3-TTS-0.6B | NOT in 5.6B |
| STT | Eliminated, in 5.6B | Confirmed |
| Minions | Qwen3-0.6B minion.shared | NOT the 5.6B |
| Subconscious | Uses minion 0.6B layer | NOT the 5.6B |

Interpreted intent (not stamped): Phi-4-multimodal-5.6B collapses what would be 3+ models into ONE for 12GB+ tier. TTS stays separate (cant generate audio). Minions stay 0.6B for cost.

### LOCK-8 The 15B Phi is LARGE_LLM (NOT the 5.6B)

Per memory: Phi-4-reasoning-vision-15B as LARGE_LLM, Qwen3-VL-4B as SMALL_LLM.

Two distinct Phi-4 models:
- Phi-4-reasoning-vision-15B = LARGE_LLM slot (Jesses primary system)
- Phi-4-multimodal-5.6B = chat.brain in Preset 6

Same family, different sizes, different roles.

### LOCK-9 All 7 presets defined, Phi-5.6B is Preset 6 ONLY

| VRAM | Default Preset |
|------|---------------|
| 8GB | Preset 1 Floor |
| 12GB | Preset 2 Mid ActiveIdle |
| 16GB | Preset 3 Jesse Primary |
| 24GB | Preset 4 High |
| Multi-GPU | Preset 5 Lab Ceiling |
| No GPU / API key | Preset 7 API-Enhanced |

Spec quote: Preset 6 (Phi slot collapse) is a benchmark test preset, not auto-selected.

So Phi-4-multimodal-5.6B is currently a TEST preset, not auto-default for any tier.

### LOCK-10 Backend loading rules from same SSOT

| Format | Backend | Crate |
|--------|---------|-------|
| .gguf | llama.cpp FFI | devpulse-llama-sys + devpulse-llama |
| .safetensors | Candle | candle-core + candle-nn + candle-transformers |
| .onnx | ORT | ort (sherpa-rs for STT, kokoro for TTS) |
| .bin (GGML) | sherpa-rs | sherpa-rs fork |

Burn is NOT in this list. Confirms Burn-not-installed finding.

### PARKED items from this lock

OL-8: Preset 6 says test preset not auto-selected, but owner implies it IS the primary path. Should Preset 6 become default for 12GB tier?

OL-9: True full-duplex STS requires single-model architecture (Moshi, PersonaPlex). Phi-4-multimodal does STT-then-text-then-TTS chain - higher latency than dedicated STS. Confirm STS quality target.

OL-10: Burn for encoder lock conflicts with rag.embedder being Qwen3-Embedding-0.6B in every preset. Need to confirm rag.embedder runs on Burn vs Candle.

---

5.6B identity locked: Phi-4-multimodal-5.6B (Preset 6 chat.brain). 15B Phi-4-reasoning-vision is LARGE_LLM (separate role).


---

## Retained revision that existed before restoration

﻿# RRO + CORTEX -- Raw Capture Dump (REBUILT 2026-05-01 after file truncation)


| Field | Value |
|-------|-------|
| Status | REBUILT after Add-Content truncation incident |
| Created | 2026-05-01 |
| Purpose | Owner-pasted spec dumps captured verbatim, tagged by source |
| Rule | NO architecture decisions, NO consolidation, NO opinions -- capture only |

## Chunk Manifest

| Chunk | Source | Topic |
|-------|--------|-------|
| 1 | KERNEL_ARCHITECTURE.md v3.0.0 (2025-12-24) Part 1 | State machine, event bus, scheduler |
| 2 | KERNEL_ARCHITECTURE Part 2 + Dec 24-27 sessions | Integration, telemetry, SigLIP2, isolation, rumination-as-default |
| 3 | CORTEX/RUMINATION alignment + Clyffy Ruminate Core Spec v1.0 + RRO v1.1.0 header | Dec 27 alignment + 11-section Clyffy spec + RRO v1.1.0 metadata |
| 4 | RRO v1.1.0 sections 1-2 | Core Concept, Architecture Diagram, SurrealDB comparison |
| 5 | RRO v1.1.0 sections 3-6 | Decision Engine, ReasoningObject, Backend Trait, rro.toml |
| 6 | RRO v1.1.0 section 7 | RAG, CAG, HMM, RKYV implementations |
| 7 | RRO v1.1.0 sections 8-13 | Write/Read paths, Recovery, Implementation, API, Distribution |
| 8 | clyffy/DevPulse master spec (Dec 2024) | Earliest preserved spec, 20 sections, historical drift |

## Owner Locks

| Lock | Decision |
|------|----------|
| OVERRIDE-1 | 5.6B is standard brain, all on-demand loading (corrects 4B references) |
| LOCK-1 to 5 | RRO scope = whole multi-layer reasoning system, workspace member at kernel/rro-*/, Burn for encoder, ~270MB bootstrap to custom 0.5B, encoder+embedder+qdrant designed together |
| LOCK-6 to 10 | 5.6B = Phi-4-multimodal-5.6B (Preset 6 NATO-Aligned Phi Slot Collapse). 15B Phi = LARGE_LLM (separate). 7 presets keyed by VRAM. Burn not in current backend list |
| LOCK-11 to 14 | Phi-4-multimodal-5.6B + Qwen3-0.6B = brain layer combo. STT/vision slots eliminated. TTS stays separate (Qwen3-TTS-0.6B). Final stack: 5 always + 1 optional heavy |


---

## CHUNK 1 -- KERNEL_ARCHITECTURE v3.0.0 Part 1 (2025-12-24)

Source: KERNEL_ARCHITECTURE.md v3.0.0, Status ACTIVE, Owner @jesse, Location orchestrator/src/kernel/

Owner pre-amble: Inference section should reference actual model stack (4B + 0.6B Minions). Scheduler should reflect Minions run on 0.6B. Background tasks use Minions (0.6B), 4B is for user queries. Resource budgets align with ~5.3GB VRAM. (NOTE: 4B superseded by 5.6B per OVERRIDE-1.)

### [C1-A] Purpose / boundary

- Kernel = central nervous system, handles MECHANICS (state, events, scheduling)
- Cortex handles THINKING; Kernel handles COORDINATION
- Kernel asks 'What needs to happen?' -- Cortex asks 'How do I respond thoughtfully?'
- Analogy: Kernel = OS scheduler, Cortex = application logic

### [C1-B] State machine -- 8 states

| State | Category | Description |
|-------|----------|-------------|
| IdleObserve | Idle | Sub-agents collecting (0.6B), telemetry intake |
| IdleMaintain | Idle | Background: embed, rerank, dedupe (0.6B models) |
| ActiveTriage | Active | Classify user intent |
| ActiveRetrieve | Active | Fetch context from Memory |
| ActiveGenerate | Active | LLM response generation (4B via Cortex -- now 5.6B) |
| ActiveValidate | Active | Validation gate, GUARDIAN checks |
| ReflectWriteback | Reflect | Memory consolidation (MANDATORY) |
| HaltPause | Error | Hard stop after N critical failures |

### [C1-C] State invariants

1. User preempts background -- any user input immediately Idle to Active
2. Mandatory reflection -- every interaction MUST pass through ReflectWriteback before returning to Idle
3. Halt recovery -- HaltPause requires explicit reset OR auto-recovers after cooldown

### [C1-D] Event bus topics

| Event | Publisher | Subscribers |
|-------|-----------|-------------|
| user.message | UI | Kernel |
| user.approve | UI | Kernel |
| kernel.state | Kernel | UI, Lab |
| cortex.response | Cortex | Kernel |
| cortex.thinking | Cortex | UI |
| agent.diary | DIARY | Memory |
| agent.repo | REPO | Memory |
| agent.psych | PSYCH | Memory |
| agent.guardian | GUARDIAN | Kernel, UI |
| fs.change | notify | REPO, GUARDIAN |
| memory.updated | Memory | Cortex |

### [C1-E] Scheduler -- priority-based

- Three queues: high_priority, normal_priority, low_priority (all VecDeque<Task>)
- ResourceBudget: cpu_percent, memory_mb, gpu_percent

| Priority | Tasks | Model | Behavior |
|----------|-------|-------|----------|
| High | User messages, approvals | 4B (now 5.6B) | Immediate, preempts everything |
| Normal | Sub-agent datapoints, retrieval | 0.6B | Runs when no high-priority |
| Low | Re-indexing, consolidation | 0.6B | Runs when idle, respects budgets |

Preemption rule: user interactions ALWAYS interrupt background. Model separation: background runs on 0.6B, never blocks brain model.

### [C1-F] Architecture flow (6 steps)

1. Sub-agents observe independently using 0.6B LLM, write datapoints to Memory
2. UI/Lab send events to Kernel via Event Bus
3. Kernel transitions state, routes to Cortex
4. Cortex reads from Memory, assembles COSTAR+, generates via brain model
5. Kernel delivers response to UI
6. MANDATORY: ReflectWriteback consolidates before returning to Idle

### [C1-G] GPU resource model -- ~5.3GB VRAM (legacy, see LOCK-6 final stack)

- Qwen3-VL-4B (~3GB) -- Clyffy brain (legacy, replaced by Phi-5.6B per LOCK-11)
- Qwen3-0.6B (~600MB) -- Minion reasoning, background
- Embedder (~400MB) -- text embedding
- Reranker (~400MB) -- cross-encoder scoring
- SigLIP2 (~400MB) -- vision embedding (legacy, eliminated per LOCK-13)
- Whisper (~500MB) -- voice to text (legacy, eliminated per LOCK-13)

IDLE: GPU ~0%, VRAM unchanged. INFERENCE: GPU spikes 2-5s then idle.

### [C1-H] Kernel vs Cortex separation table

| Aspect | Kernel | Cortex |
|--------|--------|--------|
| Responsibility | Mechanics | Thinking |
| Knows about | States, events, scheduling | Rumination, COSTAR+, context |
| Doesn't know about | LLM prompts, retrieval strategy | Task priorities, state machine |
| Analogous to | OS scheduler | Application logic |

### [C1-I] Sub-agent coordination

- Kernel does NOT dispatch sub-agents. They run independently on 0.6B LLM.
- Kernel routes events to Memory, respects resource budgets, exposes alerts to UI
- Sub-agents write to Memory, Cortex reads from Memory, Kernel routes events
- EXCEPTION: GUARDIAN alerts can trigger Kernel state transitions

### [C1-J] Module structure

orchestrator/src/kernel/ -- mod.rs, state_machine.rs, event_bus.rs, scheduler.rs, config.rs, metrics.rs

### [C1-K] Key Rust types

- pub enum KernelState (8 variants)
- pub enum KernelEvent (UserMessage, UserApprove, UserCancel, CortexResponse, CortexThinking, GuardianAlert, FileChange, Timeout, Reset)
- impl KernelState::transition(self, event) -> KernelState match table

### [C1-L] Cross-references

Cortex, Sub-agents (DIARY/REPO/PSYCH/TEACHER/SCRIBE/VISION/RESEARCHER/GUARDIAN -- 8-minion roster predates 9-seat Council), Memory (libSQL+Moka+Qdrant+DuckDB), UI Tauri, Lab TUI, Inference Candle.

### [C1-M] FLAGS

- ROSTER MISMATCH: 8 sub-agents vs current 9-seat Council with Goat Twins
- 4B HARDCODE: superseded by 5.6B / on-demand per OVERRIDE-1
- "MAESTRO" not used -- already past Gus to Clyffy rename

---

## CHUNK 2 -- KERNEL_ARCHITECTURE Part 2 + Dec 24-27 sessions

### [C2-A] Integration points

Receives from: UI (messages/approvals/cancellations), Lab (debug/test triggers), Cortex (responses/thinking), GUARDIAN (alerts/pre-commit blocks), File watcher (FS change)

Sends to: UI (state updates/responses/alerts), Lab (state/metrics), Cortex (routed user messages), Memory (sub-agent datapoint routing)

### [C2-B] Telemetry trace structure

trace: kernel.transition with from_state, to_state, trigger, latency_ms, queue_depth {high, normal, low}
trace: kernel.scheduler with task, priority, action (preempted), reason (user.message arrived), will_resume

### [C2-C] kernel.toml configuration

Halt: halt_after_failures=3, halt_cooldown_seconds=60
Scheduler: background_cpu_percent=30, background_memory_mb=512, background_gpu_percent=10
Timeouts: triage 100ms, retrieve 1000ms, generate 30000ms, validate 5000ms
Event bus: max_queue_depth=1000, event_ttl_seconds=300
Models: user_queries='4B' (legacy), background='0.6B'

### [C2-D] Kernel changelog

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | 2025-12-24 | GPU resource model, 4B/0.6B separation, Minions on 0.6B |
| 2.0.0 | 2025-12-22 | Embedded storage, 8 sub-agents, standard header |
| 1.0.0 | 2024-12 | Initial spec |

### [C2-E] SigLIP2 research (Dec 24, 2025)

Owner asked about newer alternatives. Findings:
- SigLIP2 NOT in Candle as of Dec 24 2025. Open issue #2799 from March 2025.
- In Candle: SigLIP v1, DINOv2, CLIP, EVA
- Not in Candle: SigLIP2 (Feb 2025), DINOv3 (Aug 2025), MobileCLIP-2 (Aug 2025)
- Recommendation: SigLIP v1 google/siglip-so400m-patch14-384, upgrade when Candle catches up
- Alternative: DINOv2 if pure image-to-image

### [C2-F] Context Isolation Architecture

GENERAL CHAT (user_general space): tool landscape, learning, methodology -- never touches project context
PROJECT space (per project_id): isolated namespace in Qdrant (shard key), Postgres (FK), libSQL (project-scoped). Three domains: FRONTEND/BACKEND/INFRA each with own hot/cold gradient. Cross-domain only when relevant.

### [C2-G] Hot-to-Cold per project per domain

HOT (immediate): currently open file, files modified this session, recent REPO signals (last 10 min), active conversation turns
WARM (fast retrieval, rerank into hot): files touched this week, related components by import graph, recent decisions in domain, DIARY rolling summary
COLD (background, surfaces on relevance): older session memories, archived decisions, historical patterns, initial planning docs

### [C2-H] General Chat purpose

Teach landscape without tainting projects, guide tool setup, answer 'what is X', discuss methodology, let users explore before committing to project. When ready to build, they enter a project (sacred context).

### [C2-I] Key Junctions (decision anchors)

Examples: Chose Supabase over Firebase (auth domain), App Router vs Pages (frontend), shadcn locked (frontend), deployment target [pending] (infra). Become high-weight retrieval anchors.

### [C2-J] Rumination as DEFAULT (Dec 27, 2025) -- owner verbatim

> "our chat will always default to using rumination, we will offer an override but its going to enable itself as default. that is what i need you to understand"

Rumination is not a feature, it is the product. Every chat runs through 4-layer architecture by default (Keystroke / Pause / Send / Background). Toggle exists for validation/escape hatch. Question is never 'when do we turn on rumination?' but 'when would someone ever turn it off?' (almost never).

### [C2-K] Rumination as architectural primitive (Dec 27, 2025) -- owner verbatim

> "yes and we have this all established in a way where we can expand or modify as we work this complexity out and actual moat/rumination layers for the infra itself and the background process"

The 4-layer pattern is the architectural primitive that applies to: user chat, infrastructure monitoring, background optimization, minion coordination. The signal buffer, watchers, NATS event bus, configurable layers in rumination.rs are the foundation to extend. Moat compounds: rumination watching rumination.

### [C2-L] FLAGS

- NATS reference contradicts later tokio::broadcast lock from DEVPULSE_FOUNDATION
- Configuration kernel.models hardcodes '4B' and '0.6B' strings -- should be slot references
- SigLIP2 status as of Dec 24 2025 differs from current memory (locks SigLIP2). Need re-verification for May 2026.

---

## CHUNK 3 -- CORTEX/RUMINATION alignment + Clyffy Ruminate Core Spec + RRO v1.1.0 header

### [C3-A] CORTEX.md alignment review (Dec 27, 2025)

CORTEX.md v1.0.0 to v2.0.0 fix table:
- Redis to Moka (local in-memory)
- 14B background to 0.6B (now superseded by 5.6B chat.brain per OVERRIDE-1)
- Postgres external to local
- Rumination as feature to baseline
- Added context isolation (general vs project)
- Added domain segmentation (frontend/backend/infra)

Section-level changes: Background layer 14B to 0.6B, Hot cache Redis to Moka, Rumination 'feature' to 'product', context isolation full section added, domain segmentation full section added, key junctions decision anchors, storage explicit 'all local' table, Pause layer active_domain Option<ProjectDomain>, isolation.rs added.

### [C3-B] RUMINATION v3.0 to v4.0 alignment (Dec 27, 2025)

Fix table:
- '14B+ model' future to 4B max / 0.6B background (now 5.6B per OVERRIDE-1)
- Postgres framing to explicitly local
- Added context isolation
- Added domain segmentation
- Turso cloud sync from standard to optional internal-only
- Rumination feature to baseline
- 'Future (Network)' clarified local-first

Section-level v3 to v4: Executive summary feature to 'rumination is the product', future section removed, background layer explicitly '0.6B only to avoid blocking 4B', storage 'all local' table, context isolation full section, domain segmentation, key junctions, signal buffer project-scoped (project_id), Qdrant queries namespace-scoped, Pause layer active_domain, isolation/ directory (namespace, domain, temperature), complexity scorer crosses_domains, parking lot project_id+domain columns.

### [C3-C] RUMINATION v4 verification (Dec 27, 2025)

Owner asked 'any updates needed?' -- all 12 checks passed. Document aligned.

### [C3-D] CLYFFY RUMINATE CORE SPECIFICATION v1.0

Section 1 -- Executive Summary
- Core Mission: 'It strengthens the user.' Clyffy is a TRANSLATOR, not a chatbot. LLM is VOICE, Ruminate IS the brain.
- Antigravity Principle: AI assistants create architectural debt by always adding new abstractions. Ruminate prevents drift before reaching repo.
- Value Prop: User types 'add the topbar' -> Ruminate transforms into senior-engineer-quality prompt with context, architecture, COSTAR, pattern consistency.

Section 2 -- The Ruminating Philosophy
'A mix of antigravity and Claude' -- seamless cognition while user types.
2.1 Core Principles: Seamless, Absorbing (already processed screenshot, talked to minions, absorbing input), Teaching (subtle education through friction), Persistent (memory survives crashes), Frustration-Tolerant ('you mother fucker god damn piece of shit' is SIGNAL not violation -- no asterisks, no censoring, absorb and help).
2.2 What Ruminate Does: knows project (patterns/folders/Constitution), knows COSTAR, knows industry terminology (kernel, lanes), enriches lazy human prompt to senior level.

Section 3 -- The Transformation Engine
3.1 Before/After: 'Please add the topbar now.' becomes 'introduce topbar for layout, web portion, public members, layout.tsx main import, components topbar/footer/leftside, separation of concerns, nested under layout, consistent with patterns, modular feature-based folder structure.'
3.2 Context Loading (Pre-Prompt): screenshot processed, Qdrant queried, build plan checked, minions consulted (RepoWatcher, Psychiatrist), Constitution constraints loaded.

Section 4 -- Memory Lifecycle (4-tier, importance 0-100)
| Tier | Purpose | Storage | Action |
|------|---------|---------|--------|
| Short-Term | Working memory | RAM/Redis (now Moka) | FILTER |
| Medium-Term | Episodic ~2 weeks | Qdrant Fast Collection | SUMMARIZE |
| Long-Term | Semantic core | Qdrant Archive + Postgres | REINFORCE |
| Critical | The Soul (user prefs) | System Prompt / Pinned | PROTECT |

4.1 Importance signals: +5 injected to prompt, +2 retrieved not top, -1 retrieved+ignored, ->100 user-pinned (Critical), -0.5/day decay.

Section 5 -- Ruminator State Machine
IDLE (5min) -> SCANNING -> AGGREGATING -> DECIDING -> [PROMOTE|FLAG|DELETE] -> SLEEPING -> IDLE

5.2 Decision Algorithm 3 questions: Contradiction Check, Value Assessment, Redundancy Check
Outcomes: PROMOTE (valuable+no conflict), FLAG (contradicts Critical), DELETE (no value or redundant).

Section 6 -- Scribe Integration
Scribe is OUTPUT layer. Targets: Lovable (browser ext), Bolt (same), Replit (same), Local IDE (Cursor/VS Code via MCP).

Section 7 -- PeerGuardian / LeftHook
Pre-commit hook catching antigravity drift: Drift Detection, Build Plan Validation, Pattern Consistency, Blocking. 'Clyffy blocked 3 drift commits.'

Section 8 -- ROTI Metrics (fun stat)
'Clyffy blocked 3 drift commits this session', 'Clyffy transformed 12 prompts', 'Saved X using DevPulse'. NOT about time saved -- about QUALITY TRANSFORMATION.

Section 9 -- Hardware & Model Requirements
| Component | Model | VRAM | Location |
|-----------|-------|------|----------|
| Ruminator | Qwen2.5-1.5B-Instruct Q4 | ~1.5GB | LOCAL |
| Embedder | Nomic-Embed 0.6B | ~0.5GB | LOCAL |
| Scribe/Translator | Qwen2.5-7B or 14B | ~8-16GB | LOCAL |
| Heavy Lift | Claude/GPT-4 | N/A | API |

(NOTE: Above stack stale. See LOCK-11 final stack.)

'Ruminator NEVER uses Big Brain. Small fast model runs background without lag.'

Section 10 -- Implementation Checklist (4 weeks)
W1: MemoryItem/RuminateDecision/DreamLogEntry schemas, Postgres tables, MemoryStore trait Rust, unit tests
W2: RuminatorState enum Rust, idle detection 5min, Cortex Viewer UI panel, state transitions telemetry
W3: Qwen-1.5B via llama.cpp, contradiction detection prompts, PROMOTE/FLAG/DELETE logic, Dream Log persistence
W4: Force Ruminate button, visual state machine, decision log display, end-to-end test inject->ruminate->verify promotion

Section 11 -- Data Contracts (TypeScript interfaces)
MemoryItem: id, content, embedding number[], tier (short/medium/long/critical), importance 0-100, created_at, last_accessed, source (chat/file/commit/screenshot)
RuminateDecision: memory_id, action (PROMOTE/FLAG/DELETE), reason, confidence 0-1, new_tier, conflict_with

### [C3-E] RRO v1.1.0 header (2026-03-14, DRAFT)

| Field | Value |
|-------|-------|
| Status | DRAFT -- Owner review required |
| Version | 1.1.0 |
| Last Updated | 2026-03-14 |
| Owner | @jesse |
| Part of | DevPulse Platform |
| Also | Standalone open-source crate (rro) |
| License | TBD (Apache 2.0 / MIT dual likely) |
| Qdrant Status | Star Ambassador, partnership discussions active |
| Precedence | PHILOSOPHY.md governs |

### [C3-F] FLAGS

- F-3.1: Memory tier 'RAM/Redis' contradicts Moka lock from C3-A
- F-3.2: 'Scribe/Translator: Qwen2.5-7B or 14B' contradicts no-14B + 5.6B override
- F-3.3: 'Ruminator: Qwen2.5-1.5B' contradicts Qwen3-0.6B from C1-G
- F-3.4: 'Embedder: Nomic-Embed 0.6B' contradicts Harrier default from current memory
- F-3.5: TypeScript data contracts -- Rust ownership rule says Rust owns policy/logic. Need Rust struct equivalents as SSOT.
- F-3.6: Frustration-tolerant quote captures owner's policy. PSYCH minion routing rule.
- F-3.7: Scribe described as OUTPUT layer (delivers prompts to Lovable/Bolt/Replit/IDE). Council role from memory has Scribe = Fox = INPUT rehabilitation. Direction conflict.
- F-3.8: All 4B references now under 5.6B / on-demand correction.

---

## CHUNK 4 -- RRO v1.1.0 sections 1-2 (Core Concept + SurrealDB comparison)

### [C4-A] Section 1 -- Core Concept

Definition (verbatim): 'RRO is not a database. RRO is a reasoning substrate.'

Distribution model -- three identities:
- (B) Reusable library -- rro crate usable in any Rust project
- (C) Open-source offering -- Qdrant-compatible but purpose-built for reasoning
- Qdrant relationship -- 'They're watching; potential partnership or acquisition path'

Five responsibilities:
- Unified query/access layer
- Abstracts multiple storage backends behind one interface
- Pre-structures all data for immediate LLM consumption (no transform step)
- Uses 0.6B encoder network as decision-making layer
- Operates in configurable modes (general vs scientific research)
- Config-driven, open-source friendly, customizable for community innovation

### [C4-B] RRO Architecture Diagram (textual)

Three vertical layers:

LAYER 1 -- RRO LAYER (Query Interface + Reasoning)
  DECISION ENGINE (0.6B Network)
    Embedder (Qwen3-Embedding-0.6B) <-> Reranker (Qwen3-Reranker)
    Mode: GENERAL | SCIENTIFIC_RESEARCH | EXPLICIT
    Responsibilities: route queries, score relevance (rerank), prefetch context (CAG), predict next state (HMM), fuse results (RRF)

LAYER 2 -- BACKEND ABSTRACTION
  trait RROBackend {
      fn backend_type() -> BackendType;
      fn capabilities() -> BackendCapabilities;
      async fn query(&self, q: RROQuery) -> RROResult;
      async fn upsert(&self, obj: ReasoningObject) -> Result<()>;
      async fn health_check(&self) -> HealthStatus;
  }

LAYER 3 -- 5 BACKEND CATEGORIES
| Category | Default (embedded) | Remote |
|----------|--------------------|--------|
| VECTORS | Qdrant (your fork) | Pinecone, Milvus |
| RELATIONAL | libSQL | Postgres, Turso |
| GRAPH | SurrealDB | Neo4j |
| ANALYTICS | DuckDB | ClickHouse |
| HOT CACHE | Moka (4 instances) | Redis (opt) |

### [C4-C] Decision Engine -- 5 capabilities

Encoder pair: Qwen3-Embedding-0.6B + Qwen3-Reranker (work together).
Three modes: GENERAL, SCIENTIFIC_RESEARCH, EXPLICIT.
Five core responsibilities: route to optimal backend, score (rerank), prefetch (CAG), predict next state (HMM), fuse (RRF).

### [C4-D] RROBackend trait (short)

trait RROBackend {
    fn backend_type() -> BackendType;
    fn capabilities() -> BackendCapabilities;
    async fn query(&self, q: RROQuery) -> RROResult;
    async fn upsert(&self, obj: ReasoningObject) -> Result<()>;
    async fn health_check(&self) -> HealthStatus;
}

### [C4-E] Five backend categories

(See C4-B layer 3 table.) All defaults embedded. Remote opt-in.

### [C4-F] Section 2 -- Why RRO Beats SurrealDB (verbatim)

| SurrealDB | RRO |
|-----------|-----|
| Multi-model (doc, graph, relational) | Multi-model + vector-native + reasoning-ready |
| Generic SurrealQL | LLM-optimized query patterns (CAG prefetch, HMM state prediction) |
| JSON at all boundaries | RKYV zero-copy internally, structured JSON + YAML instructions for LLM context |
| HTTP or embedded | Embedded only, in-process, <5ms |
| General purpose | Purpose-built for AI/ML reasoning pipelines |
| Query -> Transform -> Use | Query -> Use (pre-structured for consumption) |
| No semantic layer | 0.6B encoder IS the semantic layer |
| Fixed query planning | Mode-switchable query strategies |

### [C4-G] FLAGS

- F-4.1: '0.6B encoder = Qwen3-Embedding-0.6B' -- current memory says Harrier-OSS-v1-0.6B is default
- F-4.2: SurrealDB used as BACKEND (graph) but C2-G has Postgres-equivalent role -- clarify
- F-4.3: 'Moka (4 instances)' -- need naming/role per instance (resolved in C5-D)
- F-4.4: 'RKYV zero-copy internally' confirms rkyv 0.8.15 lock
- F-4.5: 'Embedded only, in-process, <5ms' -- aligns with owner stance against HTTP boundaries
- F-4.6: 5.6B override applies to chat.brain, not encoder/reranker (those stay 0.6B)

---

## CHUNK 5 -- RRO v1.1.0 sections 3-6 (Decision Engine, ReasoningObject, Backend Trait full, rro.toml)

### [C5-A] Section 3 -- Decision Engine

Stated: 'The 0.6B encoder network is not just for embedding. It is the decision-making layer.'

3.1 Query Routing -- QueryStrategy enum:
- Direct { backend: BackendType }                              // single backend, no fusion
- Hybrid { backends: Vec<BackendType>, fusion: FusionMethod }  // multiple backends + RRF
- Predictive { prefetch: Vec<PrefetchTarget>, then: Box<QueryStrategy> }  // CAG prefetch
- StatePredicted { hmm_state: StateId, strategy: Box<QueryStrategy> }    // HMM-driven

DecisionEngine::plan_query:
1. Embed query via 0.6B embedder
2. Score each backend's relevance
3. Mode affects strategy: General=fast, ScientificResearch=exhaustive, Explicit=user-specified

3.2 Three Query Modes:
| Mode | Behavior | Latency | Use Case |
|------|----------|---------|----------|
| General | Fast path, single best backend, rerank top-k | <50ms | Daily coding |
| ScientificResearch | Exhaustive, all backends, deep rerank, full provenance | 200-500ms | Research |
| Explicit | User specifies backends, no inference | Variable | Debugging/testing |

3.3 rro.toml mode config:
[rro] default_mode='general'
[rro.modes.general] max_backends=2, rerank_top_k=10, latency_budget_ms=50, prefetch_enabled=true
[rro.modes.scientific_research] max_backends=4, rerank_top_k=50, latency_budget_ms=500, prefetch_enabled=true, provenance_tracking=true, citation_generation=true
[rro.modes.explicit] allow_backend_override=true, allow_fusion_override=true

### [C5-B] Section 4 -- Reasoning Ready Objects

4.1 Core Type (rkyv-archived):
struct ReasoningObject {
    id: ObjectId,
    kind: ObjectKind,
    content: Content,
    dense_vector: Vector1024,        // 1024-dim from Qwen3-Embedding
    sparse_vector: SparseVector,     // BM25 tokens
    reasoning_metadata: ReasoningMetadata,
    relations: Vec<Relation>,        // graph edges
    storage_locations: StorageLocations,
    lifecycle: ObjectLifecycle,
}

struct ReasoningMetadata {
    token_count: u32,                  // pre-computed
    structured_context: Option<StructuredContext>,
    summary: Option<String>,           // pre-generated for context windows
    concepts: Vec<ConceptId>,          // for CAG prefetch matching
    cached_relevance: Option<CachedRelevance>,
    provenance: Provenance,
}

struct StructuredContext {
    instructions: String,              // YAML-style instruction block
    payload: serde_json::Value,        // Clean JSON payload
    format_version: u8,
}

4.2 ObjectKind (12 variants):
- Code: CodeChunk (lang, chunk_type), Function (signature), Module (exports)
- Doc: DocBlock (doc_type), Comment (comment_type)
- Knowledge: Concept (domain), Pattern (pattern_type), Decision (adr_id)
- Session: Turn (session_id), Finding (expert_id)
- External: ExternalDoc (source), Embedding (model)

### [C5-C] Section 5 -- Full Backend Trait (8 methods)

#[async_trait]
pub trait RROBackend: Send + Sync {
    fn backend_type(&self) -> BackendType;
    fn capabilities(&self) -> BackendCapabilities;
    async fn query(&self, query: &BackendQuery) -> Result<BackendResult>;
    async fn upsert(&self, obj: &ReasoningObject) -> Result<()>;
    async fn upsert_batch(&self, objs: &[ReasoningObject]) -> Result<BatchResult>;
    async fn delete(&self, id: &ObjectId) -> Result<bool>;
    async fn health(&self) -> HealthStatus;
    async fn sync(&self) -> Result<SyncReport>;
}

enum BackendType { Vector, Relational, Graph, Analytics, HotCache }

struct BackendCapabilities {
    supports_vector_search: bool,
    supports_full_text: bool,
    supports_graph_traversal: bool,
    supports_aggregations: bool,
    supports_transactions: bool,
    supports_subscriptions: bool,
    max_vector_dimensions: Option<usize>,
    max_batch_size: Option<usize>,
}

### [C5-D] Section 6 -- rro.toml backends (verbatim)

[backends] enabled=['vector','relational','graph','analytics','cache']

[backends.vector] provider='qdrant_embedded' path='\/vectors'
  Alternatives: qdrant_remote, pinecone, milvus

[backends.relational] provider='libsql_embedded' path='\/state.db'
  Alternatives: turso, postgres

[backends.graph] provider='surrealdb_embedded' path='\/graph' storage_engine='surrealkv'  # NOT rocksdb (Windows pain)
  Alternatives: surrealdb_remote, neo4j

[backends.analytics] provider='duckdb_embedded' path='\/analytics.duckdb'
  Alternatives: clickhouse

[backends.cache] provider='moka'
[backends.cache.moka]
  session_cache_ttl_sec = 1800   # 30min
  context_cache_tti_sec = 300    # 5min idle
  pattern_cache_ttl_sec = 3600   # 1hr
  graph_cache_tti_sec = 600      # 10min idle
  Alternative: redis

### [C5-E] FLAGS

- F-5.1: QueryStrategy enum (Direct/Hybrid/Predictive/StatePredicted) maps to on-disk code: adapters/reasoning/chains.rs, hmm.rs, transition_matrix.rs. Alignment confirmed.
- F-5.2: Three modes locked: General (<50ms), ScientificResearch (200-500ms), Explicit (variable).
- F-5.3: Vector1024 hardcodes 1024-dim. Harrier-0.6B Qwen3-arch is also 1024-dim per disk config.json. BGE-M3 is 1024-dim. Type works for current candidates. Different-dim swap breaks type system.
- F-5.4: StorageLocations field exists, struct definition not in spec. Object can live in multiple backends -- consistency model not defined.
- F-5.5: ObjectKind::Embedding allows storing embeddings as ReasoningObjects. Recursive shape.
- F-5.6: 4 Moka instances NAMED: session_cache (30min TTL), context_cache (5min TTI), pattern_cache (1hr TTL), graph_cache (10min TTI). Resolves F-4.3.
- F-5.7: SurrealKV NOT rocksdb -- 'Windows pain' explicitly cited.
- F-5.8: trait method 'sync' for backends that cache -- distributed cache mode (Redis fallback).
