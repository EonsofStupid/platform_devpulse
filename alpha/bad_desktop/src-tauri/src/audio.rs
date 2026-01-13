//! Audio utilities for WAV encoding/decoding
//!
//! Converts between f32 samples and WAV byte format.
//! Used by voice commands for TTS/STT.

use std::io::Cursor;

/// Convert f32 samples to WAV bytes (16-bit mono)
pub fn samples_to_wav(samples: &[f32], sample_rate: u32) -> Vec<u8> {
    use hound::{SampleFormat, WavSpec, WavWriter};

    let spec = WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: SampleFormat::Int,
    };

    let mut cursor = Cursor::new(Vec::new());
    let mut writer = WavWriter::new(&mut cursor, spec).unwrap();
    for &sample in samples {
        let s = (sample * 32767.0).clamp(-32768.0, 32767.0) as i16;
        writer.write_sample(s).unwrap();
    }
    writer.finalize().unwrap();
    cursor.into_inner()
}

/// Convert WAV bytes to f32 samples
pub fn wav_to_samples(wav_bytes: &[u8]) -> Result<Vec<f32>, String> {
    use hound::WavReader;

    let cursor = Cursor::new(wav_bytes);
    let mut reader = WavReader::new(cursor).map_err(|e| e.to_string())?;

    let samples: Vec<f32> = reader
        .samples::<i16>()
        .filter_map(|s| s.ok())
        .map(|s| s as f32 / 32768.0)
        .collect();

    Ok(samples)
}
