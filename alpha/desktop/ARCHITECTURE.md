# DevPulse Desktop Architecture

> **For AI Assistants:** This document is the SSOT for desktop architecture. Read this FIRST when resuming work on the desktop crate.

## Overview

DevPulse Desktop is a Tauri v2 + SvelteKit 5 application with two persistent windows (Chat, App) and ephemeral AI-driven interaction popups.

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTEM TRAY                               │
│                      ┌───────────┐                              │
│                      │   Chat    │                              │
│                      │  DevPulse │                              │
│                      │   Quit    │                              │
│                      └───────────┘                              │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐         ┌──────────────────────────────┐
│    CHAT WINDOW       │         │       APP WINDOW             │
│    (Primary)         │   IPC   │       (DevPulse)             │
│                      │◄───────►│                              │
│  Maestro AI lives    │         │  Dashboard, Projects,        │
│  here. Controls      │         │  ThinkSpace, DevSpace        │
│  interactions.       │         │                              │
└──────────────────────┘         └──────────────────────────────┘
              │
              │ spawns/controls
              ▼
┌──────────────────────┐
│  INTERACTION POPUPS  │  ← Ephemeral Tauri WebviewWindows
│  (AI-controlled)     │    Frameless, glass, always-on-top
│                      │    Chain, merge, close on answer
│  - T/F, Y/N buttons  │
│  - Multiple choice   │
│  - Fill-in-blank     │
│  - Custom components │
└──────────────────────┘
```

## Directory Structure

### Tauri (Rust) - `src-tauri/`

```
src-tauri/
├── src/
│   ├── main.rs                 # Entry point
│   ├── lib.rs                  # Tauri builder, command registration
│   ├── state.rs                # AppState (Engine handle)
│   │
│   ├── commands/               # Tauri commands (MIRRORS Svelte domains)
│   │   ├── mod.rs              # Re-exports all command modules
│   │   │
│   │   ├── chat/               # Chat domain commands
│   │   │   ├── mod.rs
│   │   │   ├── send.rs         # chat_send
│   │   │   ├── history.rs      # chat_history, chat_clear
│   │   │   └── stream.rs       # chat_stream (future)
│   │   │
│   │   ├── ai/                 # AI configuration commands
│   │   │   ├── mod.rs
│   │   │   ├── adapters.rs    # list_adapters, set_adapter
│   │   │   ├── models.rs       # list_models, set_model
│   │   │   ├── discovery.rs    # scan_models, scan_ollama
│   │   │   └── persona.rs      # get_personas, set_persona, create_persona
│   │   │
│   │   ├── projects/           # Project management commands
│   │   │   ├── mod.rs
│   │   │   ├── crud.rs         # list, add, remove, set_active
│   │   │   └── index.rs        # index_project (future)
│   │   │
│   │   ├── sessions/           # Session management commands
│   │   │   ├── mod.rs
│   │   │   └── crud.rs         # list, create, get, delete
│   │   │
│   │   ├── voice/              # Voice commands
│   │   │   ├── mod.rs
│   │   │   ├── stt.rs          # voice_transcribe
│   │   │   └── tts.rs          # voice_speak, voice_stop
│   │   │
│   │   ├── window/             # Window management commands
│   │   │   ├── mod.rs
│   │   │   ├── lifecycle.rs    # open_chat, open_app, close, focus
│   │   │   └── interactions.rs # spawn_interaction, close_interaction
│   │   │
│   │   ├── system/             # System status commands
│   │   │   ├── mod.rs
│   │   │   └── status.rs       # get_status, health_check
│   │   │
│   │   └── dev/                # Dev-only commands (feature-gated)
│   │       ├── mod.rs
│   │       └── diagnostics.rs  # dev_* commands
│   │
│   ├── types/                  # Shared types for Tauri ↔ Svelte
│   │   ├── mod.rs
│   │   ├── chat.rs             # ChatMessage, ChatResponse
│   │   ├── ai.rs               # AdapterInfo, ModelInfo, PersonaInfo
│   │   ├── projects.rs         # ProjectInfo
│   │   ├── sessions.rs         # SessionInfo
│   │   ├── interactions.rs     # InteractionSchema, InteractionResponse
│   │   └── system.rs           # SystemStatus, ComponentStatus
│   │
│   ├── events/                 # Tauri event definitions
│   │   ├── mod.rs
│   │   └── signals.rs          # Engine signal → Tauri event bridge
│   │
│   └── tray/                   # System tray setup
│       └── mod.rs
│
├── capabilities/               # Tauri v2 capabilities
│   ├── main.json               # Main window capabilities
│   ├── chat.json               # Chat window capabilities
│   └── interaction.json        # Interaction popup capabilities
│
├── Cargo.toml
├── tauri.conf.json
└── README.md                   # AI-friendly documentation
```

### Svelte - `src/`

```
src/
├── routes/                     # SvelteKit routes
│   ├── +layout.svelte          # Root layout (detects window type)
│   ├── +layout.ts              # SSR disabled
│   │
│   ├── (app)/                  # App window routes
│   │   ├── +layout.svelte      # AppFrame wrapper
│   │   ├── +page.svelte        # Dashboard
│   │   ├── thinkspace/
│   │   ├── devspace/
│   │   └── settings/
│   │
│   ├── (chat)/                 # Chat window routes
│   │   ├── +layout.svelte      # ChatFrame wrapper
│   │   └── +page.svelte        # Chat interface
│   │
│   └── (popup)/                # Interaction popup routes
│       ├── +layout.svelte      # Minimal frame
│       └── +page.svelte        # InteractionRenderer
│
├── lib/
│   ├── layouts/                # DUMB layout components (no logic)
│   │   ├── app/
│   │   │   ├── frame/
│   │   │   │   ├── AppFrame.svelte
│   │   │   │   ├── topbar/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── main/
│   │   │   │   └── statusbar/
│   │   │   └── index.ts
│   │   │
│   │   ├── chat/
│   │   │   ├── frame/
│   │   │   │   ├── ChatFrame.svelte
│   │   │   │   ├── tabbar/
│   │   │   │   ├── topbar/
│   │   │   │   ├── messagelist/
│   │   │   │   ├── messageinput/
│   │   │   │   ├── circlemenus/
│   │   │   │   └── bottombar/
│   │   │   └── index.ts
│   │   │
│   │   └── shared/
│   │       ├── tooltips/
│   │       ├── indicators/
│   │       ├── toasts/
│   │       ├── panels/         # Dockable panels system
│   │       │   ├── PanelManager.svelte
│   │       │   ├── PanelSlot.svelte
│   │       │   ├── Panel.svelte
│   │       │   └── types.ts
│   │       │
│   │       └── interactions/   # AI-callable interaction components
│   │           ├── InteractionCard.svelte
│   │           ├── InteractionButtons.svelte
│   │           ├── InteractionChoice.svelte
│   │           ├── InteractionInput.svelte
│   │           ├── InteractionActions.svelte
│   │           ├── InteractionRenderer.svelte
│   │           ├── interactions.css
│   │           └── types.ts
│   │
│   ├── domains/                # SMART domain components (business logic)
│   │   ├── chat/
│   │   │   ├── stores/
│   │   │   │   └── chat.svelte.ts
│   │   │   ├── messages/
│   │   │   ├── input/
│   │   │   ├── features/
│   │   │   └── index.ts
│   │   │
│   │   ├── app/
│   │   │   ├── thinkspace/
│   │   │   ├── devspace/
│   │   │   └── index.ts
│   │   │
│   │   └── shared/
│   │       ├── user/
│   │       └── auth/
│   │
│   ├── sys/                    # System-level utilities
│   │   ├── commands/           # Tauri command wrappers
│   │   │   ├── chat.ts         # chatSend(), chatHistory()
│   │   │   ├── ai.ts           # listAdapters(), setModel()
│   │   │   ├── projects.ts     # listProjects(), addProject()
│   │   │   ├── sessions.ts     # listSessions(), createSession()
│   │   │   ├── voice.ts        # transcribe(), speak()
│   │   │   ├── window.ts       # openChat(), openApp(), spawnInteraction()
│   │   │   ├── system.ts       # getStatus()
│   │   │   └── index.ts        # Re-exports all
│   │   │
│   │   ├── events/             # Tauri event listeners
│   │   │   ├── signals.ts      # Engine signal subscriptions
│   │   │   └── interactions.ts # Interaction popup events
│   │   │
│   │   ├── stores/             # Global stores
│   │   │   ├── status.svelte.ts
│   │   │   └── interactions.svelte.ts
│   │   │
│   │   ├── settings/
│   │   ├── theme/
│   │   └── toast.svelte.ts
│   │
│   └── design-system/
│       ├── tokens/
│       └── primitives/
│
├── app.css
├── app.html
└── README.md                   # AI-friendly documentation
```

## Command ↔ Domain Alignment

| Tauri Command Module | Svelte Domain | Purpose |
|---------------------|---------------|---------|
| `commands/chat/` | `domains/chat/` | Chat messaging |
| `commands/ai/` | `domains/chat/` (config) | AI adapter/model config |
| `commands/projects/` | `domains/app/` | Project management |
| `commands/sessions/` | `domains/chat/` | Session management |
| `commands/voice/` | `domains/chat/` | Voice input/output |
| `commands/window/` | `sys/commands/` | Window lifecycle |
| `commands/system/` | `sys/stores/` | System status |
| `commands/dev/` | (Lab only) | Dev diagnostics |

## Interaction Popup System

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI (in Chat window)                          │
│                            │                                     │
│                            │ decides needs structured input      │
│                            ▼                                     │
│              ┌─────────────────────────────┐                    │
│              │ InteractionSchema           │                    │
│              │ {                            │                    │
│              │   id: "task-type-1",        │                    │
│              │   type: "choice",           │                    │
│              │   question: "Task type?",   │                    │
│              │   options: [...],           │                    │
│              │   next: { ... }             │  chain definition  │
│              │ }                            │                    │
│              └─────────────────────────────┘                    │
│                            │                                     │
│                            │ invoke('spawn_interaction', schema) │
│                            ▼                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Tauri (Rust)                                 │
│                            │                                     │
│              ┌─────────────────────────────┐                    │
│              │ spawn_interaction()         │                    │
│              │                             │                    │
│              │ 1. Create WebviewWindow     │                    │
│              │    - frameless              │                    │
│              │    - transparent            │                    │
│              │    - always_on_top          │                    │
│              │    - sized to content       │                    │
│              │                             │                    │
│              │ 2. Navigate to /popup?...   │                    │
│              │                             │                    │
│              │ 3. Return popup_id          │                    │
│              └─────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 POPUP WINDOW (Tauri WebviewWindow)               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │   ┌─────────────────────────────────────────────────┐    │  │
│  │   │  🪟 GLASS INTERACTION CARD                      │    │  │
│  │   │                                                 │    │  │
│  │   │  "What type of task is this?"                  │    │  │
│  │   │                                                 │    │  │
│  │   │  ┌─────────┐ ┌─────────┐ ┌─────────┐          │    │  │
│  │   │  │ Feature │ │   Bug   │ │  Chore  │          │    │  │
│  │   │  └─────────┘ └─────────┘ └─────────┘          │    │  │
│  │   │                                                 │    │  │
│  │   └─────────────────────────────────────────────────┘    │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            │ User clicks [Feature]               │
│                            ▼                                     │
│              invoke('interaction_response', {                    │
│                popup_id: "...",                                 │
│                answer: "feature",                               │
│                next_action: { type: "chain", next: {...} }     │
│              })                                                  │
│                            │                                     │
│                            │ Popup closes → Next spawns          │
│                            ▼                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Interaction Types

```typescript
// src/lib/layouts/shared/interactions/types.ts

