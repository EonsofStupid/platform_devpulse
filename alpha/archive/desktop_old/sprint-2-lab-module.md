# Module 3: Lab Full UI (Sprint 2 Addendum)

**Status**: PLANNING - Do not implement until approved

---

## Philosophy

Lab is NOT a TUI. Lab is a full SvelteKit web UI for:
- Seeing reasoning/rumination happen in real-time
- Seeing chat happen in real-time
- Configuring male/female voice for the AI
- Monitoring all background processes
- Testing and debugging the system

Lab is the developer's window into DevPulse internals.

---

## Prerequisites: Signal Wiring

Before Lab can see anything, signals must flow. This is MISSING from Sprint-2.

### Module 3.0: Signal Flow (MUST BE FIRST)

#### 3.0.1: ChatFacade emits signals

```rust
// engine/src/facade/chat.rs - MODIFY

use crate::signals::{Signal, SignalRouter, SignalSource, SignalVariant};
use crate::signals::payloads::{ChatPayload, Role, InferencePayload};

pub struct ChatFacade {
    engine: OnceCell<Arc<orchestrator::ChatEngine>>,
    stub_mode: std::sync::atomic::AtomicBool,
    router: Arc<SignalRouter>,  // ADD THIS
}

impl ChatFacade {
    pub fn new(router: Arc<SignalRouter>) -> Self {  // ADD ROUTER PARAM
        Self {
            engine: OnceCell::new(),
            stub_mode: std::sync::atomic::AtomicBool::new(false),
            router,
        }
    }

    pub async fn send(&self, message: &str, session_id: SessionId) -> Result<ChatResponse, EngineError> {
        // EMIT: User message signal
        self.router.emit(Signal::new(
            SignalSource::User,
            SignalVariant::Chat(ChatPayload {
                session_id: session_id.clone(),
                role: Role::User,
                content: message.to_string(),
            }),
        ));

        // Get response from orchestrator
        let response = /* ... existing logic ... */;

        // EMIT: Assistant response signal
        self.router.emit(Signal::new(
            SignalSource::Expert,
            SignalVariant::Chat(ChatPayload {
                session_id: session_id.clone(),
                role: Role::Assistant,
                content: response.message.clone(),
            }),
        ));

        // EMIT: Inference metrics signal
        self.router.emit(Signal::new(
            SignalSource::System,
            SignalVariant::Inference(InferencePayload {
                model_id: response.model_id.clone(),
                tokens_in: response.prompt_tokens,
                tokens_out: response.completion_tokens,
                latency_ms: response.latency_ms,
            }),
        ));

        Ok(response)
    }
}
```

#### 3.0.2: Engine passes router to facades

```rust
// engine/src/lib.rs - MODIFY

impl Engine {
    pub async fn init() -> Result<Self, EngineError> {
        let router = Arc::new(SignalRouter::new());

        // Pass router to facades
        let chat = ChatFacade::new(Arc::clone(&router));
        let voice = VoiceFacade::new(Arc::clone(&router));

        // ... rest of init

        Ok(Self {
            router,
            chat,
            voice,
            // ...
        })
    }
}
```

#### 3.0.3: Add rumination signals

```rust
// engine/src/signals/payloads.rs - ADD

/// Rumination layer event
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RuminationPayload {
    pub layer: String,           // "keystroke", "pause", "send", "background"
    pub event: RuminationEvent,
    pub latency_ms: Option<u64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum RuminationEvent {
    LayerEntered,
    LayerExited,
    ThoughtAdded { node_id: String, content: String },
    PathSelected { path: Vec<String> },
}

/// Thought tree node for visualization
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ThoughtNodePayload {
    pub tree_id: String,
    pub node_id: String,
    pub parent_id: Option<String>,
    pub content: String,
    pub score: Option<f32>,
    pub source: Option<String>,  // Which minion
}
```

```rust
// engine/src/signals/variants.rs - ADD

pub enum SignalVariant {
    // ... existing ...

    /// Rumination layer events
    Rumination(RuminationPayload),

    /// Thought tree updates
    ThoughtNode(ThoughtNodePayload),
}

impl SignalVariant {
    pub fn sinks(&self) -> &'static [SinkKind] {
        match self {
            // ... existing ...
            Self::Rumination(_) => &[SinkKind::Broadcast],
            Self::ThoughtNode(_) => &[SinkKind::Broadcast, SinkKind::Cache],
        }
    }
}
```

---

## Module 3.1: Lab Backend (Axum HTTP + WebSocket Server)

### Phase 0: Boundary

| Item | Value |
|------|-------|
| Crate | `lab/` |
| Framework | Axum (HTTP + WebSocket) |
| Port | 3001 |
| Depends on | `engine`, `orchestrator` |
| Consumers | Lab SvelteKit frontend |

### Target Structure

```
lab/src/
├── main.rs                    # Axum server entry
├── lib.rs                     # Re-exports
├── state.rs                   # AppState with Engine + broadcast channels
├── routes/
│   ├── mod.rs                 # Router builder
│   ├── chat.rs                # GET /api/chat/history, POST /api/chat/send
│   ├── signals.rs             # GET /api/signals/stream (SSE), WS /api/signals/ws
│   ├── rumination.rs          # GET /api/rumination/state, /tree, /layers
│   ├── voice.rs               # GET/POST /api/voice/* (profiles, samples, test)
│   ├── background.rs          # GET /api/background/status, /minions, /models
│   └── health.rs              # GET /api/health
└── ws/
    ├── mod.rs
    └── signal_stream.rs       # WebSocket handler for signal streaming
```

### Phase 1: Contract - Every Endpoint

#### routes/chat.rs

```rust
// GET /api/chat/history?session_id=xxx
pub async fn get_history(
    State(state): State<Arc<AppState>>,
    Query(params): Query<HistoryParams>,
) -> Json<Vec<ChatMessage>>;

// POST /api/chat/send
pub async fn send_message(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SendRequest>,
) -> Json<ChatResponse>;

#[derive(Deserialize)]
pub struct HistoryParams {
    pub session_id: String,
}

#[derive(Deserialize)]
pub struct SendRequest {
    pub message: String,
    pub session_id: String,
}

#[derive(Serialize)]
pub struct ChatMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: String,
    pub tokens: Option<u32>,
}
```

#### routes/signals.rs

```rust
// GET /api/signals/stream (Server-Sent Events)
pub async fn signal_stream(
    State(state): State<Arc<AppState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>>;

// WS /api/signals/ws (WebSocket for bidirectional)
pub async fn signal_websocket(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse;

// Signal format sent to client
#[derive(Serialize)]
pub struct SignalEvent {
    pub id: String,
    pub signal_type: String,  // "chat", "inference", "rumination", "thought_node"
    pub source: String,       // "user", "system", "expert"
    pub timestamp: String,
    pub payload: serde_json::Value,
}
```

#### routes/rumination.rs

```rust
// GET /api/rumination/state
pub async fn get_state() -> Json<RuminationState>;

// GET /api/rumination/tree
pub async fn get_tree() -> Json<ThoughtTree>;

// GET /api/rumination/layers
pub async fn get_layers() -> Json<Vec<LayerStatus>>;

#[derive(Serialize)]
pub struct RuminationState {
    pub current_layer: String,
    pub layers: Vec<LayerStatus>,
    pub active_minions: Vec<String>,
    pub pending_signals: u32,
}

#[derive(Serialize)]
pub struct LayerStatus {
    pub name: String,
    pub active: bool,
    pub latency_budget_ms: u64,
    pub last_triggered: Option<String>,
    pub signals_processed: u64,
}

#[derive(Serialize)]
pub struct ThoughtTree {
    pub session_id: String,
    pub root: ThoughtNode,
    pub active_path: Vec<String>,
}

#[derive(Serialize)]
pub struct ThoughtNode {
    pub id: String,
    pub content: String,
    pub node_type: String,
    pub children: Vec<ThoughtNode>,
    pub score: Option<f32>,
    pub source: Option<String>,
}
```

#### routes/voice.rs

```rust
// GET /api/voice/status
pub async fn get_status() -> Json<VoiceStatus>;

// GET /api/voice/profiles
pub async fn list_profiles() -> Json<Vec<VoiceProfile>>;

// POST /api/voice/profiles
pub async fn create_profile(Json(req): Json<CreateProfileRequest>) -> Json<VoiceProfile>;

// DELETE /api/voice/profiles/:id
pub async fn delete_profile(Path(id): Path<String>) -> Json<DeleteResponse>;

// POST /api/voice/active
pub async fn set_active(Json(req): Json<SetActiveRequest>) -> Json<VoiceProfile>;

// POST /api/voice/samples/upload
pub async fn upload_sample(multipart: Multipart) -> Json<UploadResponse>;

// GET /api/voice/samples
pub async fn list_samples() -> Json<Vec<VoiceSample>>;

// DELETE /api/voice/samples/:id
pub async fn delete_sample(Path(id): Path<String>) -> Json<DeleteResponse>;

// POST /api/voice/test
pub async fn test_tts(Json(req): Json<TestRequest>) -> Response<Body>;  // Returns WAV audio

// POST /api/voice/generate
pub async fn generate_profile(Json(req): Json<GenerateRequest>) -> Json<VoiceProfile>;

#[derive(Serialize)]
pub struct VoiceStatus {
    pub tts_loaded: bool,
    pub cloner_loaded: bool,
    pub active_profile_id: Option<String>,
    pub active_profile_name: Option<String>,
    pub sample_count: usize,
    pub profile_count: usize,
}

#[derive(Serialize)]
pub struct VoiceProfile {
    pub id: String,
    pub name: String,
    pub gender: String,  // "male", "female", "neutral"
    pub created_at: String,
    pub is_active: bool,
    pub is_default: bool,
}

#[derive(Deserialize)]
pub struct CreateProfileRequest {
    pub name: String,
    pub gender: String,
    pub sample_ids: Vec<String>,
}

#[derive(Deserialize)]
pub struct SetActiveRequest {
    pub profile_id: String,
}

#[derive(Serialize)]
pub struct VoiceSample {
    pub id: String,
    pub filename: String,
    pub size_bytes: u64,
    pub duration_secs: Option<f32>,
    pub uploaded_at: String,
}

#[derive(Deserialize)]
pub struct TestRequest {
    pub text: String,
    pub profile_id: Option<String>,
}

#[derive(Deserialize)]
pub struct GenerateRequest {
    pub name: String,
    pub gender: String,
    pub sample_ids: Vec<String>,
}
```

