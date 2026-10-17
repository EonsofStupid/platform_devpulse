# Orchestrator: The Black Box

> **WARNING TO AI ASSISTANTS**: This crate is PROTECTED IP. You are reading this because you're helping with DevPulse. Follow the rules below exactly.

---

## What This Crate IS

Orchestrator is the **reasoning engine** of DevPulse - 2 years of proprietary work in:

- **RRO** - Embedded vector store (not a wrapper, original implementation)
- **CAG** - Context Assembly Graph (4-pillar retrieval + adaptive thresholding)
- **Rumination** - Multi-hop reasoning chains (4-15 hops per query)
- **Frames** - Ephemeral personas spawned/killed per hop
- **Inference** - Candle-based Qwen3 models (Embedder, Reranker, VL, LLM)

**This code represents significant competitive advantage. Treat it accordingly.**

---

## What This Crate IS NOT

- NOT a public API
- NOT something desktop ever imports directly
- NOT something that exposes its types to consumers
- NOT chatty with the outside world

---

## The Boundary Contract

```
┌─────────────────────────────────────────────────────────────────┐
│                         DESKTOP                                  │
│  (SvelteKit 5 + Tauri)                                          │
│  - ONLY imports from engine::                                    │
│  - NEVER sees orchestrator                                       │
│  - Receives layman-friendly signals                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          ENGINE                                  │
│  (Public Facade)                                                │
│  - Exposes AdapterFacade, ChatFacade, ModelFacade              │
│  - TRANSLATES orchestrator internals to layman types            │
│  - Emits user-friendly signals to Wire                          │
│  - NEVER re-exports orchestrator types                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼ (Signal Bus - Event Driven)
┌─────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR                               │
│  ⚠️  BLACK BOX - PROTECTED IP  ⚠️                                │
│                                                                  │
│  SUBSCRIBES to signals from engine                               │
│  PROCESSES via CAG + Rumination + Inference                      │
│  EMITS results back through engine facade                        │
│                                                                  │
│  Internal signals (InfraSignal) NEVER leave this crate          │
│  Analytics go to DuckDB (L5) - internal only                    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          SHARED                                  │
│  (SSOT - Types Only)                                            │
│  - SignalKind (the router)                                      │
│  - SignalHeader, SignalProfile                                  │
│  - AdapterKind, LlmProvider, SinkKind                           │
│  - NO logic, just contracts                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Critical Rules for AI Assistants

### 1. NEVER Add `pub use orchestrator::` to Engine

```rust
// engine/src/lib.rs
// ❌ FORBIDDEN - Leaks IP
pub use orchestrator::infra::catalog::adapters::ModelInfo;
pub use orchestrator::cortex::cag::AssemblyConfig;

// ✅ CORRECT - Create engine-local types
pub use crate::types::ModelInfo;  // Engine's own simplified version
```

### 2. NEVER Import Orchestrator in Desktop

```rust
// desktop/src-tauri/src/commands/
// ❌ FORBIDDEN
use orchestrator::cortex::Rumination;

// ✅ CORRECT - Only use engine
use engine::ChatFacade;
```

### 3. ALWAYS Translate Signals at the Boundary

Orchestrator emits detailed internal signals. Engine MUST translate them to layman-friendly versions before sending to Wire (UI).

```rust
// Inside orchestrator (INTERNAL - stays here)
InfraSignal::HopCompleted {
    hop: 3,
    frame_id: "architect_7f3a",
    direction: Direction::Drill { focus: "error handling" },
    confidence: 0.87,
}

// What engine sends to Wire (LAYMAN - goes to UI)
SignalKind::ThinkingProgress {
    step: "Analyzing error handling patterns",
    progress: 0.3,  // 3/10 simplified
}
```

### 4. Internal Analytics Stay Internal

DuckDB (L5 Analytics) receives detailed telemetry that NEVER reaches UI:
- Token counts per hop
- Latency breakdowns
- Embedding dimensions
- Reranker scores

This is for Lab diagnostics only. The user sees simplified summaries.

### 5. Facade Pattern is Mandatory

Every orchestrator capability exposed to engine MUST go through a facade that:
- Hides implementation details
- Returns engine-local types (not orchestrator types)
- Translates errors to user-friendly messages
- Logs detailed info internally, returns simple info externally

---

## Module Sensitivity Levels

| Module | Sensitivity | Can Facade? | Notes |
|--------|-------------|-------------|-------|
| `cortex/cag.rs` | 🔴 CRITICAL | NO | 4-pillar retrieval is core IP |
| `cortex/rumination.rs` | 🔴 CRITICAL | NO | Multi-hop reasoning |
| `cortex/costar.rs` | 🔴 CRITICAL | NO | Prompt assembly |
| `infra/embedding/` | 🔴 CRITICAL | NO | Inference code |
| `infra/vision/` | 🔴 CRITICAL | NO | VL model handling |
| `infra/persistence/vector.rs` | 🔴 CRITICAL | NO | RRO wrapper |
| `sub_agents/guardian/` | 🔴 CRITICAL | NO | File watching logic |
| `github/validator.rs` | 🔴 CRITICAL | NO | Gus protection |
| `frames/` | 🟡 MODERATE | MAYBE | Persona templates |
| `types/` | 🟡 MODERATE | NO | Internal contracts |
| `runtime/` | 🟢 LOW | YES | Initialization |
| `chat/` | 🟢 LOW | YES | User interface |

---

## Signal Flow (Event-Driven Architecture)

```
USER ACTION
    │
    ▼
