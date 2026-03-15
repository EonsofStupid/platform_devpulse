//! Grammar service wrapper (`outlines-core` — structured generation engine).
//!
//! Wraps the outlines-core adapter for JSON schema → regex compilation.
//! Used by the CAG pipeline to constrain LLM output to valid structures.

use super::{Service, ServiceRole};
use anyhow::Result;
use devpulse_maestro::cortex::persistence::OutlinesAdapter;
use std::sync::Arc;

/// Grammar service backed by outlines-core (structured generation).
pub struct GrammarService {
    adapter: Arc<OutlinesAdapter>,
}

impl GrammarService {
    /// Boot the grammar service.
    ///
    /// # Errors
    /// Returns error if the outlines-core engine fails to initialize.
    pub fn boot() -> Result<Self> {
        let adapter = OutlinesAdapter::boot()?;
        Ok(Self {
            adapter: Arc::new(adapter),
        })
    }

    /// Get the underlying adapter for typed access.
    pub fn adapter(&self) -> &Arc<OutlinesAdapter> {
        &self.adapter
    }
}

impl Service for GrammarService {
    fn name(&self) -> &'static str {
        "Grammar service"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Grammar
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping()
    }

    fn is_ready(&self) -> bool {
        true
    }
}
