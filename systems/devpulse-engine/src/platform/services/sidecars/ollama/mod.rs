//! Ollama sidecar — managed `ollama serve` child process.
//!
//! DevPulse owns the full lifecycle (spawn / attach / health / shutdown,
//! HTTP client, model commands). This module wraps the adapter with the
//! platform `Service` trait.
//!
//! Submodules:
//! - [`adapter`] — `OllamaAdapter`: lifecycle, port resolution, raw API.
//! - `port_alloc` — probe / attach / bump port allocation for the sidecar.
//! - [`service`] — `OllamaService` wrapper + `Service` impl.

mod adapter;
mod port_alloc;
pub mod service;

pub use service::{OllamaModel, OllamaService};
