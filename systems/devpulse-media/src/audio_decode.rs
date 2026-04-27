//! Audio file → PCM decoding for the voice loop.
//!
//! Wraps `rodio::Decoder` (which delegates to symphonia / minimp3 / etc.
//! transitively) so callers don't have to drag the rodio dep in directly.
//! Handles WAV, MP3, FLAC, Vorbis out of the box. Stereo tracks are
//! downmixed to mono by averaging channels.
//!
//! Lifted from `interfaces/desktop/src-tauri/src/commands/voice/mod.rs`
//! 2026-04-26 so engine layer code (auto-transcribe-on-upload, Qwen3-TTS
//! reference ingest, future media pipeline integrations) can call it
//! without going through a Tauri command. The original lives at the same
//! call sites; this module is the canonical home going forward.
//!
//! ## Resampling quality
//!
//! The resampler is a simple **linear interpolation** at present. This
//! is the same algorithm the source-of-truth helper has been running in
//! production for the Whisper STT path — Whisper at 16 kHz tolerates
//! aliasing well because the model focuses on phonetic content, not
//! high-frequency timbre.
//!
//! For the **Qwen3-TTS voice-clone reference** path the quality bar is
//! higher: the reference clip directly determines voice character, and
//! aliased high frequencies degrade the cloned voice. Upgrade path is
//! [`rubato`](https://docs.rs/rubato) (already a transitive dep via the
//! `qwen3-tts` crate) — its `Fft` / `SincFixedIn` resamplers are
//! polyphase + anti-aliased. Hold the upgrade until a voice-corpus
//! listen-test validates the lift; swapping algorithms without measured
//! before/after would be speculative.
//!
//! ## Threading
//!
//! Runs on the current thread. Callers should wrap in `spawn_blocking`
//! since `rodio::Decoder` is sync I/O — the existing voice/STS pipeline
//! does this via `devpulse_telemetry::spawn_blocking`.

use std::path::Path;

/// Decode an audio file (WAV / MP3 / FLAC / Vorbis) into mono f32 PCM
/// at the requested sample rate.
///
/// Returns samples normalised to `[-1.0, 1.0]`.
///
/// # Errors
/// Returns a string error if the file cannot be opened, the decoder
/// fails to identify the format, or the decoded stream produces zero
/// samples.
pub fn decode_audio_file_to_pcm(path: &Path, target_rate: u32) -> Result<Vec<f32>, String> {
    use rodio::{Decoder, Source};

    let file = std::fs::File::open(path)
        .map_err(|e| format!("Failed to open audio file {}: {e}", path.display()))?;
    let reader = std::io::BufReader::new(file);

    let decoder = Decoder::new(reader)
        .map_err(|e| format!("Failed to decode audio file {}: {e}", path.display()))?;

    let source_rate = decoder.sample_rate();
    let source_channels = decoder.channels() as usize;
    tracing::info!(
        path = %path.display(),
        sample_rate = source_rate,
        channels = source_channels,
        target_rate,
        "Decoding audio file"
    );

    // rodio's Decoder yields i16 samples; convert to f32 in [-1.0, 1.0].
    let raw: Vec<f32> = decoder.map(|s| f32::from(s) / 32_768.0).collect();
    if raw.is_empty() {
        return Err(format!(
            "Audio file {} decoded to zero samples",
            path.display()
        ));
    }

    // Downmix to mono by averaging channels.
    let mono: Vec<f32> = if source_channels > 1 {
        raw.chunks(source_channels)
            .map(|chunk| chunk.iter().sum::<f32>() / source_channels as f32)
            .collect()
    } else {
        raw
    };

    // Resample via linear interpolation if needed.
    if source_rate == target_rate {
        return Ok(mono);
    }
    let ratio = f64::from(target_rate) / f64::from(source_rate);
    let new_len = (mono.len() as f64 * ratio) as usize;
    let mut resampled = Vec::with_capacity(new_len);
    for i in 0..new_len {
        let src_pos = i as f64 / ratio;
        let idx = src_pos as usize;
        let frac = (src_pos - idx as f64) as f32;
        let sample = if idx + 1 < mono.len() {
            mono[idx] * (1.0 - frac) + mono[idx + 1] * frac
        } else if idx < mono.len() {
            mono[idx]
        } else {
            0.0
        };
        resampled.push(sample);
    }
    Ok(resampled)
}

/// Whisper STT input convention — 16 kHz mono PCM.
pub const WHISPER_SAMPLE_RATE: u32 = 16_000;

/// Qwen3-TTS reference-clip convention — 24 kHz mono PCM.
pub const QWEN3_TTS_SAMPLE_RATE: u32 = 24_000;

/// Convenience: decode a file into 16 kHz mono PCM (Whisper STT input).
///
/// # Errors
/// See [`decode_audio_file_to_pcm`].
pub fn decode_to_whisper(path: &Path) -> Result<Vec<f32>, String> {
    decode_audio_file_to_pcm(path, WHISPER_SAMPLE_RATE)
}

/// Convenience: decode a file into 24 kHz mono PCM (Qwen3-TTS reference
/// clip input). Use before `qwen3_tts::AudioBuffer::load` if pre-resampling
/// is desired (the crate handles decode internally for known formats, but
/// pre-canonicalising removes a class of "wrong sample rate" surprises).
///
/// # Errors
/// See [`decode_audio_file_to_pcm`].
pub fn decode_to_qwen3_tts_reference(path: &Path) -> Result<Vec<f32>, String> {
    decode_audio_file_to_pcm(path, QWEN3_TTS_SAMPLE_RATE)
}
