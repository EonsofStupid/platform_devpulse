use super::*;

#[test]
fn classify_401_is_auth_failed() {
    assert_eq!(
        classify_status(StatusCode::UNAUTHORIZED, ""),
        ModelDiscoveryErrorKind::AuthFailed
    );
    assert_eq!(
        classify_status(StatusCode::FORBIDDEN, ""),
        ModelDiscoveryErrorKind::AuthFailed
    );
}

#[test]
fn classify_429_rate_limit_vs_quota() {
    let body_rate = r#"{"error":{"type":"rate_limit_exceeded"}}"#;
    let body_quota = r#"{"error":{"type":"insufficient_quota"}}"#;
    let body_billing = r#"{"error":{"type":"billing_error","message":"out of credit"}}"#;
    assert_eq!(
        classify_status(StatusCode::TOO_MANY_REQUESTS, body_rate),
        ModelDiscoveryErrorKind::RateLimit
    );
    assert_eq!(
        classify_status(StatusCode::TOO_MANY_REQUESTS, body_quota),
        ModelDiscoveryErrorKind::QuotaExhausted
    );
    assert_eq!(
        classify_status(StatusCode::TOO_MANY_REQUESTS, body_billing),
        ModelDiscoveryErrorKind::QuotaExhausted
    );
}

#[test]
fn classify_5xx_is_server() {
    assert_eq!(
        classify_status(StatusCode::INTERNAL_SERVER_ERROR, ""),
        ModelDiscoveryErrorKind::Server
    );
    assert_eq!(
        classify_status(StatusCode::BAD_GATEWAY, ""),
        ModelDiscoveryErrorKind::Server
    );
}

#[test]
fn parse_oai_compat_models() {
    let body = r#"{"object":"list","data":[
            {"id":"gpt-4o","object":"model","owned_by":"openai"},
            {"id":"gpt-4o-mini","object":"model","owned_by":"openai"}
        ]}"#;
    let out = parse_models(ProviderId::OpenAi, body).unwrap();
    assert_eq!(out.len(), 2);
    assert_eq!(out[0].id, "gpt-4o");
    assert_eq!(out[0].owned_by.as_deref(), Some("openai"));
}

#[test]
fn parse_gemini_strips_models_prefix() {
    let body = r#"{"models":[
            {"name":"models/gemini-1.5-flash"},
            {"name":"models/gemini-1.5-pro"}
        ]}"#;
    let out = parse_models(ProviderId::GoogleGemini, body).unwrap();
    assert_eq!(out[0].id, "gemini-1.5-flash");
    assert_eq!(out[1].id, "gemini-1.5-pro");
}

#[test]
fn parse_failure_classified_as_parse() {
    let err = parse_models(ProviderId::OpenAi, "this is not json").unwrap_err();
    assert_eq!(err.kind, ModelDiscoveryErrorKind::Parse);
}

#[test]
fn fireworks_returns_not_implemented() {
    let entry = registry::find(ProviderId::Fireworks).unwrap();
    let err = build_request(
        ProviderId::Fireworks,
        entry,
        "https://configured.example/api",
        Some("dummy"),
    )
    .unwrap_err();
    assert_eq!(err.kind, ModelDiscoveryErrorKind::NotImplemented);
}

#[test]
fn missing_key_for_cloud_returns_not_configured() {
    let entry = registry::find(ProviderId::OpenAi).unwrap();
    let err = build_request(
        ProviderId::OpenAi,
        entry,
        "https://configured.example/api",
        None,
    )
    .unwrap_err();
    assert_eq!(err.kind, ModelDiscoveryErrorKind::NotConfigured);
}

#[test]
fn missing_key_for_anthropic_returns_not_configured() {
    let entry = registry::find(ProviderId::AnthropicApi).unwrap();
    let err = build_request(
        ProviderId::AnthropicApi,
        entry,
        "https://configured.example/api",
        None,
    )
    .unwrap_err();
    assert_eq!(err.kind, ModelDiscoveryErrorKind::NotConfigured);
}

#[test]
fn missing_key_for_gemini_returns_not_configured() {
    let entry = registry::find(ProviderId::GoogleGemini).unwrap();
    let err = build_request(
        ProviderId::GoogleGemini,
        entry,
        "https://configured.example/api",
        None,
    )
    .unwrap_err();
    assert_eq!(err.kind, ModelDiscoveryErrorKind::NotConfigured);
}

#[test]
fn local_provider_without_key_is_ok() {
    let entry = registry::find(ProviderId::Ollama).unwrap();
    // Should NOT fail pre-flight — local providers don't need a key.
    let _ = build_request(
        ProviderId::Ollama,
        entry,
        "https://configured.example/api",
        None,
    )
    .expect("Ollama needs no key");
}

