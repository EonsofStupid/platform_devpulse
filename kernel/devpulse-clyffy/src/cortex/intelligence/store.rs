//! [`IntelligenceStore`] — connector contract for the intelligence layer.
//!
//! Backends implement this trait against their own storage layer.
//! The engine wires a chosen connector behind
//! `Arc<dyn IntelligenceStore>` so swapping a connector is a Cargo
//! feature flag flip plus a wiring change at boot — the abstract
//! layer never rebuilds.
//!
//! Five operations:
//!
//! * [`init_project`](IntelligenceStore::init_project) — applies the
//!   [`super::schema::MEMORY_SCHEMA`] to a project-local namespace,
//!   idempotent on re-boot.
//! * [`save_memory`](IntelligenceStore::save_memory) — upserts a
//!   [`super::record::MemoryRecord`] into the `memories` table.
//!   Connectors that support it dedupe by embedding similarity
//!   above a threshold before insert.
//! * [`recall_by_embedding`](IntelligenceStore::recall_by_embedding)
//!   — HNSW nearest-neighbor query, returns top-K hits with
//!   cosine-similarity scores.
//! * [`relate`](IntelligenceStore::relate) — creates a typed edge
//!   between two memories.
//! * [`write_archive`](IntelligenceStore::write_archive) /
//!   [`read_archive_bytes`](IntelligenceStore::read_archive_bytes)
//!   — round-trip the rkyv-archived [`super::record::RroRecord`] in
//!   the sidecar `rro_archive` table. Read returns raw bytes so
//!   callers can `RroRecord::access` zero-copy.

use anyhow::Result;
use async_trait::async_trait;

use super::record::{MemoryKind, MemoryRecord};

/// One hit in a [`IntelligenceStore::recall_by_embedding`] result.
#[derive(Debug, Clone)]
pub struct RecallHit {
    /// Matching memory.
    pub record: MemoryRecord,
    /// Cosine similarity in `[0.0, 1.0]`. Higher = closer.
    pub score: f32,
}

/// Connector contract for the project-local intelligence store.
///
/// Every method is namespace-scoped via `slug` (a value produced by
/// [`super::slug::slug_for_cwd`]). Connectors translate the slug to
/// whatever shape their backend uses for project isolation
/// (SurrealDB database name, libsql connection string, etc).
#[async_trait]
pub trait IntelligenceStore: Send + Sync {
    /// Apply [`super::schema::MEMORY_SCHEMA`] to the project's
    /// namespace. Idempotent — safe to call on every boot.
    ///
    /// # Errors
    /// Returns an error if the schema DDL fails.
    async fn init_project(&self, slug: &str) -> Result<()>;

    /// Upsert a memory row into the project's `memories` table.
    ///
    /// Connectors MAY dedupe by embedding similarity (cosine >
    /// 0.92) and merge into an existing row; if they do, the
    /// returned id is the id of the surviving row.
    ///
    /// # Errors
    /// Returns an error if the write fails.
    async fn save_memory(&self, slug: &str, record: &MemoryRecord) -> Result<String>;

    /// HNSW nearest-neighbor query against the project's `memories`
    /// embedding index.
    ///
    /// `query_embedding` must match
    /// [`super::schema::EMBEDDING_DIM`]. Returns up to `top_k` hits
    /// sorted by descending cosine similarity. Optional `kind`
    /// filter narrows by [`MemoryKind`] when set.
    ///
    /// # Errors
    /// Returns an error if the query fails or `query_embedding` is
    /// the wrong length.
    async fn recall_by_embedding(
        &self,
        slug: &str,
        query_embedding: &[f32],
        top_k: usize,
        kind: Option<MemoryKind>,
    ) -> Result<Vec<RecallHit>>;

    /// Create a typed edge `from_id -> edge -> to_id` in the
    /// project's graph.
    ///
    /// # Errors
    /// Returns an error if the edge cannot be created.
    async fn relate(&self, slug: &str, from_id: &str, to_id: &str, edge: &str) -> Result<()>;

    /// Write a rkyv-archived `RroRecord` blob to the project's
    /// `rro_archive` table, keyed by the source memory id.
    ///
    /// `bytes` MUST be the output of `rkyv::to_bytes` for an
    /// `RroRecord`. Connectors don't validate the bytes — the
    /// reader does via `RroRecord::access`.
    ///
    /// # Errors
    /// Returns an error if the write fails.
    async fn write_archive(&self, slug: &str, memory_id: &str, bytes: &[u8]) -> Result<()>;

    /// Read the rkyv-archived `RroRecord` blob for a given memory
    /// id. Returns `None` when no archive exists.
    ///
    /// Caller applies `RroRecord::access(&bytes)` for zero-copy
    /// access. The returned `Vec<u8>` carries no alignment guarantee
    /// beyond what the underlying connector provides — connectors
    /// targeting the rkyv fast-path MUST return aligned buffers
    /// (`mmap`-backed, or `AlignedVec`-derived).
    ///
    /// # Errors
    /// Returns an error if the read fails.
    async fn read_archive_bytes(&self, slug: &str, memory_id: &str) -> Result<Option<Vec<u8>>>;
}
