# SPRINT: DevForge — VS Code Sidecar + Embedded Editor

> **Status**: DRAFT — AWAITING OWNER APPROVAL
> **Hub**: DevForge (new hub, `devclyffy` renamed/superseded)
> **Depends on**: REH Web build (`vscode-reh-web-win32-x64`) ✅ DONE
> **Priority**: After P0/P1 stabilization or parallel if owner says go

---

## Vision

DevForge is the code editor hub inside DevPulse Desktop. Two modes:

1. **Sidecar Mode** — Full VS Code Server (REH Web) as a Tauri-managed child process.
   Browser-grade VS Code in a Tauri WebviewWindow. Full extension support:
   Claude Code, Claude Desktop (via MCP bridge), any marketplace extension.

2. **Embedded Mode** — Monaco editor as a Svelte component for lightweight
   inline editing (config files, snippets, quick fixes). No extension host.

Default landing: DevForge Dashboard (platform default remains DevPulse home).

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  DevPulse Desktop (Tauri)            │
│                                                     │
│  ┌──────────────┐  ┌─────────────────────────────┐  │
│  │ DevForge Hub  │  │  Other Hubs (Chat, etc.)    │  │
│  │              │  └─────────────────────────────┘  │
│  │  ┌─────────┐ │                                   │
│  │  │Dashboard│ │  Rust Backend (src-tauri)          │
│  │  │ Monaco  │ │  ┌──────────────────────────────┐  │
│  │  │ inline  │ │  │ commands/devforge/mod.rs      │  │
│  │  └─────────┘ │  │  - spawn_reh_server          │  │
│  │              │  │  - stop_reh_server            │  │
│  │  ┌─────────┐ │  │  - get_reh_status            │  │
│  │  │ VS Code │ │  │  - get_connection_url         │  │
│  │  │Webview  │◄├──│  - list_extensions            │  │
│  │  │(REH Web)│ │  │  - install_extension          │  │
│  │  └─────────┘ │  └──────────┬───────────────────┘  │
│  └──────────────┘             │                      │
│                               ▼                      │
│                    ┌──────────────────┐               │
│                    │ REH Web Server   │               │
│                    │ (Node.js child)  │               │
│                    │ localhost:<port>  │               │
│                    │ --connection-token│               │
│                    └──────────────────┘               │
└─────────────────────────────────────────────────────┘
```

### Key Decisions

| Decision | Answer |
|----------|--------|
| Hub name | DevForge |
| Default view | DevForge Dashboard |
| REH server location | `deps/code-oss` build output or prebuild from `D:\localdev\vscode` |
| Auth model | Random connection token per session, injected into webview URL |
| Extension support | Full — Claude Code, marketplace, VibePulse (later) |
| Monaco embed | Svelte wrapper component, loaded from `monaco-editor` npm package |
| MCP bridge | Future — bridge DevForge ↔ DevPulse platform via MCP protocol |
| VibePulse | Built separately later, connects to DevPulse via MCP |

---

## Phase 1: Rust Sidecar Manager

**Goal**: Tauri can spawn, monitor, and kill the REH web server.

### Files

```
interfaces/desktop/src-tauri/src/commands/devforge/
  mod.rs              # Tauri commands
  sidecar.rs          # REH process lifecycle
  types.rs            # RehServerState, RehConfig
```

### Tauri Commands

```rust
// commands/devforge/mod.rs
pub mod sidecar;
pub mod types;

use crate::state::PlatformState;
use sidecar::RehManager;
use types::{RehConfig, RehStatus};
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn spawn_reh_server(
    state: State<'_, PlatformState>,
    config: RehConfig,
) -> Result<RehStatus, String> { ... }

#[tauri::command]
#[specta::specta]
pub async fn stop_reh_server(
    state: State<'_, PlatformState>,
) -> Result<(), String> { ... }

#[tauri::command]
#[specta::specta]
pub async fn get_reh_status(
    state: State<'_, PlatformState>,
) -> Result<RehStatus, String> { ... }

#[tauri::command]
#[specta::specta]
pub async fn get_connection_url(
    state: State<'_, PlatformState>,
) -> Result<String, String> { ... }
```

### Sidecar Logic

```rust
// commands/devforge/sidecar.rs
pub struct RehManager {
    child: Option<tokio::process::Child>,
    port: u16,
    token: String,
    server_dir: PathBuf,
}

