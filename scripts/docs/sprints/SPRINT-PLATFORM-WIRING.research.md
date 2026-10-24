# Research: Platform Wiring — RRO + Seeding + Channels

**Date**: 2026-03-01
**Sprint**: SPRINT-PLATFORM-WIRING
**Status**: IN_PROGRESS (awaiting user decisions)

## Question/Goal

Wire the remaining platform infrastructure so the system boots with real data, real vector search, and a connection to devpulse.app. Three workstreams:

1. **RRO (Reasoning Ready Object)** — Custom Qdrant fork, declared in workspace but never imported. Wire into cortex persistence and engine platform facade.
2. **Database Seeding** — All 4 stores boot with empty schemas. No default project, scope, persona, or config. Need seed data after init.
3. **Platform Channels** — No connection to devpulse.app for updates, licensing, or system announcements. Need config, IPC commands, and frontend rune.

---

## Codebase Analysis

### A. RRO Current State

#### Workspace Declaration (EXISTS but UNUSED)
```toml
# Root Cargo.toml — workspace dependencies
rro = { git = "https://github.com/EonsofStupid/rro", branch = "alpha" }
wal = { git = "https://github.com/EonsofStupid/wal", branch = "rro-alpha" }
tar-rs = { git = "https://github.com/EonsofStupid/tar-rs", branch = "rro-alpha" }
kokoros = { git = "https://github.com/EonsofStupid/Kokoros" }
```

**Problem**: All 4 git deps are declared but NO crate in the workspace imports them.

#### RRO Public API (verified from `EonsofStupid/rro` branch `alpha`)

| Function | Signature | Notes |
|----------|-----------|-------|
| `QdrantInstance::start()` | `fn start(config_path: Option<String>) -> Result<Arc<QdrantClient>, QdrantError>` | Spawns Qdrant on its own OS thread via mpsc channel |
| `QdrantClient::create_collection()` | `async fn create_collection(&self, name, vectors_config) -> Result<bool>` | |
| `QdrantClient::upsert_points()` | `async fn upsert_points(&self, collection, points, wait) -> Result<PointsOperationResponse>` | |
| `QdrantClient::search_points()` | `async fn search_points(&self, request: SearchRequest) -> Result<Vec<ScoredPoint>>` | |
| `QdrantClient::delete_collection()` | `async fn delete_collection(&self, name) -> Result<bool>` | |
| `QdrantClient::list_collections()` | `async fn list_collections() -> Result<Vec<CollectionDescription>>` | |
| `QdrantClient::count_points()` | `async fn count_points(&self, collection, filter, exact) -> Result<CountResult>` | |
| `QdrantClient::get_points()` | `async fn get_points(&self, request: PointRequest) -> Result<Vec<Record>>` | |
| `QdrantClient::recommend_points()` | `async fn recommend_points(&self, request: RecommendRequest) -> Result<Vec<ScoredPoint>>` | |

**Key types**: `VectorParams`, `Distance`, `PointStruct`, `Payload`, `SearchRequest`

**Architecture**: RRO is NOT a library you call functions on — it starts a full embedded Qdrant instance on a background thread. The `QdrantClient` sends operations via mpsc channel to the instance's `TableOfContent`. This is more like an embedded service than a simple adapter.

**Edition**: Rust 2024, rust-version = "1.89" (matches CI)

#### What Maestro Has (persistence layer)

