//! Surreal client adapter — namespace-scoped operations on the Surreal server.
//!
//! `DevPulse` runs upstream's server build in a supervised subprocess
//! ([`super::lifecycle::SurrealLifecycle`]) and reaches it with its own client
//! ([`super::rpc`]) — no Surreal crate is linked (plan 0007 Part S). This
//! adapter keeps the surface every caller already uses:
//!
//! - `SurrealAdapter` — scoped queries, typed helpers and inspector reads;
//!   cheap to clone (the client inside is shared).
//! - `ScopedGraphHandle` — a namespace/database pair; the only way runtime
//!   code reaches the graph store.
//!
//! Every statement's outcome is checked: a failed statement is an error, never
//! a silently empty result (the embedded crate's `query` dropped them, which
//! hid the 12 `type::thing` calls Surreal 3 no longer has). Values are bound,
//! never pasted into the query text.

use crate::cortex::persistence::config::SurrealNamespace;
use crate::cortex::persistence::surreal::lifecycle::SurrealLifecycle;
use crate::cortex::persistence::surreal::rpc::{Query, Response, SurrealRpc};
use anyhow::{Context, Result};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

// ═══════════════════════════════════════════════════════════════
// SurrealAdapter — scoped operations over the server client
// ═══════════════════════════════════════════════════════════════

/// `SurrealDB` client adapter — every scope shares one server client.
#[derive(Clone)]
pub struct SurrealAdapter {
    rpc: SurrealRpc,
}

impl SurrealAdapter {
    /// Connect to a running server and apply the kernel reasoning schema.
    ///
    /// Equivalent to [`Self::connect_with_ns`] with the kernel's own
    /// `REASONING` namespace. Engine boot uses `connect_with_ns` so
    /// system/user/global all land on the same server.
    ///
    /// # Errors
    /// Returns an error if the scope or its schema cannot be defined.
    pub async fn connect(lifecycle: &SurrealLifecycle) -> Result<Self> {
        Self::connect_with_ns(
            lifecycle,
            SurrealNamespace::REASONING.namespace,
            SurrealNamespace::REASONING.database,
            REASONING_SCHEMA,
        )
        .await
    }

