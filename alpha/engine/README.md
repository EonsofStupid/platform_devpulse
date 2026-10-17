# Engine: The Public Facade

> **For AI Assistants:** This document is your COSTAR. Read it completely before touching any engine code.

---

## The One-Liner

**Engine is what the user sees. Orchestrator is what engine hides.**

```
┌─────────────────────────────────────────────────────────────────┐
│                         DESKTOP                                  │
│  (SvelteKit 5 + Tauri)                                          │
│                                                                  │
│  ONLY imports: engine::*                                        │
│  SEES: Facades, Signals, Registries                             │
│  NEVER SEES: Orchestrator internals                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          ENGINE                                  │
│  (This Crate - The Facade)                                      │
│                                                                  │
│  EXPOSES: ChatFacade, ModelFacade, VoiceFacade, etc.           │
│  EMITS: Layman signals (ThinkingStarted, StreamToken)           │
│  HIDES: All orchestrator types, all ML details                  │
│  TRANSLATES: InfraSignal → SignalKind at the boundary           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR                               │
│  ⚠️  BLACK BOX - PROTECTED IP  ⚠️                                │
│                                                                  │
│  CONTAINS: RRO, CAG, Rumination, Frames, Candle ML              │
│  EMITS: InfraSignal (HopStarted, EmbedCompleted, etc.)          │
│  NEVER EXPOSED: Types, traits, internals                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## COSTAR Framework

### C - Context

Engine is the **public API layer** of DevPulse. It sits between:
- **Above:** Desktop (Tauri commands, Svelte stores)
- **Below:** Orchestrator (proprietary ML/reasoning engine)

Engine exists because:
1. **IP Protection** - Orchestrator contains 2 years of proprietary work
2. **Stability** - Desktop gets a stable API even as orchestrator evolves
3. **Translation** - Technical signals become user-friendly messages
4. **Graceful Degradation** - Non-AI features work while AI initializes

### O - Objective

Engine MUST:
- **Facade** all orchestrator capabilities through clean, simple types
- **Translate** internal signals to layman-friendly versions
- **Never leak** orchestrator types in its public API
- **Emit signals** for every meaningful state change
- **Degrade gracefully** when AI components aren't ready

Engine MUST NOT:
- Re-export orchestrator types (even aliased)
- Expose database handles or ML backends
- Block on AI initialization
- Require desktop to understand ML concepts

### S - Style

**Facade Pattern:** Every orchestrator capability gets a `*Facade` wrapper.
```rust
// CORRECT: Engine-local type
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub adapter: LlmProvider,
    pub available: bool,
}

// WRONG: Re-exported orchestrator type
pub use orchestrator::infra::catalog::adapters::ModelInfo;
```

**Signal-First:** State changes emit signals, UI subscribes.
```rust
// Every facade method that changes state:
self.router.emit(Signal::new(
    SignalSource::System,
    SignalVariant::System(SystemPayload {
        event: "model_activated".into(),
        message: format!("Switched to {}", model_id),
        data: None,
    })
));
```

**Lazy AI:** Non-AI features available immediately.
```rust
impl ChatFacade {
    pub fn is_ready(&self) -> bool {
        // AI might not be ready yet - that's OK
        self.engine.read().unwrap().is_some()
    }
}
```

### T - Tone

Think like a **hotel concierge**, not a systems engineer.

| Internal (Orchestrator) | External (Engine → Desktop) |
|------------------------|----------------------------|
| `HopStarted { hop: 3, frame_id: "architect_7f3a" }` | `ThinkingProgress { step: "Analyzing..." }` |
| `EmbedCompleted { dimension: 1024, latency_ms: 45 }` | *(silent - user doesn't care)* |
| `LlmError { error: "CUDA OOM at layer 47" }` | `Error { message: "Generation failed" }` |

The user sees **intent**, never **implementation**.

### A - Audience

**Primary Consumer:** Desktop (Tauri Rust commands)
```rust
// desktop/src-tauri/src/commands/chat.rs
use engine::{ChatFacade, ChatResponse, Message};