| File | Purpose | Relevant to RRO? |
|------|---------|-------------------|
| `cortex/persistence/traits.rs` | 6 traits: PersistenceAdapter, TypedPersistence, SqlAdapter, GraphAdapter, AnalyticsAdapter, CacheAdapter | **Missing: VectorAdapter** |
| `cortex/persistence/config.rs` | StoreKind enum (LibSql, DuckDb, Surreal, Moka), PersistenceConfig | **Missing: Rro/Vector variant** |
| `cortex/persistence/mod.rs` | PersistenceLayer with 4 Option<Arc<Adapter>> fields + granular init/ping | **Missing: vector field + init/ping** |
| `cortex/persistence/surreal.rs` | SurrealAdapter — async open, init_schema, ping, PersistenceAdapter + GraphAdapter impl | Pattern to follow for RRO |
| `cortex/persistence/moka.rs` | MokaAdapter — new(config), ping, PersistenceAdapter + CacheAdapter impl | Pattern to follow |
| `cortex/persistence/libsql.rs` | LibSqlAdapter — async open, ping, PersistenceAdapter + SqlAdapter impl, CORE_SCHEMA | Has project/session tables |
| `cortex/persistence/duckdb.rs` | DuckDbAdapter — sync open, ping, PersistenceAdapter + AnalyticsAdapter impl | Analytics schema |

#### What Engine Has (platform facade)

| File | Purpose | Relevant to RRO? |
|------|---------|-------------------|
| `platform/stores/mod.rs` | Store trait + StoreRole enum (Relational, Analytics, Graph, Cache) | **Missing: Vector role** |
| `platform/stores/relational.rs` | RelationalStore wraps LibSqlAdapter | Pattern to follow |
| `platform/stores/analytics.rs` | AnalyticsStore wraps DuckDbAdapter (sync boot!) | Pattern to follow |
| `platform/stores/graph.rs` | GraphStore wraps SurrealAdapter | Pattern to follow |
| `platform/stores/cache.rs` | CacheStore wraps MokaAdapter (infallible) | Pattern to follow |
| `platform/mod.rs` | Platform struct with 4 store fields, boot() sequence, health() | **Missing: vector store field + boot step** |
| `platform/config.rs` | PlatformBootConfig, StoresConfig with 4 entries | **Missing: VectorStoreEntry** |
| `platform.default.toml` | 4 store sections | **Missing: [stores.vector]** |

#### Signal System Already Has Vector Sink
```rust
pub enum SinkKind {
    Broadcast, Cache, Durable, Vector, Parking, Analytics,
}
```
`SinkKind::Vector` EXISTS — signal routing already accounts for a vector store. But nothing subscribes to it.

#### IP Terms Already Map RRO
```toml
# kernel_terms.toml — ALREADY EXISTS
[[terms]]
kernel = "RRO"
engine = "prepared context"
category = "algorithms"

[[terms]]
kernel = "Reasoning Ready Object"
engine = "pre-processed context"
category = "algorithms"
```

**Missing**: "Qdrant" → "vector index" (the term "Qdrant" could leak in logs/errors from the rro crate itself)

---

### B. Database Seeding Current State

#### LibSQL Schema (TABLES EXIST, NO DATA)

Tables created by `CORE_SCHEMA` in `libsql.rs`:
- `kv_store` — key-value binary (empty)
- `projects` — id, name, root_path, project_type, created_at, updated_at (empty)
- `sessions` — id, project_id, start_time, end_time (empty)
- `messages` — id, session_id, role, content, metadata, created_at (empty)
- `platform_config` — key, value, category, updated_at (empty)
- `user_config` — key, value, category, updated_at (empty)

#### DuckDB Schema (TABLES EXIST, NO DATA)

Tables created by `ANALYTICS_SCHEMA` in `duckdb.rs`:
- `kv_store` — key-value binary (empty)
- `user_metrics` — session_id, event_type, event_data, timestamp (empty)
- `ai_metrics` — trace_id, model, prompt_tokens, completion_tokens, latency_ms (empty)
- `signal_metrics` — signal_kind, processing_tier, latency_ms (empty)
- `daily_stats` — date, total_signals, total_messages, total_tokens, avg_latency_ms (empty)

#### SurrealDB Schema (TABLES EXIST, NO DATA)

