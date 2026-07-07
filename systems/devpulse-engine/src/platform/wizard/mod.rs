//! Onboarding wizard content (Tier-1, DevPulse; non-AI): typed analytics
//! events, scripted copy, and hardware-tier display metadata.
//!
//! Content, not logic — greetings, hints, button labels, event vocabulary,
//! tier badges. It lives in the engine (DevPulse's core), never the AI-only
//! kernel. The frontend reads it via Tauri commands and renders it directly.

pub mod analytics;
pub mod copy;
pub mod tier_display;

pub use analytics::{emit_event, AnalyticsEvent};
pub use copy::WizardCopy;
pub use tier_display::{TierDisplay, TierRole};
