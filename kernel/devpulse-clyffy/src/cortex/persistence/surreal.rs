//! `SurrealDB` adapter for the reasoning system.
//!
//! Two public types:
//! - `SurrealAdapter` — owns the `Surreal<Db>` connection (one per `SurrealKV` instance).
//! - `ScopedGraphHandle` — namespace-scoped operations. Every query is prefixed
//!   with `USE NS {ns} DB {db};` so namespace isolation is real, not implicit.
//!
//! Boot opens ONE `SurrealKV` at `surreal/devpulse`. The adapter creates
//! `ScopedGraphHandle` instances for each namespace (system, user, global).
//! Each handle scopes every operation — no shared implicit context.
//!
//! # P0: Boot Never Freezes
//!
//! `surrealdb::Surreal<Db>` is `Clone + Send + Sync` — internally an
//! `Arc<Inner>` that handles its own locking. Wrapping it in
//! `tokio::sync::RwLock` serialized every query behind a yield-on-acquire
//! mutex AND deadlocked whenever `init_namespace` took the write lock while
//! another task tried to read. The RwLock is removed. All runtime queries
//! use explicit `USE NS {ns} DB {db};` prefixes so no session-state mutation
//! is ever needed after open.

use crate::cortex::persistence::config::SurrealNamespace;
use anyhow::{Context, Result};
use base64::Engine as _;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use surrealdb::engine::local::{Db, SurrealKv};
use surrealdb::types::SurrealValue;
use surrealdb::Surreal;

// ═══════════════════════════════════════════════════════════════
// SurrealAdapter — connection owner
// ═══════════════════════════════════════════════════════════════

/// `SurrealDB` adapter — owns a single `Surreal<Db>` connection.
///
/// Lock-free: `Surreal<Db>` handles its own internal synchronization.
/// Cloning the handle is cheap (atomic refcount bump). All runtime queries
/// go through `ScopedGraphHandle` with explicit `USE NS ... DB ...;`
/// prefixes, so no session-state mutation is required.
pub struct SurrealAdapter {
    db: Surreal<Db>,
}

