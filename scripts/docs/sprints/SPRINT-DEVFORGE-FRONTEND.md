# SPRINT: DevForge — Frontend Integration (Phase 3)

> **Status**: READY FOR IMPLEMENTATION
> **Depends on**: Phase 1 + Phase 2 backend (merged) ✅ DONE
> **Assigned to**: fresh Claude session — pick up from this spec, do not re-design

---

## What already exists (do not recreate)

### Rust backend (Phase 1 + 2, DO NOT modify)

```
interfaces/desktop/src-tauri/src/commands/devforge/
├── mod.rs             # Tauri commands
├── bootstrap.rs       # Preload — spawns REH on app start (non-blocking)
├── paths.rs           # DevforgePaths — directory layout
├── sidecar.rs         # RehManager — Node child lifecycle
├── state_file.rs      # DevforgeState — persisted JSON
└── types.rs           # IPC types (cross-boundary via specta)

interfaces/desktop/src-tauri/src/
├── state.rs           # PlatformState holds `devforge_paths`
└── lib.rs             # spawns bootstrap::run() from setup hook
```

### Existing frontend scaffolding (EXTEND these, do not replace)

```
src/lib/domains/app/devforge/
├── index.ts              # barrel — currently empty, add exports here
├── features/
│   └── friends/          # unrelated, leave alone
└── pages/
    └── DevDashboard.svelte  # unused — you may repurpose or ignore

src/routes/(app)/devforge/
└── +page.svelte          # ⚠ EXISTING dashboard with Widgets — AUGMENT, do not replace

src/lib/layouts/app/Sidebar.svelte
→ line 55: { id: "devforge", icon: Wrench, label: "DevForge", href: "/devforge" }
  (already wired — do NOT add another nav entry)
```

### Existing dashboard — `src/routes/(app)/devforge/+page.svelte`

Already has a full Widget-based dashboard using the DevPulse design
system (`Widget`, `Badge`, `Text`, `cn`, `hstack`, `stack`, lucide
icons, `glass-deep` surfaces, `glow` accents). Contains 5 widget
sections: Build Pipeline, CI/CD, Environments, Node CLI, Packages.

**You MUST augment this file, not replace it.** Add the DevForge
editor launcher as a new Row 0 at the TOP of the grid, above the
existing Build Pipeline row. The existing widgets stay as-is.

### Design system components available

- `Widget` — `$lib/design/blocks/widgets/index.js`
- `Badge` — `$lib/design/components/badge/index.js`
- `Text` — `$lib/design/components/text/index.js`
- `Button` — `$lib/design/components/button/index.js`
- `cn` — `$lib/design/utils/cn.js`
- `hstack` — `$lib/design/utils/hstack/index.js`
- `stack` — `$lib/design/utils/stack/index.js`
- lucide-svelte icons — already in devDeps

### Domain pattern to follow

The **exact** pattern used by `src/lib/domains/app/devpulse/`:

```
src/lib/domains/app/<hub>/
├── index.ts                           # barrel
├── runes/<hub>.runes.svelte.ts        # Svelte 5 CLASS with $state fields
├── services/<hub>.service.ts          # async fns calling Tauri IPC
└── types/<hub>.types.ts               # TypeScript interfaces
```

- Runes are **class-based** using `$state` (see `devpulse.runes.svelte.ts`
  for the pattern — `class FooState { data = $state(...); ... }`)
- Service files export plain async functions, use the generated bindings
- Routes import ONLY from `index.ts` — never deep into subdirs

### Filesystem layout created by bootstrap (`.userdata/devforge/`)

```
devforge/
├── install/current/   ← REH binaries (dev uses repo junction at deps/code-oss-reh-web)
├── user-data/         ← VS Code profiles, settings, keybindings (--user-data-dir)
├── extensions/        ← installed VS Code extensions (--extensions-dir)
├── logs/              ← REH stdout/stderr
└── state.json         ← { lastWorkspace, freshInstanceOnOpen, rehVersion }
```

**Workspaces are NOT generated folders.** They are real project
directories (e.g. `D:/localdev/platform_devpulse`) that the user has
open. `state.json.lastWorkspace` remembers the last-opened path so
bootstrap restores it. On first run (no `lastWorkspace`), REH starts
with no folder open — the user picks one inside VS Code.

---

## Backend IPC contract

### Events

**`devforge://ready`** — emitted once during bootstrap (success OR failure).
Late-mounting frontends call `devforgeGetStatus()` to catch up.

```ts
type DevforgeBootstrapStatus = {
  installed: boolean;        // true if valid REH build found
  running:   boolean;        // true if child process alive
  url:       string | null;  // http://127.0.0.1:<port>/?tkn=<hex>
  port:      number | null;
  workspace: string | null;  // last project path, or null on first run
  rehVersion: string | null;
};
```