#[tauri::command]
pub async fn send_message(msg: String) -> Result<ChatResponse, String> {
    let engine = get_engine();
    engine.chat().send(&msg, &session_id).await
        .map_err(|e| e.to_string())
}
```

**Secondary Consumer:** Lab (dev diagnostics via feature flag)
```rust
#[cfg(feature = "dev-tools")]
use engine::dev::{InfraSignal, ChainTrace};
```

**Never a Consumer:** End users, external crates, anything outside the workspace.

### R - Response

Engine outputs:
1. **Facade methods** - Async operations returning `Result<T, EngineError>`
2. **Signals** - Broadcast events for UI subscription
3. **Registry data** - Projects, sessions, personas (non-AI, always available)

Engine guarantees:
- All public types are engine-local (no orchestrator leaks)
- All signals are layman-friendly (translated at boundary)
- All errors are user-friendly (no stack traces, no internal paths)

---

## Architecture

### Module Structure

```
engine/src/
├── lib.rs              # Public API surface
├── error.rs            # EngineError (unified, recoverable)
├── system_status.rs    # Component health tracking
│
├── facade/             # THE BOUNDARY LAYER
│   ├── mod.rs          # Barrel exports
│   ├── chat.rs         # ChatFacade (LLM interaction)
│   ├── models.rs       # ModelFacade (model management)
│   ├── voice.rs        # VoiceFacade (STT/TTS)
│   ├── adapters.rs    # AdapterFacade (LLM adapters)
│   ├── persona.rs      # PersonaFacade (system prompts)
│   ├── discovery.rs    # DiscoveryFacade (model scanning)
│   ├── reasoning.rs    # ReasoningFacade (RAG/CAG)
│   ├── github.rs       # GitHubFacade (Gus webhooks)
│   ├── diagnostics.rs  # DiagnosticEvent enum
│   └── voice_discovery.rs
│
├── signals/            # EVENT SYSTEM
│   ├── mod.rs          # Signal system entry
│   ├── signal.rs       # Signal struct + factories
│   ├── variants.rs     # SignalVariant enum (TO BE REPLACED)
│   ├── payloads.rs     # Typed payloads (TO BE REPLACED)
│   ├── kinds.rs        # SinkKind (TO MOVE TO SHARED)
│   ├── router.rs       # SignalRouter (dumb broadcaster)
│   ├── processor.rs    # SignalProcessor (sink dispatcher)
│   └── sinks/          # Storage backends
│       ├── cache.rs    # Moka (L2)
│       ├── durable.rs  # libSQL (L4)
│       ├── parking.rs  # Fjall (L3)
│       ├── analytics.rs# DuckDB (L5)
│       └── vector.rs   # RRO (L3)
│
├── registry/           # NON-AI STATE (always available)
│   ├── projects.rs     # ProjectRegistry
│   └── sessions.rs     # SessionRegistry
│
├── indexer/            # Project file scanning
│   └── mod.rs
│
├── platform/           # OS integration
│   ├── process.rs      # Process monitoring
│   └── window.rs       # Window tracking
│
└── voice/              # Voice pipeline
    ├── mod.rs
    └── lab.rs          # Lab voice features
```

### Facade Responsibilities

| Facade | Wraps | Key Methods |
|--------|-------|-------------|
| `ChatFacade` | `orchestrator::ChatEngine` | `send()`, `history()`, `clear()` |
| `ModelFacade` | `ModelRegistry`, `VLBackend` | `list_all()`, `set_active()`, `load_vl_model()` |
| `VoiceFacade` | `VoiceBackend` | `transcribe()`, `speak()`, `is_ready()` |
| `AdapterFacade` | Adapter state | `list()`, `active()`, `set_active()` |
| `PersonaFacade` | `Database` personas | `get_active()`, `create()`, `set_active()` |
| `DiscoveryFacade` | `AdapterManager` | `scan_directory()`, `refresh_models()` |
| `ReasoningFacade` | `CAG`, `Embedder`, `RRO` | `search()`, `assemble_context()` |
| `GitHubFacade` | `Gus` validator | `handle_push_webhook()` |

### Signal Flow

```
USER ACTION (click send)
    │
    ▼
┌─────────────┐
│   DESKTOP   │  Tauri command
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ENGINE    │  ChatFacade.send()
│             │
│  ┌────────┐ │
│  │Orchestr│◄┼── Calls ChatEngine internally
│  │  ator  │ │
│  └───┬────┘ │
│      │      │
│      ▼      │
│  Signal::new(Chat, Response)
│      │      │
└──────┼──────┘
       │
       ▼ SignalRouter.emit()
┌─────────────┐
│ SIGNAL BUS  │  tokio::broadcast
└──────┬──────┘
       │
       ├────────────────┬────────────────┬─────────────┐
       ▼                ▼                ▼             ▼
┌──────────┐     ┌──────────┐     ┌──────────┐  ┌──────────┐
│ Desktop  │     │  Cache   │     │ Durable  │  │Analytics │
│(subscribe)│    │ (moka)   │     │ (libSQL) │  │ (DuckDB) │
└──────────┘     └──────────┘     └──────────┘  └──────────┘
     │
     ▼
  UI UPDATE (Svelte store)
```

---

## Current State (Problems to Fix)

### Orchestrator Leaks in lib.rs

```rust
// THESE MUST BE REMOVED IN SPRINT 0
pub use orchestrator::infra::catalog::adapters::{
    ModelInfo as DiscoveredModelInfo,      // LEAK
    AdapterConfig,                         // LEAK
    AdapterKind as DiscoveryAdapterKind  // LEAK
};
pub use orchestrator::infra::persistence::sql::ConfigEntry;  // LEAK
```

**Fix:** Create engine-local types in `engine/src/types/`.

### Dual Signal Systems

```rust
// ENGINE has its own SignalVariant (WRONG)
pub enum SignalVariant { Chat, Analytics, Context, ... }