#### routes/background.rs

```rust
// GET /api/background/status
pub async fn get_status() -> Json<BackgroundStatus>;

// GET /api/background/minions
pub async fn get_minions() -> Json<Vec<MinionStatus>>;

// GET /api/background/models
pub async fn get_models() -> Json<ModelStatus>;

#[derive(Serialize)]
pub struct BackgroundStatus {
    pub processes: Vec<ProcessStatus>,
    pub storage_sync: StorageSyncStatus,
}

#[derive(Serialize)]
pub struct ProcessStatus {
    pub id: String,
    pub name: String,
    pub status: String,  // "running", "idle", "error"
    pub last_run: Option<String>,
    pub cpu_percent: f32,
    pub memory_mb: f32,
}

#[derive(Serialize)]
pub struct MinionStatus {
    pub name: String,
    pub active: bool,
    pub signals_pending: u32,
    pub last_signal: Option<String>,
    pub health: String,  // "healthy", "degraded", "error"
}

#[derive(Serialize)]
pub struct StorageSyncStatus {
    pub hot_count: u32,
    pub warm_count: u32,
    pub cold_count: u32,
    pub sync_rate_per_sec: f32,
}

#[derive(Serialize)]
pub struct ModelStatus {
    pub embedder: ModelInfo,
    pub reranker: ModelInfo,
    pub llm: ModelInfo,
    pub voice_tts: ModelInfo,
    pub voice_cloner: ModelInfo,
}

#[derive(Serialize)]
pub struct ModelInfo {
    pub name: String,
    pub loaded: bool,
    pub memory_mb: f32,
    pub last_used: Option<String>,
}
```

#### Cargo.toml

```toml
[package]
name = "lab"
version = "0.1.0"
edition = "2021"

[dependencies]
# Async runtime
tokio = { version = "1", features = ["full"] }

# Web framework
axum = { version = "0.7", features = ["ws", "multipart"] }
axum-extra = { version = "0.9", features = ["typed-header"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Error handling
anyhow = "1"
thiserror = "2"

# Tracing
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# Async streams
futures = "0.3"
tokio-stream = "0.1"
async-stream = "0.3"

# Time
chrono = { version = "0.4", features = ["serde"] }

# UUID
uuid = { version = "1", features = ["v7", "serde"] }

# Internal crates
engine = { path = "../engine" }
orchestrator = { path = "../orchestrator" }
shared = { path = "../shared" }
```

#### error.rs

```rust
//! Lab API error handling

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Engine error: {0}")]
    Engine(#[from] engine::EngineError),
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    code: u16,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            AppError::Engine(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        };

        let body = Json(ErrorResponse {
            error: message,
            code: status.as_u16(),
        });

        (status, body).into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;
```

#### state.rs

```rust
//! Lab application state

use engine::{Engine, SignalRouter};
use std::sync::Arc;
use tokio::sync::broadcast;

/// Shared application state
pub struct AppState {
    /// Engine instance (owns SignalRouter)
    pub engine: Arc<Engine>,

    /// Signal broadcast for SSE/WebSocket clients
    /// Lab subscribes to Engine's router and re-broadcasts here
    pub signal_tx: broadcast::Sender<SignalEvent>,
}

/// Signal event for broadcasting to clients
#[derive(Clone, Debug, serde::Serialize)]
pub struct SignalEvent {
    pub id: String,
    pub signal_type: String,
    pub source: String,
    pub timestamp: String,
    pub payload: serde_json::Value,
}

impl AppState {
    pub async fn init() -> anyhow::Result<Self> {
        tracing::info!("Initializing Lab backend...");

        // Initialize engine
        let engine = Engine::init().await?;
        let engine = Arc::new(engine);

        // Create broadcast channel for clients
        let (signal_tx, _) = broadcast::channel(256);

        // Spawn task to bridge Engine signals to broadcast channel
        let router = engine.router.clone();
        let tx = signal_tx.clone();
        tokio::spawn(async move {
            Self::bridge_signals(router, tx).await;
        });

        tracing::info!("Lab backend initialized");

        Ok(Self { engine, signal_tx })
    }

    /// Bridge Engine SignalRouter to broadcast channel for SSE/WS clients
    async fn bridge_signals(
        router: Arc<SignalRouter>,
        tx: broadcast::Sender<SignalEvent>,
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

                    // Ignore send errors (no subscribers)
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
```

#### main.rs

```rust
//! Lab - DevPulse Internal Monitoring UI Backend
//!
//! Provides HTTP + WebSocket API for the Lab SvelteKit frontend.
//! Subscribes to Engine's SignalRouter and broadcasts to connected clients.

use axum::Router;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod error;
mod routes;
mod state;

use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "lab=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Initialize state
    let state = Arc::new(AppState::init().await?);

    // Build router with nested route modules
    let app = Router::new()
        .nest("/api/health", routes::health::router())
        .nest("/api/chat", routes::chat::router())
        .nest("/api/signals", routes::signals::router())
        .nest("/api/rumination", routes::rumination::router())
        .nest("/api/voice", routes::voice::router())
        .nest("/api/background", routes::background::router())
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    tracing::info!("Lab server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
```

#### routes/mod.rs

```rust
//! Route modules - each exports a Router

pub mod background;
pub mod chat;
pub mod health;
pub mod rumination;
pub mod signals;
pub mod voice;
```

#### routes/health.rs

```rust
use axum::{routing::get, Json, Router};
use serde::Serialize;
use std::sync::Arc;
use crate::state::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub engine_ready: bool,
    pub timestamp: String,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/", get(check))
}

async fn check(
    axum::extract::State(state): axum::extract::State<Arc<AppState>>,
) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        engine_ready: state.engine.is_ai_ready(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}
```

---

## Module 3.2: Lab SvelteKit Frontend

### Phase 0: Boundary

| Item | Value |
|------|-------|
| Location | `lab/ui/` |
| Framework | SvelteKit + Svelte 5 runes |
| Port | 5174 (dev) |
| Styling | Tailwind CSS + custom glass effects |

### Target Structure

```
lab/ui/
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── app.html
│   ├── app.css                    # Tailwind + glass effects
│   ├── lib/
│   │   ├── api/
│   │   │   ├── index.ts           # Re-exports
│   │   │   ├── client.ts          # Fetch wrapper with base URL
│   │   │   ├── chat.ts            # getHistory(), sendMessage()
│   │   │   ├── signals.ts         # connectSignalStream(), SignalEvent type
│   │   │   ├── rumination.ts      # getState(), getTree(), getLayers()
│   │   │   ├── voice.ts           # All voice endpoints
│   │   │   └── background.ts      # getStatus(), getMinions(), getModels()
│   │   │
│   │   ├── stores/
│   │   │   ├── signals.svelte.ts  # Real-time signal stream
│   │   │   ├── rumination.svelte.ts
│   │   │   ├── voice.svelte.ts
│   │   │   ├── background.svelte.ts
│   │   │   └── chat.svelte.ts
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Shell.svelte
│   │   │   │   ├── Sidebar.svelte
│   │   │   │   └── Header.svelte
│   │   │   ├── signals/
│   │   │   │   ├── SignalStream.svelte      # Live signal feed
│   │   │   │   ├── SignalCard.svelte        # Individual signal display
│   │   │   │   └── SignalFilter.svelte      # Filter by type
│   │   │   ├── rumination/
│   │   │   │   ├── ThoughtTree.svelte       # Tree visualization
│   │   │   │   ├── ThoughtNode.svelte       # Single node
│   │   │   │   ├── LayerIndicator.svelte    # 4-layer status
│   │   │   │   └── MinionPanel.svelte       # Active minions
│   │   │   ├── voice/
│   │   │   │   ├── ProfileList.svelte
│   │   │   │   ├── ProfileCard.svelte
│   │   │   │   ├── SampleUploader.svelte
│   │   │   │   ├── SampleList.svelte
│   │   │   │   ├── GenderSelector.svelte    # Male/Female/Neutral toggle
│   │   │   │   ├── VoiceTester.svelte       # Test TTS with text input
│   │   │   │   └── GenerateButton.svelte
│   │   │   ├── background/
│   │   │   │   ├── ProcessList.svelte
│   │   │   │   ├── MinionGrid.svelte
│   │   │   │   ├── StorageSync.svelte
│   │   │   │   └── ModelStatus.svelte
│   │   │   └── chat/
│   │   │       ├── ChatStream.svelte        # Real-time chat display
│   │   │       ├── MessageBubble.svelte
│   │   │       └── InferenceMetrics.svelte  # Tokens, latency
│   │   │
│   │   └── utils/
│   │       ├── websocket.ts
│   │       └── format.ts
│   │
│   └── routes/
│       ├── +layout.svelte         # Shell wrapper
│       ├── +page.svelte           # Dashboard (overview of all systems)
│       ├── signals/+page.svelte   # Live signal stream
│       ├── rumination/+page.svelte # Thought tree + layers
│       ├── voice/+page.svelte     # Voice profile management
│       ├── background/+page.svelte # Background processes
│       └── chat/+page.svelte      # Chat stream viewer
```

### Phase 1: Contract - Every Component

#### lib/api/client.ts

```typescript
const BASE_URL = 'http://localhost:3001';

export async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
}

export async function post<T, R>(path: string, body: T): Promise<R> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
}

export async function del<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json();
}

export function connectWebSocket(path: string): WebSocket {
    return new WebSocket(`ws://localhost:3001${path}`);
}

