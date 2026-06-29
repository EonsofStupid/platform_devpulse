//! Surreal client adapter — embedded `Surreal<Db>` connection.
//!
//! `DevPulse` opens the `SurrealKV` store in-process via
//! [`super::lifecycle::SurrealLifecycle`] and this adapter wraps the
//! resulting `Surreal<Db>` connection with namespace-scoped operations.
//! No WS, no socket, no auth — the Platform owns the file lock so
//! every query crosses zero process / network boundaries.
//!
//! Two public types:
//! - `SurrealAdapter` — owns the embedded `Surreal<Db>` connection;
//!   cheap to clone (internal `Arc`) so multiple namespace scopes
//!   share one open store.
//! - `ScopedGraphHandle` — namespace-scoped operations. Every query is
//!   prefixed with `USE NS {ns} DB {db};` so namespace isolation is
//!   enforced at the query level, never implicit session state.

use crate::connectome::persistence::config::SurrealNamespace;
use crate::connectome::persistence::surreal::lifecycle::SurrealLifecycle;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use surrealdb::engine::local::Db;
use surrealdb::types::SurrealValue;
use surrealdb::Surreal;

// ═══════════════════════════════════════════════════════════════
// SurrealAdapter — WS client connection owner
// ═══════════════════════════════════════════════════════════════

/// `SurrealDB` client adapter — owns a single embedded `Surreal<Db>` connection.
///
/// The connection is shared across all scoped graph handles. Cloning
/// the underlying `Surreal<Db>` is cheap (internal `Arc`). Every
/// runtime operation goes through `ScopedGraphHandle` which prefixes
/// queries with `USE NS ... DB ...;` — no session-state mutation,
/// no auth round-trip (embedded path holds the file lock directly).
pub struct SurrealAdapter {
    db: Surreal<Db>,
}

impl SurrealAdapter {
    /// Open against an already-booted [`SurrealLifecycle`] and apply
    /// the default kernel reasoning schema.
    ///
    /// Equivalent to [`Self::connect_with_ns`] with the kernel's own
    /// `REASONING` namespace. Engine boot uses `connect_with_ns` so
    /// system/user/global all land on the same embedded store.
    ///
    /// # Errors
    /// - Embedded DB clone fails (extremely rare).
    /// - Schema DDL fails.
    pub async fn connect(lifecycle: &SurrealLifecycle) -> Result<Self> {
        Self::connect_with_ns(
            lifecycle,
            SurrealNamespace::REASONING.namespace,
            SurrealNamespace::REASONING.database,
            REASONING_SCHEMA,
        )
        .await
    }

