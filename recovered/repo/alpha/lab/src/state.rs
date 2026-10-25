// lab/src/state.rs

//! Lab application state
//!
//! Lab has its own dedicated databases separate from Engine:
//! - lab_db: libSQL for Lab-specific persistent data
//! - lab_analytics: DuckDB for Lab-specific analytics
//!
//! Also bridges Engine's SignalRouter to broadcast channel for SSE/WebSocket clients.

use engine::{Engine, EngineConfig, SignalRouter};
use orchestrator::infra::duckdb::Analytics;
use orchestrator::infra::libsql::Database;
use shared::config::paths::get_paths;
use std::sync::Arc;
use tokio::sync::broadcast;

/// Signal event for broadcasting to clients
#[derive(Clone, Debug, serde::Serialize)]
pub struct SignalEvent {
    pub id: String,
    pub signal_type: String,
    pub source: String,
    pub timestamp: String,
    pub payload: serde_json::Value,
}

/// Shared application state
pub struct AppState {
    /// Engine instance (owns SignalRouter)
    pub engine: Arc<Engine>,

    /// Lab's own libSQL database (separate from Engine's)
    pub lab_db: Arc<Database>,

    /// Lab's own DuckDB analytics (separate from Engine's)
    pub lab_analytics: Arc<Analytics>,

    /// Signal broadcast for SSE/WebSocket clients
    /// Lab subscribes to Engine's router and re-broadcasts here
    pub signal_tx: broadcast::Sender<SignalEvent>,
}

impl AppState {
    pub async fn init() -> anyhow::Result<Self> {
        tracing::info!("Initializing Lab backend...");

        let paths = get_paths();

        // Initialize Lab's own libSQL database
        let lab_db_path = paths.data_dir.join("lab.db");
        tracing::info!("[lab_db] Opening Lab database at {:?}", lab_db_path);
        let lab_db = Database::open(&lab_db_path).await?;
        let lab_db = Arc::new(lab_db);
        tracing::info!("[lab_db] Lab database opened");

        // Initialize Lab's own DuckDB analytics
        let lab_analytics_path = paths.data_dir.join("lab_analytics.duckdb");
        tracing::info!("[lab_analytics] Opening Lab analytics at {:?}", lab_analytics_path);
        let lab_analytics = Analytics::open_with_path(&lab_analytics_path)?;
        let lab_analytics = Arc::new(lab_analytics);
        tracing::info!("[lab_analytics] Lab analytics opened");

        // Initialize engine with analytics enabled (Lab mode)
        let engine = Engine::init(EngineConfig::lab()).await?;
        let engine = Arc::new(engine);

        // Create broadcast channel for clients (256 buffer)
        let (signal_tx, _) = broadcast::channel(256);

        // Spawn task to bridge Engine signals to broadcast channel AND persist to lab_analytics
        let router = engine.router.clone();
        let tx = signal_tx.clone();
        let analytics_for_bridge = Arc::clone(&lab_analytics);
        tokio::spawn(async move {
            Self::bridge_signals(router, tx, analytics_for_bridge).await;
        });

        tracing::info!("Lab backend initialized with dedicated databases");

        Ok(Self {
            engine,
            lab_db,
            lab_analytics,
            signal_tx,
        })
    }

    /// Get Lab's database
    pub fn database(&self) -> Arc<Database> {
        Arc::clone(&self.lab_db)
    }

    /// Get Lab's analytics
    pub fn analytics(&self) -> Arc<Analytics> {
        Arc::clone(&self.lab_analytics)
    }

    /// Subscribe to signal broadcast
    pub fn subscribe(&self) -> broadcast::Receiver<SignalEvent> {
        self.signal_tx.subscribe()
    }

    /// Bridge Engine SignalRouter to broadcast channel for SSE/WS clients
    /// AND persist every signal to lab_analytics.duckdb for later analysis
    async fn bridge_signals(
        router: Arc<SignalRouter>,
        tx: broadcast::Sender<SignalEvent>,
        analytics: Arc<Analytics>,
    ) {
        let mut rx = router.subscribe();

        loop {
            match rx.recv().await {
                Ok(signal) => {
                    let event = SignalEvent {
                        id: signal.header.id.to_string(),
                        signal_type: signal.name().to_string(),
                        source: format!("{:?}", signal.header.source),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                        payload: serde_json::to_value(&*signal.payload).unwrap_or_default(),
                    };

                    // Persist to lab_analytics.duckdb for analysis/replay
                    if let Err(e) = analytics.record_event(&event.signal_type, &event.payload) {
                        tracing::warn!("Failed to persist signal to lab_analytics: {}", e);
                    }

                    // Broadcast to SSE/WebSocket clients (ignore if no subscribers)
                    let _ = tx.send(event);
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!("Lab signal bridge lagged by {} messages", n);
                }
                Err(broadcast::error::RecvError::Closed) => {
                    tracing::info!("Engine signal router closed");
                    break;
                }
            }
        }
    }
}
