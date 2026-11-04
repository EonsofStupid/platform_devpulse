//! The audio operations against a real loopback server: what goes on the wire,
//! and which answers are refused.
#![allow(clippy::unwrap_used, clippy::expect_used, reason = "test assertions")]
use super::*;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

/// Answer one request; returns its head and raw body.
async fn server(
    status: &str,
    mime: &str,
    body: Vec<u8>,
) -> (String, tokio::task::JoinHandle<(String, Vec<u8>)>) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let endpoint = format!("http://{}/custom/v7", listener.local_addr().unwrap());
    let header = format!(
        "HTTP/1.1 {status}\r\nContent-Type: {mime}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    );
    let handle = devpulse_telemetry::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut bytes = Vec::new();
        let mut buffer = [0; 8192];
        let (head, payload) = loop {
            let n = socket.read(&mut buffer).await.unwrap();
            assert!(n > 0);
            bytes.extend_from_slice(&buffer[..n]);
            if let Some(end) = bytes.windows(4).position(|b| b == b"\r\n\r\n") {
                let head = String::from_utf8(bytes[..end].to_vec()).unwrap();
                let length: usize = head
                    .lines()
                    .find_map(|line| {
                        line.to_ascii_lowercase()
                            .strip_prefix("content-length:")
                            .map(|n| n.trim().parse().unwrap())
                    })
                    .unwrap();
                if bytes.len() >= end + 4 + length {
                    break (head, bytes[end + 4..end + 4 + length].to_vec());
                }
            }
        };
        socket.write_all(header.as_bytes()).await.unwrap();
        let _ = socket.write_all(&body).await;
        (head, payload)
    });
    (endpoint, handle)
}

fn speech<'a>(speed: Option<f32>) -> EndpointSpeechRequest<'a> {
    EndpointSpeechRequest {
        model: "fixture-speech",
        input: "Hello",
        voice: "fixture-voice",
        speed,
    }
}

const SAMPLES: [f32; 3] = [0.5, -0.5, 2.0];

fn hearing(language: Option<&str>, beam_size: Option<u32>) -> EndpointTranscriptionRequest<'_> {
    EndpointTranscriptionRequest {
        model: "fixture-listen",
        audio: EndpointAudio {
            samples: &SAMPLES,
            sample_rate: 16_000,
            channels: 1,
        },
        language,
        beam_size,
    }
}

#[tokio::test]
async fn speech_posts_the_standard_body_with_its_key_and_returns_the_bytes() {
    let (endpoint, seen) = server("200 OK", "audio/wav", b"RIFFaudio".to_vec()).await;
    let audio = speak(&endpoint, Some("own-key"), &speech(Some(1.5)))
        .await
        .unwrap();
    assert_eq!(audio, b"RIFFaudio");
    let (head, body) = seen.await.unwrap();
    assert!(
        head.starts_with("POST /custom/v7/audio/speech HTTP/1.1"),
        "{head}"
    );
    assert!(
        head.to_ascii_lowercase()
            .contains("authorization: bearer own-key")
    );
    let body: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(body["model"], "fixture-speech");
    assert_eq!(body["input"], "Hello");
    assert_eq!(body["voice"], "fixture-voice");
    assert_eq!(body["response_format"], "wav");
    assert_eq!(body["speed"], 1.5);
}

#[tokio::test]
async fn natural_speed_is_left_to_the_server() {
    let (endpoint, seen) = server("200 OK", "audio/wav", b"RIFF".to_vec()).await;
    speak(&endpoint, None, &speech(None)).await.unwrap();
    let (head, body) = seen.await.unwrap();
    assert!(!head.to_ascii_lowercase().contains("authorization:"));
    let body: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(body.get("speed").is_none());
}

