# SPRINT: DevForge — Frontend Integration (Phase 3)

> **Status**: READY FOR IMPLEMENTATION
> **Depends on**: Phase 1 + Phase 2 backend (merged on `feat/llguidance-runtime`) ✅ DONE
> **Assigned to**: fresh Claude session — pick up from this spec, do not re-design

---

## What's already done (do not rebuild)

Phases 1 + 2 landed the full Rust side: sidecar lifecycle, filesystem
layout, persistent state, and bootstrap preload. The frontend does not
need to know how any of it works internally — only the IPC contract
below.

### Files that exist (reference only, don't modify unless the spec says so)

```
interfaces/desktop/src-tauri/src/commands/devforge/
├── mod.rs             # Tauri commands
├── bootstrap.rs       # Preload orchestration, fires on app start
├── paths.rs           # DevforgePaths — directory layout
├── sidecar.rs         # RehManager — Node child lifecycle
├── state_file.rs      # DevforgeState — persisted JSON
└── types.rs           # IPC types (cross-boundary via specta)

interfaces/desktop/src-tauri/src/
├── state.rs           # PlatformState now holds `devforge_paths`
└── lib.rs             # spawns bootstrap::run() from the setup hook
```

### Filesystem layout (dev resolves to `.userdata/devforge/`)

```
devforge/
├── install/current/   ← REH binaries (dev uses repo junction at deps/code-oss-reh-web)
├── workspaces/
│   └── default/       ← auto-created first-run workspace
├── user-data/         ← VS Code profiles, settings, keybindings (--user-data-dir)
├── extensions/        ← installed VS Code extensions (--extensions-dir)
├── logs/
└── state.json         ← persisted DevforgeState
```

---

## Backend IPC contract

### Events

**`devforge://ready`** — emitted once during bootstrap (success OR failure).
Subscribers that mount after emission must call `devforgeGetStatus()` to
catch up. Payload:

```ts
type DevforgeBootstrapStatus = {
  installed: boolean;        // true if a valid REH build was resolved
  running:   boolean;        // true if the child process is alive
  url:       string | null;  // http://127.0.0.1:<port>/?tkn=<token>
  port:      number | null;
  workspace: string | null;  // absolute path
  rehVersion: string | null;
};
```

### Commands (generated into `src/lib/sys/generated/bindings.ts` via tauri-specta)

```ts
// Unified status — prefer this over the lower-level getters
devforgeGetStatus(): Promise<DevforgeBootstrapStatus>;

// Workspace management
devforgeListWorkspaces(): Promise<string[]>;                  // abs paths
devforgeCreateWorkspace(name: string): Promise<string>;       // returns abs path

// Preference toggle — when true, bootstrap always opens `workspaces/default/`
// instead of restoring `state.lastWorkspace`
devforgeSetFreshInstance(enabled: boolean): Promise<void>;

// Lower-level lifecycle (power users / custom workspace flows)
spawnRehServer(config: RehConfig): Promise<RehStatus>;
stopRehServer(): Promise<void>;
getRehStatus(): Promise<RehStatus>;
getConnectionUrl(): Promise<string>;  // errors if not running

type RehConfig = {
  serverDir:     string;           // REH build root
  workspacePath: string;           // folder to open
  userDataDir:   string;           // --user-data-dir
  extensionsDir: string | null;    // --extensions-dir
};

type RehStatus = {
  running: boolean;
  port:    number | null;
  url:     string | null;
  pid:     number | null;
};
```

**Import from:** `$lib/sys/generated/bindings` (re-exported via specta
export on every dev build — do not hand-edit that file).

---

## Frontend deliverables

### 1. Domain module: `src/lib/domains/devforge/`

Follow the pattern established by
`src/lib/domains/app/models/features/setup-wizard/`:

```
src/lib/domains/devforge/
├── index.ts                        # barrel — ONLY public API
├── devforge.runes.svelte.ts        # runes state ($state, $derived)
├── devforge.service.ts             # wraps bindings, handles events,
│                                   # owns the WebviewWindow open/close API
└── components/
    ├── DevForgeLanding.svelte      # dashboard with the two mode buttons
    ├── ModeCard.svelte             # reusable card for Lite / Full buttons
    ├── InstallCta.svelte           # shown when installed === false
    ├── WorkspacePicker.svelte      # list + create workspaces
    ├── FreshInstanceToggle.svelte  # preference toggle
    └── StatusPill.svelte           # "ready / booting / not installed" chip
```

