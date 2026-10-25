// engine/src/facade/models.rs

//! Models facade - manage model selection and loading
//!
//! Wraps orchestrator ModelRegistry for Lab UI.
//! Handles model switching, loading, and availability checks.
//!
//! VL models can be hot-swapped - unload current, load new.

use crate::error::EngineError;
use crate::signals::{
    DiagnosticEvent, DiagnosticPayload, Signal, SignalRouter, SignalSource, SignalVariant,
    SystemPayload,
};
use orchestrator::infra::persistence::sql::Database;
use orchestrator::infra::catalog::models::{ModelFamily as OrcModelFamily, ModelRegistry};
use orchestrator::infra::vision::vl::VLBackend;
use shared::types::models::{ModelFamily, ModelInfo, ModelLoadState, ModelSummary};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tracing::instrument;

/// Models facade - entry point for model management
pub struct ModelFacade {
    registry: Arc<RwLock<ModelRegistry>>,
    router: Arc<SignalRouter>,
    /// VL backend for loading VL models
    vl_backend: Arc<VLBackend>,
}

impl ModelFacade {
    /// Create new models facade
    pub fn new(registry: Arc<RwLock<ModelRegistry>>, router: Arc<SignalRouter>) -> Self {
        // Create VL backend with the registry
        let vl_backend = Arc::new(VLBackend::new(Arc::clone(&registry)));

        Self { registry, router, vl_backend }
    }

    /// List all available models
    #[instrument(skip(self))]
    pub fn list_all(&self) -> Result<Vec<ModelInfo>, EngineError> {
        let registry = self.registry.read().map_err(|e| {
            EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
        })?;

        let specs = registry.list_all();
        let mut models = Vec::with_capacity(specs.len());

        for spec in specs {
            let available = registry.verify(&spec.id).is_ok();
            let is_active = registry
                .get_active(spec.family)
                .map(|a| a.id == spec.id)
                .unwrap_or(false);

            models.push(ModelInfo {
                id: spec.id.clone(),
                name: spec.name.clone(),
                family: convert_family(spec.family),
                params_b: spec.size.params_b,
                quantization: spec.size.quant.clone(),
                vram_gb: spec.memory.vram_gb,
                available,
                is_active,
            });
        }

        Ok(models)
    }

    /// List models by family
    #[instrument(skip(self))]
    pub fn list_family(&self, family: ModelFamily) -> Result<Vec<ModelInfo>, EngineError> {
        let orc_family = to_orc_family(family);
        let registry = self.registry.read().map_err(|e| {
            EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
        })?;

        let specs = registry.list_family(orc_family);
        let mut models = Vec::with_capacity(specs.len());

        for spec in specs {
            let available = registry.verify(&spec.id).is_ok();
            let is_active = registry
                .get_active(spec.family)
                .map(|a| a.id == spec.id)
                .unwrap_or(false);

            models.push(ModelInfo {
                id: spec.id.clone(),
                name: spec.name.clone(),
                family: convert_family(spec.family),
                params_b: spec.size.params_b,
                quantization: spec.size.quant.clone(),
                vram_gb: spec.memory.vram_gb,
                available,
                is_active,
            });
        }

        Ok(models)
    }

    /// Get model by ID
    #[instrument(skip(self))]
    pub fn get(&self, id: &str) -> Result<Option<ModelInfo>, EngineError> {
        let registry = self.registry.read().map_err(|e| {
            EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
        })?;

        let spec = match registry.get(id) {
            Some(s) => s,
            None => return Ok(None),
        };

        let available = registry.verify(id).is_ok();
        let is_active = registry
            .get_active(spec.family)
            .map(|a| a.id == spec.id)
            .unwrap_or(false);

        Ok(Some(ModelInfo {
            id: spec.id.clone(),
            name: spec.name.clone(),
            family: convert_family(spec.family),
            params_b: spec.size.params_b,
            quantization: spec.size.quant.clone(),
            vram_gb: spec.memory.vram_gb,
            available,
            is_active,
        }))
    }

