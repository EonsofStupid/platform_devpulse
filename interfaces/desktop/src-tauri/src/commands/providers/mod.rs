//! Provider operations — Tauri command surface for the API Providers devtool.
//!
//! Three commands, each driven entirely by the SSOT registry plus the
//! existing keychain vault — no new persistence, no provider-specific
//! conditionals at the boundary:
//!
//! - `list_provider_status`  — grid data for the Status tab.
//! - `validate_provider`     — dropdown-populates-on-save UX.
//! - `list_provider_models`  — same call, different verb name for the
//!   Config tab's model picker refresh.
//!
//! Validation results live in a process-local in-memory cache. Restart
//! clears it deliberately — a fresh boot should give a fresh perspective
//! and not pretend a stale "OK" from yesterday is still true.
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri boundary over the kernel model-discovery adapter and OS keychain; documented failures surface as CommandError."
)]

mod cache;
pub mod dto;

use std::sync::OnceLock;
use std::time::Instant;

use devpulse_engine::ai_providers::{self, BillingModel, ProviderId, Transport};
use serde::Deserialize;
use specta::Type;

use dto::{ProviderModelInfo, ProviderStatus, ValidationResult};

use super::_util::{CommandError, now_ms};
use super::credentials;

use cache::{CacheEntry, CredentialChange, ValidationCache};

fn cache() -> &'static ValidationCache {
    static CACHE: OnceLock<ValidationCache> = OnceLock::new();
    CACHE.get_or_init(ValidationCache::default)
}

/// Begin a vault mutation, invalidating existing and in-flight model discovery.
pub(super) fn credential_change(provider: ProviderId) -> CredentialChange<'static> {
    cache().credential_change(provider)
}

/// Snapshot every visible provider's current status.
///
/// Cheap — no network calls. The Status tab calls this on mount + on
/// post-save refresh. Local-runtime cards rely on `validate_provider`
/// for reachability, which the UI fires per-card on demand.
#[tauri::command]
#[specta::specta]
pub async fn list_provider_status() -> Result<Vec<ProviderStatus>, CommandError> {
    let mut out = Vec::new();
    for entry in ai_providers::visible() {
        let configured = is_configured(entry).await;
        let cached = cache().snapshot(entry.id);
        out.push(ProviderStatus {
            id: entry.id,
            display_name: entry.display_name.to_string(),
            configured,
            requires_account_setup: matches!(entry.id, ProviderId::Fireworks),
            is_local: matches!(entry.billing, BillingModel::Local),
            last_endpoint: cached.as_ref().map(|c| c.endpoint.clone()),
            last_validated_at_ms: cached.as_ref().map(|c| c.validated_at_ms),
            last_error: cached.as_ref().and_then(|c| c.error.clone()),
            model_count: cached.as_ref().map(|c| c.models.len() as u32),
        });
    }
    Ok(out)
}

/// Check model discovery for the current credential generation.
/// This does not verify chat, embeddings or any other inference operation.
///
/// On success: caches the model list + clears any prior error.
/// On failure: caches the classified error so the Status tab can
/// surface it without a re-call.
///
/// Network/vault outcomes use `ValidationResult`. A credential mutation or newer
/// check superseding this request returns an error and never publishes old evidence.
#[tauri::command]
#[specta::specta]
pub async fn validate_provider(
    provider: ProviderId,
    endpoint: String,
) -> Result<ValidationResult, CommandError> {
    let entry = ai_providers::find(provider)
        .ok_or_else(|| CommandError::not_configured(format!("Unknown provider: {provider:?}")))?;

    let ticket = cache().begin(provider)?;
    let endpoint = ai_providers::models::normalize_endpoint(&endpoint)?;
    let started = Instant::now();
    let result = async {
        let api_key = if entry.supports_api_key() {
            credentials::get_api_key(provider).await?
        } else {
            None
        };
        ai_providers::models::fetch_models(provider, &endpoint, api_key.as_deref())
            .await
            .map_err(CommandError::from)
    }
    .await;
    let latency_ms = u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX);

    match result {
        Ok(models) => {
            let count = models.len();
            cache().complete(
                ticket,
                CacheEntry {
                    endpoint: endpoint.clone(),
                    validated_at_ms: now_ms(),
                    models: models.clone(),
                    error: None,
                },
            )?;
            tracing::info!(
                provider = ?provider,
                model_count = count,
                latency_ms,
                "providers.validate ok"
            );
            Ok(ValidationResult {
                provider,
                endpoint,
                ok: true,
                latency_ms,
                models,
                error_kind: None,
                error_message: None,
            })
        }
        Err(err) => {
            cache().complete(
                ticket,
                CacheEntry {
                    endpoint: endpoint.clone(),
                    validated_at_ms: now_ms(),
                    models: Vec::new(),
                    error: Some(err.message.clone()),
                },
            )?;
            tracing::warn!(
                provider = ?provider,
                kind = ?err.kind,
                latency_ms,
                error = %err.message,
                "providers.validate failed"
            );
            Ok(ValidationResult {
                provider,
                endpoint,
                ok: false,
                latency_ms,
                models: Vec::new(),
                error_kind: Some(err.kind),
                error_message: Some(err.message),
            })
        }
    }
}

/// Convenience for the Config tab's model picker — same call as
/// `validate_provider`, returns just the model list (or an empty list
/// on failure, with the failure message in the Tauri error channel).
///
/// `validate_provider` is what the rest of the devtool calls; this one
/// exists so the UI can wire a "Refresh model list" button without
/// pretending it's doing something different.
#[derive(Debug, Clone, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ListModelsRequest {
    /// Provider whose models to list.
    pub provider: ProviderId,
    /// Configured API base URL, including its version/path prefix.
    pub endpoint: String,
}

/// Refresh the model list for one provider.
///
/// Convenience wrapper over `validate_provider` for the Config tab's
/// "Refresh model list" button — same call, error path collapsed back
/// into the Tauri Result channel since the UI here only renders the
/// model dropdown and a toast on failure.
#[tauri::command]
#[specta::specta]
pub async fn list_provider_models(
    request: ListModelsRequest,
) -> Result<Vec<ProviderModelInfo>, CommandError> {
    let result = validate_provider(request.provider, request.endpoint).await?;
    if result.ok {
        Ok(result.models)
    } else {
        // Reconstruct CommandError from the validation result so the
        // refresh-button caller gets the same typed kind the Status
        // tab does for free.
        Err(CommandError::new(
            result
                .error_kind
                .unwrap_or(crate::commands::_util::ErrorKind::Internal),
            result
                .error_message
                .unwrap_or_else(|| "Provider validation failed".into()),
        ))
    }
}

/// True when this provider has the runtime config it needs to actually
/// be called: a key in the vault for cloud providers, or a present
/// transport entry for local ones (reachability is decided by validate).
async fn is_configured(entry: &ai_providers::AiProvider) -> bool {
    match entry.billing {
        BillingModel::PerToken => {
            // Cloud — needs an API key. Reuse the vault accessor; treat
            // any keychain failure as "not configured" rather than
            // propagating, since this is a status query, not an action.
            credentials::get_api_key(entry.id)
                .await
                .ok()
                .flatten()
                .is_some_and(|k| !k.trim().is_empty())
        }
        BillingModel::Local => {
            // Local — at least one transport with a discoverable URL.
            entry.transports.iter().any(|t| {
                matches!(
                    t,
                    Transport::OpenAiCompatible { .. } | Transport::LocalHttp { .. }
                )
            })
        }
        BillingModel::Subscription => false,
    }
}
