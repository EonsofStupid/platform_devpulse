//! Persona MCP server crate.
//!
//! Foundation Slice 1 of `CLYFFY-COGNITIVE-FOUNDATION.md`. Exposes the
//! `persona.*` verb surface (load / save / recall / list) over stdio
//! JSON-RPC. Future slices add `cortex.*` (thought_emit / thought_read)
//! and `rrd.*` (episode_ingest / fact_query / fact_invalidate / lifecycle).
//!
//! # Module layout
//!
//! - [`error`]: error envelope (kind taxonomy + W3C trace id).
//! - [`schema`]: LibSQL DDL for `persona_blocks` + `persona_idempotency`.
//! - [`store`]: `PersonaStore` facade wrapping LibSQL + SurrealDB + Qdrant adapters.
//! - [`idempotency`]: 24h moka LRU + LibSQL durable backstop.
//! - [`auth`]: offline-mode gate (Slice 6 extends with Authentik JWT).
//! - [`verbs`]: per-verb handlers.
//! - [`server`]: JSON-RPC 2.0 dispatch loop, stdio framing per MCP spec.
//!
//! Per `CLYFFY-COGNITIVE-FOUNDATION.md` §2, all writes accept an
//! `idempotency_key` (UUIDv7 recommended); responses surface a `kind`
//! discriminator on every error.

pub mod auth;
pub mod error;
pub mod idempotency;
pub mod schema;
pub mod server;
pub mod store;
pub mod verbs;

pub use error::{ErrorEnvelope, ErrorKind, PersonaError};
pub use server::Server;
pub use store::{PersonaBlock, PersonaScope, PersonaStore, RecallHit, RecallMode};
