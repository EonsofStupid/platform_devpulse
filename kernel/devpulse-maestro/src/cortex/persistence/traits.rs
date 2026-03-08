//! Persistence layer traits
//!
//! Defines the async CRUD interface for all database adapters.
//! Combination of signal-based routing + async get/set/delete.

use anyhow::Result;
use serde::{de::DeserializeOwned, Serialize};
use std::fmt;

/// Typed SQL value — no lazy string dumps.
#[derive(Debug, Clone, PartialEq)]
pub enum SqlValue {
    /// NULL
    Null,
    /// Integer (i64)
    Integer(i64),
    /// Floating point (f64)
    Real(f64),
    /// Text (String)
    Text(String),
    /// Binary data
    Blob(Vec<u8>),
}

impl SqlValue {
    /// Get as i64 if this is an Integer.
    pub fn as_integer(&self) -> Option<i64> {
        match self {
            Self::Integer(v) => Some(*v),
            _ => None,
        }
    }

    /// Get as f64 if this is a Real.
    pub fn as_real(&self) -> Option<f64> {
        match self {
            Self::Real(v) => Some(*v),
            _ => None,
        }
    }

    /// Get as &str if this is Text.
    pub fn as_text(&self) -> Option<&str> {
        match self {
            Self::Text(v) => Some(v.as_str()),
            _ => None,
        }
    }

    /// Get as &[u8] if this is a Blob.
    pub fn as_blob(&self) -> Option<&[u8]> {
        match self {
            Self::Blob(v) => Some(v.as_slice()),
            _ => None,
        }
    }

    /// Returns true if this is Null.
    pub fn is_null(&self) -> bool {
        matches!(self, Self::Null)
    }
}

impl fmt::Display for SqlValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Null => write!(f, "NULL"),
            Self::Integer(v) => write!(f, "{v}"),
            Self::Real(v) => write!(f, "{v}"),
            Self::Text(v) => write!(f, "{v}"),
            Self::Blob(v) => write!(f, "<blob {} bytes>", v.len()),
        }
    }
}

/// A single row of typed SQL values.
pub type SqlRow = Vec<SqlValue>;

/// Core persistence operations trait
/// All database adapters implement this for basic CRUD
#[allow(async_fn_in_trait)]
pub trait PersistenceAdapter: Send + Sync {
    /// Store a value by key
    async fn set(&self, key: &str, value: &[u8]) -> Result<()>;

    /// Retrieve a value by key
    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>>;

    /// Delete a value by key
    async fn delete(&self, key: &str) -> Result<bool>;

    /// Check if a key exists
    async fn exists(&self, key: &str) -> Result<bool>;
}

/// Extended persistence for typed serialization
#[allow(async_fn_in_trait)]
pub trait TypedPersistence: PersistenceAdapter {
    /// Store a serializable value
    async fn set_json<T: Serialize + Send + Sync>(&self, key: &str, value: &T) -> Result<()> {
        let bytes = serde_json::to_vec(value)?;
        self.set(key, &bytes).await
    }

    /// Retrieve and deserialize a value
    async fn get_json<T: DeserializeOwned>(&self, key: &str) -> Result<Option<T>> {
        match self.get(key).await? {
            Some(bytes) => Ok(Some(serde_json::from_slice(&bytes)?)),
            None => Ok(None),
        }
    }
}

// Blanket impl for all PersistenceAdapters
impl<T: PersistenceAdapter> TypedPersistence for T {}

/// SQL query interface for relational stores (`LibSQL`, `DuckDB`)
#[allow(async_fn_in_trait)]
pub trait SqlAdapter: Send + Sync {
    /// Execute a query that returns typed rows.
    async fn query(&self, sql: &str, params: &[&str]) -> Result<Vec<SqlRow>>;

    /// Execute a statement that modifies data.
    async fn execute(&self, sql: &str, params: &[&str]) -> Result<u64>;

    /// Execute a batch of statements.
    async fn execute_batch(&self, sql: &str) -> Result<()>;
}

/// Graph operations for `SurrealDB` reasoning system
#[allow(async_fn_in_trait)]
pub trait GraphAdapter: Send + Sync {
    /// Create a node with properties
    async fn create_node(&self, table: &str, id: &str, props: serde_json::Value) -> Result<()>;

    /// Create an edge between nodes
    async fn create_edge(
        &self,
        table: &str,
        from_id: &str,
        to_id: &str,
        props: serde_json::Value,
    ) -> Result<()>;

    /// Query nodes by property
    async fn query_nodes(&self, table: &str, filter: &str) -> Result<Vec<serde_json::Value>>;

    /// Traverse graph from a starting node
    async fn traverse(
        &self,
        start_id: &str,
        edge_type: &str,
        depth: u32,
    ) -> Result<Vec<serde_json::Value>>;
}

/// Analytics query interface for `DuckDB`
#[allow(async_fn_in_trait)]
pub trait AnalyticsAdapter: Send + Sync {
    /// Run an analytics query returning typed rows.
    async fn analytics_query(&self, sql: &str) -> Result<Vec<SqlRow>>;

    /// Append data to an analytics table.
    async fn append(&self, table: &str, data: &[serde_json::Value]) -> Result<u64>;
}

/// Cache operations for in-memory stores (Moka).
#[allow(async_fn_in_trait)]
pub trait CacheAdapter: PersistenceAdapter {
    /// Invalidate all entries whose key starts with `prefix`.
    async fn invalidate_prefix(&self, prefix: &str) -> Result<u64>;

    /// Returns `(entry_count, max_capacity)`.
    fn stats(&self) -> (u64, u64);

    /// Remove all entries.
    async fn clear(&self);

    /// Number of entries currently in the cache.
    fn entry_count(&self) -> u64;
}
