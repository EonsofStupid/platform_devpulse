# DevPulse Development Rules

## CRITICAL: Before Saying Anything Is "Done"

1. **Verify it's not a stub** - Search for TODO, STUB, PhantomData, unimplemented
2. **Verify persistence exists** - In-memory only = NOT DONE
3. **Verify signals flow** - If nothing emits/subscribes, it's not wired
4. **Run the actual code** - "Compiles" is not "works"

---

## Signal System (CORE ARCHITECTURE)

### One Signal, Typed Routing

```
ANY TRIGGER → Signal { id, correlation_id, timestamp, source, kind }
                                      │
                                      ▼
                              SignalKind.sinks()
                                      │
                    ┌─────────┬───────┼───────┬─────────┐
                    ▼         ▼       ▼       ▼         ▼
                  Wire    Durable  Analytics Cache   Vector
                (Svelte) (libSQL)  (DuckDB) (moka)  (RRO)
```

### Signal Structure

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `Uuid` | Identity (v7 time-ordered) |
| `correlation_id` | `Option<Uuid>` | Parent link (None = root) |
| `timestamp` | `u64` | Unix millis |
| `source` | `Source` | Who created it |
| `kind` | `SignalKind` | What + payload |

### Typed Enums (NO STRINGS)

```
WRONG: Loading { component: String }     ← Lazy, no contract
RIGHT: Loading { component: Component }  ← Typed, compiler enforces
```

**Core Enums:**

| Enum | Variants | Purpose |
|------|----------|---------|
| `Source` | User, System, Expert, Clock | Who created signal |
| `Sink` | Wire, Durable, Analytics, Cache, Vector | Where signal routes |
| `Role` | User, Assistant, System | Chat message role |
| `Component` | Llm, Embedder, Reranker, RRO, Voice | System components |
| `FileEvent` | Created, Modified, Deleted | File change type |
| `HealthStatus` | Healthy, Degraded, Failed | Component health |

### SignalKind Categories

| Category | Examples | Typical Sinks |
|----------|----------|---------------|
| **App** | Chat, Navigation | Wire, Durable, Analytics |
| **OS** | FileChanged, WindowFocus | Wire, Durable |
| **Diagnostic** | Loading, Loaded, Failed, Health | Wire, Analytics |
| **Analytics** | Metric, QueryExecuted | Analytics |
| **Cache** | CacheHit, CacheMiss | Analytics |

### Adding a New Signal

1. Add variant to `SignalKind` enum in `shared/src/types/signal.rs`
2. Use typed enums for fields (not String)
3. Implement `sinks()` match arm
4. `cargo check -p shared`

**The types ARE the documentation. If it's not in the enum, it doesn't exist.**

---

## Crate Structure

```
alpha/
├── shared/        ← SSOT: Signal, SignalKind, all enums
├── engine/        ← FACADE: Public API, event bus, routing
├── orchestrator/  ← IP/LLM: CAG, LLM, ML models, storage backends
├── desktop/       ← Tauri + SvelteKit
└── lab/           ← Axum + SvelteKit
```

### Architecture Layers

**Engine (Facade Layer)**
- Public API that desktop/lab call
- Receives external events (webhooks, commands)
- Emits signals to event bus
- Routes signals to sinks
- NO business logic, NO direct calls to orchestrator

**Orchestrator (IP/Llm Layer - Black Box Subscriber)**
- Subscribes to engine signals (listens passively)
- ALL business logic lives here
- CAG (Contextualized Agentic Graph)
- ML models (Llm, Embedder, Reranker, RRO)
- Storage backends (libSQL, DuckDB, moka, Qdrant)
- Emits result signals back to bus
- **This is your proprietary tech - protected IP**

### Communication Model (Event-Driven)

```
GitHub Webhook → Engine (receives)
                    ↓
                 emits: GitHubPushReceived
                    ↓
          ┌─────────┴─────────┐
          ↓                   ↓
    Orchestrator          Wire Sink
    (subscribed)          (to Svelte)
          ↓
    ML Pipeline
    (silent work)
          ↓
    emits: GitHubCheckCompleted { result: "✅ Gus approved" }
          ↓
    Wire Sink → Desktop
```

**User sees:** "✅ Maestro approved this commit"  
**User never knows:** 0.6B models exist, Qdrant exists, CAG exists

### Dependency Rules

- Desktop → Engine (public API only)
- Lab → Engine (public API only)
- **NO ONE calls orchestrator directly**
- Engine emits signals → Orchestrator subscribes
- Orchestrator emits signals → Engine routes to sinks
- Everyone → Shared (types only)

### IP Protection Strategy

**Current:** Orchestrator is separate crate  
**Future:** Wrap orchestrator in encrypted container (Antigravity/Windsurf model)
- Proton wrapper around entire crate
- User data stays in plain Rust
- ML/CAG logic is obfuscated binary

---

## Progressive Disclosure (3-Layer Complexity)

Every user-facing feature supports 3 levels of detail:

### Layer 1: Default (Layman Friendly)
- Simple, friendly language
- Result-focused: "✅ Maestro approved"
- No technical jargon
- Gamified, encouraging
- **Target:** Vibe coder who just wants it to work

### Layer 2: Curious (Educational)
- What was checked: "patterns, secrets, file sizes"
- Why it matters: "this keeps your code consistent"
- Gentle terminology introduction
- Expandable details (click to reveal)
- **Target:** User starting to learn how things work

