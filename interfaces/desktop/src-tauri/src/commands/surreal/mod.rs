//! `SurrealDB` Tauri commands.
//!
//! Single umbrella for the operator-facing `SurrealDB` surface. Inside:
//!
//! - [`sidecar`] — managed-process lifecycle: status, health, user-config
//!   load/save. Wraps the engine's `SurrealService`.
//!
//! Future submodules can land here without churning consumers — the
//! frontend imports from [`infra/surreal`](../../../../src/lib/domains/infra/surreal/index.ts).
//!
//! Graph data-plane verbs (query, list-tables, kv-list, etc.) currently
//! live under [`super::sys::graph`] — they're shared infrastructure for
//! every namespace, not Surreal-specific. They surface to the frontend
//! through the same [`infra/surreal`] facade.

pub mod sidecar;
