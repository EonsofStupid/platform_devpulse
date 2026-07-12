//! `IntelligenceStore` implementation backed by the embedded
//! `SurrealKV` `SurrealAdapter`.
//!
//! Plugs the abstract intelligence layer
//! ([`crate::cortex::intelligence`]) into the local embedded
//! connector. Every method routes through the typed scoped helpers
//! on [`SurrealAdapter`]: no `SurrealQL` string interpolation, no
//! `serde_json::Value` round-trip for the primary record shape, no
//! session-state mutation across cloned `Surreal<Db>` handles.
//!
//! Future connectors (`surreal_cloud`, `libsql`, ...) live in
//! sibling modules under `cortex::persistence::*` and implement the
//! same trait, so engine boot can choose a backend behind
//! `Arc<dyn IntelligenceStore>` without rebuilding the kernel.

use anyhow::{Context, Result};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use surrealdb::types::SurrealValue;

use crate::cortex::intelligence::{
    IntelligenceStore, MemoryKind, MemoryRecord, RecallHit, EMBEDDING_DIM, MEMORY_SCHEMA,
};
use crate::cortex::persistence::surreal::client::SurrealAdapter;

/// Namespace under `projects/<slug>` is the routing convention. The
/// abstract `slug` parameter on every trait method maps to the
/// `SurrealDB` database name; namespace is fixed at `"projects"` so
/// every project-local store sits in a single namespace bucket.
const PROJECT_NAMESPACE: &str = "projects";

/// Recall-row shape returned by the HNSW-knn similarity query.
///
/// `SurrealValue` derive does not honor serde's `flatten`, so this
/// row mirrors [`MemoryRecord`] field-for-field and adds `score`.
/// The query result is re-assembled into [`MemoryRecord`] +
/// [`RecallHit::score`] inside `recall_by_embedding`.
#[derive(Debug, Clone, Serialize, Deserialize, SurrealValue)]
#[surreal(crate = "surrealdb::types")]
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
        // Clone once for the move into `upsert_typed_in_ns` — the
        // adapter helper requires `'static` for the bound payload.
        self.upsert_typed_in_ns(
            PROJECT_NAMESPACE,
            slug,
            "memories",
            &record.id,
            record.clone(),
        )
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

        let mut q = self
            .scoped_query(PROJECT_NAMESPACE, slug, &surql)
            .bind(("emb", query_embedding.to_vec()));
        if let Some(k) = kind {
            // Bind MemoryKind directly — SurrealValue serialization
            // matches what `save_memory` writes via the same path,
            // so the schema's `kind TYPE string` column compares
            // consistently across reads and writes.
            q = q.bind(("kind", k));
        }
        let mut response = q.await.with_context(|| format!("recall {slug}"))?;
        let rows: Vec<RecallRow> = response
            .take(1)
            .with_context(|| format!("recall take {slug}"))?;

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
        // RELATE on parametrized record ids via `type::thing`. Edge
        // table name flows through `$edge` so the connector never
        // builds a SurrealQL identifier from caller input.
        let surql = "RELATE type::thing('memories', $from)->\
                     type::thing($edge, rand::uuid())->\
                     type::thing('memories', $to);";
        self.scoped_query(PROJECT_NAMESPACE, slug, surql)
            .bind(("from", from_id.to_string()))
            .bind(("to", to_id.to_string()))
            .bind(("edge", edge.to_string()))
            .await
            .with_context(|| format!("relate {slug} {from_id}->{edge}->{to_id}"))?;
        Ok(())
    }

    async fn write_archive(&self, slug: &str, memory_id: &str, bytes: &[u8]) -> Result<()> {
        // The archive row's id matches the memory id 1:1 — keeps
        // the sidecar lookup-by-id straightforward. `memory_id` is
        // a SurrealDB record reference field, so cast through
        // `type::thing('memories', $mid)` at bind time.
        let surql = "UPSERT type::thing('rro_archive', $mid) \
                     CONTENT { memory_id: type::thing('memories', $mid), bytes: $bytes };";
        self.scoped_query(PROJECT_NAMESPACE, slug, surql)
            .bind(("mid", memory_id.to_string()))
            .bind(("bytes", bytes.to_vec()))
            .await
            .with_context(|| format!("write_archive {slug}:{memory_id}"))?;
        Ok(())
    }

    async fn read_archive_bytes(&self, slug: &str, memory_id: &str) -> Result<Option<Vec<u8>>> {
        self.read_archive_bytes_in_ns(PROJECT_NAMESPACE, slug, memory_id)
            .await
    }
}
