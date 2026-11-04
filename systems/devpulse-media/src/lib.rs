//! `DevPulse` Media Pipeline
//!
//! Camera capture, background removal, composition, output routing,
//! and audio-file decode for the voice loop. Originally video-focused
//! ("OBS core" of `DevPulse`); audio decode added 2026-04-26 so engine
//! and Tauri callers share one helper for mp3/wav → mono PCM
//! conversion (Whisper STT + Qwen3-TTS voice-clone reference ingest).

pub mod audio_decode;
pub mod capture;
pub mod error;
pub mod frame;
pub mod pipeline;
pub mod voice_activity;

// Re-exports for convenience
pub use audio_decode::{
    DecodedAudio, QWEN3_TTS_SAMPLE_RATE, WHISPER_SAMPLE_RATE, decode_audio_bytes,
    decode_audio_file_to_pcm, decode_to_qwen3_tts_reference, decode_to_whisper,
};
pub use capture::CameraManager;
pub use error::{MediaError, MediaResult};
pub use frame::Frame;
pub use pipeline::MediaPipeline;
pub use voice_activity::trim_to_voice;