**Landing surface behavior.** The DevForge route inside DevPulse's main
window **is not the editor** — it's a dashboard. It renders:

- A header with the current workspace + status pill
- Two large mode cards side by side (see §1a below)
- Workspace picker + fresh-instance toggle below the cards
- Install CTA occupying the whole body when `installed === false`

#### 1a. Two-mode entry — the core UX

This is the click path the owner described:

> *User clicks DevPulse → clicks DevForge tab → sees two buttons →
> clicks a button → a fully-chromed Tauri window opens, resizable,
> independent, but killed when DevPulse exits.*

Two modes, each launched via `WebviewWindow`:

| Mode | Label | Window label | URL source | Use case |
|---|---|---|---|---|
| **Monaco Lite** | "Lite Editor" | `devforge-lite` | `tauri://localhost/devforge/lite` (SvelteKit route) | Config files, snippets, quick one-off edits. No extension host, instant launch, ~3MB runtime overhead. |
| **Full VS Code** | "Full Editor" | `devforge-full` | `devforgeState.status.url` (REH connection URL) | Full IDE with extensions, Claude Code, marketplace, terminals. Requires bootstrap to have succeeded. |

**Rules both modes share:**
- Each mode uses a unique `WebviewWindow` label. Re-clicking the button
  focuses the existing window instead of spawning a duplicate.
- Windows are independently resizable and have normal native chrome
  (`decorations: true`).
- Windows close automatically when DevPulse exits (Tauri default — no
  extra wiring needed because they live in the same app process).
- Monaco Lite is **always available** once the frontend mounts. It does
  not depend on `devforgeState.installed` or the REH bootstrap —
  Monaco ships with DevPulse itself.
- Full VS Code is disabled until `devforgeState.isReady === true`.

### 1b. Monaco Lite — the SvelteKit route

Create a new route inside the existing SvelteKit tree:

```
src/routes/devforge/lite/
├── +layout.svelte   # no chrome — fill the window
├── +layout.ts       # export const ssr = false; export const prerender = false;
└── +page.svelte     # mounts <MonacoEditor /> full-bleed
```

The route must render **without** any DevPulse chrome (header, nav,
statusbar). Wrap in a minimal layout that sets `html, body, #root {
height: 100%; margin: 0 }` and nothing else.

**Monaco integration:**
- Package: `monaco-editor` (already pulled in by `@monaco-editor/loader`
  if present — check `package.json` before adding). If not present, add
  `monaco-editor` as a direct dep.
- Use the `esm` entrypoint: `import * as monaco from "monaco-editor"`.
- Vite needs the `monaco-editor-webpack-plugin` equivalent for Vite —
  use `vite-plugin-monaco-editor` or manual worker config. Check
  `vite.config.ts` for existing Monaco config before adding.
- File operations go through Tauri's `@tauri-apps/plugin-fs` — the
  `tauri-plugin-fs` plugin is already registered in `lib.rs`. If not,
  add it. (Double-check by grepping `lib.rs` for `tauri_plugin_fs`.)
- URL query params pass the initial file: `?file=<abs-path>`. If absent,
  open with an empty untitled buffer.
- Save via `writeTextFile`. Ctrl+S keybind. Dirty state in the window
  title.

**Opening the window** — in `devforge.service.ts`:

```ts
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export async function openLiteEditor(initialFile?: string): Promise<void> {
  const label = "devforge-lite";
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    await existing.setFocus();
    return;
  }
  const qs = initialFile ? `?file=${encodeURIComponent(initialFile)}` : "";
  new WebviewWindow(label, {
    url: `/devforge/lite${qs}`,     // SvelteKit route, served by Tauri dev/prod
    title: "DevForge — Lite Editor",
    width: 1100, height: 750,
    minWidth: 600, minHeight: 400,
    resizable: true,
    decorations: true,
  });
}
```

