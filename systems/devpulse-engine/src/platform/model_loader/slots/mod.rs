//! Slot system — hierarchical named positions for model assignment.

pub mod defaults;
pub mod fallback;
pub mod kv_cache;
pub mod persistence_class;
pub mod registry;
pub mod symlink;
pub mod types;

pub use defaults::{load_default_slots, SlotDefaultsError, BASELINE_SLOT_IDS};
pub use kv_cache::{KvCacheConfig, KvCacheQuant, RopeScalingMode, YarnConfig};
pub use persistence_class::PersistenceClass;
pub use registry::SlotRegistry;
pub use types::{DevicePreference, LoadingStrategy, ModelCapability, ModelSourceTier, Slot};
