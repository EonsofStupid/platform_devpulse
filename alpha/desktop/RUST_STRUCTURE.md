# Rust Crate Structure & Svelte Alignment

## Crate Dependency Chain

```
desktop/src-tauri  →  engine  →  orchestrator  →  shared
       ↓                ↓              ↓             ↓
   Tauri app       Public API    Proprietary IP   SSOT types
```

**RULE:** Desktop ONLY imports `engine`. Engine wraps orchestrator. Shared is SSOT.

---

## shared/ (SSOT Types)

```
shared/src/
├── lib.rs
├── config/
│   ├── mod.rs
│   ├── env.rs          # Environment config
│   ├── paths.rs        # XDG paths (data_dir, cache_dir, etc.)
│   └── persona.rs      # Persona config
├── types/
│   ├── mod.rs          # Re-exports all types
│   ├── adapter.rs      # AdapterKind, WebAdapter, AdapterInfo
│   ├── analytics.rs    # AnalyticsSummary, InferenceStats, HopStats
│   ├── capture.rs      # Screen capture types
│   ├── core.rs         # Core types
│   ├── gamification.rs # Gamification types
│   ├── github.rs       # GitHub types
│   ├── header.rs       # SignalHeader
│   ├── ids.rs          # SessionId, HopId, ProjectId, etc.
│   ├── ld.rs           # Learning/data types
│   ├── models.rs       # Model metadata types
│   ├── profile.rs      # User profile types
│   ├── project.rs      # Project types
│   ├── signal.rs       # SignalKind (user-facing)
│   ├── sink.rs         # SinkKind (Broadcast, Cache, Durable, etc.)
│   └── umbrella.rs     # Umbrella types
└── vault/
    └── mod.rs          # SecureVault for API keys
```

---

## engine/ (Public Facade)

```
engine/src/
├── lib.rs              # Engine struct, init, config
├── error.rs            # EngineError
├── system_status.rs    # SystemStatus, ComponentStatus, LoadState
│
├── facade/             # PUBLIC API - what desktop calls
│   ├── mod.rs          # Re-exports all facades
│   ├── chat.rs         # ChatFacade - send messages
│   ├── diagnostics.rs  # DiagnosticFacade - health checks
│   ├── discovery.rs    # DiscoveryFacade - scan for models
│   ├── github.rs       # GitHubFacade - repo operations
│   ├── models.rs       # ModelFacade - model management
│   ├── persona.rs      # PersonaFacade - persona CRUD
│   ├── adapters.rs    # AdapterFacade - switch adapters
│   ├── reasoning.rs    # ReasoningFacade - rumination control
│   ├── voice.rs        # VoiceFacade - STT/TTS
│   └── voice_discovery.rs # Voice model discovery
│
├── types/              # Public-safe types (no orchestrator leaks)
│   ├── mod.rs          # exports ConfigEntry, DiscoveredModel, ModelInfo
│   ├── config.rs       # ConfigEntry
│   └── model.rs        # DiscoveredModel, ModelInfo (wraps orchestrator)
│
├── signals/            # Signal system (UI updates)
│   ├── mod.rs          # Re-exports
│   ├── router.rs       # SignalRouter - broadcast to subscribers
│   ├── processor.rs    # SignalProcessor - routes to sinks
│   ├── signal.rs       # Signal struct, SignalHeader, SignalSource
│   ├── variants.rs     # SignalVariant enum
│   ├── payloads.rs     # ChatPayload, InferencePayload, RuminationPayload, etc.
│   ├── kinds.rs        # SinkKind re-export
│   └── sinks/          # Sink implementations
│       ├── mod.rs
│       ├── analytics.rs  # DuckDB sink
│       ├── cache.rs      # Moka cache sink
│       ├── durable.rs    # libSQL sink
│       ├── parking.rs    # Fjall LSM sink
│       └── vector.rs     # RRO vector sink
│
├── registry/           # Non-AI persistent data
│   ├── mod.rs
│   ├── projects.rs     # ProjectRegistry (libSQL)
│   └── sessions.rs     # SessionRegistry (libSQL)
│
├── platform/           # OS integration
│   ├── mod.rs
│   ├── process.rs      # ProcessSensor
│   └── window.rs       # WindowSensor
│
├── indexer/            # Project file indexing
│   └── mod.rs          # ProjectIndexer
│
├── voice/              # Voice subsystem
│   ├── mod.rs
│   └── lab.rs          # Voice lab utilities
│
└── dev/                # DEV-ONLY (feature-gated)
    └── mod.rs          # Re-exports orchestrator internals
```

