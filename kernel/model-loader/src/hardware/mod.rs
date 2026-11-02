//! Hardware detection, metrics collection, and VRAM budget planning.

pub mod auto_config;
pub mod lanes;
pub mod metrics;
pub mod presets;
pub mod vram;

pub use auto_config::{
    AutoConfig, BrainSwapPolicy, HardwareTier, SlotRecommendation, auto_configure, config_for_tier,
    detect_tier, list_all_presets,
};
pub use lanes::{LaneAllocation, LaneBudget, LaneCapacity, LaneKind, LaneStatus};
pub use metrics::{HardwareMetrics, HardwareMonitor, HardwareSnapshot, collect_hardware};
pub use presets::{
    PresetBlueprint, PresetsError, ResolvedRec, config_for_tier as config_for_tier_from_toml,
    load_default_presets,
};
pub use vram::{BudgetStatus, SlotBudgetEntry, VramBudget, compute_budget};
