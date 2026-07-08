use crate::connectome::adapters::surreal::SurrealAdapter;
use crate::connectome::adapters::hmm::HmmAdapter;
use crate::connectome::traits::memory::MemoryBank;
use crate::connectome::traits::reasoning::ReasoningEngine;

pub struct ConnectomeWiring {
    pub memory: Box<dyn MemoryBank>,
    pub reasoning: Box<dyn ReasoningEngine>,
}

impl ConnectomeWiring {
    pub fn new() -> Self {
        Self {
            memory: Box::new(SurrealAdapter),
            reasoning: Box::new(HmmAdapter),
        }
    }
}
