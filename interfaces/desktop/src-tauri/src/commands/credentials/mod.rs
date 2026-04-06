//! Credential management using platform-native keychain.
//!
//! - Windows: Credential Manager
//! - macOS: Keychain
//! - Linux: Secret Service
//!
//! API keys NEVER touch the filesystem. NEVER appear in config files.
//! The `keyring` crate uses `libloading` to access the platform credential
//! store at runtime. If the store is unavailable, errors surface directly.

use serde::{Deserialize, Serialize};
use specta::Type;

const SERVICE_NAME: &str = "devpulse";

/// Supported API providers for voice escalation.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum ApiProvider {
    Anthropic,
    OpenAI,
}

impl ApiProvider {
    fn keyring_key(&self) -> String {
        match self {
            ApiProvider::Anthropic => "api_key_anthropic".to_string(),
            ApiProvider::OpenAI => "api_key_openai".to_string(),
        }
    }

    fn display_name(&self) -> &str {
        match self {
            ApiProvider::Anthropic => "Anthropic",
            ApiProvider::OpenAI => "OpenAI",
        }
    }
}

/// Status of a stored API key (NEVER returns the actual key to frontend).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ApiKeyStatus {
    /// Provider display name.
    pub provider: String,
    /// Whether a key is stored for this provider.
    pub stored: bool,
    /// Masked preview for display (e.g. "sk-ant-a3...****"). None if not stored.
    pub masked_preview: Option<String>,
}

/// Store an API key in the platform keychain.
#[tauri::command]
#[specta::specta]
pub async fn store_api_key(provider: ApiProvider, key: String) -> Result<(), String> {
    let entry = keyring::Entry::new(SERVICE_NAME, &provider.keyring_key())
        .map_err(|e| format!("Failed to create keyring entry: {e}"))?;
    entry
        .set_password(&key)
        .map_err(|e| format!("Failed to store API key for {}: {e}", provider.display_name()))?;
    tracing::info!(provider = provider.display_name(), "API key stored in keychain");
    Ok(())
}

/// Retrieve an API key from the platform keychain.
/// Returns the actual key — used by backend services for escalation, NOT sent to frontend display.
#[tauri::command]
#[specta::specta]
pub async fn get_api_key(provider: ApiProvider) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(SERVICE_NAME, &provider.keyring_key())
        .map_err(|e| format!("Failed to access keyring: {e}"))?;
    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!(
            "Failed to retrieve API key for {}: {e}",
            provider.display_name()
        )),
    }
}

/// Delete an API key from the platform keychain.
#[tauri::command]
#[specta::specta]
pub async fn delete_api_key(provider: ApiProvider) -> Result<(), String> {
    let entry = keyring::Entry::new(SERVICE_NAME, &provider.keyring_key())
        .map_err(|e| format!("Failed to access keyring: {e}"))?;
    match entry.delete_credential() {
        Ok(()) => {
            tracing::info!(provider = provider.display_name(), "API key deleted from keychain");
            Ok(())
        }
        Err(keyring::Error::NoEntry) => Ok(()), // already gone, not an error
        Err(e) => Err(format!(
            "Failed to delete API key for {}: {e}",
            provider.display_name()
        )),
    }
}

/// Check which API keys are stored (without returning the keys themselves).
/// Safe for frontend display — only shows masked previews.
#[tauri::command]
#[specta::specta]
pub async fn get_api_key_status() -> Result<Vec<ApiKeyStatus>, String> {
    let providers = [
        ("Anthropic", ApiProvider::Anthropic),
        ("OpenAI", ApiProvider::OpenAI),
    ];

    let mut statuses = Vec::new();
    for (name, provider) in &providers {
        let entry = keyring::Entry::new(SERVICE_NAME, &provider.keyring_key())
            .map_err(|e| format!("Keyring error for {name}: {e}"))?;
        let (stored, masked) = match entry.get_password() {
            Ok(key) => {
                let preview = if key.len() > 8 {
                    format!("{}...****", &key[..8])
                } else {
                    "****".to_string()
                };
                (true, Some(preview))
            }
            Err(keyring::Error::NoEntry) => (false, None),
            Err(e) => return Err(format!("Keyring error for {name}: {e}")),
        };
        statuses.push(ApiKeyStatus {
            provider: name.to_string(),
            stored,
            masked_preview: masked,
        });
    }

    Ok(statuses)
}
