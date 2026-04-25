//! Ollama sidecar service — engine facade over the kernel adapter.
//!
//! The kernel owns the lifecycle (spawn / attach / health / shutdown,
//! HTTP client, model commands). This facade wraps
//! [`devpulse_clyffy::cortex::persistence::OllamaAdapter`] with the
//! platform `Service` trait and preserves the public surface the Tauri
//! commands and `Platform::ensure_ollama_sidecar_started` depend on.

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_clyffy::cortex::persistence::ollama::{
    OllamaAdapter, OllamaConfig, OllamaModel as KernelOllamaModel,
};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::{Path, PathBuf};

/// Public, TS-exported view of a model reported by `GET /api/tags`.
///
/// The kernel's `OllamaModel` is `serde`-only (the kernel never pulls in
/// `specta`). This DTO is the engine-facade mirror — same shape, plus
/// `specta::Type` so it can cross the Tauri IPC boundary.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct OllamaModel {
    /// Tag-qualified model name, e.g. `llama3:8b-instruct-q4_K_M`.
    pub name: String,
    /// ISO-8601 timestamp reported by Ollama (may be empty).
    pub modified_at: String,
    /// On-disk size in bytes (may be 0 if Ollama omits it).
    pub size: u64,
    /// Blob digest (may be empty).
    pub digest: String,
}

impl From<KernelOllamaModel> for OllamaModel {
    fn from(m: KernelOllamaModel) -> Self {
        Self {
            name: m.name,
            modified_at: m.modified_at,
            size: m.size,
            digest: m.digest,
        }
    }
}

/// Ollama sidecar service — thin engine wrapper around [`OllamaAdapter`].
pub struct OllamaSidecarService {
    adapter: OllamaAdapter,
}

impl OllamaSidecarService {
    /// Boot the sidecar — preserves the legacy `(host, port, binary)`
    /// signature that `Platform::ensure_ollama_sidecar_started` calls
    /// so upstream wiring needs no change.
    ///
    /// # Errors
    /// Propagates any failure from [`OllamaAdapter::boot`].
    pub async fn boot(host: &str, port: u16, binary_path: Option<PathBuf>) -> Result<Self> {
        let adapter = OllamaAdapter::boot(OllamaConfig {
            host: host.to_string(),
            port,
            max_bumps: None,
            binary_path,
        })
        .await?;
        Ok(Self { adapter })
    }

    /// Base URL for the Ollama HTTP API.
    #[must_use]
    pub fn base_url(&self) -> String {
        self.adapter.base_url()
    }

    /// Host the service is bound to.
    #[must_use]
    pub fn host(&self) -> &str {
        self.adapter.host()
    }

    /// Port the service is actually listening on (after any `+1` bumps).
    #[must_use]
    pub fn port(&self) -> u16 {
        self.adapter.port()
    }

    /// Port as configured in `platform.default.toml`.
    #[must_use]
    pub fn configured_port(&self) -> u16 {
        self.adapter.allocation().configured
    }

    /// Number of `+1` bumps it took to find a port (`0` = no bump).
    #[must_use]
    pub fn port_bumps(&self) -> u16 {
        self.adapter.allocation().bumps
    }

    /// Configured binary path, if any.
    #[must_use]
    pub fn binary_path(&self) -> Option<&Path> {
        self.adapter.binary_path()
    }

    /// `true` iff this service spawned the child.
    #[must_use]
    pub fn is_managed(&self) -> bool {
        self.adapter.is_managed()
    }

    /// Fetch the Ollama version string.
    ///
    /// # Errors
    /// HTTP failure / non-2xx / decode failure.
    pub async fn version(&self) -> Result<String> {
        self.adapter.version().await
    }

    /// List installed models.
    ///
    /// # Errors
    /// HTTP failure / non-2xx / decode failure.
    pub async fn list_models(&self) -> Result<Vec<OllamaModel>> {
        Ok(self
            .adapter
            .list_models()
            .await?
            .into_iter()
            .map(OllamaModel::from)
            .collect())
    }

    /// Pull a model (non-streaming, blocks until done).
    ///
    /// # Errors
    /// HTTP failure / non-2xx.
    pub async fn pull_model(&self, name: &str) -> Result<()> {
        self.adapter.pull_model(name).await
    }

    /// Delete a model.
    ///
    /// # Errors
    /// HTTP failure / non-2xx.
    pub async fn delete_model(&self, name: &str) -> Result<()> {
        self.adapter.delete_model(name).await
    }
}

impl Service for OllamaSidecarService {
    fn name(&self) -> &'static str {
        "Ollama sidecar"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::OllamaSidecar
    }

    async fn ping(&self) -> Result<()> {
        self.adapter.ping().await
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        self.adapter.shutdown().await
    }
}
