//! Verb handlers for the persona MCP server.
//!
//! Each submodule owns one namespace of the verb surface from
//! `CLYFFY-COGNITIVE-FOUNDATION.md` §2.
//!
//! Slice 1 ships only `persona.*`. `knowledge.*` lands in Slice 2 with
//! the orchestrator, and `rrd.*` lands in Slice 5 with the bi-temporal
//! RRO production pipeline.
//!
//! `knowledge.*` is the engine-facing namespace for what the kernel
//! calls the Connectome (`kernel_terms.toml`). Kernel terms stay
//! kernel-side; verb namespaces use the engine label.

pub mod persona;

pub use persona::{
    PersonaListArgs, PersonaListResult, PersonaLoadArgs, PersonaLoadResult, PersonaRecallArgs,
    PersonaRecallResult, PersonaSaveArgs, PersonaSaveResult,
};
