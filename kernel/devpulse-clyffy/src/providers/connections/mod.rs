//! Persistent, independently credentialed AI endpoint instances.
//! The engine owns service lifecycle; this module owns AI connection decisions.
mod store;
#[cfg(test)]
mod tests;
mod types;

use super::{
    adapters::{models, openai_compatible},
    credentials::{CredentialStore, connection_reference},
    registry,
    types::{AiProvider, Transport},
};
use crate::cortex::persistence::SqlAdapter;
use anyhow::{Context, Result, ensure};
use std::{collections::BTreeMap, sync::Arc};
use tokio::sync::Mutex;
pub use types::*;

#[derive(Default)]
struct Evidence {
    discovery: Option<ConnectionCheck>,
    text_test: Option<ConnectionTextTest>,
}

fn supports_text_test(provider: &AiProvider) -> bool {
    provider.capabilities.chat
        && provider
            .transports
            .iter()
            .any(|t| matches!(t, Transport::OpenAiCompatible { .. }))
}

/// Options from the existing registry; URLs are editable suggestions only.
#[must_use]
pub fn options() -> Vec<ConnectionOption> {
    registry::visible()
        .filter(|entry| entry.supports_api_key())
        .map(|entry| ConnectionOption {
            provider: entry.id,
            name: entry.display_name.to_owned(),
            supports_text_test: supports_text_test(entry),
            suggested_endpoint: entry
                .transports
                .iter()
                .find_map(|transport| match transport {
                    Transport::ApiKey { base_url } | Transport::OpenAiCompatible { base_url } => {
                        Some((*base_url).to_owned())
                    }
                    _ => None,
                })
                .unwrap_or_default(),
        })
        .collect()
}

/// One process-owned service. Serialize writes/checks so old evidence cannot
/// race an endpoint or key edit. Every restart begins with no operation evidence.
pub struct Connections {
    db: Arc<dyn SqlAdapter>,
    credentials: Arc<dyn CredentialStore>,
    checks: Mutex<BTreeMap<String, Evidence>>,
}

impl Connections {
    /// Bind the migrated user store and backend-only credential vault.
    pub fn new(db: Arc<dyn SqlAdapter>, credentials: Arc<dyn CredentialStore>) -> Self {
        Self {
            db,
            credentials,
            checks: Mutex::new(BTreeMap::new()),
        }
    }

    async fn view(
        &self,
        checks: &BTreeMap<String, Evidence>,
        problem: Option<String>,
    ) -> Result<ConnectionsState> {
        let items = store::list(self.db.as_ref())
            .await?
            .into_iter()
            .map(|record| SavedConnection {
                check: checks.get(&record.id).and_then(|e| e.discovery.clone()),
                text_test: checks.get(&record.id).and_then(|e| e.text_test.clone()),
                id: record.id,
                label: record.label,
                provider: record.provider,
                endpoint: record.endpoint,
                has_credential: record.credential_ref.is_some(),
            })
            .collect();
        Ok(ConnectionsState { items, problem })
    }

    /// Read saved configuration without contacting any endpoint or reading a key.
    /// # Errors
    /// Returns storage errors rather than inventing an empty successful state.
    pub async fn state(&self) -> Result<ConnectionsState> {
        let checks = self.checks.lock().await;
        self.view(&checks, None).await
    }

    async fn discard_key(&self, reference: Option<&str>) -> Option<String> {
        if let Some(reference) = reference
            && self.credentials.remove(reference).await.is_err()
        {
            return Some("The connection was updated, but an unused credential could not be removed from secure storage.".into());
        }
        None
    }

    /// Save a connection; edits invalidate operation evidence.
    /// # Errors
    /// Invalid configuration, vault failure or database failure leaves the prior
    /// configuration intact. A failed database write discards the replacement key.
    pub async fn save(&self, request: SaveConnection) -> Result<ConnectionsState> {
        let mut checks = self.checks.lock().await;
        let label = request.label.trim();
        ensure!(
            !label.is_empty() && label.chars().count() <= 120,
            "Use a connection name between 1 and 120 characters"
        );
        ensure!(
            registry::find(request.provider).is_some_and(AiProvider::supports_api_key),
            "Use the provider's own sign-in for a subscription connection"
        );
        let endpoint = models::normalize_endpoint(&request.endpoint)?;
        let prior = match request.id.as_deref() {
            Some(id) => Some(store::get(self.db.as_ref(), id).await?),
            None => None,
        };
        let id = request
            .id
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        let old_key = prior.as_ref().and_then(|r| r.credential_ref.clone());
        let new_key = match request.credential {
            ConnectionCredential::Keep => old_key.clone(),
            ConnectionCredential::Clear => None,
            ConnectionCredential::Replace(secret) => {
                ensure!(!secret.trim().is_empty(), "API key cannot be empty");
                let reference = connection_reference(&uuid::Uuid::new_v4().to_string());
                self.credentials
                    .write(&reference, secret)
                    .await
                    .map_err(|_| anyhow::anyhow!("Could not save the key in secure storage"))?;
                Some(reference)
            }
        };
        let record = store::Record {
            id: id.clone(),
            label: label.to_owned(),
            provider: request.provider,
            endpoint,
            credential_ref: new_key.clone(),
        };
        if let Err(error) = store::save(self.db.as_ref(), &record).await {
            if new_key != old_key {
                let cleanup = self.discard_key(new_key.as_deref()).await;
                if cleanup.is_some() {
                    return Err(error.context(
                        "Connection was not saved; an unused key remains in secure storage",
                    ));
                }
            }
            return Err(error);
        }
        checks.remove(&id);
        let problem = if new_key == old_key {
            None
        } else {
            self.discard_key(old_key.as_deref()).await
        };
        self.view(&checks, problem).await
    }