    /// Set active model for a family
    #[instrument(skip(self))]
    pub fn set_active(&self, id: &str) -> Result<(), EngineError> {
        let mut registry = self.registry.write().map_err(|e| {
            EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
        })?;

        let spec = registry
            .get(id)
            .ok_or_else(|| EngineError::NotFound(format!("Model not found: {}", id)))?
            .clone();

        // Verify files exist
        registry
            .verify(id)
            .map_err(|e| EngineError::NotFound(format!("Model files missing: {}", e)))?;

        registry
            .set_active(spec.family, id)
            .map_err(|e| EngineError::Orchestrator(e.to_string()))?;

        // Emit system signal
        self.router.emit(Signal::new(
            SignalSource::System,
            SignalVariant::System(SystemPayload {
                event: "model_activated".to_string(),
                message: format!("Active model: {}", spec.name),
                data: Some(serde_json::json!({
                    "id": id,
                    "name": spec.name,
                    "family": spec.family.to_string(),
                })),
            }),
        ));

        tracing::info!(model_id = %id, family = %spec.family, "Model activated");
        Ok(())
    }

    /// Get summary of all models
    #[instrument(skip(self))]
    pub fn summary(&self) -> Result<ModelSummary, EngineError> {
        let registry = self.registry.read().map_err(|e| {
            EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
        })?;

        let all_models = registry.list_all();
        let total_models = all_models.len();
        let missing_count = all_models
            .iter()
            .filter(|s| registry.verify(&s.id).is_err())
            .count();

        let active_vl = registry
            .get_active(OrcModelFamily::Qwen3VL)
            .map(|s| s.id.clone());
        let active_embed = registry
            .get_active(OrcModelFamily::Qwen3Embed)
            .map(|s| s.id.clone());
        let active_rerank = registry
            .get_active(OrcModelFamily::Qwen3Rerank)
            .map(|s| s.id.clone());

        Ok(ModelSummary {
            active_vl,
            active_embed,
            active_rerank,
            total_models,
            missing_count,
        })
    }

    /// Verify a model's files exist
    #[instrument(skip(self))]
    pub fn verify(&self, id: &str) -> Result<bool, EngineError> {
        let registry = self.registry.read().map_err(|e| {
            EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
        })?;

        Ok(registry.verify(id).is_ok())
    }

    /// Set active model with database persistence
    #[instrument(skip(self, db))]
    pub async fn set_active_with_persistence(
        &self,
        id: &str,
        db: &Database,
    ) -> Result<(), EngineError> {
        let spec = {
            let mut registry = self.registry.write().map_err(|e| {
                EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
            })?;

            let spec = registry
                .get(id)
                .ok_or_else(|| EngineError::NotFound(format!("Model not found: {}", id)))?
                .clone();

            // Verify files exist
            registry
                .verify(id)
                .map_err(|e| EngineError::NotFound(format!("Model files missing: {}", e)))?;

            // Emit loading signal
            self.emit_diagnostic(&spec.id, DiagnosticEvent::Loading {
                model_name: spec.name.clone(),
            });

            // Set active in registry
            registry
                .set_active(spec.family, id)
                .map_err(|e| EngineError::Orchestrator(e.to_string()))?;

            // Update load state
            registry.set_load_state(
                spec.family,
                ModelLoadState::Loading {
                    progress_pct: 50,
                    stage: "activating".to_string(),
                },
            );

            spec
        };

        // Persist to database (outside of lock)
        db.set_active_model(&spec.family.to_string(), id)
            .await
            .map_err(|e| EngineError::Orchestrator(format!("Failed to persist: {}", e)))?;

        // Update load state to loaded
        {
            let mut registry = self.registry.write().map_err(|e| {
                EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
            })?;
            registry.set_load_state(
                spec.family,
                ModelLoadState::Loaded {
                    vram_mb: (spec.memory.vram_gb * 1024.0) as u64,
                    latency_ms: 0, // Model was already loaded
                },
            );
        }

        // Emit completion signals
        self.emit_diagnostic(&spec.id, DiagnosticEvent::Loaded { latency_ms: 0 });
        self.router.emit(Signal::new(
            SignalSource::System,
            SignalVariant::System(SystemPayload {
                event: "model_activated".to_string(),
                message: format!("Active model: {}", spec.name),
                data: Some(serde_json::json!({
                    "id": id,
                    "name": spec.name,
                    "family": spec.family.to_string(),
                    "persisted": true,
                })),
            }),
        ));

        tracing::info!(model_id = %id, family = %spec.family, "Model activated and persisted");
        Ok(())
    }

