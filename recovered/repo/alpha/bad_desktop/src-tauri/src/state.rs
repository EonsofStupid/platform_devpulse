//! Application state management
//!
//! Holds the Engine instance and active session.
//! Engine is lazily initialized on first access.

use engine::{Engine, EngineConfig, Session};
use shared::types::ids::SessionId;
use std::sync::Arc;
use tokio::sync::{Mutex, OnceCell};

/// Application state - engine + active session
pub struct AppState {
    engine: OnceCell<Arc<Engine>>,
    /// Current active session for chat
    active_session: Mutex<Option<Session>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            engine: OnceCell::new(),
            active_session: Mutex::new(None),
        }
    }
}

impl AppState {
    /// Get or initialize the engine (Desktop mode - no analytics)
    pub async fn engine(&self) -> Result<&Arc<Engine>, String> {
        self.engine
            .get_or_try_init(|| async {
                Engine::init(EngineConfig::desktop())
                    .await
                    .map(Arc::new)
                    .map_err(|e| e.to_string())
            })
            .await
            .map_err(|e| e.to_string())
    }

    /// Get or create the active session
    pub async fn get_or_create_session(&self, engine: &Engine) -> Result<SessionId, String> {
        let mut session = self.active_session.lock().await;

        if let Some(ref s) = *session {
            // Parse existing session ID
            let uuid = s
                .id
                .parse::<uuid::Uuid>()
                .map_err(|e| format!("Invalid session ID: {}", e))?;
            return Ok(SessionId::from_uuid(uuid));
        }

        // Create new session (no project selected)
        let new_session = engine
            .sessions
            .create(None)
            .await
            .map_err(|e| format!("Failed to create session: {}", e))?;

        let uuid = new_session
            .id
            .parse::<uuid::Uuid>()
            .map_err(|e| format!("Invalid session ID: {}", e))?;
        let session_id = SessionId::from_uuid(uuid);

        *session = Some(new_session);
        Ok(session_id)
    }
}
