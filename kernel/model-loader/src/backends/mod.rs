//! Inference backends — Candle, llama.cpp, ONNX Runtime, and Sherpa implementations.

pub mod bridge;
pub mod candle;
pub mod orpheus;
pub mod ort;
pub mod pool;
pub mod router;
pub mod sherpa;
pub mod voice;

pub use bridge::{InferenceBridge, InferenceHandle, InferenceRequest, InferenceResponse};
pub use pool::BackendPool;
pub use router::{candle_supports_architecture, select_backend};
pub use voice::{AudioDecoderBackend, AudioSamples, SttBackend, TtsBackend};