export function connectSSE(path: string): EventSource {
    return new EventSource(`${BASE_URL}${path}`);
}
```

#### lib/api/signals.ts

```typescript
import { connectWebSocket, connectSSE } from './client';

export interface SignalEvent {
    id: string;
    signal_type: 'chat' | 'inference' | 'rumination' | 'thought_node' | 'debug';
    source: 'user' | 'system' | 'expert' | 'clock';
    timestamp: string;
    payload: unknown;
}

export function connectSignalStream(
    onSignal: (signal: SignalEvent) => void,
    onError?: (error: Event) => void
): EventSource {
    const source = connectSSE('/api/signals/stream');

    source.onmessage = (event) => {
        const signal = JSON.parse(event.data) as SignalEvent;
        onSignal(signal);
    };

    source.onerror = (event) => {
        onError?.(event);
    };

    return source;
}

export function connectSignalWebSocket(
    onSignal: (signal: SignalEvent) => void,
    onClose?: () => void
): WebSocket {
    const ws = connectWebSocket('/api/signals/ws');

    ws.onmessage = (event) => {
        const signal = JSON.parse(event.data) as SignalEvent;
        onSignal(signal);
    };

    ws.onclose = () => {
        onClose?.();
    };

    return ws;
}
```

#### lib/stores/signals.svelte.ts

```typescript
import { connectSignalStream, type SignalEvent } from '$lib/api/signals';

class SignalStore {
    signals = $state<SignalEvent[]>([]);
    connected = $state(false);
    filter = $state<string | null>(null);

    private source: EventSource | null = null;
    private maxSignals = 100;

    get filtered() {
        if (!this.filter) return this.signals;
        return this.signals.filter(s => s.signal_type === this.filter);
    }

    connect() {
        if (this.source) return;

        this.source = connectSignalStream(
            (signal) => {
                this.signals = [signal, ...this.signals].slice(0, this.maxSignals);
            },
            () => {
                this.connected = false;
            }
        );

        this.connected = true;
    }

    disconnect() {
        this.source?.close();
        this.source = null;
        this.connected = false;
    }

    setFilter(type: string | null) {
        this.filter = type;
    }

    clear() {
        this.signals = [];
    }
}

export const signalStore = new SignalStore();
```

#### lib/stores/voice.svelte.ts

```typescript
import * as api from '$lib/api/voice';

class VoiceStore {
    status = $state<api.VoiceStatus | null>(null);
    profiles = $state<api.VoiceProfile[]>([]);
    samples = $state<api.VoiceSample[]>([]);
    loading = $state(false);
    error = $state<string | null>(null);

    // Selected gender for new profile
    selectedGender = $state<'male' | 'female' | 'neutral'>('female');

    // Selected samples for profile generation
    selectedSamples = $state<string[]>([]);

    async loadAll() {
        this.loading = true;
        try {
            const [status, profiles, samples] = await Promise.all([
                api.getStatus(),
                api.listProfiles(),
                api.listSamples(),
            ]);
            this.status = status;
            this.profiles = profiles;
            this.samples = samples;
        } catch (e) {
            this.error = String(e);
        } finally {
            this.loading = false;
        }
    }

    async uploadSample(file: File) {
        this.loading = true;
        try {
            const result = await api.uploadSample(file);
            await this.loadAll();
            return result;
        } finally {
            this.loading = false;
        }
    }

    async generateProfile(name: string) {
        if (this.selectedSamples.length === 0) {
            this.error = 'Select at least one sample';
            return;
        }

        this.loading = true;
        try {
            const profile = await api.generateProfile({
                name,
                gender: this.selectedGender,
                sample_ids: this.selectedSamples,
            });
            await this.loadAll();
            return profile;
        } catch (e) {
            this.error = String(e);
        } finally {
            this.loading = false;
        }
    }

    async setActive(profileId: string) {
        await api.setActive({ profile_id: profileId });
        await this.loadAll();
    }

    async testTTS(text: string, profileId?: string): Promise<Blob> {
        return api.testTTS({ text, profile_id: profileId });
    }

    toggleSample(id: string) {
        if (this.selectedSamples.includes(id)) {
            this.selectedSamples = this.selectedSamples.filter(s => s !== id);
        } else {
            this.selectedSamples = [...this.selectedSamples, id];
        }
    }
}

export const voiceStore = new VoiceStore();
```

#### components/voice/GenderSelector.svelte

```svelte
<script lang="ts">
    import { voiceStore } from '$lib/stores/voice.svelte';

    const options = [
        { value: 'male', label: 'Maestro', icon: '♂' },
        { value: 'female', label: 'Maestrosette', icon: '♀' },
        { value: 'neutral', label: 'Neutral', icon: '⚪' },
    ] as const;
</script>

<div class="gender-selector">
    <label class="label">Voice Gender</label>
    <div class="options">
        {#each options as opt}
            <button
                class="option"
                class:active={voiceStore.selectedGender === opt.value}
                onclick={() => voiceStore.selectedGender = opt.value}
            >
                <span class="icon">{opt.icon}</span>
                <span class="label">{opt.label}</span>
            </button>
        {/each}
    </div>
</div>

<style>
    .gender-selector {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .options {
        display: flex;
        gap: 0.5rem;
    }

    .option {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        border: 2px solid var(--border);
        border-radius: 8px;
        background: var(--bg-secondary);
        cursor: pointer;
        transition: all 0.2s;
    }

    .option:hover {
        border-color: var(--accent);
    }

    .option.active {
        border-color: var(--accent);
        background: var(--accent-bg);
    }

    .icon {
        font-size: 1.5rem;
    }
</style>
```

#### components/rumination/ThoughtTree.svelte

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import ThoughtNode from './ThoughtNode.svelte';
    import { ruminationStore } from '$lib/stores/rumination.svelte';

    onMount(() => {
        ruminationStore.loadTree();
        const interval = setInterval(() => ruminationStore.loadTree(), 1000);
        return () => clearInterval(interval);
    });
</script>

<div class="thought-tree">
    <header>
        <h2>Thought Tree</h2>
        <span class="session">{ruminationStore.tree?.session_id ?? 'No session'}</span>
    </header>

    {#if ruminationStore.tree}
        <div class="tree-container">
            <ThoughtNode
                node={ruminationStore.tree.root}
                activePath={ruminationStore.tree.active_path}
                depth={0}
            />
        </div>
    {:else}
        <div class="empty">
            <p>Waiting for rumination...</p>
        </div>
    {/if}
</div>

<style>
    .thought-tree {
        background: var(--bg-glass);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 1rem;
        height: 100%;
        overflow: auto;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border);
    }

    .session {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .tree-container {
        padding-left: 1rem;
    }

    .empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: var(--text-secondary);
    }
</style>
```

#### components/rumination/LayerIndicator.svelte

```svelte
<script lang="ts">
    import { ruminationStore } from '$lib/stores/rumination.svelte';

    const layers = [
        { name: 'keystroke', budget: '50ms', color: '#4ade80' },
        { name: 'pause', budget: '500ms', color: '#60a5fa' },
        { name: 'send', budget: '2-5s', color: '#f59e0b' },
        { name: 'background', budget: 'minutes', color: '#a855f7' },
    ];
</script>

<div class="layer-indicator">
    {#each layers as layer}
        {@const status = ruminationStore.state?.layers.find(l => l.name === layer.name)}
        <div
            class="layer"
            class:active={status?.active}
            style="--layer-color: {layer.color}"
        >
            <div class="dot"></div>
            <div class="info">
                <span class="name">{layer.name}</span>
                <span class="budget">{layer.budget}</span>
            </div>
            {#if status?.last_triggered}
                <span class="last">{status.last_triggered}</span>
            {/if}
        </div>
    {/each}
</div>

<style>
    .layer-indicator {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .layer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        border-radius: 6px;
        background: var(--bg-secondary);
        opacity: 0.5;
        transition: all 0.3s;
    }

    .layer.active {
        opacity: 1;
        background: color-mix(in srgb, var(--layer-color) 20%, transparent);
    }

    .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--layer-color);
        opacity: 0.3;
    }

    .layer.active .dot {
        opacity: 1;
        animation: pulse 1s infinite;
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }

    .info {
        display: flex;
        flex-direction: column;
    }

    .name {
        font-weight: 500;
        text-transform: capitalize;
    }

    .budget {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .last {
        margin-left: auto;
        font-size: 0.7rem;
        color: var(--text-tertiary);
    }
</style>
```

#### routes/+page.svelte (Dashboard)

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import SignalStream from '$lib/components/signals/SignalStream.svelte';
    import LayerIndicator from '$lib/components/rumination/LayerIndicator.svelte';
    import MinionGrid from '$lib/components/background/MinionGrid.svelte';
    import ModelStatus from '$lib/components/background/ModelStatus.svelte';
    import { signalStore } from '$lib/stores/signals.svelte';
    import { ruminationStore } from '$lib/stores/rumination.svelte';
    import { backgroundStore } from '$lib/stores/background.svelte';

    onMount(() => {
        signalStore.connect();
        ruminationStore.loadState();
        backgroundStore.loadAll();

        const interval = setInterval(() => {
            ruminationStore.loadState();
            backgroundStore.loadAll();
        }, 2000);

        return () => {
            signalStore.disconnect();
            clearInterval(interval);
        };
    });
</script>

<div class="dashboard">
    <h1>DevPulse Lab</h1>

    <div class="grid">
        <section class="panel signals">
            <h2>Live Signals</h2>
            <SignalStream limit={10} />
        </section>

        <section class="panel layers">
            <h2>Rumination Layers</h2>
            <LayerIndicator />
        </section>

        <section class="panel minions">
            <h2>Minions</h2>
            <MinionGrid />
        </section>

        <section class="panel models">
            <h2>Models</h2>
            <ModelStatus />
        </section>
    </div>
</div>

<style>
    .dashboard {
        padding: 1.5rem;
    }

    h1 {
        margin-bottom: 1.5rem;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 1rem;
        height: calc(100vh - 120px);
    }

    .panel {
        background: var(--bg-glass);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 1rem;
        overflow: auto;
    }

    .panel h2 {
        font-size: 1rem;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border);
    }
</style>
```

---

## Completion Criteria

### Module 3.0: Signal Wiring
- [ ] ChatFacade emits Chat signal on user message
- [ ] ChatFacade emits Chat signal on assistant response
- [ ] ChatFacade emits Inference signal with metrics
- [ ] Engine passes router to all facades
- [ ] RuminationPayload and ThoughtNodePayload added to variants
- [ ] Test: Send chat, verify 3 signals emitted

### Module 3.1: Lab Backend
- [ ] `cargo run -p lab` starts Axum server on :3001
- [ ] GET /api/health returns 200
- [ ] GET /api/chat/history returns messages
- [ ] POST /api/chat/send triggers chat and returns response
- [ ] GET /api/signals/stream returns SSE stream
- [ ] WS /api/signals/ws accepts connection
- [ ] All voice endpoints return valid responses
- [ ] All rumination endpoints return valid responses
- [ ] All background endpoints return valid responses
- [ ] Test: curl each endpoint, verify response

### Module 3.2: Lab Frontend
- [ ] `npm run dev` starts on :5174
- [ ] Dashboard shows all 4 panels
- [ ] Signal stream updates in real-time
- [ ] Layer indicator shows active layer
- [ ] Minion grid shows all 8 minions
- [ ] Model status shows all loaded models
- [ ] Voice page allows sample upload
- [ ] Voice page allows gender selection
- [ ] Voice page allows profile generation
- [ ] Voice page allows TTS test
- [ ] Rumination page shows thought tree
- [ ] Chat page shows live chat stream
- [ ] Test: Chat in Desktop, see signal appear in Lab

### Integration
- [ ] Desktop chat → Signal emitted → Lab sees it
- [ ] Rumination layer changes → Lab shows it
- [ ] Voice profile created → Can be used for TTS

---

## FULL IMPLEMENTATIONS (Best Practice)

### Backend Route Implementations

#### routes/signals.rs (FULL)

```rust
//! Signal streaming - SSE and WebSocket endpoints

use axum::{
    extract::{State, WebSocketUpgrade},
    response::{
        sse::{Event, Sse},
        IntoResponse,
    },
    routing::get,
    Router,
};
use axum::extract::ws::{Message, WebSocket};
use futures::{SinkExt, StreamExt};
use std::{convert::Infallible, sync::Arc, time::Duration};
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt as _;

use crate::state::{AppState, SignalEvent};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/stream", get(signal_stream_sse))
        .route("/ws", get(signal_websocket))
}

