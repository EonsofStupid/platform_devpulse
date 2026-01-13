// desktop/src-tauri/src/state.rs

//! Application state - holds Engine instance
//!
//! Desktop → Engine only. No orchestrator access.

use engine::{Engine, EngineConfig};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Application state shared across all Tauri commands
pub struct AppState {
    /// Engine instance (initialized async on first use)
    engine: RwLock<Option<Arc<Engine>>>,
}

impl AppState {
    /// Create new app state (engine not yet initialized)
    pub fn new() -> Self {
        Self {
            engine: RwLock::new(None),
        }
    }

    /// Get or initialize engine
    ///
    /// Lazy initialization - first call initializes the engine.
    /// Subsequent calls return the cached instance.
    pub async fn engine(&self) -> Result<Arc<Engine>, String> {
        // Check if already initialized
        {
            let guard = self.engine.read().await;
            if let Some(ref engine) = *guard {
                return Ok(Arc::clone(engine));
            }
        }

        // Initialize engine (desktop mode - no analytics)
        let engine = Engine::init(EngineConfig::desktop())
            .await
            .map_err(|e| format!("Engine init failed: {}", e))?;

        let engine = Arc::new(engine);

        // Cache it
        {
            let mut guard = self.engine.write().await;
            *guard = Some(Arc::clone(&engine));
        }

        Ok(engine)
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
