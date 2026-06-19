//! Verb handlers for the persona MCP server.
//!
//! Each submodule owns one namespace of the verb surface from
//! `CLYFFY-COGNITIVE-FOUNDATION.md` §2.
//!
//! Slice 1 ships only `persona.*`. `cortex.*` lands in Slice 2 with the
//! orchestrator, and `rrd.*` lands in Slice 5 with the bi-temporal RRO
//! production pipeline.

pub mod persona;

pub use persona::{
    PersonaListArgs, PersonaListResult, PersonaLoadArgs, PersonaLoadResult, PersonaRecallArgs,
    PersonaRecallResult, PersonaSaveArgs, PersonaSaveResult,
};