#[test]
fn keys_use_sensitive_headers_and_never_urls() {
    for (id, header, expected) in [
        (ProviderId::GoogleGemini, "x-goog-api-key", "test-key"),
        (ProviderId::AnthropicApi, "x-api-key", "test-key"),
        (ProviderId::Ollama, "authorization", "Bearer test-key"),
        (ProviderId::LmStudio, "authorization", "Bearer test-key"),
        (ProviderId::Vllm, "authorization", "Bearer test-key"),
    ] {
        let entry = registry::find(id).unwrap();
        let request = build_request(
            id,
            entry,
            "https://configured.example/api",
            Some("test-key"),
        )
        .unwrap()
        .build()
        .unwrap();
        assert_eq!(request.headers()[header], expected);
        assert!(request.headers()[header].is_sensitive());
        assert!(!request.url().as_str().contains("test-key"));
        assert!(request.url().query().is_none());
        assert_eq!(
            request.url().as_str(),
            "https://configured.example/api/models"
        );
        assert!(!format!("{request:?}").contains("test-key"));
    }
}

#[test]
fn empty_or_invalid_credentials_fail_without_echoing_the_secret() {
    let entry = registry::find(ProviderId::OpenAi).unwrap();
    for key in ["", "   ", "secret\r\ninjected"] {
        let error = build_request(
            ProviderId::OpenAi,
            entry,
            "https://configured.example/api",
            Some(key),
        )
        .unwrap_err();
        assert_eq!(error.kind, ModelDiscoveryErrorKind::NotConfigured);
        assert!(!error.message.contains("secret"));
    }
    assert_eq!(truncate("abcdefg🔑more", 8), "abcdefg🔑…");
}

#[tokio::test]
async fn model_client_does_not_forward_credentials_to_redirects() {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let server = tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut bytes = [0_u8; 4096];
        let mut request = Vec::new();
        while !request.windows(4).any(|part| part == b"\r\n\r\n") {
            let count = socket.read(&mut bytes).await.unwrap();
            assert!(count > 0);
            request.extend_from_slice(&bytes[..count]);
        }
        assert!(String::from_utf8(request).unwrap().contains("test-key"));
        socket.write_all(format!("HTTP/1.1 302 Found\r\nLocation: http://{address}/elsewhere\r\nContent-Length: 0\r\nConnection: close\r\n\r\n").as_bytes()).await.unwrap();
    });
    let entry = registry::find(ProviderId::GoogleGemini).unwrap();
    let request = build_request(
        ProviderId::GoogleGemini,
        entry,
        &format!("http://{address}"),
        Some("test-key"),
    )
    .unwrap()
    .build()
    .unwrap();
    let response = shared_client().unwrap().execute(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::FOUND);
    server.await.unwrap();
}

#[test]
fn endpoint_validation_preserves_custom_paths_and_rejects_embedded_secrets() {
    assert_eq!(
        normalize_endpoint(" https://server.example/custom/v9/ ").unwrap(),
        "https://server.example/custom/v9"
    );
    assert_eq!(
        normalize_endpoint("http://127.0.0.1:8000/v1").unwrap(),
        "http://127.0.0.1:8000/v1"
    );
    for value in [
        "",
        "localhost:8000",
        "file:///tmp/models",
        "https://user:secret@server.example/v1",
        "https://server.example/v1?key=secret",
        "https://server.example/v1#secret",
    ] {
        let error = normalize_endpoint(value).unwrap_err();
        assert_eq!(error.kind, ModelDiscoveryErrorKind::NotConfigured);
        assert!(!error.message.contains("secret@"));
    }
}

#[tokio::test]
async fn configured_authenticated_endpoint_returns_models_or_redacted_failure() {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    for (status, body) in [
        (
            "200 OK",
            r#"{"data":[{"id":"configured-model"}]}"#.to_string(),
        ),
        (
            "401 Unauthorized",
            format!("{}local-test-key{}", "x".repeat(270), "🔑".repeat(20)),
        ),
    ] {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let server = tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut bytes = [0_u8; 4096];
            let mut request = Vec::new();
            while !request.windows(4).any(|part| part == b"\r\n\r\n") {
                let count = socket.read(&mut bytes).await.unwrap();
                assert!(count > 0);
                request.extend_from_slice(&bytes[..count]);
            }
            let request = String::from_utf8(request).unwrap();
            assert!(request.starts_with("GET /custom/v9/models HTTP/1.1"));
            assert!(request
                .to_ascii_lowercase()
                .contains("authorization: bearer local-test-key"));
            socket.write_all(format!("HTTP/1.1 {status}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).as_bytes()).await.unwrap();
        });
        let result = fetch_models(
            ProviderId::Ollama,
            &format!("http://{address}/custom/v9/"),
            Some("local-test-key"),
        )
        .await;
        if status == "200 OK" {
            assert_eq!(result.unwrap()[0].id, "configured-model");
        } else {
            let error = result.unwrap_err();
            assert_eq!(error.kind, ModelDiscoveryErrorKind::AuthFailed);
            assert!(!format!("{error:?}").contains("local-test-key"));
        }
        server.await.unwrap();
    }
}
