//! Inference backends — Candle and llama.cpp implementations behind a unified trait.

pub mod bridge;
pub mod candle;
pub mod pool;
pub mod router;

pub use bridge::{InferenceBridge, InferenceHandle, InferenceRequest, InferenceResponse};
pub use pool::BackendPool;
pub use router::{candle_supports_architecture, select_backend};
