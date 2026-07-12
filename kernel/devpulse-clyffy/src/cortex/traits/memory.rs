/// The Memory Port (Contract)
pub trait MemoryBank {
    /// Persist a value under the given key.
    ///
    /// # Errors
    /// Returns an error if the backing store cannot persist the provided value.
    fn store(&self, key: &str, value: Vec<u8>) -> Result<(), String>;
    /// Retrieve the value stored under the given key.
    ///
    /// # Errors
    /// Returns an error if the backing store cannot read the stored value.
    fn retrieve(&self, key: &str) -> Result<Vec<u8>, String>;
}
