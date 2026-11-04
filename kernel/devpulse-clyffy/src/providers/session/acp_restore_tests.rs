//! Protocol regressions against the same SDK startup path as real agents.
#![expect(clippy::expect_used, reason = "protocol fixture assertions")]

use super::*;
use agent_client_protocol::{Channel, RawJsonRpcId, RawJsonRpcMessage, TransportFrame};
use futures::StreamExt;
use serde_json::{Value, json};

async fn request(peer: &mut Channel, method: &str) -> (RawJsonRpcId, Value) {
    let Some(TransportFrame::Single(RawJsonRpcMessage::Request(request))) = peer.rx.next().await
    else {
        panic!("expected {method}");
    };
    assert_eq!(request.method.as_ref(), method);
    (
        request.id,
        serde_json::to_value(request.params).expect("params"),
    )
}

fn send(peer: &Channel, messages: Vec<RawJsonRpcMessage>) {
    for message in messages {
        peer.tx
            .unbounded_send(TransportFrame::Single(message))
            .expect("connected peer");
    }
}

fn text_update(text: &str) -> RawJsonRpcMessage {
    RawJsonRpcMessage::notification(
        "session/update".into(),
        json!({
            "sessionId":"saved-thread", "update": {
                "sessionUpdate":"agent_message_chunk", "content":{"type":"text", "text":text}
            }
        }),
    )
    .expect("update")
}

async fn protocol_peer(
    mut peer: Channel,
    capabilities: Value,
    method: Option<&str>,
    refused: bool,
) {
    let (id, _) = request(&mut peer, "initialize").await;
    send(
        &peer,
        vec![RawJsonRpcMessage::response(
            id,
            Ok(json!({
                "protocolVersion":1, "agentCapabilities":capabilities, "authMethods":[]
            })),
        )],
    );
    if let Some(method) = method {
        let (id, params) = request(&mut peer, method).await;
        assert_eq!(params["sessionId"], "saved-thread");
        assert_eq!(params["cwd"], "C:/workspace");
        if refused {
            send(
                &peer,
                vec![RawJsonRpcMessage::response(
                    id,
                    Err(agent_client_protocol::Error::invalid_params()
                        .data("saved session missing")),
                )],
            );
        } else {
            let mut messages = Vec::new();
            if method == "session/load" {
                messages.push(text_update("old answer must not be saved again"));
                messages.push(text_update("another historical chunk"));
            }
            messages.push(RawJsonRpcMessage::response(id, Ok(json!({}))));
            send(&peer, messages);
            let (id, params) = request(&mut peer, "session/prompt").await;
            assert_eq!(params["sessionId"], "saved-thread");
            send(
                &peer,
                vec![
                    text_update("new answer"),
                    RawJsonRpcMessage::response(id, Ok(json!({"stopReason":"end_turn"}))),
                ],
            );
        }
    }
    while let Some(frame) = peer.rx.next().await {
        assert!(
            !matches!(frame, TransportFrame::Single(RawJsonRpcMessage::Request(_))),
            "unexpected request after restore, possibly a silent session/new fallback"
        );
    }
}

async fn restoration(capabilities: Value, method: Option<&str>, refused: bool) {
    let (transport, peer) = Channel::duplex();
    let should_fail = method.is_none() || refused;
    let client = Client
        .v1()
        .connect_with(transport, async move |connection| {
            let result = open_session(
                &connection,
                Path::new("C:/workspace"),
                Some("saved-thread"),
                Vec::new(),
            )
            .await;
            if should_fail {
                let error = result.expect_err("restoration must fail, never create a new session");
                assert!(error.to_string().contains(if refused {
                    "saved session missing"
                } else {
                    "cannot restore"
                }));
                return Ok(());
            }
            let mut session = result?;
            assert_eq!(session.session_id().0.as_ref(), "saved-thread");
            session.send_prompt("continue")?;
            let (events, mut received) = mpsc::unbounded_channel();
            loop {
                match session.read_update().await? {
                    SessionMessage::Message(dispatch) => forward(dispatch, &events).await,
                    SessionMessage::PromptResponse(_) => break,
                    _ => {}
                }
            }
            drop(events);
            assert_eq!(
                received.recv().await,
                Some(AgentEvent::Text {
                    text: "new answer".into()
                })
            );
            assert_eq!(received.recv().await, None);
            Ok(())
        });
    tokio::time::timeout(Duration::from_secs(10), async {
        let (result, ()) = tokio::join!(client, protocol_peer(peer, capabilities, method, refused));
        result.expect("connection");
    })
    .await
    .expect("protocol test deadline");
}

