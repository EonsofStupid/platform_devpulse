// shared/src/vault/mod.rs

//! SecureVault - OS Keyring Integration
//!
//! Provides secure storage for API keys using the OS keyring:
//! - Windows: Credential Manager
//! - macOS: Keychain
//! - Linux: Secret Service (GNOME Keyring, KWallet)
//!
//! Keys are zeroized on drop for security.
//!
//! ## Usage
//! ```rust,ignore
//! let vault = SecureVault::new();
//! vault.store_key("anthropic", Zeroizing::new("sk-ant-...".into()))?;
//! let key = vault.get_key("anthropic")?;
//! ```

use thiserror::Error;
use zeroize::Zeroizing;

/// Vault errors
#[derive(Debug, Error)]
pub enum VaultError {
    #[error("Key not found for adapter: {0}")]
    NotFound(String),

    #[error("Failed to access keyring: {0}")]
    KeyringError(String),

    #[error("Invalid key format")]
    InvalidFormat,
}

/// Secure vault for API keys
///
/// Uses OS keyring for secure storage:
/// - Keys are never stored in plaintext files
/// - Automatically zeroized when dropped
/// - Thread-safe
pub struct SecureVault {
    service_name: &'static str,
}

impl SecureVault {
    /// Service name for keyring entries
    pub const SERVICE: &'static str = "devpulse";

    /// Create new vault instance
    pub fn new() -> Self {
        Self {
            service_name: Self::SERVICE,
        }
    }

    /// Store an API key securely
    ///
    /// The key is stored in the OS keyring under the adapter name.
    /// Previous key for the same adapter is overwritten.
    pub fn store_key(&self, adapter: &str, key: Zeroizing<String>) -> Result<(), VaultError> {
        let entry = keyring::Entry::new(self.service_name, adapter)
            .map_err(|e| VaultError::KeyringError(e.to_string()))?;

        entry
            .set_password(&key)
            .map_err(|e| VaultError::KeyringError(e.to_string()))?;

        tracing::info!(adapter = %adapter, "API key stored securely");
        Ok(())
    }

    /// Retrieve an API key
    ///
    /// Returns the key wrapped in Zeroizing for automatic cleanup.
    pub fn get_key(&self, adapter: &str) -> Result<Zeroizing<String>, VaultError> {
        let entry = keyring::Entry::new(self.service_name, adapter)
            .map_err(|e| VaultError::KeyringError(e.to_string()))?;

        let password = entry.get_password().map_err(|e| match e {
            keyring::Error::NoEntry => VaultError::NotFound(adapter.to_string()),
            _ => VaultError::KeyringError(e.to_string()),
        })?;

        Ok(Zeroizing::new(password))
    }

    /// Delete an API key
    pub fn delete_key(&self, adapter: &str) -> Result<(), VaultError> {
        let entry = keyring::Entry::new(self.service_name, adapter)
            .map_err(|e| VaultError::KeyringError(e.to_string()))?;

        entry.delete_credential().map_err(|e| match e {
            keyring::Error::NoEntry => VaultError::NotFound(adapter.to_string()),
            _ => VaultError::KeyringError(e.to_string()),
        })?;

        tracing::info!(adapter = %adapter, "API key deleted");
        Ok(())
    }

    /// Check if a key exists for a adapter
    pub fn has_key(&self, adapter: &str) -> bool {
        self.get_key(adapter).is_ok()
    }

    /// List adapters with stored keys
    ///
    /// Note: This checks known adapters, not all keyring entries.
    pub fn list_adapters(&self) -> Vec<Adapterstatus> {
        KNOWN_ADAPTERS
            .iter()
            .map(|&adapter| Adapterstatus {
                id: adapter.to_string(),
                has_key: self.has_key(adapter),
            })
            .collect()
    }
}

impl Default for SecureVault {
    fn default() -> Self {
        Self::new()
    }
}

/// Known API adapters
pub const KNOWN_ADAPTERS: &[&str] = &["anthropic", "openai", "ollama", "lmstudio", "huggingface"];

/// Adapter key status
#[derive(Debug, Clone, serde::Serialize)]
pub struct Adapterstatus {
    pub id: String,
    pub has_key: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: These tests require actual keyring access
    // Run with: cargo test --features vault-tests -- --ignored

    #[test]
    #[ignore = "requires keyring access"]
    fn test_store_and_retrieve() {
        let vault = SecureVault::new();
        let test_key = Zeroizing::new("test-key-12345".to_string());

        vault.store_key("test_adapter", test_key.clone()).unwrap();

        let retrieved = vault.get_key("test_adapter").unwrap();
        assert_eq!(*retrieved, *test_key);

        vault.delete_key("test_adapter").unwrap();
    }

    #[test]
    #[ignore = "requires keyring access"]
    fn test_key_not_found() {
        let vault = SecureVault::new();
        let result = vault.get_key("nonexistent_adapter");
        assert!(matches!(result, Err(VaultError::NotFound(_))));
    }

    #[test]
    fn test_list_adapters() {
        let vault = SecureVault::new();
        let adapters = vault.list_adapters();
        assert!(!adapters.is_empty());
        assert!(adapters.iter().any(|p| p.id == "anthropic"));
    }
}