    /// Clone the embedded connection and apply a schema scoped to
    /// `namespace/database`.
    ///
    /// This is the primary constructor. The `Surreal<Db>` is cloned
    /// (internal `Arc`) so multiple `SurrealAdapter` instances can
    /// share one open `SurrealKV` store. Additional namespaces on the
    /// same connection are initialized via [`Self::init_namespace`].
    ///
    /// # Errors
    /// - Schema DDL fails.
    #[tracing::instrument(
        skip(lifecycle, schema),
        fields(
            data_path = %lifecycle.data_path().display(),
            namespace,
            database,
            schema_len = schema.len()
        ),
        err
    )]
    pub async fn connect_with_ns(
        lifecycle: &SurrealLifecycle,
        namespace: &str,
        database: &str,
        schema: &str,
    ) -> Result<Self> {
        // Clone the live embedded connection. `Surreal<Db>: Clone`
        // shares the internal `Arc` with no second open of the file.
        let db = lifecycle.db().clone();

        tracing::info!(
            path = %lifecycle.data_path().display(),
            namespace,
            database,
            "SurrealKV adapter connected — applying schema"
        );

        let adapter = Self { db };
        adapter.init_namespace(namespace, database, schema).await?;
        tracing::info!(namespace, database, "SurrealKV schema initialized");

        Ok(adapter)
    }

    /// Initialize an additional namespace/database on the same connection.
    ///
    /// Runs schema DDL via a scoped query batch — no session mutation.
    ///
    /// # Errors
    /// Returns error if the schema DDL fails.
    #[tracing::instrument(
        skip(self, schema),
        fields(namespace, database, schema_len = schema.len()),
        err
    )]
    pub async fn init_namespace(
        &self,
        namespace: &str,
        database: &str,
        schema: &str,
    ) -> Result<()> {
        tracing::debug!(namespace, database, "Initializing namespace (scoped)");

        let scoped = format!("USE NS {namespace} DB {database}; {schema}");
        self.db
            .query(scoped)
            .await
            .with_context(|| format!("Failed to initialize schema for '{namespace}/{database}'"))?;

        tracing::info!(namespace, database, "Namespace schema initialized");
        Ok(())
    }

    /// Create a `ScopedGraphHandle` for a namespace/database pair.
    pub fn scoped_handle(self: &Arc<Self>, namespace: &str, database: &str) -> ScopedGraphHandle {
        ScopedGraphHandle {
            adapter: Arc::clone(self),
            namespace: namespace.to_string(),
            database: database.to_string(),
        }
    }

    /// Execute a scoped SELECT-style query.
    ///
    /// # Errors
    /// Returns error if the query fails.
    #[tracing::instrument(
        skip(self, query),
        fields(
            namespace,
            database,
            query_preview = %query.chars().take(80).collect::<String>()
        ),
        err
    )]
    pub async fn query_in_ns(
        &self,
        namespace: &str,
        database: &str,
        query: &str,
    ) -> Result<serde_json::Value> {
        let scoped_query = format!("USE NS {namespace} DB {database}; {query}");
        let mut response = self
            .db
            .query(scoped_query)
            .await
            .with_context(|| format!("SurrealDB query failed in {namespace}/{database}"))?;

        // The USE NS/DB statement is index 0; first user statement is index 1.
        let rows: Vec<serde_json::Value> = response
            .take(1)
            .context("Failed to extract query results")?;

        Ok(serde_json::Value::Array(rows))
    }

    /// Execute scoped DDL / write statements — discards result.
    ///
    /// # Errors
    /// Returns error if the DDL fails.
    #[tracing::instrument(
        skip(self, ddl),
        fields(
            namespace,
            database,
            ddl_preview = %ddl.chars().take(80).collect::<String>()
        ),
        err
    )]
    pub async fn execute_in_ns(&self, namespace: &str, database: &str, ddl: &str) -> Result<()> {
        let scoped_ddl = format!("USE NS {namespace} DB {database}; {ddl}");
        self.db.query(scoped_ddl).await.with_context(|| {
            format!(
                "DDL failed in {namespace}/{database}: {}",
                ddl.chars().take(80).collect::<String>()
            )
        })?;
        Ok(())
    }

    /// Lightweight connection check — executes `SELECT 1`.
    ///
    /// # Errors
    /// Returns error if the backing connection cannot serve the query.
    #[tracing::instrument(skip(self), err)]
    pub async fn ping(&self) -> Result<()> {
        let mut response = self
            .db
            .query("SELECT 1")
            .await
            .context("SurrealDB ping failed")?;
        let _: Option<serde_json::Value> = response
            .take(0)
            .context("SurrealDB ping returned no result")?;
        Ok(())
    }

    /// Quiesce — drops the cloned connection on Drop; `SurrealKV`
    /// flushes its WAL automatically. Stays async for signature
    /// stability with the prior WS-client surface.
    #[allow(clippy::unused_async)]
    pub async fn quiesce(&self) {
        tracing::info!("`SurrealKV`: adapter quiesced (clone will close on drop)");
    }

    // ═══════════════════════════════════════════════════════════════
    // Inspector helpers — read-only surface for devtool consumers
    // ═══════════════════════════════════════════════════════════════

    /// List every database under the given namespace. Returns an
    /// empty `Vec` when the namespace is unknown to `SurrealDB` (no
    /// databases yet defined under it).
    ///
    /// Used by the `intelligence` devtool to show every per-project
    /// database that currently exists under `projects/`. Read-only.
    ///
    /// # Errors
    /// Propagates `SurrealDB` errors with the namespace in context.
    pub async fn list_databases_in_ns(&self, namespace: &str) -> Result<Vec<String>> {
        let scoped = format!("USE NS {namespace}; INFO FOR NS;");
        let mut response = self
            .db
            .query(scoped)
            .await
            .with_context(|| format!("INFO FOR NS {namespace}"))?;
        let info: Option<serde_json::Value> = response
            .take(1)
            .with_context(|| format!("take INFO FOR NS {namespace}"))?;
        let mut databases: Vec<String> = info
            .as_ref()
            .and_then(|v| v.get("databases"))
            .and_then(serde_json::Value::as_object)
            .map(|m| m.keys().cloned().collect())
            .unwrap_or_default();
        databases.sort();
        Ok(databases)
    }

    /// Count rows in a table within a scoped namespace/database.
    /// Returns `0` when the table is empty or undefined.
    ///
    /// Used by the `intelligence` devtool to show per-project
    /// memory + archive counts. Read-only.
    ///
    /// # Errors
    /// Propagates `SurrealDB` errors with the namespace + table in
    /// context.
    pub async fn count_in_ns(&self, namespace: &str, database: &str, table: &str) -> Result<u64> {
        // `SELECT VALUE count() FROM <table> GROUP ALL` returns a
        // single scalar — when the table is empty, the result set
        // is empty (not zero), so an `Option<u64>` take with
        // `unwrap_or(0)` covers both cases without an error path
        // for "no rows".
        let scoped = format!(
            "USE NS {namespace} DB {database}; \
             SELECT VALUE count() FROM {table} GROUP ALL;"
        );
        let mut response = self
            .db
            .query(scoped)
            .await
            .with_context(|| format!("count {namespace}/{database}/{table}"))?;
        let row: Option<u64> = response
            .take(1)
            .with_context(|| format!("count take {namespace}/{database}/{table}"))?;
        Ok(row.unwrap_or(0))
    }

    // ═══════════════════════════════════════════════════════════════
    // Typed scoped helpers
    // ═══════════════════════════════════════════════════════════════
    //
    // Every typed CRUD method below routes through a single SurrealQL
    // `query` with `USE NS x DB y; <stmt>` prefix and parameter
    // bindings. Three properties this guarantees:
    //
    // 1. Namespace isolation stays at the query level — no
    //    `use_ns/use_db` session mutation that would race across
    //    cloned `Surreal<Db>` handles.
    // 2. No SurrealQL string interpolation — every identifier or
    //    user-supplied value flows in via `.bind(...)`, eliminating
    //    SurrealQL injection risk.
    // 3. Connectors and `ScopedGraphHandle` consumers operate on
    //    typed records (`KvRecord`, `MemoryRecord`, `RroRecord`,
    //    etc) directly — no `serde_json::Value` round-trip.

    /// Build a namespace-scoped `SurrealQL` `Query` the caller can
    /// chain `.bind(...)` calls on and await for a typed
    /// `Response`. The returned value borrows from `self.db`, so
    /// the adapter must outlive the query — the standard pattern
    /// is to chain `.bind(...).await` on the returned `Query`
    /// before the borrow expires.
    ///
    /// Crate-internal: keeps namespace isolation owned by the
    /// in-crate connector impls under `connectome::persistence::*`.
    /// External callers reach for [`ScopedGraphHandle`] instead.
    pub(crate) fn scoped_query(
        &self,
        namespace: &str,
        database: &str,
        surql: &str,
    ) -> surrealdb::method::Query<'_, Db> {
        let scoped = format!("USE NS {namespace} DB {database}; {surql}");
        self.db.query(scoped)
    }

    /// Scoped UPSERT of a typed record on `type::thing(table, id)`.
    ///
    /// Internal helper consumed by [`ScopedGraphHandle`] +
    /// [`super::intelligence_impl`]. Generic over the content type;
    /// pass any `Serialize` value whose JSON shape matches the
    /// target table's schema.
    ///
    /// # Errors
    /// Propagates `SurrealDB` errors with the namespace + table + id
    /// in the context message.
    pub(crate) async fn upsert_typed_in_ns<T>(
        &self,
        namespace: &str,
        database: &str,
        table: &str,
        id: &str,
        record: T,
    ) -> Result<()>
    where
        T: SurrealValue + Send + Sync + 'static,
    {
        let scoped = format!(
            "USE NS {namespace} DB {database}; \
             UPSERT type::thing($t, $id) CONTENT $rec;"
        );
        self.db
            .query(scoped)
            .bind(("t", table.to_string()))
            .bind(("id", id.to_string()))
            .bind(("rec", record))
            .await
            .with_context(|| format!("upsert {namespace}/{database}/{table}:{id}"))?;
        Ok(())
    }

    /// Scoped SELECT-by-id with typed deserialization.
    ///
    /// Returns `Ok(None)` when no row matches. Deserialization to
    /// `T` happens via `surrealdb::Response::take`, so `T` must be
    /// `DeserializeOwned`.
    ///
    /// # Errors
    /// Propagates `SurrealDB` errors with the namespace + table + id
    /// in the context message.
    pub(crate) async fn select_typed_in_ns<T>(
        &self,
        namespace: &str,
        database: &str,
        table: &str,
        id: &str,
    ) -> Result<Option<T>>
    where
        T: SurrealValue + Send + Sync + 'static,
    {
        let scoped = format!(
            "USE NS {namespace} DB {database}; \
             SELECT * FROM type::thing($t, $id);"
        );
        let mut response = self
            .db
            .query(scoped)
            .bind(("t", table.to_string()))
            .bind(("id", id.to_string()))
            .await
            .with_context(|| format!("select {namespace}/{database}/{table}:{id}"))?;
        // Index 0 is the `USE NS .. DB ..` statement; the SELECT is
        // at index 1. `Option<T>` take semantics: first row or None.
        let row: Option<T> = response
            .take(1)
            .with_context(|| format!("take {namespace}/{database}/{table}:{id}"))?;
        Ok(row)
    }

    /// Scoped DELETE-by-id with `RETURN BEFORE`.
    ///
    /// Returns `Ok(true)` when a row was deleted, `Ok(false)` when
    /// no row matched.
    ///
    /// # Errors
    /// Propagates `SurrealDB` errors with the namespace + table + id
    /// in the context message.
    pub(crate) async fn delete_typed_in_ns(
        &self,
        namespace: &str,
        database: &str,
        table: &str,
        id: &str,
    ) -> Result<bool> {
        let scoped = format!(
            "USE NS {namespace} DB {database}; \
             DELETE type::thing($t, $id) RETURN BEFORE;"
        );
        let mut response = self
            .db
            .query(scoped)
            .bind(("t", table.to_string()))
            .bind(("id", id.to_string()))
            .await
            .with_context(|| format!("delete {namespace}/{database}/{table}:{id}"))?;
        let row: Option<serde_json::Value> = response
            .take(1)
            .with_context(|| format!("take {namespace}/{database}/{table}:{id}"))?;
        Ok(row.is_some())
    }

    /// Scoped vector-typed SELECT for the rkyv archive blob.
    ///
    /// Connectors backing the intelligence layer call this to fetch
    /// the rkyv-archived bytes for a memory id. Returns `Ok(None)`
    /// when no archive row exists.
    ///
    /// # Errors
    /// Propagates `SurrealDB` errors with the namespace + memory id
    /// in the context message.
    pub(crate) async fn read_archive_bytes_in_ns(
        &self,
        namespace: &str,
        database: &str,
        memory_id: &str,
    ) -> Result<Option<Vec<u8>>> {
        // `bytes` column is loaded via a dedicated subquery so the
        // result shape is a flat row, never the full archive
        // record. Keeps the deserialization tight.
        #[derive(Debug, Clone, Serialize, Deserialize, SurrealValue)]
        #[surreal(crate = "surrealdb::types")]
        struct ArchiveRow {
            bytes: Vec<u8>,
        }
        let scoped = format!(
            "USE NS {namespace} DB {database}; \
             SELECT bytes FROM rro_archive WHERE memory_id = type::thing('memories', $id) LIMIT 1;"
        );
        let mut response = self
            .db
            .query(scoped)
            .bind(("id", memory_id.to_string()))
            .await
            .with_context(|| format!("archive read {namespace}/{database}:{memory_id}"))?;
        let row: Option<ArchiveRow> = response
            .take(1)
            .with_context(|| format!("archive take {namespace}/{database}:{memory_id}"))?;
        Ok(row.map(|r| r.bytes))
    }
}

