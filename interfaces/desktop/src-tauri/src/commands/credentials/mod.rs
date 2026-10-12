//! Credential management — OS keychain primary, Turso hint mirror.
//!
//! Storage strategy:
//! - Keychain holds the actual API key. Per OS:
//!   - Windows: Credential Manager
//!   - macOS:   Keychain
//!   - Linux:   Secret Service
//! - Turso `api_keys` table holds a masked hint + last-used timestamp
//!   so the engine + devtool can show "key configured" without paying
//!   the keychain round-trip.
//!
//! API keys NEVER touch the filesystem in plaintext. They NEVER appear
//! in config files. They never cross the IPC boundary back to the
//! frontend — only `ApiKeyStatus` (presence + masked preview) does.
//!
//! Provider list is driven by the SSOT registry
//! (`devpulse_engine::ai_providers`). Adding a new provider that bills
//! per-token or has an OAI-compatible API key automatically appears here
//! — no edits required in this file.

use crate::commands::_util::CommandError;
use crate::state::PlatformState;
use devpulse_engine::ai_providers::{self, BillingModel, ProviderId, Transport};
use devpulse_engine::platform::SqlAdapter;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// Service name used for every keyring entry — namespaces our keys
/// inside the OS credential store so they don't collide with other
/// apps that might use a generic key name like `api_key_openai`.
const SERVICE_NAME: &str = "devpulse";

/// Stored-key status for a single provider — what the devtool renders.
///
/// Never includes the actual key. The masked preview is built from the
/// first 8 characters so common prefixes (`sk-`, `sk-ant-`, `gsk_`) are
/// recognizable without revealing entropy.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyStatus {
    /// Stable wire id from the SSOT registry.
    pub provider: ProviderId,
    /// Vendor display name from the SSOT registry — copied here so the
    /// frontend can render a row without a second registry lookup.
    pub display_name: String,
    /// `true` when a key is in the OS keychain.
    pub stored: bool,
    /// First-8-char-and-mask preview, e.g. `sk-ant-a...****`. `None`
    /// when no key is stored.
    pub masked_preview: Option<String>,
}

/// Store an API key in the OS keychain and mirror a masked hint to Turso.
///
/// Idempotent — re-storing for the same provider overwrites both halves.
/// The Turso mirror is best-effort; failure there logs a warning but
/// does not roll back the keychain write (keychain is the source of truth).
///
/// # Errors
/// - Provider has no API-key transport (e.g. local Ollama, subscription path).
/// - Keychain write failed.
#[tauri::command]
#[specta::specta]
pub async fn store_api_key(
    state: State<'_, PlatformState>,
    provider: ProviderId,
    key: String,
) -> Result<(), CommandError> {
    let entry = registry_entry(provider)?;
    require_api_key_billing(entry)?;

    let keyring_key = keyring_key_for(provider);
    let keyring_entry = keyring::Entry::new(SERVICE_NAME, &keyring_key)
        .map_err(|e| CommandError::internal(format!("Keyring entry construction failed: {e}")))?;
    keyring_entry.set_password(&key).map_err(|e| {
        CommandError::permission_denied(format!(
            "Failed to store key for {}: {e}",
            entry.display_name
        ))
    })?;
    tracing::info!(
        provider = ?provider,
        display = %entry.display_name,
        "API key stored in OS keychain"
    );

    mirror_hint_to_database(state, provider, &key).await;
    Ok(())
}

/// Retrieve an API key from the OS keychain.
///
/// Backend-only consumer — never call this and pass the result to the
/// frontend. Provider clients (Anthropic / `OpenAI` / etc) call this to
/// load a key right before issuing a request.
///
/// Returns `Ok(None)` when the key has never been stored.
///
/// # Errors
/// Keychain access failure.
#[tauri::command]
#[specta::specta]
pub async fn get_api_key(provider: ProviderId) -> Result<Option<String>, CommandError> {
    let _entry = registry_entry(provider)?;
    let keyring_key = keyring_key_for(provider);
    let keyring_entry = keyring::Entry::new(SERVICE_NAME, &keyring_key)
        .map_err(|e| CommandError::internal(format!("Keyring entry construction failed: {e}")))?;
    match keyring_entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(CommandError::permission_denied(format!(
            "Keyring read failed: {e}"
        ))),
    }
}

