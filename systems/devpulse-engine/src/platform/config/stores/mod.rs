//! Stores axis — persistent state backends.
//!
//! Each member wraps a database engine with a config struct, a
//! [`super::super::module::ManagedModule`] impl, and a typed devtool
//! surface. All members are typically
//! [`super::super::module::StartMode::Eager`] because the rest of the
//! platform reads their state.
//!
//! # Modules (authored as S0 phases land)
//!
//! - `turso` — relational (system scope + per-user scope)
//! - `duckdb` — analytics (system scope)
//! - `surrealdb` — graph (system + user + global + project scopes)
//! - `cache` — in-memory KV (Moka)
//! - `project_db` — per-project relational manager
//!
//! See `config/platform/stores/` for the TOML layout.
