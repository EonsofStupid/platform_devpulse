//! Config persistence trait — consumers implement to wire their own storage.

/// How the Model Loader persists slot assignments and preferences.
///
/// `DevPulse` implements this with libSQL. Other apps use whatever they want.
/// The Model Loader never touches a database directly.
pub trait ConfigBackend: Send + Sync {
    /// Get a config value by key. Returns `None` if key doesn't exist.
    ///
    /// # Errors
    /// Returns error if the underlying store cannot be read (lock poisoned,
    /// libSQL query failure, IO error on the persistence layer).
    fn get(&self, key: &str) -> anyhow::Result<Option<String>>;

    /// Set a config value. Creates or overwrites.
    ///
    /// # Errors
    /// Returns error if the underlying store cannot be written (lock
    /// poisoned, libSQL write failure, disk full, IO error).
    fn set(&self, key: &str, value: &str) -> anyhow::Result<()>;

    /// Delete a config key.
    ///
    /// # Errors
    /// Returns error if the underlying store cannot be written (lock
    /// poisoned, libSQL delete failure, IO error).
    fn delete(&self, key: &str) -> anyhow::Result<()>;

    /// List all key-value pairs where the key starts with `prefix`.
    ///
    /// # Errors
    /// Returns error if the underlying store cannot be read (lock poisoned,
    /// libSQL query failure, IO error).
    fn list_by_prefix(&self, prefix: &str) -> anyhow::Result<Vec<(String, String)>>;
}

/// In-memory config backend for testing.
#[derive(Debug, Default)]
pub struct MemoryConfig {
    store: std::sync::Mutex<std::collections::HashMap<String, String>>,
}

impl MemoryConfig {
    /// Create an empty in-memory config store.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }
}

impl ConfigBackend for MemoryConfig {
    fn get(&self, key: &str) -> anyhow::Result<Option<String>> {
        let store = self.store.lock().map_err(|e| anyhow::anyhow!("{e}"))?;
        Ok(store.get(key).cloned())
    }

    fn set(&self, key: &str, value: &str) -> anyhow::Result<()> {
        let mut store = self.store.lock().map_err(|e| anyhow::anyhow!("{e}"))?;
        store.insert(key.to_string(), value.to_string());
        Ok(())
    }

    fn delete(&self, key: &str) -> anyhow::Result<()> {
        let mut store = self.store.lock().map_err(|e| anyhow::anyhow!("{e}"))?;
        store.remove(key);
        Ok(())
    }

    fn list_by_prefix(&self, prefix: &str) -> anyhow::Result<Vec<(String, String)>> {
        let store = self.store.lock().map_err(|e| anyhow::anyhow!("{e}"))?;
        Ok(store
            .iter()
            .filter(|(k, _)| k.starts_with(prefix))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect())
    }
}
