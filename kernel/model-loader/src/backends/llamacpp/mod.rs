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

// Vision GGUFs via mtmd are gated behind a separate feature. Off by
// default because the v0.1.1 prebuilt zip omits mtmd headers; turning
// this on without re-cutting the prebuilt with mtmd staged will fail
// at bindgen.
#[cfg(feature = "llama-cpp-mtmd")]
pub mod mtmd;

#[cfg(feature = "llama-cpp-ffi")]
pub use backend::LlamaCppBackend;

#[cfg(feature = "llama-cpp-mtmd")]
pub use mtmd::LlamaCppMtmdBackend;