### 1c. Full VS Code — external URL window

No SvelteKit route involved. The window loads the REH connection URL
directly:

```ts
export async function openFullEditor(): Promise<void> {
  const s = devforgeState.status;
  if (!s.url) throw new Error("DevForge REH not ready");
  const label = "devforge-full";
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    await existing.setFocus();
    return;
  }
  new WebviewWindow(label, {
    url: s.url,                     // http://127.0.0.1:<port>/?tkn=<hex>
    title: "DevForge — Full Editor",
    width: 1600, height: 1000,
    minWidth: 800, minHeight: 500,
    resizable: true,
    decorations: true,
  });
}
```

Tauri v2 allows external `http://127.0.0.1:*` URLs in `WebviewWindow` —
confirm `tauri.conf.json` has no CSP restriction blocking this (should
be fine because the connection URL is localhost-bound).

**Rules (match the rest of the project):**
- Routes and other domains import **only** from `index.ts` — never deep.
- Runes file uses `.svelte.ts` extension and exports a single `devforgeState` object.
- Service file exports plain async functions — no classes.
- No direct `@tauri-apps/api` imports — use the generated `bindings`.

### 2. `devforge.runes.svelte.ts`

```ts
import type { DevforgeBootstrapStatus } from "$lib/sys/generated/bindings";

// Single exported state object — destructure in components.
function createDevforgeState() {
  let status = $state<DevforgeBootstrapStatus>({
    installed: false, running: false,
    url: null, port: null, workspace: null, rehVersion: null,
  });
  let error = $state<string | null>(null);
  let workspaces = $state<string[]>([]);

  return {
    get status() { return status; },
    get error()  { return error; },
    get workspaces() { return workspaces; },
    get isReady() { return status.installed && status.running && !!status.url; },
    get needsInstall() { return !status.installed; },
    setStatus(s: DevforgeBootstrapStatus) { status = s; },
    setError(e: string | null) { error = e; },
    setWorkspaces(w: string[]) { workspaces = w; },
  };
}

export const devforgeState = createDevforgeState();
```

### 3. `devforge.service.ts`

Handles the event subscription + command calls. All exports are plain
async functions.

```ts
import { listen } from "@tauri-apps/api/event";
import {
  devforgeGetStatus, devforgeListWorkspaces,
  devforgeCreateWorkspace, devforgeSetFreshInstance,
  stopRehServer,
} from "$lib/sys/generated/bindings";
import { devforgeState } from "./devforge.runes.svelte.js";

/**
 * Initialize the DevForge domain.
 *
 * Call ONCE from the app root layout's onMount. Subscribes to the
 * `devforge://ready` event AND pulls the current status via
 * `devforgeGetStatus()` to cover the case where bootstrap fired
 * before the frontend mounted.
 *
 * Returns an unlisten fn — the caller is responsible for cleanup.
 */
export async function initDevforge(): Promise<() => void> {
  // Catch-up pull for late mounts
  try {
    const status = await devforgeGetStatus();
    devforgeState.setStatus(status);
  } catch (e) {
    devforgeState.setError(String(e));
  }

  // Live subscription for the first boot
  const unlisten = await listen<DevforgeBootstrapStatus>(
    "devforge://ready",
    (evt) => devforgeState.setStatus(evt.payload),
  );

  // Initial workspace list
  refreshWorkspaces().catch(() => {});

  return unlisten;
}

export async function refreshWorkspaces(): Promise<void> {
  const list = await devforgeListWorkspaces();
  devforgeState.setWorkspaces(list);
}

export async function createWorkspace(name: string): Promise<string> {
  const path = await devforgeCreateWorkspace(name);
  await refreshWorkspaces();
  return path;
}

export async function setFreshInstance(enabled: boolean): Promise<void> {
  await devforgeSetFreshInstance(enabled);
}

/**
 * Stop the REH server — use before the app exits or when the user
 * wants to switch workspaces. (Workspace switch = stop + restart via
 * spawnRehServer with a new RehConfig. Phase 3.5 if time permits.)
 */