// ═══════════════════════════════════════════════════════════════
// ScopedGraphHandle — namespace-scoped operations
// ═══════════════════════════════════════════════════════════════

/// Namespace-scoped handle to a shared embedded ``SurrealKV`` connection.
///
/// Every query is prefixed with `USE NS {namespace} DB {database};` so
/// namespace isolation is enforced at the query level — no implicit
/// session context. This is the ONLY way runtime code should access
/// the graph store.
pub struct ScopedGraphHandle {
    adapter: Arc<SurrealAdapter>,
    namespace: String,
    database: String,
}

impl ScopedGraphHandle {
    /// The namespace this handle is scoped to.
    pub fn namespace(&self) -> &str {
        &self.namespace
    }

    /// The database this handle is scoped to.
    pub fn database(&self) -> &str {
        &self.database
    }

    /// The shared adapter backing this handle.
    pub fn adapter(&self) -> &Arc<SurrealAdapter> {
        &self.adapter
    }

    /// Execute a query in this scope.
    ///
    /// # Errors
    /// Returns error if the query fails.
    pub async fn query(&self, surql: &str) -> Result<serde_json::Value> {
        self.adapter
            .query_in_ns(&self.namespace, &self.database, surql)
            .await
    }

    /// Execute DDL / write in this scope.
    ///
    /// # Errors
    /// Returns error if the statement fails.
    pub async fn execute(&self, surql: &str) -> Result<()> {
        self.adapter
            .execute_in_ns(&self.namespace, &self.database, surql)
            .await
    }

