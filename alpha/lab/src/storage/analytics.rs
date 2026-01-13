// lab/src/storage/analytics.rs

//! Lab Analytics - DuckDB wrapper for signal capture
//!
//! Stores ALL signals that flow through Lab for later analysis.
//! File: ~/.devpulse/data/lab_analytics.duckdb

use anyhow::Result;
use std::path::Path;
use std::sync::Arc;

// TODO: Sprint 2 - Replace with Lab's own implementation
use orchestrator::infra::duckdb::Analytics;

/// Lab Analytics wrapper
///
/// Currently delegates to orchestrator::Analytics opened at Lab's path.
/// Sprint 2 will implement Lab-specific schema and methods.
pub struct LabAnalytics {
    inner: Arc<Analytics>,
}

impl LabAnalytics {
    /// Open Lab analytics database
    pub fn open(path: &Path) -> Result<Self> {
        let inner = Analytics::open_with_path(path)?;
        Ok(Self {
            inner: Arc::new(inner),
        })
    }

    /// Record a signal event
    pub fn record_signal(&self, event_type: &str, payload: &serde_json::Value) -> Result<()> {
        self.inner.record_event(event_type, payload)
    }

    /// Get total event count
    pub fn event_count(&self) -> Result<u64> {
        self.inner.get_event_count()
    }

    /// Get inner Analytics (for routes that need direct access)
    /// TODO: Remove this in Sprint 2 when Lab has own methods
    pub fn inner(&self) -> Arc<Analytics> {
        Arc::clone(&self.inner)
    }
}
