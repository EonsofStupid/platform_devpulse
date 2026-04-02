//! ONNX Runtime backends via `ort` crate.
//!
//! All non-LLM voice models run through ort:
//! - SNAC audio decoder (audio tokens → PCM waveform)
//! - Whisper STT (audio → text)
//! - Kokoro TTS fallback (text → audio)

pub mod kokoro;
pub mod snac;
pub mod whisper;