    /// Health check — verifies the namespace is reachable and `kv`
    /// table is queryable.
    ///
    /// # Errors
    /// Returns error if the namespace or kv table is broken.
    pub async fn ping(&self) -> Result<()> {
        self.adapter
            .query_in_ns(&self.namespace, &self.database, "SELECT * FROM kv LIMIT 1")
            .await
            .with_context(|| {
                format!(
                    "SurrealDB health check failed for {}/{}",
                    self.namespace, self.database
                )
            })?;
        Ok(())
    }

    /// Create a node in a table.
    ///
    /// # Errors
    /// Returns error if the node cannot be created.
    pub async fn create_node(
        &self,
        table: &str,
        id: &str,
        props: &serde_json::Value,
    ) -> Result<()> {
        let surql = format!("CREATE type::thing('{table}', '{id}') CONTENT {props};");
        self.execute(&surql).await
    }

    /// Create an edge between two nodes.
    ///
    /// # Errors
    /// Returns error if the edge cannot be created.
    pub async fn create_edge(
        &self,
        edge_table: &str,
        from_id: &str,
        to_id: &str,
        props: &serde_json::Value,
    ) -> Result<()> {
        let edge_id = uuid::Uuid::new_v4();
        let surql = format!(
            "RELATE {from_id}->type::thing('{edge_table}', '{edge_id}')->{to_id} CONTENT {props};"
        );
        self.execute(&surql).await
    }

