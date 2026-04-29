//! Ollama sidecar — managed `ollama serve` child process.
//!
//! The kernel owns the lifecycle (spawn / attach / health / shutdown,
//! HTTP client, model commands). This module wraps the kernel adapter
//! with the platform `Service` trait.
//!
//! Submodules:
//! - [`service`] — `OllamaService` wrapper + `Service` impl.
//!
//! Future submodules as work lands:
//! - `config` — user-scope persisted preferences (binary path override,
//!   default keep-alive, etc.). Currently inline in kernel `OllamaConfig`.
//! - `preflight` — pre-launch checks (binary present, port free).

pub mod service;

pub use service::{OllamaModel, OllamaService};
