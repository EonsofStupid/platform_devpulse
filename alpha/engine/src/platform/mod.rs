// engine/src/platform/mod.rs

//! Platform-specific sensors

mod process;
mod window;

pub use process::ProcessSensor;
pub use window::WindowSensor;
