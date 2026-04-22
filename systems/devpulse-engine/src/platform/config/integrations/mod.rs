//! Integrations axis — external provider adapters.
//!
//! Members bridge the platform to external services. Each integration
//! respects the IP-protection boundary: adapter types stay on this side;
//! provider-specific vocabulary does not leak into other axes.
//!
//! # Modules (authored as S0 phases land)
//!
//! - `claude` — Anthropic API adapter + MCP sidecar
//!
//! See `config/platform/integrations/` for the TOML layout.