impl RehManager {
    pub async fn spawn(config: &RehConfig) -> Result<Self, anyhow::Error> {
        // 1. Find free port (portpicker or manual scan)
        // 2. Generate random connection token
        // 3. Spawn: node server-main.js
        //      --port <port>
        //      --connection-token <token>
        //      --host 127.0.0.1
        //      --without-connection-token  (or with, based on config)
        //      --extensions-dir <managed_dir>
        //      --folder-uri <workspace>
        // 4. Health check loop: GET http://127.0.0.1:<port>/healthz
        // 5. Return status
    }

    pub async fn stop(&mut self) -> Result<(), anyhow::Error> {
        // Graceful: send signal, wait 5s, then kill
    }

    pub fn connection_url(&self) -> String {
        format!("http://127.0.0.1:{}/?tkn={}", self.port, self.token)
    }
}
```

### Types

```rust
// commands/devforge/types.rs
#[derive(serde::Serialize, serde::Deserialize, specta::Type)]
pub struct RehConfig {
    pub server_dir: PathBuf,       // path to REH build output
    pub workspace_path: PathBuf,   // folder to open
    pub extensions_dir: Option<PathBuf>,
}

#[derive(serde::Serialize, serde::Deserialize, specta::Type)]
pub struct RehStatus {
    pub running: bool,
    pub port: Option<u16>,
    pub url: Option<String>,
    pub pid: Option<u32>,
}
```

### Registration

Add to `commands/mod.rs`:
```rust
pub mod devforge;
```

Add to `lib.rs` collect_commands:
```rust
commands::devforge::spawn_reh_server,
commands::devforge::stop_reh_server,
commands::devforge::get_reh_status,
commands::devforge::get_connection_url,
```

Add `RehManager` to `PlatformState` (behind `Arc<RwLock<Option<RehManager>>>`).

### Deps (Cargo.toml)

```toml
portpicker = "0.1"    # find free port
rand = "0.8"          # connection token generation
reqwest = { version = "0.12", features = ["json"] }  # health check
```

### Verify

```
cargo check -p devpulse_desktop_backend
```

---

## Phase 2: Svelte Domain + Route (DevForge Hub)

**Goal**: DevForge hub exists in the parallel-sister pattern with dashboard + editor views.

### Domain Structure

```
src/lib/domains/devforge/
  index.ts                          # Public API
  contracts/
    devforge.contract.ts            # Zod schemas, RehConfig, RehStatus types
  state/
    devforge.state.svelte.ts        # $state: rehStatus, editorMode, activeWorkspace
  services/
    devforge.svc.ts                 # invoke('spawn_reh_server'), etc.
  features/
    dashboard/
      DevForgeDashboard.svelte      # Default landing — server status, workspace picker
      RecentWorkspaces.svelte       # Quick-open list
      ExtensionsList.svelte         # Installed extensions display
    editor/
      DevForgeEditor.svelte         # WebviewWindow iframe pointing at REH URL
      MonacoInline.svelte           # Embedded Monaco for lightweight editing
    sidecar/
      SidecarControls.svelte        # Start/stop/restart server controls
      SidecarStatus.svelte          # Health indicator
```

### Route Structure

```
src/routes/(app)/devforge/
  +page.svelte                      # Dashboard (default)
  +page.ts                          # Load function
  editor/
    +page.svelte                    # Full VS Code view
    +page.ts
```

### Verify

```
cd interfaces/desktop && pnpm svelte-check
```

---

## Phase 3: WebviewWindow Integration

**Goal**: VS Code REH renders inside a Tauri webview — either iframe in existing
window or dedicated WebviewWindow.

### Option A: Iframe in Route (simpler, start here)

```svelte
<!-- DevForgeEditor.svelte -->
<script lang="ts">
  import { devforgeState } from '../state/devforge.state.svelte.ts';

  const url = $derived(devforgeState.connectionUrl);
</script>

