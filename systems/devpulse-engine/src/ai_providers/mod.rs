//! AI provider SSOT — every model / inference provider DevPulse knows about.
//!
//! This module is **data-only**. No HTTP clients, no runtime state. The
//! lane router, the API Providers devtool, the Claude Subscription
//! devtool, the council, and Clyffy all read from one place: the static
//! `PROVIDERS` const in `registry.rs`.
//!
//! # What lives here
//!
//! - `types`     — public enums (`ProviderId`, `Vendor`, `BillingModel`,
//!                 `Transport`, `SdkBackend`, `Classification`, `Capabilities`)
//!                 and the `AiProvider` struct.
//! - `registry`  — the `PROVIDERS` const plus query helpers (`find`,
//!                 `by_classification`, `by_capability`, `visible`).
//!
//! # What does NOT live here
//!
//! - HTTP clients (`async-openai`, hand-rolled reqwest) — they go in
//!   `claude/`, `providers/openai/`, etc., one consumer module per SDK.
//! - Runtime state (configured keys, last-call timestamps, rate counters)
//!   — that's in `commands/credentials/` + `commands/providers/`.
//! - Lane routing logic — that's `platform/router/` (next sprint).
//!
//! # Adding a provider
//!
//! 1. Add a `ProviderId` variant in `types.rs`.
//! 2. Add a `Vendor` variant if the brand is new.
//! 3. Append an `AiProvider` entry in `registry.rs`.
//! 4. `cargo test -p devpulse-engine ai_providers::` — the registry's
//!    own integrity tests catch missing transports / classifications.
//!
//! # Removing a provider
//!
//! Breaking change. The wire id is in user config files, telemetry, and
//! devtool URLs. Deprecate with a doc-comment and a release note first.

pub mod registry;
pub mod types;

pub use registry::{by_capability, by_classification, find, visible, PROVIDERS};
pub use types::{
    AiProvider, BillingModel, Capabilities, Classification, McpClient, ProviderId, SdkBackend,
    Transport, Vendor,
};
