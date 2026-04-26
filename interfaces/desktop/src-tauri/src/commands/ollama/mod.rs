//! Ollama Tauri commands.
//!
//! Single umbrella for the operator-facing Ollama surface. Inside:
//!
//! - [`sidecar`] — managed-process lifecycle (start/stop/restart) plus
//!   status, health, config, and the model verbs (list/pull/delete).
//!   Wraps the engine's `OllamaService`.
//!
//! Future submodules (e.g. proxied Ollama API verbs) can land here
//! without churning consumers — the frontend imports from
//! [`infra/ollama`](../../../../src/lib/domains/infra/ollama/index.ts).

pub mod sidecar;
