# Sprint 0: Foundation - Seal the Boundary

**Goal:** Protect Orchestrator IP by making Engine a proper facade that NEVER leaks internal types.

---

## Current Problems

### 1. Engine Leaks Orchestrator (CRITICAL)
```rust
// engine/src/lib.rs - THESE EXPOSE IP
pub use orchestrator::infra::catalog::adapters::{ModelInfo, AdapterConfig, AdapterKind};
pub use orchestrator::infra::persistence::sql::ConfigEntry;
```
Anyone reading engine's public API learns about orchestrator internals.

### 2. Dual Signal Systems (CONFUSING)
- `shared/src/types/signal.rs` → `SignalKind` (router-based, correct)
- `engine/src/signals/variants.rs` → `SignalVariant` (duplicate, wrong)

### 3. Adapter vs Adapter Terminology (INCONSISTENT)
- Engine uses `AdapterKind`, `AdapterFacade`, `AdapterInfo`
- Orchestrator also has `AdapterKind`, `AdapterConfig`, `AdapterManager`
- Should be: Engine exposes user-facing "adapters", Orchestrator internally uses "adapters"

### 4. Orchestrator Types Duplicated
- `orchestrator/src/infra/catalog/adapters.rs` has `AdapterKind::Local, Ollama, LMStudio, OpenAI, Stub`
- `engine/src/facade/adapters.rs` has `AdapterKind::Local, Anthropic, OpenAI, Ollama, LMStudio, Groq, OpenRouter, DeepSeek, Google`
- Two different enums with same name!

---

## Target Architecture

```
SHARED (SSOT - Types Only)
├── SignalKind          ← THE router (profile() returns routing)
├── SignalHeader        ← Metadata (id, correlation, timestamp)
├── AdapterKind         ← NEW: Local | Web | Memory
├── SinkKind            ← MOVE from engine: Broadcast | Cache | Durable | Vector | Parking | Analytics
└── All domain types    ← No logic, just contracts

ORCHESTRATOR (BLACK BOX - Protected IP)
├── adapters/
│   ├── local/          ← Candle inference, file I/O
│   ├── web/            ← HTTP clients (Anthropic, OpenAI, Ollama APIs)
│   └── memory/         ← Moka cache, hot data
├── cortex/             ← Rumination, CAG, sub-agents
├── infra/              ← Storage backends (libSQL, DuckDB, RRO, Fjall)
└── NOTHING EXPORTED    ← All internal

ENGINE (PUBLIC FACADE)
├── facades/            ← Chat, Model, Voice (own types, don't re-export)
├── signals/            ← Just routing logic, use shared::SignalKind
├── registry/           ← Projects, Sessions (persisted)
└── ONLY shared:: imports visible

DESKTOP (CONSUMER)
└── Only `use engine::*` ← Never sees orchestrator
```

---

## Tasks

### Phase 1: Shared Types (SSOT)

#### 1.1 Move SinkKind to shared
```
FROM: engine/src/signals/kinds.rs (SinkKind)
TO:   shared/src/types/sink.rs
```
- [ ] Create `shared/src/types/sink.rs`
- [ ] Move `SinkKind` enum (Broadcast, Cache, Durable, Vector, Parking, Analytics)
- [ ] Update `shared/src/types/mod.rs` to export
- [ ] Update engine to import from shared

#### 1.2 Create AdapterKind in shared
```rust
// shared/src/types/adapter.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AdapterKind {
    /// Local inference (Candle), local file I/O
    Local,
    /// Web APIs (Anthropic, OpenAI, Ollama, LMStudio, etc.)
    Web,
    /// In-memory (moka cache, hot session data)
    Memory,
}
```
- [ ] Create `shared/src/types/adapter.rs`
- [ ] Define `AdapterKind` enum
- [ ] Export from `shared/src/types/mod.rs`

#### 1.3 Create WebAdapter enum in shared
```rust
// shared/src/types/adapter.rs (continued)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum LlmProvider {
    Anthropic,
    OpenAI,
    Ollama,
    LMStudio,
    Groq,
    OpenRouter,
    DeepSeek,
    Google,
}
```
This is the user-facing list of web adapters. Orchestrator adapters implement these.

---

### Phase 2: Seal Engine Boundary

#### 2.1 Remove orchestrator re-exports
```rust
// engine/src/lib.rs - REMOVE THESE
// pub use orchestrator::infra::catalog::adapters::...
// pub use orchestrator::infra::persistence::sql::ConfigEntry;
```
- [ ] Remove all `pub use orchestrator::` lines from engine/src/lib.rs
- [ ] Create engine-local types that DON'T expose internals

