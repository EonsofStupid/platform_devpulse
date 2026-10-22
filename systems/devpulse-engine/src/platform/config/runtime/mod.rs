//! Runtime primitives — platform boot, portable mode, telemetry, network, Windows quirks.
//!
//! This axis owns the module configs that every other axis depends on.
//! Members of this axis are typically [`super::super::module::StartMode::Eager`]
//! because the platform cannot function without them.
//!
//! # Modules (authored as S0 phases land)
//!
//! - `portable` — portable-mode flag and data dir root resolution
//! - `boot` — boot-gate policy (timeouts, critical-services behavior)
//! - `telemetry` — trace enablement and lane configuration
//! - `network` — dev-server and graph-API port bindings
//! - `windows` — Windows-specific path/filesystem quirks
//! - [`logs`] — how long each run's logs stay (`[logs]`, master plan M8)
//!
//! See `config/platform/runtime/` for the TOML layout.

pub mod logs;
