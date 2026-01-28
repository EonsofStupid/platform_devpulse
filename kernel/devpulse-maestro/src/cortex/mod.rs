pub mod kv_cache;
pub mod minions;
pub mod persistence;
pub mod reasoning;

#[derive(Default)]
pub struct Cortex {
    // Brain State
}

impl Cortex {
    pub fn new() -> Self {
        Self::default()
    }
}
