# Persistence Layer — Agnostic Abstraction Spec


| Field | Value |
|-------|-------|
| Status | DRAFT - Owner review |
| Version | 0.1.0 |
| Last Updated | 2026-05-08 |
| Owner | @jesse |
| Part of | DevPulse Platform |
| Depends on | LOCKED_DECISIONS sections E, N, O, P; BLOCK_SCHEMA_SPEC.md |

---

## 1. Purpose

The intelligence layer is the product. To stay durable while DB tech churns, we use industry-standard hexagonal architecture (ports and adapters): domain code calls traits, adapters plug in, swap occurs without touching domain.

Owner directive: 'we do not want hardcoded rapid moving tech.'

This spec defines:
- Industry-standard naming (boring, normalized, no coined terms)
- The agnostic layer (traits + domain types)
- The hardcoded framework variables (concrete adapters)
- The translation layer between domain and storage

---

## 2. Industry Terminology

### 2.1 Three-Layer Stack

| Layer | Industry term | Role |
|-------|---------------|------|
| Domain | Business / Domain Model | Pure types, trait definitions, zero storage deps |
| Application | Service / Use Case | Domain logic, calls ports, owns workflow |
| Infrastructure | Adapter / Repository Impl | Concrete DB code, swappable |

### 2.2 Pattern Names

| Term | Meaning |
|------|---------|
| Repository pattern | Trait abstracting persistence for one entity |
| DAL (Data Access Layer) | Logical layer exposing traits to app |
| DBAL (Database Abstraction Layer) | Hides specific DBMS behind one interface |
| Port | Trait defined by domain (what it needs) |
| Adapter | Concrete impl of a port |
| Hexagonal Architecture | The umbrella pattern |
| Database-agnostic | Property of an app using DBAL |

### 2.3 Workload Categories (industry standard)

| Industry term | What it stores | DevPulse use case |
|---------------|----------------|-------------------|
| OLTP | User state, transactional writes | Block storage, project state, decisions, anchors |
| OLAP | Aggregations, time-series, telemetry | ROTI metrics, usage analytics, training data |
| Graph | Entities and relationships | Cross-block relations, intelligence layer |
| Vector | Embeddings, similarity search | Lives in RRO (separate spec) |
| Cache | Hot, transient data | Session state, hot blocks |

These five categories have stable industry names. Backends rotate. Categories don't.

---

## 3. Naming Decisions Locked (replaces LOCK N-2 placeholders)

| Concept | DevPulse name (locked) |
|---------|------------------------|
| Workload categories | OLTP, OLAP, Graph, Cache, Vector |
| Trait pattern | Repository, Port, Adapter |
| Adapter crate prefix | dal-* (e.g., dal-libsql, dal-duckdb) |
| Domain crate | devpulse-domain |
| Composition pattern | Hexagonal Architecture / Ports and Adapters |
| Translation function naming | <storage_type>_to_<domain_type> and reverse |

This supersedes LOCK N-2 placeholders (platform.analytics / data.userstate / intelligence.substrate). Industry-standard category terms replace coined names.

---

## 4. The Agnostic Layer (Domain Ports)

These are the traits domain code calls. Zero dependency on libSQL, DuckDB, SurrealDB, or any specific DBMS.