    /// Get load states for all families
    #[instrument(skip(self))]
    pub fn get_load_states(&self) -> Result<HashMap<String, ModelLoadState>, EngineError> {
        let registry = self.registry.read().map_err(|e| {
            EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
        })?;

        let states = registry.get_all_load_states();
        let mut result = HashMap::new();

        for (family, state) in states {
            result.insert(family.to_string(), state);
        }

        Ok(result)
    }

    /// Load persisted active models from database on startup
    #[instrument(skip(self, db))]
    pub async fn load_persisted_actives(&self, db: &Database) -> Result<(), EngineError> {
        let mut registry = self.registry.write().map_err(|e| {
            EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
        })?;

        registry
            .load_persisted_actives(db)
            .await
            .map_err(|e| EngineError::Orchestrator(format!("Failed to load actives: {}", e)))?;

        Ok(())
    }

    /// Emit a diagnostic signal
    fn emit_diagnostic(&self, model_id: &str, event: DiagnosticEvent) {
        self.router.emit(Signal::new(
            SignalSource::System,
            SignalVariant::Diagnostic(DiagnosticPayload {
                component: format!("model:{}", model_id),
                event,
                progress_pct: None,
                memory_mb: None,
                device: None,
            }),
        ));
    }

    // ============== VL Model Loading ==============

