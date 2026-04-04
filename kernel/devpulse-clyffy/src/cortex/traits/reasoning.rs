/// The Reasoning Port (Contract)
pub trait ReasoningEngine {
    /// Process a raw stimulus and return the reasoning result.
    fn process(&self, stimulus: Vec<u8>) -> Result<Vec<u8>, String>;
}