Trait naming convention: <Entity>Repository for OLTP, <Entity>Analytics for OLAP, <Entity>Graph for graph, <Entity>Cache for caching.
```rust
// File: kernel/devpulse-domain/src/ports/mod.rs

// OLTP - transactional state
pub trait BlockRepository: Send + Sync {
    async fn get(&self, id: &BlockId) -> DomainResult<Option<MemoryBlock>>;
    async fn create(&self, block: MemoryBlock) -> DomainResult<MemoryBlock>;
    async fn update(&self, block: MemoryBlock) -> DomainResult<MemoryBlock>;
    async fn delete(&self, id: &BlockId) -> DomainResult<bool>;
    async fn list_for_tier(&self, tier: &Tier) -> DomainResult<Vec<MemoryBlock>>;
}

pub trait ProjectRepository: Send + Sync {
    async fn get(&self, id: &ProjectId) -> DomainResult<Option<Project>>;
    async fn create(&self, project: Project) -> DomainResult<Project>;
    async fn list(&self) -> DomainResult<Vec<Project>>;
}

pub trait ChatRepository: Send + Sync {
    async fn append(&self, chat: ChatTurn) -> DomainResult<()>;
    async fn list_recent(&self, project: &ProjectId, since: DateTime) -> DomainResult<Vec<ChatTurn>>;
    async fn purge_older_than(&self, cutoff: DateTime) -> DomainResult<u64>;
}

// OLAP - analytics
pub trait AnalyticsStore: Send + Sync {
    async fn record_event(&self, event: AnalyticsEvent) -> DomainResult<()>;
    async fn aggregate(&self, query: AggregationQuery) -> DomainResult<AggregationResult>;
    async fn time_series(&self, metric: &str, range: TimeRange) -> DomainResult<TimeSeries>;
}

// Graph - relationships
pub trait IntelligenceGraph: Send + Sync {
    async fn relate(&self, from: &EntityId, to: &EntityId, rel: Relation) -> DomainResult<()>;
    async fn neighbors(&self, id: &EntityId, max_depth: u8) -> DomainResult<Vec<EntityId>>;
    async fn query(&self, q: &GraphQuery) -> DomainResult<GraphResult>;
}

// Cache - transient
pub trait HotCache<K, V>: Send + Sync
where K: Hash + Eq + Send + Sync, V: Clone + Send + Sync {
    async fn get(&self, key: &K) -> Option<V>;
    async fn put(&self, key: K, value: V) -> ();
    async fn invalidate(&self, key: &K) -> ();
}
```

Domain code only ever sees these trait names. It NEVER sees LibSqlBlockRepository or DuckDbAnalyticsStore.


---

## 5. The Hardcoded Framework Variables (Adapters)

Concrete implementations. Locked per LOCK E-1, E-2.

### 5.1 Adapter Map (today)

| Trait (Port) | Adapter Today | Adapter Crate | Category |
|--------------|---------------|---------------|----------|
| BlockRepository | LibSqlBlockRepository | kernel/dal-libsql | OLTP |
| ProjectRepository | LibSqlProjectRepository | kernel/dal-libsql | OLTP |
| ChatRepository | LibSqlChatRepository | kernel/dal-libsql | OLTP |
| AnalyticsStore | DuckDbAnalyticsStore | kernel/dal-duckdb | OLAP |
| IntelligenceGraph | SurrealDbIntelligenceGraph | kernel/dal-surrealdb | Graph |
| HotCache<K,V> | MokaHotCache<K,V> | kernel/dal-moka | Cache |
| Vector retrieval | RRO (separate spec) | kernel/rro-* | Vector |

### 5.2 Adapter Map (future swap candidates)

| Trait | Today | Future swap |
|-------|-------|-------------|
| BlockRepository | LibSQL | Postgres, Turso, SQLite |
| AnalyticsStore | DuckDB | ClickHouse, Postgres+Timescale |
| IntelligenceGraph | SurrealDB | Neo4j, Memgraph, Clyffy native |
| HotCache | Moka | Redis, in-process LRU |

Domain code does not change when adapters swap. **This is the entire point.**

### 5.3 Crate Layout

`
kernel/
├── devpulse-domain/         # Pure domain. No DB deps.
│   ├── src/types/           # MemoryBlock, Project, etc.
│   ├── src/ports/           # Trait definitions
│   └── src/errors.rs
├── dal-libsql/              # OLTP adapter
├── dal-duckdb/              # OLAP adapter
├── dal-surrealdb/           # Graph adapter
├── dal-moka/                # Cache adapter
└── devpulse-clyffy/         # Domain consumer
    └── src/cortex/          # Accepts traits via DI
`

devpulse-clyffy depends on devpulse-domain. It does NOT depend on dal-* crates. Adapters wire only at composition root.

### 5.4 Composition Root

`ust
// File: interfaces/desktop/src/main.rs
let block_repo: Arc<dyn BlockRepository> = Arc::new(
    LibSqlBlockRepository::new(libsql_conn.clone())
);
let analytics: Arc<dyn AnalyticsStore> = Arc::new(
    DuckDbAnalyticsStore::new(duckdb_conn.clone())
);
let graph: Arc<dyn IntelligenceGraph> = Arc::new(
    SurrealDbIntelligenceGraph::new(surreal_conn.clone())
);
let cache: Arc<dyn HotCache<BlockId, MemoryBlock>> = Arc::new(
    MokaHotCache::new(MokaConfig::default())
);
let cortex = Cortex::new(block_repo, analytics, graph, cache);
`