/// What an agent receives when a session opens: the whole offer, on every way
/// a session can open.
async fn offered_on(capabilities: Value, resume: Option<&'static str>, method: &str) -> Value {
    let tool = ToolServer {
        name: "devpulse-memory".into(),
        command: "C:/DevPulse/devpulse-persona-mcp.exe".into(),
        args: vec!["--quiet".into()],
        env: vec![
            ("DEVPULSE_MEMORY_PIPE".into(), "pipe-name".into()),
            ("DEVPULSE_MEMORY_TOKEN".into(), "session-token".into()),
        ],
    };
    let (transport, mut peer) = Channel::duplex();
    let client = Client
        .v1()
        .connect_with(transport, async move |connection| {
            let opened = open_session(
                &connection,
                Path::new("C:/workspace"),
                resume,
                mcp_servers(&[tool]),
            )
            .await?;
            drop(opened);
            Ok(())
        });
    let agent = async {
        let (id, _) = request(&mut peer, "initialize").await;
        send(
            &peer,
            vec![RawJsonRpcMessage::response(
                id,
                Ok(json!({
                    "protocolVersion":1, "agentCapabilities":capabilities, "authMethods":[]
                })),
            )],
        );
        let (id, params) = request(&mut peer, method).await;
        send(
            &peer,
            vec![RawJsonRpcMessage::response(
                id,
                Ok(json!({"sessionId":"saved-thread"})),
            )],
        );
        params
    };
    tokio::time::timeout(Duration::from_secs(10), async {
        let (result, params) = tokio::join!(client, agent);
        result.expect("connection");
        params["mcpServers"].clone()
    })
    .await
    .expect("protocol test deadline")
}

fn the_offer() -> Value {
    json!([{
        "name": "devpulse-memory",
        "command": "C:/DevPulse/devpulse-persona-mcp.exe",
        "args": ["--quiet"],
        "env": [
            {"name": "DEVPULSE_MEMORY_PIPE", "value": "pipe-name"},
            {"name": "DEVPULSE_MEMORY_TOKEN", "value": "session-token"},
        ],
    }])
}

/// An agent that opens a session, refuses the first prompt with `refusal` and
/// answers the second.
async fn refusing_peer(mut peer: Channel, refusal: agent_client_protocol::Error) {
    let (id, _) = request(&mut peer, "initialize").await;
    send(
        &peer,
        vec![RawJsonRpcMessage::response(
            id,
            Ok(json!({"protocolVersion":1, "agentCapabilities":{}, "authMethods":[]})),
        )],
    );
    let (id, _) = request(&mut peer, "session/new").await;
    send(
        &peer,
        vec![RawJsonRpcMessage::response(
            id,
            Ok(json!({"sessionId":"saved-thread"})),
        )],
    );
    let (id, _) = request(&mut peer, "session/prompt").await;
    send(&peer, vec![RawJsonRpcMessage::response(id, Err(refusal))]);
    let (id, _) = request(&mut peer, "session/prompt").await;
    send(
        &peer,
        vec![RawJsonRpcMessage::response(
            id,
            Ok(json!({"stopReason":"end_turn"})),
        )],
    );
    while peer.rx.next().await.is_some() {}
}