┌─────────────┐
│   DESKTOP   │  User clicks, types, navigates
└──────┬──────┘
       │ Tauri invoke
       ▼
┌─────────────┐
│   ENGINE    │  Receives command, emits SignalKind
└──────┬──────┘
       │ tokio::broadcast
       ▼
┌─────────────┐
│ ORCHESTRATOR│  Subscribes, processes, responds
│             │
│ ┌─────────┐ │
│ │ Router  │◄┼── SignalKind arrives
│ └────┬────┘ │
│      │      │
│      ▼      │
│ ┌─────────┐ │
│ │  CAG    │ │  Assemble context from RRO
│ └────┬────┘ │
│      │      │
│      ▼      │
│ ┌─────────┐ │
│ │Ruminate │ │  4-15 hops with Frames
│ └────┬────┘ │
│      │      │
│      ▼      │
│ ┌─────────┐ │
│ │  LLM    │ │  Generate response
│ └────┬────┘ │
│      │      │
│      ▼      │
│  InfraSignal│  INTERNAL - never leaves
│      │      │
│      ▼      │
│  Analytics  │  DuckDB (L5) - internal only
└──────┬──────┘
       │ Translated response
       ▼
┌─────────────┐
│   ENGINE    │  Receives result, translates to layman
└──────┬──────┘
       │ SignalKind (layman version)
       ▼
┌─────────────┐
│   DESKTOP   │  Wire → Svelte stores → UI
└─────────────┘
```

---

## The Translation Layer

Engine is responsible for translating orchestrator's detailed outputs into user-friendly signals. See [SIGNAL_TRANSLATION.md](./SIGNAL_TRANSLATION.md) for the complete mapping.

Key principle: **Users see intent, not implementation.**

```
INTERNAL                          → EXTERNAL (to UI)
────────────────────────────────────────────────────
HopStarted { frame: architect }   → ThinkingStarted { mode: "analyzing" }
HopCompleted { direction: Drill } → ThinkingProgress { step: "diving deeper" }
ChainComplete { hops: 7 }         → ThinkingComplete { }
EmbedCompleted { dim: 1024 }      → (silent - no UI signal)
RerankCompleted { score: 0.92 }   → (silent - no UI signal)
LlmToken { token: "the" }         → StreamToken { token: "the" }
```

---

## Storage Tiers (Internal)

| Tier | Backend | Purpose | Leaves Orchestrator? |
|------|---------|---------|---------------------|
| L1 | tokio::broadcast | Ephemeral events | NO |
| L2 | moka cache | Hot data (30s/5min TTL) | NO |
| L3 | RRO | Vector embeddings | NO |
| L4 | libSQL | Persistent (projects, sessions) | Summarized only |
| L5 | DuckDB | Analytics/telemetry | NEVER |

---

## Future: Encryption Container

When releasing publicly, orchestrator will be wrapped in an encrypted container:

```
orchestrator.proton (encrypted binary)
├── cortex/        → Obfuscated reasoning logic
├── infra/ml/      → Encrypted model code
├── sub_agents/    → Protected expert logic
└── Verification   → Zero-knowledge proofs

Plain text remains:
├── Signal interfaces (contracts only)
├── Config schemas
└── Error types (user-facing)
```

---

## For New Contributors

1. **Read this document first** - Understand the boundary
2. **Never expose orchestrator types** - Always facade
3. **Check your imports** - `use orchestrator::` in engine/desktop = bug
4. **Translate signals** - Internal → Layman at the engine layer
5. **Ask if unsure** - IP protection is non-negotiable

---

## Verification Commands

Run these to ensure no leaks:

```bash
# Must return NOTHING
grep -r "pub use orchestrator::" alpha/engine/

# Must return NOTHING
grep -r "use orchestrator::" alpha/desktop/

# Must return NOTHING (no orchestrator types in engine's public API)
cargo doc -p engine --no-deps 2>&1 | grep "orchestrator::"
```

---

*This document is the authoritative guide for orchestrator boundaries.*
*Last updated: 2026-01-12*