    /// Connect to a running server and apply `schema` to
    /// `namespace/database`. Further scopes on the same server are added
    /// with [`Self::init_namespace`].
    ///
    /// # Errors
    /// Returns an error if the scope or its schema cannot be defined.
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
        let adapter = Self {
            rpc: lifecycle.rpc().clone(),
        };
        adapter.init_namespace(namespace, database, schema).await?;
        tracing::info!(namespace, database, "Surreal schema initialized");
        Ok(adapter)
    }

    /// Define `namespace/database` (when new) and apply `schema` to it.
    ///
    /// # Errors
    /// Returns the first statement that failed, with the scope in context.
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
        self.rpc.ensure(namespace, database).await?;
        self.run(namespace, database, Query::new(schema))
            .await?
            .check()
            .with_context(|| format!("apply the schema for '{namespace}/{database}'"))?;
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

    /// Run a query in a scope and return every statement's outcome.
    ///
    /// # Errors
    /// Returns an error if the server cannot be reached or refuses the
    /// request; a failed statement is reported in the [`Response`].
    pub(crate) async fn run(
        &self,
        namespace: &str,
        database: &str,
        query: Query,
    ) -> Result<Response> {
        self.rpc
            .query(namespace, database, query)
            .await
            .with_context(|| format!("SurrealDB query in {namespace}/{database}"))
    }

    /// Execute a scoped SELECT-style query: the first statement's rows.
    ///
    /// # Errors
    /// Returns an error if the query fails.
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
        let rows = self
            .run(namespace, database, Query::new(query))
            .await?
            .take(0)
            .with_context(|| format!("SurrealDB query failed in {namespace}/{database}"))?;
        Ok(serde_json::Value::Array(rows))
    }

    /// Execute scoped DDL / write statements — every statement must succeed.
    ///
    /// # Errors
    /// Returns the first statement that failed.
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
        self.run(namespace, database, Query::new(ddl))
            .await?
            .check()
            .with_context(|| {
                format!(
                    "DDL failed in {namespace}/{database}: {}",
                    ddl.chars().take(80).collect::<String>()
                )
            })
    }

    /// Lightweight connection check.
    ///
    /// # Errors
    /// Returns error if the server cannot serve the query.
    #[tracing::instrument(skip(self), err)]
    pub async fn ping(&self) -> Result<()> {
        self.rpc
            .query_root(Query::new("RETURN 1;"))
            .await?
            .check()
            .context("SurrealDB ping failed")
    }

    /// Nothing to release: the client holds no connection between
    /// requests; the server is stopped by its lifecycle.
    #[allow(clippy::unused_async)]
    pub async fn quiesce(&self) {
        tracing::info!("Surreal adapter quiesced");
    }

    // ═══════════════════════════════════════════════════════════════
    // Inspector helpers — read-only surface for devtool consumers
    // ═══════════════════════════════════════════════════════════════

    /// List every database under the given namespace. Returns an
    /// empty `Vec` when the namespace was never defined.
    ///
    /// Used by the `intelligence` devtool to show every per-project
    /// database that currently exists under `projects/`. Read-only.
    ///
    /// # Errors
    /// Propagates `SurrealDB` errors with the namespace in context.
    pub async fn list_databases_in_ns(&self, namespace: &str) -> Result<Vec<String>> {
        let response = self
            .rpc
            .query_root(Query::new(format!("USE NS {namespace}; INFO FOR NS;")))
            .await
            .with_context(|| format!("INFO FOR NS {namespace}"))?;
        let info = match response.take(1) {
            Ok(rows) => rows.into_iter().next(),
            Err(e) if format!("{e:#}").contains("does not exist") => None,
            Err(e) => return Err(e).with_context(|| format!("INFO FOR NS {namespace}")),
        };
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
    /// Returns `0` when the table is empty or was never defined.
    ///
    /// Used by the `intelligence` devtool to show per-project
    /// memory + archive counts. Read-only.
    ///
    /// # Errors
    /// Propagates `SurrealDB` errors with the namespace + table in
    /// context.
    pub async fn count_in_ns(&self, namespace: &str, database: &str, table: &str) -> Result<u64> {
        let response = self
            .run(
                namespace,
                database,
                Query::new(format!("SELECT VALUE count() FROM {table} GROUP ALL;")),
            )
            .await?;
        match response.take(0) {
            Ok(rows) => Ok(rows
                .first()
                .and_then(serde_json::Value::as_u64)
                .unwrap_or(0)),
            Err(e) if format!("{e:#}").contains("does not exist") => Ok(0),
            Err(e) => Err(e).with_context(|| format!("count {namespace}/{database}/{table}")),
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Typed scoped helpers
    // ═══════════════════════════════════════════════════════════════
    //
    // Every identifier and value flows in as a bound variable — no
    // SurrealQL string interpolation. Bytes go as bytes (`serde_bytes`),
    // strings stay strings (CBOR, see `rpc`).

    /// Scoped UPSERT of a typed record on `type::record(table, id)`.
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
        record: &T,
    ) -> Result<()>
    where
        T: Serialize + ?Sized,
    {
        let query = Query::new("UPSERT type::record($t, $id) CONTENT $rec;")
            .bind("t", table)?
            .bind("id", id)?
            .bind("rec", record)?;
        self.run(namespace, database, query)
            .await?
            .check()
            .with_context(|| format!("upsert {namespace}/{database}/{table}:{id}"))
    }

    /// Scoped SELECT-by-id with typed deserialization. `Ok(None)` when no
    /// row matches.
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
        T: DeserializeOwned,
    {
        let query = Query::new("SELECT * FROM type::record($t, $id);")
            .bind("t", table)?
            .bind("id", id)?;
        let rows = self
            .run(namespace, database, query)
            .await?
            .take(0)
            .with_context(|| format!("select {namespace}/{database}/{table}:{id}"))?;
        rows.into_iter()
            .next()
            .map(serde_json::from_value)
            .transpose()
            .with_context(|| format!("read {namespace}/{database}/{table}:{id}"))
    }

    /// Scoped DELETE-by-id with `RETURN BEFORE`. `Ok(true)` when a row
    /// was deleted, `Ok(false)` when none matched.
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
        let query = Query::new("DELETE type::record($t, $id) RETURN BEFORE;")
            .bind("t", table)?
            .bind("id", id)?;
        let rows = self
            .run(namespace, database, query)
            .await?
            .take(0)
            .with_context(|| format!("delete {namespace}/{database}/{table}:{id}"))?;
        Ok(!rows.is_empty())
    }

    /// Scoped read of the rkyv archive blob for a memory id. `Ok(None)`
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
        #[derive(Debug, Deserialize)]
        struct ArchiveRow {
            bytes: Vec<u8>,
        }
        let query = Query::new(
            "SELECT bytes FROM rro_archive WHERE memory_id = type::record('memories', $id) LIMIT 1;",
        )
        .bind("id", memory_id)?;
        let rows = self
            .run(namespace, database, query)
            .await?
            .take(0)
            .with_context(|| format!("archive read {namespace}/{database}:{memory_id}"))?;
        let row: Option<ArchiveRow> = rows
            .into_iter()
            .next()
            .map(serde_json::from_value)
            .transpose()
            .with_context(|| format!("archive row {namespace}/{database}:{memory_id}"))?;
        Ok(row.map(|r| r.bytes))
    }
}

