// engine/src/lib.rs

//! DevPulse Engine - The Hub
//!
//! Engine is the central coordinator that all consumers (Desktop, Lab) talk to.
//! It provides a clean facade over the complex orchestrator subsystem.
//!
//! # Architecture
//!
//! ```text
//! Desktop/Lab → Engine → Orchestrator
//!                 ↓
//!            Stub mode if AI not ready
//! ```
//!
//! # Graceful Degradation
//!
//! Engine works even without AI:
//! - Project management works immediately
//! - Session tracking works immediately
//! - Settings work immediately
//! - Chat returns helpful stubs
//!
//! This enables dogfooding the app while AI features are being developed.
//!
//! # Usage
//!
//! ```ignore
//! let engine = Engine::init().await?;
//!
//! // Non-AI features work immediately
//! engine.projects.add("/path/to/project").await?;
//! let session = engine.sessions.create(None).await?;
//!
//! // Chat works (returns stub if AI not ready)
//! // Emits Chat and Inference signals automatically
//! let session_id = shared::types::ids::SessionId::from_uuid(session.id.parse().unwrap());
//! let response = engine.chat.send("Hello", &session_id).await?;
//! if response.is_stub {
//!     println!("AI initializing...");
//! }
//!
//! // Subscribe to signals for UI updates
pub mod error;
pub mod facade;
pub mod indexer;
pub mod platform;
pub mod registry;
pub mod signals;
pub mod system_status;
pub mod types;
// pub mod tools; // TODO: Create tools module when needed
pub mod voice;

// Dev-only module - exposes orchestrator internals for Lab/debugging
// STRIPPED from release builds via --no-default-features
#[cfg(feature = "dev-tools")]
pub mod dev;

pub use error::EngineError;
pub use facade::{
    ActiveAdapter, ChatFacade, ChatResponse, DiscoveryFacade, Message, ModelFacade,
    PersonaFacade, AdapterFacade, VoiceFacade, VoiceDiscoveryFacade,
};

// Engine-local types (public-safe, no orchestrator leaks)
pub use types::{ConfigEntry, DiscoveredModel, ModelInfo};

// Re-export shared adapter types (SSOT)
pub use shared::{AdapterKind, AdapterInfo, LlmProvider};

pub use indexer::{IndexProgress, IndexStage, IndexStats, ProjectIndexer};
pub use platform::{ProcessSensor, WindowSensor};
pub use registry::{Project, ProjectRegistry, ProjectType, Session, SessionRegistry};
pub use signals::{
    current_time_millis, Signal, SignalHeader, SignalRouter, SignalSource, SignalVariant, SinkKind,
    // Payload types for consumers
    DebugLevel, DebugPayload, ChatPayload, Role, InferencePayload,
    RuminationEvent, RuminationLayer, RuminationPayload, ThoughtNodePayload,
    // Diagnostic payloads for model loading observability
    DiagnosticPayload, DiagnosticEvent, HealthStatus,
};
pub use system_status::{SystemStatus, SystemStatusSnapshot, ComponentStatus, LoadState};

use orchestrator::infra::persistence::analytics::Analytics;
use orchestrator::infra::persistence::audit::FjallStores;
use orchestrator::infra::persistence::sql::Database;
use orchestrator::infra::catalog::models::ModelRegistry;
use orchestrator::infra::persistence::memory::HotCache;
use shared::config::paths::get_paths;
use signals::SignalProcessor;
use std::sync::{Arc, RwLock};

// Re-export analytics types from shared (SSOT)
pub use shared::types::analytics::{AnalyticsSummary, FullAnalytics, HopStats, InferenceStats};

/// Engine configuration
///
/// Controls optional features based on runtime context.
/// Desktop doesn't need analytics (avoids DuckDB file locks).
#[derive(Default, Clone)]
pub struct EngineConfig {
    /// Enable analytics (DuckDB). Only Lab needs this.
    pub with_analytics: bool,
}

impl EngineConfig {
    /// Configuration for Desktop app (no analytics)
    pub fn desktop() -> Self {
        Self { with_analytics: false }
    }

