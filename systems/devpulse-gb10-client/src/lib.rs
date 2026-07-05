//! # devpulse-gb10-client
//!
//! DevPulse's thin wire client to headless **Clyffy** (ClyffyOS) running on the
//! GB10 cluster. DevPulse is a pure client: **Turso is its only local DB**;
//! DuckDB / Surreal / all persistence + all stats live on the GB10. This crate is
//! how DevPulse reaches them.
//!
//! Protocol is HTTP/JSON, decided by the [`clyffyos_wire`] contract:
//! `GET /v1/capability` returns an [`EndpointCapability`] the client uses to
//! **compute** which Tier-2 surfaces to light up. Nothing is hardcoded; an
//! unreachable endpoint is reported honestly as [`ConnectionState::Disconnected`]
//! and DevPulse keeps running standalone.
//!
//! See `SPEC.md` for the full boundary contract.

#![warn(missing_docs)]

mod client;

pub use client::{ClientError, ClyffyClient, ConnectionState};

// Re-export the wire contract SSOT so consumers depend on ONE place and no parallel
// DTO tree ever forms.
pub use clyffyos_wire::{EndpointCapability, LoadedSlotSummary, RegisteredEndpoint, SlotStatus};
