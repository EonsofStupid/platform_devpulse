# Sprint 2: Desktop Chat App

## Philosophy

- **Desktop** = Vibe coder friendly. Simple. Clean. Just works.
- **Lab** = Technical inner workings. Diagnostics. Developer details.
- **Dogfood first** = Many wins are non-AI. App must be useful NOW.
- This is middleware for vibe coders - hide complexity, expose power.

---

## Crate Hierarchy

```
alpha/
├── engine/           ← Hub: coordinates all crates (FIRST PRIORITY)
├── desktop/          ← UI for users
├── shared/           ← Types, contracts
├── orchestrator/     ← Sensitive IP (CAG, experts, infra)
└── lab/              ← Internal monitoring
```

**Rule**: Desktop calls engine. Engine calls orchestrator. Desktop never touches orchestrator directly.

---

## Engine Current State

```
engine/src/
├── lib.rs              # "OS Layer (Dumb Sensors)"
└── platform/
    ├── mod.rs
    ├── process.rs      # ProcessSensor
    └── window.rs       # WindowSensor
```

Engine currently only has platform sensors. **This sprint expands it to be the coordinator hub.**

---

## Module 0: Engine Facade (FIRST PRIORITY)

### Why First?

1. Non-AI wins matter - project management, session tracking work without models
2. Dogfood the app NOW - use it while AI features layer in
3. Clean architecture from day one - no refactoring later
4. Graceful degradation - if orchestrator fails, engine returns stubs

### Phase 0: Boundary

| Item | Value |
|------|-------|
| Crate | `engine/` |
| New modules | `facade/`, `registry/` |
| Depends on | `orchestrator`, `shared` |
| Consumers | `desktop/src-tauri/` |

### Target Structure

```
engine/src/
├── lib.rs              # Engine - the hub
├── error.rs            # EngineError enum
├── platform/           # Existing: OS sensors
│   ├── mod.rs
│   ├── process.rs
│   └── window.rs
├── facade/             # NEW: Clean API for consumers
│   ├── mod.rs
│   ├── chat.rs         # ChatFacade
│   ├── adapters.rs    # AdapterFacade
│   └── voice.rs        # VoiceFacade
└── registry/           # NEW: Non-AI wins!
    ├── mod.rs
    ├── projects.rs     # Project CRUD
    └── sessions.rs     # Session management
```

### Phase 1: Contract

```rust
// engine/src/lib.rs

/// The hub - single entry point for all consumers
pub struct Engine {
    pub chat: ChatFacade,
    pub adapters: AdapterFacade,
    pub voice: VoiceFacade,
    pub projects: ProjectRegistry,   // Non-AI win!
    pub sessions: SessionRegistry,   // Non-AI win!
}

impl Engine {
    pub async fn init() -> Result<Self, EngineError>;
    pub fn is_ai_ready(&self) -> bool;  // False = stub mode, still works!
}
```

```rust
// engine/src/facade/chat.rs

pub struct ChatFacade { ... }

impl ChatFacade {
    /// Send a message. Returns stub if AI not ready.
    pub async fn send(&self, message: &str) -> Result<ChatResponse, EngineError>;

    /// Get history for session
    pub async fn history(&self, session: &str) -> Result<Vec<Message>, EngineError>;

    /// Is the AI pipeline ready?
    pub fn is_ready(&self) -> bool;
}
```

```rust
// engine/src/facade/adapters.rs

pub struct AdapterFacade { ... }

impl AdapterFacade {
    pub fn list(&self) -> Vec<AdapterInfo>;
    pub fn active(&self) -> &str;
    pub fn set_active(&mut self, kind: &str) -> Result<(), EngineError>;
}
```

```rust
// engine/src/registry/projects.rs

pub struct ProjectRegistry { ... }

impl ProjectRegistry {
    pub fn list(&self) -> Vec<Project>;
    pub fn add(&mut self, path: &str) -> Result<Project, EngineError>;
    pub fn remove(&mut self, id: &str) -> Result<(), EngineError>;
    pub fn get(&self, id: &str) -> Option<&Project>;
}
```

