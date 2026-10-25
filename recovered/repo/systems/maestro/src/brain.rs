use devpulse_engine::processor::SignalProcessor;
use devpulse_core::types::signal::{SignalKind, ProprietarySignal};
use std::sync::Arc;
use anyhow::Result;
use crate::governance::GovernanceEngine;
use crate::lanes::LaneManager;

pub struct MaestroBrain {
    // Reference to the Nervous System to listen
    processor: Arc<SignalProcessor>,
    governance: GovernanceEngine,
    lanes: LaneManager,
}

impl MaestroBrain {
    pub fn new(processor: Arc<SignalProcessor>) -> Self {
        Self {
            processor,
            governance: GovernanceEngine::new(),
            lanes: LaneManager::new(),
        }
    }

    pub async fn run(&self) -> Result<()> {
        let mut rx = self.processor.subscribe();
        while let Ok(signal) = rx.recv().await {
            if let SignalKind::Proprietary(prop) = signal.kind {
                self.handle_proprietary(prop).await?;
            }
        }
        Ok(())
    }
    
    async fn handle_proprietary(&self, signal: ProprietarySignal) -> Result<()> {
        match signal {
            ProprietarySignal::Governance(g) => self.governance.assess(g).await,
            ProprietarySignal::Lane(l) => self.lanes.advance(l).await,
            _ => {
                tracing::debug!("Unhandled proprietary signal");
                Ok(())
            },
        }
    }
}
