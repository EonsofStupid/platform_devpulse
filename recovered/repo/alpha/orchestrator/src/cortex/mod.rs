// orchestrator/src/cortex/mod.rs

//! Cortex - The thinking center
//!
//! - Router: Signal routing via SignalKind::profile()
//! - Rumination: Multi-hop execution (4-15 hops)
//! - COSTAR: Context assembly before each hop
//! - CAG: Context Assembly Graph (embed -> search -> rerank)

mod cag;
mod costar;
mod router;
mod rumination;

pub use cag::{AssembledContext, AssemblyConfig, CAG, ContextChunk};
pub use costar::CostarBuilder;
pub use router::Router;
pub use rumination::{Direction, HopOutput, MissionPlan, Rumination};
