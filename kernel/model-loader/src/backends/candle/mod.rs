//! Candle inference backend — canonical, Rust-native.

#[cfg(feature = "candle-backend")]
pub mod backend;

#[cfg(feature = "candle-backend")]
pub mod gemma3_embedding;

pub mod qwen3_tts;

pub mod siglip;

#[cfg(feature = "candle-backend")]
pub use backend::CandleBackend;

pub use qwen3_tts::Qwen3TtsBackend;

pub use siglip::SigLipVision;
