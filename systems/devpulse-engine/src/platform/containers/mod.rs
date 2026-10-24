//! Containers for your projects — Docker or Podman, set up properly.
//!
//! First run's "Your dev environment" stage (plan 0001, stage 3b) reads this
//! module. It detects what this machine has
//! ([`detect`]), turns those facts and your few answers into a recommendation
//! with its reasons and sources, and runs each setup step only when you ask.
//!
//! `DevPulse` itself is not built or run in containers (CLAUDE.md, "No
//! Docker"); this sets up a container engine for the projects you work on.

pub mod actions;
pub mod advice;
pub mod detect;
pub mod service;

pub use actions::StepRun;
pub use service::{Containers, ContainersState};

pub use advice::{
    advise, Advice, AdviceConfig, Answers, Point, PointCode, Product, Source, Step, StepKind, Usage,
};
pub use detect::{
    detect, ContainersReport, EngineReport, HostReport, MachineReport, VirtualizationReport,
    WslReport,
};