/// SSE endpoint for signal streaming
async fn signal_stream_sse(
    State(state): State<Arc<AppState>>,
) -> Sse<impl futures::Stream<Item = Result<Event, Infallible>>> {
    let rx = state.signal_tx.subscribe();
    let stream = BroadcastStream::new(rx);

    let event_stream = stream.filter_map(|result| {
        match result {
            Ok(signal) => {
                let json = serde_json::to_string(&signal).ok()?;
                Some(Ok(Event::default().data(json)))
            }
            Err(_) => None,
        }
    });

    Sse::new(event_stream).keep_alive(
        axum::response::sse::KeepAlive::new()
            .interval(Duration::from_secs(15))
            .text("ping"),
    )
}

/// WebSocket endpoint for bidirectional signal streaming
async fn signal_websocket(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.signal_tx.subscribe();

    // Spawn task to send signals to client
    let send_task = tokio::spawn(async move {
        loop {
            match rx.recv().await {
                Ok(signal) => {
                    if let Ok(json) = serde_json::to_string(&signal) {
                        if sender.send(Message::Text(json)).await.is_err() {
                            break;
                        }
                    }
                }
                Err(tokio::sync::broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!("WebSocket client lagged by {} messages", n);
                }
                Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
            }
        }
    });

    // Handle incoming messages (for future bidirectional use)
    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                tracing::debug!("Received WS message: {}", text);
                // Future: handle client commands
            }
            Ok(Message::Close(_)) => break,
            Err(e) => {
                tracing::error!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }

    send_task.abort();
}
```

#### routes/chat.rs (FULL)

```rust
//! Chat endpoints - history and send

use axum::{
    extract::{Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{error::AppResult, state::AppState};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/history", get(get_history))
        .route("/send", post(send_message))
        .route("/sessions", get(list_sessions))
        .route("/sessions/create", post(create_session))
}

#[derive(Deserialize)]
pub struct HistoryParams {
    pub session_id: String,
    pub limit: Option<usize>,
}

#[derive(Serialize)]
pub struct ChatMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: String,
    pub tokens: Option<u32>,
}

#[derive(Deserialize)]
pub struct SendRequest {
    pub message: String,
    pub session_id: String,
}

#[derive(Serialize)]
pub struct SendResponse {
    pub id: String,
    pub content: String,
    pub tokens_in: u32,
    pub tokens_out: u32,
    pub latency_ms: u32,
    pub model_id: String,
}