    /// Query all nodes from a table, optionally filtered.
    ///
    /// # Errors
    /// Returns error if the query fails.
    pub async fn query_nodes(&self, table: &str, filter: &str) -> Result<Vec<serde_json::Value>> {
        let surql = if filter.is_empty() {
            format!("SELECT * FROM {table};")
        } else {
            format!("SELECT * FROM {table} WHERE {filter};")
        };
        let result = self.query(&surql).await?;
        match result {
            serde_json::Value::Array(rows) => Ok(rows),
            other => Ok(vec![other]),
        }
    }

    /// Traverse edges from a starting node.
    ///
    /// # Errors
    /// Returns error if the traversal fails.
    pub async fn traverse(
        &self,
        start_id: &str,
        edge_type: &str,
        depth: u32,
    ) -> Result<Vec<serde_json::Value>> {
        let surql = format!("SELECT ->{edge_type}->* AS connected FROM {start_id} LIMIT {depth};");
        let result = self.query(&surql).await?;
        match result {
            serde_json::Value::Array(rows) => Ok(rows),
            other => Ok(vec![other]),
        }
    }

    /// Set a key-value pair in the scoped `kv` table.
    ///
    /// Typed contract: builds a [`KvRecord`] and upserts via the
    /// adapter's typed scoped helper. No `SurrealQL` string
    /// interpolation, no base64 round-trip — the `bytes` column
    /// roundtrips directly through serde.
    ///
    /// # Errors
    /// Returns error if the upsert fails.
    pub async fn kv_set(&self, key: &str, value: &[u8]) -> Result<()> {
        let record = KvRecord {
            key: key.to_string(),
            value: value.to_vec(),
        };
        self.adapter
            .upsert_typed_in_ns(&self.namespace, &self.database, "kv", key, record)
            .await
    }

