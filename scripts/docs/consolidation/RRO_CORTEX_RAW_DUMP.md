# RRO + CORTEX -- Raw Capture Dump (REBUILT 2026-05-01 after file truncation)


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