### Commands (generated into `src/lib/sys/generated/bindings.ts`)

```ts
// Primary — frontend uses these
devforgeGetStatus(): Promise<DevforgeBootstrapStatus>;
devforgeSetFreshInstance(enabled: boolean): Promise<void>;

// Recent projects — real directories the user has opened
devforgeListRecentProjects(): Promise<string[]>;     // newest first, max 20
devforgeAddProject(path: string): Promise<void>;     // validates dir exists
devforgeRemoveProject(path: string): Promise<void>;  // idempotent

// Lifecycle — power user / restart flows
spawnRehServer(config: RehConfig): Promise<RehStatus>;
stopRehServer(): Promise<void>;
getRehStatus(): Promise<RehStatus>;
getConnectionUrl(): Promise<string>;

type RehConfig = {
  serverDir:     string;
  workspacePath: string | null;  // null = no folder, user picks inside VS Code
  userDataDir:   string;
  extensionsDir: string | null;
};
type RehStatus = {
  running: boolean;
  port:    number | null;
  url:     string | null;
  pid:     number | null;
};
```

**Import from:** `$lib/sys/generated/bindings` — never hand-edit.

---

## Frontend deliverables

### 1. Domain module: `src/lib/domains/app/devforge/`

Add new files to the existing directory:

```
src/lib/domains/app/devforge/
├── index.ts                            # EXISTING — replace contents
├── runes/
│   └── devforge.runes.svelte.ts        # NEW
├── services/
│   └── devforge.service.ts             # NEW
├── types/
│   └── devforge.types.ts               # NEW
├── components/
│   └── EditorLauncherWidget.svelte     # NEW — the Widget for the dashboard
├── features/friends/                   # EXISTING — leave alone
└── pages/DevDashboard.svelte           # EXISTING — leave alone
```

### 2. `types/devforge.types.ts`

```ts
/**
 * @file DevForge Domain Types
 * @module @devpulse/domains/app/devforge/types
 */

/** Window labels for the managed Tauri child windows. */
export const DEVFORGE_WINDOW_LABEL = "devforge-full" as const;
```

### 3. `runes/devforge.runes.svelte.ts`

```ts
/**
 * @file DevForge Hub Runes
 * @module @devpulse/domains/app/devforge/runes
 *
 * Svelte 5 runes for the DevForge code editor hub.
 * Does NOT auto-fetch — bootstrap event or initDevforge triggers hydration.
 */

import type { DevforgeBootstrapStatus } from "$lib/sys/generated/bindings";

class DevForgeState {
  status = $state<DevforgeBootstrapStatus>({
    installed: false,
    running: false,
    url: null,
    port: null,
    workspace: null,
    rehVersion: null,
  });
  error = $state<string | null>(null);

  get isReady(): boolean {
    return this.status.installed && this.status.running && !!this.status.url;
  }

  get needsInstall(): boolean {
    return !this.status.installed;
  }

  get currentProject(): string | null {
    if (!this.status.workspace) return null;
    // Extract folder name from full path for display
    const parts = this.status.workspace.replace(/\\/g, "/").split("/");
    return parts[parts.length - 1] || null;
  }
}

export const devforgeState = new DevForgeState();
```

### 4. `services/devforge.service.ts`

```ts
/**
 * @file DevForge Domain Service
 * @module @devpulse/domains/app/devforge/services
 *
 * Handles event subscription, IPC calls, and WebviewWindow lifecycle.
 */

import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  devforgeGetStatus,
  devforgeSetFreshInstance,
  stopRehServer,
} from "$lib/sys/generated/bindings";
import type { DevforgeBootstrapStatus } from "$lib/sys/generated/bindings";
import { logInfo, logError } from "$lib/sys/logger.js";
import { devforgeState } from "../runes/devforge.runes.svelte.js";
import { DEVFORGE_WINDOW_LABEL } from "../types/devforge.types.js";

/**
 * Initialize the DevForge domain.
 *
 * Call ONCE from the (app) layout's onMount. Subscribes to the
 * `devforge://ready` event AND pulls the current status to cover
 * the case where bootstrap fired before the frontend mounted.
 *
 * Returns an unlisten fn — caller is responsible for cleanup.
 */
export async function initDevforge(): Promise<() => void> {
  // Catch-up pull for late mounts
  try {
    const status = await devforgeGetStatus();
    devforgeState.status = status;
    logInfo("devforge", `Status: installed=${status.installed}, running=${status.running}`);
  } catch (e) {
    devforgeState.error = String(e);
    logError("devforge", `Init failed: ${e}`);
  }

  // Live subscription for the bootstrap event
  const unlisten = await listen<DevforgeBootstrapStatus>(
    "devforge://ready",
    (evt) => {
      devforgeState.status = evt.payload;
      logInfo("devforge", `Ready event: running=${evt.payload.running}`);
    },
  );

  return unlisten;
}