```rust
// engine/src/error.rs

#[derive(Debug, thiserror::Error)]
pub enum EngineError {
    #[error("AI not ready: {0}")]
    AiNotReady(String),

    #[error("Project not found: {0}")]
    ProjectNotFound(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("Orchestrator error: {0}")]
    Orchestrator(String),
}
```

### Phase 2: Observability

- `#[instrument]` on all facade methods
- ERROR: Orchestrator failures (with fallback triggered)
- WARN: Degraded mode active (AI not ready)
- INFO: Facade method calls, mode switches
- DEBUG: Internal routing decisions

### Phase 3: Tests

- [ ] `test_engine_init_without_models` - graceful degradation
- [ ] `test_chat_facade_stub_mode` - returns friendly message
- [ ] `test_project_registry_crud` - non-AI feature works
- [ ] `test_session_registry_create` - non-AI feature works
- [ ] `test_adapter_list_always_works` - even without AI

### Phase 4: Docs

- [ ] `//!` module doc explaining hub pattern
- [ ] `///` on Engine with usage example
- [ ] README in `engine/` with architecture diagram

### Phase 5: Security

- [ ] No secrets leak through facade
- [ ] Validate all inputs before passing to orchestrator
- [ ] Sanitize error messages (no internal paths)
- [ ] Project paths validated against allowed roots

---

## Module 1: Desktop Tauri Backend

### Phase 0: Boundary

| Item | Value |
|------|-------|
| Crate | `desktop/src-tauri/` |
| Entry | `lib.rs` |
| Depends on | `engine` (NOT orchestrator) |
| Exposes | Tauri commands to Svelte frontend |

### Phase 1: Contract

```rust
// Thin layer - just calls engine

#[tauri::command]
async fn chat(message: String, state: State<'_, AppState>) -> Result<ChatResult, String> {
    state.engine.chat.send(&message).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    Ok(state.engine.projects.list())
}

// etc.
```

```rust
// AppState now holds Engine
pub struct AppState {
    pub engine: Engine,
}
```

### Phase 2: Observability

- `#[instrument(skip(state))]` on all commands
- ERROR: Command failures
- WARN: Slow responses (>3s)
- INFO: Command invocations
- DEBUG: Payload sizes

### Phase 3: Tests

- [ ] `test_chat_returns_result`
- [ ] `test_projects_list_empty`
- [ ] `test_adapters_list_serializes`

### Phase 4: Docs

- [ ] `//!` module doc listing all commands
- [ ] `///` on each command

### Phase 5: Security

- [ ] No API keys cross to frontend
- [ ] All paths validated by engine
- [ ] Sanitize all error messages

---

## Module 2: Desktop Svelte Frontend

### Phase 0: Boundary

| Item | Value |
|------|-------|
| Location | `desktop/src/` |
| Framework | SvelteKit + Svelte 5 runes |
| Styling | CSS variables + glass from lab reference |

### Target Structure

```
desktop/src/
├── app.css                     # Global CSS variables
├── app.html                    # Shell
├── lib/
│   ├── api/                    # Tauri command wrappers
│   │   ├── index.ts            # Re-exports
│   │   ├── chat.ts             # chat(), getHistory()
│   │   ├── projects.ts         # listProjects(), addProject()
│   │   ├── adapters.ts        # getAdapters(), setAdapter()
│   │   └── voice.ts            # transcribe(), speak()
│   │
│   ├── stores/                 # Svelte 5 runes state
│   │   ├── chat.svelte.ts      # messages, loading, session
│   │   ├── projects.svelte.ts  # projects list, selected
│   │   └── adapters.svelte.ts # available, active
│   │
│   ├── components/             # Reusable UI atoms (dumb)
│   │   ├── Shell.svelte        # App chrome
│   │   ├── Sidebar.svelte      # Navigation
│   │   └── StatusBar.svelte    # Connection status
│   │
│   └── features/               # Smart feature modules
│       ├── chat/
│       │   ├── ChatView.svelte
│       │   ├── MessageList.svelte
│       │   ├── MessageBubble.svelte
│       │   ├── ChatInput.svelte
│       │   └── ContextPanel.svelte
│       └── projects/
│           ├── ProjectList.svelte
│           └── ProjectCard.svelte
│
└── routes/
    ├── +layout.svelte          # Shell wrapper
    ├── +page.svelte            # Dashboard
    ├── chat/+page.svelte       # Chat app
    ├── projects/+page.svelte   # Project management
    └── settings/+page.svelte   # Settings
```

