//! `SurrealDB` adapter for reasoning system
//!
//! Handles: reasoning graph, state transitions, knowledge relationships
//! Namespace: maestro/devpulse/reasoning/ with sub-categories
//!
//! This is the "brain" storage for the AI reasoning system.

use crate::cortex::persistence::config::SurrealNamespace;
use crate::cortex::persistence::traits::{GraphAdapter, PersistenceAdapter};
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use surrealdb::engine::local::{Db, SurrealKv};
use surrealdb::types::SurrealValue;
use surrealdb::Surreal;
use tokio::sync::RwLock;

/// `SurrealDB` adapter for reasoning graph.
pub struct SurrealAdapter {
    db: Arc<RwLock<Surreal<Db>>>,
}

impl SurrealAdapter {
    /// Open database at path with `SurrealKV` backend (pure Rust).
    ///
    /// Uses the default maestro reasoning namespace/database/schema.
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
    /// This is the primary constructor — `open()` delegates here with
    /// maestro defaults. Engine-level scoped stores pass their own
    /// namespace/database/schema from config.
    ///
    /// # Errors
    /// Returns error if the database cannot be opened or schema initialization fails.
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

        db.use_ns(namespace)
            .use_db(database)
            .await
            .with_context(|| {
                format!("Failed to select namespace '{namespace}' / database '{database}'")
            })?;

        let adapter = Self {
            db: Arc::new(RwLock::new(db)),
        };

        // Initialize with provided schema
        adapter.init_schema(schema).await?;

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

        db.use_ns(SurrealNamespace::REASONING.namespace)
            .use_db(SurrealNamespace::REASONING.database)
            .await
            .context("Failed to select namespace/database")?;

        let adapter = Self {
            db: Arc::new(RwLock::new(db)),
        };

        adapter.init_schema(REASONING_SCHEMA).await?;
        Ok(adapter)
    }

    /// Initialize the database schema with provided DDL.
    async fn init_schema(&self, schema: &str) -> Result<()> {
        let db = self.db.read().await;

        db.query(schema)
            .await
            .context("Failed to initialize SurrealDB schema")?;

        Ok(())
    }

    /// Get database handle for advanced queries
    pub async fn database(&self) -> tokio::sync::RwLockReadGuard<'_, Surreal<Db>> {
        self.db.read().await
    }

    /// Ping database — executes `INFO FOR DB`.
    ///
    /// # Errors
    /// Returns error if the database is unreachable.
    pub async fn ping(&self) -> Result<()> {
        let db = self.db.read().await;
        db.query("INFO FOR DB")
            .await
            .context("SurrealDB ping failed")?;
        Ok(())
    }
}

impl PersistenceAdapter for SurrealAdapter {
    async fn set(&self, key: &str, value: &[u8]) -> Result<()> {
        let db = self.db.read().await;

        let record = KvRecord {
            key: key.to_string(),
            value: value.to_vec(),
        };

        db.create::<Option<KvRecord>>(("kv", key))
            .content(record)
            .await
            .context("Failed to set value in SurrealDB")?;

        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let db = self.db.read().await;

        let result: Option<KvRecord> = db
            .select(("kv", key))
            .await
            .context("Failed to get value from SurrealDB")?;

        Ok(result.map(|r| r.value))
    }

    async fn delete(&self, key: &str) -> Result<bool> {
        let db = self.db.read().await;

        let result: Option<KvRecord> = db
            .delete(("kv", key))
            .await
            .context("Failed to delete from SurrealDB")?;

        Ok(result.is_some())
    }

    async fn exists(&self, key: &str) -> Result<bool> {
        let db = self.db.read().await;

        let result: Option<KvRecord> = db
            .select(("kv", key))
            .await
            .context("Failed to check existence in SurrealDB")?;

        Ok(result.is_some())
    }
}

impl GraphAdapter for SurrealAdapter {
    async fn create_node(&self, table: &str, id: &str, props: serde_json::Value) -> Result<()> {
        let db = self.db.read().await;

        // Use parameterized query to prevent injection
        // Convert to owned strings for surrealdb bind API
        let table = table.to_string();
        let id = id.to_string();
        db.query("CREATE type::thing($table, $id) CONTENT $props")
            .bind(("table", table))
            .bind(("id", id))
            .bind(("props", props))
            .await
            .context("Failed to create node")?;

        Ok(())
    }

