// orchestrator/src/sub_agents/guardian/mod.rs

//! GUARDIAN sub-agent
//!
//! Monitors codebase state:
//! - File watching
//! - Indexing
//! - Chunk embedding
//! - Policy enforcement

use async_trait::async_trait;
use crate::types::{Expert, ExpertCapabilities, ExpertOutput};
use shared::types::ids::ProjectId;
use shared::types::signal::SignalKind;

pub struct Guardian {
    // TODO: Add file watcher, indexer, etc.
}

impl Guardian {
    pub fn new() -> Self {
        Self {}
    }
}

impl Default for Guardian {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Expert for Guardian {
    fn id(&self) -> &'static str {
        "guardian"
    }

    fn name(&self) -> &'static str {
        "GUARDIAN"
    }

    fn capabilities(&self) -> ExpertCapabilities {
        ExpertCapabilities {
            handles_reflex: true,
            handles_rumination: true,
            handles_archive: true,
            has_model: false,
            background_capable: true,
        }
    }

    fn can_handle(&self, signal: &SignalKind) -> bool {
        matches!(
            signal,
            SignalKind::FileSaved { .. }
                | SignalKind::GitChange { .. }
                | SignalKind::CodeChunk { .. }
                | SignalKind::LargeFileChange { .. }
        )
    }

    async fn analyze(
        &self,
        signal: &SignalKind,
        _project_id: Option<&ProjectId>,
    ) -> anyhow::Result<ExpertOutput> {
        match signal {
            SignalKind::FileSaved { path } => {
                // TODO: Re-index the file
                Ok(ExpertOutput {
                    expert_id: self.id().to_string(),
                    confidence: 1.0,
                    findings: serde_json::json!({
                        "action": "file_indexed",
                        "path": path,
                    }),
                    suggestions: vec![],
                    include_in_context: false,
                })
            }
            SignalKind::GitChange { branch, status } => {
                Ok(ExpertOutput {
                    expert_id: self.id().to_string(),
                    confidence: 1.0,
                    findings: serde_json::json!({
                        "action": "git_status_updated",
                        "branch": branch,
                        "status": status,
                    }),
                    suggestions: vec![],
                    include_in_context: true,
                })
            }
            _ => {
                Ok(ExpertOutput {
                    expert_id: self.id().to_string(),
                    confidence: 0.5,
                    findings: serde_json::json!({}),
                    suggestions: vec![],
                    include_in_context: false,
                })
            }
        }
    }
}
