//! llama.cpp GGUF inference backend via the `llama-cpp-2` crate.
//!
//! Implements `InferenceBackend` for GGUF models. The `llama-cpp-2` crate
//! vendors llama.cpp and builds it via `CMake` — no external dependencies
//! beyond a C++ toolchain (and optionally CUDA toolkit for GPU).
//!
//! Thread safety: `LlamaModel` is Send+Sync (shared across threads).
//! `LlamaContext` is Send but NOT Sync — one context per inference thread,
//! which matches the `InferenceBridge` dedicated-thread pattern.

#[cfg(feature = "llama-cpp-ffi")]
pub mod backend;

#[cfg(feature = "llama-cpp-ffi")]
pub use backend::LlamaCppBackend;