    async fn create_edge(
        &self,
        table: &str,
        from_id: &str,
        to_id: &str,
        props: serde_json::Value,
    ) -> Result<()> {
        let db = self.db.read().await;

        // Use parameterized query to prevent injection
        let table = table.to_string();
        let from_id = from_id.to_string();
        let to_id = to_id.to_string();
        let edge_id = uuid::Uuid::new_v4().to_string();
        db.query("RELATE $from->type::thing($table, $edge_id)->$to CONTENT $props")
            .bind(("from", from_id))
            .bind(("table", table))
            .bind(("edge_id", edge_id))
            .bind(("to", to_id))
            .bind(("props", props))
            .await
            .context("Failed to create edge")?;

        Ok(())
    }

    async fn query_nodes(&self, table: &str, filter: &str) -> Result<Vec<serde_json::Value>> {
        let db = self.db.read().await;

        // Convert to owned for bind API
        let table = table.to_string();
        let filter = filter.to_string();

        // Note: filter is expected to be a safe field reference, not user input
        // For user-facing queries, use parameterized conditions
        let mut response = if filter.is_empty() {
            db.query("SELECT * FROM type::table($table)")
                .bind(("table", table))
                .await
        } else {
            // Filter must be validated/sanitized by caller for complex conditions
            db.query("SELECT * FROM type::table($table) WHERE $filter")
                .bind(("table", table))
                .bind(("filter", filter))
                .await
        }
        .context("Failed to query nodes")?;

        let results: Vec<serde_json::Value> = response.take(0).context("Failed to take results")?;

        Ok(results)
    }

    async fn traverse(
        &self,
        start_id: &str,
        edge_type: &str,
        depth: u32,
    ) -> Result<Vec<serde_json::Value>> {
        let db = self.db.read().await;

        // Convert to owned for bind API
        let edge_type = edge_type.to_string();
        let start_id = start_id.to_string();

        let mut response = db
            .query("SELECT ->type::table($edge)->* AS connected FROM $start LIMIT $depth")
            .bind(("edge", edge_type))
            .bind(("start", start_id))
            .bind(("depth", depth))
            .await
            .context("Failed to traverse graph")?;

        let results: Vec<serde_json::Value> = response.take(0).context("Failed to take results")?;

        Ok(results)
    }
}

/// Key-value record for signal-based storage
#[derive(Debug, Clone, Serialize, Deserialize, SurrealValue)]
#[surreal(crate = "surrealdb::types")]
struct KvRecord {
    key: String,
    value: Vec<u8>,
}

/// Reasoning node in the graph
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

/// State in the reasoning HMM
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

/// Transition between reasoning states
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

/// Schema for reasoning system.
const REASONING_SCHEMA: &str = r"
-- Key-value store for signal-based access
DEFINE TABLE kv SCHEMAFULL;
DEFINE FIELD key ON kv TYPE string;
DEFINE FIELD value ON kv TYPE bytes;
DEFINE INDEX kv_key ON kv FIELDS key UNIQUE;

-- Reasoning nodes (concepts, facts, decisions)
DEFINE TABLE nodes SCHEMAFULL;
DEFINE FIELD node_type ON nodes TYPE string;
DEFINE FIELD content ON nodes TYPE string;
DEFINE FIELD metadata ON nodes TYPE object;
DEFINE FIELD created_at ON nodes TYPE datetime DEFAULT time::now();
DEFINE INDEX nodes_type ON nodes FIELDS node_type;

-- Reasoning edges (relationships between nodes)
DEFINE TABLE relates SCHEMAFULL;
DEFINE FIELD relation_type ON relates TYPE string;
DEFINE FIELD weight ON relates TYPE float DEFAULT 1.0;
DEFINE FIELD created_at ON relates TYPE datetime DEFAULT time::now();

-- HMM states for reasoning
DEFINE TABLE states SCHEMAFULL;
DEFINE FIELD name ON states TYPE string;
DEFINE FIELD probability ON states TYPE float;
DEFINE FIELD emissions ON states TYPE array;
DEFINE INDEX states_name ON states FIELDS name UNIQUE;

-- State transitions
DEFINE TABLE transitions SCHEMAFULL;
DEFINE FIELD from_state ON transitions TYPE record(states);
DEFINE FIELD to_state ON transitions TYPE record(states);
DEFINE FIELD probability ON transitions TYPE float;
DEFINE FIELD trigger ON transitions TYPE string;
";