    /// Configuration for Lab app (full analytics)
    /// 
    /// Only available in debug builds - Lab is a development tool
    #[cfg(debug_assertions)]
    pub fn lab() -> Self {
        Self { with_analytics: true }
    }
}

/// DevPulse Engine - the hub
///
/// Single entry point for all consumers.
/// Provides graceful degradation when AI isn't ready.
pub struct Engine {
    /// Database handle (shared with registries)
    db: Arc<Database>,

    /// Analytics database (DuckDB) - only present in Lab mode
    analytics: Option<Arc<Analytics>>,

    /// Signal router - DUMB broadcaster (Arc for sharing with facades)
    /// Desktop and Orchestrator subscribe to this
    pub router: Arc<SignalRouter>,

    /// System status tracking (model loading, component health)
    pub system_status: Arc<SystemStatus>,

    /// Chat functionality (with stub fallback, emits signals)
    pub chat: ChatFacade,

    /// Adapter management (always works)
    pub adapters: AdapterFacade,

    /// Voice STT/TTS (may not be ready)
    pub voice: VoiceFacade,

    /// Persona management (always works, persists to libSQL)
    pub persona: PersonaFacade,

    /// Model management (always works)
    pub models: ModelFacade,

    /// Model discovery - scan folders for GGUF models (adapter-based)
    pub discovery: DiscoveryFacade,

    /// Voice model discovery - scan folders for Whisper/Kokoro models
    pub voice_discovery: VoiceDiscoveryFacade,

    /// Project registry (non-AI, always works, persists to libSQL)
    pub projects: ProjectRegistry,

    /// Session registry (non-AI, always works, persists to libSQL)
    pub sessions: SessionRegistry,
}

