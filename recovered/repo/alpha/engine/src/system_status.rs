// engine/src/system_status.rs

//! System status tracking for observability
//!
//! Tracks model loading state, component health, and runtime metrics.
//! Used by Lab's /api/background endpoints for real data.

use serde::{Deserialize, Serialize};
use std::sync::RwLock;
use std::time::Instant;

/// Component load state
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum LoadState {
    /// Component not started loading
    NotLoaded,
    /// Component currently loading
    Loading,
    /// Component loaded successfully
    Loaded,
    /// Component failed to load
    Failed { error: String },
    /// Component skipped (optional feature disabled)
    Skipped,
}

impl Default for LoadState {
    fn default() -> Self {
        Self::NotLoaded
    }
}

/// Status for a single model/component
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ComponentStatus {
    /// Component name
    #[serde(default)]
    pub name: String,
    /// Current load state
    #[serde(default)]
    pub state: LoadState,
    /// Memory usage in MB (0 if not loaded)
    #[serde(default)]
    pub memory_mb: u64,
    /// Device (CPU, CUDA:0, etc.)
    #[serde(default)]
    pub device: Option<String>,
    /// Load time in milliseconds
    #[serde(default)]
    pub load_time_ms: Option<u64>,
    /// Last used timestamp (RFC3339)
    #[serde(default)]
    pub last_used: Option<String>,
    /// Additional details
    #[serde(default)]
    pub details: Option<String>,
}

impl ComponentStatus {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            state: LoadState::NotLoaded,
            memory_mb: 0,
            device: None,
            load_time_ms: None,
            last_used: None,
            details: None,
        }
    }

    pub fn loading(mut self) -> Self {
        self.state = LoadState::Loading;
        self
    }

    pub fn loaded(mut self, memory_mb: u64, device: &str, load_time_ms: u64) -> Self {
        self.state = LoadState::Loaded;
        self.memory_mb = memory_mb;
        self.device = Some(device.to_string());
        self.load_time_ms = Some(load_time_ms);
        self
    }

    pub fn failed(mut self, error: &str) -> Self {
        self.state = LoadState::Failed {
            error: error.to_string(),
        };
        self
    }

    pub fn skipped(mut self) -> Self {
        self.state = LoadState::Skipped;
        self
    }
}

/// Global system status
#[derive(Debug, Default)]
pub struct SystemStatus {
    /// Embedder model status
    embedder: RwLock<ComponentStatus>,
    /// Reranker model status
    reranker: RwLock<ComponentStatus>,
    /// Llm (VLM) model status
    llm: RwLock<ComponentStatus>,
    /// TTS model status
    voice_tts: RwLock<ComponentStatus>,
    /// STT model status
    voice_stt: RwLock<ComponentStatus>,
    /// RRO vector store status
    rro: RwLock<ComponentStatus>,
    /// libSQL database status
    database: RwLock<ComponentStatus>,
    /// DuckDB analytics status
    analytics: RwLock<ComponentStatus>,
    /// Engine start time
    start_time: RwLock<Option<Instant>>,
}

impl SystemStatus {
    pub fn new() -> Self {
        Self {
            embedder: RwLock::new(ComponentStatus::new("embedder")),
            reranker: RwLock::new(ComponentStatus::new("reranker")),
            llm: RwLock::new(ComponentStatus::new("llm")),
            voice_tts: RwLock::new(ComponentStatus::new("voice_tts")),
            voice_stt: RwLock::new(ComponentStatus::new("voice_stt")),
            rro: RwLock::new(ComponentStatus::new("rro")),
            database: RwLock::new(ComponentStatus::new("database")),
            analytics: RwLock::new(ComponentStatus::new("analytics")),
            start_time: RwLock::new(Some(Instant::now())),
        }
    }

    /// Update a component's status
    pub fn update(&self, component: &str, status: ComponentStatus) {
        let lock = match component {
            "embedder" => &self.embedder,
            "reranker" => &self.reranker,
            "llm" => &self.llm,
            "voice_tts" => &self.voice_tts,
            "voice_stt" => &self.voice_stt,
            "rro" => &self.rro,
            "database" => &self.database,
            "analytics" => &self.analytics,
            _ => return,
        };
        if let Ok(mut guard) = lock.write() {
            *guard = status;
        }
    }