Tables created by `REASONING_SCHEMA` in `surreal.rs`:
- `kv` — key-value binary (empty)
- `nodes` — reasoning concept nodes (empty)
- `relates` — edges between nodes (empty)
- `states` — HMM state definitions (empty)
- `transitions` — state transition matrix (empty)

#### Moka (IN-MEMORY, NO SEED NEEDED)

#### What Needs Seeding (DECISION REQUIRED)

| Store | Seed Data | Priority |
|-------|-----------|----------|
| LibSQL | Default project? Default scope? | **NEED USER INPUT** |
| LibSQL | Default platform_config entries (theme, language, etc.)? | **NEED USER INPUT** |
| LibSQL | Clyffy persona definition? Or is persona in SurrealDB? | **NEED USER INPUT** |
| SurrealDB | Default HMM states? Default reasoning nodes? | **NEED USER INPUT** |
| SurrealDB | Clyffy persona graph? | **NEED USER INPUT** |
| DuckDB | Nothing (analytics collects over time) | Low |
| RRO | Default collections (e.g., "knowledge", "context", "memory")? | **NEED USER INPUT** |

---

### C. Platform Channels Current State

#### What Exists: NOTHING

No config, no IPC commands, no frontend rune for devpulse.app connection.

#### What's Needed (DECISION REQUIRED)

| Component | Location | Purpose |
|-----------|----------|---------|
| Config section | `platform.default.toml` → `[platform]` | Base URL, update endpoint, license endpoint |
| Rust types | `platform/channels.rs` or similar | PlatformChannel, UpdateInfo, LicenseStatus |
| IPC command | Tauri `commands/` | check_for_updates, validate_license, get_announcements |
| Frontend rune | `sys/runes/channel.svelte.ts` | Svelte 5 rune singleton for update/license state |
| UI integration | StatusBar, settings page | Show update available, license status |

---

### D. Frontend IPC Gap Analysis

| IPC Command | Status | Used By |
|-------------|--------|---------|
| `get_status` | ✅ Working | `health.svelte.ts` polls every 15s |
| `get_settings` | ✅ Working | Not called by any frontend code yet |
| `send_message` | ❌ Echo stub | Not connected to maestro |
| `load_recent` | ❌ Returns empty | Not connected to libsql |
| `post_reaction` | ❌ Empty stub | Not implemented |
| `verify` | ❌ Empty stub | Not implemented |
| `log` | ❌ Empty stub | Not implemented |
| `create_canvas` | ❌ Empty stub | Not implemented |
| `connect_peer` | ❌ Empty stub | Not implemented |
| `open_chat_window` | ✅ Working | TopBar.svelte |

---

### E. Cortex Stub Inventory

| Module | Files | Status | Relevance |
|--------|-------|--------|-----------|
| `cortex/kv_cache/` | attention_sink.rs, sliding_window.rs | Stubs (1 line each) | Future — KV cache for inference |
| `cortex/minions/` | factory.rs, minions.rs, diary.rs, guardian.rs | Stubs | Future — sub-agent lifecycle |
| `cortex/minions/types.rs` | Persona, MinionRole, VoiceTone | Defined (41 lines) | Seeding depends on this |
| `cortex/reasoning/` | chains.rs, hmm.rs | Stubs | Future — reasoning engine |
| `cortex/traits/` | MemoryBank, ReasoningEngine, IdentityProvider | Trait-only (no impl) | Future — cortex contracts |
| `cortex/adapters/` | 18 files, mostly stubs | Parallel adapter layer | Unclear if this duplicates persistence/ |

---

## Findings

### Architecture Integrity

1. **The facade pattern is CLEAN**: Tauri → Engine → Maestro. No leaks. AppState holds `Arc<Platform>`, Platform holds maestro adapters behind store wrappers.

2. **IP protection is SOLID**: 47 terms, feature-gated macro, redaction layer, build-time generation. RRO already mapped. Only "Qdrant" needs adding.

