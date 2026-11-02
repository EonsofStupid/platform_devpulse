//! Real loopback transport regressions plus exhaustive UTF-8 frame splits.
#![allow(clippy::unwrap_used, clippy::expect_used, reason = "test assertions")]
use super::*;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

fn request() -> EndpointChatRequest {
    EndpointChatRequest {
        model: Some("fixture-model".into()),
        messages: vec![
            EndpointChatMessage {
                role: EndpointRole::System,
                content: "Be concise".into(),
            },
            EndpointChatMessage {
                role: EndpointRole::User,
                content: "Hello".into(),
            },
        ],
        max_tokens: Some(48),
        max_completion_tokens: None,
        temperature: Some(0.2),
        top_p: Some(0.9),
        stop: vec!["END".into()],
    }
}

async fn server(
    status: &str,
    mime: &str,
    body: Vec<u8>,
) -> (String, tokio::task::JoinHandle<(String, serde_json::Value)>) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let endpoint = format!("http://{}/custom/v7", listener.local_addr().unwrap());
    let header = format!(
        "HTTP/1.1 {status}\r\nContent-Type: {mime}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    );
    let handle = devpulse_telemetry::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut bytes = Vec::new();
        let mut buffer = [0; 4096];
        let (headers, payload) = loop {
            let n = socket.read(&mut buffer).await.unwrap();
            assert!(n > 0);
            bytes.extend_from_slice(&buffer[..n]);
            if let Some(end) = bytes.windows(4).position(|b| b == b"\r\n\r\n") {
                let headers = String::from_utf8(bytes[..end].to_vec()).unwrap();
                let length: usize = headers
                    .lines()
                    .find_map(|line| {
                        line.to_ascii_lowercase()
                            .strip_prefix("content-length:")
                            .map(|n| n.trim().parse().unwrap())
                    })
                    .unwrap();
                if bytes.len() >= end + 4 + length {
                    break (
                        headers,
                        serde_json::from_slice(&bytes[end + 4..end + 4 + length]).unwrap(),
                    );
                }
            }
        };
        socket.write_all(header.as_bytes()).await.unwrap();
        // The receiver may stop reading immediately after a terminal/error event.
        let _ = socket.write_all(&body).await;
        (headers, payload)
    });
    (endpoint, handle)
}

fn wire() -> String {
    concat!(
        ": keepalive\r\n\r\n",
        "data: {\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\"},\"finish_reason\":null}]}\r\n\r\n",
        "data: {\"model\":\"actual-model\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"Hi 🌍\"},\"finish_reason\":null}]}\r\n\r\n",
        "data: {\"choices\":[{\"index\":0,\"delta\":{},\"finish_reason\":\"stop\"}]}\r\n\r\n",
        "data: {\"choices\":[],\"usage\":{\"prompt_tokens\":7,\"completion_tokens\":3}}\r\n\r\n",
        "data: [DONE]\r\n\r\n"
    ).to_owned()
}

#[tokio::test]
async fn completion_restores_messages_parameters_usage_and_explicit_address() {
    let body = br#"{"model":"served","choices":[{"index":0,"message":{"content":"Hello back"},"finish_reason":"stop"}],"usage":{"prompt_tokens":9,"completion_tokens":2}}"#.to_vec();
    let (endpoint, server) = server("200 OK", "application/json", body).await;
    let result = complete(&endpoint, Some("private-fixture-key"), &request())
        .await
        .unwrap();
    assert_eq!(result.text, "Hello back");
    assert_eq!(result.model.as_deref(), Some("served"));
    assert_eq!(result.usage.unwrap().prompt_tokens, 9);
    let (headers, body) = server.await.unwrap();
    assert!(headers.starts_with("POST /custom/v7/chat/completions "));
    assert!(
        headers
            .to_ascii_lowercase()
            .contains("authorization: bearer private-fixture-key")
    );
    assert_eq!(body["messages"][0]["role"], "system");
    assert_eq!(body["max_tokens"], 48);
    assert_eq!(body["stop"][0], "END");
    assert_eq!(body["stream"], false);
}

#[test]
fn every_byte_split_preserves_utf8_and_terminal_usage() {
    let wire = wire();
    for width in 1..=wire.len() {
        let mut decoder = sse::Decoder::default();
        let mut deltas = String::new();
        for bytes in wire.as_bytes().chunks(width) {
            decoder
                .push(bytes, &mut |text| {
                    deltas.push_str(text);
                    Ok(())
                })
                .unwrap();
        }
        let result = decoder.finish(42).unwrap();
        assert_eq!(result.text, "Hi 🌍");
        assert_eq!(deltas, result.text);
        assert_eq!(result.usage.unwrap().completion_tokens, 3);
    }
}