    /// Get uptime in seconds
    pub fn uptime_secs(&self) -> u64 {
        self.start_time
            .read()
            .ok()
            .and_then(|opt| opt.map(|t| t.elapsed().as_secs()))
            .unwrap_or(0)
    }

    /// Get component status snapshot
    pub fn get(&self, component: &str) -> Option<ComponentStatus> {
        let lock = match component {
            "embedder" => &self.embedder,
            "reranker" => &self.reranker,
            "llm" => &self.llm,
            "voice_tts" => &self.voice_tts,
            "voice_stt" => &self.voice_stt,
            "rro" => &self.rro,
            "database" => &self.database,
            "analytics" => &self.analytics,
            _ => return None,
        };
        lock.read().ok().map(|g| g.clone())
    }

    /// Get full status snapshot
    pub fn snapshot(&self) -> SystemStatusSnapshot {
        SystemStatusSnapshot {
            uptime_secs: self.uptime_secs(),
            embedder: self.get("embedder").unwrap_or_else(|| ComponentStatus::new("embedder")),
            reranker: self.get("reranker").unwrap_or_else(|| ComponentStatus::new("reranker")),
            llm: self.get("llm").unwrap_or_else(|| ComponentStatus::new("llm")),
            voice_tts: self.get("voice_tts").unwrap_or_else(|| ComponentStatus::new("voice_tts")),
            voice_stt: self.get("voice_stt").unwrap_or_else(|| ComponentStatus::new("voice_stt")),
            rro: self.get("rro").unwrap_or_else(|| ComponentStatus::new("rro")),
            database: self.get("database").unwrap_or_else(|| ComponentStatus::new("database")),
            analytics: self.get("analytics").unwrap_or_else(|| ComponentStatus::new("analytics")),
        }
    }

    /// Calculate total VRAM usage
    pub fn total_vram_mb(&self) -> u64 {
        let mut total = 0;
        for component in ["embedder", "reranker", "llm", "voice_tts", "voice_stt"] {
            if let Some(status) = self.get(component) {
                if matches!(status.state, LoadState::Loaded)
                    && status.device.as_ref().map(|d| d.contains("CUDA")).unwrap_or(false)
                {
                    total += status.memory_mb;
                }
            }
        }
        total
    }

    /// Calculate total RAM usage (CPU models)
    pub fn total_ram_mb(&self) -> u64 {
        let mut total = 0;
        for component in ["embedder", "reranker", "llm", "voice_tts", "voice_stt"] {
            if let Some(status) = self.get(component) {
                if matches!(status.state, LoadState::Loaded)
                    && status.device.as_ref().map(|d| d == "CPU").unwrap_or(true)
                {
                    total += status.memory_mb;
                }
            }
        }
        total
    }

    /// Check overall health
    pub fn overall_health(&self) -> &'static str {
        let snapshot = self.snapshot();
        let components = [
            &snapshot.embedder,
            &snapshot.reranker,
            &snapshot.llm,
            &snapshot.database,
        ];

        let has_failed = components.iter().any(|c| matches!(c.state, LoadState::Failed { .. }));
        let has_loading = components.iter().any(|c| matches!(c.state, LoadState::Loading));
        let all_loaded = components.iter().all(|c| {
            matches!(c.state, LoadState::Loaded | LoadState::Skipped)
        });

        if has_failed {
            "error"
        } else if has_loading {
            "loading"
        } else if all_loaded {
            "healthy"
        } else {
            "degraded"
        }
    }
}

/// Serializable snapshot of system status
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SystemStatusSnapshot {
    pub uptime_secs: u64,
    pub embedder: ComponentStatus,
    pub reranker: ComponentStatus,
    pub llm: ComponentStatus,
    pub voice_tts: ComponentStatus,
    pub voice_stt: ComponentStatus,
    pub rro: ComponentStatus,
    pub database: ComponentStatus,
    pub analytics: ComponentStatus,
}
