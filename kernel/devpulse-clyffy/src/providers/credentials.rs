//! AI credentials: native secure storage, opaque references, never frontend secrets.

use anyhow::{Context, Result, bail};
use async_trait::async_trait;

use super::ProviderId;

const SERVICE: &str = "devpulse";

/// The existing provider-wide credential identity. Connection identities are separate.
#[must_use]
pub fn provider_reference(provider: ProviderId) -> String {
    format!("api_key_{}", provider.key())
}

/// A connection's private credential slot, independent of its label or server.
#[must_use]
pub fn connection_reference(id: &str) -> String {
    format!("ai_connection_{id}")
}

/// Secret storage can be substituted in tests without touching the operator's vault.
#[async_trait]
pub trait CredentialStore: Send + Sync {
    /// Resolve a reference in the backend only.
    async fn read(&self, reference: &str) -> Result<Option<String>>;
    /// Save a secret. No caller should log the argument.
    async fn write(&self, reference: &str, secret: String) -> Result<()>;
    /// Forget a secret; absence is already success.
    async fn remove(&self, reference: &str) -> Result<()>;
}

/// The operating system's persistent credential store.
pub struct NativeCredentials;

#[async_trait]
impl CredentialStore for NativeCredentials {
    async fn read(&self, reference: &str) -> Result<Option<String>> {
        let reference = reference.to_owned();
        devpulse_telemetry::spawn_blocking(move || {
            let entry =
                keyring::Entry::new(SERVICE, &reference).context("Open credential entry")?;
            match entry.get_password() {
                Ok(secret) => Ok(Some(secret)),
                Err(keyring::Error::NoEntry) => Ok(None),
                Err(error) => Err(error).context("Read credential store"),
            }
        })
        .await
        .context("Credential worker failed")?
    }

    async fn write(&self, reference: &str, secret: String) -> Result<()> {
        if secret.trim().is_empty() {
            bail!("API key cannot be empty");
        }
        let reference = reference.to_owned();
        devpulse_telemetry::spawn_blocking(move || {
            keyring::Entry::new(SERVICE, &reference)
                .context("Open credential entry")?
                .set_password(&secret)
                .context("Save credential")
        })
        .await
        .context("Credential worker failed")?
    }

    async fn remove(&self, reference: &str) -> Result<()> {
        let reference = reference.to_owned();
        devpulse_telemetry::spawn_blocking(move || {
            let entry =
                keyring::Entry::new(SERVICE, &reference).context("Open credential entry")?;
            match entry.delete_credential() {
                Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
                Err(error) => Err(error).context("Delete credential"),
            }
        })
        .await
        .context("Credential worker failed")?
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    #[test]
    fn references_keep_existing_keys_and_separate_connection_instances() {
        assert_eq!(provider_reference(ProviderId::OpenAi), "api_key_open-ai");
        assert_eq!(
            provider_reference(ProviderId::AnthropicApi),
            "api_key_anthropic-api"
        );
        assert_ne!(connection_reference("one"), connection_reference("two"));
    }

    #[test]
    fn native_backend_is_selected_without_accessing_the_vault() {
        // Construction only: no read, write or delete of any OS credential.
        let entry = keyring::Entry::new("devpulse-backend-type-test", "unused");
        // A Linux machine with no secret service has no store at all, and keyring 4
        // says so up front. Refusing is right: a key is never kept in a stand-in.
        #[cfg(target_os = "linux")]
        if matches!(entry, Err(keyring::Error::NoDefaultStore)) {
            return;
        }
        let _entry = entry.unwrap();
        let store = keyring_core::get_default_store().unwrap();
        assert!(!store.vendor().starts_with("Mock store"));
        assert!(matches!(
            store.persistence(),
            keyring_core::CredentialPersistence::UntilDelete
        ));
        #[cfg(target_os = "windows")]
        assert!(store.vendor().starts_with("Windows Credential Manager"));
    }
}