#[derive(Serialize)]
pub struct SessionInfo {
    pub id: String,
    pub created_at: String,
    pub message_count: usize,
    pub last_message: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateSessionRequest {
    pub project_id: Option<String>,
}

/// GET /api/chat/history?session_id=xxx&limit=50
async fn get_history(
    State(state): State<Arc<AppState>>,
    Query(params): Query<HistoryParams>,
) -> AppResult<Json<Vec<ChatMessage>>> {
    let limit = params.limit.unwrap_or(100);
    let history = state
        .engine
        .chat
        .history(&params.session_id)
        .await
        .map_err(|e| crate::error::AppError::Engine(e))?;

    let messages: Vec<ChatMessage> = history
        .into_iter()
        .take(limit)
        .map(|m| ChatMessage {
            id: m.id.to_string(),
            role: format!("{:?}", m.role).to_lowercase(),
            content: m.content,
            timestamp: m.timestamp.to_rfc3339(),
            tokens: m.tokens,
        })
        .collect();

    Ok(Json(messages))
}

/// POST /api/chat/send
async fn send_message(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SendRequest>,
) -> AppResult<Json<SendResponse>> {
    let session_id = shared::types::ids::SessionId::new();  // Or parse from request

    let response = state
        .engine
        .chat
        .send(&request.message, session_id)
        .await
        .map_err(|e| crate::error::AppError::Engine(e))?;

    Ok(Json(SendResponse {
        id: response.id.to_string(),
        content: response.message,
        tokens_in: response.prompt_tokens,
        tokens_out: response.completion_tokens,
        latency_ms: response.latency_ms,
        model_id: response.model_id,
    }))
}

/// GET /api/chat/sessions
async fn list_sessions(
    State(state): State<Arc<AppState>>,
) -> AppResult<Json<Vec<SessionInfo>>> {
    let sessions = state.engine.sessions.list();

    let infos: Vec<SessionInfo> = sessions
        .iter()
        .map(|s| SessionInfo {
            id: s.id.to_string(),
            created_at: s.created_at.to_rfc3339(),
            message_count: s.message_count,
            last_message: s.last_message.clone(),
        })
        .collect();

    Ok(Json(infos))
}

/// POST /api/chat/sessions/create
async fn create_session(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreateSessionRequest>,
) -> AppResult<Json<SessionInfo>> {
    let session = state
        .engine
        .sessions
        .create(request.project_id.as_deref())
        .map_err(|e| crate::error::AppError::Engine(e))?;

    Ok(Json(SessionInfo {
        id: session.id.to_string(),
        created_at: session.created_at.to_rfc3339(),
        message_count: 0,
        last_message: None,
    }))
}
```

#### routes/voice.rs (FULL)

```rust
//! Voice profile management endpoints

use axum::{
    body::Body,
    extract::{Multipart, Path, State},
    http::{header, Response, StatusCode},
    routing::{delete, get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{error::{AppError, AppResult}, state::AppState};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/status", get(get_status))
        .route("/profiles", get(list_profiles))
        .route("/profiles", post(create_profile))
        .route("/profiles/:id", delete(delete_profile))
        .route("/active", post(set_active))
        .route("/samples", get(list_samples))
        .route("/samples/upload", post(upload_sample))
        .route("/samples/:id", delete(delete_sample))
        .route("/test", post(test_tts))
        .route("/generate", post(generate_profile))
}

#[derive(Serialize)]
pub struct VoiceStatus {
    pub tts_loaded: bool,
    pub cloner_loaded: bool,
    pub active_profile_id: Option<String>,
    pub active_profile_name: Option<String>,
    pub sample_count: usize,
    pub profile_count: usize,
}

#[derive(Serialize)]
pub struct VoiceProfile {
    pub id: String,
    pub name: String,
    pub gender: String,
    pub created_at: String,
    pub is_active: bool,
    pub is_default: bool,
}

#[derive(Deserialize)]
pub struct CreateProfileRequest {
    pub name: String,
    pub gender: String,
    pub sample_ids: Vec<String>,
}

#[derive(Deserialize)]
pub struct SetActiveRequest {
    pub profile_id: String,
}

#[derive(Serialize)]
pub struct VoiceSample {
    pub id: String,
    pub filename: String,
    pub size_bytes: u64,
    pub duration_secs: Option<f32>,
    pub uploaded_at: String,
}

#[derive(Deserialize)]
pub struct TestRequest {
    pub text: String,
    pub profile_id: Option<String>,
}

#[derive(Deserialize)]
pub struct GenerateRequest {
    pub name: String,
    pub gender: String,
    pub sample_ids: Vec<String>,
}

#[derive(Serialize)]
pub struct UploadResponse {
    pub id: String,
    pub filename: String,
    pub size_bytes: u64,
}

#[derive(Serialize)]
pub struct DeleteResponse {
    pub success: bool,
}

/// GET /api/voice/status
async fn get_status(State(state): State<Arc<AppState>>) -> AppResult<Json<VoiceStatus>> {
    let voice = &state.engine.voice;
    let status = voice.status().await.map_err(|e| AppError::Engine(e))?;

    Ok(Json(VoiceStatus {
        tts_loaded: status.tts_loaded,
        cloner_loaded: status.cloner_loaded,
        active_profile_id: status.active_profile_id.map(|id| id.to_string()),
        active_profile_name: status.active_profile_name,
        sample_count: status.sample_count,
        profile_count: status.profile_count,
    }))
}

/// GET /api/voice/profiles
async fn list_profiles(State(state): State<Arc<AppState>>) -> AppResult<Json<Vec<VoiceProfile>>> {
    let profiles = state.engine.voice.list_profiles().await
        .map_err(|e| AppError::Engine(e))?;

    let active_id = state.engine.voice.active_profile_id().await;

    let result: Vec<VoiceProfile> = profiles
        .into_iter()
        .map(|p| VoiceProfile {
            id: p.id.to_string(),
            name: p.name,
            gender: p.gender,
            created_at: p.created_at.to_rfc3339(),
            is_active: Some(p.id) == active_id,
            is_default: p.is_default,
        })
        .collect();

    Ok(Json(result))
}

/// POST /api/voice/profiles
async fn create_profile(
    State(state): State<Arc<AppState>>,
    Json(request): Json<CreateProfileRequest>,
) -> AppResult<Json<VoiceProfile>> {
    let profile = state
        .engine
        .voice
        .create_profile(&request.name, &request.gender, &request.sample_ids)
        .await
        .map_err(|e| AppError::Engine(e))?;

    Ok(Json(VoiceProfile {
        id: profile.id.to_string(),
        name: profile.name,
        gender: profile.gender,
        created_at: profile.created_at.to_rfc3339(),
        is_active: false,
        is_default: false,
    }))
}

/// DELETE /api/voice/profiles/:id
async fn delete_profile(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<DeleteResponse>> {
    state
        .engine
        .voice
        .delete_profile(&id)
        .await
        .map_err(|e| AppError::Engine(e))?;

    Ok(Json(DeleteResponse { success: true }))
}

/// POST /api/voice/active
async fn set_active(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SetActiveRequest>,
) -> AppResult<Json<VoiceProfile>> {
    let profile = state
        .engine
        .voice
        .set_active(&request.profile_id)
        .await
        .map_err(|e| AppError::Engine(e))?;

    Ok(Json(VoiceProfile {
        id: profile.id.to_string(),
        name: profile.name,
        gender: profile.gender,
        created_at: profile.created_at.to_rfc3339(),
        is_active: true,
        is_default: profile.is_default,
    }))
}

/// GET /api/voice/samples
async fn list_samples(State(state): State<Arc<AppState>>) -> AppResult<Json<Vec<VoiceSample>>> {
    let samples = state.engine.voice.list_samples().await
        .map_err(|e| AppError::Engine(e))?;

    let result: Vec<VoiceSample> = samples
        .into_iter()
        .map(|s| VoiceSample {
            id: s.id.to_string(),
            filename: s.filename,
            size_bytes: s.size_bytes,
            duration_secs: s.duration_secs,
            uploaded_at: s.uploaded_at.to_rfc3339(),
        })
        .collect();

    Ok(Json(result))
}

/// POST /api/voice/samples/upload
async fn upload_sample(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> AppResult<Json<UploadResponse>> {
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        AppError::BadRequest(format!("Failed to read multipart: {}", e))
    })? {
        let filename = field.file_name().unwrap_or("sample.wav").to_string();
        let data = field.bytes().await.map_err(|e| {
            AppError::BadRequest(format!("Failed to read file data: {}", e))
        })?;

        let sample = state
            .engine
            .voice
            .upload_sample(&filename, &data)
            .await
            .map_err(|e| AppError::Engine(e))?;

        return Ok(Json(UploadResponse {
            id: sample.id.to_string(),
            filename: sample.filename,
            size_bytes: sample.size_bytes,
        }));
    }

    Err(AppError::BadRequest("No file provided".to_string()))
}

/// DELETE /api/voice/samples/:id
async fn delete_sample(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> AppResult<Json<DeleteResponse>> {
    state
        .engine
        .voice
        .delete_sample(&id)
        .await
        .map_err(|e| AppError::Engine(e))?;

    Ok(Json(DeleteResponse { success: true }))
}

/// POST /api/voice/test - Returns WAV audio
async fn test_tts(
    State(state): State<Arc<AppState>>,
    Json(request): Json<TestRequest>,
) -> AppResult<Response<Body>> {
    let audio_bytes = state
        .engine
        .voice
        .synthesize(&request.text, request.profile_id.as_deref())
        .await
        .map_err(|e| AppError::Engine(e))?;

    let response = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "audio/wav")
        .header(header::CONTENT_LENGTH, audio_bytes.len())
        .body(Body::from(audio_bytes))
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(response)
}

/// POST /api/voice/generate - Clone voice from samples
async fn generate_profile(
    State(state): State<Arc<AppState>>,
    Json(request): Json<GenerateRequest>,
) -> AppResult<Json<VoiceProfile>> {
    let profile = state
        .engine
        .voice
        .generate_profile(&request.name, &request.gender, &request.sample_ids)
        .await
        .map_err(|e| AppError::Engine(e))?;

    Ok(Json(VoiceProfile {
        id: profile.id.to_string(),
        name: profile.name,
        gender: profile.gender,
        created_at: profile.created_at.to_rfc3339(),
        is_active: false,
        is_default: false,
    }))
}
```

#### routes/rumination.rs (FULL)

```rust
//! Rumination state and thought tree endpoints

use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;
use std::sync::Arc;

use crate::{error::AppResult, state::AppState};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/state", get(get_state))
        .route("/tree", get(get_tree))
        .route("/layers", get(get_layers))
}

#[derive(Serialize)]
pub struct RuminationState {
    pub current_layer: String,
    pub layers: Vec<LayerStatus>,
    pub active_minions: Vec<String>,
    pub pending_signals: u32,
}

#[derive(Serialize)]
pub struct LayerStatus {
    pub name: String,
    pub active: bool,
    pub latency_budget_ms: u64,
    pub last_triggered: Option<String>,
    pub signals_processed: u64,
}

#[derive(Serialize)]
pub struct ThoughtTree {
    pub session_id: String,
    pub root: ThoughtNode,
    pub active_path: Vec<String>,
}

#[derive(Serialize)]
pub struct ThoughtNode {
    pub id: String,
    pub content: String,
    pub node_type: String,
    pub children: Vec<ThoughtNode>,
    pub score: Option<f32>,
    pub source: Option<String>,
}

/// GET /api/rumination/state
async fn get_state(State(state): State<Arc<AppState>>) -> AppResult<Json<RuminationState>> {
    // Get rumination state from orchestrator via engine
    let rumination = state.engine.rumination_state().await;

    let layers = vec![
        LayerStatus {
            name: "keystroke".to_string(),
            active: rumination.current_layer == "keystroke",
            latency_budget_ms: 50,
            last_triggered: rumination.keystroke_last.map(|t| t.to_rfc3339()),
            signals_processed: rumination.keystroke_count,
        },
        LayerStatus {
            name: "pause".to_string(),
            active: rumination.current_layer == "pause",
            latency_budget_ms: 500,
            last_triggered: rumination.pause_last.map(|t| t.to_rfc3339()),
            signals_processed: rumination.pause_count,
        },
        LayerStatus {
            name: "send".to_string(),
            active: rumination.current_layer == "send",
            latency_budget_ms: 5000,
            last_triggered: rumination.send_last.map(|t| t.to_rfc3339()),
            signals_processed: rumination.send_count,
        },
        LayerStatus {
            name: "background".to_string(),
            active: rumination.current_layer == "background",
            latency_budget_ms: 300000, // 5 minutes
            last_triggered: rumination.background_last.map(|t| t.to_rfc3339()),
            signals_processed: rumination.background_count,
        },
    ];

    Ok(Json(RuminationState {
        current_layer: rumination.current_layer,
        layers,
        active_minions: rumination.active_minions,
        pending_signals: rumination.pending_signals,
    }))
}

/// GET /api/rumination/tree
async fn get_tree(State(state): State<Arc<AppState>>) -> AppResult<Json<ThoughtTree>> {
    let tree = state.engine.thought_tree().await;

    fn convert_node(node: &engine::ThoughtTreeNode) -> ThoughtNode {
        ThoughtNode {
            id: node.id.clone(),
            content: node.content.clone(),
            node_type: node.node_type.clone(),
            children: node.children.iter().map(convert_node).collect(),
            score: node.score,
            source: node.source.clone(),
        }
    }

    Ok(Json(ThoughtTree {
        session_id: tree.session_id.to_string(),
        root: convert_node(&tree.root),
        active_path: tree.active_path.clone(),
    }))
}

/// GET /api/rumination/layers
async fn get_layers(State(state): State<Arc<AppState>>) -> AppResult<Json<Vec<LayerStatus>>> {
    let rumination = state.engine.rumination_state().await;

    let layers = vec![
        LayerStatus {
            name: "keystroke".to_string(),
            active: rumination.current_layer == "keystroke",
            latency_budget_ms: 50,
            last_triggered: rumination.keystroke_last.map(|t| t.to_rfc3339()),
            signals_processed: rumination.keystroke_count,
        },
        LayerStatus {
            name: "pause".to_string(),
            active: rumination.current_layer == "pause",
            latency_budget_ms: 500,
            last_triggered: rumination.pause_last.map(|t| t.to_rfc3339()),
            signals_processed: rumination.pause_count,
        },
        LayerStatus {
            name: "send".to_string(),
            active: rumination.current_layer == "send",
            latency_budget_ms: 5000,
            last_triggered: rumination.send_last.map(|t| t.to_rfc3339()),
            signals_processed: rumination.send_count,
        },
        LayerStatus {
            name: "background".to_string(),
            active: rumination.current_layer == "background",
            latency_budget_ms: 300000,
            last_triggered: rumination.background_last.map(|t| t.to_rfc3339()),
            signals_processed: rumination.background_count,
        },
    ];

    Ok(Json(layers))
}
```

#### routes/background.rs (FULL)

```rust
//! Background process monitoring endpoints

use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;
use std::sync::Arc;

use crate::{error::AppResult, state::AppState};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/status", get(get_status))
        .route("/minions", get(get_minions))
        .route("/models", get(get_models))
        .route("/storage", get(get_storage))
}