impl SurrealAdapter {
    /// Open database at path with `SurrealKV` backend (pure Rust).
    ///
    /// Uses the default kernel reasoning namespace/database/schema.
    /// This is the kernel's own entry point — engine boot uses `open_with_ns`.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    pub async fn open(path: &Path) -> Result<Self> {
        Self::open_with_ns(
            path,
            SurrealNamespace::REASONING.namespace,
            SurrealNamespace::REASONING.database,
            REASONING_SCHEMA,
        )
        .await
    }

    /// Open database at path with explicit namespace, database, and schema.
    ///
    /// This is the primary constructor. The schema runs via an explicit
    /// `USE NS ... DB ...; {schema}` so no session state is mutated on the
    /// shared `Surreal<Db>` handle. All runtime operations MUST go through
    /// `ScopedGraphHandle` which keeps the same pattern.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
    #[tracing::instrument(skip(schema), fields(path = %path.display(), namespace, database, schema_len = schema.len()), err)]
    pub async fn open_with_ns(
        path: &Path,
        namespace: &str,
        database: &str,
        schema: &str,
    ) -> Result<Self> {
        // Ensure the PARENT directory exists — SurrealKV creates its own
        // data directory and needs write access to the parent.
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .context("Failed to create SurrealDB parent directory")?;
        }

        // Pass the path as-is — do NOT canonicalize on Windows because
        // canonicalize() adds \\?\ extended-length prefix which SurrealKV
        // misinterprets as root "\", causing "Access is denied" errors.
        let db = Surreal::new::<SurrealKv>(path.to_path_buf())
            .await
            .with_context(|| {
                format!(
                    "Failed to open SurrealDB at path: {}",
                    path.display()
                )
            })?;

        tracing::info!(
            path = %path.display(),
            namespace,
            database,
            "SurrealKV opened — applying schema via scoped query"
        );

        let adapter = Self { db };

        // Initialize schema via scoped query — no session mutation, no lock.
        adapter.init_namespace(namespace, database, schema).await?;

        tracing::info!(namespace, database, "SurrealDB schema initialized");

        Ok(adapter)
    }

    /// Open in-memory database for testing.
    ///
    /// # Errors
    /// Returns error if the in-memory database cannot be created or schema initialization fails.
    pub async fn open_in_memory() -> Result<Self> {
        use surrealdb::engine::local::Mem;

        let db = Surreal::new::<Mem>(())
            .await
            .context("Failed to open in-memory SurrealDB")?;

        let adapter = Self { db };
        adapter
            .init_namespace(
                SurrealNamespace::REASONING.namespace,
                SurrealNamespace::REASONING.database,
                REASONING_SCHEMA,
            )
            .await?;
        Ok(adapter)
    }

    /// Initialize an additional namespace/database with its own schema.
    ///
    /// Runs the schema via an explicit scoped query batch — no session
    /// mutation, no lock. Safe to call concurrently for different namespaces.
    ///
    /// # Errors
    /// Returns error if the schema fails to apply.
    #[tracing::instrument(skip(self, schema), fields(namespace, database, schema_len = schema.len()), err)]
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
            .with_context(|| {
                format!(
                    "Failed to initialize schema for '{namespace}/{database}'"
                )
            })?;

        tracing::info!(namespace, database, "Namespace schema initialized");

        Ok(())
    }

    /// Create a `ScopedGraphHandle` for a specific namespace/database.
    ///
    /// The handle carries the namespace and database, prefixing every
    /// query with `USE NS {ns} DB {db};`. This is the ONLY way runtime
    /// code should interact with the database — never use implicit context.
    pub fn scoped_handle(self: &Arc<Self>, namespace: &str, database: &str) -> ScopedGraphHandle {
        ScopedGraphHandle {
            adapter: Arc::clone(self),
            namespace: namespace.to_string(),
            database: database.to_string(),
        }
    }

    /// Execute a scoped query — prefixes with `USE NS {ns} DB {db};`.
    ///
    /// Returns the result of the first user statement (index 1 after USE).
    /// Used by `ScopedGraphHandle` and boot pipeline for namespace-scoped ops.
    ///
    /// # Errors
    /// Returns error if the query fails.
    #[tracing::instrument(skip(self, query), fields(namespace, database, query_preview = %query.chars().take(80).collect::<String>()), err)]
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

        // The USE NS/DB statement is index 0, user query starts at index 1.
        let rows: Vec<serde_json::Value> = response
            .take(1)
            .context("Failed to extract query results")?;

        Ok(serde_json::Value::Array(rows))
    }

    /// Execute scoped DDL — runs a statement in a specific namespace.
    ///
    /// Like `query_in_ns` but ignores the result. Used for DEFINE USER,
    /// DEFINE TABLE, and other DDL that returns nothing useful.
    ///
    /// # Errors
    /// Returns error if the DDL fails.
    #[tracing::instrument(skip(self, ddl), fields(namespace, database, ddl_preview = %ddl.chars().take(80).collect::<String>()), err)]
    pub async fn execute_in_ns(
        &self,
        namespace: &str,
        database: &str,
        ddl: &str,
    ) -> Result<()> {
        let scoped_ddl = format!("USE NS {namespace} DB {database}; {ddl}");
        self.db
            .query(scoped_ddl)
            .await
            .with_context(|| {
                format!(
                    "DDL failed in {namespace}/{database}: {}",
                    ddl.chars().take(80).collect::<String>()
                )
            })?;

        Ok(())
    }

    /// Lightweight health check — executes `SELECT 1`.
    ///
    /// Called by the persistence manager's `ping_surreal` via `Arc<SurrealAdapter>`.
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

    /// Quiesce — in-flight queries drain naturally when the Arc drops.
    ///
    /// Lock-free: no explicit drain needed. The `Surreal<Db>` handle
    /// refcount drop on the last `Arc<SurrealAdapter>` flushes the WAL.
    pub async fn quiesce(&self) {
        tracing::info!("SurrealDB: quiesced — WAL flushes on Arc drop");
    }
}

// ═══════════════════════════════════════════════════════════════
// ScopedGraphHandle — namespace-scoped operations
// ═══════════════════════════════════════════════════════════════

