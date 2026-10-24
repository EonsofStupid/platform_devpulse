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
//! - [`probes`] — identify the protocol an AI endpoint speaks. Moves to the
//!   kernel's provider adapters in plan 0001 R5 (slice 5).
//!
//! # Honesty rule
//!
//! Nothing is assumed. Everything shown was really found, and every outcome
//! is reported exactly as it happened.

pub mod detect;
pub mod flow;
pub mod probes;
pub mod scan;
pub mod state;
pub mod store;
pub mod workflow;
pub mod you;

pub use flow::{Flow, LoadedFlow, Stage};
pub use probes::{identify, EndpointCapabilities, EndpointProbe, EndpointProtocol, ProbeOutcome};
pub use state::{Detected, DetectedFolder, OnboardingState, OnboardingStatus, Requirement};
pub use workflow::Onboarding;
