pub mod audio;
pub mod capture;
pub mod catalog;
pub mod core;
pub mod download;
pub mod embedding;
pub mod llm;
pub mod persistence;
pub mod vision;

// Re-exports (canonical paths for external consumers)
pub use core::config::DevPulseConfig;
pub use persistence::bus::EventBus;

// Aliases for Lab compatibility
pub use persistence::analytics as duckdb;
pub use persistence::sql as libsql;
pub use catalog::models;
pub use llm::llmestimator as dpt_llmestimator;

use anyhow::Result;
use std::sync::Arc;

use persistence::global::GlobalDb;
use persistence::memory::HotCache;
use persistence::vector::VectorStore;
use core::services::ServiceRegistry;

/// Infra - The CoT/Rumination Foundation
///
/// Wires together all infrastructure backends:
/// - Config: DevPulseConfig (TOML-based settings)
/// - Cache: HotCache (Moka, Reflex 30s / Context 5min tiers)
/// - Global: GlobalDb (libSQL, projects/personas/platform_config)
/// - Vector: VectorStore (RRO embedded, code/docs/history/memory/external)
/// - Services: ServiceRegistry (Embedder/Reranker/LLM, lazy-loaded)
/// - Bus: EventBus (tokio::broadcast for L1 reflex signals)
///
/// This is the foundation that powers Cortex and Rumination chains.
pub struct Infra {
    /// Configuration loaded from config.toml
    pub config: DevPulseConfig,
    /// In-memory cache (Reflex 30s, Context 5min)
    pub cache: HotCache,
    /// Global database (projects, personas, platform_config)
    pub global: GlobalDb,
    /// Vector store (RRO embedded)
    pub vector: VectorStore,
    /// AI service registry (Embedder, Reranker, LLM)
    pub services: ServiceRegistry,
    /// Event bus for L1 reflex signals
    pub bus: Arc<EventBus>,
}

impl Infra {
    /// Initialize all infrastructure backends.
    ///
    /// Order matters:
    /// 1. Config (needed by everything)
    /// 2. Cache (standalone, no deps)
    /// 3. GlobalDb (needs paths from config)
    /// 4. VectorStore (needs paths, creates RRO instance)
    /// 5. ServiceRegistry (needs config for model loading)
    /// 6. EventBus (standalone)
    pub async fn init() -> Result<Self> {
        tracing::info!("Initializing DevPulse infrastructure...");

        // 1. Load configuration
        let config = DevPulseConfig::load()?;
        tracing::info!("Config loaded");

        // 2. Initialize in-memory cache
        let cache = HotCache::new();
        tracing::info!("HotCache initialized (Reflex 30s, Context 5min)");

        // 3. Open global database
        let paths = shared::config::get_paths();
        let global = GlobalDb::open(&paths.global_db).await?;
        tracing::info!("GlobalDb opened at {:?}", paths.global_db);

        // 4. Initialize vector store (RRO embedded)
        let vector = VectorStore::init()?;
        tracing::info!("VectorStore (RRO) initialized");

        // 5. Initialize service registry (loads enabled AI backends)
        let services = ServiceRegistry::from_config(&config.services).await?;
        tracing::info!("ServiceRegistry initialized");

        // 6. Create event bus
        let bus = Arc::new(EventBus::new());
        tracing::info!("EventBus ready");

        tracing::info!("DevPulse infrastructure ready");

        Ok(Self {
            config,
            cache,
            global,
            vector,
            services,
            bus,
        })
    }

    /// Get a reference to the event bus (for cloning into handlers)
    pub fn bus(&self) -> Arc<EventBus> {
        self.bus.clone()
    }

    /// Check if a specific AI service is available
    pub fn has_embedder(&self) -> bool {
        self.services.is_loaded(core::services::ServiceKind::Embedder)
    }

    pub fn has_reranker(&self) -> bool {
        self.services.is_loaded(core::services::ServiceKind::Reranker)
    }

    pub fn has_llm(&self) -> bool {
        self.services.is_loaded(core::services::ServiceKind::Llm)
    }
}
