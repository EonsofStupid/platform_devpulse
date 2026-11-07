// engine/src/signals/kinds.rs

//! Sink kinds - re-exported from shared (SSOT)
//!
//! Each sink represents a destination for signal data.
//! Signals declare their sinks via `SignalVariant::sinks()`.

// Re-export SinkKind from shared - it's the Single Source of Truth
pub use shared::SinkKind;