---

## orchestrator/ (Proprietary IP - NEVER exposed to desktop)

```
orchestrator/src/
├── lib.rs
│
├── adapters/           # Inference/storage backends
│   ├── mod.rs          # InferenceAdapter, StorageAdapter, EmbeddingAdapter traits
│   ├── local/
│   │   ├── mod.rs
│   │   └── candle.rs   # Candle inference
│   ├── web/
│   │   ├── mod.rs
│   │   ├── anthropic.rs
│   │   ├── openai.rs
│   │   └── ollama.rs
│   └── memory/
│       ├── mod.rs
│       └── moka.rs     # Hot cache
│
├── cortex/             # AI reasoning core
│   ├── mod.rs
│   ├── cag.rs          # Context Assembly Graph
│   ├── costar.rs       # COSTAR prompt structure
│   ├── router.rs       # Cortex router
│   └── rumination.rs   # Multi-hop execution
│
├── frames/             # Ephemeral personas
│   ├── mod.rs
│   └── catalog/
│       └── mod.rs
│
├── chat/               # Chat orchestration
│   └── mod.rs
│
├── github/             # GitHub integration
│   ├── mod.rs
│   ├── client.rs
│   └── validator.rs
│
├── runtime/            # Runtime management
│   ├── mod.rs
│   ├── runtime.rs
│   └── experiments.rs
│
├── sub_agents/         # Sub-agent system
│   ├── mod.rs
│   └── guardian/
│       └── mod.rs
│
├── types/              # Internal types (NEVER exposed)
│   ├── mod.rs
│   ├── expert.rs       # Expert types
│   ├── infra_signal.rs # InfraSignal (high-frequency internal)
│   └── toon.rs         # Toon (persona) types
│
└── infra/              # Infrastructure
    ├── mod.rs
    ├── download.rs     # Model downloading
    │
    ├── audio/
    │   ├── mod.rs
    │   └── voice/
    │       ├── mod.rs
    │       ├── voice.rs
    │       └── voice_discovery.rs
    │
    ├── capture/
    │   ├── mod.rs
    │   ├── pipeline.rs
    │   └── experiment.rs
    │
    ├── catalog/
    │   ├── mod.rs
    │   ├── discovery.rs
    │   ├── models.rs     # ModelRegistry
    │   └── adapters.rs  # AdapterKind, internal ModelInfo
    │
    ├── core/
    │   ├── mod.rs
    │   ├── config.rs
    │   ├── registry.rs
    │   ├── scope.rs
    │   └── services/
    │       ├── mod.rs
    │       ├── descriptors.rs
    │       ├── loaders.rs
    │       └── traits.rs
    │
    ├── embedding/
    │   ├── mod.rs
    │   ├── embedder.rs   # EmbedderBackend
    │   └── reranker.rs   # RerankerBackend
    │
    ├── llm/
    │   ├── mod.rs
    │   ├── grammars/
    │   │   └── mod.rs    # GBNF grammars
    │   ├── llmestimator.rs
    │   └── adapter.rs
    │
    ├── persistence/
    │   ├── mod.rs
    │   ├── analytics.rs  # DuckDB
    │   ├── audit.rs      # Fjall LSM
    │   ├── bus.rs        # Signal bus
    │   ├── global.rs     # Global state
    │   ├── memory.rs     # HotCache (Moka)
    │   ├── project.rs    # Project persistence
    │   ├── sql.rs        # libSQL Database
    │   └── vector.rs     # RRO VectorStore
    │
    └── vision/
        ├── mod.rs
        └── vl.rs         # Vision-language
```

