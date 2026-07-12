//! Loading lifecycle — the pure-data model-status types shared across the
//! management layer (slot status snapshots, memory footprint, load
//! parameters).
//!
//! Only the shared TYPES live here. The actual load / prime / swap
//! orchestration is inference and is Clyffy's, running on headless
//! Clyffy/GB10 — `loading::{prime, safe, swap}` are NOT part of
//! this crate.

pub mod states;

pub use states::{
    LoadParams, LoadingStage, MemoryFootprint, ModelStatus, PrimingConfig, SlotStatus,
};
