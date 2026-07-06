//! # devpulse-store
//!
//! DevPulse's kernel-free, store-**agnostic** persistence layer. Callers talk to
//! the trait interfaces ([`SqlAdapter`], [`AnalyticsAdapter`], [`CacheAdapter`]);
//! the concrete engine — [`TursoAdapter`] (relational SSOT), [`DuckDbAdapter`]
//! (project analytics), [`MokaAdapter`] (cache) — is an implementation detail
//! that must not matter to callers.
//!
//! This is the thin store DevPulse owns after the ClyffyOS split: **no kernel,
//! no llama.cpp**. Surreal / vector / AI stores live on ClyffyOS and are reached
//! over the wire ([`devpulse-gb10-client`]) — never compiled in here.
//!
//! [`devpulse-gb10-client`]: https://docs.rs/devpulse-gb10-client

#![warn(missing_docs)]

pub mod config;
pub mod duckdb;
pub mod traits;

mod cache;
mod sql;

pub use cache::{MokaAdapter, MokaCacheConfig};
pub use config::{PersistenceConfig, StoreKind};
pub use duckdb::DuckDbAdapter;
pub use sql::TursoAdapter;
pub use traits::{
    AnalyticsAdapter, CacheAdapter, PersistenceAdapter, SqlAdapter, SqlRow, SqlValue,
    TypedPersistence,
};