---

## desktop/src-tauri/ (Tauri App)

```
desktop/src-tauri/src/
├── main.rs             # Entry point
├── lib.rs              # Tauri builder, command registration
├── state.rs            # AppState (will hold Engine)
│
└── commands/           # Tauri commands (invokable from frontend)
    ├── mod.rs          # Command exports
    ├── chat.rs         # chat command
    └── dev.rs          # DEV-ONLY commands (feature-gated)
```

---

## Svelte ↔ Rust Alignment

| Svelte Layer | Rust Layer | Purpose |
|--------------|------------|---------|
| `$lib/sys/` | `engine/facade/` | System services |
| `$lib/sys/stores/` | `engine/signals/` | State/events |
| `$lib/sys/api/` | `desktop/commands/` | Tauri invoke wrappers |
| `$lib/domains/chat/` | `engine/facade/chat.rs` | Chat functionality |
| `$lib/domains/chat/stores/` | `engine/signals/payloads.rs` | Chat state |

### Command Mapping

| Svelte invoke | Tauri command | Engine facade |
|---------------|---------------|---------------|
| `invoke('chat', {...})` | `commands::chat` | `engine.chat.send()` |
| `invoke('get_adapters')` | `commands::adapters` | `engine.adapters.list()` |
| `invoke('set_adapter', {...})` | `commands::set_adapter` | `engine.adapters.set_*()` |
| `invoke('list_models')` | `commands::models` | `engine.models.list()` |
| `invoke('get_status')` | `commands::status` | `engine.status()` |

### Signal Mapping (Rust → Svelte)

| SignalVariant | Svelte store | UI update |
|---------------|--------------|-----------|
| `Chat(ChatPayload)` | `chatStore` | New message |
| `Inference(InferencePayload)` | `inferenceStore` | Token stream |
| `Diagnostic(DiagnosticPayload)` | `statusStore` | Component health |
| `Rumination(RuminationPayload)` | `thinkingStore` | Thinking indicator |
| `Voice(VoicePayload)` | `voiceStore` | STT/TTS status |

---

## Desktop Commands TODO

| Command | File | Status |
|---------|------|--------|
| `chat` | `commands/chat.rs` | EXISTS (echo only) |
| `get_status` | `commands/status.rs` | NEEDED |
| `list_adapters` | `commands/adapters.rs` | NEEDED |
| `set_adapter` | `commands/adapters.rs` | NEEDED |
| `list_models` | `commands/models.rs` | NEEDED |
| `scan_models` | `commands/discovery.rs` | NEEDED |
| `get_personas` | `commands/persona.rs` | NEEDED |
| `set_persona` | `commands/persona.rs` | NEEDED |
| `list_projects` | `commands/projects.rs` | NEEDED |
| `add_project` | `commands/projects.rs` | NEEDED |
| `list_sessions` | `commands/sessions.rs` | NEEDED |
| `create_session` | `commands/sessions.rs` | NEEDED |
| `get_chat_history` | `commands/chat.rs` | NEEDED |
| `voice_transcribe` | `commands/voice.rs` | NEEDED |
| `voice_speak` | `commands/voice.rs` | NEEDED |

---

## Feature Flags

| Feature | Crate | Purpose |
|---------|-------|---------|
| `dev-tools` | engine | Exposes orchestrator internals |
| `dev-tools` | desktop | Enables dev commands |
| `db` | orchestrator | Enables database features |

**Release build:** `cargo build --release --no-default-features`
- Strips `engine/src/dev/`
- Strips `desktop/src-tauri/src/commands/dev.rs`

---

*Last Updated: 2026-01-12*
