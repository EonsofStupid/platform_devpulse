//! Provider operations — Tauri command surface for the API Providers devtool.
//!
//! Three commands, each driven entirely by the SSOT registry plus the
//! existing keychain vault — no new persistence, no provider-specific
//! conditionals at the boundary:
//!
//! - `list_provider_status`  — grid data for the Status tab.
//! - `validate_provider`     — dropdown-populates-on-save UX.
//! - `list_provider_models`  — same call, different verb name for the
//!                             Config tab's model picker refresh.
//!
//! Validation results live in a process-local in-memory cache. Restart
//! clears it deliberately — a fresh boot should give a fresh perspective
//! and not pretend a stale "OK" from yesterday is still true.

pub mod client;
pub mod dto;

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Instant;

use devpulse_engine::ai_providers::{self, BillingModel, ProviderId, Transport};
use serde::Deserialize;
use specta::Type;

use dto::{ModelInfo, ProviderStatus, ValidationResult};

use super::_util::{now_ms, CommandError};
use super::credentials;

/// Per-provider validation cache.
///
/// In-memory only — cleared on restart. Promoted to libSQL only if the
/// devtool ever needs cross-restart "last seen healthy" UX, which the
/// validate-on-save model deliberately avoids.
struct CacheEntry {
    last_validated_at_ms: i64,
    last_models: Vec<ModelInfo>,
    last_error: Option<String>,
}

fn cache() -> &'static Mutex<HashMap<ProviderId, CacheEntry>> {
    static CACHE: std::sync::OnceLock<Mutex<HashMap<ProviderId, CacheEntry>>> =
        std::sync::OnceLock::new();
    CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Snapshot every visible provider's current status.
///
/// Cheap — no network calls. The Status tab calls this on mount + on
/// post-save refresh. Local-runtime cards rely on `validate_provider`
/// for reachability, which the UI fires per-card on demand.
#[tauri::command]
#[specta::specta]
pub async fn list_provider_status() -> Result<Vec<ProviderStatus>, CommandError> {
    let cache_snapshot = snapshot_cache();
    let mut out = Vec::new();
    for entry in ai_providers::visible() {
        let configured = is_configured(entry).await;
        let cached = cache_snapshot.get(&entry.id);
        out.push(ProviderStatus {
            id: entry.id,
            display_name: entry.display_name.to_string(),
            configured,
            requires_account_setup: matches!(entry.id, ProviderId::Fireworks),
            is_local: matches!(entry.billing, BillingModel::Local),
            last_validated_at_ms: cached.map(|c| c.last_validated_at_ms),
            last_error: cached.and_then(|c| c.last_error.clone()),
            model_count: cached.map(|c| c.last_models.len() as u32),
        });
    }
    Ok(out)
}

/// Validate a provider by listing its models — the canonical "is this
/// connection working" call that doubles as the model-picker refresh.
///
/// On success: caches the model list + clears any prior error.
/// On failure: caches the classified error so the Status tab can
/// surface it without a re-call.
///
/// Always returns `Ok(ValidationResult)` — the result's `ok` field
/// distinguishes success from classified failure. Returning `Err` would
/// force the frontend to do double-dispatch on transport failure.
#[tauri::command]
#[specta::specta]
pub async fn validate_provider(provider: ProviderId) -> Result<ValidationResult, CommandError> {
    let entry = ai_providers::find(provider)
        .ok_or_else(|| CommandError::not_configured(format!("Unknown provider: {provider:?}")))?;

    let api_key = if matches!(entry.billing, BillingModel::PerToken) {
        credentials::get_api_key(provider).await?
    } else {
        None
    };

    let started = Instant::now();
    let result = client::fetch_models(provider, api_key.as_deref()).await;
    let latency_ms = u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX);

    match result {
        Ok(models) => {
            let count = models.len();
            store_cache_entry(
                provider,
                CacheEntry {
                    last_validated_at_ms: now_ms(),
                    last_models: models.clone(),
                    last_error: None,
                },
            );
            tracing::info!(
                provider = ?provider,
                model_count = count,
                latency_ms,
                "providers.validate ok"
            );
            Ok(ValidationResult {
                provider,
                ok: true,
                latency_ms,
                models,
                error_kind: None,
                error_message: None,
            })
        }
        Err(err) => {
            store_cache_entry(
                provider,
                CacheEntry {
                    last_validated_at_ms: now_ms(),
                    last_models: Vec::new(),
                    last_error: Some(err.message.clone()),
                },
            );
            tracing::warn!(
                provider = ?provider,
                kind = ?err.kind,
                latency_ms,
                error = %err.message,
                "providers.validate failed"
            );
            Ok(ValidationResult {
                provider,
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
) -> Result<Vec<ModelInfo>, CommandError> {
    let result = validate_provider(request.provider).await?;
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

/// Snapshot the cache as a plain `HashMap` so callers can iterate
/// without holding the mutex across awaits.
fn snapshot_cache() -> HashMap<ProviderId, CacheEntry> {
    let guard = cache().lock();
    let map = match guard {
        Ok(m) => m,
        Err(poisoned) => {
            tracing::warn!("providers cache mutex poisoned — recovering");
            poisoned.into_inner()
        }
    };
    map.iter()
        .map(|(k, v)| {
            (
                *k,
                CacheEntry {
                    last_validated_at_ms: v.last_validated_at_ms,
                    last_models: v.last_models.clone(),
                    last_error: v.last_error.clone(),
                },
            )
        })
        .collect()
}

fn store_cache_entry(provider: ProviderId, entry: CacheEntry) {
    let guard = cache().lock();
    let mut map = match guard {
        Ok(m) => m,
        Err(poisoned) => {
            tracing::warn!("providers cache mutex poisoned on write — recovering");
            poisoned.into_inner()
        }
    };
    map.insert(provider, entry);
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
                .is_some_and(|k| !k.is_empty())
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