    /// Get a value from the scoped `kv` table.
    ///
    /// # Errors
    /// Returns error if the query fails.
    pub async fn kv_get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let row: Option<KvRecord> = self
            .adapter
            .select_typed_in_ns(&self.namespace, &self.database, "kv", key)
            .await?;
        Ok(row.map(|r| r.value))
    }

    /// Delete a key from the scoped `kv` table.
    ///
    /// # Errors
    /// Returns error if the deletion fails.
    pub async fn kv_delete(&self, key: &str) -> Result<bool> {
        self.adapter
            .delete_typed_in_ns(&self.namespace, &self.database, "kv", key)
            .await
    }
}

// ═══════════════════════════════════════════════════════════════
// Data types — preserved from the pre-sidecar adapter
// ═══════════════════════════════════════════════════════════════

/// Typed row shape for the scoped `kv` table.
///
/// Used by [`ScopedGraphHandle::kv_set`] / [`ScopedGraphHandle::kv_get`]
/// / [`ScopedGraphHandle::kv_delete`] as the serde contract for
/// round-tripping through the typed scoped helpers on
/// [`SurrealAdapter`]. Keeping it `pub(crate)` rather than fully
/// public preserves the encapsulation rule that all `kv` access
/// goes through the namespace-scoped handle.
#[derive(Debug, Clone, Serialize, Deserialize, SurrealValue)]
#[surreal(crate = "surrealdb::types")]
pub(crate) struct KvRecord {
    pub(crate) key: String,
    pub(crate) value: Vec<u8>,
}

/// Reasoning node in the graph.
#[derive(Debug, Clone, Serialize, Deserialize, SurrealValue)]
#[surreal(crate = "surrealdb::types")]
pub struct ReasoningNode {
    /// Unique node identifier.
    pub id: String,
    /// Classification of this node (concept, fact, decision).
    pub node_type: String,
    /// Text content of the node.
    pub content: String,
    /// Additional structured metadata.
    pub metadata: serde_json::Value,
    /// Unix timestamp of creation.
    pub created_at: i64,
}

/// State in the reasoning context switcher.
#[derive(Debug, Clone, Serialize, Deserialize, SurrealValue)]
#[surreal(crate = "surrealdb::types")]
pub struct ReasoningState {
    /// Unique state identifier.
    pub id: String,
    /// Human-readable state name.
    pub name: String,
    /// Prior probability of this state.
    pub probability: f64,
    /// Observable emissions from this state.
    pub emissions: Vec<String>,
}

/// Transition between reasoning states.
#[derive(Debug, Clone, Serialize, Deserialize, SurrealValue)]
#[surreal(crate = "surrealdb::types")]
pub struct StateTransition {
    /// Source state identifier.
    pub from_state: String,
    /// Target state identifier.
    pub to_state: String,
    /// Transition probability.
    pub probability: f64,
    /// Event that triggers this transition.
    pub trigger: String,
}

// ═══════════════════════════════════════════════════════════════
// Kernel reasoning schema (used by SurrealAdapter::connect)
// ═══════════════════════════════════════════════════════════════

