use crate::cortex::traits::memory::MemoryBank;

pub struct SurrealAdapter;

impl MemoryBank for SurrealAdapter {
    fn store(&self, _key: &str, _value: Vec<u8>) -> Result<(), String> {
        Ok(()) // Stub
    }
    fn retrieve(&self, _key: &str) -> Result<Vec<u8>, String> {
        Ok(vec![]) // Stub
    }
}
