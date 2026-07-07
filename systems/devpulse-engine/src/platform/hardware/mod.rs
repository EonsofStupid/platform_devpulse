//! Local hardware detection — CPU/RAM/GPU metrics + the tier class they map to
//! (Tier-1, DevPulse; non-AI). Pure local-machine introspection; the AI-side
//! preset computation that consumes these lives with the model loader on
//! Clyffy.

pub mod metrics;
pub mod tier;

pub use metrics::HardwareMetrics;
pub use tier::HardwareTier;
