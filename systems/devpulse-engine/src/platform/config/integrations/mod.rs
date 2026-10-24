//! Integrations axis — external provider adapters.
//!
//! Members bridge the platform to external services. Each integration
//! respects the IP-protection boundary: adapter types stay on this side;
//! provider-specific vocabulary does not leak into other axes.
//!
//! # Modules (authored as S0 phases land)
//!
//! - `claude` — Anthropic API adapter + MCP sidecar
//! - `cloud` — the `DevPulse` account's auth endpoint (`cloud.toml`)
//!
//! See `config/platform/integrations/` for the TOML layout.

pub mod cloud;

use serde::Deserialize;

/// `[integrations]`: one table per external service.
#[derive(Debug, Clone, Default, Deserialize)]
pub struct IntegrationsConfig {
    /// The `DevPulse` account (`[integrations.cloud]`).
    #[serde(default)]
    pub cloud: cloud::CloudConfig,
}
