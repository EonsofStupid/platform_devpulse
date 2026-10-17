# DevPulse Desktop Execution Plan

**Created:** 2026-01-12
**Status:** IN PROGRESS

---

## Phase 1: Fix SSOT (Rust Crates)

### 1.1 Fix shared/src/types/adapter.rs
- [x] Rename `WebAdapter` enum → `LlmProvider`
- [x] Update field `web_adapter` → `provider`
- [ ] Update mod.rs exports

### 1.2 Fix shared/src/types/mod.rs
- [ ] Export `LlmProvider` instead of `WebAdapter`

### 1.3 Fix shared/src/lib.rs
- [ ] Update re-exports

### 1.4 Fix engine/src/facade/adapters.rs
- [ ] Replace all `WebAdapter` → `LlmProvider`
- [ ] Update `ActiveAdapter::Web(WebAdapter)` → `ActiveAdapter::Web(LlmProvider)`

### 1.5 Fix engine/src/lib.rs
- [ ] Update exports

### 1.6 Fix engine/src/types/model.rs
- [ ] Replace `WebAdapter` → `LlmProvider`

### 1.7 Fix orchestrator naming collision
- [ ] Remove `use shared::WebAdapter` (it's now `LlmProvider`)
- [ ] Keep orchestrator's `WebAdapter` TRAIT as-is
- [ ] Create missing `orchestrator/src/infra/catalog/adapters.rs`
- [ ] Fix `infer_stream` signature mismatch (`FnMut(&str)` → `FnMut(String)`)

---

## Phase 2: Desktop src-tauri Structure

### 2.1 Create directory structure
```
src-tauri/src/
├── commands/
│   ├── mod.rs
│   ├── chat/
│   │   ├── mod.rs
│   │   ├── send.rs
│   │   └── history.rs
│   ├── ai/
│   │   ├── mod.rs
│   │   ├── providers.rs
│   │   ├── models.rs
│   │   └── persona.rs
│   ├── projects/
│   │   ├── mod.rs
│   │   └── crud.rs
│   ├── sessions/
│   │   ├── mod.rs
│   │   └── crud.rs
│   ├── voice/
│   │   ├── mod.rs
│   │   ├── stt.rs
│   │   └── tts.rs
│   ├── window/
│   │   ├── mod.rs
│   │   ├── lifecycle.rs
│   │   └── interactions.rs
│   ├── system/
│   │   ├── mod.rs
│   │   └── status.rs
│   └── dev/
│       ├── mod.rs
│       └── diagnostics.rs
├── types/
│   ├── mod.rs
│   ├── chat.rs
│   ├── ai.rs
│   ├── projects.rs
│   ├── sessions.rs
│   ├── interactions.rs
│   └── system.rs
├── events/
│   ├── mod.rs
│   └── signals.rs
├── tray/
│   └── mod.rs
├── main.rs
├── lib.rs
└── state.rs
```

### 2.2 Delete bad structure
- [ ] Remove `domains/` folder (wrong pattern)
- [ ] Remove `sys/` folder (wrong pattern)
- [ ] Remove old `window/` folder
- [ ] Keep only `commands/` structure per architecture doc

---

## Phase 3: Desktop Svelte Structure

### 3.1 Create routes
```
src/routes/
├── +layout.svelte
├── +layout.ts
├── (app)/
│   ├── +layout.svelte
│   ├── +page.svelte
│   └── settings/
├── (chat)/
│   ├── +layout.svelte
│   └── +page.svelte
└── (popup)/
    ├── +layout.svelte
    └── +page.svelte
```

### 3.2 Create lib structure
```
src/lib/
├── layouts/
│   ├── app/
│   │   └── frame/
│   ├── chat/
│   │   └── frame/
│   └── shared/
│       ├── panels/
│       └── interactions/
├── domains/
│   ├── chat/
│   └── app/
├── sys/
│   ├── commands/
│   ├── events/
│   ├── stores/
│   └── theme/
└── design-system/
```

---

## Phase 4: Wire Commands to Engine

All commands call REAL engine methods. NO STUBS.

### Command → Engine Method Mapping
| Command | Engine Method |
|---------|---------------|
| `chat_send` | `engine.chat.send()` |
| `list_providers` | `engine.adapters.list()` |
| `set_provider` | `engine.adapters.set_web()` |
| `list_models` | `engine.models.list()` |
| `set_model` | `engine.models.set_active()` |
| `get_personas` | `engine.persona.list_summaries()` |
| `set_persona` | `engine.persona.set_active()` |
| `list_projects` | `engine.projects.list()` |
| `add_project` | `engine.projects.add()` |
| `list_sessions` | `engine.sessions.list()` |
| `create_session` | `engine.sessions.create()` |
| `get_status` | `engine.status()` |
| `voice_speak` | `engine.voice.speak()` |

---

## Phase 5: Verify

- [ ] `cargo check -p shared`
- [ ] `cargo check -p engine`
- [ ] `cargo check -p orchestrator`
- [ ] `cargo check -p devpulse-desktop`
- [ ] `npm run check` (Svelte)
- [ ] `cargo tauri dev` (runs app)

---

## Current Phase: 1 (Fix SSOT)

Starting with shared crate fixes.