### Layer 3: Power (Technical)
- Full technical details: "0.6B embedder, Qdrant similarity"
- API names, model names, architecture
- Debug information, logs
- Advanced configuration
- **Target:** User who graduated to understanding the stack

### Implementation

Every `SignalKind` that goes to Wire sink includes:
```rust
summary_simple: String,    // Layer 1: "✅ Gus approved"
summary_detailed: String,  // Layer 2: "Checked patterns, secrets, files"
metadata: Option<Value>,   // Layer 3: Full technical JSON
```

Desktop UI renders Layer 1 by default, reveals Layer 2/3 on click.

**Philosophy:** Never overwhelm. Let curiosity drive learning.

---

## GitHub Protection Flow (Maestro Protector)

### User Experience (3 Clicks)

```
Desktop → "Add Project" → "GitHub Repository"
    ↓
OAuth popup → user authorizes
    ↓
Select repo → toggle protection rules → "Activate"
    ↓
"✅ Gus is protecting cooking-blog"
```

User keeps using Lovable/Bolt normally. Gus watches silently.

### Technical Flow (Event-Driven)

```
Lovable/Bolt commits to GitHub
    ↓
GitHub webhook → Engine receives POST /webhooks/github
    ↓
Engine validates signature, emits signals:
    • GitHubPushReceived (internal - orchestrator subscribes)
    • GusCheckingCommit (Layer 1 - desktop sees "🔍 Gus checking...")
    ↓
Orchestrator (BLACK BOX - subscribes to GitHubPushReceived):
    1. Fetch diff from GitHub API
    2. Rule checks (secrets, file size) - instant
    3. Embed changed chunks (0.6B embedder)
    4. Search Qdrant for similar patterns (RRO - L4)
    5. Classify drift (0.6B classifier)
    6. Rerank confidence (0.6B reranker)
    7. Decision: Pass/Warn/Fail/NeedsReview
    8. Update GitHub check run (success/neutral/failure)
    9. Emit GusCheckCompleted signal
    ↓
Engine routes GusCheckCompleted → Wire sink → Desktop
    ↓
Desktop renders:
    Layer 1: "✅ Gus approved your recipe card"
    Layer 2: [click] "Patterns aligned • No secrets • Files OK"
    Layer 3: [click] "0.6B embedder • Qdrant similarity • Check run ID: 123"
```

### Storage

| Lane | What's Stored | Purpose |
|------|---------------|---------|
| L1 (broadcast) | GusCheckCompleted signal | Real-time desktop notification |
| L3 (libSQL) | GitHub projects, check history | Config, audit trail |
| L4 (RRO) | Code chunk embeddings | Drift detection similarity search |
| L6 (DuckDB) | Protection analytics | "Blocked 47 secrets this month" |

### IP Protection

User never sees:
- Webhook endpoints
- ML model names (0.6B embedder/reranker)
- Qdrant vector database
- Check run API calls
- CAG decision logic

User only sees:
- Maestro (friendly protector)
- Simple results (✅/⚠️/🛡️)
- Gamification ("Protected you 12 times")
- Progressive education (Layer 2/3 details)

---

## Sink Routing

Each `SignalKind` declares where it routes:

| Sink | Backend | Purpose |
|------|---------|---------|
| `Wire` | Tauri events | Goes to Svelte UI |
| `Durable` | libSQL | Persisted data |
| `Analytics` | DuckDB | Metrics, events |
| `Cache` | moka | Hot data (TTL) |
| `Vector` | RRO | Embeddings |

---

## Module Checklist (MANDATORY)

### Phase 0: Boundary
- [ ] Define crate location
- [ ] Define dependencies/consumers

### Phase 1: Contract
- [ ] Structs with typed fields (no String cop-outs)
- [ ] Enums for all variants
- [ ] Error types

### Phase 2: Observability
- [ ] Emit `Signal { kind: Loading/Loaded/Failed }` (NOT tracing macros)

### Phase 3: Tests
- [ ] Tests that actually run

### Phase 4: Docs
- [ ] `///` on public items

### Phase 5: Security
- [ ] No secrets in signals
- [ ] Validate external inputs

---

## State Sync (Rust ↔ Svelte)

| Type | Purpose |
|------|---------|
| `Signal` | Events (fire & forget) |
| `Snapshot` | Full state (hydration) |
| `Delta` | Incremental update (with drift protection) |
| `Command` | User intent (with undo) |

### Delta Drift Protection

| Field | Purpose |
|-------|---------|
| `base_hash` | Hash before applying (detect missed deltas) |
| `result_hash` | Hash after applying (verify correctness) |

If `hash(state) != result_hash` → request fresh Snapshot.

---

## Persistence Rules

### Must Persist (libSQL)
- Projects, Sessions, Chat history, Settings

### OK In-Memory
- Signal subscriptions, Hot cache, Runtime state

---

## Validation Commands

```bash
# Signal types in shared only
grep -rn "pub struct Signal" alpha/shared/src/     # Must exist
grep -rn "pub enum SignalKind" alpha/shared/src/   # Must exist
grep -rn "pub enum Source" alpha/shared/src/       # Must exist

# No signal types in engine
grep -rn "pub enum SignalVariant" alpha/engine/src/  # Must be 0
```

---

## Dogfooding

- First run: bootstrap DevPulse as project #0
- Lab shows: all component health via `Signal { kind: Health { ... } }`
- No manual setup required