{#if url}
  <iframe
    src={url}
    title="DevForge Editor"
    class="w-full h-full border-0"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  />
{:else}
  <SidecarControls />
{/if}
```

### Option B: Dedicated WebviewWindow (better isolation, full keyboard)

Use existing `commands::window::open_window` pattern to spawn a second
WebviewWindow pointing at the REH URL. DevForge dashboard has a "Launch Editor"
button that opens it.

### Keyboard Conflict Mitigation

VS Code captures most keyboard shortcuts. In iframe mode:
- DevPulse global shortcuts (Cmd+K, etc.) won't reach VS Code
- Solution: dedicated window mode for serious editing, iframe for preview

---

## Phase 4: Monaco Inline Component

**Goal**: Lightweight embedded editor for config/snippet editing without full REH.

### Implementation

```
pnpm add monaco-editor
```

Svelte 5 wrapper:

```svelte
<!-- MonacoInline.svelte -->
<script lang="ts">
  import * as monaco from 'monaco-editor';

  let { value = $bindable(''), language = 'typescript', height = '400px' } = $props();
  let container: HTMLDivElement;
  let editor: monaco.editor.IStandaloneCodeEditor;

  $effect(() => {
    editor = monaco.editor.create(container, {
      value,
      language,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
    });

    editor.onDidChangeModelContent(() => {
      value = editor.getValue();
    });

    return () => editor.dispose();
  });
</script>

<div bind:this={container} style="height: {height}" class="w-full" />
```

---

## Phase 5: Extension Management + MCP Bridge

**Goal**: Pre-install extensions, manage them from DevForge dashboard.

### Extension Pre-install

REH server reads from `--extensions-dir`. DevForge manages this directory:

```
{app_data}/devforge/extensions/
  claude-code/
  vibepulse/          # later
  ...
```

Tauri commands:
```rust
#[tauri::command]
pub async fn install_extension(vsix_path: PathBuf) -> Result<(), String> { ... }

#[tauri::command]
pub async fn list_extensions() -> Result<Vec<ExtensionInfo>, String> { ... }
```

### MCP Bridge (Future)

DevForge ↔ DevPulse platform bridge:
- REH server extensions can call MCP tools exposed by DevPulse
- Clyffy kernel services available to Claude Code running inside DevForge
- SurrealDB (port 8822) shared across all surfaces

---

## Phase 6: Lifecycle + Cleanup

### On Tauri Shutdown

```rust
// In lib.rs on_exit or Drop impl
app.on_exit(|app_handle| {
    // Kill REH server child process
    // Clean temp files
});
```

### On Window Focus/Blur

Integrate with the Parking Lot decision (Option B — Tauri-side focus bridge):
- Pause health polling when DevForge tab isn't active
- Resume + immediate refresh on focus

---

## Build Output Location

The REH Web build from `D:\localdev\vscode` needs to land somewhere DevPulse can find it.

**Option A** (dev): Symlink or config path pointing to vscode build output
```
D:\localdev\vscode\.build\vscode-reh-web-win32-x64\
```

**Option B** (release): Copy into DevPulse deps
```
D:\localdev\platform_devpulse\deps\code-oss-reh-web\
```

`RehConfig.server_dir` points to whichever location. For dev, use env var or
`tauri.conf.json` resource path.

---

## NOT In Scope (Explicit)

- VibePulse rewrite — separate effort, connects via MCP later
- SurrealDB fix — tracked in P0, independent of this sprint
- Claude Desktop embedding — future, after MCP bridge works
- Multi-platform REH builds — Win64 only for now, cross-platform later

---

## Verification Checklist

- [ ] `cargo check -p devpulse_desktop_backend` — zero errors after Phase 1
- [ ] `pnpm svelte-check` — zero errors after Phase 2
- [ ] REH server spawns and `/healthz` returns 200
- [ ] WebviewWindow loads VS Code workbench
- [ ] Monaco inline renders and produces `value` binding
- [ ] Server stops cleanly on app exit (no orphan Node processes)
- [ ] Connection token prevents unauthorized access

---

## Dependencies

| Dep | Version | Purpose |
|-----|---------|---------|
| `portpicker` | 0.1 | Free port allocation |
| `rand` | 0.8 | Token generation |
| `reqwest` | 0.12 | Health check HTTP |
| `monaco-editor` | latest | Inline editor (npm) |
| Node.js | 20+ | REH server runtime (already on system) |
