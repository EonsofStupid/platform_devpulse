//! Reasoning subsystem — RRO (Reasoning-Ready Object) lifecycle.
//!
//! # What this is
//!
//! The public vocabulary surface for the RRO state machine. Maps 1:1 to
//! `signals.registry.yaml` — the one-sided IP protection registry.
//!
//! The state machine covers the rumination lifecycle:
//!
//! ```text
//!   idle ──► gathering ──► processing ──► ruminating ──► ready
//!             │                                │
//!             └──► purged ◄───────────────────┘
//!                    │
//!                    └──► forked ──► gathering
//! ```
//!
//! # Architecture
//!
//! Same tier as [`telemetry::TelemetryHandle`] — a runtime handle stored
//! on `Platform`. Clone-friendly (Arc-wrapped), not a `Service`
//! (no lifecycle, no ping — owned by the platform).
//!
//! The kernel rumination loop (future) will drive transitions. The engine
//! façade exposes the current snapshot + the control verbs. For now, the
//! handle records transitions, emits events, and persists history to the
//! analytics DB for dev tool replay.

pub mod grammar;
pub mod rro_state;

pub use grammar::{GrammarFailure, GrammarHandle, GrammarKind, GrammarSnapshot, GrammarStatus};
pub use rro_state::{
    RroDepth, RroState, RroStateHandle, RroStateSnapshot, RroStateTransition, DEFAULT_PROXIMITY,
};
