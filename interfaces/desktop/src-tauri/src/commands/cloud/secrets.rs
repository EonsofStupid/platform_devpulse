//! Supabase cloud credentials for the `DevPulse` account — from configuration,
//! with the OS keychain as an override; no `.env`, no plaintext secrets.
//!
//! - The project URL and the public anon key are configuration:
//!   `[integrations.cloud.auth]` in `config/platform/integrations/cloud.toml`,
//!   or in your `{data_dir}/platform.toml` (plan 0001 Account step A1;
//!   owner decision D2, 2026-10-23: the anon key ships with `DevPulse`).
//! - The keychain entry overrides the configured anon key, for a
//!   self-hosted project. Keychain service name: `"devpulse"` (same as AI
//!   provider keys); entry name: `cloud_supabase_anon_key` (snake-case per
//!   the existing `api_key_<provider>` convention).
//!
//! # Why `anon_key` is returned raw to the frontend
//!
//! Supabase publishes a separate **anon** key precisely so it can ship
//! to browser clients and the row-level-security policies on the
//! database enforce access. This is the supabase-js intended pattern.
//! The `project_secrets_keyring_ssot` lock ("frontend never sees raw
//! values") was written for AI provider API keys, which are secret.
//! The anon key isn't an analog of those — it's public-by-design. If
//! we ever need the **`service_role`** key (full-admin), THAT one stays
//! backend-only and never crosses the IPC boundary.

use crate::commands::_util::CommandError;
use devpulse_engine::platform::config::integrations::cloud::CloudAuthConfig;
use devpulse_engine::platform::config::PlatformBootConfig;
use serde::{Deserialize, Serialize};
use specta::Type;

/// Service name for every keyring entry. Matches `commands::credentials`
/// so all DevPulse-owned secrets live under one OS namespace.
const SERVICE_NAME: &str = "devpulse";

/// Keychain entry name for the Supabase anon key.
const KEYRING_KEY_ANON: &str = "cloud_supabase_anon_key";

/// Full Supabase client envelope returned to the frontend so it can
/// instantiate `supabase-js` with `createClient(url, anon_key)`.
///
/// `anon_key` is `None` when the operator hasn't run setup yet; the
/// auth shell renders the "Supabase isn't configured" empty state in
/// that case rather than crashing on a null key.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SupabaseCredentials {
    /// HTTPS API URL — feeds `createClient(url, ...)`.
    pub url: String,
    /// The public anon key: the keychain's override, else the configured
    /// key. `None` when neither is set, or no URL is configured.
    pub anon_key: Option<String>,
}

/// Frontend-safe status used by the Cloud settings devtool — exposes
/// whether the key is stored plus a masked preview, never the raw value.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SupabaseCredentialsStatus {
    /// HTTPS API URL — same shape as `SupabaseCredentials::url`.
    pub url: String,
    /// `true` when the configuration holds an anon key.
    pub anon_key_configured: bool,
    /// `true` when an anon key is in the OS keychain (it overrides the configured one).
    pub anon_key_stored: bool,
    /// First-8-chars-then-mask preview, e.g. `eyJhbGci...****`. `None`
    /// when no key is stored.
    pub anon_key_preview: Option<String>,
}

/// The configured auth endpoint (`[integrations.cloud.auth]`).
fn configured_auth(app: &tauri::AppHandle) -> Result<CloudAuthConfig, CommandError> {
    let data_dir = crate::paths::resolve_data_dir(app).map_err(CommandError::internal)?;
    let config = PlatformBootConfig::load(&data_dir)
        .map_err(|e| CommandError::internal(format!("Platform config unreadable: {e:#}")))?;
    Ok(config.integrations.cloud.auth)
}

/// The anon key stored in the OS keychain, if any.
fn keychain_anon_key() -> Result<Option<String>, CommandError> {
    let entry = keyring::Entry::new(SERVICE_NAME, KEYRING_KEY_ANON)
        .map_err(|e| CommandError::internal(format!("Keyring entry construction failed: {e}")))?;
    match entry.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(CommandError::permission_denied(format!(
            "Keyring read failed: {e}"
        ))),
    }
}

/// Load the Supabase credentials envelope.
///
/// The URL is the configured one; the anon key is the keychain's override,
/// else the configured key. Without a configured URL nothing can sign in, so
/// `anon_key` is `None`. Frontend instantiates `supabase-js` from the
/// returned envelope when `anon_key` is `Some`.
///
/// # Errors
/// Platform config unreadable, or keychain access failure (other than
/// `NoEntry`).
#[tauri::command]
#[specta::specta]
pub async fn get_supabase_credentials(
    app: tauri::AppHandle,
) -> Result<SupabaseCredentials, CommandError> {
    credentials_from(&configured_auth(&app)?)
}

