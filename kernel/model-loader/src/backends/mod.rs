//! Inference backends — Candle, llama.cpp, ONNX Runtime, and Orpheus TTS.

pub mod bridge;
pub mod candle;
pub mod llamacpp;
pub mod orpheus;
pub mod ort;
pub mod phoneme;
pub mod piper;
pub mod pool;
pub mod router;
pub mod voice;
pub mod voice_pool;

pub use bridge::{InferenceBridge, InferenceHandle, InferenceRequest, InferenceResponse};
pub use pool::BackendPool;
pub use router::{candle_supports_architecture, select_backend};
pub use voice::{AudioDecoderBackend, AudioSamples, SttBackend, TtsBackend};
pub use voice_pool::VoicePool;