export async function stopDevforge(): Promise<void> {
  await stopRehServer();
}
```

### 4. `DevForgeLanding.svelte` — the dashboard

Composes the whole landing surface. Pseudocode:

```svelte
<script lang="ts">
  import { devforgeState } from "../devforge.runes.svelte.js";
  import { openLiteEditor, openFullEditor } from "../devforge.service.js";
  import InstallCta from "./InstallCta.svelte";
  import ModeCard from "./ModeCard.svelte";
  import WorkspacePicker from "./WorkspacePicker.svelte";
  import FreshInstanceToggle from "./FreshInstanceToggle.svelte";
  import StatusPill from "./StatusPill.svelte";
</script>

{#if devforgeState.needsInstall}
  <InstallCta />
{:else}
  <header>
    <h1>DevForge</h1>
    <StatusPill />
  </header>

  <section class="modes">
    <ModeCard
      title="Lite Editor"
      subtitle="Monaco — fast single-file editing"
      enabled={true}
      onclick={() => openLiteEditor()}
    />
    <ModeCard
      title="Full Editor"
      subtitle="VS Code with extensions, Claude Code, terminals"
      enabled={devforgeState.isReady}
      onclick={() => openFullEditor()}
    />
  </section>

  <section class="config">
    <WorkspacePicker />
    <FreshInstanceToggle />
  </section>
{/if}
```

`ModeCard` is a dumb presentational component — big title, subtitle,
icon, click handler, disabled state. Follow the existing coldlight
token system for colors/spacing; look at `PresetCard.svelte` in the
setup-wizard feature for style reference.

### 5. `InstallCta.svelte`

Shown when `devforgeState.needsInstall === true`. For Phase 3 this is a
placeholder that says "DevForge is not yet installed" with a disabled
button. Phase 4 (update channel) wires the button to the installer
download. **Do not implement download logic in this sprint.**

### 6. `WorkspacePicker.svelte`

Lists `devforgeState.workspaces`, shows the currently-active one
(`devforgeState.status.workspace`), and has a text input + button to
create a new workspace via `createWorkspace()`. Switching workspaces is
out of scope (Phase 3.5) — for now the picker is informational after
creation.

### 7. `index.ts` barrel

```ts
export { devforgeState } from "./devforge.runes.svelte.js";
export {
  initDevforge,
  stopDevforge,
  refreshWorkspaces,
  createWorkspace,
  setFreshInstance,
  openLiteEditor,
  openFullEditor,
} from "./devforge.service.js";
export { default as DevForgeLanding } from "./components/DevForgeLanding.svelte";
```

---

## Integration points

### A. Init hook (root layout)

Call `initDevforge()` once from the root layout's `onMount`:

```svelte
<!-- src/routes/+layout.svelte (or the closest equivalent root) -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { initDevforge } from "$lib/domains/devforge";

  let unlisten: (() => void) | null = null;

  onMount(async () => {
    unlisten = await initDevforge();
  });

  onDestroy(() => unlisten?.());
</script>
```

### B. DevForge route (the dashboard)

Create `src/routes/(app)/devforge/+page.svelte` (or the equivalent route
group — check where other hubs like `devclyffy`/`devpulse` land) that
renders `<DevForgeLanding />`. This route is what the dock/nav button
links to.

### C. Monaco Lite route (separate window target)

Create `src/routes/devforge/lite/+page.svelte` **outside** any `(app)`
group so it renders chrome-free. This is what the Lite Editor window
loads when `openLiteEditor()` is called.

### D. Dock/nav button

Find wherever hub navigation lives (grep for `devclyffy` route links,
or the main sidebar component) and add a DevForge entry pointing at
`/devforge`. If unclear, ask before guessing.

---

## Acceptance criteria

1. **Cold start** — launch `pnpm tauri dev`. Watch the terminal for
   `DevForge bootstrap: spawning REH server` → `DevForge bootstrap complete`.
2. **Directory created** — confirm `.userdata/devforge/` exists with
   `workspaces/default/`, `user-data/`, `extensions/`, `logs/`, `state.json`.
3. **Event received** — add a `console.log` in the `initDevforge` event
   handler, confirm `devforge://ready` fires with `installed: true,
   running: true`.
4. **Late mount** — reload the frontend (Ctrl+R in devtools). Confirm the
   catch-up `devforgeGetStatus()` call hydrates `devforgeState` even
   though the event already fired.
5. **Dashboard renders** — navigate to `/devforge`, see the DevForge
   landing page with both mode cards. Full Editor card is enabled,
   workspace picker shows `default`.
6. **Monaco Lite opens** — click "Lite Editor". A new Tauri window
   titled "DevForge — Lite Editor" opens at ~1100×750, resizable,
   renders an empty Monaco editor, has normal OS chrome.
7. **Full Editor opens** — click "Full Editor". A new Tauri window
   titled "DevForge — Full Editor" opens at ~1600×1000, loads VS Code
   against the connection URL with the bundled token. Resizable.
8. **Window idempotency** — click "Lite Editor" again while the window
   is open. No second window is created; the existing one is focused.
   Same for Full Editor.
9. **Independent windows** — resize Lite and Full windows independently,
   move them between monitors. DevPulse main window is unaffected.
10. **Profile persistence** — inside the Full Editor, change the color
    theme. Close the window. Re-open via the button. The theme
    should persist (proves `--user-data-dir` is wired).
11. **Workspace persistence** — inside Full Editor, create a file in the
    default workspace. Close the Full Editor window, quit DevPulse
    entirely, relaunch. On next boot, bootstrap should restore the same
    workspace and the file should still be there.
12. **Shutdown tie** — with both Lite and Full windows open, quit
    DevPulse from the main window (File → Quit, or Ctrl+Q). Both child
    windows must close automatically. In Task Manager, confirm no
    orphan `node.exe` from `deps/code-oss-reh-web` remains.
13. **Lite file round-trip** — call `openLiteEditor("D:/some/file.ts")`.
    The Lite window opens with that file loaded. Edit it, Ctrl+S,
    close the window. Reopen the file in any other editor and verify
    the changes persisted.

---

## Out of scope (separate sprints)

- **Phase 3.5** — Workspace switching (stop + respawn on pick) and
  multi-workspace parallel sessions.
- **Phase 4** — Update channel. Manifest fetch, download, sha256 verify,
  extract, junction swap. Wire `InstallCta` to this.
- **Phase 5** — Claude extension ↔ DevPulse DB bridge. See
  [`SPRINT-DEVFORGE-CLAUDE-BRIDGE.md`](./SPRINT-DEVFORGE-CLAUDE-BRIDGE.md)
  for the architecture. Required for Claude Code running inside the
  Full Editor to read/write DevPulse's projects/sessions/turns tables.
- **Phase 6** — Extension management UI (list, install, uninstall,
  search marketplace).
- **Theme wiring** — Making the DevForge VS Code window inherit DevPulse
  design tokens (accent colors). The theme-devforge extension is
  already bundled in `deps/code-oss`; sprint not needed unless tokens
  need to resync.

---

## Rules and gotchas

- **Never hand-edit `src/lib/sys/generated/bindings.ts`.** It is
  regenerated on every Rust debug build by tauri-specta.
- The REH URL includes `?tkn=<32-char-hex>`. Do not log it or expose it
  in user-visible UI — treat it like a short-lived secret.
- `WebviewWindow` labels must be unique per session. Always check for an
  existing `"devforge"` label before creating a new one.
- Bootstrap runs exactly once at app start. If it fails with
  `installed: true, running: false`, the frontend should offer a "Retry"
  button that calls `spawnRehServer()` directly with a `RehConfig`
  rebuilt from `devforgeGetStatus()`'s `workspace` field — but **do not
  implement retry logic until the happy path is proven working**.
- `tauri-plugin-shell` and `tauri-plugin-single-instance` are already
  initialized in `lib.rs`. You do not need new plugins.
- When in doubt about file locations or style, look at
  `src/lib/domains/app/models/features/setup-wizard/` and mirror it.

---

## How to verify you didn't break the backend

```
cargo check -p devpulse_desktop_backend
```

Should finish clean. If it errors, revert your frontend changes and
re-read this spec — you shouldn't be touching Rust.
