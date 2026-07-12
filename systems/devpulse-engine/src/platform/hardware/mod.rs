//! Local hardware detection + the Tier-1 (DevPulse) preset/budget planning
//! that maps a detected machine onto default model recommendations.
//!
//! - [`metrics`] / [`tier`] — pure local-machine introspection (CPU/RAM/GPU
//!   → a [`HardwareTier`] class). Non-AI.
//! - [`auto_config`] / [`presets`] — deterministic, config-driven mapping
//!   from a tier to per-slot model recommendations (read from
//!   `presets.default.toml`). This is MANAGEMENT (which model to suggest
//!   for which slot), not inference — engine-owned so DevPulse can plan
//!   standalone.
//! - [`lanes`] / [`vram`] — compute-lane vocabulary + the VRAM budget
//!   planner the slot picker uses to check a preset fits the machine.
//!
//! No inference backend is linked here; true inference runs on headless
//! Clyffy/GB10 over the wire.

pub mod auto_config;
pub mod lanes;
pub mod metrics;
pub mod presets;
pub mod tier;
pub mod vram;

pub use auto_config::{
    auto_configure, config_for_tier, detect_tier, list_all_presets, AutoConfig, BrainSwapPolicy,
    SlotRecommendation,
};
pub use lanes::{LaneAllocation, LaneBudget, LaneCapacity, LaneKind, LaneStatus};
pub use metrics::{collect_hardware, HardwareMetrics, HardwareMonitor};
pub use presets::{
    config_for_tier as config_for_tier_from_toml, load_default_presets, PresetBlueprint,
    PresetsError, ResolvedRec,
};
pub use tier::HardwareTier;
pub use vram::{compute_budget, BudgetStatus, SlotBudgetEntry, VramBudget};
