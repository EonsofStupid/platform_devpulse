//! Vector store wrapper — RRO (Reason Ready Object).
//!
//! Stub implementation. RRO is an internal Qdrant fork compiled into
//! the binary as a Rust process. Currently disabled in config.
//! When enabled, will provide vector similarity search for the
//! knowledge graph and RAG pipeline.

use super::{Store, StoreRole};
use anyhow::Result;

/// Vector store (RRO) — not yet integrated.
pub struct VectorStore;

impl Store for VectorStore {
    fn name(&self) -> &'static str {
        "Vector store"
    }

    fn role(&self) -> StoreRole {
        StoreRole::Vector
    }

    async fn ping(&self) -> Result<()> {
        anyhow::bail!("RRO not yet integrated")
    }

    fn is_ready(&self) -> bool {
        false
    }
}
