// orchestrator/src/cortex/rumination.rs

//! Rumination - Multi-hop execution engine
//!
//! Executes 4-15 hops per signal. Each hop:
//! 1. Assembles context via CAG (COSTAR+)
//! 2. Spawns an ephemeral Frame
//! 3. Runs inference with GBNF constraints
//! 4. Gets 1-5 Directions (Drill/Pivot/Verify/Synthesize/Abort)
//! 5. Kills the Frame
//! 6. Conscience verifies (Agent can't mark itself done)

use shared::types::ids::{HopId, SessionId};
use crate::types::Toon;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

/// Direction from a hop (what to do next)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Direction {
    /// Go deeper on current topic
    Drill { focus: String },
    /// Change approach/angle
    Pivot { new_angle: String },
    /// Verify a claim or assumption
    Verify { claim: String },
    /// Combine findings into conclusion
    Synthesize { findings: Vec<String> },
    /// Stop rumination (done or stuck)
    Abort { reason: String },
}

/// Output from a single hop
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HopOutput {
    pub hop_id: HopId,
    pub hop_number: u8,
    pub directions: Vec<Direction>, // 1-5 directions
    pub context_used: Vec<String>,  // What context was pulled
    pub frame_id: String,           // Which persona was used
    pub confidence: f32,
}

/// Mission plan - GBNF-enforced output structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MissionPlan {
    pub objective: String,
    pub approach: String,
    pub steps: Vec<String>,
    pub success_criteria: Vec<String>,
    pub abort_conditions: Vec<String>,
}

/// Rumination engine - executes multi-hop chains
pub struct Rumination {
    /// Minimum hops before allowing completion
    min_hops: u8,
    /// Maximum hops before forced termination
    max_hops: u8,
    /// Channel to receive toons for rumination
    rx: mpsc::Receiver<Toon>,
}

impl Rumination {
    pub fn new(rx: mpsc::Receiver<Toon>) -> Self {
        Self {
            min_hops: 4,
            max_hops: 15,
            rx,
        }
    }

    /// Run the rumination loop
    pub async fn run(&mut self) -> anyhow::Result<()> {
        while let Some(toon) = self.rx.recv().await {
            if let Err(e) = self.process(toon).await {
                tracing::error!("Rumination error: {}", e);
            }
        }
        Ok(())
    }

    /// Process a single toon through rumination
    async fn process(&self, toon: Toon) -> anyhow::Result<()> {
        let session_id = toon.session_id.clone().unwrap_or_default();
        let mut current_toon = toon;
        let mut hop_count = 0u8;
        let mut outputs: Vec<HopOutput> = Vec::new();

        loop {
            hop_count += 1;

            // Execute a single hop
            let output = self.execute_hop(&current_toon, hop_count).await?;

            // Check for abort
            let should_abort = output.directions.iter().any(|d| matches!(d, Direction::Abort { .. }));
            let should_synthesize = output.directions.iter().any(|d| matches!(d, Direction::Synthesize { .. }));

            outputs.push(output.clone());

            // Termination conditions
            if should_abort {
                tracing::info!("Rumination aborted at hop {}", hop_count);
                break;
            }

            if should_synthesize && hop_count >= self.min_hops {
                tracing::info!("Rumination synthesized at hop {}", hop_count);
                break;
            }

            if hop_count >= self.max_hops {
                tracing::warn!("Rumination hit max hops ({})", self.max_hops);
                break;
            }

            // Spawn child toon for next hop
            // TODO: Select next direction and create appropriate signal
            current_toon = current_toon.spawn_child(current_toon.signal.clone());
        }

        // Conscience verification (separate actor)
        self.verify_with_conscience(&session_id, &outputs).await?;

        Ok(())
    }

    /// Execute a single hop
    async fn execute_hop(&self, _toon: &Toon, hop_number: u8) -> anyhow::Result<HopOutput> {
        // 1. Assemble context via CAG (COSTAR+)
        // TODO: Call CostarBuilder

        // 2. Spawn ephemeral Frame
        // TODO: Call FrameManager::spawn()

        // 3. Run inference with GBNF constraints
        // TODO: Call LLM with grammar

        // 4. Parse directions from output
        // TODO: Parse GBNF-constrained output

        // 5. Kill the Frame
        // TODO: Call FrameManager::kill()

        // For now, return stub
        Ok(HopOutput {
            hop_id: HopId::new(),
            hop_number,
            directions: vec![Direction::Synthesize {
                findings: vec!["stub".to_string()],
            }],
            context_used: vec![],
            frame_id: "stub-frame".to_string(),
            confidence: 0.5,
        })
    }

    /// Conscience verification - Agent can't mark itself done
    async fn verify_with_conscience(
        &self,
        _session_id: &SessionId,
        _outputs: &[HopOutput],
    ) -> anyhow::Result<()> {
        // TODO: Implement Conscience actor
        // The agent that did the work cannot verify completion
        // A separate Conscience actor must approve
        Ok(())
    }
}
