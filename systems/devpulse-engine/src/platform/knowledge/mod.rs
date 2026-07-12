//! Knowledge library — JSON-backed tips, facts, and glossary with a local
//! relational runtime (Tier-1, DevPulse; non-AI).
//!
//! Two storage layers:
//! - **JSON artifacts** (portable, version-controlled, ship with the binary)
//! - **relational store** (runtime queries, seen-tracking, reactions)
//!
//! Boot: read JSON → compare manifest version → upsert to the store → ready.
//! Runtime: affinity-weighted selection, cooldown-gated, reaction-filtered.
//! The HTTP fetch for remote content lives in the desktop tier; this module is
//! network-free. It lives in the engine (DevPulse's core), never Clyffy's
//! AI layer.

pub mod loader;
pub mod selector;
pub mod sync;
pub mod types;

pub use selector::{record_reaction, select_entry, SelectedEntry};
pub use sync::{sync_remote_entries, sync_to_libsql};
pub use types::{EntryType, KnowledgeEntry, KnowledgeManifest, Reaction, SelectionParams, Tier};
