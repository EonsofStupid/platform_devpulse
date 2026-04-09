//! Hardware detection, metrics collection, and VRAM budget planning.

pub mod auto_config;
pub mod metrics;
pub mod vram;

pub use auto_config::{auto_configure, detect_tier, AutoConfig, BrainSwapPolicy, HardwareTier, SlotRecommendation};
pub use metrics::{collect_hardware, HardwareMetrics, HardwareMonitor};
pub use vram::{compute_budget, BudgetStatus, SlotBudgetEntry, VramBudget};