// ═══════════════════════════════════════════════════════════════
// ScopedGraphHandle — namespace-scoped operations
// ═══════════════════════════════════════════════════════════════

/// Namespace-scoped handle to the shared Surreal server client.
///
/// Every request names its namespace and database, so isolation never
/// depends on session state. This is the ONLY way runtime code should
/// access the graph store.
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
        let query = Query::new("CREATE type::record($t, $id) CONTENT $props;")
            .bind("t", table)?
            .bind("id", id)?
            .bind("props", props)?;
        self.adapter
            .run(&self.namespace, &self.database, query)
            .await?
            .check()
            .with_context(|| format!("create {table}:{id}"))
    }

    /// Create an edge between two nodes. `from_id` / `to_id` are record
    /// ids as `SurrealQL` (e.g. `` project:`p-1` ``).
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
        let edge_id = uuid::Uuid::new_v4().to_string();
        let query = Query::new(format!(
            "RELATE {from_id}->type::record($edge, $edge_id)->{to_id} CONTENT $props;"
        ))
        .bind("edge", edge_table)?
        .bind("edge_id", &edge_id)?
        .bind("props", props)?;
        self.adapter
            .run(&self.namespace, &self.database, query)
            .await?
            .check()
            .with_context(|| format!("relate {from_id}->{edge_table}->{to_id}"))
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

    /// Set a key-value pair in the scoped `kv` table. The value goes as
    /// bytes, matching the column's `bytes` type.
    ///
    /// # Errors
    /// Returns error if the upsert fails.
    pub async fn kv_set(&self, key: &str, value: &[u8]) -> Result<()> {
        let record = KvRecord {
            key: key.to_string(),
            value: value.to_vec(),
        };
        self.adapter
            .upsert_typed_in_ns(&self.namespace, &self.database, "kv", key, &record)
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

/// Typed row shape for the scoped `kv` table. `value` crosses as bytes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct KvRecord {
    pub(crate) key: String,
    #[serde(with = "serde_bytes")]
    pub(crate) value: Vec<u8>,
}

/// Reasoning node in the graph.
#[derive(Debug, Clone, Serialize, Deserialize)]
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
#[derive(Debug, Clone, Serialize, Deserialize)]
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
#[derive(Debug, Clone, Serialize, Deserialize)]
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
DEFINE FIELD IF NOT EXISTS from_state ON transitions TYPE record<states>;
DEFINE FIELD IF NOT EXISTS to_state ON transitions TYPE record<states>;
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
DEFINE FIELD IF NOT EXISTS estate_id ON estate_aspects TYPE record<estates>;
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
