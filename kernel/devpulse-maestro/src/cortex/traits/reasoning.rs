/// The Reasoning Port (Contract)
pub trait ReasoningEngine {
    fn process(&self, stimulus: Vec<u8>) -> Result<Vec<u8>, String>;
}