/// Delete an API key from the OS keychain and the Turso mirror.
///
/// Idempotent — deleting a non-existent key is success.
///
/// # Errors
/// Keychain delete failure (other than `NoEntry`).
#[tauri::command]
#[specta::specta]
pub async fn delete_api_key(
    state: State<'_, PlatformState>,
    provider: ProviderId,
) -> Result<(), CommandError> {
    let entry = registry_entry(provider)?;
    let keyring_key = keyring_key_for(provider);
    let keyring_entry = keyring::Entry::new(SERVICE_NAME, &keyring_key)
        .map_err(|e| CommandError::internal(format!("Keyring entry construction failed: {e}")))?;
    match keyring_entry.delete_credential() {
        Ok(()) => tracing::info!(
            provider = ?provider,
            display = %entry.display_name,
            "API key deleted from OS keychain"
        ),
        Err(keyring::Error::NoEntry) => {}
        Err(e) => {
            return Err(CommandError::permission_denied(format!(
                "Failed to delete key for {}: {e}",
                entry.display_name
            )));
        }
    }

    delete_hint_from_database(state, provider).await;
    Ok(())
}

/// Status snapshot for every provider in the registry that takes an API key.
///
/// Skips local-only providers (Ollama, LM Studio, vLLM) and the subscription
/// path — they don't have API keys, so showing them with `stored: false`
/// would just confuse the operator.
///
/// # Errors
/// Returns [`CommandError`] when keychain access fails while probing
/// stored keys for any visible provider that takes an API key.
#[tauri::command]
#[specta::specta]
pub async fn get_api_key_status() -> Result<Vec<ApiKeyStatus>, CommandError> {
    let mut out = Vec::new();
    for provider in ai_providers::visible() {
        if !provider_takes_api_key(provider) {
            continue;
        }
        let keyring_key = keyring_key_for(provider.id);
        let keyring_entry = keyring::Entry::new(SERVICE_NAME, &keyring_key).map_err(|e| {
            CommandError::internal(format!("Keyring entry construction failed: {e}"))
        })?;
        let (stored, masked_preview) = match keyring_entry.get_password() {
            Ok(key) => (true, Some(mask_preview(&key))),
            Err(keyring::Error::NoEntry) => (false, None),
            Err(e) => {
                return Err(CommandError::permission_denied(format!(
                    "Keyring read failed for {:?}: {e}",
                    provider.id
                )));
            }
        };
        out.push(ApiKeyStatus {
            provider: provider.id,
            display_name: provider.display_name.to_string(),
            stored,
            masked_preview,
        });
    }
    Ok(out)
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/// Look up the SSOT entry for a provider id.
fn registry_entry(id: ProviderId) -> Result<&'static ai_providers::AiProvider, CommandError> {
    ai_providers::find(id)
        .ok_or_else(|| CommandError::not_configured(format!("Unknown provider: {id:?}")))
}

/// Reject providers that don't take an API key (local servers, subscription path).
fn require_api_key_billing(entry: &ai_providers::AiProvider) -> Result<(), CommandError> {
    if matches!(entry.billing, BillingModel::PerToken)
        && entry.transports.iter().any(|t| {
            matches!(
                t,
                Transport::ApiKey { .. } | Transport::OpenAiCompatible { .. }
            )
        })
    {
        Ok(())
    } else {
        Err(CommandError::not_configured(format!(
            "Provider {} does not use an API key (billing: {:?})",
            entry.display_name, entry.billing
        )))
    }
}

/// Provider-aware predicate for `get_api_key_status` — returns `true` for
/// vendors that need a key. Local runtimes and the subscription path
/// return `false` so they don't show up as "API key missing".
fn provider_takes_api_key(p: &ai_providers::AiProvider) -> bool {
    matches!(p.billing, BillingModel::PerToken)
        && p.transports.iter().any(|t| {
            matches!(
                t,
                Transport::ApiKey { .. } | Transport::OpenAiCompatible { .. }
            )
        })
}

/// Build the keyring key name for a provider — `api_key_<id>` where
/// `<id>` is the provider's `serde(rename_all = "kebab-case")` form.
/// Stable across releases since `ProviderId` is the wire identifier.
fn keyring_key_for(id: ProviderId) -> String {
    let id_kebab = serde_json::to_string(&id)
        .ok()
        .and_then(|s| s.trim_matches('"').to_string().into())
        .unwrap_or_else(|| format!("{id:?}").to_lowercase());
    format!("api_key_{id_kebab}")
}