impl Engine {
    /// Initialize the engine with configuration
    ///
    /// This always succeeds - if AI init fails, we enter stub mode.
    /// Non-AI features are always available.
    ///
    /// # Arguments
    /// * `config` - Engine configuration (use `EngineConfig::desktop()` or `EngineConfig::lab()`)
    pub async fn init(config: EngineConfig) -> Result<Self, EngineError> {
        use std::time::Instant;
        use system_status::ComponentStatus;

        tracing::info!("Engine initializing (analytics: {})...", config.with_analytics);

        // Create system status tracker
        let system_status = Arc::new(SystemStatus::new());

        // Get paths and ensure directories exist
        let paths = get_paths();
        paths.ensure_dirs()
            .map_err(|e| EngineError::Storage(format!("Failed to create directories: {}", e)))?;

        // Open database (critical - data persistence)
        let db_start = Instant::now();
        system_status.update("database", ComponentStatus::new("database").loading());
        tracing::info!("[database] Opening database at {:?}", paths.global_db);
        let db = Database::open(&paths.global_db).await
            .map_err(|e| {
                system_status.update("database", ComponentStatus::new("database").failed(&e.to_string()));
                EngineError::Database(format!("Failed to open database: {}", e))
            })?;
        let db = Arc::new(db);
        system_status.update("database", ComponentStatus::new("database").loaded(
            0, "libSQL", db_start.elapsed().as_millis() as u64
        ));
        tracing::info!("[database] Database opened in {}ms", db_start.elapsed().as_millis());

        // Open analytics database (DuckDB) - only if configured (Lab mode)
        let analytics = if config.with_analytics {
            let analytics_start = Instant::now();
            system_status.update("analytics", ComponentStatus::new("analytics").loading());
            tracing::info!("[analytics] Opening analytics database (Lab mode)");
            match Analytics::open() {
                Ok(analytics) => {
                    system_status.update("analytics", ComponentStatus::new("analytics").loaded(
                        0, "DuckDB", analytics_start.elapsed().as_millis() as u64
                    ));
                    tracing::info!("[analytics] Analytics opened in {}ms", analytics_start.elapsed().as_millis());
                    Some(Arc::new(analytics))
                }
                Err(e) => {
                    system_status.update("analytics", ComponentStatus::new("analytics").failed(&e.to_string()));
                    tracing::error!("[analytics] Failed to open analytics: {}", e);
                    return Err(EngineError::Storage(format!("Failed to open analytics: {}", e)));
                }
            }
        } else {
            system_status.update("analytics", ComponentStatus::new("analytics").skipped());
            tracing::info!("[analytics] Skipping analytics database (Desktop mode)");
            None
        };

        // Create hot cache (moka - tiered caching)
        let cache = HotCache::new();

        // Open fjall stores (signal replay)
        tracing::info!("[fjall] Opening fjall stores");
        let stores = FjallStores::open()
            .map_err(|e| EngineError::Storage(format!("Failed to open fjall: {}", e)))?;
        let stores = Arc::new(stores);

        // Create signal router (DUMB - just broadcasts)
        // Arc-wrapped so facades can emit signals
        let router = Arc::new(SignalRouter::new());

        // Emit initial diagnostic signal now that router is ready
        Self::emit_diagnostic(&router, "engine", DiagnosticEvent::Loading {
            model_name: "DevPulse Engine".to_string()
        });

        // Create and spawn SignalProcessor (routes signals to sinks)
        let processor = SignalProcessor::new(
            cache,
            Arc::clone(&db),
            Arc::clone(&stores),
            analytics.clone(),
        );
        let router_for_processor = Arc::clone(&router);
        tokio::spawn(async move {
            processor.run(router_for_processor).await;
        });
        tracing::info!("[signal_processor] SignalProcessor spawned");

        // Create facades with router access for signal emission
        let chat = ChatFacade::new(Arc::clone(&router));
        let adapters = AdapterFacade::new();
        let mut voice = VoiceFacade::new();
        let persona = PersonaFacade::new(Arc::clone(&db), Arc::clone(&router));

        // Create model registry and facade
        let model_registry = Arc::new(RwLock::new(ModelRegistry::new_from_paths(&paths)));
        let models = ModelFacade::new(model_registry, Arc::clone(&router));

        // Create discovery facade for adapter-based model scanning
        let discovery = DiscoveryFacade::new();

        // Create voice discovery facade for Whisper/Kokoro model scanning
        let voice_discovery = VoiceDiscoveryFacade::new();

        // Try to restore voice configuration from user config
        // Check if user has a saved voice model path
        if let Ok(Some(entry)) = db.get_user_config("voice_model_path").await {
            let voice_path = std::path::PathBuf::from(&entry.value);
            if voice_path.exists() {
                tracing::info!("[voice] Restoring voice models from saved path: {}", voice_path.display());
                // Scan the directory for voice models
                if let Ok(discovery_result) = voice_discovery.set_model_directory(&voice_path).await {
                    // If we found a ready Whisper model, use its parent as model paths
                    if let Some(whisper) = discovery_result.whisper_models.iter().find(|m| m.ready) {
                        if let Some(root) = whisper.path.parent() {
                            let model_paths = orchestrator::infra::audio::voice::ModelPaths::new(root.to_path_buf());
                            let ready = voice.init_with_paths(model_paths);
                            tracing::info!("[voice] Voice initialized from saved path: ready={}", ready);
                        }
                    }
                }
            }
        }

        // Create registries (non-AI, always work, backed by libSQL)
        let projects = ProjectRegistry::new(Arc::clone(&db)).await?;
        let sessions = SessionRegistry::new(Arc::clone(&db)).await?;

        // Bootstrap: ensure DevPulse itself is registered as project #0
        Self::bootstrap_self(&projects, &paths.data_dir).await?;

        // Initialize persona (ensure default exists)
        if let Err(e) = persona.init().await {
            tracing::warn!("[persona] Persona init failed: {}", e);
        }

        // Try to initialize AI - failure is OK (stub mode)
        let ai_start = Instant::now();
        system_status.update("llm", ComponentStatus::new("llm").loading());
        Self::emit_diagnostic(&router, "llm", DiagnosticEvent::Loading {
            model_name: "AI Chat Backend".to_string()
        });
        if let Err(e) = chat.init().await {
            system_status.update("llm", ComponentStatus::new("llm").failed(&e.to_string()));
            Self::emit_diagnostic(&router, "llm", DiagnosticEvent::Failed {
                error: e.to_string()
            });
            tracing::warn!("[llm] Chat AI init failed (stub mode): {}", e);
        } else {
            system_status.update("llm", ComponentStatus::new("llm").loaded(
                0, "stub", ai_start.elapsed().as_millis() as u64
            ));
            Self::emit_diagnostic(&router, "llm", DiagnosticEvent::Loaded {
                latency_ms: ai_start.elapsed().as_millis() as u64
            });
        }

        // Initialize voice
        let voice_start = Instant::now();
        system_status.update("voice_tts", ComponentStatus::new("voice_tts").loading());
        Self::emit_diagnostic(&router, "voice_tts", DiagnosticEvent::Loading {
            model_name: "Kokoro TTS".to_string()
        });
        if let Err(e) = voice.init().await {
            system_status.update("voice_tts", ComponentStatus::new("voice_tts").failed(&e.to_string()));
            Self::emit_diagnostic(&router, "voice_tts", DiagnosticEvent::Failed {
                error: e.to_string()
            });
            tracing::warn!("[voice] Voice init failed: {}", e);
        } else if voice.is_ready() {
            system_status.update("voice_tts", ComponentStatus::new("voice_tts").loaded(
                200, "CPU", voice_start.elapsed().as_millis() as u64
            ));
            Self::emit_diagnostic(&router, "voice_tts", DiagnosticEvent::Loaded {
                latency_ms: voice_start.elapsed().as_millis() as u64
            });
        }

        // Emit engine ready diagnostic
        Self::emit_diagnostic(&router, "engine", DiagnosticEvent::HealthCheck {
            status: if chat.is_ready() { HealthStatus::Healthy } else { HealthStatus::Degraded }
        });

        let projects_count = projects.list().await.len();
        tracing::info!(
            "[engine] Engine ready (ai={}, voice={}, projects={}, health={})",
            chat.is_ready(),
            voice.is_ready(),
            projects_count,
            system_status.overall_health()
        );

        Ok(Self {
            db,
            analytics,
            router,
            system_status,
            chat,
            adapters,
            voice,
            persona,
            models,
            discovery,
            voice_discovery,
            projects,
            sessions,
        })
    }