#[derive(Serialize)]
pub struct BackgroundStatus {
    pub processes: Vec<ProcessStatus>,
    pub storage_sync: StorageSyncStatus,
    pub uptime_secs: u64,
}

#[derive(Serialize)]
pub struct ProcessStatus {
    pub id: String,
    pub name: String,
    pub status: String,
    pub last_run: Option<String>,
    pub cpu_percent: f32,
    pub memory_mb: f32,
}

#[derive(Serialize)]
pub struct MinionStatus {
    pub name: String,
    pub active: bool,
    pub signals_pending: u32,
    pub last_signal: Option<String>,
    pub health: String,
}

#[derive(Serialize)]
pub struct StorageSyncStatus {
    pub hot_count: u32,
    pub warm_count: u32,
    pub cold_count: u32,
    pub sync_rate_per_sec: f32,
}

#[derive(Serialize)]
pub struct ModelStatus {
    pub embedder: ModelInfo,
    pub reranker: ModelInfo,
    pub llm: ModelInfo,
    pub voice_tts: ModelInfo,
    pub voice_cloner: ModelInfo,
}

#[derive(Serialize)]
pub struct ModelInfo {
    pub name: String,
    pub loaded: bool,
    pub memory_mb: f32,
    pub last_used: Option<String>,
}

/// GET /api/background/status
async fn get_status(State(state): State<Arc<AppState>>) -> AppResult<Json<BackgroundStatus>> {
    let bg = state.engine.background_status().await;

    let processes: Vec<ProcessStatus> = bg
        .processes
        .iter()
        .map(|p| ProcessStatus {
            id: p.id.clone(),
            name: p.name.clone(),
            status: p.status.clone(),
            last_run: p.last_run.map(|t| t.to_rfc3339()),
            cpu_percent: p.cpu_percent,
            memory_mb: p.memory_mb,
        })
        .collect();

    Ok(Json(BackgroundStatus {
        processes,
        storage_sync: StorageSyncStatus {
            hot_count: bg.storage.hot_count,
            warm_count: bg.storage.warm_count,
            cold_count: bg.storage.cold_count,
            sync_rate_per_sec: bg.storage.sync_rate,
        },
        uptime_secs: bg.uptime_secs,
    }))
}

/// GET /api/background/minions
async fn get_minions(State(state): State<Arc<AppState>>) -> AppResult<Json<Vec<MinionStatus>>> {
    let minions = state.engine.minion_status().await;

    let result: Vec<MinionStatus> = minions
        .iter()
        .map(|m| MinionStatus {
            name: m.name.clone(),
            active: m.active,
            signals_pending: m.signals_pending,
            last_signal: m.last_signal.map(|t| t.to_rfc3339()),
            health: m.health.clone(),
        })
        .collect();

    Ok(Json(result))
}

/// GET /api/background/models
async fn get_models(State(state): State<Arc<AppState>>) -> AppResult<Json<ModelStatus>> {
    let models = state.engine.model_status().await;

    Ok(Json(ModelStatus {
        embedder: ModelInfo {
            name: models.embedder.name.clone(),
            loaded: models.embedder.loaded,
            memory_mb: models.embedder.memory_mb,
            last_used: models.embedder.last_used.map(|t| t.to_rfc3339()),
        },
        reranker: ModelInfo {
            name: models.reranker.name.clone(),
            loaded: models.reranker.loaded,
            memory_mb: models.reranker.memory_mb,
            last_used: models.reranker.last_used.map(|t| t.to_rfc3339()),
        },
        llm: ModelInfo {
            name: models.llm.name.clone(),
            loaded: models.llm.loaded,
            memory_mb: models.llm.memory_mb,
            last_used: models.llm.last_used.map(|t| t.to_rfc3339()),
        },
        voice_tts: ModelInfo {
            name: models.voice_tts.name.clone(),
            loaded: models.voice_tts.loaded,
            memory_mb: models.voice_tts.memory_mb,
            last_used: models.voice_tts.last_used.map(|t| t.to_rfc3339()),
        },
        voice_cloner: ModelInfo {
            name: models.voice_cloner.name.clone(),
            loaded: models.voice_cloner.loaded,
            memory_mb: models.voice_cloner.memory_mb,
            last_used: models.voice_cloner.last_used.map(|t| t.to_rfc3339()),
        },
    }))
}

/// GET /api/background/storage
async fn get_storage(State(state): State<Arc<AppState>>) -> AppResult<Json<StorageSyncStatus>> {
    let storage = state.engine.storage_status().await;

    Ok(Json(StorageSyncStatus {
        hot_count: storage.hot_count,
        warm_count: storage.warm_count,
        cold_count: storage.cold_count,
        sync_rate_per_sec: storage.sync_rate,
    }))
}
```

---

### Frontend Full Implementations

#### package.json

```json
{
  "name": "lab-ui",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite dev --port 5174",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0"
  },
  "type": "module"
}
```

#### svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    })
  }
};

export default config;
```

#### vite.config.ts

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5174,
    strictPort: true,
  }
});
```

#### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-glass': 'var(--bg-glass)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'accent': 'var(--accent)',
        'border': 'var(--border)',
      }
    }
  },
  plugins: []
};
```

#### src/app.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-glass: rgba(18, 18, 26, 0.8);
  --text-primary: #e4e4e7;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;
  --accent: #6366f1;
  --accent-bg: rgba(99, 102, 241, 0.1);
  --border: rgba(255, 255, 255, 0.1);
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
}

/* Glass effect utilities */
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
}

.glass-strong {
  background: rgba(18, 18, 26, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
```

#### src/app.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>DevPulse Lab</title>
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

#### lib/api/voice.ts

```typescript
import { get, post, del } from './client';

export interface VoiceStatus {
  tts_loaded: boolean;
  cloner_loaded: boolean;
  active_profile_id: string | null;
  active_profile_name: string | null;
  sample_count: number;
  profile_count: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  gender: string;
  created_at: string;
  is_active: boolean;
  is_default: boolean;
}

export interface VoiceSample {
  id: string;
  filename: string;
  size_bytes: number;
  duration_secs: number | null;
  uploaded_at: string;
}

export interface GenerateRequest {
  name: string;
  gender: string;
  sample_ids: string[];
}

export interface SetActiveRequest {
  profile_id: string;
}

export interface TestRequest {
  text: string;
  profile_id?: string;
}

export async function getStatus(): Promise<VoiceStatus> {
  return get('/api/voice/status');
}

export async function listProfiles(): Promise<VoiceProfile[]> {
  return get('/api/voice/profiles');
}

export async function listSamples(): Promise<VoiceSample[]> {
  return get('/api/voice/samples');
}

export async function uploadSample(file: File): Promise<{ id: string; filename: string; size_bytes: number }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('http://localhost:3001/api/voice/samples/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function deleteProfile(id: string): Promise<void> {
  await del(`/api/voice/profiles/${id}`);
}

export async function deleteSample(id: string): Promise<void> {
  await del(`/api/voice/samples/${id}`);
}

export async function setActive(request: SetActiveRequest): Promise<VoiceProfile> {
  return post('/api/voice/active', request);
}

export async function generateProfile(request: GenerateRequest): Promise<VoiceProfile> {
  return post('/api/voice/generate', request);
}

export async function testTTS(request: TestRequest): Promise<Blob> {
  const res = await fetch('http://localhost:3001/api/voice/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw new Error(`TTS test failed: ${res.status}`);
  return res.blob();
}
```

#### lib/api/rumination.ts

```typescript
import { get } from './client';

export interface RuminationState {
  current_layer: string;
  layers: LayerStatus[];
  active_minions: string[];
  pending_signals: number;
}

export interface LayerStatus {
  name: string;
  active: boolean;
  latency_budget_ms: number;
  last_triggered: string | null;
  signals_processed: number;
}

export interface ThoughtTree {
  session_id: string;
  root: ThoughtNode;
  active_path: string[];
}

export interface ThoughtNode {
  id: string;
  content: string;
  node_type: string;
  children: ThoughtNode[];
  score: number | null;
  source: string | null;
}

export async function getState(): Promise<RuminationState> {
  return get('/api/rumination/state');
}

export async function getTree(): Promise<ThoughtTree> {
  return get('/api/rumination/tree');
}

export async function getLayers(): Promise<LayerStatus[]> {
  return get('/api/rumination/layers');
}
```

#### lib/api/background.ts

```typescript
import { get } from './client';

export interface BackgroundStatus {
  processes: ProcessStatus[];
  storage_sync: StorageSyncStatus;
  uptime_secs: number;
}

export interface ProcessStatus {
  id: string;
  name: string;
  status: string;
  last_run: string | null;
  cpu_percent: number;
  memory_mb: number;
}

export interface MinionStatus {
  name: string;
  active: boolean;
  signals_pending: number;
  last_signal: string | null;
  health: string;
}

export interface StorageSyncStatus {
  hot_count: number;
  warm_count: number;
  cold_count: number;
  sync_rate_per_sec: number;
}

export interface ModelStatus {
  embedder: ModelInfo;
  reranker: ModelInfo;
  llm: ModelInfo;
  voice_tts: ModelInfo;
  voice_cloner: ModelInfo;
}

export interface ModelInfo {
  name: string;
  loaded: boolean;
  memory_mb: number;
  last_used: string | null;
}

export async function getStatus(): Promise<BackgroundStatus> {
  return get('/api/background/status');
}

export async function getMinions(): Promise<MinionStatus[]> {
  return get('/api/background/minions');
}

export async function getModels(): Promise<ModelStatus> {
  return get('/api/background/models');
}

export async function getStorage(): Promise<StorageSyncStatus> {
  return get('/api/background/storage');
}
```

#### lib/api/chat.ts

```typescript
import { get, post } from './client';

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  tokens: number | null;
}

export interface SendRequest {
  message: string;
  session_id: string;
}

export interface SendResponse {
  id: string;
  content: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  model_id: string;
}

export interface SessionInfo {
  id: string;
  created_at: string;
  message_count: number;
  last_message: string | null;
}

export async function getHistory(sessionId: string, limit?: number): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ session_id: sessionId });
  if (limit) params.set('limit', limit.toString());
  return get(`/api/chat/history?${params}`);
}

