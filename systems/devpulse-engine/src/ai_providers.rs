//! AI provider SSOT — every model / inference provider `DevPulse` knows
//! about, re-exported from the kernel (plan 0001 B3.1, owner ruling
//! 2026-10-21: the registry moved to the kernel, where the code that finds,
//! checks and talks to each provider lives).
//!
//! The engine, the Tauri commands and the devtools keep reaching it here:
//! `ProviderId`, the `PROVIDERS` rows and the query helpers.
//!
//! # Adding a provider
//!
//! 1. Add a `ProviderId` variant in `kernel/devpulse-clyffy/src/providers/types.rs`.
//! 2. Add a `Vendor` variant if the brand is new.
//! 3. Append an `AiProvider` row in `kernel/devpulse-clyffy/src/providers/registry.rs`.
//! 4. A subscription agent or desktop app also gets a definition file in
//!    `kernel/devpulse-clyffy/config/providers/` (how to find, version,
//!    update, sign in and talk to it).
//!
//! # Removing a provider
//!
//! Breaking change. The wire id is in user config files, telemetry, and
//! devtool URLs.

// Shared provider definitions — ids, vendors, transports, billing,
// capabilities; layman names, no kernel internals.
pub use devpulse_clyffy::providers::registry::{by_capability, by_classification, find, PROVIDERS};
pub use devpulse_clyffy::providers::types::{
    AgentProtocol, AiProvider, BillingModel, Capabilities, Classification, McpClient, ProviderId,
    SdkBackend, Transport, Vendor,
};

/// The complete provider catalog in every build; readiness is verified separately.
pub fn visible() -> impl Iterator<Item = &'static AiProvider> {
    devpulse_clyffy::providers::registry::visible()
}