/**
 * Open the Full VS Code editor as a managed Tauri child window.
 *
 * This is the primary DevForge action. The window loads the REH
 * connection URL directly — full VS Code with extension support,
 * Claude Code, terminals, everything.
 *
 * Idempotent: if the window is already open, focuses it.
 */
export async function openFullEditor(): Promise<void> {
  if (!devforgeState.isReady || !devforgeState.status.url) {
    throw new Error("DevForge is not ready — REH server not running");
  }

  const existing = await WebviewWindow.getByLabel(DEVFORGE_WINDOW_LABEL);
  if (existing) {
    await existing.setFocus();
    return;
  }

  new WebviewWindow(DEVFORGE_WINDOW_LABEL, {
    url: devforgeState.status.url,
    title: `DevForge — ${devforgeState.currentProject ?? "VS Code"}`,
    width: 1600,
    height: 1000,
    minWidth: 800,
    minHeight: 500,
    resizable: true,
    decorations: true,
  });

  logInfo("devforge", `Opened full editor: ${devforgeState.status.url}`);
}

/**
 * Stop the REH server and close the editor window if open.
 */
export async function stopDevforge(): Promise<void> {
  const existing = await WebviewWindow.getByLabel(DEVFORGE_WINDOW_LABEL);
  if (existing) {
    await existing.close();
  }
  await stopRehServer();
}

/**
 * Toggle the "always open fresh" preference.
 */
export async function setFreshInstance(enabled: boolean): Promise<void> {
  await devforgeSetFreshInstance(enabled);
}
```

### 5. `components/EditorLauncherWidget.svelte`

The launcher widget that sits at the top of the DevForge dashboard.
**One big button: click it, full VS Code opens.** Clean and direct.

```svelte
<!--
  @file EditorLauncherWidget — primary DevForge action
  Opens the Full VS Code editor as a managed Tauri window.
-->
<script lang="ts">
  import { MonitorUp } from "lucide-svelte";
  import { Widget } from "$lib/design/blocks/widgets/index.js";
  import { Badge } from "$lib/design/components/badge/index.js";
  import { Button } from "$lib/design/components/button/index.js";
  import { Text } from "$lib/design/components/text/index.js";
  import { hstack } from "$lib/design/utils/hstack/index.js";
  import { stack } from "$lib/design/utils/stack/index.js";
  import { devforgeState } from "$lib/domains/app/devforge/index.js";
  import { openFullEditor } from "$lib/domains/app/devforge/index.js";
</script>

<Widget
  title="Code Editor"
  icon={MonitorUp}
  surface="glass-deep"
  depth="z2"
  bevel="soft"
  glow="cyan"
  frame="accent-teal"
  radius="lg"