/// Two turns on one session; the events of each, in order.
async fn two_turns(refusal: agent_client_protocol::Error) -> [Vec<AgentEvent>; 2] {
    let (transport, peer) = Channel::duplex();
    let client = Client
        .v1()
        .connect_with(transport, async move |connection| {
            let mut session =
                open_session(&connection, Path::new("C:/workspace"), None, Vec::new()).await?;
            let control = session.connection().clone();
            let id = session.session_id().clone();
            let shared = Shared::default();
            let (_open, mut commands) = mpsc::unbounded_channel();
            let mut turns = Vec::new();
            for _ in 0..2 {
                let (events, mut received) = mpsc::unbounded_channel();
                session.send_prompt("continue")?;
                let closing =
                    run_turn(&mut session, &control, &id, &events, &mut commands, &shared).await;
                assert!(!closing, "a refused prompt must not close the conversation");
                drop(events);
                let mut turn = Vec::new();
                while let Some(event) = received.recv().await {
                    turn.push(event);
                }
                turns.push(turn);
            }
            Ok(turns)
        });
    tokio::time::timeout(Duration::from_secs(10), async {
        let (result, ()) = tokio::join!(client, refusing_peer(peer, refusal));
        let turns: Vec<Vec<AgentEvent>> = result.expect("connection");
        turns.try_into().expect("two turns")
    })
    .await
    .expect("protocol test deadline")
}

fn ended() -> AgentEvent {
    AgentEvent::TurnEnded {
        stop: "end_turn".into(),
    }
}

#[tokio::test]
async fn a_refused_prompt_fails_its_turn_and_the_session_stays_open() {
    let [refused, next] =
        two_turns(agent_client_protocol::Error::invalid_params().data("too long")).await;
    let [AgentEvent::Failed { message }] = refused.as_slice() else {
        panic!("expected one failure, got {refused:?}");
    };
    assert!(message.contains("too long"), "{message}");
    assert!(!message.contains("Sign in"), "{message}");
    assert_eq!(next, vec![ended()]);
}

#[tokio::test]
async fn a_prompt_refused_for_login_says_to_sign_in() {
    let [refused, next] = two_turns(agent_client_protocol::Error::auth_required()).await;
    let [AgentEvent::Failed { message }] = refused.as_slice() else {
        panic!("expected one failure, got {refused:?}");
    };
    assert!(message.starts_with("Sign in first"), "{message}");
    assert_eq!(next, vec![ended()]);
}

#[tokio::test]
async fn a_new_session_is_offered_its_tools() {
    assert_eq!(
        offered_on(json!({}), None, "session/new").await,
        the_offer()
    );
}

#[tokio::test]
async fn a_resumed_session_is_offered_its_tools() {
    assert_eq!(
        offered_on(
            json!({"sessionCapabilities":{"resume":{}}}),
            Some("saved-thread"),
            "session/resume",
        )
        .await,
        the_offer()
    );
}

#[tokio::test]
async fn a_loaded_session_is_offered_its_tools() {
    assert_eq!(
        offered_on(
            json!({"loadSession":true}),
            Some("saved-thread"),
            "session/load",
        )
        .await,
        the_offer()
    );
}

#[tokio::test]
async fn load_restores_identity_without_replaying_into_the_next_answer() {
    restoration(json!({"loadSession":true}), Some("session/load"), false).await;
}

#[tokio::test]
async fn resume_is_preferred_when_both_operations_are_advertised() {
    restoration(
        json!({"loadSession":true,"sessionCapabilities":{"resume":{}}}),
        Some("session/resume"),
        false,
    )
    .await;
}

#[tokio::test]
async fn unsupported_restoration_never_starts_a_fresh_session() {
    restoration(json!({}), None, false).await;
}

#[tokio::test]
async fn failed_load_never_starts_a_fresh_session() {
    restoration(json!({"loadSession":true}), Some("session/load"), true).await;
}

#[tokio::test]
async fn failed_resume_does_not_fall_back_to_load_or_new() {
    restoration(
        json!({"loadSession":true,"sessionCapabilities":{"resume":{}}}),
        Some("session/resume"),
        true,
    )
    .await;
}
