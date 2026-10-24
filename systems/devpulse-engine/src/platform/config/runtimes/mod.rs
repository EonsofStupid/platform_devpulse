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
//! - `ollama` — Ollama as a managed child process
//! - `llama_server` — GGUF models served by llama.cpp's own `llama-server`,
//!   a supervised subprocess (plan 0007); nothing of llama.cpp is compiled in.
//! - `devforge` — VS Code Remote Extension Host
//!
//! See `config/platform/runtimes/` for the TOML layout.