#[test]
fn sse_line_endings_multiline_data_and_callback_refusal_are_respected() {
    for newline in ["\n", "\r", "\r\n"] {
        let data = format!("\u{feff}{}", wire().replace("\r\n", newline)).replace(
            "data: {\"model\":",
            &format!("data: {{{newline}data: \"model\":"),
        );
        let mut decoder = sse::Decoder::default();
        for byte in data.as_bytes() {
            decoder.push(&[*byte], &mut |_| Ok(())).unwrap();
        }
        assert_eq!(decoder.finish(0).unwrap().text, "Hi 🌍");
    }
    let mut decoder = sse::Decoder::default();
    assert!(
        decoder
            .push(wire().as_bytes(), &mut |_| anyhow::bail!("consumer closed"))
            .is_err()
    );
}

#[tokio::test]
async fn actual_stream_delivers_deltas_and_finishes_on_done() {
    let (endpoint, server) = server(
        "200 OK",
        "text/event-stream; charset=utf-8",
        wire().into_bytes(),
    )
    .await;
    let mut deltas = String::new();
    let result = stream(&endpoint, None, &request(), |text| {
        deltas.push_str(text);
        Ok(())
    })
    .await
    .unwrap();
    assert_eq!(result.text, deltas);
    assert_eq!(result.text, "Hi 🌍");
    let (headers, body) = server.await.unwrap();
    assert!(!headers.to_ascii_lowercase().contains("authorization"));
    assert_eq!(body["stream"], true);
}

#[test]
fn malformed_truncated_refused_or_oversized_streams_do_not_succeed() {
    for bad in [
        "data: not json\n\n".to_owned(),
        "data: [DONE]\n\n".to_owned(),
        "data: {\"choices\":[{\"index\":0,\"delta\":{\"refusal\":\"no\"}}]}\n\n".to_owned(),
        wire().replace("data: [DONE]\r\n\r\n", ""),
        "x".repeat(128 * 1024 + 1),
    ] {
        let mut decoder = sse::Decoder::default();
        let pushed = decoder.push(bad.as_bytes(), &mut |_| Ok(()));
        assert!(pushed.is_err() || decoder.finish(0).is_err());
    }
}

#[tokio::test]
async fn unsuccessful_or_malformed_responses_never_echo_keys() {
    for (status, body) in [
        ("401 Unauthorized", "private-fixture-key"),
        ("302 Found", "private-fixture-key"),
        ("200 OK", r#"{"choices":"private-fixture-key"}"#),
        ("200 OK", r#"{"choices":[]}"#),
        (
            "200 OK",
            r#"{"choices":[{"index":0,"message":{"content":""},"finish_reason":"stop"}]}"#,
        ),
    ] {
        let (endpoint, server) = server(status, "application/json", body.as_bytes().to_vec()).await;
        let error = complete(&endpoint, Some("private-fixture-key"), &request())
            .await
            .unwrap_err();
        assert!(!format!("{error:#}").contains("private-fixture-key"));
        server.await.unwrap();
    }
}

#[tokio::test]
async fn embedding_rejects_bad_status_and_partial_vectors() {
    for (body, valid) in [
        (r#"{"data":[{"index":0,"embedding":[0.1,-0.2]}]}"#, true),
        (r#"{"data":[{"index":0,"embedding":[0.1,"bad"]}]}"#, false),
        (r#"{"data":[{"index":0,"embedding":[]}]}"#, false),
    ] {
        let (endpoint, server) =
            server("200 OK", "application/json", body.as_bytes().to_vec()).await;
        assert_eq!(
            embed(&endpoint, None, "embedding-model", "text")
                .await
                .is_ok(),
            valid
        );
        let (headers, request) = server.await.unwrap();
        assert!(headers.starts_with("POST /custom/v7/embeddings "));
        assert_eq!(request["encoding_format"], "float");
    }
    let (endpoint, server) = server(
        "500 Error",
        "application/json",
        br#"{"data":[{"index":0,"embedding":[1]}]}"#.to_vec(),
    )
    .await;
    assert!(embed(&endpoint, None, "model", "text").await.is_err());
    server.await.unwrap();
}
