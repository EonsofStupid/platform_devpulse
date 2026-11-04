//! Speech bindings over actual Turso persistence and a real loopback server.
use super::*;
use crate::providers::adapters::openai_compatible::EndpointAudio;

const AUDIO: EndpointAudio<'static> = EndpointAudio {
    samples: &[0.25, -0.25],
    sample_rate: 16_000,
    channels: 1,
};

async fn saved(connections: &Connections, label: &str, endpoint: &str) -> SavedConnection {
    connections
        .save(request(
            None,
            label,
            endpoint,
            ConnectionCredential::Replace(format!("{label}-secret")),
        ))
        .await
        .unwrap()
        .items
        .into_iter()
        .find(|item| item.label == label)
        .unwrap()
}

/// Answer one request; returns its head.
async fn answer_once(listener: tokio::net::TcpListener, mime: &str, body: &'static [u8]) -> String {
    let (mut socket, _) = listener.accept().await.unwrap();
    let mut bytes = Vec::new();
    let mut buffer = [0; 8192];
    let head = loop {
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
                break head;
            }
        }
    };
    let reply = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: {mime}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    );
    socket.write_all(reply.as_bytes()).await.unwrap();
    socket.write_all(body).await.unwrap();
    head
}

#[tokio::test]
async fn nothing_bound_is_the_only_case_without_an_error() {
    let tree = tempfile::tempdir().unwrap();
    let connections = Connections::new(database(&tree).await, Arc::new(Vault::default()));
    let state = connections.speech_endpoints().await.unwrap();
    assert_eq!(state.stt, None);
    assert_eq!(state.tts, None);
    assert!(state.providers.contains(&ProviderId::OpenAi));
    assert!(state.providers.contains(&ProviderId::Vllm));
    assert!(!state.providers.contains(&ProviderId::DeepSeek));
    assert!(
        connections
            .prepare_speech(SpeechRole::Tts)
            .await
            .unwrap()
            .is_none()
    );
}

#[tokio::test]
async fn each_role_binds_on_its_own_and_survives_restart() {
    let tree = tempfile::tempdir().unwrap();
    let db = database(&tree).await;
    let vault = Arc::new(Vault::default());
    let connections = Connections::new(db.clone(), vault.clone());
    let hear = saved(&connections, "Hear", "http://localhost:12401/v1").await;
    let say = saved(&connections, "Say", "http://localhost:12402/v1").await;
    connections
        .set_speech_binding(SpeechRole::Stt, &hear.id, hear.revision, " listen-model ")
        .await
        .unwrap();
    connections
        .set_speech_binding(SpeechRole::Tts, &say.id, say.revision, "speak-model")
        .await
        .unwrap();

    let restarted = Connections::new(db, vault);
    let state = restarted.speech_endpoints().await.unwrap();
    let stt = state.stt.unwrap();
    assert_eq!(stt.connection_id, hear.id);
    assert_eq!(stt.model, "listen-model");
    assert_eq!(stt.label, "Hear");
    assert_eq!(stt.state, SpeechBindingState::Current);
    let tts = restarted
        .speech_binding(SpeechRole::Tts)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(tts.connection_id, say.id);
    let rendered = serde_json::to_string(&tts).unwrap();
    assert!(!rendered.contains("secret"));
    assert!(!rendered.contains("ai_connection_"));

    let state = restarted
        .clear_speech_binding(SpeechRole::Stt)
        .await
        .unwrap();
    assert_eq!(state.stt, None);
    assert!(state.tts.is_some());
    assert!(
        restarted
            .prepare_speech(SpeechRole::Stt)
            .await
            .unwrap()
            .is_none()
    );
}

#[tokio::test]
async fn an_edited_or_removed_server_is_refused_and_never_skipped() {
    let tree = tempfile::tempdir().unwrap();
    let connections = Connections::new(database(&tree).await, Arc::new(Vault::default()));
    let first = saved(&connections, "Server", "http://localhost:12401/v1").await;
    connections
        .set_speech_binding(SpeechRole::Tts, &first.id, first.revision, "voice-model")
        .await
        .unwrap();
    assert!(
        connections
            .prepare_speech(SpeechRole::Tts)
            .await
            .unwrap()
            .is_some()
    );

    let edited = connections
        .save(request(
            Some(first.id.clone()),
            "Server",
            "http://localhost:12402/v1",
            ConnectionCredential::Keep,
        ))
        .await
        .unwrap()
        .items
        .remove(0);
    assert_eq!(
        connections
            .speech_binding(SpeechRole::Tts)
            .await
            .unwrap()
            .unwrap()
            .state,
        SpeechBindingState::ConnectionChanged
    );
    let refused = connections
        .prepare_speech(SpeechRole::Tts)
        .await
        .err()
        .unwrap();
    assert!(refused.to_string().contains("changed"), "{refused}");
    // The old generation cannot be chosen either; the current one can.
    assert!(
        connections
            .set_speech_binding(SpeechRole::Tts, &edited.id, first.revision, "voice-model")
            .await
            .is_err()
    );
    connections
        .set_speech_binding(SpeechRole::Tts, &edited.id, edited.revision, "voice-model")
        .await
        .unwrap();
    assert!(
        connections
            .prepare_speech(SpeechRole::Tts)
            .await
            .unwrap()
            .is_some()
    );

    connections.remove(&edited.id).await.unwrap();
    assert_eq!(
        connections
            .speech_binding(SpeechRole::Tts)
            .await
            .unwrap()
            .unwrap()
            .state,
        SpeechBindingState::ConnectionRemoved
    );
    let refused = connections
        .prepare_speech(SpeechRole::Tts)
        .await
        .err()
        .unwrap();
    assert!(refused.to_string().contains("removed"), "{refused}");
}

