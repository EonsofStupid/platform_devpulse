// orchestrator/src/runtime/mod.rs

//! DevPulse Runtime - Unified subsystem ownership
//!
//! The runtime owns all subsystems and provides:
//! - Unified initialization
//! - Experiment flags (runtime toggles)
//! - Tracy profiler integration
//! - Lab-observable state

mod experiments;
mod runtime;

pub use experiments::{Experiments, ExperimentsSnapshot};
pub use runtime::{Cortex, DevPulseRuntime, Inference, RuntimeHandle, RuntimeSnapshot, Storage};
