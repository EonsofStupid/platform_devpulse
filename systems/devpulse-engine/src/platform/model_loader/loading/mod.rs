//! Loading lifecycle — the pure-data model-status types shared across the
//! management layer (slot status snapshots, memory footprint, load
//! parameters).
//!
//! Only the shared TYPES are relocated here. The actual load / prime /
//! swap orchestration is inference and runs on headless Clyffy/GB10
//! (kernel-severance) — `loading::{prime, safe, swap}` are NOT part of
//! this crate.

pub mod states;

pub use states::{
    LoadParams, LoadingStage, MemoryFootprint, ModelStatus, PrimingConfig, SlotStatus,
};