export type InteractionType =
  | 'confirm'      // Yes/No
  | 'boolean'      // True/False
  | 'choice'       // Multiple choice (single select)
  | 'multi'        // Multiple choice (multi select)
  | 'input'        // Text input
  | 'custom';      // Custom component

export interface InteractionSchema {
  id: string;
  type: InteractionType;
  question: string;

  // Type-specific
  options?: string[];              // for choice/multi
  placeholder?: string;            // for input
  component?: string;              // for custom

  // Behavior
  required?: boolean;
  allowOther?: boolean;            // "Other" option with text input

  // Chaining
  next?: InteractionSchema | null; // Next interaction after this one

  // Styling
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'highlight' | 'warning';
}

export interface InteractionResponse {
  popup_id: string;
  interaction_id: string;
  answer: string | string[] | boolean;
  timestamp: number;
}

export type NextAction =
  | { type: 'close' }
  | { type: 'chain'; next: InteractionSchema }
  | { type: 'merge'; target_id: string; data: unknown };
```

### Rust Types

```rust
// src-tauri/src/types/interactions.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InteractionType {
    Confirm,
    Boolean,
    Choice,
    Multi,
    Input,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionSchema {
    pub id: String,
    #[serde(rename = "type")]
    pub interaction_type: InteractionType,
    pub question: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub placeholder: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub component: Option<String>,

    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub allow_other: bool,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub next: Option<Box<InteractionSchema>>,

    #[serde(default = "default_size")]
    pub size: String,
    #[serde(default = "default_variant")]
    pub variant: String,
}

