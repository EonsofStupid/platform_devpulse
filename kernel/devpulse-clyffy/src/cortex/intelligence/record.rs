//! Memory and reasoning-ready record types.
//!
//! Two record shapes live here:
//!
//! - [`MemoryRecord`] — serde-only graph-row shape that lands in the
//!   `memories` table of the project-local store. Read/written
//!   through whichever connector implements
//!   [`super::store::IntelligenceStore`]. Embedding dimension is
//!   fixed at [`super::schema::EMBEDDING_DIM`] (matches the
//!   `CandleEmbedder` MiniLM default).
//! - [`RroRecord`] — rkyv-archivable shape that backs the zero-copy
//!   fast path. Precomputed at WRITE time (text + embedding + 1-hop
//!   neighbors + metadata), serialized via `rkyv::to_bytes`, stored
//!   as a sidecar blob; READ is mmap + `rkyv::access` → no
//!   deserialization, no graph re-traversal, near-instant.

use anyhow::{anyhow, Result};
use rkyv::{Archive, Deserialize as RkyvDeserialize, Serialize as RkyvSerialize};
use serde::{Deserialize, Serialize};
use surrealdb::types::SurrealValue;

// ═══════════════════════════════════════════════════════════════
// Kind taxonomy — shared across graph-row and rkyv-archive paths
// ═══════════════════════════════════════════════════════════════

/// Kind taxonomy for stored memories.
///
/// Carries both serde and rkyv derives so the same value flows
/// through the JSON-shaped graph row ([`MemoryRecord`]) and the
/// zero-copy archive ([`RroRecord`]) with no translation step.
/// Variants are unit-only — the archived layout is a compact tag.
#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    Hash,
    Serialize,
    Deserialize,
    SurrealValue,
    Archive,
    RkyvSerialize,
    RkyvDeserialize,
)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "snake_case")]
#[surreal(crate = "surrealdb::types")]
pub enum MemoryKind {
    /// Architectural decision — locked rules, design choices.
    Decision,
    /// Lesson captured from a mistake or correction.
    Learning,
    /// Recurring pattern worth labeling for retrieval.
    Pattern,
    /// Incident record (failure / regression / outage).
    Incident,
    /// File-scoped note pinned to a source path.
    File,
    /// User prompt captured for recall and reflection.
    Prompt,
    /// Assistant response captured for recall and reflection.
    Response,
    /// End-of-session reflection / structured summary.
    Reflection,
}

// ═══════════════════════════════════════════════════════════════
// MemoryRecord — graph-row shape for the HNSW-indexed memories table
// ═══════════════════════════════════════════════════════════════

/// Row shape for the `memories` HNSW-indexed table under the
/// project-local namespace.
///
/// Read/written by the active [`super::store::IntelligenceStore`]
/// connector. Embedding dimension is fixed at
/// [`super::schema::EMBEDDING_DIM`] in the schema; changing the
/// embedder dim requires a fresh per-project table re-init.
///
/// Carries `SurrealValue` so the typed-bind path on the connector
/// roundtrips the row without serde / `serde_json::Value`
/// intermediation. The `serde` derives stay on for the engine /
/// Tauri-IPC JSON paths.
#[derive(Debug, Clone, Serialize, Deserialize, SurrealValue)]
#[surreal(crate = "surrealdb::types")]
pub struct MemoryRecord {
    /// Stable id — UUIDv7 by convention.
    pub id: String,
    /// Verbatim memory text. Bounded by caller (≈ 2 KB practical max).
    pub text: String,
    /// Dense embedding produced by the active text embedder. Must
    /// match the HNSW index dimension.
    pub embedding: Vec<f32>,
    /// Kind taxonomy.
    pub kind: MemoryKind,
    /// Caller-supplied priority hint (0..=10). Recall scoring blends
    /// this with cosine similarity and recency decay.
    pub priority: u8,
    /// Unix seconds at first write.
    pub created_at: i64,
    /// Unix seconds at most-recent update (dedup-merge bumps this).
    pub updated_at: i64,
}

// ═══════════════════════════════════════════════════════════════
// RroRecord + NeighborRef — rkyv-archivable reasoning-ready shape
// ═══════════════════════════════════════════════════════════════

