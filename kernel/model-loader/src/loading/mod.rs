//! Model loading lifecycle — state machine, safe loading, hot-swap.

pub mod safe;
pub mod states;
pub mod swap;

pub use states::{LoadParams, LoadingStage, MemoryFootprint, ModelStatus, SlotStatus};