fn default_size() -> String { "md".to_string() }
fn default_variant() -> String { "default".to_string() }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InteractionResponse {
    pub popup_id: String,
    pub interaction_id: String,
    pub answer: serde_json::Value,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum NextAction {
    Close,
    Chain { next: InteractionSchema },
    Merge { target_id: String, data: serde_json::Value },
}
```

## Migration Plan

### Phase 1: Reorganize Commands (No Breaking Changes)

1. Create folder structure under `commands/`
2. Move existing commands into domain folders
3. Update `mod.rs` exports
4. Update `lib.rs` command registration
5. **Verify:** `cargo check` passes, app works identically

### Phase 2: Extract Shared Types

1. Create `types/` module
2. Move types from command files to shared types
3. Update command files to use shared types
4. **Verify:** `cargo check` passes

### Phase 3: Add Interaction System

1. Create `commands/window/interactions.rs`
2. Create `types/interactions.rs`
3. Create Svelte interaction components
4. Create `/popup` route
5. Add interaction capability
6. **Verify:** Can spawn a basic interaction popup

### Phase 4: Create Svelte Command Wrappers

1. Create `sys/commands/` TypeScript modules
2. Wrap all Tauri commands with typed functions
3. Add error handling and loading states
4. **Verify:** Frontend uses wrappers, not raw `invoke()`

### Phase 5: Documentation

1. Write `src-tauri/README.md`
2. Write `src/README.md`
3. Update this document with any changes

## Conventions

### Naming

| Context | Convention | Example |
|---------|------------|---------|
| Rust command | `snake_case` | `chat_send`, `list_adapters` |
| Rust type | `PascalCase` | `ChatResponse`, `AdapterInfo` |
| Rust module | `snake_case` | `chat`, `adapters` |
| TS function | `camelCase` | `chatSend()`, `listAdapters()` |
| TS type | `PascalCase` | `ChatResponse`, `AdapterInfo` |
| Svelte component | `PascalCase` | `ChatFrame.svelte` |
| CSS class | `kebab-case` | `glass-card`, `chat-frame` |

### Command Naming Pattern

```rust
// Domain prefix + action
chat_send           // not just "send"
chat_history        // not "get_history"
projects_list       // not "list_projects" (domain first)
projects_add        // not "add_project"
voice_transcribe    // not "transcribe"
```

### Type Location Rules

1. **If used by multiple commands** → `types/` module
2. **If command-specific** → same file as command
3. **If from Engine** → re-export from Engine, don't duplicate

### Error Handling

```rust
// Commands return Result<T, String>
// Use .map_err(|e| e.to_string()) for engine errors

#[tauri::command]
pub async fn chat_send(
    message: String,
    state: State<'_, AppState>,
) -> Result<ChatResponse, String> {
    state.engine()
        .chat
        .send(&message)
        .await
        .map_err(|e| e.to_string())
}
```

## AI Assistant Instructions

When working on this codebase:

1. **Read this file first** when resuming work
2. **Check SPRINTS.md** for current sprint tasks
3. **Follow the folder structure** - don't create flat files
4. **Align Tauri ↔ Svelte** - commands mirror domains
5. **Use shared types** - don't duplicate type definitions
6. **Test after changes** - `cargo check`, `npm run check`

### Common Tasks

**Add a new command:**
1. Determine which domain it belongs to
2. Add to appropriate `commands/{domain}/` folder
3. Add types to `types/{domain}.rs` if needed
4. Export from `commands/{domain}/mod.rs`
5. Register in `lib.rs`
6. Add TypeScript wrapper in `sys/commands/{domain}.ts`

**Add a new interaction type:**
1. Add variant to `InteractionType` enum (both Rust and TS)
2. Add component in `layouts/shared/interactions/`
3. Update `InteractionRenderer.svelte` to handle new type
4. Test with a manual spawn

**Debug an issue:**
1. Check Tauri dev console (Rust logs)
2. Check browser dev tools (JS logs)
3. Use `dev_system_diagnostics` command for state inspection