>
  <div class={stack({ gap: "3" })}>
    <div class={hstack({ justify: "between", align: "center" })}>
      <div class={stack({ gap: "1" })}>
        <Text weight="semibold">Full VS Code</Text>
        <Text size="xs" color="muted">
          Extensions, Claude Code, terminals, full IDE
        </Text>
      </div>

      {#if devforgeState.isReady}
        <Badge variant="positive" size="sm">Ready</Badge>
      {:else if devforgeState.status.installed}
        <Badge variant="warning" size="sm">Starting…</Badge>
      {:else}
        <Badge variant="neutral" size="sm">Not Installed</Badge>
      {/if}
    </div>

    <Button
      variant="primary"
      size="lg"
      disabled={!devforgeState.isReady}
      onclick={() => openFullEditor()}
    >
      <MonitorUp size={18} />
      Launch DevForge
    </Button>

    {#if devforgeState.status.workspace}
      <Text size="xs" color="secondary">
        Project: {devforgeState.currentProject}
      </Text>
    {:else if devforgeState.isReady}
      <Text size="xs" color="muted">
        No project open — pick a folder after launch
      </Text>
    {/if}

    {#if devforgeState.status.port}
      <Text size="xs" color="muted">REH :{devforgeState.status.port}</Text>
    {/if}
  </div>
</Widget>
```

### 6. Modify existing `+page.svelte` — add the launcher row

**File: `src/routes/(app)/devforge/+page.svelte`**

Two changes only:

1. Add import at the top of `<script>`:
```ts
import { EditorLauncherWidget } from "$lib/domains/app/devforge/index.js";
```

2. Add Row 0 immediately after `<div class="grid grid-cols-12 gap-4"`:
```svelte
  <!-- Row 0: Code Editor Launcher -->
  <div class="col-span-12">
    <EditorLauncherWidget />
  </div>
```

**Do NOT delete or modify the existing Widget rows.**

### 7. Update `index.ts` barrel

**File: `src/lib/domains/app/devforge/index.ts`** (replace contents)

```ts
/**
 * @file domains/app/devforge/index.ts
 * @module @devpulse/domains/app/devforge
 * @description IDE integration, code workspace, and DevForge editor hub
 */

// State
export { devforgeState } from "./runes/devforge.runes.svelte.js";

// Service
export {
  initDevforge,
  openFullEditor,
  stopDevforge,
  setFreshInstance,
} from "./services/devforge.service.js";

// Types
export { DEVFORGE_WINDOW_LABEL } from "./types/devforge.types.js";

// Components
export { default as EditorLauncherWidget } from "./components/EditorLauncherWidget.svelte";
```

---

## Integration point

Call `initDevforge()` from the `(app)` layout's `onMount`:

```ts
// Inside src/routes/(app)/+layout.svelte's existing <script>
import { initDevforge } from "$lib/domains/app/devforge/index.js";

// In the existing onMount (DO NOT create a second one):
const unlistenDevforge = await initDevforge();

// In onDestroy:
unlistenDevforge?.();
```

**Sidebar is already wired — no changes needed.**

---

## What happens end-to-end

1. User launches DevPulse
2. `lib.rs` setup hook spawns `devforge::bootstrap::run()` in background
3. Bootstrap creates `.userdata/devforge/` layout, resolves REH build
   from `deps/code-oss-reh-web` (dev) or `install/current/` (prod),
   restores `lastWorkspace` from `state.json`, spawns the Node REH
   server, waits for health, emits `devforge://ready`
4. Frontend mounts, `initDevforge()` catches the event (or pulls via
   `devforgeGetStatus()`), hydrates `devforgeState`
5. User navigates to `/devforge` in sidebar — sees the dashboard with
   "Launch DevForge" button showing "Ready" badge
6. User clicks the button → `openFullEditor()` → new `WebviewWindow`
   opens pointed at `http://127.0.0.1:<port>/?tkn=<hex>` → full VS Code
   with extension support, profiles, settings all persisted
7. User installs Claude extension inside VS Code → works immediately
8. On DevPulse quit → Exit handler kills REH child, all windows close

---

## Acceptance criteria

1. **Cold start** — `pnpm tauri dev`, terminal shows `DevForge bootstrap
   complete — REH ready`
2. **Layout created** — `.userdata/devforge/` has `user-data/`,
   `extensions/`, `logs/`, `state.json`
3. **Event fires** — console.log in `initDevforge` confirms
   `devforge://ready` with `installed: true, running: true`
4. **Late mount** — Ctrl+R reload, `devforgeGetStatus()` hydrates state
5. **Dashboard** — `/devforge` shows "Launch DevForge" button + "Ready"
   badge at top, existing Build Pipeline / CI/CD / etc. widgets below
6. **Launch** — click button → new native Tauri window opens, full
   VS Code loads, resizable, decorations present
7. **Idempotent** — click button again → existing window focuses, no dup
8. **Extensions work** — inside the VS Code window, open Extensions panel,
   install any extension, it loads
9. **Profile persistence** — change VS Code color theme, close window,
   reopen → theme persists (proves `--user-data-dir` wired)
10. **Project persistence** — open a folder in VS Code, quit DevPulse,
    relaunch → bootstrap restores that folder (check `state.json`)
11. **Shutdown** — quit DevPulse, no orphan `node.exe` in Task Manager
12. **First run** — delete `state.json`, relaunch → VS Code opens with
    no folder, user can pick one

---

## Out of scope (separate sprints)

- **Monaco Lite** editor — separate WebviewWindow with SvelteKit route,
  chrome-free Monaco editor. Future sprint, not needed for Phase 3.
- **Phase 4** — Update channel (manifest, download, verify, swap)
- **Phase 5** — Claude extension ↔ DevPulse DB bridge (see
  `SPRINT-DEVFORGE-CLAUDE-BRIDGE.md`)
- **Phase 6** — Extension management UI
- **Theme wiring** — accent color sync between DevPulse and VS Code

---

## Rules and gotchas

- **Never hand-edit `src/lib/sys/generated/bindings.ts`.**
- The REH URL contains `?tkn=<32-char-hex>` — do not log or expose in UI.
- `WebviewWindow` labels must be unique. Always check `getByLabel` first.
- Tauri v2 allows `http://127.0.0.1:*` in `WebviewWindow` — verify
  `tauri.conf.json` has no CSP blocking localhost.
- `Button` component: check if it accepts an `onclick` prop or uses
  Svelte's `on:click`. Adapt the `EditorLauncherWidget` accordingly.
- When in doubt about style, look at `+page.svelte` and mirror.

## Verify backend is intact

```
cargo check -p devpulse_desktop_backend
```

Must finish clean. If it errors, you've touched Rust — revert.
