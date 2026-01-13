// orchestrator/src/runtime/runtime.rs

//! DevPulseRuntime - Unified subsystem ownership
//!
//! The runtime owns all DevPulse subsystems:
//! - Storage (EventBus, HotCache, libSQL, RRO, fjall)
//! - Inference (Embedder, Reranker, ModelRegistry)
//! - Cortex (CAG, Router spawned on-demand)
//!
//! # Example
//! ```ignore
//! let runtime = DevPulseRuntime::init().await?;
//! let handle = runtime.handle(); // Clone for Lab UI
//! // ... use runtime ...
//! runtime.shutdown().await?;
//! ```

use crate::cortex::CAG;
use crate::infra::{
    persistence::bus::EventBus,
    embedding::embedder::EmbedderBackend,
    persistence::audit::FjallStores,
    persistence::memory::HotCache,
    catalog::models::{ModelPaths, ModelRegistry},
    persistence::vector::VectorStore,
    embedding::reranker::RerankerBackend,
};
use crate::runtime::experiments::{Experiments, ExperimentsSnapshot};
use anyhow::Result;
use shared::config::paths::get_paths;
use std::sync::Arc;
use tracing::instrument;

#[cfg(feature = "db")]
use crate::infra::persistence::sql::Database;

/// Unified storage handle
pub struct Storage {
    /// L1: Reflex (broadcast)
    pub bus: EventBus,
    /// L2: moka (30s/5min tiers)
    pub cache: HotCache,
    /// L3: libSQL - REQUIRED when db feature enabled
    #[cfg(feature = "db")]
    pub db: Database,
    /// L4: RRO
    pub vectors: Arc<VectorStore>,
    /// L5: fjall - REQUIRED
    pub kv: FjallStores,
}

/// Unified inference handle
pub struct Inference {
    pub embedder: Arc<EmbedderBackend>,
    pub reranker: Arc<RerankerBackend>,
    pub registry: ModelRegistry,
}

/// Unified cortex handle
pub struct Cortex {
    pub cag: CAG,
    // Router spawned on-demand (requires channels, set up per-session)
}

/// The unified runtime - owns everything
pub struct DevPulseRuntime {
    pub experiments: Arc<Experiments>,
    pub storage: Storage,
    pub inference: Option<Inference>,
    pub cortex: Option<Cortex>,
}

impl DevPulseRuntime {
    /// Initialize the full runtime
    ///
    /// This loads all subsystems. If model files are missing,
    /// inference and cortex will be None (stub mode).
    ///
    /// # Errors
    /// Returns error if:
    /// - Directory creation fails
    /// - RRO initialization fails
    /// - fjall store open fails
    /// - libSQL open fails (when db feature enabled)
    #[instrument(name = "runtime.init", skip_all)]
    pub async fn init() -> Result<Self> {
        let paths = get_paths();
        paths.ensure_dirs()?;

        // Start Tracy client FIRST
        #[cfg(feature = "tracy")]
        {
            tracing_tracy::client::Client::start();
        }

        tracing::info!(
            data_dir = %paths.data_dir.display(),
            "Initializing DevPulse runtime"
        );

        let experiments = Arc::new(Experiments::from_env());

        // Storage - ALL REQUIRED
        let bus = EventBus::new();
        let cache = HotCache::new();
        let vectors = Arc::new(VectorStore::init()?);
        let kv = FjallStores::open()?;

        #[cfg(feature = "db")]
        let db = Database::open(&paths.global_db).await?;

        let storage = Storage {
            bus,
            cache,
            #[cfg(feature = "db")]
            db,
            vectors,
            kv,
        };

        // Try to load inference backends
        let model_paths = ModelPaths::from_paths(paths);
        let (inference, cortex) = Self::try_init_inference(&model_paths, &storage)?;

        tracing::info!(
            inference_ready = inference.is_some(),
            cortex_ready = cortex.is_some(),
            "DevPulse runtime initialized"
        );

        Ok(Self {
            experiments,
            storage,
            inference,
            cortex,
        })
    }

    /// Try to initialize inference and cortex
    /// Returns None if model files are missing
    #[instrument(name = "runtime.init_inference", skip_all)]
    fn try_init_inference(
        model_paths: &ModelPaths,
        storage: &Storage,
    ) -> Result<(Option<Inference>, Option<Cortex>)> {
        // Verify model paths exist
        if let Err(e) = model_paths.verify_embedder() {
            tracing::warn!("Embedder files missing: {}", e);
            return Ok((None, None));
        }
        if let Err(e) = model_paths.verify_reranker() {
            tracing::warn!("Reranker files missing: {}", e);
            return Ok((None, None));
        }

        // Load embedder (CPU)
        tracing::info!("Loading embedder...");
        let embedder = match EmbedderBackend::load(&model_paths.embedder_dir) {
            Ok(e) => {
                tracing::info!("Embedder loaded (dim: {})", e.dimension());
                Arc::new(e)
            }
            Err(e) => {
                tracing::error!("Failed to load embedder: {}", e);
                return Ok((None, None));
            }
        };

        // Load reranker (CPU for now, GPU when CUDA 13.1 supported)
        tracing::info!("Loading reranker...");
        let reranker = match RerankerBackend::load(&model_paths.reranker_dir) {
            Ok(r) => {
                tracing::info!("Reranker loaded");
                Arc::new(r)
            }
            Err(e) => {
                tracing::error!("Failed to load reranker: {}", e);
                return Ok((None, None));
            }
        };

        // Create registry
        let registry = ModelRegistry::new();

        let inference = Inference {
            embedder: Arc::clone(&embedder),
            reranker: Arc::clone(&reranker),
            registry,
        };

        // Create CAG
        let cag = CAG::new(
            Arc::clone(&embedder),
            Arc::clone(&storage.vectors),
            Arc::clone(&reranker),
        );

        let cortex = Cortex { cag };

        Ok((Some(inference), Some(cortex)))
    }

    /// Get a handle for Lab observability
    pub fn handle(&self) -> RuntimeHandle {
        RuntimeHandle {
            experiments: Arc::clone(&self.experiments),
        }
    }

    /// Check if the runtime is in stub mode (no models loaded)
    pub fn is_stub_mode(&self) -> bool {
        self.inference.is_none()
    }

    /// Check if CAG is ready
    pub fn is_cag_ready(&self) -> bool {
        self.cortex.is_some()
    }

    /// Get the CAG if available
    pub fn cag(&self) -> Option<&CAG> {
        self.cortex.as_ref().map(|c| &c.cag)
    }

    /// Shutdown the runtime gracefully
    ///
    /// # Errors
    /// Returns error if fjall flush fails
    #[instrument(name = "runtime.shutdown", skip_all)]
    pub async fn shutdown(&self) -> Result<()> {
        tracing::info!("Shutting down DevPulse runtime");
        // Flush fjall
        self.storage.kv.flush()?;
        Ok(())
    }
}

/// Cloneable handle for Lab observability
#[derive(Clone)]
pub struct RuntimeHandle {
    pub experiments: Arc<Experiments>,
}

impl RuntimeHandle {
    pub fn snapshot(&self) -> RuntimeSnapshot {
        RuntimeSnapshot {
            experiments: self.experiments.snapshot(),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RuntimeSnapshot {
    pub experiments: ExperimentsSnapshot,
}
