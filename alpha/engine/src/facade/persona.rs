// engine/src/facade/persona.rs

//! Persona facade - manage Maestro personalities
//!
//! Wraps orchestrator Database with persona operations.
//! Emits signals on persona changes for UI sync.

use crate::error::EngineError;
use crate::signals::{Signal, SignalRouter, SignalSource, SignalVariant, SystemPayload};
use orchestrator::infra::persistence::sql::Database;
use shared::config::{Persona, PersonaSummary};
use std::sync::Arc;
use tracing::instrument;

/// Persona facade - entry point for persona management
pub struct PersonaFacade {
    db: Arc<Database>,
    router: Arc<SignalRouter>,
}

impl PersonaFacade {
    /// Create new persona facade
    pub fn new(db: Arc<Database>, router: Arc<SignalRouter>) -> Self {
        Self { db, router }
    }

    /// Initialize - ensure default persona exists
    #[instrument(skip(self))]
    pub async fn init(&self) -> Result<(), EngineError> {
        self.db
            .ensure_default_persona()
            .await
            .map_err(|e| EngineError::Database(e.to_string()))?;
        Ok(())
    }

    /// Get the currently active persona
    #[instrument(skip(self))]
    pub async fn get_active(&self) -> Result<Persona, EngineError> {
        self.db
            .get_active_persona()
            .await
            .map_err(|e| EngineError::Database(e.to_string()))?
            .ok_or_else(|| EngineError::NotFound("No active persona".to_string()))
    }

    /// Get persona by ID
    #[instrument(skip(self))]
    pub async fn get(&self, id: &str) -> Result<Option<Persona>, EngineError> {
        self.db
            .get_persona(id)
            .await
            .map_err(|e| EngineError::Database(e.to_string()))
    }

    /// List all personas
    #[instrument(skip(self))]
    pub async fn list(&self) -> Result<Vec<Persona>, EngineError> {
        self.db
            .list_personas()
            .await
            .map_err(|e| EngineError::Database(e.to_string()))
    }

    /// List personas as summaries (lighter)
    #[instrument(skip(self))]
    pub async fn list_summaries(&self) -> Result<Vec<PersonaSummary>, EngineError> {
        let personas = self.list().await?;
        Ok(personas.iter().map(PersonaSummary::from).collect())
    }

    /// Save a persona (create or update)
    #[instrument(skip(self, persona), fields(persona_id = %persona.id))]
    pub async fn save(&self, persona: &Persona) -> Result<(), EngineError> {
        self.db
            .save_persona(persona)
            .await
            .map_err(|e| EngineError::Database(e.to_string()))?;

        // Emit system signal for UI sync
        self.router.emit(Signal::new(
            SignalSource::System,
            SignalVariant::System(SystemPayload {
                event: "persona_updated".to_string(),
                message: format!("Persona '{}' saved", persona.name),
                data: Some(serde_json::json!({
                    "id": persona.id,
                    "name": persona.name,
                })),
            }),
        ));

        tracing::info!(persona_id = %persona.id, "Persona saved");
        Ok(())
    }

    /// Create a new persona
    #[instrument(skip(self))]
    pub async fn create(&self, name: &str, instructions: &str) -> Result<Persona, EngineError> {
        let persona = Persona::new(name, instructions);
        self.save(&persona).await?;
        Ok(persona)
    }

    /// Set the active persona
    #[instrument(skip(self))]
    pub async fn set_active(&self, id: &str) -> Result<(), EngineError> {
        // Verify persona exists
        let persona = self
            .get(id)
            .await?
            .ok_or_else(|| EngineError::NotFound(format!("Persona not found: {}", id)))?;

        self.db
            .set_active_persona(id)
            .await
            .map_err(|e| EngineError::Database(e.to_string()))?;

        // Emit system signal
        self.router.emit(Signal::new(
            SignalSource::System,
            SignalVariant::System(SystemPayload {
                event: "persona_activated".to_string(),
                message: format!("Active persona: {}", persona.name),
                data: Some(serde_json::json!({
                    "id": id,
                    "name": persona.name,
                })),
            }),
        ));

        tracing::info!(persona_id = %id, "Persona activated");
        Ok(())
    }

    /// Delete a persona (cannot delete default)
    #[instrument(skip(self))]
    pub async fn delete(&self, id: &str) -> Result<bool, EngineError> {
        let deleted = self
            .db
            .delete_persona(id)
            .await
            .map_err(|e| EngineError::Database(e.to_string()))?;

        if deleted {
            self.router.emit(Signal::new(
                SignalSource::System,
                SignalVariant::System(SystemPayload {
                    event: "persona_deleted".to_string(),
                    message: format!("Persona {} deleted", id),
                    data: Some(serde_json::json!({ "id": id })),
                }),
            ));
            tracing::info!(persona_id = %id, "Persona deleted");
        }

        Ok(deleted)
    }

    /// Get active persona's instructions (for ChatEngine)
    #[instrument(skip(self))]
    pub async fn get_system_prompt(&self) -> Result<String, EngineError> {
        let persona = self.get_active().await?;
        Ok(persona.instructions)
    }
}
