//! ONNX Runtime backends via `ort` crate.
//!
//! Voice + capability models run through ort:
//! - `SNAC` audio decoder (audio tokens → PCM waveform)
//! - `Whisper` STT (audio → text)
//! - `Kokoro` TTS (text → audio, with espeak-ng phonemization)
//! - `Qwen3` Embedder (text → dense vector)
//! - `Qwen3` Reranker (query+doc → relevance score)
//! - `SigLIP` 2 ONNX vision encoder (HD path; `FixRes` today, `NaFlex` deferred)

pub mod embedder;
pub mod kokoro;
pub mod reranker;
pub mod siglip_naflex;
pub mod snac;
pub mod whisper;
