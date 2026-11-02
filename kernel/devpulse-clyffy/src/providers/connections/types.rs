//! Saved HTTP connections and operation evidence exposed to the engine/UI.
use crate::providers::{ProviderId, adapters::models::ProviderModelInfo};
use serde::{Deserialize, Serialize};

/// Public configuration. No credential or vault reference crosses this boundary.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct SavedConnection {
    /// Stable connection identity, independent of provider or label.
    pub id: String,
    /// User-chosen name.
    pub label: String,
    /// Request/response adapter to use.
    pub provider: ProviderId,
    /// Explicit API base, including its version/path prefix.
    pub endpoint: String,
    /// A private vault reference is saved; a check still must resolve it.
    pub has_credential: bool,
    /// Evidence for this configuration during this process lifetime only.
    pub check: Option<ConnectionCheck>,
}

/// A completed model-list operation, never proof of chat or inference readiness.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct ConnectionCheck {
    /// Completion time, Unix milliseconds.
    pub checked_at_ms: i64,
    /// Models actually advertised by this endpoint.
    pub models: Vec<ProviderModelInfo>,
    /// Redacted reason for failure; None means the model-list request succeeded.
    pub error: Option<String>,
}

/// Configured endpoints and any actionable credential-cleanup warning.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct ConnectionsState {
    /// Saved connections in label/identity order.
    pub items: Vec<SavedConnection>,
    /// A completed mutation may have failed to remove a superseded vault entry.
    pub problem: Option<String>,
}

/// An adapter the existing registry makes available for HTTP connections.
#[derive(Debug, Clone, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct ConnectionOption {
    /// Registry identity.
    pub provider: ProviderId,
    /// Presentation name.
    pub name: String,
    /// Editable suggestion only; never a request-time fallback.
    pub suggested_endpoint: String,
}

/// Explicit credential intent. Intentionally does not implement Debug.
#[derive(Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(tag = "action", content = "value", rename_all = "camelCase")]
pub enum ConnectionCredential {
    /// Retain this connection's existing key, if any.
    Keep,
    /// Save a replacement under a new private reference.
    Replace(String),
    /// Stop using a credential for this connection.
    Clear,
}

/// Save intent. A missing identity creates a new connection; an existing one edits it.
#[derive(Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SaveConnection {
    /// Identity to edit, or None for a new connection.
    pub id: Option<String>,
    /// User-chosen name.
    pub label: String,
    /// Request/response adapter.
    pub provider: ProviderId,
    /// Explicit API base URL.
    pub endpoint: String,
    /// Backend-only credential intent; never returned or logged.
    pub credential: ConnectionCredential,
}
