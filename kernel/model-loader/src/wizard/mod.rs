//! Wizard module — SSOT for setup wizard content.
//!
//! Owns:
//! - User-facing copy (titles, subtitles, button labels, descriptions)
//! - Tooltip strings (the WHAT — structural explanations)
//! - Tier display metadata (name, description, semantic role)
//!
//! Does NOT own:
//! - Knowledge drops (the WHY — educational content) — separate `knowledge_drops` table
//! - CSS tokens or hex colors — frontend maps semantic roles to design tokens
//! - Layout structure — frontend route pages compose `ColdLight` components
//!
//! Loading priority (first match wins):
//!  1. `{userdata}/config/wizard_copy.toml` (user override)
//!  2. `systems/devpulse-engine/config/wizard_copy.default.toml` (embedded default)
//!
//! Reload: copy is loaded once at boot. To reload, restart the platform or
//! call `WizardCopy::reload(path)` from the devtools UI.

pub mod analytics;
pub mod copy;
pub mod tier_display;
pub mod tooltips;

pub use analytics::{emit_event, AnalyticsEvent};
pub use copy::{
    ActivateCopy, AuthCopy, BrowseCopy, CompletionCopy, CustomizeCopy, GreetingCopy, HardwareCopy,
    ModelsCopy, ProfileCopy, RuntimePickerCopy, ScanningCopy, WizardCopy,
};
pub use tier_display::{TierDisplay, TierRole};
pub use tooltips::{StepTooltips, TooltipEntry};
