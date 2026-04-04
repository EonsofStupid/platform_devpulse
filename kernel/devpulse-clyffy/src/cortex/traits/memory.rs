/// The Memory Port (Contract)
pub trait MemoryBank {
    /// Persist a value under the given key.
    fn store(&self, key: &str, value: Vec<u8>) -> Result<(), String>;
    /// Retrieve the value stored under the given key.
    fn retrieve(&self, key: &str) -> Result<Vec<u8>, String>;
}
