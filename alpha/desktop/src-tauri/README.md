# DevPulse Desktop - Tauri Backend

> **AI Assistant:** Read CLAUDE.md at repo root for architecture rules. Types come from `shared/`, NOT duplicated here.

## Quick Start

```bash
cargo tauri dev              # Development
cargo check -p devpulse-desktop  # Check without building
```

## Structure

```
src-tauri/
├── src/
│   ├── main.rs         # Entry point
│   ├── lib.rs          # Tauri builder, command registration
│   ├── state.rs        # AppState (Engine handle)
│   └── commands/       # Tauri commands by domain
│       ├── mod.rs
│       ├── chat.rs
│       ├── status.rs
│       ├── adapters.rs
│       ├── models.rs
│       ├── discovery.rs
│       ├── persona.rs
│       ├── projects.rs
│       ├── sessions.rs
│       ├── voice.rs
│       ├── window.rs
│       └── dev.rs      # Feature-gated
```

## Architecture (from CLAUDE.md)

```
Desktop → Engine (facade only)
           ↓
        emits Signal
           ↓
    Orchestrator subscribes
    (black box - never call directly)
           ↓
    emits result Signal
           ↓
    Wire sink → Svelte
```

**Desktop NEVER imports orchestrator. Engine is the only interface.**

## Types

All types come from `shared/` crate:

```rust
use shared::{Signal, SignalKind, Source, Sink};
```

**DO NOT create types in desktop. SSOT is shared/.**

## Commands

Commands call Engine facade, which emits signals:

```rust
#[tauri::command]
pub async fn chat(state: State<'_, AppState>, message: String) -> Result<(), String> {
    state.engine.chat(message).await.map_err(|e| e.to_string())
}
```

### Adding a Command

1. Add function in `commands/*.rs`
2. Use `#[tauri::command]`
3. Export from `commands/mod.rs`
4. Register in `lib.rs` `generate_handler![]`
5. Create TS wrapper in `src/lib/sys/commands/`

## Windows

Two persistent windows (system tray):
- **Chat** - Primary AI interface
- **DevPulse** - Main app dashboard

Ephemeral interaction popups (AI-controlled, not in tray):

```rust
#[tauri::command]
pub async fn spawn_interaction(
    app: tauri::AppHandle,
    interaction_id: String,
    component: Component,  // From shared/
) -> Result<(), String> {
    tauri::WebviewWindowBuilder::new(
        &app,
        format!("interaction-{}", interaction_id),
        tauri::WebviewUrl::App(format!("/interaction/{}", interaction_id).into()),
    )
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .build()
    .map_err(|e| e.to_string())?;
    Ok(())
}
```

## Feature Flags

```toml
[features]
default = ["dev-tools"]
dev-tools = ["engine/dev-tools"]
```

Release: `cargo tauri build --release --no-default-features`

## Signal Flow

Desktop receives signals via Wire sink:

```rust
// Engine emits
Signal { kind: SignalKind::Chat { role: Role::Assistant, content }, .. }

// Desktop listens (Tauri event)
app.emit("signal", &signal)?;
```

Svelte subscribes:

```typescript
import { listen } from '@tauri-apps/api/event';
import type { Signal } from '$lib/sys/types'; // Generated from shared/

listen<Signal>('signal', (event) => {
  // Handle signal.kind
});
```

## Common Issues

**"orchestrator" import found:**
- NEVER import orchestrator in desktop
- Check: `grep -r "use orchestrator" src/`

**Types not found:**
- Import from `shared/`, not local
- Run `cargo check -p shared` first

**Command not found from frontend:**
- Check export in `commands/mod.rs`
- Check registration in `lib.rs`
