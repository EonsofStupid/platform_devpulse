// engine/src/registry/sessions.rs

//! Session registry - manage chat sessions with libSQL persistence
//!
//! Non-AI feature that works immediately.
//! Persists to libSQL - survives restarts.

use crate::error::EngineError;
use orchestrator::infra::persistence::sql::Database;
use serde::{Deserialize, Serialize};
use shared::types::ids::SessionId;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::instrument;

/// A chat session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub project_id: Option<String>,
    pub title: String,
    pub created_at: String,
    pub last_message_at: Option<String>,
    pub message_count: u32,
}

/// Session registry with libSQL persistence
pub struct SessionRegistry {
    /// In-memory cache (loaded from DB on init)
    cache: RwLock<Vec<Session>>,
    /// Active session ID
    active: RwLock<Option<String>>,
    /// Database handle
    db: Arc<Database>,
}

impl SessionRegistry {
    /// Create new session registry, loading from database
    #[instrument(skip(db))]
    pub async fn new(db: Arc<Database>) -> Result<Self, EngineError> {
        let registry = Self {
            cache: RwLock::new(Vec::new()),
            active: RwLock::new(None),
            db,
        };

        // Load existing sessions from database
        registry.load_from_db().await?;

        tracing::info!(
            "SessionRegistry loaded {} sessions",
            registry.cache.read().await.len()
        );
        Ok(registry)
    }

    /// Load all sessions from database into cache
    async fn load_from_db(&self) -> Result<(), EngineError> {
        let db_sessions = self
            .db
            .list_sessions(None)
            .await
            .map_err(|e| EngineError::Database(e.to_string()))?;

        let mut cache = self.cache.write().await;
        cache.clear();

        for s in db_sessions {
            cache.push(Session {
                id: s.id,
                project_id: s.project_id,
                title: "Chat".to_string(), // Title not in DB yet
                created_at: s.created_at,
                last_message_at: s.last_message_at,
                message_count: s.message_count,
            });
        }

        Ok(())
    }

    /// List all sessions, optionally filtered by project (from cache)
    #[instrument(skip(self))]
    pub async fn list(&self, project_id: Option<&str>) -> Vec<Session> {
        let cache = self.cache.read().await;
        let mut list: Vec<_> = cache
            .iter()
            .filter(|s| project_id.is_none() || s.project_id.as_deref() == project_id)
            .cloned()
            .collect();

        // Sort by last_message_at descending (most recent first)
        list.sort_by(|a, b| {
            let a_time = a.last_message_at.as_deref().unwrap_or(&a.created_at);
            let b_time = b.last_message_at.as_deref().unwrap_or(&b.created_at);
            b_time.cmp(a_time)
        });
        list
    }

    /// Get a session by ID
    pub async fn get(&self, id: &str) -> Option<Session> {
        let cache = self.cache.read().await;
        cache.iter().find(|s| s.id == id).cloned()
    }

    /// Create a new session - persists to database
    #[instrument(skip(self))]
    pub async fn create(&self, project_id: Option<String>) -> Result<Session, EngineError> {
        let session_id = SessionId::new();

        // Parse project_id string to ProjectId if provided
        let project_id_parsed = match &project_id {
            Some(pid) => {
                let uuid = pid.parse::<uuid::Uuid>()
                    .map_err(|_| EngineError::InvalidPath(format!("Invalid project ID: {}", pid)))?;
                Some(shared::types::ids::ProjectId::from_uuid(uuid))
            }
            None => None,
        };

        // Persist to database
        self.db
            .create_session(
                &session_id,
                project_id_parsed.as_ref(),
            )
            .await
            .map_err(|e| EngineError::Database(e.to_string()))?;

        // Reload cache
        self.load_from_db().await?;

        // Get the created session
        let id_str = session_id.as_str();
        let session = self
            .get(&id_str)
            .await
            .ok_or_else(|| EngineError::Database("Failed to reload after insert".to_string()))?;

        // Auto-select new session
        let mut active = self.active.write().await;
        *active = Some(session.id.clone());

        tracing::info!("Session created: {}", session.id);
        Ok(session)
    }

    /// Delete a session - removes from database
    #[instrument(skip(self))]
    pub async fn delete(&self, id: &str) -> Result<(), EngineError> {
        self.db
            .delete_session(id)
            .await
            .map_err(|e| EngineError::Database(e.to_string()))?;

        // Reload cache
        self.load_from_db().await?;

        // Clear active if this was active
        let mut active = self.active.write().await;
        if active.as_deref() == Some(id) {
            *active = None;
        }

        tracing::info!("Session deleted: {}", id);
        Ok(())
    }

    /// Record a message was added (refreshes cache to get updated count)
    #[instrument(skip(self))]
    pub async fn record_message(&self, id: &str) -> Result<(), EngineError> {
        // Verify session exists
        if self.get(id).await.is_none() {
            return Err(EngineError::SessionNotFound(id.to_string()));
        }

        // Reload cache to pick up new message count from DB
        self.load_from_db().await?;
        Ok(())
    }

    /// Get active session
    pub async fn active(&self) -> Option<Session> {
        let active = self.active.read().await;
        match &*active {
            Some(id) => self.get(id).await,
            None => None,
        }
    }

    /// Set active session
    #[instrument(skip(self))]
    pub async fn set_active(&self, id: &str) -> Result<(), EngineError> {
        // Verify session exists
        if self.get(id).await.is_none() {
            return Err(EngineError::SessionNotFound(id.to_string()));
        }

        let mut active = self.active.write().await;
        *active = Some(id.to_string());

        tracing::info!("Session activated: {}", id);
        Ok(())
    }

    /// Get total session count
    pub async fn count(&self) -> usize {
        self.cache.read().await.len()
    }
}

#[cfg(test)]
mod tests {
    // Tests require database setup - will add integration tests
}