    /// Emit a diagnostic signal
    fn emit_diagnostic(router: &SignalRouter, component: &str, event: DiagnosticEvent) {
        let payload = DiagnosticPayload {
            component: component.to_string(),
            event,
            progress_pct: None,
            memory_mb: None,
            device: None,
        };
        let signal = Signal::new(
            SignalSource::System,
            SignalVariant::Diagnostic(payload),
        );
        router.emit(signal);
    }

    /// Is the AI pipeline ready?
    pub fn is_ai_ready(&self) -> bool {
        self.chat.is_ready()
    }

    /// Get engine status for display
    pub async fn status(&self) -> EngineStatus {
        EngineStatus {
            ai_ready: self.chat.is_ready(),
            voice_ready: self.voice.is_ready(),
            projects_count: self.projects.list().await.len(),
            sessions_count: self.sessions.list(None).await.len(),
            active_adapter: self.adapters.active().to_string(),
        }
    }

    /// Get database handle (for consumers that need direct access)
    pub fn database(&self) -> Arc<Database> {
        Arc::clone(&self.db)
    }

    /// Get active adapter
    pub async fn active_adapter(&self) -> facade::ActiveAdapter {
        self.adapters.active()
    }

    /// Set active adapter to local
    pub async fn set_local_adapter(&self) -> Result<(), EngineError> {
        self.adapters.set_local()
    }

    /// Set active adapter to a web adapter
    pub async fn set_provider(&self, adapter: shared::LlmProvider) -> Result<(), EngineError> {
        self.adapters.set_web(adapter)
    }

    /// Set active adapter by string
    pub async fn set_active_adapter_str(&self, kind: &str) -> Result<(), EngineError> {
        self.adapters.set_active_str(kind)
    }

