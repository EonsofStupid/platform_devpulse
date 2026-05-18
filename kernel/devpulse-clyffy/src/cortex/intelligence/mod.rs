//! Abstract intelligence layer — connector-agnostic memory + reasoning
//! types, schema, routing, and the [`IntelligenceStore`] trait.
//!
//! This module knows NOTHING about SurrealDB, LibSQL, or any other
//! backend. Connectors under `cortex::persistence::<backend>::*`
//! implement [`IntelligenceStore`] against their own storage layer.
//! The engine wires a chosen connector behind `Arc<dyn IntelligenceStore>`
//! so hot-swapping backends doesn't require rebuilding the kernel.
//!
//! Four concerns live here:
//!
//! - [`record`] — `RroRecord`, `MemoryRecord`, `MemoryKind`,
//!   `NeighborRef`. The `RroRecord` shape is rkyv-archivable for
//!   zero-copy reads of precomputed reasoning context (the "JIT
//!   property": work happens at write time, read is mmap +
//!   `rkyv::access`).
//! - [`schema`] — `MEMORY_SCHEMA` SurrealQL constant + `EMBEDDING_DIM`
//!   constant. Each connector applies the schema to its own
//!   project-local namespace.
//! - [`slug`] — `slug_for_cwd`: canonical project routing key. Every
//!   hook and every MCP consumer derives the same slug so writes
//!   from one tool land in the database that reads from another tool
//!   will query.
//! - [`store`] — `IntelligenceStore` async trait. The connector
//!   contract for save / recall / relate / write_archive /
//!   read_archive_bytes.

pub mod pipeline;
pub mod record;
pub mod schema;
pub mod slug;
pub mod store;

pub use pipeline::{
    process_chat_message, NullPipelineSink, PipelineEventSink, PipelineSignal, TextEmbedder,
};
pub use record::{
    ArchivedNeighborRef, ArchivedRroRecord, MemoryKind, MemoryRecord, NeighborRef, RroRecord,
};
pub use schema::{EMBEDDING_DIM, MEMORY_SCHEMA};
pub use slug::slug_for_cwd;
pub use store::{IntelligenceStore, RecallHit};
