//! Persona memory service restored under the kernel (plan 0009 / plan 0001 B6).
//!
//! The service exposes load, save, list and text recall over MCP stdio.
//! [`store::PersonaStore`] composes the existing kernel Turso adapter, opens
//! connections per operation, and commits memory and retry records atomically.
//! The original source revision remains recorded in the restoration manifest.
//!
//! [`server::Server`] handles MCP initialization, tool results and JSON-RPC
//! framing; [`auth::AuthGate`] permits explicitly configured local operation.
//! Remote authentication and vector/graph retrieval require their own configured
//! backends and are not implied by this standalone service.
//!
//! [`schema`] owns the `persona_` tables. [`idempotency`] provides the retained
//! cache API with durable expiry; [`verbs`] owns the memory tool arguments.

pub mod auth;
pub mod binding;
pub mod bridge;
pub mod context;
pub mod error;
pub mod idempotency;
pub mod schema;
pub mod server;
pub mod store;
pub mod verbs;

pub use binding::Binding;
pub use bridge::{Bridge, Grant};
pub use context::SessionNotes;
pub use error::{ErrorEnvelope, ErrorKind, PersonaError};
pub use server::Server;
pub use store::{Expected, PersonaBlock, PersonaScope, PersonaStore, RecallHit, RecallMode};
