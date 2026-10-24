//! Hardware detection, metrics collection, and VRAM budget planning.

pub mod auto_config;
pub mod lanes;
pub mod metrics;
pub mod presets;
pub mod vram;

pub use auto_config::{
    auto_configure, config_for_tier, detect_tier, list_all_presets, AutoConfig, BrainSwapPolicy,
    HardwareTier, SlotRecommendation,
};
pub use lanes::{LaneAllocation, LaneBudget, LaneCapacity, LaneKind, LaneStatus};
pub use metrics::{collect_hardware, HardwareMetrics, HardwareMonitor};
pub use presets::{
    config_for_tier as config_for_tier_from_toml, load_default_presets, PresetBlueprint,
    PresetsError, ResolvedRec,
};
pub use vram::{compute_budget, BudgetStatus, SlotBudgetEntry, VramBudget};