    /// Get analytics inference stats
    ///
    /// Returns empty stats if analytics is disabled (Desktop mode).
    pub fn get_inference_stats(&self) -> Result<InferenceStats, EngineError> {
        match &self.analytics {
            Some(analytics) => analytics.get_inference_stats()
                .map_err(|e| EngineError::Storage(format!("Failed to get inference stats: {}", e))),
            None => Ok(InferenceStats::default()),
        }
    }

    /// Get analytics hop stats
    ///
    /// Returns empty stats if analytics is disabled (Desktop mode).
    pub fn get_hop_stats(&self) -> Result<HopStats, EngineError> {
        match &self.analytics {
            Some(analytics) => analytics.get_hop_stats()
                .map_err(|e| EngineError::Storage(format!("Failed to get hop stats: {}", e))),
            None => Ok(HopStats::default()),
        }
    }

    /// Get analytics event count
    ///
    /// Returns 0 if analytics is disabled (Desktop mode).
    pub fn get_event_count(&self) -> Result<u64, EngineError> {
        match &self.analytics {
            Some(analytics) => analytics.get_event_count()
                .map_err(|e| EngineError::Storage(format!("Failed to get event count: {}", e))),
            None => Ok(0),
        }
    }

    /// Check if analytics is enabled
    pub fn has_analytics(&self) -> bool {
        self.analytics.is_some()
    }

    /// Check database health by running a simple query
    ///
    /// Returns Ok with count of voice profiles on success.
    pub async fn check_db_health(&self) -> Result<usize, EngineError> {
        // Use voice profiles as a simple health check - we know this table exists
        match self.voice.list_voices() {
            Ok(voices) => Ok(voices.len()),
            Err(e) => Err(e),
        }
    }

    /// Get user-facing analytics summary (Desktop Dashboard)
    ///
    /// Curated subset appropriate for end users.
    /// Returns session count even if analytics is disabled.
    pub async fn get_user_analytics(&self) -> Result<AnalyticsSummary, EngineError> {
        let inference = self.get_inference_stats()?;
        Ok(AnalyticsSummary {
            total_sessions: self.sessions.count().await as u64,
            total_messages: inference.total_inferences, // Messages ≈ inferences
            inference,
        })
    }

    /// Get full internal analytics (Lab)
    ///
    /// Complete metrics for developer monitoring and baseline.
    /// Returns empty/default values if analytics is disabled.
    pub fn get_full_analytics(&self) -> Result<FullAnalytics, EngineError> {
        Ok(FullAnalytics {
            inference: self.get_inference_stats()?,
            hops: self.get_hop_stats()?,
            event_count: self.get_event_count()?,
        })
    }

    /// Send a chat message using the active persona's system prompt
    ///
    /// Convenience method that:
    /// 1. Fetches the active persona's instructions
    /// 2. Passes them to the chat engine as system prompt
    /// 3. Returns the response
    pub async fn chat_with_persona(
        &self,
        message: &str,
        session_id: &shared::types::ids::SessionId,
    ) -> Result<ChatResponse, EngineError> {
        // Get system prompt from active persona
        let system_prompt = self.persona.get_system_prompt().await.ok();

        // Send with persona's instructions
        self.chat
            .send_with_prompt(message, session_id, system_prompt.as_deref())
            .await
    }

    /// Get chat history for a session
    ///
    /// Returns messages in chronological order (oldest first).
    /// This is essential for restoring chat state on app restart.
    pub async fn get_chat_history(
        &self,
        session_id: &shared::types::ids::SessionId,
        limit: u32,
    ) -> Result<Vec<Message>, EngineError> {
        let db_messages = self.db
            .get_messages(session_id, limit)
            .await
            .map_err(|e| EngineError::Database(format!("Failed to get chat history: {}", e)))?;

        // Convert libsql::Message to facade::Message
        Ok(db_messages
            .into_iter()
            .map(|m| Message {
                role: match m.role.as_str() {
                    "user" => facade::Role::User,
                    "assistant" => facade::Role::Assistant,
                    "system" => facade::Role::System,
                    _ => facade::Role::User,
                },
                content: m.content,
                // SQLite datetime format: "2024-01-15 10:30:00"
                // Convert to unix millis (0 if parse fails)
                timestamp: m.id * 1000, // Use message ID as proxy for ordering
            })
            .collect())
    }

