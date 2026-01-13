// engine/src/facade/chat.rs

//! Chat facade - simplified chat interface
//!
//! Wraps orchestrator::ChatEngine with graceful degradation.
//! If AI pipeline isn't ready, returns helpful stub responses.
//!
//! Emits signals on every chat interaction:
//! - Chat signal (user message)
//! - Chat signal (assistant response)
//! - Inference signal (metrics)

use crate::error::EngineError;
use crate::signals::{
    ChatPayload, InferencePayload, Role as SignalRole,
    Signal, SignalRouter, SignalSource, SignalVariant,
};
use serde::{Deserialize, Serialize};
use shared::types::ids::SessionId;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::OnceCell;
use tracing::instrument;

/// Message role (for external API)
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    User,
    Assistant,
    System,
}

/// A chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: Role,
    pub content: String,
    pub timestamp: i64,
}

/// Response from chat
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub message: String,
    pub tokens_used: u32,
    pub is_stub: bool,
}

/// Chat facade - entry point for chat functionality
///
/// Emits signals for every chat interaction, enabling:
/// - UI updates via Broadcast sink
/// - History persistence via Durable sink
/// - Session cache via Cache sink
pub struct ChatFacade {
    /// Signal router for broadcasting chat events
    router: Arc<SignalRouter>,
    /// Lazy-initialized orchestrator chat engine
    engine: OnceCell<Arc<orchestrator::ChatEngine>>,
    /// Stub mode flag (set if AI init fails)
    stub_mode: std::sync::atomic::AtomicBool,
}

impl ChatFacade {
    /// Create a new chat facade with signal router
    pub fn new(router: Arc<SignalRouter>) -> Self {
        Self {
            router,
            engine: OnceCell::new(),
            stub_mode: std::sync::atomic::AtomicBool::new(false),
        }
    }

    /// Initialize the underlying chat engine
    /// If this fails, we enter stub mode (app still works)
    pub async fn init(&self) -> Result<(), EngineError> {
        match orchestrator::ChatEngine::new().await {
            Ok(engine) => {
                let _ = self.engine.set(Arc::new(engine));
                tracing::info!("ChatFacade: AI engine initialized");
                Ok(())
            }
            Err(e) => {
                self.stub_mode
                    .store(true, std::sync::atomic::Ordering::SeqCst);
                tracing::warn!("ChatFacade: AI not ready, stub mode active: {}", e);
                // Return Ok - stub mode is valid operation
                Ok(())
            }
        }
    }

    /// Is the AI pipeline ready?
    pub fn is_ready(&self) -> bool {
        self.engine.get().is_some()
            && !self.stub_mode.load(std::sync::atomic::Ordering::SeqCst)
    }

    /// Send a message and get a response with default system prompt
    ///
    /// Emits signals:
    /// 1. Chat signal (user message) - before processing
    /// 2. Chat signal (assistant response) - after processing
    /// 3. Inference signal (metrics) - if real inference occurred
    #[instrument(skip(self), fields(msg_len = message.len()))]
    pub async fn send(
        &self,
        message: &str,
        session_id: &SessionId,
    ) -> Result<ChatResponse, EngineError> {
        self.send_with_prompt(message, session_id, None).await
    }

