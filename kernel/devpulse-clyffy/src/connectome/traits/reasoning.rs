/// The Reasoning Port (Contract)
pub trait ReasoningEngine {
    /// Process a raw stimulus and return the reasoning result.
    ///
    /// # Errors
    /// Returns an error if the engine cannot process the supplied stimulus.
    fn process(&self, stimulus: Vec<u8>) -> Result<Vec<u8>, String>;
}
