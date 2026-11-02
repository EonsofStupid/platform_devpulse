//! Knowledge library — JSON-backed tips, facts, and glossary with Turso runtime.
//!
//! Two storage layers:
//! - **JSON artifacts** (portable, version-controlled, ship with binary)
//! - **Turso** (runtime queries, seen-tracking, reactions, analytics)
//!
//! Boot flow: read JSON → compare manifest version → upsert to Turso → ready.
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

pub use selector::{SelectedEntry, record_reaction, select_entry};
pub use sync::{sync_remote_entries, sync_to_database};
pub use types::{EntryType, KnowledgeEntry, KnowledgeManifest, Reaction, SelectionParams, Tier};
