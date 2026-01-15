pub mod signals;

use devpulse_maestro::Brain;

pub struct Engine {
    brain: Brain,
}

impl Engine {
    pub fn boot() -> Self {
        Self { brain: Brain::new() }
    }
}