3. **Signal system is AHEAD of stores**: `SinkKind::Vector` already exists but nothing subscribes. The signal routing anticipates a vector store.

4. **Config-driven boot is CLEAN**: TOML embedded at compile time, overridable at runtime. Adding `[stores.vector]` follows the exact same pattern.

5. **Store wrapper pattern is CONSISTENT**: Every store follows: maestro adapter → engine wrapper → implements Store trait → Platform field. RRO follows the same pattern.

### Critical Decisions Needed From User

#### Decision 1: RRO Boot Strategy

RRO is unique — it starts a full Qdrant instance on a background thread. Unlike other adapters that just open a file:

**Option A**: Boot RRO inside `Platform::boot()` like other stores
- Pro: Consistent pattern, health checks unified
- Con: RRO startup is heavier (spawns thread, initializes segments)

**Option B**: Boot RRO separately, before or after Platform::boot()
- Pro: Can start earlier, separate lifecycle
- Con: Breaks the unified boot pattern

**Option C**: Lazy boot — RRO starts on first vector operation
- Pro: Fastest startup if vector search isn't needed immediately
- Con: First vector operation has latency spike

#### Decision 2: RRO Config Location

Where does RRO store its data?

**Option A**: Under `data_dir/rro/` alongside other stores
- Pro: Consistent with libsql/duckdb/surreal paths
- Con: RRO has its own config format (Qdrant YAML)

**Option B**: RRO manages its own data dir (Qdrant default `./storage/`)
- Pro: Less config surface
- Con: Data scattered

#### Decision 3: VectorAdapter Trait Shape

What operations should the VectorAdapter trait expose?

```rust
// Minimal (just what cortex needs now):
pub trait VectorAdapter {
    async fn create_collection(&self, name: &str, dim: u32, distance: Distance) -> Result<()>;
    async fn upsert(&self, collection: &str, points: Vec<PointStruct>) -> Result<()>;
    async fn search(&self, collection: &str, vector: Vec<f32>, limit: usize) -> Result<Vec<ScoredPoint>>;
    async fn delete_collection(&self, name: &str) -> Result<()>;
    async fn ping(&self) -> Result<()>;
}

// Full (expose all RRO capabilities):
pub trait VectorAdapter {
    // Collections
    async fn create_collection(...) -> Result<()>;
    async fn delete_collection(...) -> Result<()>;
    async fn list_collections() -> Result<Vec<String>>;
    // Points
    async fn upsert(&self, ...) -> Result<()>;
    async fn search(&self, ...) -> Result<Vec<ScoredPoint>>;
    async fn get_points(&self, ...) -> Result<Vec<Record>>;
    async fn delete_points(&self, ...) -> Result<()>;
    async fn count_points(&self, ...) -> Result<u64>;
    // Advanced
    async fn recommend(&self, ...) -> Result<Vec<ScoredPoint>>;
    // Health
    async fn ping(&self) -> Result<()>;
}
```

#### Decision 4: Database Seeding Scope

What should exist after first boot?

| Seed | Include? | Details Needed |
|------|----------|----------------|
| Default project | ? | Name? Type? Path? |
| Default scope | ? | What is a scope in this system? |
| Clyffy persona | ? | Which store? What fields? |
| Platform config defaults | ? | Theme, language, etc.? |
| Default HMM states | ? | Initial state machine for reasoning? |
| Default RRO collections | ? | "knowledge", "context", "memory"? Dimensions? |

#### Decision 5: Platform Channels Priority

Should devpulse.app connection be part of this sprint or deferred?

**Include**: Gets the full stack wired end-to-end
**Defer**: Focus on RRO + seeding first, channels can come later

#### Decision 6: wal/tar-rs/kokoros Priority

These are also declared but unused. Wire them now or later?

- `wal` — Write-ahead log (for what? reasoning state?)
- `tar-rs` — Archive format (for what? knowledge export?)
- `kokoros` — Voice synthesis (for Clyffy voice?)

