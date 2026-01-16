pub mod signals;

use devpulse_maestro::Cortex;

pub struct Engine {
    cortex: Cortex,
}

impl Engine {
    pub fn boot() -> Self {
        Self { cortex: Cortex::new() }
    }

    pub fn start(&self) {
        // TODO: Initialize Cortex
        let _ = &self.cortex;
    }
}