/// First-8-chars-then-mask preview, never revealing entropy.
fn mask_preview(key: &str) -> String {
    if key.len() > 8 {
        format!("{}...****", &key[..8])
    } else {
        "****".to_string()
    }
}

/// Mirror a masked hint into the Turso `api_keys` table. Best-effort —
/// failure logs a warning but does not propagate (keychain is the SSOT).
async fn mirror_hint_to_database(state: State<'_, PlatformState>, provider: ProviderId, key: &str) {
    let Some(platform) = state.platform.load_full() else {
        return;
    };
    let Some(svc) = platform.user_relational() else {
        return;
    };
    let adapter = svc.adapter();
    let profile = match crate::commands::devpulse::profile::ensure_profile(adapter.as_ref()).await {
        Ok(profile) => profile,
        Err(e) => {
            tracing::warn!(
                provider = ?provider,
                error = %format!("{e:#}"),
                "Failed to resolve the user profile for the API key hint (non-fatal — keychain is SSOT)"
            );
            return;
        }
    };
    let adapter_name = adapter_name_for(provider);
    let key_id = format!("key-{adapter_name}");
    let hint = mask_preview(key);
    if let Err(e) = adapter
        .execute(
            "INSERT OR REPLACE INTO api_keys (id, user_id, adapter, key_hint, last_used_at) VALUES (?, ?, ?, ?, datetime('now'))",
            &[key_id.as_str(), profile.id.as_str(), adapter_name.as_str(), hint.as_str()],
        )
        .await
    {
        tracing::warn!(
            provider = ?provider,
            error = %e,
            "Failed to mirror API key hint to Turso (non-fatal — keychain is SSOT)"
        );
    } else {
        tracing::info!(provider = ?provider, "API key hint mirrored to Turso");
    }
}

/// Delete the Turso mirror row. Best-effort, parallels `mirror_hint_to_database`.
async fn delete_hint_from_database(state: State<'_, PlatformState>, provider: ProviderId) {
    let Some(platform) = state.platform.load_full() else {
        return;
    };
    let Some(svc) = platform.user_relational() else {
        return;
    };
    let adapter = svc.adapter();
    let adapter_name = adapter_name_for(provider);
    if let Err(e) = adapter
        .execute(
            "DELETE FROM api_keys WHERE adapter = ?",
            &[adapter_name.as_str()],
        )
        .await
    {
        tracing::warn!(
            provider = ?provider,
            error = %e,
            "Failed to delete Turso hint (non-fatal)"
        );
    }
}

/// Adapter column value for the Turso `api_keys` table — same kebab
/// form as the keyring key, minus the `api_key_` prefix.
fn adapter_name_for(id: ProviderId) -> String {
    serde_json::to_string(&id).ok().map_or_else(
        || format!("{id:?}").to_lowercase(),
        |s| s.trim_matches('"').to_string(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keyring_key_uses_kebab_id() {
        assert_eq!(
            keyring_key_for(ProviderId::AnthropicApi),
            "api_key_anthropic-api"
        );
        assert_eq!(keyring_key_for(ProviderId::OpenAi), "api_key_open-ai");
        assert_eq!(
            keyring_key_for(ProviderId::HuggingFace),
            "api_key_hugging-face"
        );
    }

    #[test]
    fn mask_preview_keeps_eight_chars() {
        assert_eq!(mask_preview("sk-ant-api03-abcdef"), "sk-ant-a...****");
        assert_eq!(mask_preview("short"), "****");
    }

    #[test]
    fn local_runtimes_excluded_from_status_query() {
        let ollama = ai_providers::find(ProviderId::Ollama).unwrap();
        assert!(!provider_takes_api_key(ollama));
        let lm_studio = ai_providers::find(ProviderId::LmStudio).unwrap();
        assert!(!provider_takes_api_key(lm_studio));
    }

    #[test]
    fn subscription_path_excluded_from_status_query() {
        let sub = ai_providers::find(ProviderId::AnthropicSubscription).unwrap();
        assert!(!provider_takes_api_key(sub));
    }

    #[test]
    fn api_billed_providers_included() {
        for id in [
            ProviderId::AnthropicApi,
            ProviderId::OpenAi,
            ProviderId::GoogleGemini,
            ProviderId::Mistral,
            ProviderId::Cohere,
            ProviderId::Groq,
        ] {
            let p = ai_providers::find(id).unwrap();
            assert!(provider_takes_api_key(p), "{id:?} should take an API key");
        }
    }
}
