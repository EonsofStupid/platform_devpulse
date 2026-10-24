use crate::cortex::adapters::surreal::SurrealAdapter;
use crate::cortex::adapters::hmm::HmmAdapter;
use crate::cortex::traits::memory::MemoryBank;
use crate::cortex::traits::reasoning::ReasoningEngine;

pub struct CortexWiring {
    pub memory: Box<dyn MemoryBank>,
    pub reasoning: Box<dyn ReasoningEngine>,
}

impl CortexWiring {
    pub fn new() -> Self {
        Self {
            memory: Box::new(SurrealAdapter),
            reasoning: Box::new(HmmAdapter),
        }
    }
}
