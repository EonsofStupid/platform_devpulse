//! Supabase cloud credentials — OS keychain primary, no `.env`, no plaintext.
//!
//! Storage strategy mirrors `commands::credentials` (AI provider keys):
//!
//! - Keychain service name: `"devpulse"` (same as AI provider keys).
//! - Keychain entry name: `cloud_supabase_anon_key` (kebab-free, snake-case
//!   per the existing `api_key_<provider>` convention).
//! - Project URL is a deployment-stable constant — not a secret, not
//!   user-configurable per session, so it stays in this file. When the
//!   project changes Supabase instances, this constant updates.
//!
//! # Why anon_key is returned raw to the frontend
//!
//! Supabase publishes a separate **anon** key precisely so it can ship
//! to browser clients and the row-level-security policies on the
//! database enforce access. This is the supabase-js intended pattern.
//! The `project_secrets_keyring_ssot` lock ("frontend never sees raw
//! values") was written for AI provider API keys, which are secret.
//! The anon key isn't an analog of those — it's public-by-design. If
//! we ever need the **service_role** key (full-admin), THAT one stays
//! backend-only and never crosses the IPC boundary.

use crate::commands::_util::CommandError;
use serde::{Deserialize, Serialize};
use specta::Type;

/// Service name for every keyring entry. Matches `commands::credentials`
/// so all DevPulse-owned secrets live under one OS namespace.
const SERVICE_NAME: &str = "devpulse";

/// Keychain entry name for the Supabase anon key.
const KEYRING_KEY_ANON: &str = "cloud_supabase_anon_key";

/// Deployment-stable project URL. Updates when the project changes
/// Supabase instances — there is no per-user variant. This URL is NOT
/// a secret; it's printed in the project manifest and any browser that
/// hits the API.
const SUPABASE_PROJECT_URL: &str = "https://dcmgooupmorhqjbdaxtm.supabase.co";

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
    /// The public anon key from the Supabase dashboard. `None` when
    /// not yet stored in the keychain.
    pub anon_key: Option<String>,
}

/// Frontend-safe status used by the Cloud settings devtool — exposes
/// whether the key is stored plus a masked preview, never the raw value.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SupabaseCredentialsStatus {
    /// HTTPS API URL — same shape as `SupabaseCredentials::url`.
    pub url: String,
    /// `true` when an anon key is in the OS keychain.
    pub anon_key_stored: bool,
    /// First-8-chars-then-mask preview, e.g. `eyJhbGci...****`. `None`
    /// when no key is stored.
    pub anon_key_preview: Option<String>,
}

/// Load the Supabase credentials envelope.
///
/// Reads the anon key from the OS keychain. URL is the deployment
/// constant. Frontend instantiates `supabase-js` from the returned
/// envelope when `anon_key` is `Some`.
///
/// # Errors
/// Keychain access failure (other than `NoEntry`, which returns
/// `anon_key: None`).
#[tauri::command]
#[specta::specta]
pub async fn get_supabase_credentials() -> Result<SupabaseCredentials, CommandError> {
    let entry = keyring::Entry::new(SERVICE_NAME, KEYRING_KEY_ANON)
        .map_err(|e| CommandError::internal(format!("Keyring entry construction failed: {e}")))?;
    let anon_key = match entry.get_password() {
        Ok(key) => Some(key),
        Err(keyring::Error::NoEntry) => None,
        Err(e) => {
            return Err(CommandError::permission_denied(format!(
                "Keyring read failed: {e}"
            )));
        }
    };
    Ok(SupabaseCredentials {
        url: SUPABASE_PROJECT_URL.to_string(),
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

/// Frontend-safe status check — never returns the raw key. Used by the
/// Cloud settings devtool to render "key stored" / "no key set" without
/// pulling the value into the JS heap.
///
/// # Errors
/// Keychain read failure (other than `NoEntry`).
#[tauri::command]
#[specta::specta]
pub async fn get_supabase_credentials_status() -> Result<SupabaseCredentialsStatus, CommandError> {
    let entry = keyring::Entry::new(SERVICE_NAME, KEYRING_KEY_ANON)
        .map_err(|e| CommandError::internal(format!("Keyring entry construction failed: {e}")))?;
    let (anon_key_stored, anon_key_preview) = match entry.get_password() {
        Ok(key) => (true, Some(mask_preview(&key))),
        Err(keyring::Error::NoEntry) => (false, None),
        Err(e) => {
            return Err(CommandError::permission_denied(format!(
                "Keyring read failed: {e}"
            )));
        }
    };
    Ok(SupabaseCredentialsStatus {
        url: SUPABASE_PROJECT_URL.to_string(),
        anon_key_stored,
        anon_key_preview,
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

    #[test]
    fn supabase_project_url_is_https() {
        assert!(SUPABASE_PROJECT_URL.starts_with("https://"));
    }
}
