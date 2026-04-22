//! Runtimes axis — process / model execution backends.
//!
//! Members execute something: a model, a VS Code server, an external sidecar.
//! They differ from stores (which persist state) and capabilities (which
//! expose user verbs). Members here are commonly
//! [`super::super::module::StartMode::Lazy`] or
//! [`super::super::module::StartMode::OnDemand`] because start cost is
//! significant and the user may never need a given runtime.
//!
//! # Modules (authored as S0 phases land)
//!
//! - `candle` — in-process Candle inference
//! - `ollama_sidecar` — Ollama as a sidecar process
//! - `llama_cpp_embedded` — in-process GGUF via `llama-cpp-2` crate.
//!   TODO(reality-gap 2026-04-21): renamed from `ollama_embedded`.
//!   Candle does not subsume this gap — Candle is architecture-by-
//!   architecture, llama.cpp covers the GGUF long tail. Backend not
//!   yet authored. See SPRINT-REALITY-GAP-CLOSE Phase 2 Option A.
//! - `devforge` — VS Code Remote Extension Host
//!
//! See `config/platform/runtimes/` for the TOML layout.