    /// Load a VL model into VRAM with guardrails
    ///
    /// This actually loads the model weights and vision projector.
    /// Emits progress signals as loading proceeds.
    ///
    /// Guardrails:
    /// 1. Verify model exists in registry
    /// 2. Verify model files exist on disk
    /// 3. Check VRAM requirements
    /// 4. Unload existing model first to free VRAM
    #[instrument(skip(self))]
    pub fn load_vl_model(&self, model_id: &str) -> Result<(), EngineError> {
        // GUARDRAIL 1: Check model exists in registry
        let spec = {
            let registry = self.registry.read().map_err(|e| {
                EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
            })?;

            registry.get(model_id)
                .cloned()
                .ok_or_else(|| EngineError::NotFound(format!("Model '{}' not in registry", model_id)))?
        };

        // GUARDRAIL 2: Verify model files exist
        {
            let registry = self.registry.read().map_err(|e| {
                EngineError::Orchestrator(format!("Failed to lock registry: {}", e))
            })?;

            if let Err(e) = registry.verify(model_id) {
                return Err(EngineError::NotFound(format!(
                    "Model '{}' files missing: {}. Download required.", model_id, e
                )));
            }
        }

        // GUARDRAIL 3: Check VRAM requirements
        let required_vram_gb = spec.memory.vram_gb;
        // TODO: Query actual available VRAM via GPU info (candle device query)
        let available_vram_gb = 8.0; // Placeholder - should query system

        if required_vram_gb > available_vram_gb {
            return Err(EngineError::Orchestrator(format!(
                "Insufficient VRAM: model '{}' requires {:.1} GB but only {:.1} GB available",
                model_id, required_vram_gb, available_vram_gb
            )));
        }

        // GUARDRAIL 4: Unload existing model first to free VRAM
        if self.vl_backend.is_loaded() {
            let current = self.vl_backend.current_id();
            tracing::info!(
                current_model = ?current,
                new_model = %model_id,
                "Unloading current VL model to free VRAM"
            );
            self.vl_backend.unload();
        }

        // Emit loading started
        self.emit_diagnostic(model_id, DiagnosticEvent::Loading {
            model_name: spec.name.clone(),
        });

        // Set up progress callback to emit signals
        let router = Arc::clone(&self.router);
        let model_id_for_cb = model_id.to_string();
        self.vl_backend.set_progress_callback(Box::new(move |pct, stage| {
            router.emit(Signal::new(
                SignalSource::System,
                SignalVariant::Diagnostic(DiagnosticPayload {
                    component: format!("model:{}", model_id_for_cb),
                    event: DiagnosticEvent::Progress {
                        stage: stage.to_string(),
                        detail: Some(format!("{}%", pct)),
                    },
                    progress_pct: Some(pct),
                    memory_mb: None,
                    device: None,
                }),
            ));
        }));

        // Load the model
        match self.vl_backend.load(model_id) {
            Ok(()) => {
                self.emit_diagnostic(model_id, DiagnosticEvent::Loaded { latency_ms: 0 });
                self.router.emit(Signal::new(
                    SignalSource::System,
                    SignalVariant::System(SystemPayload {
                        event: "vl_model_loaded".to_string(),
                        message: format!("VL model loaded: {}", spec.name),
                        data: Some(serde_json::json!({
                            "model_id": model_id,
                            "name": spec.name,
                            "vram_gb": spec.memory.vram_gb,
                        })),
                    }),
                ));
                tracing::info!(
                    model_id = %model_id,
                    model_name = %spec.name,
                    vram_gb = %spec.memory.vram_gb,
                    "VL model loaded successfully"
                );
                Ok(())
            }
            Err(e) => {
                self.emit_diagnostic(model_id, DiagnosticEvent::Failed {
                    error: e.to_string(),
                });
                Err(EngineError::Orchestrator(format!("Failed to load VL model: {}", e)))
            }
        }
    }

    /// Switch to a different VL model
    ///
    /// Unloads current model (freeing VRAM) and loads the new one.
    #[instrument(skip(self))]
    pub fn switch_vl_model(&self, model_id: &str) -> Result<(), EngineError> {
        self.vl_backend.switch(model_id)
            .map_err(|e| EngineError::Orchestrator(format!("Failed to switch VL model: {}", e)))
    }

    /// Unload current VL model
    pub fn unload_vl_model(&self) {
        self.vl_backend.unload();
    }

    /// Check if a VL model is currently loaded
    pub fn is_vl_loaded(&self) -> bool {
        self.vl_backend.is_loaded()
    }

    /// Get currently loaded VL model ID
    pub fn current_vl_model(&self) -> Option<String> {
        self.vl_backend.current_id()
    }
}

/// Convert orchestrator ModelFamily to shared ModelFamily
fn convert_family(family: OrcModelFamily) -> ModelFamily {
    match family {
        OrcModelFamily::Qwen3Embed => ModelFamily::Qwen3Embed,
        OrcModelFamily::Qwen3Rerank => ModelFamily::Qwen3Rerank,
        OrcModelFamily::Qwen3VL => ModelFamily::Qwen3VL,
        OrcModelFamily::Whisper => ModelFamily::Whisper,
        OrcModelFamily::Kokoro => ModelFamily::Kokoro,
    }
}

/// Convert shared ModelFamily to orchestrator ModelFamily
fn to_orc_family(family: ModelFamily) -> OrcModelFamily {
    match family {
        ModelFamily::Qwen3Embed => OrcModelFamily::Qwen3Embed,
        ModelFamily::Qwen3Rerank => OrcModelFamily::Qwen3Rerank,
        ModelFamily::Qwen3VL => OrcModelFamily::Qwen3VL,
        ModelFamily::Whisper => OrcModelFamily::Whisper,
        ModelFamily::Kokoro => OrcModelFamily::Kokoro,
    }
}
