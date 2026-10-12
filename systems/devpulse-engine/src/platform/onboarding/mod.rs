//! Onboarding — install, configure, and maintain every AI capability.
//!
//! The engine owns this boundary. Every capability (Brain, Vision, Voice,
//! Memory) is an *endpoint*: a base URL speaking a known protocol, running
//! embedded on this machine or on a server. Onboarding finds endpoints,
//! identifies them, installs and maintains capabilities on them, and writes
//! the resulting AI configuration into the kernel.
//!
//! The UI holds no logic: it renders what this boundary emits and sends
//! the user's choices back as intents.
//!
//! See `.plan/0001-engine--rebuild-onboarding-workflow.md`.
//!
//! # Layout (one file per adapter — add one, register it, done)
//!
//! - [`probes`] — identify the protocol an endpoint speaks.
//!
//! # Honesty rule
//!
//! Nothing is assumed. An endpoint's protocol and models come only from a
//! live handshake, and every outcome is reported exactly as it happened.

pub mod probes;

pub use probes::{identify, EndpointCapabilities, EndpointProbe, EndpointProtocol, ProbeOutcome};