/// One outbound edge from an [`RroRecord`] to a neighbor — precomputed
/// at write time so the read path does not re-traverse the graph.
#[derive(Debug, Clone, Archive, RkyvSerialize, RkyvDeserialize)]
pub struct NeighborRef {
    /// Neighbor record id (matches `memories.id`).
    pub id: String,
    /// Edge type that connects this neighbor to the source record.
    pub edge: String,
    /// Neighbor text — copied at write time so a recall can render
    /// the neighborhood without a second lookup.
    pub text: String,
    /// Neighbor priority hint (mirrors [`MemoryRecord::priority`]).
    pub priority: u8,
}

/// rkyv-archivable reasoning-ready record — the zero-copy target shape.
///
/// Layout mirrors [`MemoryRecord`] with two additions:
///
/// * `neighbors` — 1-hop subgraph cached at write time via the
///   connector's graph traversal. Read path returns a
///   `&ArchivedRroRecord` that exposes neighbors directly without
///   re-querying the graph.
/// * `metadata` — k/v tuples for caller-specific extension fields.
///   Stored as `Vec<(String, String)>` (rather than a map) so the
///   archived form is a flat slice — preserves zero-copy semantics
///   without depending on rkyv's optional `hashbrown` archive
///   support.
///
/// rkyv generates `ArchivedRroRecord` for zero-copy reads via
/// [`Self::access`]. Full owned deserialization is rkyv-standard:
/// `rkyv::deserialize::<RroRecord, rkyv::rancor::Error>(archived)`.
#[derive(Debug, Clone, Archive, RkyvSerialize, RkyvDeserialize)]
pub struct RroRecord {
    /// Stable id — matches the [`MemoryRecord::id`] this archive
    /// shadows.
    pub id: String,
    /// Verbatim text.
    pub text: String,
    /// Dense embedding (same dim as the HNSW index).
    pub embedding: Vec<f32>,
    /// Kind taxonomy.
    pub kind: MemoryKind,
    /// Caller-supplied priority hint (0..=10).
    pub priority: u8,
    /// Unix seconds at first write.
    pub created_at: i64,
    /// Unix seconds at most-recent update.
    pub updated_at: i64,
    /// Precomputed 1-hop neighborhood. Empty when no edges exist.
    pub neighbors: Vec<NeighborRef>,
    /// Caller-specific metadata as flat tuples.
    pub metadata: Vec<(String, String)>,
}

impl RroRecord {
    /// Access a stored archive zero-copy from an aligned byte slice.
    ///
    /// `bytes` MUST come from a buffer aligned for rkyv — typically
    /// a `rkyv::util::AlignedVec` written by `rkyv::to_bytes` or an
    /// `mmap`-backed page. The returned reference borrows from
    /// `bytes`, so the buffer must outlive every use of the
    /// archive.
    ///
    /// # Errors
    /// Propagates rkyv validation failures — corruption, truncation,
    /// wrong type, mis-aligned buffer.
    pub fn access(bytes: &[u8]) -> Result<&ArchivedRroRecord> {
        rkyv::access::<ArchivedRroRecord, rkyv::rancor::Error>(bytes)
            .map_err(|e| anyhow!("rkyv access: {e}"))
    }
}

#[cfg(test)]
mod tests {
    use super::MemoryKind;

    #[test]
    fn memory_kind_serde_roundtrips() -> anyhow::Result<()> {
        for kind in [
            MemoryKind::Decision,
            MemoryKind::Learning,
            MemoryKind::Pattern,
            MemoryKind::Incident,
            MemoryKind::File,
            MemoryKind::Prompt,
            MemoryKind::Response,
            MemoryKind::Reflection,
        ] {
            let json = serde_json::to_string(&kind)?;
            let back: MemoryKind = serde_json::from_str(&json)?;
            assert_eq!(back, kind);
        }
        Ok(())
    }

    #[test]
    fn memory_kind_decision_renders_snake_case() -> anyhow::Result<()> {
        assert_eq!(
            serde_json::to_string(&MemoryKind::Decision)?,
            "\"decision\""
        );
        assert_eq!(
            serde_json::to_string(&MemoryKind::Reflection)?,
            "\"reflection\""
        );
        Ok(())
    }
}
