//! The standard audio operations at a configured API base:
//! `POST {base}/audio/speech` and `POST {base}/audio/transcriptions`.
//! As with text, the base is explicit and already carries its version prefix.
use super::http;
use anyhow::{Context, Result, ensure};
use serde::Deserialize;

/// Interleaved PCM to upload. The upload format is this module's decision.
#[derive(Clone, Copy)]
pub struct EndpointAudio<'a> {
    /// Samples normalised to `[-1.0, 1.0]`.
    pub samples: &'a [f32],
    /// Samples per second, per channel.
    pub sample_rate: u32,
    /// Interleaved channel count.
    pub channels: u16,
}

/// One speech request. Intentionally no Debug: the text must not enter logs.
pub struct EndpointSpeechRequest<'a> {
    /// Explicit model; never selected by a fallback.
    pub model: &'a str,
    /// Text to speak.
    pub input: &'a str,
    /// A voice this server knows.
    pub voice: &'a str,
    /// Speed multiplier; omitted to leave the server's natural speed.
    pub speed: Option<f32>,
}

/// One transcription request. Intentionally no Debug: the audio must not enter logs.
pub struct EndpointTranscriptionRequest<'a> {
    /// Explicit model; never selected by a fallback.
    pub model: &'a str,
    /// What was heard.
    pub audio: EndpointAudio<'a>,
    /// ISO-639-1 hint; omitted to let the server detect the language.
    pub language: Option<&'a str>,
    /// Beam width, for a server that offers one; absent from the standard API.
    pub beam_size: Option<u32>,
}

#[derive(Deserialize)]
struct Transcription {
    text: String,
}

/// A value that can sit in a form field without changing the request's shape.
fn plain(value: &str, what: &str) -> Result<()> {
    ensure!(
        !value.trim().is_empty() && !value.chars().any(char::is_control),
        "{what} cannot be empty or contain control characters"
    );
    Ok(())
}

/// Ask the endpoint to speak. Returns the encoded audio it answered with.
/// # Errors
/// Invalid requests, transport errors, rejected requests, oversized answers and
/// answers that are not audio all fail.
pub async fn speak(
    endpoint: &str,
    key: Option<&str>,
    request: &EndpointSpeechRequest<'_>,
) -> Result<Vec<u8>> {
    plain(request.model, "Speech model")?;
    plain(request.voice, "Speech voice")?;
    ensure!(
        !request.input.trim().is_empty(),
        "There is no text to speak"
    );
    ensure!(
        request
            .speed
            .is_none_or(|n| n.is_finite() && (0.25..=4.0).contains(&n)),
        "Speech speed must be between 0.25 and 4"
    );
    let mut body = serde_json::json!({
        "model": request.model,
        "input": request.input,
        "voice": request.voice,
        "response_format": "wav",
    });
    if let Some(speed) = request.speed {
        body["speed"] = speed.into();
    }
    let response = http::post_for_audio(endpoint, key, "audio/speech", &body).await?;
    // A server can answer 200 with an error document; that is nothing to play.
    let textual = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .is_some_and(|v| {
            let v = v.trim_start().to_ascii_lowercase();
            v.starts_with("application/json") || v.starts_with("text/")
        });
    ensure!(!textual, "Endpoint did not return audio");
    let audio = http::bytes(response, http::AUDIO_LIMIT).await?;
    ensure!(!audio.is_empty(), "Endpoint returned no audio");
    Ok(audio)
}

/// Ask the endpoint what was said. An empty transcript is a real answer: silence.
/// # Errors
/// Invalid requests, transport errors, rejected requests and malformed answers fail.
pub async fn transcribe(
    endpoint: &str,
    key: Option<&str>,
    request: &EndpointTranscriptionRequest<'_>,
) -> Result<String> {
    plain(request.model, "Transcription model")?;
    let wav = wav_pcm16(request.audio)?;
    let boundary = format!("devpulse-{}", uuid::Uuid::new_v4().simple());
    let mut form = Vec::with_capacity(wav.len() + 1024);
    field(&mut form, &boundary, "model", request.model);
    field(&mut form, &boundary, "response_format", "json");
    if let Some(language) = request.language {
        plain(language, "Transcription language")?;
        field(&mut form, &boundary, "language", language);
    }
    if let Some(beam_size) = request.beam_size {
        field(&mut form, &boundary, "beam_size", &beam_size.to_string());
    }
    form.extend_from_slice(
        format!(
            "--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"audio.wav\"\r\nContent-Type: audio/wav\r\n\r\n"
        )
        .as_bytes(),
    );
    form.extend_from_slice(&wav);
    form.extend_from_slice(format!("\r\n--{boundary}--\r\n").as_bytes());
    let response = http::json(
        http::post_audio_form(endpoint, key, "audio/transcriptions", &boundary, form).await?,
    )
    .await?;
    let response: Transcription = serde_json::from_value(response)
        .map_err(|_| anyhow::anyhow!("Invalid transcription response"))?;
    Ok(response.text.trim().to_owned())
}

fn field(form: &mut Vec<u8>, boundary: &str, name: &str, value: &str) {
    form.extend_from_slice(
        format!(
            "--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n"
        )
        .as_bytes(),
    );
}

/// 16-bit PCM WAV: every transcription server reads it, and it stays small.
fn wav_pcm16(audio: EndpointAudio<'_>) -> Result<Vec<u8>> {
    let EndpointAudio {
        samples,
        sample_rate,
        channels,
    } = audio;
    ensure!(!samples.is_empty(), "There is no audio to transcribe");
    ensure!(
        sample_rate > 0 && channels > 0,
        "The audio reports no sample rate or channels"
    );
    let data_len = samples
        .len()
        .checked_mul(2)
        .filter(|n| *n <= http::AUDIO_LIMIT)
        .and_then(|n| u32::try_from(n).ok())
        .context("This audio is too long to upload")?;
    let block_align = channels
        .checked_mul(2)
        .context("The audio reports too many channels")?;
    let byte_rate = sample_rate
        .checked_mul(u32::from(block_align))
        .context("The audio reports too high a sample rate")?;
    let mut wav = Vec::with_capacity(44 + samples.len() * 2);
    wav.extend_from_slice(b"RIFF");
    wav.extend_from_slice(&(36 + data_len).to_le_bytes());
    wav.extend_from_slice(b"WAVEfmt ");
    wav.extend_from_slice(&16u32.to_le_bytes());
    wav.extend_from_slice(&1u16.to_le_bytes());
    wav.extend_from_slice(&channels.to_le_bytes());
    wav.extend_from_slice(&sample_rate.to_le_bytes());
    wav.extend_from_slice(&byte_rate.to_le_bytes());
    wav.extend_from_slice(&block_align.to_le_bytes());
    wav.extend_from_slice(&16u16.to_le_bytes());
    wav.extend_from_slice(b"data");
    wav.extend_from_slice(&data_len.to_le_bytes());
    for sample in samples {
        // Clamped to the i16 range first, so the cast cannot truncate.
        let value = (sample.clamp(-1.0, 1.0) * f32::from(i16::MAX)).round() as i16;
        wav.extend_from_slice(&value.to_le_bytes());
    }
    Ok(wav)
}