### Separation of Concerns

| Layer | Purpose | Example |
|-------|---------|---------|
| `api/` | Tauri bridge only | `invoke('chat', { message })` |
| `stores/` | Reactive state | `chatState.messages` |
| `components/` | Dumb UI atoms | `<Sidebar>`, `<StatusBar>` |
| `features/` | Smart feature modules | `<ChatView>` owns chat logic |
| `routes/` | Page entry points | Compose features |

### Phase 1-5: Same as before (see previous section)

---

## UI Philosophy

### Desktop (Vibe Coder Friendly)

```
┌─────────────────────────────────────────────────────────┐
│ DevPulse                              [Adapter ▼] [⚙]  │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  ○ Home  │     Simple. Clean. Just works.               │
│  ● Chat  │                                              │
│  ○ Proj  │     - No technical jargon                    │
│  ○ Set   │     - Works even without AI ready            │
│          │     - Z key for curious users                │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│ ● Connected  [AI: Ready | Stub Mode]                    │
└─────────────────────────────────────────────────────────┘
```

- **Show**: Message, typing, done
- **Hide**: Tokens, latency, scores
- **On demand**: Z key context panel

### Lab (Technical Details)

- Rumination tree
- Adapter diagnostics
- Embedding scores
- Token graphs
- Model status

---

## Decisions (Locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Streaming | Toggle: complete (active) / stream (background) |
| 2 | Context Panel | Z key toggle, hidden by default |
| 3 | Adapter UI | Settings + simple header selector |
| 4 | Voice | Mic button, TTS responses |
| 5 | Thought Tree | Stub → "Coming soon" |

---

## Implementation Order

### Phase A: Engine Hub (enables dogfooding)

1. Create `engine/src/error.rs` - EngineError enum
2. Create `engine/src/facade/mod.rs` - facade module
3. Create `engine/src/facade/chat.rs` - ChatFacade with stub mode
4. Create `engine/src/registry/mod.rs` - registry module
5. Create `engine/src/registry/projects.rs` - ProjectRegistry (non-AI win!)
6. Update `engine/src/lib.rs` - Engine hub
7. Update `engine/Cargo.toml` - add orchestrator dep

### Phase B: Desktop Backend

8. Update `desktop/src-tauri/Cargo.toml` - engine dep (remove orchestrator)
9. Update `desktop/src-tauri/src/lib.rs` - use Engine

### Phase C: Desktop Frontend

10. Create `lib/api/` folder structure
11. Create `lib/stores/` with Svelte 5 runes
12. Create `lib/components/` - Shell, Sidebar, StatusBar
13. Create `lib/features/chat/` - ChatView, MessageList, etc.
14. Wire routes to features
15. Add voice stub (mic button)
16. Add context panel (Z toggle)
17. Add adapter selector

---

## Non-AI Wins (Dogfood Value)

These work even without models loaded:

| Feature | Value |
|---------|-------|
| Project Registry | Track codebases, switch between them |
| Session Management | Resume conversations |
| Settings | Configure adapters, paths |
| UI Shell | Navigate, feel the app |

**This is why engine comes first.**

---

## Blocked Until

- [x] Questions 1-5 answered
- [x] ARCHITECTURE.md created
- [x] Engine expansion designed
- [ ] Disk space confirmed
