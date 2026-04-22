//! Knowledge library — JSON-backed tips, facts, and glossary with libSQL runtime.
//!
//! Two storage layers:
//! - **JSON artifacts** (portable, version-controlled, ship with binary)
//! - **libSQL** (runtime queries, seen-tracking, reactions, analytics)
//!
//! Boot flow: read JSON → compare manifest version → upsert to libSQL → ready.
//! Runtime: affinity-weighted selection, cooldown-gated, reaction-filtered.
//!
//! Inside kernel, anything can reference Clyffy. At the boundary (engine facade),
//! everything is generalized: Entry, type discriminant, payload.

pub mod loader;
pub mod selector;
pub mod sync;
#[cfg(test)]
mod tests;
pub mod types;

pub use selector::{record_reaction, select_entry, SelectedEntry};
pub use sync::sync_to_libsql;
pub use types::{EntryType, KnowledgeEntry, KnowledgeManifest, Reaction, SelectionParams, Tier};
