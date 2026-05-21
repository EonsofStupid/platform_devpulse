# RRO — Reason Ready Object System


| Field | Value |
|-------|-------|
| Status | OFFICIAL — v2.0.1 |
| Last Updated | 2026-05-20 |
| Owner | @jesse |
| Location | kernel/rro-* (workspace members) |
| Part of | DevPulse Platform |
| Also | Standalone open-source crate (rro), powers rroflow.ai enterprise |
| License | Apache 2.0 / MIT dual |
| Governs | All retrieval, encoding, and reasoning-substrate work in DevPulse |
| Governed by | PHILOSOPHY.md, [CLYFFY-COGNITIVE-FOUNDATION.md](../../../../../docs/platform/CLYFFY-COGNITIVE-FOUNDATION.md) |

> **Vocabulary lock (2026-05-20):** RRO = **Reason Ready Object(s)** — the artifact emitted by RRD. The constrained-decoding subsystem (llguidance v1.7.5) is the *mechanism* that emits them; it is not RRO itself. The prior "Reasoning-Ready Object" spelling and any "RRO = Orchestrator" reading are retired. See [CLYFFY-COGNITIVE-FOUNDATION.md §1](../../../../../docs/platform/CLYFFY-COGNITIVE-FOUNDATION.md#1-identity-hierarchy) for the full identity hierarchy.

---

## 1. What RRO Is

RRO is the **multi-layer reasoning substrate** for DevPulse, Clyffy.ai, and any product built on the DevPulse stack. It is also the standalone product sold via rroflow.ai to enterprise.

RRO is not a database. RRO is a reasoning-ready substrate — a system that takes text in, returns reasoning-ready objects out, and runs in-process with sub-100ms latency on cached queries.

RRO is the cluster of five components working as one unit:

| # | Component | Role |
|---|-----------|------|
| 1 | RRD (Reason Ready Daemon) | The orchestrator that runs the cluster. Lifecycle, hot-reload, pause/resume, health. |
| 2 | Reason Ready Object | The data unit. Vector + provenance + governance + concepts + relations. |
| 3 | Encoder | Burn-based. Bootstrap on Harrier 0.6B. Long-term: custom 0.5B owned model. Hot-swappable via ArcSwap. |
| 4 | Embedder pipeline | Tokenizer + encoder forward pass + last-token pool + L2 normalize + sparse BM25. |
| 5 | Qdrant fork | Vector storage backbone. Custom forked Qdrant tuned for RRO's reasoning-ready format. |

These five components are designed together as one pipeline. They are NOT five independent services glued at the API layer.

## 2. What RRO Is Not

RRO is the substrate. Cortex (DevPulse cognition) is what runs on top of it.

RRO does NOT contain:

- Rumination engine (the four-layer Keystroke/Pause/Send/Background pipeline)
- COSTAR+IC assembly
- Council orchestration (9 seats: Cow/Sheep/Pig/Mini Pony/Crane/Llama/Fox/Badger/Goat Twins)
- Fox pipeline (input rehab)
- Kernel state machine (8 states, event bus, scheduler)
- Sub-agent (minion) coordination
- Scribe (output to Cursor/Bolt/Replit/IDE)
- ROTI metrics

These belong in **Cortex** (kernel/devpulse-clyffy/src/cortex/). Cortex calls RRO. RRO does not call Cortex.

The test: if you can sell a piece of functionality to enterprise (rroflow.ai) without the buyer also wanting Council/Fox/COSTAR+IC/minion personas — it belongs in RRO. If selling it standalone makes no sense without DevPulse-specific cognition, it stays in Cortex.

## 3. Architecture

`
┌──────────────────────────────────────────────────────────────────────┐
│                          RRO LAYER                                   │
│                (Query Interface + Reasoning Layer)                   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              DECISION ENGINE (encoder network)                 │  │
│  │   Embedder (Harrier 0.6B) <-> Reranker (BGE-Reranker-Base)     │  │
│  │   Mode: GENERAL | SCIENTIFIC_RESEARCH | EXPLICIT               │  │
│  │   Capabilities: route queries, rerank, CAG prefetch, HMM       │  │
│  │                 predict, RRF fuse                              │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                │                                     │
│                                ▼                                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                  BACKEND ABSTRACTION                           │  │
│  │   trait RROBackend { backend_type, capabilities, query,        │  │
│  │                      upsert, upsert_batch, delete, health,     │  │
│  │                      sync }                                    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                │                                     │
│       ┌──────────┬─────────────┼──────────┬──────────┐               │
│       ▼          ▼             ▼          ▼          ▼               │
│   ┌───────┐  ┌────────┐  ┌─────────┐  ┌──────┐  ┌────────┐           │
│   │Vectors│  │Relation│  │  Graph  │  │Analyt│  │Hot Cach│           │
│   │Qdrant │  │ libSQL │  │SurrealDB│  │DuckDB│  │Moka(4) │           │
│   │ fork  │  │  SSOT  │  │SurrealKV│  │      │  │        │           │
│   └───────┘  └────────┘  └─────────┘  └──────┘  └────────┘           │
└──────────────────────────────────────────────────────────────────────┘
`

**Backend categories with default + remote alternatives:**

| Category | Default (embedded) | Remote alternatives |
|----------|--------------------|--------------------|
| Vectors | Qdrant fork | Pinecone, Milvus |
| Relational | libSQL | Postgres, Turso |
| Graph | SurrealDB (SurrealKV — NOT rocksdb, Windows pain) | Neo4j |
| Analytics | DuckDB | ClickHouse |
| Hot Cache | Moka (4 named instances) | Redis (optional) |

**Moka cache instances (named, with TTLs):**

| Instance | TTL | Purpose |
|----------|-----|---------|
| session_cache | 30 min | User session state |
| context_cache | 5 min idle | Active retrieval context |
| pattern_cache | 1 hr | Learned patterns |
| graph_cache | 10 min idle | Recent graph traversals |

**libSQL is SSOT.** All other backends are derivable from libSQL. If any backend corrupts:
- SurrealDB corrupt → rebuild graph from libSQL relations
- Qdrant corrupt → re-embed all content from libSQL
- DuckDB corrupt → replay analytics from libSQL event log
- Moka dies → volatile, warm up from other backends on restart

## 4. Cluster Components

### 4.1 RRD — Reason Ready Daemon

Detailed spec: see [RRD.md](./RRD.md)

The RRD is the in-process orchestrator that runs the RRO cluster. NOT a sidecar. NOT HTTP. NOT a separate process.

**Lifecycle states:**

| State | Behavior |
|-------|----------|
| Loading | Cold start. Reading config. Loading encoder weights. |
| Running | Fully operational. Accepts queries. |
| Paused | Maintenance window. New queries queue or get RRDUnavailable. |
| Updating | Atomic encoder swap in progress (ArcSwap). |
| Failed | Unrecoverable error. Required for diagnostics. |

**Pause/resume (Clyffy maintenance window):**

1. Set state to Paused
2. Drain in-flight requests (typically <500ms)
3. Load new encoder weights (~2-5 sec for 0.6B safetensors)
4. ArcSwap atomic swap
5. Set state to Running

User-visible pause: ~5-10 seconds. UI shows "Clyffy maintenance" indicator.

### 4.2 Reason Ready Object

Detailed spec: see [REASON_READY_OBJECT.md](./REASON_READY_OBJECT.md)

The data unit. Pre-structured for immediate LLM consumption — no transform step at read time.

`ust
#[derive(Archive, Deserialize, Serialize)]
pub struct ReasoningObject {
    pub id: ObjectId,
    pub kind: ObjectKind,                     // 12 variants: code/doc/knowledge/session/external
    pub content: Content,
    pub dense_vector: VectorD,                // generic over D, default 1024
    pub sparse_vector: SparseVector,          // BM25 tokens
    pub reasoning_metadata: ReasoningMetadata,
    pub relations: Vec<Relation>,             // graph edges
    pub storage_locations: StorageLocations,  // which backends store this
    pub lifecycle: ObjectLifecycle,           // hot/warm/cold/frozen
}
`

### 4.3 Encoder

**Framework: Burn.** Scoped to encoder layer only. LLM inference (chat.brain) stays on Candle / llama.cpp FFI.

**Bootstrap model:** Harrier 0.6B (Qwen3 architecture). Already on disk at D:\localdev\platform_devpulse\models\rag\microsoft--harrier-0.6b\.

**Long-term target:** Custom 0.5B optimized model. Currently in training on separate hardware. Trained on Burn for end-to-end framework alignment.

**Hot-swap protocol:** Same Embedder trait interface for all encoder models. ArcSwap atomic pointer swap. No code rewrite when custom 0.5B is ready.

### 4.4 Embedder Pipeline

Five steps from text input to vector:

1. Tokenize (HuggingFace 	okenizers crate, uses 	okenizer.json from model dir)
2. Forward pass through encoder (Burn)
3. Last-token pool from final hidden state
4. L2 normalize → 1024-dim dense vector
5. Sparse encoding via BM25 (lexical, no model)

The dense vector goes into Qdrant. The sparse vector also goes into Qdrant for hybrid search. Both come from the same input in one pass.

### 4.5 Qdrant Fork

Custom-forked Qdrant tuned for the Reason Ready Object format. Lives at github.com/EonsofStupid/cortex (per memory).

The fork adds:
- Native ReasoningObject schema support (no transform layer)
- RKYV-compatible storage paths
- Provenance + governance metadata as first-class fields
- Multi-backend coordination hooks

Stock Qdrant works as a fallback backend, but the fork is the default for embedded mode.

## 5. Kernel Methods (RRO internal reasoning techniques)

These four techniques are the reasoning-ready part of RRO. They live INSIDE impl RRO, not as separate subsystems.

### 5.1 RAG — Hybrid Search + RRF + Rerank

4-step pipeline:

1. Embed query (encoder produces dense + sparse)
2. Search Qdrant: dense and sparse, both top-k by candidate_count
3. RRF fusion: score = sum 1 / (k + rank)
4. Cross-encoder rerank (BGE-Reranker-Base default, Qwen3-Reranker-0.6B fallback)

### 5.2 CAG — Context-Augmented Generation (Prefetch)

Pre-generates context BEFORE user query executes. Uses HMM to predict next-needed concepts.

4-step pipeline:

1. HMM predicts next concepts from recent turns
2. Pre-fetch via rag_search per concept (candidate_count=20, rerank_top_k=5)
3. Dedupe by ID, store in Moka pattern_cache
4. Structure as JSON + YAML instructions for LLM consumption

Verbatim YAML instruction text shipped to LLM:
- Process each item methodically
- Relationships indicate semantic connections
- Relevance scores are pre-computed by cross-encoder
- Summaries are authoritative; full content available if needed

### 5.3 HMM — State Prediction (Hidden Markov Model)

Predicts what concepts user needs next from recent turn sequence.

HMM struct: transition_matrix, emission_matrix, state_distribution

predict_next_concepts 5 steps:
1. Extract observations from recent turn sequence
2. Viterbi: find most likely current state
3. transition_matrix predicts next state probabilities
4. emission_matrix scores concepts for probable states (threshold 0.1)
5. Return top-10 concepts

update method: Baum-Welch online learning. System learns user patterns over time.

### 5.4 RKYV — Three-Tier Serialization

| Boundary | Serialization | Why |
|----------|--------------|-----|
| Internal (within RRO) | rkyv 0.8.15 zero-copy | No JSON overhead. Direct memory mapping. |
| External (LLM consumption) | Structured JSON + YAML instructions | LLM-readable. Pre-formatted for context windows. |
| MCP perimeter | JSON-RPC | Compatibility at outermost boundary only. |

rkyv pinned at 0.8.15 (RUSTSEC-2026-0001 fixed). Correct 0.8 derive: #[derive(Archive, Serialize, Deserialize)] #[rkyv(derive(Debug))]


## 6. Three Query Modes

| Mode | Behavior | Latency Budget | Use Case |
|------|----------|----------------|----------|
| General | Fast path. Single best backend. Rerank top-k. | < 50 ms | Daily coding, quick lookups |
| ScientificResearch | Exhaustive. All backends. Deep rerank. Provenance + citations. | 200-500 ms | Research, analysis, learning |
| Explicit | User-specified backends. No inference. | Variable | Debugging, testing, power users |

rro.toml mode configuration:

```toml
[rro]
default_mode = 'general'

[rro.modes.general]
max_backends = 2
rerank_top_k = 10
latency_budget_ms = 50
prefetch_enabled = true

[rro.modes.scientific_research]
max_backends = 4
rerank_top_k = 50
latency_budget_ms = 500
prefetch_enabled = true
provenance_tracking = true
citation_generation = true

[rro.modes.explicit]
allow_backend_override = true
allow_fusion_override = true
```

## 7. Public API Surface

```rust
pub struct RRO {
    config: RROConfig,
    decision_engine: DecisionEngine,
    backends: HashMap<BackendType, Box<dyn RROBackend>>,
    hmm: HMM,
    rrd: RRD,
}

impl RRO {
    // Lifecycle
    pub async fn init(config: RROConfig) -> Result<Self>;
    pub async fn shutdown(&self) -> Result<()>;

    // Core operations
    pub async fn search(&self, query: &str, opts: SearchOptions) -> Result<Vec<ScoredObject>>;
    pub async fn upsert(&self, obj: ReasoningObject) -> Result<()>;
    pub async fn delete(&self, id: &ObjectId) -> Result<bool>;

    // Kernel methods
    pub async fn rag_search(&self, query: &str, opts: RagOptions) -> Result<Vec<ScoredObject>>;
    pub async fn cag_prefetch(&self, session: &SessionContext) -> Result<PrefetchedContext>;
    pub fn hmm_predict(&self, turns: &[Turn]) -> Result<Vec<Concept>>;

    // Mode switching
    pub fn set_mode(&mut self, mode: QueryMode);
    pub fn current_mode(&self) -> QueryMode;

    // RRD lifecycle (hot reload, encoder swap)
    pub async fn pause_for_update(&self) -> Result<PauseHandle>;
    pub async fn swap_encoder(&self, new_path: &Path) -> Result<()>;
    pub async fn resume(&self, handle: PauseHandle) -> Result<()>;

    // Health & diagnostics
    pub async fn health(&self) -> HealthReport;
    pub async fn sync_all(&self) -> Result<SyncReport>;
}
```

## 8. Workspace Topology

RRO crates live as workspace members inside DevPulse at kernel/rro-*. Path dependency during dev. Independently publishable to crates.io for rroflow.ai customers. Same source serves both.

```toml
# Workspace root: D:\localdev\platform_devpulse\Cargo.toml
[workspace]
members = [
    'kernel/devpulse-clyffy',
    # ... existing members ...
    'kernel/rro-core',
    'kernel/rro-encoder',
    'kernel/rro-qdrant',
    'kernel/rro-libsql',
    'kernel/rro-surrealdb',
    'kernel/rro-duckdb',
    'kernel/rro-moka',
    'kernel/rro-decision',
    'kernel/rro-kernel-rag',
    'kernel/rro-kernel-cag',
    'kernel/rro-kernel-hmm',
    'kernel/rro-kernel-rkyv',
    'kernel/rrd',
]
```

Crate purposes:

| Crate | Purpose |
|-------|---------|
| rro-core | Traits, types, ReasoningObject, RROBackend, errors |
| rro-encoder | Burn-based encoder. Harrier 0.6B today, custom 0.5B target. ArcSwap hot reload. |
| rro-qdrant | Custom Qdrant fork wrapped behind RROBackend trait |
| rro-libsql | libSQL backend (SSOT recovery anchor) |
| rro-surrealdb | SurrealDB backend (graph), SurrealKV storage engine |
| rro-duckdb | DuckDB backend (analytics) |
| rro-moka | Moka 4-instance hot cache backend |
| rro-decision | Decision Engine: query planner, mode dispatcher, scoring |
| rro-kernel-rag | RAG pipeline: hybrid search + RRF + rerank |
| rro-kernel-cag | CAG pipeline: HMM-driven prefetch + structure-for-llm |
| rro-kernel-hmm | HMM: TransitionMatrix, EmissionMatrix, Viterbi, Baum-Welch |
| rro-kernel-rkyv | RKYV three-tier serialization helpers |
| rrd | Reason Ready Daemon: orchestrator, lifecycle, hot reload |

Cargo.toml dependency pattern (DevPulse consumer side):

```toml
[dependencies]
rro-core = { path = '../rro-core' }
rrd = { path = '../rrd' }
rro-decision = { path = '../rro-decision' }
```

## 9. Implementation Phases

### Phase 1 - Core Foundation
- kernel/rro-core: ReasoningObject, ObjectKind, RROBackend trait, BackendType, BackendCapabilities, errors
- kernel/rro-core: RROConfig, rro.toml parsing
- kernel/rro-core: RROQuery, RROResult, ScoredObject, SearchOptions, RagOptions

### Phase 2 - Encoder + Embedder
- kernel/rro-encoder: Burn workspace dependency added
- kernel/rro-encoder: Embedder trait (embed, reload, pause, resume, dimensions)
- kernel/rro-encoder: BurnEmbedder implementation
- kernel/rro-encoder: Tokenizer wrapper (HuggingFace tokenizers crate)
- kernel/rro-encoder: Last-token pool + L2 normalize
- kernel/rro-encoder: ArcSwap hot-reload
- kernel/rro-encoder: Harrier 0.6B Qwen3-arch loader
- Validation: spike against Python sentence-transformers reference, cosine similarity > 0.999


### Phase 3 - Backends
- kernel/rro-qdrant: Custom Qdrant fork wrapped behind RROBackend trait
- kernel/rro-libsql: libSQL backend (SSOT)
- kernel/rro-moka: 4-instance hot cache (session, context, pattern, graph)
- kernel/rro-surrealdb: SurrealDB graph backend with SurrealKV storage
- kernel/rro-duckdb: DuckDB analytics backend

### Phase 4 - Decision Engine
- kernel/rro-decision: DecisionEngine struct with embedder + reranker
- kernel/rro-decision: QueryStrategy enum (Direct, Hybrid, Predictive, StatePredicted)
- kernel/rro-decision: plan_query mode-aware dispatch
- kernel/rro-decision: BGE-Reranker-Base integration

### Phase 5 - Kernel Methods
- kernel/rro-kernel-rag: rag_search (4-step pipeline), rrf_fuse
- kernel/rro-kernel-cag: cag_prefetch, structure_for_llm
- kernel/rro-kernel-hmm: HMM struct, predict_next_concepts (Viterbi), update (Baum-Welch)
- kernel/rro-kernel-rkyv: Three-tier serialization helpers

### Phase 6 - RRD (Reason Ready Daemon)
- kernel/rrd: Lifecycle state machine
- kernel/rrd: pause_for_update, swap_encoder, resume
- kernel/rrd: Health check aggregation across backends
- kernel/rrd: Failure recovery from libSQL SSOT

### Phase 7 - Integration
- DevPulse consumer side: kernel/devpulse-clyffy depends on rro-core, rrd, rro-decision
- Cortex calls RRO via the public API
- Existing cortex/persistence/rro.rs file: migrate to thin adapter calling rro-core

### Phase 8 - Open-source distribution
- cargo publish per crate to crates.io
- README.md, LICENSE per crate
- rroflow.ai enterprise documentation
- Standalone usage examples (minimal vector-only + full DevPulse stack)

## 10. Cross-References

| Topic | Document |
|-------|----------|
| RRD lifecycle, pause/resume, hot reload | RRD.md (sibling) |
| ReasoningObject data shape, ObjectKind variants | REASON_READY_OBJECT.md (sibling) |
| Cortex layer (rumination, Council, COSTAR+IC) | scripts/docs/CORTEX.md |
| Kernel state machine | scripts/docs/KERNEL.md |
| Model stack and presets | scripts/docs/specs/MODEL-PRESETS-SSOT.md |
| Philosophy and four-product business model | scripts/docs/PHILOSOPHY.md |
| Raw capture notes (8 historical specs) | scripts/docs/consolidation/RRO_CORTEX_RAW_DUMP.md |

## 11. Locked Architectural Decisions

| Lock | Decision |
|------|----------|
| L1 | RRO scope = whole multi-layer reasoning system (encoder + Qdrant + reranker + HMM + CAG + RAG + RKYV + decision engine + 5 backends) |
| L2 | Workspace topology = single repo, RRO at kernel/rro-*, path dep during dev, publishable to crates.io |
| L3 | Encoder framework = Burn (scoped to encoder layer; LLM stays Candle / llama.cpp FFI) |
| L4 | Encoder model = Harrier 0.6B Qwen3-arch bootstrap, custom 0.5B long-term, ArcSwap hot reload |
| L5 | libSQL is SSOT recovery anchor for all other backends |
| L6 | Qdrant fork (cortex repo) is default vector backend, stock Qdrant fallback |
| L7 | SurrealDB graph backend uses SurrealKV storage engine, NOT rocksdb (Windows) |
| L8 | Moka 4 named cache instances: session (30m TTL), context (5m TTI), pattern (1h TTL), graph (10m TTI) |
| L9 | rkyv 0.8.15 for internal, JSON+YAML for LLM, JSON-RPC for MCP perimeter |
| L10 | Three modes: General (<50ms), ScientificResearch (200-500ms), Explicit (variable) |
| L11 | RRO does NOT own: rumination, COSTAR+IC, Council, Fox, kernel state machine, minions, Scribe, ROTI |
| L12 | RRO is in-process, embedded only, no HTTP boundary inside the cluster |

---

*This document supersedes all prior RRO drafts (v1.0.0, v1.1.0). Generated from consolidated raw capture across 8 historical specs and owner-locked decisions.*
