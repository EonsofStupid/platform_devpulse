//! The bundled `AgentHub` runtime and its private process contract.
//!
//! The desktop uses the client; the executable owns the retained catalog.
//! Agent and room extraction is tracked in plan 0009 R3b.0.

pub mod client;
pub mod history;
pub mod protocol;
