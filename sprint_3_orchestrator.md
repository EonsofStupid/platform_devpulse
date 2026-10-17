# Sprint 3: The Orchestrator (Layer 3)

**Status:** PROPOSED (Review Needed)
**Goal:** Implement the "Muscle" - Heavy dependencies, AI integration, and core logic.

## Layer 3: ORCHESTRATOR
**Crate:** `orchestrator`
**Dependencies:** `engine`, `shared`, `candle-*`, `libsql`, `duckdb`

### Module: `infra::core` (AI)
**File:** `orchestrator/src/infra/core/llm.rs`
**Proposed Types:**
```rust
pub struct CandleLlmService {
    model: candle_transformers::models::quantized_llama::Model,
    tokenizer: tokenizers::Tokenizer,
}

impl LlmService for CandleLlmService {
    // Implements shared::interfaces::LlmService
}
```

### Module: `infra::persistence`
**File:** `orchestrator/src/infra/persistence/mod.rs`
**Proposed Types:**
```rust
// The container that holds the concrete adapters.
// The Cortex will ask for `Box<dyn ProjectRepository>`, not `LibSqlDb`.
pub struct PersistenceLayer {
    pub projects: Arc<dyn ProjectRepository>,
    pub signals: Arc<dyn SignalRepository>,
    pub wal: Arc<FjallStore>,
}
```

**File:** `orchestrator/src/infra/persistence/libsql_adapter.rs`
```rust
pub struct LibSqlProjectRepository {
    conn: libsql::Connection,
}

impl ProjectRepository for LibSqlProjectRepository {
    // Implements shared::interfaces::ProjectRepository
    async fn get_project(&self, id: Uuid) -> Result<Option<Project>> { ... }
}
```

**File:** `orchestrator/src/infra/persistence/duckdb_adapter.rs`
```rust
pub struct DuckDbSignalRepository {
    conn: duckdb::Connection,
}

impl SignalRepository for DuckDbSignalRepository {
    // Implements shared::interfaces::SignalRepository
    async fn record_signal(&self, signal: &SignalEnvelope) -> Result<()> { ... }
}
```

### Module: `cortex` (The Cortex)
**File:** `orchestrator/src/cortex/mod.rs`
**Proposed Types:**
```rust
pub struct Cortex {
    llm: Arc<dyn LlmService>,
    memory: Arc<PersistenceLayer>,
}

impl Cortex {
    /// The Reasoning Loop.
    /// Takes a signal, thinks about it, produces new signals (actions).
    pub async fn process(&self, signal: SignalEnvelope) -> Result<Vec<SignalVariant>> {
        // 1. Retrieve Context
        // 2. Generate Reasoning
        // 3. Output Action
    }
}
```

## Review Checklist
- [ ] Is `PersistenceLayer` properly separated? (LibSQL vs DuckDB)
- [ ] Does `Cortex` need access to the `Registry` directly?
- [ ] Are we correctly using `candle` structs for the implementation?
