//! DevPulse Media Pipeline
//!
//! Camera capture, background removal, composition, and output routing.
//! This is the "OBS core" of DevPulse.

pub mod capture;
pub mod error;
pub mod frame;
pub mod pipeline;

// Re-exports for convenience
pub use capture::CameraManager;
pub use error::{MediaError, MediaResult};
pub use frame::Frame;
pub use pipeline::MediaPipeline;
