//! Vector service wrapper (`RRO` — embedded Qdrant engine).
//!
//! Direct tokio channel communication to the RRO engine thread.
//! No HTTP, no gRPC — sub-millisecond message passing for
//! real-time keystroke-level vector search.
//!
//! Part of the two-tier retrieval pipeline:
//!   RRO (broad ANN → top 50) → Moka (hot cache → top 10 instant)

use super::{Service, ServiceRole};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::RroAdapter;
use std::sync::Arc;

/// Vector store backed by RRO (embedded Qdrant).
pub struct VectorService {
    adapter: Arc<RroAdapter>,
}

impl VectorService {
    /// Boot the vector store with optional config path.
    ///
    /// # Errors
    /// Returns error if the RRO engine fails to initialize.
    pub fn boot(config_path: Option<String>) -> Result<Self> {
        let adapter = RroAdapter::boot(config_path)?;
        Ok(Self {
            adapter: Arc::new(adapter),
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<RroAdapter> {
        &self.adapter
    }
}

impl Service for VectorService {
    fn name(&self) -> &'static str {
        "Vector service"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Vector
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn is_ready(&self) -> bool {
        true
    }
}
