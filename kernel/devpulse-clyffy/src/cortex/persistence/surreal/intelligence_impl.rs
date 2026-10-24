//! `IntelligenceStore` implementation backed by the Surreal server
//! (`SurrealAdapter`, plan 0007 Part S).
//!
//! Plugs the abstract intelligence layer
//! ([`crate::cortex::intelligence`]) into the local server. Every method
//! routes through the typed scoped helpers on [`SurrealAdapter`]: values
//! are bound, never pasted into `SurrealQL`; embeddings cross as float
//! arrays and archive bytes as bytes.
//!
//! Future connectors (`surreal_cloud`, `turso`, ...) live in
//! sibling modules under `cortex::persistence::*` and implement the
//! same trait, so engine boot can choose a backend behind
//! `Arc<dyn IntelligenceStore>` without rebuilding the kernel.

use anyhow::{Context, Result};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::cortex::intelligence::{
    IntelligenceStore, MemoryKind, MemoryRecord, RecallHit, EMBEDDING_DIM, MEMORY_SCHEMA,
};
use crate::cortex::persistence::surreal::client::SurrealAdapter;
use crate::cortex::persistence::surreal::rpc::Query;

/// Namespace under `projects/<slug>` is the routing convention. The
/// abstract `slug` parameter on every trait method maps to the
/// `SurrealDB` database name; namespace is fixed at `"projects"` so
/// every project-local store sits in a single namespace bucket.
const PROJECT_NAMESPACE: &str = "projects";

/// Recall-row shape returned by the HNSW-knn similarity query: a
/// [`MemoryRecord`] field-for-field plus `score`, re-assembled into
/// [`MemoryRecord`] + [`RecallHit::score`] inside `recall_by_embedding`.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct RecallRow {
    id: String,
    text: String,
    embedding: Vec<f32>,
    kind: MemoryKind,
    priority: u8,
    created_at: i64,
    updated_at: i64,
    score: f32,
}

#[async_trait]
impl IntelligenceStore for SurrealAdapter {
    async fn init_project(&self, slug: &str) -> Result<()> {
        self.init_namespace(PROJECT_NAMESPACE, slug, MEMORY_SCHEMA)
            .await
    }

    async fn save_memory(&self, slug: &str, record: &MemoryRecord) -> Result<String> {
        if record.embedding.len() != EMBEDDING_DIM {
            anyhow::bail!(
                "save_memory: embedding length {} != EMBEDDING_DIM ({EMBEDDING_DIM})",
                record.embedding.len()
            );
        }
        self.upsert_typed_in_ns(PROJECT_NAMESPACE, slug, "memories", &record.id, record)
            .await
            .with_context(|| format!("save_memory {slug}:{}", record.id))?;
        Ok(record.id.clone())
    }

    async fn recall_by_embedding(
        &self,
        slug: &str,
        query_embedding: &[f32],
        top_k: usize,
        kind: Option<MemoryKind>,
    ) -> Result<Vec<RecallHit>> {
        if query_embedding.len() != EMBEDDING_DIM {
            anyhow::bail!(
                "recall_by_embedding: embedding length {} != EMBEDDING_DIM ({EMBEDDING_DIM})",
                query_embedding.len()
            );
        }

        // SurrealDB HNSW knn syntax: `<|K,COSINE|>` on the indexed
        // field. The optional kind filter narrows the candidate set
        // BEFORE the knn so the index still drives ordering.
        let kind_clause = match kind {
            Some(_) => "AND kind = $kind",
            None => "",
        };
        let surql = format!(
            "SELECT *, vector::similarity::cosine(embedding, $emb) AS score \
             FROM memories \
             WHERE embedding <|{top_k},COSINE|> $emb {kind_clause} \
             ORDER BY score DESC LIMIT {top_k};"
        );

        let mut q = Query::new(surql).bind("emb", query_embedding)?;
        if let Some(k) = kind {
            // MemoryKind serializes as its snake_case name — the same text
            // `save_memory` writes into the `kind TYPE string` column.
            q = q.bind("kind", &k)?;
        }
        let rows: Vec<RecallRow> = self
            .run(PROJECT_NAMESPACE, slug, q)
            .await?
            .take(0)
            .with_context(|| format!("recall {slug}"))?
            .into_iter()
            .map(serde_json::from_value)
            .collect::<std::result::Result<_, _>>()
            .with_context(|| format!("recall rows {slug}"))?;

        Ok(rows
            .into_iter()
            .map(|r| RecallHit {
                record: MemoryRecord {
                    id: r.id,
                    text: r.text,
                    embedding: r.embedding,
                    kind: r.kind,
                    priority: r.priority,
                    created_at: r.created_at,
                    updated_at: r.updated_at,
                },
                score: r.score,
            })
            .collect())
    }

    async fn relate(&self, slug: &str, from_id: &str, to_id: &str, edge: &str) -> Result<()> {
        // RELATE on parametrized record ids via `type::record` (Surreal 3's
        // name for `type::thing`). The edge table name flows through `$edge`
        // so the connector never builds a SurrealQL identifier from caller
        // input.
        let q = Query::new(
            "RELATE type::record('memories', $from)->\
             type::record($edge, rand::uuid())->\
             type::record('memories', $to);",
        )
        .bind("from", from_id)?
        .bind("to", to_id)?
        .bind("edge", edge)?;
        self.run(PROJECT_NAMESPACE, slug, q)
            .await?
            .check()
            .with_context(|| format!("relate {slug} {from_id}->{edge}->{to_id}"))
    }

    async fn write_archive(&self, slug: &str, memory_id: &str, bytes: &[u8]) -> Result<()> {
        // The archive row's id matches the memory id 1:1. `memory_id` is a
        // record reference, cast through `type::record('memories', $mid)`;
        // the blob crosses as bytes.
        let q = Query::new(
            "UPSERT type::record('rro_archive', $mid) \
             CONTENT { memory_id: type::record('memories', $mid), bytes: $bytes };",
        )
        .bind("mid", memory_id)?
        .bind("bytes", serde_bytes::Bytes::new(bytes))?;
        self.run(PROJECT_NAMESPACE, slug, q)
            .await?
            .check()
            .with_context(|| format!("write_archive {slug}:{memory_id}"))
    }

    async fn read_archive_bytes(&self, slug: &str, memory_id: &str) -> Result<Option<Vec<u8>>> {
        self.read_archive_bytes_in_ns(PROJECT_NAMESPACE, slug, memory_id)
            .await
    }
}
