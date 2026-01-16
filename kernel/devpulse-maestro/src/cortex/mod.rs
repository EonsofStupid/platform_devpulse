pub mod kv_cache;
pub mod persistence;
pub mod reasoning;

#[path = "minions"]
pub mod minions;

pub struct Cortex {
    // Brain State
}

impl Cortex {
    pub fn new() -> Self {
        Self {}
    }
}
