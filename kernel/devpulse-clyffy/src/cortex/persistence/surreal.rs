//! `SurrealDB` client adapter — WebSocket connection to the managed sidecar.
//!
//! The embedded `Surreal<Db>` path has been retired. DevPulse now ships
//! and manages the real SurrealDB server binary as a sidecar (see
//! [`super::surrealdb_sidecar::SurrealdbSidecarAdapter`]). This adapter
//! is a pure client: it opens a WebSocket to the already-running sidecar,
//! signs in with root credentials, and exposes namespace-scoped
//! operations via [`ScopedGraphHandle`].
//!
//! Two public types:
//! - `SurrealAdapter` — owns the `Surreal<Any>` WS client, shared across
//!   namespaces via `Arc`.
//! - `ScopedGraphHandle` — namespace-scoped operations. Every query is
//!   prefixed with `USE NS {ns} DB {db};` so namespace isolation is
//!   enforced at the query level, never implicit session state.
//!
//! In-memory mode for tests is still supported via `open_in_memory()`
//! (feature `kv-mem`).

use crate::cortex::persistence::config::SurrealNamespace;
use crate::cortex::persistence::surrealdb_sidecar::SidecarEndpoint;
use anyhow::{Context, Result};
use base64::Engine as _;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use surrealdb::engine::any::Any;
use surrealdb::opt::auth::Root;
use surrealdb::types::SurrealValue;
use surrealdb::Surreal;

// ═══════════════════════════════════════════════════════════════
// SurrealAdapter — WS client connection owner
// ═══════════════════════════════════════════════════════════════

/// `SurrealDB` client adapter — owns a single `Surreal<Any>` WS connection.
///
/// The connection is shared across all scoped graph handles. Cloning
/// the underlying `Surreal<Any>` is cheap (internal `Arc`). Every
/// runtime operation goes through `ScopedGraphHandle` which prefixes
/// queries with `USE NS ... DB ...;` — no session-state mutation after
/// sign-in.
pub struct SurrealAdapter {
    db: Surreal<Any>,
}

impl SurrealAdapter {
    /// Connect to the sidecar, sign in as root, and apply the default
    /// kernel reasoning schema.
    ///
    /// Equivalent to [`Self::connect_with_ns`] with the kernel's own
    /// `REASONING` namespace. Engine boot uses `connect_with_ns` so
    /// system/user/global all land on the same connection.
    ///
    /// # Errors
    /// - WebSocket connect fails (sidecar not running, wrong URL).
    /// - `signin` rejects the credentials.
    /// - Schema application fails.
    pub async fn connect(endpoint: &SidecarEndpoint) -> Result<Self> {
        Self::connect_with_ns(
            endpoint,
            SurrealNamespace::REASONING.namespace,
            SurrealNamespace::REASONING.database,
            REASONING_SCHEMA,
        )
        .await
    }

    /// Connect, sign in, and apply a schema scoped to `namespace/database`.
    ///
    /// This is the primary constructor. Opens ONE WS connection to the
    /// sidecar — additional namespaces on the same connection are
    /// initialized via [`Self::init_namespace`] on the returned adapter.
    ///
    /// # Errors
    /// - Connection fails.
    /// - Root signin fails.
    /// - Schema DDL fails.
    #[tracing::instrument(
        skip(schema),
        fields(
            url = %endpoint.ws_url(),
            namespace,
            database,
            schema_len = schema.len()
        ),
        err
    )]
    pub async fn connect_with_ns(
        endpoint: &SidecarEndpoint,
        namespace: &str,
        database: &str,
        schema: &str,
    ) -> Result<Self> {
        let ws = endpoint.ws_url();

        let db = surrealdb::engine::any::connect(&ws)
            .await
            .with_context(|| format!("failed to connect SurrealDB client to {ws}"))?;

        db.signin(Root {
            username: endpoint.root_user.clone(),
            password: endpoint.root_password.clone(),
        })
        .await
        .context("SurrealDB root signin failed — check sidecar SURREAL_USER/SURREAL_PASS")?;

        tracing::info!(
            url = %ws,
            namespace,
            database,
            "SurrealDB client connected — applying schema"
        );

        let adapter = Self { db };
        adapter.init_namespace(namespace, database, schema).await?;
        tracing::info!(namespace, database, "SurrealDB schema initialized");

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
        self.db.query(scoped).await.with_context(|| {
            format!("Failed to initialize schema for '{namespace}/{database}'")
        })?;

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

    /// Quiesce — WS close is a no-op; the sidecar's fsync happens on
    /// its shutdown, not ours. Stays async for signature stability.
    #[allow(clippy::unused_async)]
    pub async fn quiesce(&self) {
        tracing::info!("SurrealDB: client quiesced (connection will close on drop)");
    }
}

// ═══════════════════════════════════════════════════════════════
// ScopedGraphHandle — namespace-scoped operations
// ═══════════════════════════════════════════════════════════════

/// Namespace-scoped handle to a shared `SurrealDB` WS connection.
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

    /// The shared WS-client adapter backing this handle.
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
            .query_in_ns(
                &self.namespace,
                &self.database,
                "SELECT * FROM kv LIMIT 1",
            )
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
        let surql =
            format!("SELECT ->{edge_type}->* AS connected FROM {start_id} LIMIT {depth};");
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
        let result = self
            .query(&format!("SELECT value FROM kv:`{key}`;"))
            .await?;
        if let serde_json::Value::Array(rows) = &result {
            if let Some(row) = rows.first() {
                if let Some(val) = row.get("value") {
                    if !val.is_null() {
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
        let result = self
            .query(&format!("DELETE kv:`{key}` RETURN BEFORE;"))
            .await?;
        if let serde_json::Value::Array(rows) = &result {
            return Ok(!rows.is_empty());
        }
        Ok(false)
    }
}

// ═══════════════════════════════════════════════════════════════
// Data types — preserved from the pre-sidecar adapter
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
// Kernel reasoning schema (used by SurrealAdapter::connect)
// ═══════════════════════════════════════════════════════════════

/// Schema for the kernel reasoning system.
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
