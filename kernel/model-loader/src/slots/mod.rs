//! Slot system — hierarchical named positions for model assignment.

pub mod fallback;
pub mod registry;
pub mod types;

pub use registry::SlotRegistry;
pub use types::{DevicePreference, LoadingStrategy, ModelCapability, ModelSourceTier, Slot};