    /// Send a message with a custom system prompt (from persona)
    ///
    /// Emits signals:
    /// 1. Chat signal (user message) - before processing
    /// 2. Chat signal (assistant response) - after processing
    /// 3. Inference signal (metrics) - if real inference occurred
    #[instrument(skip(self, system_prompt), fields(msg_len = message.len()))]
    pub async fn send_with_prompt(
        &self,
        message: &str,
        session_id: &SessionId,
        system_prompt: Option<&str>,
    ) -> Result<ChatResponse, EngineError> {
        let start = Instant::now();

        // 1. Emit Chat signal for user message
        self.router.emit(Signal::new(
            SignalSource::User,
            SignalVariant::Chat(ChatPayload {
                session_id: session_id.clone(),
                role: SignalRole::User,
                content: message.to_string(),
            }),
        ));

        // 2. Try to use real engine if available
        if let Some(engine) = self.engine.get() {
            let result = match system_prompt {
                Some(prompt) => engine.send_with_prompt(message, Some(prompt)).await,
                None => engine.send(message).await,
            };

            match result {
                Ok(response) => {
                    let latency_ms = start.elapsed().as_millis() as u32;

                    // Emit Chat signal for assistant response
                    self.router.emit(Signal::new(
                        SignalSource::Expert,
                        SignalVariant::Chat(ChatPayload {
                            session_id: session_id.clone(),
                            role: SignalRole::Assistant,
                            content: response.message.clone(),
                        }),
                    ));

                    // Emit Inference signal with metrics
                    self.router.emit(Signal::new(
                        SignalSource::System,
                        SignalVariant::Inference(InferencePayload {
                            model_id: "local".to_string(), // TODO: get from orchestrator
                            tokens_in: message.len() as u32 / 4, // rough estimate
                            tokens_out: response.tokens_used,
                            latency_ms,
                        }),
                    ));

                    return Ok(ChatResponse {
                        message: response.message,
                        tokens_used: response.tokens_used,
                        is_stub: false,
                    });
                }
                Err(e) => {
                    tracing::warn!("Chat engine error, falling back to stub: {}", e);
                    // Fall through to stub response
                }
            }
        }

        // 3. Stub mode response - still emit assistant signal
        let stub = self.stub_response(message);
        self.router.emit(Signal::new(
            SignalSource::System,
            SignalVariant::Chat(ChatPayload {
                session_id: session_id.clone(),
                role: SignalRole::Assistant,
                content: stub.message.clone(),
            }),
        ));

        Ok(stub)
    }

    /// Generate a stub response (AI not ready)
    fn stub_response(&self, message: &str) -> ChatResponse {
        let response = format!(
            "I received your message ({} chars). \n\n\
             AI is currently initializing. The app is fully functional - \
             you can manage projects, configure settings, and explore the UI. \
             Chat responses will be available once models are loaded.\n\n\
             Tip: Check Settings → System Status to see model loading progress.",
            message.len()
        );

        ChatResponse {
            message: response,
            tokens_used: 0,
            is_stub: true,
        }
    }

    /// Get chat history for a session
    #[instrument(skip(self))]
    pub async fn history(&self, _session: &str) -> Result<Vec<Message>, EngineError> {
        // TODO: Wire to storage when ready
        // For now, return empty - non-AI feature, always works
        Ok(vec![])
    }

    /// Clear chat history for a session
    #[instrument(skip(self))]
    pub async fn clear(&self, _session: &str) -> Result<(), EngineError> {
        // TODO: Wire to storage when ready
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_router() -> Arc<SignalRouter> {
        Arc::new(SignalRouter::new())
    }

    #[tokio::test]
    async fn test_stub_response_works() {
        let router = test_router();
        let mut rx = router.subscribe();
        let facade = ChatFacade::new(Arc::clone(&router));

        let session_id = SessionId::new();
        let response = facade.send("Hello", &session_id).await.unwrap();

        assert!(response.is_stub);
        assert!(response.message.contains("AI is currently initializing"));

        // Should have emitted user message signal
        let user_signal = rx.recv().await.unwrap();
        assert_eq!(user_signal.name(), "chat");
        assert_eq!(user_signal.header.source, SignalSource::User);

        // Should have emitted assistant stub signal
        let assistant_signal = rx.recv().await.unwrap();
        assert_eq!(assistant_signal.name(), "chat");
        assert_eq!(assistant_signal.header.source, SignalSource::System);
    }

    #[tokio::test]
    async fn test_history_returns_empty() {
        let facade = ChatFacade::new(test_router());
        let history = facade.history("test-session").await.unwrap();
        assert!(history.is_empty());
    }

    #[tokio::test]
    async fn test_signals_emitted_on_send() {
        let router = test_router();
        let mut rx = router.subscribe();
        let facade = ChatFacade::new(Arc::clone(&router));
        let session_id = SessionId::new();

        facade.send("Test message", &session_id).await.unwrap();

        // Verify user message signal
        let sig1 = rx.recv().await.unwrap();
        if let SignalVariant::Chat(payload) = &*sig1.payload {
            assert_eq!(payload.role, SignalRole::User);
            assert_eq!(payload.content, "Test message");
            assert_eq!(payload.session_id, session_id);
        } else {
            panic!("Expected Chat signal");
        }

        // Verify assistant response signal
        let sig2 = rx.recv().await.unwrap();
        if let SignalVariant::Chat(payload) = &*sig2.payload {
            assert_eq!(payload.role, SignalRole::Assistant);
            assert_eq!(payload.session_id, session_id);
        } else {
            panic!("Expected Chat signal");
        }
    }
}