export async function sendMessage(request: SendRequest): Promise<SendResponse> {
  return post('/api/chat/send', request);
}

export async function listSessions(): Promise<SessionInfo[]> {
  return get('/api/chat/sessions');
}

export async function createSession(projectId?: string): Promise<SessionInfo> {
  return post('/api/chat/sessions/create', { project_id: projectId });
}
```

#### lib/api/index.ts

```typescript
export * from './client';
export * from './signals';
export * from './chat';
export * from './voice';
export * from './rumination';
export * from './background';
```

#### lib/stores/rumination.svelte.ts

```typescript
import * as api from '$lib/api/rumination';

class RuminationStore {
  state = $state<api.RuminationState | null>(null);
  tree = $state<api.ThoughtTree | null>(null);
  loading = $state(false);
  error = $state<string | null>(null);

  async loadState() {
    try {
      this.state = await api.getState();
    } catch (e) {
      this.error = String(e);
    }
  }

  async loadTree() {
    try {
      this.tree = await api.getTree();
    } catch (e) {
      this.error = String(e);
    }
  }

  async loadAll() {
    this.loading = true;
    try {
      const [state, tree] = await Promise.all([
        api.getState(),
        api.getTree(),
      ]);
      this.state = state;
      this.tree = tree;
    } catch (e) {
      this.error = String(e);
    } finally {
      this.loading = false;
    }
  }
}

export const ruminationStore = new RuminationStore();
```

#### lib/stores/background.svelte.ts

```typescript
import * as api from '$lib/api/background';

class BackgroundStore {
  status = $state<api.BackgroundStatus | null>(null);
  minions = $state<api.MinionStatus[]>([]);
  models = $state<api.ModelStatus | null>(null);
  loading = $state(false);
  error = $state<string | null>(null);

  async loadAll() {
    this.loading = true;
    try {
      const [status, minions, models] = await Promise.all([
        api.getStatus(),
        api.getMinions(),
        api.getModels(),
      ]);
      this.status = status;
      this.minions = minions;
      this.models = models;
    } catch (e) {
      this.error = String(e);
    } finally {
      this.loading = false;
    }
  }

  async loadStatus() {
    try {
      this.status = await api.getStatus();
    } catch (e) {
      this.error = String(e);
    }
  }

  async loadMinions() {
    try {
      this.minions = await api.getMinions();
    } catch (e) {
      this.error = String(e);
    }
  }

  async loadModels() {
    try {
      this.models = await api.getModels();
    } catch (e) {
      this.error = String(e);
    }
  }
}

export const backgroundStore = new BackgroundStore();
```

#### lib/stores/chat.svelte.ts

```typescript
import * as api from '$lib/api/chat';

class ChatStore {
  messages = $state<api.ChatMessage[]>([]);
  sessions = $state<api.SessionInfo[]>([]);
  currentSessionId = $state<string | null>(null);
  loading = $state(false);
  sending = $state(false);
  error = $state<string | null>(null);

  async loadSessions() {
    this.loading = true;
    try {
      this.sessions = await api.listSessions();
    } catch (e) {
      this.error = String(e);
    } finally {
      this.loading = false;
    }
  }

  async loadHistory(sessionId: string) {
    this.loading = true;
    this.currentSessionId = sessionId;
    try {
      this.messages = await api.getHistory(sessionId);
    } catch (e) {
      this.error = String(e);
    } finally {
      this.loading = false;
    }
  }

  async send(message: string): Promise<api.SendResponse | null> {
    if (!this.currentSessionId) {
      this.error = 'No session selected';
      return null;
    }

    this.sending = true;
    try {
      const response = await api.sendMessage({
        message,
        session_id: this.currentSessionId,
      });

      // Reload history to get new messages
      await this.loadHistory(this.currentSessionId);

      return response;
    } catch (e) {
      this.error = String(e);
      return null;
    } finally {
      this.sending = false;
    }
  }

  async createSession(projectId?: string) {
    try {
      const session = await api.createSession(projectId);
      await this.loadSessions();
      this.currentSessionId = session.id;
      this.messages = [];
      return session;
    } catch (e) {
      this.error = String(e);
      return null;
    }
  }
}

export const chatStore = new ChatStore();
```

#### components/signals/SignalStream.svelte

```svelte
<script lang="ts">
  import { signalStore } from '$lib/stores/signals.svelte';
  import SignalCard from './SignalCard.svelte';

  interface Props {
    limit?: number;
  }

  let { limit = 50 }: Props = $props();

  const signals = $derived(
    signalStore.filtered.slice(0, limit)
  );
</script>

