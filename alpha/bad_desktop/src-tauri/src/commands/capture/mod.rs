//! Screenshot and video capture module
//!
//! Provides:
//! - Full screen capture
//! - Region capture (x, y, width, height)
//! - Multi-monitor support
//! - Window enumeration
//! - Clipboard integration
//! - Storage management (global/project scope)

pub mod screenshot;
pub mod storage;
pub mod types;

pub use screenshot::*;
pub use storage::*;
#[allow(unused_imports)]
pub use types::*; // Re-export for external consumers
