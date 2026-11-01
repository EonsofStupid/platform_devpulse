//! Onboarding — first run: the person, their projects, their AI.
//!
//! The engine owns the first-run workflow. The UI holds no logic: it renders
//! the `Onboarding` state this module publishes and sends your choices back
//! as intents; Rust validates, decides and writes to Turso.
//!
//! See `.plan/0001-engine--rebuild-onboarding-workflow.md` ("First run — the
//! full experience", slices).
//!
//! # Layout
//!
//! - [`flow`] — which stages, in what order (configuration with a default).
//! - [`store`] — progress on the profile row in Turso.
//! - [`state`] — the `Onboarding` state every window renders.
//! - [`workflow`] — your intents in, the state out; gates live here.
//! - [`detect`] — what this machine already tells us (git identity, folders
//!   that hold repositories).
//! - [`you`] — the "You" form: name, email, projects folder.
//! - [`scan`] — the repositories in your projects folder, with languages.
//!
//! AI endpoint protocol discovery belongs to
//! `devpulse_clyffy::providers::adapters` in the kernel.
//!
//! # Honesty rule
//!
//! Nothing is assumed. Everything shown was really found, and every outcome
//! is reported exactly as it happened.

pub mod detect;
pub mod flow;
pub mod scan;
pub mod state;
pub mod store;
pub mod workflow;
pub mod you;

pub use flow::{Flow, LoadedFlow, Stage};
pub use state::{Detected, DetectedFolder, OnboardingState, OnboardingStatus, Requirement};
pub use workflow::Onboarding;
