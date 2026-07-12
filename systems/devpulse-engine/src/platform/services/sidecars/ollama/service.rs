//! Ollama service — engine facade over the kernel adapter.
//!
//! The kernel owns the lifecycle (spawn / attach / health / shutdown,
//! HTTP client, model commands). This facade wraps
//! [`devpulse_clyffy::cortex::persistence::OllamaAdapter`] with the
//! platform `Service` trait and preserves the public surface the Tauri
//! commands and `Platform::ensure_ollama_started` depend on.

use crate::platform::services::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use devpulse_clyffy::cortex::persistence::ollama::{OllamaAdapter, OllamaConfig};
use std::path::{Path, PathBuf};

// IP-NOTE: `OllamaModel` is a public-vocabulary-safe kernel type — it
// only contains generic Ollama API fields (name, size, digest, …). It
// crosses the Tauri IPC boundary directly via the optional `specta`
// feature on `devpulse-clyffy`. No engine-side wrapper.
pub use devpulse_clyffy::cortex::persistence::OllamaModel;

/// Ollama service — thin engine wrapper around [`OllamaAdapter`].
pub struct OllamaService {
    adapter: OllamaAdapter,
}

impl OllamaService {
    /// Boot the service — preserves the legacy `(host, port, binary)`
    /// signature that `Platform::ensure_ollama_started` calls so
    /// upstream wiring needs no change.
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
        self.adapter.list_models().await
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

impl Service for OllamaService {
    fn name(&self) -> &'static str {
        "Ollama"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::Ollama
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
