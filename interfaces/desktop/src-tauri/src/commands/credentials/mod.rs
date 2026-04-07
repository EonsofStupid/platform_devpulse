//! Credential management using platform-native keychain + libSQL sync.
//!
//! - Windows: Credential Manager
//! - macOS: Keychain
//! - Linux: Secret Service
//!
//! API keys NEVER touch the filesystem. NEVER appear in config files.
//! The `keyring` crate uses `libloading` to access the platform credential
//! store at runtime. If the store is unavailable, errors surface directly.
//!
//! Dual persistence: keyring (primary, secure) + libSQL `api_keys` table
//! (secondary, for platform-level access by engine consumers like Council).

use crate::state::PlatformState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

const SERVICE_NAME: &str = "devpulse";

/// Supported API providers for voice escalation and Council routing.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum ApiProvider {
    /// Anthropic (Claude) API.
    Anthropic,
    /// OpenAI (GPT) API.
    OpenAI,
    /// Google (Gemini) API.
    Google,
}

impl ApiProvider {
    /// Keyring key name for this provider.
    fn keyring_key(&self) -> String {
        match self {
            ApiProvider::Anthropic => "api_key_anthropic".to_string(),
            ApiProvider::OpenAI => "api_key_openai".to_string(),
            ApiProvider::Google => "api_key_google".to_string(),
        }
    }

    /// Human-readable display name.
    fn display_name(&self) -> &str {
        match self {
            ApiProvider::Anthropic => "Anthropic",
            ApiProvider::OpenAI => "OpenAI",
            ApiProvider::Google => "Google",
        }
    }

    /// Adapter name for libSQL api_keys table.
    fn adapter_name(&self) -> &str {
        match self {
            ApiProvider::Anthropic => "anthropic",
            ApiProvider::OpenAI => "openai",
            ApiProvider::Google => "google",
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

/// Store an API key in the platform keychain AND sync to libSQL.
///
/// Keychain is the primary secure store. libSQL gets a masked hint
/// so the engine can check key availability without accessing the keychain.
#[tauri::command]
#[specta::specta]
pub async fn store_api_key(
    state: State<'_, PlatformState>,
    provider: ApiProvider,
    key: String,
) -> Result<(), String> {
    // 1. Store in OS keychain (primary, secure)
    let entry = keyring::Entry::new(SERVICE_NAME, &provider.keyring_key())
        .map_err(|e| format!("Failed to create keyring entry: {e}"))?;
    entry
        .set_password(&key)
        .map_err(|e| format!("Failed to store API key for {}: {e}", provider.display_name()))?;
    tracing::info!(provider = provider.display_name(), "API key stored in keychain");

    // 2. Sync hint to libSQL (secondary, for engine-level key availability checks)
    let hint = if key.len() > 8 {
        format!("{}...****", &key[..8])
    } else {
        "****".to_string()
    };

    let guard = state.platform.read().await;
    if let Some(platform) = guard.as_ref() {
        if let Some(svc) = platform.user_relational() {
            let adapter = svc.adapter();
            let adapter_name = provider.adapter_name().to_string();
            let hint_clone = hint.clone();
            if let Err(e) = adapter
                .execute(
                    "INSERT OR REPLACE INTO api_keys (id, user_id, adapter, key_hint, last_used_at) VALUES (?, 'user-1', ?, ?, datetime('now'))",
                    &[
                        devpulse_engine::platform::SqlValue::Text(format!("key-{adapter_name}")),
                        devpulse_engine::platform::SqlValue::Text(adapter_name.clone()),
                        devpulse_engine::platform::SqlValue::Text(hint_clone),
                    ],
                )
                .await
            {
                tracing::warn!(
                    provider = provider.display_name(),
                    error = %e,
                    "Failed to sync API key hint to libSQL (non-fatal)"
                );
            } else {
                tracing::info!(
                    provider = provider.display_name(),
                    "API key hint synced to libSQL"
                );
            }
        }
    }

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

/// Delete an API key from the platform keychain AND libSQL.
#[tauri::command]
#[specta::specta]
pub async fn delete_api_key(
    state: State<'_, PlatformState>,
    provider: ApiProvider,
) -> Result<(), String> {
    // 1. Delete from OS keychain
    let entry = keyring::Entry::new(SERVICE_NAME, &provider.keyring_key())
        .map_err(|e| format!("Failed to access keyring: {e}"))?;
    match entry.delete_credential() {
        Ok(()) => {
            tracing::info!(provider = provider.display_name(), "API key deleted from keychain");
        }
        Err(keyring::Error::NoEntry) => {} // already gone, not an error
        Err(e) => {
            return Err(format!(
                "Failed to delete API key for {}: {e}",
                provider.display_name()
            ));
        }
    }

    // 2. Delete from libSQL
    let guard = state.platform.read().await;
    if let Some(platform) = guard.as_ref() {
        if let Some(svc) = platform.user_relational() {
            let adapter = svc.adapter();
            let adapter_name = provider.adapter_name().to_string();
            if let Err(e) = adapter
                .execute(
                    "DELETE FROM api_keys WHERE adapter = ?",
                    &[devpulse_engine::platform::SqlValue::Text(adapter_name)],
                )
                .await
            {
                tracing::warn!(
                    provider = provider.display_name(),
                    error = %e,
                    "Failed to delete API key from libSQL (non-fatal)"
                );
            } else {
                tracing::info!(
                    provider = provider.display_name(),
                    "API key deleted from libSQL"
                );
            }
        }
    }

    Ok(())
}

/// Check which API keys are stored (without returning the keys themselves).
/// Safe for frontend display — only shows masked previews.
#[tauri::command]
#[specta::specta]
pub async fn get_api_key_status() -> Result<Vec<ApiKeyStatus>, String> {
    let providers = [
        ("Anthropic", ApiProvider::Anthropic),
        ("OpenAI", ApiProvider::OpenAI),
        ("Google", ApiProvider::Google),
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