<div class="signal-stream">
  <header>
    <span class="status" class:connected={signalStore.connected}>
      {signalStore.connected ? 'Connected' : 'Disconnected'}
    </span>
    <button class="clear-btn" onclick={() => signalStore.clear()}>
      Clear
    </button>
  </header>

  <div class="signals">
    {#each signals as signal (signal.id)}
      <SignalCard {signal} />
    {/each}

    {#if signals.length === 0}
      <div class="empty">
        Waiting for signals...
      </div>
    {/if}
  </div>
</div>

<style>
  .signal-stream {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
  }

  .status {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    background: var(--error);
    color: white;
  }

  .status.connected {
    background: var(--success);
  }

  .clear-btn {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .clear-btn:hover {
    background: var(--border);
  }

  .signals {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    color: var(--text-tertiary);
  }
</style>
```

#### components/signals/SignalCard.svelte

```svelte
<script lang="ts">
  import type { SignalEvent } from '$lib/api/signals';

  interface Props {
    signal: SignalEvent;
  }

  let { signal }: Props = $props();

  const typeColors: Record<string, string> = {
    chat: '#4ade80',
    inference: '#60a5fa',
    rumination: '#f59e0b',
    thought_node: '#a855f7',
    debug: '#71717a',
  };

  const color = $derived(typeColors[signal.signal_type] || '#71717a');

  const time = $derived(
    new Date(signal.timestamp).toLocaleTimeString()
  );
</script>

<div class="signal-card" style="--type-color: {color}">
  <div class="header">
    <span class="type">{signal.signal_type}</span>
    <span class="source">{signal.source}</span>
    <span class="time">{time}</span>
  </div>
  <div class="payload">
    <pre>{JSON.stringify(signal.payload, null, 2)}</pre>
  </div>
</div>

<style>
  .signal-card {
    background: var(--bg-secondary);
    border-left: 3px solid var(--type-color);
    border-radius: 4px;
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .header {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .type {
    font-weight: 600;
    color: var(--type-color);
    text-transform: uppercase;
    font-size: 0.7rem;
  }

  .source {
    color: var(--text-secondary);
    font-size: 0.7rem;
  }

  .time {
    margin-left: auto;
    color: var(--text-tertiary);
    font-size: 0.65rem;
  }

  .payload {
    max-height: 100px;
    overflow: auto;
  }

  .payload pre {
    margin: 0;
    font-family: 'Fira Code', monospace;
    font-size: 0.7rem;
    color: var(--text-secondary);
    white-space: pre-wrap;
  }
</style>
```

#### components/signals/SignalFilter.svelte

```svelte
<script lang="ts">
  import { signalStore } from '$lib/stores/signals.svelte';

  const types = ['chat', 'inference', 'rumination', 'thought_node', 'debug'];
</script>

<div class="signal-filter">
  <button
    class="filter-btn"
    class:active={signalStore.filter === null}
    onclick={() => signalStore.setFilter(null)}
  >
    All
  </button>
  {#each types as type}
    <button
      class="filter-btn"
      class:active={signalStore.filter === type}
      onclick={() => signalStore.setFilter(type)}
    >
      {type}
    </button>
  {/each}
</div>

<style>
  .signal-filter {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .filter-btn {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
    text-transform: capitalize;
  }

  .filter-btn:hover {
    background: var(--border);
  }

  .filter-btn.active {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }
</style>
```

#### components/rumination/ThoughtNode.svelte

```svelte
<script lang="ts">
  import type { ThoughtNode } from '$lib/api/rumination';

  interface Props {
    node: ThoughtNode;
    activePath: string[];
    depth: number;
  }

  let { node, activePath, depth }: Props = $props();

  const isActive = $derived(activePath.includes(node.id));
  const hasChildren = $derived(node.children.length > 0);
  const expanded = $state(true);
</script>

<div class="thought-node" class:active={isActive} style="--depth: {depth}">
  <div class="node-header" onclick={() => expanded = !expanded}>
    {#if hasChildren}
      <span class="toggle">{expanded ? '▼' : '▶'}</span>
    {:else}
      <span class="toggle leaf">●</span>
    {/if}

    <span class="content">{node.content}</span>

    {#if node.score !== null}
      <span class="score">{node.score.toFixed(2)}</span>
    {/if}

    {#if node.source}
      <span class="source">{node.source}</span>
    {/if}
  </div>

  {#if hasChildren && expanded}
    <div class="children">
      {#each node.children as child (child.id)}
        <svelte:self node={child} {activePath} depth={depth + 1} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .thought-node {
    margin-left: calc(var(--depth) * 1rem);
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .node-header:hover {
    background: var(--bg-secondary);
  }

  .thought-node.active > .node-header {
    background: var(--accent-bg);
    border-left: 2px solid var(--accent);
  }

  .toggle {
    font-size: 0.7rem;
    width: 1rem;
    color: var(--text-tertiary);
  }

  .toggle.leaf {
    font-size: 0.5rem;
  }

  .content {
    flex: 1;
    font-size: 0.85rem;
  }

  .score {
    font-size: 0.7rem;
    padding: 0.1rem 0.3rem;
    background: var(--success);
    color: white;
    border-radius: 3px;
  }

  .source {
    font-size: 0.65rem;
    color: var(--text-tertiary);
    font-style: italic;
  }

  .children {
    border-left: 1px solid var(--border);
    margin-left: 0.5rem;
    padding-left: 0.5rem;
  }
</style>
```

#### components/background/MinionGrid.svelte

```svelte
<script lang="ts">
  import { backgroundStore } from '$lib/stores/background.svelte';

  const healthColors: Record<string, string> = {
    healthy: '#22c55e',
    degraded: '#f59e0b',
    error: '#ef4444',
  };
</script>

<div class="minion-grid">
  {#each backgroundStore.minions as minion (minion.name)}
    <div
      class="minion"
      class:active={minion.active}
      style="--health-color: {healthColors[minion.health] || '#71717a'}"
    >
      <div class="header">
        <span class="name">{minion.name}</span>
        <span class="health-dot"></span>
      </div>
      <div class="stats">
        <span class="pending">
          {minion.signals_pending} pending
        </span>
      </div>
    </div>
  {:else}
    <div class="empty">No minions registered</div>
  {/each}
</div>

<style>
  .minion-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .minion {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 0.75rem;
    opacity: 0.5;
    transition: all 0.2s;
  }

  .minion.active {
    opacity: 1;
    border: 1px solid var(--health-color);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .name {
    font-size: 0.85rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .health-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--health-color);
  }

  .minion.active .health-dot {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .stats {
    font-size: 0.7rem;
    color: var(--text-tertiary);
  }

  .empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 1rem;
    color: var(--text-tertiary);
  }
</style>
```

#### components/background/ModelStatus.svelte

```svelte
<script lang="ts">
  import { backgroundStore } from '$lib/stores/background.svelte';

  const models = $derived(
    backgroundStore.models
      ? [
          { key: 'embedder', ...backgroundStore.models.embedder },
          { key: 'reranker', ...backgroundStore.models.reranker },
          { key: 'llm', ...backgroundStore.models.llm },
          { key: 'voice_tts', ...backgroundStore.models.voice_tts },
          { key: 'voice_cloner', ...backgroundStore.models.voice_cloner },
        ]
      : []
  );
</script>

<div class="model-status">
  {#each models as model (model.key)}
    <div class="model" class:loaded={model.loaded}>
      <div class="indicator"></div>
      <div class="info">
        <span class="name">{model.name || model.key}</span>
        <span class="memory">{model.memory_mb.toFixed(0)} MB</span>
      </div>
      <span class="status">{model.loaded ? 'Loaded' : 'Unloaded'}</span>
    </div>
  {:else}
    <div class="empty">Loading models...</div>
  {/each}
</div>

<style>
  .model-status {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .model {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: var(--bg-secondary);
    border-radius: 6px;
  }

  .indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--error);
  }

  .model.loaded .indicator {
    background: var(--success);
  }

  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .name {
    font-size: 0.85rem;
    font-weight: 500;
  }

  .memory {
    font-size: 0.7rem;
    color: var(--text-tertiary);
  }

  .status {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    background: var(--error);
    color: white;
  }

  .model.loaded .status {
    background: var(--success);
  }

  .empty {
    text-align: center;
    padding: 1rem;
    color: var(--text-tertiary);
  }
</style>
```

#### components/layout/Shell.svelte

```svelte
<script lang="ts">
  import Sidebar from './Sidebar.svelte';
  import Header from './Header.svelte';

  interface Props {
    children: any;
  }

  let { children }: Props = $props();
</script>

<div class="shell">
  <Sidebar />
  <div class="main">
    <Header />
    <main>
      {@render children()}
    </main>
  </div>
</div>

<style>
  .shell {
    display: flex;
    min-height: 100vh;
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  main {
    flex: 1;
    overflow: auto;
  }
</style>
```

#### components/layout/Sidebar.svelte

```svelte
<script lang="ts">
  import { page } from '$app/stores';

  const links = [
    { href: '/', label: 'Dashboard', icon: '⬡' },
    { href: '/signals', label: 'Signals', icon: '⚡' },
    { href: '/rumination', label: 'Rumination', icon: '🧠' },
    { href: '/voice', label: 'Voice', icon: '🎤' },
    { href: '/background', label: 'Background', icon: '⚙' },
    { href: '/chat', label: 'Chat', icon: '💬' },
  ];
</script>

<nav class="sidebar glass-strong">
  <div class="logo">
    <span class="icon">◈</span>
    <span class="text">Lab</span>
  </div>

  <ul class="nav-links">
    {#each links as link}
      <li>
        <a
          href={link.href}
          class:active={$page.url.pathname === link.href}
        >
          <span class="link-icon">{link.icon}</span>
          <span class="link-label">{link.label}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .sidebar {
    width: 200px;
    display: flex;
    flex-direction: column;
    padding: 1rem 0;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1rem 1rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1rem;
  }

  .logo .icon {
    font-size: 1.5rem;
    color: var(--accent);
  }

  .logo .text {
    font-weight: 700;
    font-size: 1.25rem;
  }

  .nav-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav-links a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: var(--text-secondary);
    text-decoration: none;
    transition: all 0.2s;
  }

  .nav-links a:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .nav-links a.active {
    background: var(--accent-bg);
    color: var(--accent);
    border-right: 2px solid var(--accent);
  }

  .link-icon {
    font-size: 1.1rem;
  }

  .link-label {
    font-size: 0.9rem;
  }
</style>
```

#### components/layout/Header.svelte

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { signalStore } from '$lib/stores/signals.svelte';

  const title = $derived(() => {
    const path = $page.url.pathname;
    if (path === '/') return 'Dashboard';
    return path.slice(1).charAt(0).toUpperCase() + path.slice(2);
  });
</script>

<header class="header">
  <h1>{title()}</h1>

  <div class="status-bar">
    <div class="connection" class:connected={signalStore.connected}>
      <span class="dot"></span>
      <span class="label">
        {signalStore.connected ? 'Live' : 'Disconnected'}
      </span>
    </div>
  </div>
</header>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .status-bar {
    display: flex;
    gap: 1rem;
  }

  .connection {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    background: var(--bg-secondary);
    font-size: 0.75rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--error);
  }

  .connection.connected .dot {
    background: var(--success);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
```

#### routes/+layout.svelte

```svelte
<script lang="ts">
  import '../app.css';
  import Shell from '$lib/components/layout/Shell.svelte';

  interface Props {
    children: any;
  }

  let { children }: Props = $props();
</script>

<Shell>
  {@render children()}
</Shell>
```

#### routes/signals/+page.svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import SignalStream from '$lib/components/signals/SignalStream.svelte';
  import SignalFilter from '$lib/components/signals/SignalFilter.svelte';
  import { signalStore } from '$lib/stores/signals.svelte';

  onMount(() => {
    signalStore.connect();
    return () => signalStore.disconnect();
  });
</script>

<div class="signals-page">
  <div class="controls">
    <SignalFilter />
    <span class="count">{signalStore.signals.length} signals</span>
  </div>

  <div class="stream-container">
    <SignalStream />
  </div>
</div>

<style>
  .signals-page {
    padding: 1.5rem;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .count {
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }

  .stream-container {
    flex: 1;
    background: var(--bg-glass);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 1rem;
    overflow: hidden;
  }
</style>
```

#### routes/voice/+page.svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import GenderSelector from '$lib/components/voice/GenderSelector.svelte';
  import ProfileList from '$lib/components/voice/ProfileList.svelte';
  import SampleUploader from '$lib/components/voice/SampleUploader.svelte';
  import SampleList from '$lib/components/voice/SampleList.svelte';
  import VoiceTester from '$lib/components/voice/VoiceTester.svelte';
  import { voiceStore } from '$lib/stores/voice.svelte';

  let profileName = $state('');

  onMount(() => {
    voiceStore.loadAll();
  });

  async function handleGenerate() {
    if (!profileName.trim()) return;
    await voiceStore.generateProfile(profileName);
    profileName = '';
  }
</script>

<div class="voice-page">
  <div class="grid">
    <section class="panel profiles">
      <h2>Voice Profiles</h2>
      <ProfileList />
    </section>

    <section class="panel create">
      <h2>Create Profile</h2>

      <div class="form">
        <div class="field">
          <label for="name">Profile Name</label>
          <input
            id="name"
            type="text"
            bind:value={profileName}
            placeholder="e.g., Assistant Voice"
          />
        </div>

        <GenderSelector />

        <div class="field">
          <label>Selected Samples ({voiceStore.selectedSamples.length})</label>
          <SampleList selectable />
        </div>

        <button
          class="generate-btn"
          disabled={!profileName.trim() || voiceStore.selectedSamples.length === 0 || voiceStore.loading}
          onclick={handleGenerate}
        >
          {voiceStore.loading ? 'Generating...' : 'Generate Profile'}
        </button>
      </div>
    </section>

    <section class="panel samples">
      <h2>Voice Samples</h2>
      <SampleUploader />
      <SampleList />
    </section>

    <section class="panel tester">
      <h2>Test TTS</h2>
      <VoiceTester />
    </section>
  </div>

  {#if voiceStore.error}
    <div class="error">{voiceStore.error}</div>
  {/if}
</div>

<style>
  .voice-page {
    padding: 1.5rem;
    height: 100%;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 1rem;
    height: calc(100vh - 120px);
  }

  .panel {
    background: var(--bg-glass);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 1rem;
    overflow: auto;
  }

  .panel h2 {
    font-size: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .field label {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .field input {
    padding: 0.5rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary);
  }

  .generate-btn {
    padding: 0.75rem;
    background: var(--accent);
    border: none;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .generate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    padding: 1rem;
    background: var(--error);
    color: white;
    border-radius: 8px;
  }
</style>
```

---

## Blocked Until

- [ ] This plan reviewed and approved
- [ ] All completion criteria understood
- [ ] No more "stub mode" or "coming soon" allowed
