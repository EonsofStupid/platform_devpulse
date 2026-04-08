//! Model loading lifecycle — state machine, safe loading, hot-swap, priming.

pub mod prime;
pub mod safe;
pub mod states;
pub mod swap;

pub use prime::{KvCacheInfo, ModelPrimer, PrimingBackend, PrimingResult};
pub use states::{LoadParams, LoadingStage, MemoryFootprint, ModelStatus, PrimingConfig, SlotStatus};