Swapping a backend = changing this one file.

---

## 6. The Translation Layer

Each adapter is responsible for translating between **domain types** (canonical) and **storage representations** (DB-specific).

### 6.1 Where Translation Lives

`ust
// File: kernel/dal-libsql/src/block_repo.rs
pub struct LibSqlBlockRepository {
    conn: Arc<libsql::Connection>,
}

impl LibSqlBlockRepository {
    // Translation lives here, in the adapter
    fn row_to_block(row: libsql::Row) -> MemoryBlock { ... }
    fn block_to_insert(block: &MemoryBlock) -> (String, Vec<libsql::Value>) { ... }
}
`

The libsql::Row type NEVER escapes this file. The MemoryBlock type is what crosses the boundary.

### 6.2 Translation Rules

| Rule | Rationale |
|------|-----------|
| Domain types are canonical | One source of truth for what data means |
| Storage types are private to the adapter | DB-specific types never leak to domain |
| Translation is one-way per direction | Read: storage to domain. Write: domain to storage. |
| Errors map to DomainError | libsql::Error becomes DomainError::StorageError(...) |
| No serde derives on domain types coupled to storage format | Use separate DTOs in adapter if serialization needed |

### 6.3 Cross-Cutting Concerns

Service layer orchestrates across multiple ports, never adapters directly:

`ust
// File: kernel/devpulse-clyffy/src/cortex/services/block_service.rs
pub struct BlockService {
    block_repo: Arc<dyn BlockRepository>,
    analytics: Arc<dyn AnalyticsStore>,
    cache: Arc<dyn HotCache<BlockId, MemoryBlock>>,
}

impl BlockService {
    pub async fn update_block(&self, block: MemoryBlock) -> DomainResult<MemoryBlock> {
        let updated = self.block_repo.update(block.clone()).await?;
        self.analytics.record_event(AnalyticsEvent::BlockUpdated {
            block_id: updated.id.clone(),
            updater: updated.updater.clone(),
            timestamp: Utc::now(),
        }).await?;
        self.cache.invalidate(&updated.id).await;
        Ok(updated)
    }
}
`

---

## 7. Cortex Global, Storage Per-Project (LOCK O integration)

The repository pattern naturally enables this:

`ust
// Global tier - composition root constructs ONE instance
let global_block_repo = Arc::new(LibSqlBlockRepository::new(global_libsql_conn));

// Project tier - composition root constructs ONE per active project
let project_block_repo = Arc::new(LibSqlBlockRepository::new(project_libsql_conn));

let cortex = Cortex::new(
    global_blocks: global_block_repo,
    project_blocks: project_block_repo,
);
`

Cortex is global (one instance). The repos it holds are tier-scoped. Same trait, different connection, different scope.

---

## 8. Open Items

- Single-impl traits: HotCache trait if only Moka is ever used? Default yes for symmetry.
- async-trait crate vs native async traits: Rust 1.75+ supports native but limited.
- Generic vs entity-specific repos: industry leans entity-specific.
- Migrations location: per-adapter crate (dal-libsql/migrations/) - confirm.
- Cross-tier queries (LOCK O tap mechanism): how does project repo read global tier?

---

## 9. Citations

- Hexagonal Architecture in Rust: tuttlem.github.io/2025/08/31/hexagonal-architecture-in-rust.html
- Master Hexagonal Architecture in Rust: howtocodeit.com/articles/master-hexagonal-architecture-rust
- Database abstraction layer: en.wikipedia.org/wiki/Database_abstraction_layer
- Data access layer: en.wikipedia.org/wiki/Data_access_layer
- TIBCO Data Abstraction Layer: tibco.com/glossary/data-abstraction-layer
- Hexagonal Architecture (Cockburn 2005)
- Clean Architecture (Martin 2017)

---

*End of persistence layer spec. Read alongside BLOCK_SCHEMA_SPEC.md and LOCKED_DECISIONS.md sections E, N, O, P.*
