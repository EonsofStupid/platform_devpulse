//! Slot system — hierarchical named positions for model assignment.

pub mod defaults;
pub mod fallback;
pub mod persistence_class;
pub mod registry;
pub mod types;

pub use defaults::{load_default_slots, SlotDefaultsError, BASELINE_SLOT_IDS};
pub use persistence_class::PersistenceClass;
pub use registry::SlotRegistry;
pub use types::{DevicePreference, LoadingStrategy, ModelCapability, ModelSourceTier, Slot};
