//! Sherpa-rs backend — Whisper STT and Kokoro TTS.
//!
//! Uses `sherpa-rs` crate for speech models that don't fit the
//! Candle/llama.cpp paradigm. Sherpa wraps native C++ inference
//! with a Rust-safe API.

pub mod stt;
pub mod tts;
