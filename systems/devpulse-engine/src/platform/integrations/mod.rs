//! Model Loader integration — implements consumer traits for DevPulse.
//!
//! This is where the self-enclosed `model-loader` crate meets DevPulse:
//! - `LibSqlConfig` implements `ConfigBackend` using the platform's LibSQL
//! - `TauriEventBridge` implements `LoaderEventSink` using Tauri events
//! - `narration` maps `LoaderEvent` to Clyffy messages
//! - `slots` provides the default DevPulse slot configuration

#[cfg(feature = "inference")]
pub mod config;
#[cfg(feature = "inference")]
pub mod events;
#[cfg(feature = "inference")]
pub mod narration;
#[cfg(feature = "inference")]
pub mod slots;

// Re-export inference bridge types for Tauri command layer
#[cfg(feature = "inference")]
pub use devpulse_clyffy::model_loader::{InferenceHandle, InferenceResponse};