---

## Recommendations (PENDING USER DECISIONS)

### Proposed Execution Order (if all decisions confirmed)

| Phase | What | Files |
|-------|------|-------|
| 1 | Wire RRO into maestro persistence | `maestro/Cargo.toml`, `persistence/traits.rs`, `persistence/config.rs`, `persistence/mod.rs`, NEW `persistence/rro.rs` |
| 2 | Wire RRO into engine facade | `engine/stores/mod.rs`, NEW `engine/stores/vector.rs`, `engine/platform/mod.rs`, `engine/platform/config.rs`, `platform.default.toml` |
| 3 | Add IP terms | `kernel_terms.toml` (add "Qdrant" → "vector index") |
| 4 | Add health types for vector store | `health.types.ts` (no change needed — SubsystemHealth is generic) |
| 5 | Database seeding system | NEW `persistence/seed.rs` or `persistence/seeds/`, modify `PersistenceLayer::init()` |
| 6 | Platform channels | NEW `platform/channels.rs`, NEW `commands/channel.rs`, `platform.default.toml`, NEW `channel.svelte.ts` |

### What NOT to do in this sprint

- Don't wire wal/tar-rs/kokoros (separate sprint, different concerns)
- Don't implement send_message (needs cortex reasoning pipeline first)
- Don't build the cortex stubs (minions, reasoning, kv_cache)
- Don't touch the signal subscriber for Vector sink (needs a consumer first)

---

## Files Referenced

- `Cargo.toml` (workspace root): Git dep declarations, workspace members
- `kernel/devpulse-maestro/Cargo.toml`: Current 4 persistence deps, missing rro
- `kernel/devpulse-maestro/src/cortex/persistence/traits.rs`: 6 adapter traits, missing VectorAdapter
- `kernel/devpulse-maestro/src/cortex/persistence/config.rs`: StoreKind(4), missing Vector
- `kernel/devpulse-maestro/src/cortex/persistence/mod.rs`: PersistenceLayer(4 fields), missing vector
- `kernel/devpulse-maestro/src/cortex/persistence/surreal.rs`: Pattern for async adapter
- `kernel/devpulse-maestro/src/cortex/persistence/moka.rs`: Pattern for config-driven adapter
- `kernel/devpulse-maestro/src/cortex/persistence/libsql.rs`: CORE_SCHEMA with project/session tables
- `kernel/devpulse-maestro/src/cortex/persistence/duckdb.rs`: ANALYTICS_SCHEMA
- `kernel/devpulse-maestro/src/cortex/minions/types.rs`: Persona, MinionRole, VoiceTone
- `systems/devpulse-engine/src/platform/mod.rs`: Platform::boot() sequence
- `systems/devpulse-engine/src/platform/config.rs`: PlatformBootConfig, StoresConfig
- `systems/devpulse-engine/src/platform/stores/mod.rs`: Store trait, StoreRole enum
- `systems/devpulse-engine/src/platform/stores/relational.rs`: Wrapper pattern
- `systems/devpulse-engine/platform.default.toml`: 4 store sections
- `systems/devpulse-engine/ip/kernel_terms.toml`: 47 terms, RRO already mapped
- `systems/devpulse-engine/src/signals/kinds.rs`: SinkKind::Vector already exists
- `interfaces/desktop/src-tauri/src/lib.rs`: Setup hook, IPC handler, AppState
- `interfaces/desktop/src-tauri/src/state.rs`: AppState = Arc<Platform>
- `interfaces/desktop/src/lib/sys/runes/health.svelte.ts`: Health polling rune (pattern to follow)
- `interfaces/desktop/src/lib/sys/runes/global.svelte.ts`: Svelte 5 rune singleton pattern
- `interfaces/desktop/src/lib/sys/generated/health.types.ts`: TS type mirrors
- `interfaces/desktop/src/routes/+layout.svelte`: Root layout starts health polling