/// Namespace-scoped handle to a shared `SurrealDB` connection.
///
/// Every query is prefixed with `USE NS {namespace} DB {database};`
/// so namespace isolation is enforced at the query level, not by
/// relying on implicit session context.
///
/// This is the ONLY way runtime code should access the graph store.
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

    /// Get the underlying adapter (for HTTP server sharing).
    pub fn adapter(&self) -> &Arc<SurrealAdapter> {
        &self.adapter
    }

    /// Execute a query and return results.
    ///
    /// # Errors
    /// Returns error if the query fails.
    pub async fn query(&self, surql: &str) -> Result<serde_json::Value> {
        self.adapter
            .query_in_ns(&self.namespace, &self.database, surql)
            .await
    }

    /// Execute DDL (DEFINE, CREATE, UPDATE, DELETE) — ignores result.
    ///
    /// # Errors
    /// Returns error if the statement fails.
    pub async fn execute(&self, surql: &str) -> Result<()> {
        self.adapter
            .execute_in_ns(&self.namespace, &self.database, surql)
            .await
    }

    /// Health check — verifies the WAL can serve reads in THIS namespace.
    ///
    /// Runs `SELECT * FROM kv LIMIT 1` which proves:
    /// 1. The connection is alive
    /// 2. The namespace/database exists
    /// 3. The schema was applied (kv table exists)
    /// 4. The WAL can serve reads (not just metadata)
    ///
    /// # Errors
    /// Returns error if the database is unreachable or the namespace is broken.
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
    pub async fn create_node(&self, table: &str, id: &str, props: &serde_json::Value) -> Result<()> {
        let surql = format!(
            "CREATE type::thing('{table}', '{id}') CONTENT {props};"
        );
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
        let surql = format!(
            "SELECT ->{edge_type}->* AS connected FROM {start_id} LIMIT {depth};"
        );
        let result = self.query(&surql).await?;
        match result {
            serde_json::Value::Array(rows) => Ok(rows),
            other => Ok(vec![other]),
        }
    }

    /// Set a key-value pair in the scoped kv table.
    ///
    /// # Errors
    /// Returns error if the upsert fails.
    pub async fn kv_set(&self, key: &str, value: &[u8]) -> Result<()> {
        let encoded = base64::engine::general_purpose::STANDARD.encode(value);
        let surql = format!(
            "UPSERT kv:`{key}` SET key = '{key}', value = encoding::base64::decode('{encoded}');"
        );
        self.execute(&surql).await
    }

    /// Get a value from the scoped kv table.
    ///
    /// # Errors
    /// Returns error if the query fails.
    pub async fn kv_get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let result = self.query(&format!("SELECT value FROM kv:`{key}`;")).await?;
        // Result is an array. If empty or value is null, return None.
        if let serde_json::Value::Array(rows) = &result {
            if let Some(row) = rows.first() {
                if let Some(val) = row.get("value") {
                    if !val.is_null() {
                        // SurrealDB returns bytes as a base64 string in JSON
                        if let Some(s) = val.as_str() {
                            let bytes = base64::engine::general_purpose::STANDARD
                                .decode(s)
                                .context("Failed to decode base64 kv value")?;
                            return Ok(Some(bytes));
                        }
                    }
                }
            }
        }
        Ok(None)
    }

    /// Delete a key from the scoped kv table.
    ///
    /// # Errors
    /// Returns error if the deletion fails.
    pub async fn kv_delete(&self, key: &str) -> Result<bool> {
        let result = self.query(&format!("DELETE kv:`{key}` RETURN BEFORE;")).await?;
        // If RETURN BEFORE has rows, the key existed
        if let serde_json::Value::Array(rows) = &result {
            return Ok(!rows.is_empty());
        }
        Ok(false)
    }
}

// ═══════════════════════════════════════════════════════════════
// Data types
// ═══════════════════════════════════════════════════════════════

/// Key-value record for signal-based storage.
#[derive(Debug, Clone, Serialize, Deserialize, SurrealValue)]
#[surreal(crate = "surrealdb::types")]
struct KvRecord {
    key: String,
    value: Vec<u8>,
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
// Kernel reasoning schema (used by SurrealAdapter::open)
// ═══════════════════════════════════════════════════════════════

/// Schema for the kernel reasoning system.
///
/// This is the kernel's own schema — used when the kernel opens its
/// own `SurrealAdapter` via `open()`. The engine-level schemas in
/// `services/graph.rs` cover the platform scopes (system/user/global).
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
";