// SHARED has SignalKind (CORRECT - SSOT)
pub enum SignalKind { UserMessage, GitHubPushReceived, ... }
```

**Fix:** Delete `SignalVariant`, use `shared::SignalKind` everywhere.

### Missing Signal Translation

Currently, engine emits detailed signals directly. Should translate:

```rust
// BEFORE (leaks internals)
SignalVariant::Inference(InferencePayload {
    model_id: "qwen2.5-7b-instruct".into(),
    tokens_in: 1247,
    tokens_out: 89,
    latency_ms: 2340,
})

// AFTER (layman-friendly)
SignalKind::GeneratingComplete {}  // User just sees "done"
```

---

## For AI Assistants

### Persona

You are a **senior Rust engineer** working on engine. You understand:

1. **The Boundary** - Engine is public, orchestrator is private
2. **Signal-First** - Every state change emits a signal
3. **Graceful Degradation** - Non-AI features work while AI loads
4. **Layman Translation** - Technical → user-friendly at the boundary

### Instructions

When working on engine code:

1. **Never import orchestrator types in public API**
   ```rust
   // WRONG
   pub use orchestrator::SomeType;

   // RIGHT
   pub struct SomeType { /* engine-local definition */ }
   ```

2. **Always emit signals for state changes**
   ```rust
   // After any mutation
   self.router.emit(Signal::new(source, variant));
   ```

3. **Translate errors to user-friendly messages**
   ```rust
   // WRONG
   Err(EngineError::Orchestrator(e)) // Leaks internal error

   // RIGHT
   Err(EngineError::Chat("Generation failed".into()))
   ```

4. **Check readiness before AI operations**
   ```rust
   if !self.is_ready() {
       return Err(EngineError::NotReady("Chat engine initializing"));
   }
   ```

### Ideal Audit Prompt

To generate a comprehensive engine audit, use:

```
Thoroughly audit the engine crate at [path].

I need:
1. Complete file tree structure
2. All public exports from lib.rs
3. All facade modules and what they expose
4. All signal-related code
5. Any types that leak orchestrator (these are problems to fix)
6. How engine currently interacts with orchestrator
7. Current Cargo.toml dependencies

Be exhaustive - read every file in engine/src/.
```

### Key Terms (Reasoning System)

| Term | Definition | When to Use |
|------|------------|-------------|
| **Facade** | Public wrapper hiding implementation | When exposing orchestrator capability |
| **Signal** | Event emitted on state change | When mutating state |
| **Layman** | User-friendly, non-technical | When data leaves engine |
| **Leak** | Orchestrator type in public API | When auditing boundaries |
| **Sink** | Storage destination for signals | When routing events |
| **Ready** | AI component initialized | When checking availability |
| **Graceful** | Works without AI | When designing fallbacks |
| **SSOT** | Single Source of Truth | When defining types |
| **Boundary** | Engine ↔ Orchestrator interface | When protecting IP |
| **Translation** | Internal → External signal mapping | When emitting to UI |

### Decision Tree

```
Is this type from orchestrator?
├─ YES → Does desktop need it?
│        ├─ YES → Create engine-local version
│        └─ NO  → Keep internal, don't export
└─ NO  → Is it in shared?
         ├─ YES → Import from shared
         └─ NO  → Define in engine
```

```
Should this emit a signal?
├─ Does it change state? → YES, emit signal
├─ Is it a query? → NO signal needed
├─ Did an error occur? → YES, emit diagnostic signal
└─ Is AI doing work? → YES, emit progress signal
```

```
What signal should I emit?
├─ Is this for the user? → Use SignalKind (layman)
├─ Is this for analytics? → Route to Analytics sink only
├─ Is this internal debug? → Use #[cfg(feature = "dev-tools")]
└─ Is this for Lab? → Emit both layman (UI) + detailed (Lab panel)
```

---

## File Reference

### Must Read First
- `src/lib.rs` - Public API surface, see what's exported
- `src/facade/mod.rs` - All facades barrel-exported here
- `src/signals/router.rs` - How signals are broadcast
- `src/error.rs` - Error handling patterns

### Facade Deep Dives
- `src/facade/chat.rs` - Most complex, lazy AI init pattern
- `src/facade/models.rs` - VL loading with guardrails
- `src/facade/voice.rs` - Graceful degradation example

### Signal System
- `src/signals/signal.rs` - Signal struct, causality chains
- `src/signals/processor.rs` - Sink routing logic
- `src/signals/sinks/*.rs` - Each storage backend

### To Be Refactored (Sprint 0)
- `src/signals/variants.rs` - DELETE, use shared::SignalKind
- `src/signals/payloads.rs` - DELETE, payloads in SignalKind
- `src/signals/kinds.rs` - MOVE SinkKind to shared

---

## Verification Commands

```bash
# Must return NOTHING (no orchestrator leaks)
grep -r "pub use orchestrator::" src/

# Should only show internal uses (facade implementations)
grep -r "use orchestrator::" src/

# Check public API doesn't mention orchestrator
cargo doc --no-deps 2>&1 | grep -i orchestrator

# All checks pass
cargo check
cargo test
cargo clippy
```

---

*This document is the authoritative guide for engine development.*
*Last updated: 2026-01-12*