#[tokio::test]
async fn choosing_refuses_bad_models_missing_keys_and_adapters_without_audio() {
    let tree = tempfile::tempdir().unwrap();
    let vault = Arc::new(Vault::default());
    let connections = Connections::new(database(&tree).await, vault.clone());
    let chosen = saved(&connections, "Server", "http://localhost:12401/v1").await;
    for model in [" ", "two\r\nlines"] {
        assert!(
            connections
                .set_speech_binding(SpeechRole::Stt, &chosen.id, chosen.revision, model)
                .await
                .is_err()
        );
    }
    vault.keys.lock().await.clear();
    assert!(
        connections
            .set_speech_binding(SpeechRole::Stt, &chosen.id, chosen.revision, "m")
            .await
            .is_err()
    );
    assert_eq!(
        connections.speech_binding(SpeechRole::Stt).await.unwrap(),
        None
    );

    let mut hosted = request(
        None,
        "No audio",
        "http://localhost:12402/v1",
        ConnectionCredential::Replace("key".into()),
    );
    hosted.provider = ProviderId::DeepSeek;
    let hosted = connections
        .save(hosted)
        .await
        .unwrap()
        .items
        .into_iter()
        .find(|item| item.label == "No audio")
        .unwrap();
    let refused = connections
        .set_speech_binding(SpeechRole::Stt, &hosted.id, hosted.revision, "m")
        .await
        .unwrap_err();
    assert!(refused.to_string().contains("audio"), "{refused}");
}

#[tokio::test]
async fn requests_reach_the_bound_server_with_only_its_own_key() {
    let tree = tempfile::tempdir().unwrap();
    let connections = Connections::new(database(&tree).await, Arc::new(Vault::default()));
    saved(&connections, "Other", "http://localhost:12401/v1").await;

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let endpoint = format!("http://{}/v1", listener.local_addr().unwrap());
    let bound = saved(&connections, "Bound", &endpoint).await;
    connections
        .set_speech_binding(SpeechRole::Stt, &bound.id, bound.revision, "listen-model")
        .await
        .unwrap();
    let server = devpulse_telemetry::spawn(answer_once(
        listener,
        "application/json",
        br#"{"text":"heard"}"#,
    ));
    let prepared = connections
        .prepare_speech(SpeechRole::Stt)
        .await
        .unwrap()
        .unwrap();
    let text = prepared
        .transcribe(AUDIO, &SpeechHearing::default())
        .await
        .unwrap();
    assert_eq!(text, "heard");
    let head = server.await.unwrap();
    assert!(head.starts_with("POST /v1/audio/transcriptions"), "{head}");
    assert!(head.contains("Bound-secret"), "{head}");
    assert!(!head.contains("Other-secret"), "{head}");
    // A binding only does the work it was chosen for.
    assert!(prepared.speak("hello", "voice", None).await.is_err());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let endpoint = format!("http://{}/v1", listener.local_addr().unwrap());
    let speaker = saved(&connections, "Speaker", &endpoint).await;
    connections
        .set_speech_binding(
            SpeechRole::Tts,
            &speaker.id,
            speaker.revision,
            "speak-model",
        )
        .await
        .unwrap();
    let server = devpulse_telemetry::spawn(answer_once(listener, "audio/wav", b"RIFFaudio"));
    let prepared = connections
        .prepare_speech(SpeechRole::Tts)
        .await
        .unwrap()
        .unwrap();
    let audio = prepared.speak("hello", "voice", None).await.unwrap();
    assert_eq!(audio, b"RIFFaudio");
    let head = server.await.unwrap();
    assert!(head.starts_with("POST /v1/audio/speech"), "{head}");
    assert!(
        prepared
            .transcribe(AUDIO, &SpeechHearing::default())
            .await
            .is_err()
    );
}