/// The credentials an auth config gives: its URL, and the keychain's anon key
/// over the configured one. Commands holding the booted platform pass its
/// `boot_config().integrations.cloud.auth`.
///
/// # Errors
/// Keychain access failure (other than `NoEntry`).
pub(crate) fn credentials_from(
    auth: &CloudAuthConfig,
) -> Result<SupabaseCredentials, CommandError> {
    let Some(url) = auth.url() else {
        return Ok(SupabaseCredentials {
            url: String::new(),
            anon_key: None,
        });
    };
    let anon_key = keychain_anon_key()?.or_else(|| auth.anon_key().map(str::to_string));
    Ok(SupabaseCredentials {
        url: url.to_string(),
        anon_key,
    })
}

/// Store the Supabase anon key in the OS keychain.
///
/// Idempotent — re-storing overwrites. The key flows straight from the
/// settings devtool's "paste your anon key" input; no validation here
/// beyond reject-empty, since Supabase rejects bad keys at request time
/// with a clear error.
///
/// # Errors
/// - Empty key.
/// - Keychain write failed.
#[tauri::command]
#[specta::specta]
pub async fn set_supabase_anon_key(key: String) -> Result<(), CommandError> {
    let trimmed = key.trim();
    if trimmed.is_empty() {
        return Err(CommandError::not_configured(
            "Supabase anon key cannot be empty",
        ));
    }
    let entry = keyring::Entry::new(SERVICE_NAME, KEYRING_KEY_ANON)
        .map_err(|e| CommandError::internal(format!("Keyring entry construction failed: {e}")))?;
    entry.set_password(trimmed).map_err(|e| {
        CommandError::permission_denied(format!("Failed to store Supabase anon key: {e}"))
    })?;
    tracing::info!(
        masked = %mask_preview(trimmed),
        "Supabase anon key stored in OS keychain"
    );
    Ok(())
}

/// Remove the Supabase anon key from the OS keychain.
///
/// Idempotent — deleting a non-existent key is success.
///
/// # Errors
/// Keychain delete failure (other than `NoEntry`).
#[tauri::command]
#[specta::specta]
pub async fn clear_supabase_anon_key() -> Result<(), CommandError> {
    let entry = keyring::Entry::new(SERVICE_NAME, KEYRING_KEY_ANON)
        .map_err(|e| CommandError::internal(format!("Keyring entry construction failed: {e}")))?;
    match entry.delete_credential() {
        Ok(()) => tracing::info!("Supabase anon key removed from OS keychain"),
        Err(keyring::Error::NoEntry) => {}
        Err(e) => {
            return Err(CommandError::permission_denied(format!(
                "Failed to delete Supabase anon key: {e}"
            )));
        }
    }
    Ok(())
}

/// Frontend-safe status check — never returns the raw key: whether the
/// configuration holds one, whether the keychain overrides it, and a masked
/// preview of the keychain's.
///
/// # Errors
/// Platform config unreadable, or keychain read failure (other than
/// `NoEntry`).
#[tauri::command]
#[specta::specta]
pub async fn get_supabase_credentials_status(
    app: tauri::AppHandle,
) -> Result<SupabaseCredentialsStatus, CommandError> {
    let auth = configured_auth(&app)?;
    let stored = keychain_anon_key()?;
    Ok(SupabaseCredentialsStatus {
        url: auth.url().unwrap_or_default().to_string(),
        anon_key_configured: auth.anon_key().is_some(),
        anon_key_stored: stored.is_some(),
        anon_key_preview: stored.as_deref().map(mask_preview),
    })
}

/// First-8-chars-then-mask preview, matching the AI-provider key
/// preview format used by `commands::credentials::mask_preview`. Kept
/// private so the two never drift.
fn mask_preview(key: &str) -> String {
    if key.len() > 8 {
        format!("{}...****", &key[..8])
    } else {
        "****".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mask_preview_keeps_eight_chars() {
        assert_eq!(mask_preview("eyJhbGciOiJIUzI1NiJ9"), "eyJhbGci...****");
        assert_eq!(mask_preview("short"), "****");
    }

    #[test]
    fn mask_preview_handles_exactly_eight() {
        assert_eq!(mask_preview("12345678"), "****");
    }
}