/// Schema for the kernel reasoning system.
///
/// Applied per-namespace by [`SurrealAdapter::connect_with_ns`] when
/// the reasoning NS (`clyffy/devpulse`) initializes. The schema covers:
///
/// - **kv / nodes / relates / states / transitions** — the original
///   reasoning graph: facts, edges, context-switching state machine.
/// - **estates / `estate_aspects`** — the Clyffy + minion identity
///   cascade. Each `estate` is the SSOT for one primary persona node
///   (Clyffy or the minion umbrella) and owns its child `estate_aspects`
///   rows (working memory, personality facets, per-minion state). The
///   two Harrier 0.6B encoders feed their respective estates: one
///   serves Clyffy, one serves the minion umbrella.
///
/// Estate-aspect cascade semantics:
/// - `estate.owner` is one of `"clyffy"` or `"minions"`.
/// - Every aspect belongs to exactly one estate via `estate_id`.
/// - `aspect_kind` distinguishes the cascade lane:
///   `"persona"` (identity / personality), `"working_memory"` (recent
///   context), `"task_state"` (current dispatch), `"minion_process"`
///   (per-minion-process record under the `"minions"` estate).
pub const REASONING_SCHEMA: &str = r"
-- Key-value store for signal-based access
DEFINE TABLE IF NOT EXISTS kv SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS key ON kv TYPE string;
DEFINE FIELD IF NOT EXISTS value ON kv TYPE bytes;
DEFINE INDEX IF NOT EXISTS kv_key ON kv FIELDS key UNIQUE;

-- Reasoning nodes (concepts, facts, decisions)
DEFINE TABLE IF NOT EXISTS nodes SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS node_type ON nodes TYPE string;
DEFINE FIELD IF NOT EXISTS content ON nodes TYPE string;
DEFINE FIELD IF NOT EXISTS metadata ON nodes TYPE object;
DEFINE FIELD IF NOT EXISTS created_at ON nodes TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS nodes_type ON nodes FIELDS node_type;

-- Reasoning edges (relationships between nodes)
DEFINE TABLE IF NOT EXISTS relates SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS relation_type ON relates TYPE string;
DEFINE FIELD IF NOT EXISTS weight ON relates TYPE float DEFAULT 1.0;
DEFINE FIELD IF NOT EXISTS created_at ON relates TYPE datetime DEFAULT time::now();

-- Context switching states
DEFINE TABLE IF NOT EXISTS states SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON states TYPE string;
DEFINE FIELD IF NOT EXISTS probability ON states TYPE float;
DEFINE FIELD IF NOT EXISTS emissions ON states TYPE array;
DEFINE INDEX IF NOT EXISTS states_name ON states FIELDS name UNIQUE;

-- State transitions
DEFINE TABLE IF NOT EXISTS transitions SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS from_state ON transitions TYPE record(states);
DEFINE FIELD IF NOT EXISTS to_state ON transitions TYPE record(states);
DEFINE FIELD IF NOT EXISTS probability ON transitions TYPE float;
DEFINE FIELD IF NOT EXISTS trigger ON transitions TYPE string;

-- ── Estates · the Clyffy + minion identity cascade ──────────────
-- Each row is one primary persona node. The encoder/embedder slot
-- (Harrier 0.6B) keyed by `encoder_slot_id` is the SSOT this estate
-- cascades from.
DEFINE TABLE IF NOT EXISTS estates SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS owner ON estates TYPE string
    ASSERT $value IN ['clyffy', 'minions'];
DEFINE FIELD IF NOT EXISTS encoder_slot_id ON estates TYPE string;
DEFINE FIELD IF NOT EXISTS display_name ON estates TYPE string;
DEFINE FIELD IF NOT EXISTS created_at ON estates TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON estates TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS estates_owner ON estates FIELDS owner UNIQUE;

-- Aspects · the cascade rows under each estate. Persona facets,
-- working-memory snapshots, task state, and per-minion-process
-- records all live here, distinguished by `aspect_kind`.
DEFINE TABLE IF NOT EXISTS estate_aspects SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS estate_id ON estate_aspects TYPE record(estates);
DEFINE FIELD IF NOT EXISTS aspect_kind ON estate_aspects TYPE string
    ASSERT $value IN ['persona', 'working_memory', 'task_state', 'minion_process'];
DEFINE FIELD IF NOT EXISTS aspect_key ON estate_aspects TYPE string;
DEFINE FIELD IF NOT EXISTS payload ON estate_aspects TYPE object;
DEFINE FIELD IF NOT EXISTS priority ON estate_aspects TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS created_at ON estate_aspects TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated_at ON estate_aspects TYPE datetime DEFAULT time::now();
DEFINE INDEX IF NOT EXISTS estate_aspects_lookup
    ON estate_aspects FIELDS estate_id, aspect_kind, aspect_key UNIQUE;
DEFINE INDEX IF NOT EXISTS estate_aspects_kind ON estate_aspects FIELDS aspect_kind;
";