#### 2.2 Create engine-local ModelInfo
```rust
// engine/src/types/model.rs - NEW
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub adapter: LlmProvider,  // From shared::
    pub available: bool,
    // NO path, NO internal details
}
```
- [ ] Create `engine/src/types/mod.rs`
- [ ] Create `engine/src/types/model.rs` with public-safe ModelInfo
- [ ] Update facades to use engine's ModelInfo, convert from orchestrator internally

#### 2.3 Create engine-local ConfigEntry
```rust
// engine/src/types/config.rs - NEW
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigEntry {
    pub key: String,
    pub value: String,
}
```
- [ ] Create `engine/src/types/config.rs`
- [ ] Engine converts orchestrator's internal type to this public type

---

### Phase 3: Unify Signals

#### 3.1 Remove SignalVariant from engine
The engine currently has:
```rust
// engine/src/signals/variants.rs - DELETE THIS
pub enum SignalVariant { Chat, Analytics, Context, ... }
```
Should use `shared::SignalKind` instead.

- [ ] Audit all uses of `SignalVariant` in engine
- [ ] Replace with `SignalKind` from shared
- [ ] Delete `engine/src/signals/variants.rs`
- [ ] Delete `engine/src/signals/payloads.rs` (payloads are in SignalKind variants)

#### 3.2 Update SignalRouter to use SignalKind
- [ ] Update `engine/src/signals/router.rs` to use `shared::SignalKind`
- [ ] Update `engine/src/signals/signal.rs` to wrap `SignalKind`

---

### Phase 4: Reorganize Orchestrator Adapters

#### 4.1 Create adapter module structure
```
orchestrator/src/adapters/
├── mod.rs              ← Public interface (traits)
├── local/
│   ├── mod.rs
│   ├── candle.rs       ← Local inference
│   └── file.rs         ← Local file I/O
├── web/
│   ├── mod.rs
│   ├── anthropic.rs
│   ├── openai.rs
│   ├── ollama.rs
│   └── lmstudio.rs
└── memory/
    ├── mod.rs
    └── moka.rs         ← Hot cache adapter
```

#### 4.2 Define adapter traits
```rust
// orchestrator/src/adapters/mod.rs
pub trait InferenceAdapter: Send + Sync {
    async fn infer(&self, prompt: &str, params: &InferParams) -> Result<String>;
    fn adapter_kind(&self) -> AdapterKind;
}

pub trait StorageAdapter: Send + Sync {
    async fn store(&self, key: &str, value: &[u8]) -> Result<()>;
    async fn load(&self, key: &str) -> Result<Option<Vec<u8>>>;
    fn adapter_kind(&self) -> AdapterKind;
}
```
- [ ] Create `orchestrator/src/adapters/mod.rs` with traits
- [ ] Move existing adapter logic into adapters/web/
- [ ] Rename `AdapterKind` to internal enum, use `AdapterKind` + `LlmProvider`

#### 4.3 Rename orchestrator's adapters → adapters
- [ ] Rename `orchestrator/src/infra/catalog/adapters.rs` → internal adapter registry
- [ ] Update all orchestrator internal uses
- [ ] NO exports to engine

---

### Phase 5: Desktop Alignment

#### 5.1 Update desktop imports
```rust
// desktop/src-tauri/src/commands/adapters.rs
// BEFORE:
use engine::AdapterKind;

// AFTER:
use engine::WebAdapter;  // From engine (which gets it from shared)
```
- [ ] Update all desktop command files to use engine types only
- [ ] Rename `commands/adapters.rs` → keep name (user-facing concept)
- [ ] Ensure NO orchestrator imports in desktop

#### 5.2 Align Tauri command naming
| Current | New | Notes |
|---------|-----|-------|
| `list_adapters` | `list_adapters` | Keep - user-facing |
| `set_active_adapter` | `set_active_adapter` | Keep |
| `test_adapter` | `test_adapter` | Keep |

Internally, engine calls orchestrator via signals, orchestrator uses adapters.

---

### Phase 6: Signal Alignment