#[tokio::test]
async fn speech_refuses_rejections_error_documents_and_empty_answers() {
    let (endpoint, seen) = server("401 Unauthorized", "application/json", b"{}".to_vec()).await;
    let error = speak(&endpoint, None, &speech(None)).await.unwrap_err();
    assert!(error.to_string().contains("401"), "{error}");
    seen.await.unwrap();

    let (endpoint, seen) = server("200 OK", "application/json", b"{\"error\":1}".to_vec()).await;
    let error = speak(&endpoint, None, &speech(None)).await.unwrap_err();
    assert_eq!(error.to_string(), "Endpoint did not return audio");
    seen.await.unwrap();

    let (endpoint, seen) = server("200 OK", "audio/wav", Vec::new()).await;
    let error = speak(&endpoint, None, &speech(None)).await.unwrap_err();
    assert_eq!(error.to_string(), "Endpoint returned no audio");
    seen.await.unwrap();
}

#[tokio::test]
async fn transcription_uploads_a_wav_form_and_reads_the_text() {
    let (endpoint, seen) = server(
        "200 OK",
        "application/json",
        br#"{"text":"  hello there  "}"#.to_vec(),
    )
    .await;
    let text = transcribe(&endpoint, Some("own-key"), &hearing(Some("en"), Some(5)))
        .await
        .unwrap();
    assert_eq!(text, "hello there");
    let (head, body) = seen.await.unwrap();
    assert!(
        head.starts_with("POST /custom/v7/audio/transcriptions HTTP/1.1"),
        "{head}"
    );
    let lowered = head.to_ascii_lowercase();
    assert!(lowered.contains("content-type: multipart/form-data; boundary=devpulse-"));
    assert!(lowered.contains("authorization: bearer own-key"));

    let at = |needle: &[u8]| body.windows(needle.len()).position(|w| w == needle);
    assert!(at(b"name=\"model\"\r\n\r\nfixture-listen\r\n").is_some());
    assert!(at(b"name=\"response_format\"\r\n\r\njson\r\n").is_some());
    assert!(at(b"name=\"language\"\r\n\r\nen\r\n").is_some());
    assert!(at(b"name=\"beam_size\"\r\n\r\n5\r\n").is_some());
    let wav = at(b"RIFF").expect("a WAV file part");
    assert_eq!(&body[wav + 8..wav + 16], b"WAVEfmt ");
    // The sample rate, then the out-of-range third sample clamped to full scale.
    assert_eq!(&body[wav + 24..wav + 28], &16_000u32.to_le_bytes());
    assert_eq!(&body[wav + 48..wav + 50], &i16::MAX.to_le_bytes());
}

#[tokio::test]
async fn an_absent_language_or_beam_is_not_sent() {
    let (endpoint, seen) = server("200 OK", "application/json", br#"{"text":""}"#.to_vec()).await;
    let text = transcribe(&endpoint, None, &hearing(None, None))
        .await
        .unwrap();
    assert_eq!(text, "", "silence is an answer");
    let (_, body) = seen.await.unwrap();
    let body = String::from_utf8_lossy(&body);
    assert!(!body.contains("name=\"language\""));
    assert!(!body.contains("name=\"beam_size\""));
}

#[tokio::test]
async fn a_form_cannot_be_broken_out_of_and_malformed_answers_fail() {
    let mut request = hearing(None, None);
    request.model = "model\r\n--x";
    assert!(
        transcribe("http://127.0.0.1:9/v1", None, &request)
            .await
            .is_err()
    );
    assert!(
        transcribe("http://127.0.0.1:9/v1", None, &hearing(Some("e\rn"), None))
            .await
            .is_err()
    );

    let (endpoint, seen) = server("200 OK", "application/json", br#"{"words":[]}"#.to_vec()).await;
    let error = transcribe(&endpoint, None, &hearing(None, None))
        .await
        .unwrap_err();
    assert_eq!(error.to_string(), "Invalid transcription response");
    seen.await.unwrap();
}

#[tokio::test]
async fn no_audio_is_refused_before_any_request() {
    let mut request = hearing(None, None);
    request.audio.samples = &[];
    let error = transcribe("http://127.0.0.1:9/v1", None, &request)
        .await
        .unwrap_err();
    assert_eq!(error.to_string(), "There is no audio to transcribe");
}
