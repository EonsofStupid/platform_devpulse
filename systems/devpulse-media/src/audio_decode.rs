//! Audio file → PCM decoding for the voice loop.
//!
//! Wraps `rodio::Decoder` (which delegates to symphonia transitively) so
//! callers don't have to drag the rodio dep in directly. Handles WAV, MP3,
//! FLAC, Vorbis and AAC in MP4 out of the box. Stereo tracks are downmixed to
//! mono by averaging channels.
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

/// Decode an audio file (WAV / MP3 / FLAC / Vorbis / AAC in MP4) into mono f32
/// PCM at the requested sample rate.
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

    let decoder = Decoder::try_from(file)
        .map_err(|e| format!("Failed to decode audio file {}: {e}", path.display()))?;

    let source_rate = decoder.sample_rate().get();
    let source_channels = usize::from(decoder.channels().get());
    tracing::info!(
        path = %path.display(),
        sample_rate = source_rate,
        channels = source_channels,
        target_rate,
        "Decoding audio file"
    );

    // rodio's Decoder yields f32 samples already normalised to [-1.0, 1.0].
    let raw: Vec<f32> = decoder.collect();
    if raw.is_empty() {
        return Err(format!(
            "Audio file {} decoded to zero samples",
            path.display()
        ));
    }

    // Downmix to mono by averaging channels.
    // SAFETY: `source_channels` is a channel count (≤ 8 in practice, hard
    // capped at WAV's u16 channel limit upstream); the `as f32` cast is
    // exact for every value we will ever see.
    #[expect(
        clippy::cast_precision_loss,
        reason = "audio channel count fits in f32 mantissa (≤ 65535); cast is exact"
    )]
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
    // SAFETY: Linear-interpolation resampling. `mono.len() * ratio` is the
    // target sample count; `src_pos` is the source-domain coordinate. All
    // casts are documented sample-rate math, not precision-critical paths.
    #[expect(
        clippy::cast_precision_loss,
        reason = "audio resampling: usize sample index → f64 source coordinate. \
                  Sample counts ≤ a few hours * 48 kHz stay well inside f64 mantissa."
    )]
    #[expect(
        clippy::cast_sign_loss,
        reason = "audio resampling: f64 source coordinate → usize sample index. \
                  `src_pos = i / ratio` is non-negative because both i and ratio are non-negative."
    )]
    let resampled = {
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
        resampled
    };
    Ok(resampled)
}

/// Audio decoded from bytes, as the source had it.
#[derive(Debug, Clone, PartialEq)]
pub struct DecodedAudio {
    /// Interleaved samples normalised to `[-1.0, 1.0]`.
    pub samples: Vec<f32>,
    /// Samples per second, per channel.
    pub sample_rate: u32,
    /// Interleaved channel count.
    pub channels: u16,
}

/// Decode encoded audio held in memory (what a speech server answers with).
///
/// # Errors
/// Returns a string error if the format is not recognised or the stream decodes
/// to zero samples.
pub fn decode_audio_bytes(bytes: Vec<u8>) -> Result<DecodedAudio, String> {
    use rodio::{Decoder, Source};

    let decoder = Decoder::try_from(std::io::Cursor::new(bytes))
        .map_err(|e| format!("Failed to decode audio: {e}"))?;
    let sample_rate = decoder.sample_rate().get();
    let channels = decoder.channels().get();
    let samples: Vec<f32> = decoder.collect();
    if samples.is_empty() {
        return Err("Audio decoded to zero samples".to_owned());
    }
    Ok(DecodedAudio {
        samples,
        sample_rate,
        channels,
    })
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

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, reason = "test assertions")]

    use super::*;

    /// A 16-bit PCM WAV of interleaved `samples`.
    fn wav(channels: u16, sample_rate: u32, samples: &[i16]) -> Vec<u8> {
        let data_len = u32::try_from(samples.len() * 2).unwrap();
        let mut bytes = Vec::new();
        bytes.extend_from_slice(b"RIFF");
        bytes.extend_from_slice(&(36 + data_len).to_le_bytes());
        bytes.extend_from_slice(b"WAVEfmt ");
        bytes.extend_from_slice(&16u32.to_le_bytes());
        bytes.extend_from_slice(&1u16.to_le_bytes());
        bytes.extend_from_slice(&channels.to_le_bytes());
        bytes.extend_from_slice(&sample_rate.to_le_bytes());
        bytes.extend_from_slice(&(sample_rate * u32::from(channels) * 2).to_le_bytes());
        bytes.extend_from_slice(&(channels * 2).to_le_bytes());
        bytes.extend_from_slice(&16u16.to_le_bytes());
        bytes.extend_from_slice(b"data");
        bytes.extend_from_slice(&data_len.to_le_bytes());
        for sample in samples {
            bytes.extend_from_slice(&sample.to_le_bytes());
        }
        bytes
    }

    fn decoded(file: &str, bytes: &[u8], target_rate: u32) -> Vec<f32> {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join(file);
        std::fs::write(&path, bytes).unwrap();
        decode_audio_file_to_pcm(&path, target_rate).unwrap()
    }

    #[test]
    fn bytes_decode_as_the_source_had_them() {
        let audio = decode_audio_bytes(wav(2, 24_000, &[16_384, -16_384, 0, 0])).unwrap();
        assert_eq!(audio.sample_rate, 24_000);
        assert_eq!(audio.channels, 2);
        assert_eq!(audio.samples.len(), 4);
        assert!((audio.samples[0] - 0.5).abs() < 0.001);
    }

    #[test]
    fn bytes_that_are_not_audio_fail() {
        assert!(decode_audio_bytes(b"{\"error\":\"nope\"}".to_vec()).is_err());
    }

    #[test]
    fn decoded_samples_stay_normalised() {
        let mono = decoded("mono.wav", &wav(1, 16_000, &[16_384, -16_384, 0]), 16_000);
        assert_eq!(mono.len(), 3);
        assert!((mono[0] - 0.5).abs() < 0.001, "first sample {}", mono[0]);
        assert!((mono[1] + 0.5).abs() < 0.001, "second sample {}", mono[1]);
        assert!(mono[2].abs() < 0.001, "third sample {}", mono[2]);
    }

    #[test]
    fn stereo_is_averaged_to_mono() {
        let mono = decoded(
            "stereo.wav",
            &wav(2, 16_000, &[16_384, 0, -16_384, 0]),
            16_000,
        );
        assert_eq!(mono.len(), 2);
        assert!((mono[0] - 0.25).abs() < 0.001, "first sample {}", mono[0]);
        assert!((mono[1] + 0.25).abs() < 0.001, "second sample {}", mono[1]);
    }

    #[test]
    fn other_rates_are_resampled() {
        let samples = vec![8_192i16; 1_000];
        let resampled = decoded("rate.wav", &wav(1, 8_000, &samples), 16_000);
        assert_eq!(resampled.len(), 2_000);
        assert!(resampled.iter().all(|s| (s - 0.25).abs() < 0.001));
    }
}