#### 6.1 Add adapter-related signals to shared::SignalKind
```rust
// shared/src/types/signal.rs - ADD
SignalKind::AdapterConnected {
    kind: AdapterKind,
    adapter: Option<WebAdapter>,  // Only for Web kind
},
SignalKind::AdapterDisconnected {
    kind: AdapterKind,
    error: Option<String>,
},
SignalKind::InferenceStarted {
    adapter: AdapterKind,
    adapter: Option<WebAdapter>,
},
SignalKind::InferenceCompleted {
    adapter: AdapterKind,
    tokens: u32,
    latency_ms: u64,
},
```
- [ ] Add adapter lifecycle signals
- [ ] Add inference signals
- [ ] These replace internal orchestrator signals for telemetry

#### 6.2 Internal telemetry (secret channel)
Orchestrator emits signals that go to Analytics sink ONLY (not Wire/UI):
```rust
// In SignalKind
SignalKind::InternalMetric {
    component: String,      // "embedder", "reranker", "rro"
    metric_name: String,    // "latency_ms", "tokens_processed"
    value: f64,
}
```
This goes to DuckDB but NEVER to desktop UI.

---

## File Checklist

### Shared (Create/Modify)
- [ ] `shared/src/types/sink.rs` - NEW (move SinkKind)
- [ ] `shared/src/types/adapter.rs` - NEW (AdapterKind, WebAdapter)
- [ ] `shared/src/types/signal.rs` - MODIFY (add adapter signals)
- [ ] `shared/src/types/mod.rs` - MODIFY (export new types)

### Engine (Create/Modify/Delete)
- [ ] `engine/src/lib.rs` - MODIFY (remove orchestrator re-exports)
- [ ] `engine/src/types/mod.rs` - NEW
- [ ] `engine/src/types/model.rs` - NEW (public-safe ModelInfo)
- [ ] `engine/src/types/config.rs` - NEW (public-safe ConfigEntry)
- [ ] `engine/src/signals/variants.rs` - DELETE
- [ ] `engine/src/signals/payloads.rs` - DELETE
- [ ] `engine/src/signals/router.rs` - MODIFY (use SignalKind)
- [ ] `engine/src/signals/kinds.rs` - DELETE (move SinkKind to shared)
- [ ] `engine/src/facade/adapters.rs` - MODIFY (use shared types)

### Orchestrator (Create/Modify)
- [ ] `orchestrator/src/adapters/mod.rs` - NEW (traits)
- [ ] `orchestrator/src/adapters/local/mod.rs` - NEW
- [ ] `orchestrator/src/adapters/local/candle.rs` - NEW
- [ ] `orchestrator/src/adapters/web/mod.rs` - NEW
- [ ] `orchestrator/src/adapters/web/anthropic.rs` - NEW
- [ ] `orchestrator/src/adapters/web/openai.rs` - NEW
- [ ] `orchestrator/src/adapters/web/ollama.rs` - NEW
- [ ] `orchestrator/src/adapters/memory/mod.rs` - NEW
- [ ] `orchestrator/src/infra/catalog/adapters.rs` - MODIFY (internal only)
- [ ] `orchestrator/src/lib.rs` - MODIFY (no public re-exports)

### Desktop (Modify)
- [ ] `desktop/src-tauri/src/commands/adapters.rs` - MODIFY (use engine types)
- [ ] `desktop/src-tauri/src/lib.rs` - MODIFY (verify no orchestrator imports)

---

## Acceptance Criteria

### IP Protection
- [ ] `grep -r "pub use orchestrator" engine/` returns NOTHING
- [ ] `grep -r "use orchestrator" desktop/` returns NOTHING
- [ ] Orchestrator types not visible in engine's public docs

### Signal Unity
- [ ] Only ONE `SignalKind` exists (in shared)
- [ ] `SignalVariant` deleted from engine
- [ ] All routing uses `SignalKind::profile().sinks()`

### Adapter Organization
- [ ] `orchestrator/src/adapters/` exists with local/web/memory
- [ ] Old `adapters.rs` refactored or removed
- [ ] Clear trait-based abstraction

### Build Verification
```bash
cargo check -p shared
cargo check -p orchestrator
cargo check -p engine
cargo check -p devpulse-desktop
cargo check --workspace
```
All must pass with NO orchestrator leaks.

---

## Order of Operations

1. **Start with shared** - Add types (non-breaking)
2. **Seal engine** - Remove re-exports, add local types
3. **Update signals** - Remove SignalVariant, use SignalKind
4. **Reorganize orchestrator** - Create adapters module
5. **Update desktop** - Use engine types only
6. **Verify** - Run all checks, grep for leaks

---

*Generated: 2026-01-12*