    /// Index a project - scans files, chunks, embeds, uploads to RRO
    ///
    /// Progress callback receives updates at each stage (scanning, chunking, embedding, uploading).
    /// All operations are logged to DuckDB analytics.
    ///
    /// # Arguments
    /// * `project_id` - Project UUID (from ProjectRegistry)
    /// * `on_progress` - Callback for progress updates
    ///
    /// # Returns
    /// Statistics about the indexing operation
    pub async fn index_project<F>(
        &self,
        project_id: &str,
        on_progress: F,
    ) -> Result<IndexStats, EngineError>
    where
        F: FnMut(IndexProgress),
    {
        // Get project from registry
        let project = self.projects.get(project_id).await
            .ok_or_else(|| EngineError::ProjectNotFound(project_id.to_string()))?;

        let project_path = std::path::Path::new(&project.path);

        // Create indexer with optional dependencies
        // TODO: Wire up embedder and rro from orchestrator when available
        let indexer = ProjectIndexer::new(
            None, // embedder - TODO: get from orchestrator
            None, // rro - TODO: get from orchestrator
            Arc::clone(&self.db),
            self.analytics.clone(),
        );

        // Run indexing
        indexer.index_project(project_id, project_path, on_progress).await
            .map_err(|e| EngineError::Indexing(e.to_string()))
    }

    /// Bootstrap: ensure DevPulse itself is registered as project #0
    ///
    /// This enables dogfooding - DevPulse tracks its own codebase.
    /// The data_dir is registered (not the source code) so we can
    /// track all DevPulse data even in production.
    async fn bootstrap_self(
        projects: &ProjectRegistry,
        data_dir: &std::path::Path,
    ) -> Result<(), EngineError> {
        // Check if data_dir is already registered
        let existing = projects.list().await;
        let already_registered = existing.iter().any(|p| {
            std::path::Path::new(&p.path) == data_dir
        });

        if !already_registered {
            // DevPulse data directory not registered - add it
            // First ensure it exists
            if data_dir.exists() {
                match projects.add(data_dir.to_str().unwrap_or(".")).await {
                    Ok(project) => {
                        tracing::info!(
                            "Bootstrap: DevPulse registered as project {} ({})",
                            project.id,
                            project.path
                        );
                    }
                    Err(e) => {
                        // Non-fatal - just log it
                        tracing::warn!("Bootstrap: Could not register DevPulse data dir: {}", e);
                    }
                }
            } else {
                tracing::debug!("Bootstrap: data_dir doesn't exist yet, skipping self-registration");
            }
        } else {
            tracing::debug!("Bootstrap: DevPulse already registered");
        }

        Ok(())
    }
}

/// Engine status for display
#[derive(Debug, Clone, serde::Serialize)]
pub struct EngineStatus {
    pub ai_ready: bool,
    pub voice_ready: bool,
    pub projects_count: usize,
    pub sessions_count: usize,
    pub active_adapter: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_engine_init_desktop() {
        // Engine should always init successfully (stub mode is valid)
        let engine = Engine::init(EngineConfig::desktop()).await.unwrap();

        // Desktop mode should not have analytics
        assert!(!engine.has_analytics());

        // Non-AI features should work (projects persisted to DB)
        let project = engine.projects.add(".").await.unwrap();
        assert!(!project.id.is_empty());

        // Sessions now persisted to DB too
        let session = engine.sessions.create(None).await.unwrap();
        assert!(!session.id.is_empty());
    }

    #[tokio::test]
    async fn test_engine_init_lab() {
        // Lab mode should have analytics
        let engine = Engine::init(EngineConfig::lab()).await.unwrap();
        assert!(engine.has_analytics());
    }

    #[tokio::test]
    async fn test_status() {
        let engine = Engine::init(EngineConfig::desktop()).await.unwrap();
        let status = engine.status().await;

        // Should report status correctly
        assert_eq!(status.active_adapter, "local");
    }
}
