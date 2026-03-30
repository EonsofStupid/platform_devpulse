/// The Memory Port (Contract)
pub trait MemoryBank {
    fn store(&self, key: &str, value: Vec<u8>) -> Result<(), String>;
    fn retrieve(&self, key: &str) -> Result<Vec<u8>, String>;
}