    /// Remove saved configuration and its private key after an explicit action.
    /// # Errors
    /// Returns storage errors; failed key cleanup is an actionable state warning.
    pub async fn remove(&self, id: &str) -> Result<ConnectionsState> {
        let mut checks = self.checks.lock().await;
        let record = store::get(self.db.as_ref(), id).await?;
        store::remove(self.db.as_ref(), id).await?;
        checks.remove(id);
        let problem = self.discard_key(record.credential_ref.as_deref()).await;
        self.view(&checks, problem).await
    }

    /// Contact the saved endpoint with only its own credential, on explicit request.
    /// # Errors
    /// Storage errors abort. Network/authentication failures become check evidence.
    pub async fn check(&self, id: &str) -> Result<ConnectionsState> {
        let mut checks = self.checks.lock().await;
        let record = store::get(self.db.as_ref(), id).await?;
        let result: Result<_> = async {
            let key = self.key(&record).await?;
            Ok(models::fetch_models(record.provider, &record.endpoint, key.as_deref()).await?)
        }
        .await;
        let checked_at_ms = chrono::Utc::now().timestamp_millis();
        let check = match result {
            Ok(models) => ConnectionCheck {
                checked_at_ms,
                models,
                error: None,
            },
            Err(error) => ConnectionCheck {
                checked_at_ms,
                models: Vec::new(),
                error: Some(error.to_string()),
            },
        };
        checks.entry(id.to_owned()).or_default().discovery = Some(check);
        self.view(&checks, None).await
    }

    async fn key(&self, record: &store::Record) -> Result<Option<String>> {
        match record.credential_ref.as_deref() {
            Some(reference) => Ok(Some(
                self.credentials
                    .read(reference)
                    .await
                    .map_err(|_| anyhow::anyhow!("Could not read secure storage"))?
                    .context("The saved key is missing; enter it again")?,
            )),
            None => Ok(None),
        }
    }

    /// Execute the explicit test question at this connection with its own key.
    /// # Errors
    /// Storage/unsupported protocol errors abort; request outcomes become evidence.
    pub async fn test_text(&self, id: &str, model: &str, prompt: &str) -> Result<ConnectionsState> {
        let mut checks = self.checks.lock().await;
        let record = store::get(self.db.as_ref(), id).await?;
        ensure!(
            registry::find(record.provider).is_some_and(supports_text_test),
            "Text testing is not implemented for this endpoint protocol"
        );
        ensure!(
            !model.trim().is_empty() && !prompt.trim().is_empty(),
            "Choose a model and provide a test question"
        );
        let result: Result<_> = async {
            let key = self.key(&record).await?;
            let hosted_openai = record.provider == super::ProviderId::OpenAi;
            let request = openai_compatible::EndpointChatRequest {
                model: Some(model.to_owned()),
                messages: vec![openai_compatible::EndpointChatMessage {
                    role: openai_compatible::EndpointRole::User,
                    content: prompt.to_owned(),
                }],
                max_tokens: (!hosted_openai).then_some(128),
                max_completion_tokens: hosted_openai.then_some(1024),
                temperature: None,
                top_p: None,
                stop: Vec::new(),
            };
            openai_compatible::complete(&record.endpoint, key.as_deref(), &request).await
        }
        .await;
        let (answer, error) = match result {
            Ok(answer) => (Some(answer), None),
            Err(error) => (None, Some(error.to_string())),
        };
        checks.entry(id.to_owned()).or_default().text_test = Some(ConnectionTextTest {
            model: model.to_owned(),
            prompt: prompt.to_owned(),
            checked_at_ms: chrono::Utc::now().timestamp_millis(),
            answer,
            error,
        });
        self.view(&checks, None).await
    }
}
