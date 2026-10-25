// orchestrator/src/types/expert.rs

//! Expert trait - Contract for all sub-agents (IP - orchestrator only)
//!
//! Every sub-agent (GUARDIAN, VISION, PSYCH, etc.) implements Expert.
//! This provides a consistent interface for the orchestrator.

use shared::types::ids::ProjectId;
use shared::types::signal::SignalKind;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

/// Output from an Expert's analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpertOutput {
    /// The expert's identifier (e.g., "guardian", "psych")
    pub expert_id: String,

    /// Confidence in the analysis (0.0 - 1.0)
    pub confidence: f32,

    /// Structured findings (expert-specific)
    pub findings: serde_json::Value,

    /// Suggested actions or context additions
    pub suggestions: Vec<String>,

    /// Whether this output should be included in CAG context
    pub include_in_context: bool,
}

/// Capability flags for experts
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct ExpertCapabilities {
    /// Can process reflex-tier signals
    pub handles_reflex: bool,

    /// Can process rumination-tier signals
    pub handles_rumination: bool,

    /// Can process archive-tier signals
    pub handles_archive: bool,

    /// Has its own model (vs using shared inference)
    pub has_model: bool,

    /// Can run in background (non-blocking)
    pub background_capable: bool,
}

impl Default for ExpertCapabilities {
    fn default() -> Self {
        Self {
            handles_reflex: false,
            handles_rumination: true,
            handles_archive: false,
            has_model: false,
            background_capable: true,
        }
    }
}

/// Contract for all sub-agents (experts)
#[async_trait]
pub trait Expert: Send + Sync {
    /// Unique identifier for this expert
    fn id(&self) -> &'static str;

    /// Human-readable name
    fn name(&self) -> &'static str;

    /// What this expert can handle
    fn capabilities(&self) -> ExpertCapabilities;

    /// Check if this expert should handle the given signal
    fn can_handle(&self, signal: &SignalKind) -> bool;

    /// Process a signal and produce output
    async fn analyze(
        &self,
        signal: &SignalKind,
        project_id: Option<&ProjectId>,
    ) -> anyhow::Result<ExpertOutput>;

    /// Initialize the expert (load models, connect to storage, etc.)
    async fn init(&mut self) -> anyhow::Result<()> {
        Ok(()) // Default: no-op
    }

    /// Shutdown the expert gracefully
    async fn shutdown(&mut self) -> anyhow::Result<()> {
        Ok(()) // Default: no-op
    }
}

/// Registry for all available experts
pub struct ExpertRegistry {
    experts: Vec<Box<dyn Expert>>,
}

impl ExpertRegistry {
    pub fn new() -> Self {
        Self { experts: Vec::new() }
    }

    pub fn register(&mut self, expert: Box<dyn Expert>) {
        self.experts.push(expert);
    }

    /// Find experts that can handle the given signal
    pub fn find_handlers(&self, signal: &SignalKind) -> Vec<&dyn Expert> {
        self.experts
            .iter()
            .filter(|e| e.can_handle(signal))
            .map(|e| e.as_ref())
            .collect()
    }

    /// Get an expert by ID
    pub fn get(&self, id: &str) -> Option<&dyn Expert> {
        self.experts.iter().find(|e| e.id() == id).map(|e| e.as_ref())
    }

    /// Initialize all experts
    pub async fn init_all(&mut self) -> anyhow::Result<()> {
        for expert in &mut self.experts {
            expert.init().await?;
        }
        Ok(())
    }

    /// Shutdown all experts
    pub async fn shutdown_all(&mut self) -> anyhow::Result<()> {
        for expert in &mut self.experts {
            expert.shutdown().await?;
        }
        Ok(())
    }
}

impl Default for ExpertRegistry {
    fn default() -> Self {
        Self::new()
    }
}
