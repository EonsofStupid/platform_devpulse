# SPRINT: Startup Experience — Dual-Mode Boot UI

**Date**: 2026-03-05
**Status**: READY FOR REVIEW
**Research**: [SPRINT-STARTUP-EXPERIENCE.research.md](./SPRINT-STARTUP-EXPERIENCE.research.md)
**Depends On**: Platform facade (done), Health rune (done), InitEvent system (done)
**Relates To**: SPRINT-PLATFORM-WIRING (Phase 5.4 bootState rune — absorbed into this sprint)

---

## Goal

When DevPulse launches, the user sees a real-time loading screen showing initialization progress — not a blank window. Two modes:

- **Dev mode** (`import.meta.env.DEV`): Technical transparency — raw events, step names, latencies, terminal-style output
- **Production mode**: Layman-friendly — friendly names ("Knowledge Graph" not "Graph store"), progress bar, grouped status

Feature-flagged. Integrates with existing `Platform::boot()` callback and ColdLight design system.

---

## Current State

```
Dev launch:   xtask terminal shows stages → blank window for 60-90s → app appears
Prod launch:  double-click .exe → BLANK WINDOW for 60-90s → app appears
```

**Why it's blank**: `Platform::boot()` runs in Tauri's `setup()` hook BEFORE the webview loads. Events only go to stderr. No UI exists during boot.

## Target State

```
Dev launch:   xtask terminal shows stages → splashscreen shows Platform::boot() events → app appears
Prod launch:  splashscreen shows friendly progress → app appears
```

---

## Phase 1: Tauri Splashscreen Infrastructure (Rust)

### 1.1 Declare splashscreen window
- [ ] `interfaces/desktop/src-tauri/tauri.conf.json` — add `splashscreen` window:
  ```json
  {
    "label": "splashscreen",
    "url": "/splashscreen",
    "width": 480,
    "height": 360,
    "center": true,
    "decorations": false,
    "resizable": false,
    "transparent": true,
    "alwaysOnTop": true
  }
  ```
- [ ] `interfaces/desktop/src-tauri/tauri.conf.json` — modify `main` window:
  ```json
  {
    "label": "main",
    "visible": false
  }
  ```
  Main window starts hidden. Splashscreen shows first.

### 1.2 Add event bridge to setup hook
- [ ] `interfaces/desktop/src-tauri/src/lib.rs` — capture `app_handle` for event emission:
  ```rust
  .setup(|app| {
      let app_handle = app.handle().clone();
      // ...
      let platform = rt.block_on(async {
          Platform::boot(data_dir, |event| {
              // Terminal output (dev visibility)
              if event.status != InitStatus::Running {
                  eprintln!("  [{symbol}] {}{msg}{latency}", event.step);
              }
              // Event bridge to splashscreen
              let _ = app_handle.emit("platform:boot", &event);
          }).await
      })?;
  })
  ```

### 1.3 Add boot-complete event and window swap
- [ ] `interfaces/desktop/src-tauri/src/lib.rs` — after health verification:
  ```rust
  // Emit completion
  app.emit("platform:boot-complete", &health)?;

  // Window swap: show main, close splashscreen
  if let Some(splash) = app.get_webview_window("splashscreen") {
      splash.close()?;
  }
  if let Some(main) = app.get_webview_window("main") {
      main.show()?;
      main.set_focus()?;
  }

  app.manage(AppState { platform: Arc::new(platform) });
  ```

### 1.4 Verify Phase 1
- [ ] `cargo check -p devpulse_desktop_backend` — 0 errors
- [ ] `cargo xtask run-dev` — splashscreen window appears during boot, main window appears after

---

## Phase 2: Frontend Boot State (TypeScript)

### 2.1 Generate InitEvent types
- [ ] `interfaces/desktop/src/lib/sys/generated/init.types.ts` — TypeScript mirrors:
  ```typescript
  export type InitStatus = "Running" | "Ok" | "Error" | "Skipped";

  export interface InitEvent {
      step: string;
      status: InitStatus;
      message: string | null;
      latency_ms: number | null;
  }
  ```
  (Mirror of `systems/devpulse-engine/src/platform/init.rs` — keep in sync via ts-rs)

### 2.2 Create bootState rune
- [ ] CREATE `interfaces/desktop/src/lib/sys/runes/bootState.svelte.ts`:
  ```typescript
  import { listen } from '@tauri-apps/api/event';
  import type { InitEvent, InitStatus } from '$lib/sys/generated/init.types.js';

  class BootState {
      events = $state<InitEvent[]>([]);
      complete = $state(false);
      error = $state<string | null>(null);

      get currentStep(): string | null {
          const running = this.events.filter(e => e.status === 'Running');
          return running.length > 0 ? running[running.length - 1].step : null;
      }

      get completedSteps(): InitEvent[] {
          return this.events.filter(e => e.status === 'Ok');
      }

      get progress(): number {
          // Total expected steps = 5 (dirs + 4 stores)
          // Adjust dynamically based on events received
          const total = Math.max(5, this.events.length);
          const done = this.completedSteps.length;
          return Math.round((done / total) * 100);
      }

      get totalLatencyMs(): number {
          return this.events
              .filter(e => e.latency_ms !== null)
              .reduce((sum, e) => sum + (e.latency_ms ?? 0), 0);
      }

      addEvent(event: InitEvent): void {
          this.events.push(event);
      }

      markComplete(): void {
          this.complete = true;
      }
  }

  export const bootState = new BootState();
  ```

### 2.3 Add feature flag
- [ ] `interfaces/desktop/src/lib/sys/cfg/flags.ts` — add:
  ```typescript
  // 4. STARTUP EXPERIENCE
  ENABLE_BOOT_UI: true,  // Splashscreen during Platform::boot()
  ```

### 2.4 Verify Phase 2
- [ ] `pnpm svelte-check` — 0 errors

---

## Phase 3: Splashscreen Route + Event Wiring

### 3.1 Create splashscreen route
- [ ] CREATE `interfaces/desktop/src/routes/splashscreen/+page.svelte`:
  ```svelte
  <script lang="ts">
  import { listen } from '@tauri-apps/api/event';
  import { onMount } from 'svelte';
  import { bootState } from '$lib/sys/runes/bootState.svelte.js';
  import { flags } from '$lib/sys/cfg/flags.js';
  import type { InitEvent } from '$lib/sys/generated/init.types.js';
  import TechnicalBootView from './TechnicalBootView.svelte';
  import FriendlyBootView from './FriendlyBootView.svelte';

  onMount(() => {
      const unlistenBoot = listen<InitEvent>('platform:boot', (e) => {
          bootState.addEvent(e.payload);
      });
      const unlistenComplete = listen('platform:boot-complete', () => {
          bootState.markComplete();
      });

      return () => {
          unlistenBoot.then(fn => fn());
          unlistenComplete.then(fn => fn());
      };
  });
  </script>

  {#if flags.DEV_MODE}
      <TechnicalBootView />
  {:else}
      <FriendlyBootView />
  {/if}
  ```

### 3.2 Create splashscreen layout (no app chrome)
- [ ] CREATE `interfaces/desktop/src/routes/splashscreen/+layout.svelte`:
  ```svelte
  <script lang="ts">
  import '../../app.css';
  let { children } = $props();
  </script>

  <div class="splashscreen-root" data-tauri-drag-region>
      {@render children()}
  </div>

  <style>
  .splashscreen-root {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: var(--color-surface-base, #0a0a0f);
      color: var(--color-text-primary, #e0e0e8);
      font-family: var(--font-family-sans, system-ui);
  }
  </style>
  ```

### 3.3 Verify Phase 3
- [ ] `pnpm svelte-check` — 0 errors
- [ ] Route loads at `/splashscreen`

---

## Phase 4: Dev Mode — Technical Boot View

### 4.1 Create TechnicalBootView
- [ ] CREATE `interfaces/desktop/src/routes/splashscreen/TechnicalBootView.svelte`:

  Renders raw InitEvents in terminal-style output:
  ```
  DevPulse Platform v0.1.0

  --- Platform Boot ---
    [>] Data layer: Creating data directories
    [+] Data layer: Directories ready (2ms)
    [>] Relational store: Opening database
    [+] Relational store (12ms)
    [>] Analytics store: Opening database
    [+] Analytics store (8ms)
    [>] Graph store: Opening database
    [+] Graph store (1.2s)
    [>] Cache store: Initializing in-memory cache
    [+] Cache store (0ms)

  --- Verification ---
    Platform Healthy — 4 store(s) verified (1.4s total)
  ```

  Requirements:
  - Monospace font (`var(--font-family-mono)`)
  - Auto-scrolling log output
  - Status symbols: `>` running, `+` ok, `!` error, `-` skipped
  - Raw step names (not friendly — dev wants to see "Graph store" not "Knowledge Graph")
  - Latency shown for every completed step
  - Total elapsed time at bottom
  - Spinner animation on currently running step

### 4.2 Verify Phase 4
- [ ] `pnpm svelte-check` — 0 errors
- [ ] Visual: dev mode shows terminal-style output during boot

---

## Phase 5: Production Mode — Friendly Boot View

### 5.1 Create DB name mapping
- [ ] CREATE `interfaces/desktop/src/routes/splashscreen/boot-labels.ts`:
  ```typescript
  /** Maps Platform::boot() step names to user-friendly labels. */
  export const FRIENDLY_LABELS: Record<string, { label: string; icon: string }> = {
      'Data layer':        { label: 'System',           icon: 'gear' },
      'Relational store':  { label: 'Data Store',       icon: 'database' },
      'Analytics store':   { label: 'Analytics Engine',  icon: 'chart' },
      'Graph store':       { label: 'Knowledge Graph',   icon: 'brain' },
      'Cache store':       { label: 'Memory Cache',      icon: 'lightning' },
      // Future:
      // 'Vector store':   { label: 'Search Engine',     icon: 'search' },
  };

  /** Resolve a step name to its friendly label. Falls back to raw name. */
  export function friendlyLabel(step: string): string {
      return FRIENDLY_LABELS[step]?.label ?? step;
  }
  ```

### 5.2 Create FriendlyBootView
- [ ] CREATE `interfaces/desktop/src/routes/splashscreen/FriendlyBootView.svelte`:

  Renders a clean, professional loading screen:
  ```
            DevPulse

    ✓  Data Store         Ready
    ✓  Analytics Engine   Ready
    ◼  Knowledge Graph    Starting up...
    ○  Memory Cache       Waiting

    ━━━━━━━━━━━━━━━━━━━━━ 60%

         Setting up your workspace...
  ```

  Requirements:
  - Compose existing ColdLight components: `Progress` (determinate, step count), `Spinner` (on running step)
  - ColdLight design tokens for colors, spacing, typography
  - Friendly names from `boot-labels.ts`
  - Status indicators: ✓ (ok), ◼ (running with pulse animation), ○ (waiting), ✗ (error)
  - Progress bar showing percentage (completed steps / total steps)
  - Bottom message: contextual ("Setting up your workspace...", "Almost ready...", "Ready!")
  - DevPulse logo/wordmark at top
  - No technical details — no latencies, no raw names, no step messages
  - Smooth transitions between states (Svelte transitions)

### 5.3 Verify Phase 5
- [ ] `pnpm svelte-check` — 0 errors
- [ ] Visual: production mode shows friendly loading screen

---

## Phase 6: Integration + Polish

### 6.1 Handle error states
- [ ] Both views show error state if any step fails:
  - Dev: `[!] Graph store — kv-surrealkv failed to open (see errors above)`
  - Prod: `Knowledge Graph: Failed to start. Please restart the application.`
- [ ] Splashscreen stays visible on error (doesn't swap to blank main window)
- [ ] Retry button in production mode (re-invokes boot via IPC)

### 6.2 Handle rapid boot (warm cache)
- [ ] If all steps complete in < 500ms, show splashscreen for minimum 1s (avoid flash)
- [ ] Boot state tracks `firstEventTime` for minimum display calculation

### 6.3 Verify end-to-end
- [ ] `cargo xtask run-dev` — splashscreen appears, shows dev view, transitions to app
- [ ] Simulated production build — splashscreen shows friendly view
- [ ] Error simulation — disable a store in config, verify error state renders
- [ ] Cold boot (delete data dir) — verify full initialization sequence visible
- [ ] Warm boot — verify fast transition with minimum display time

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `src-tauri/tauri.conf.json` | Add splashscreen window, hide main |
| MODIFY | `src-tauri/src/lib.rs` | Event bridge + window swap |
| CREATE | `sys/generated/init.types.ts` | InitEvent + InitStatus TS types |
| CREATE | `sys/runes/bootState.svelte.ts` | Boot progress rune singleton |
| MODIFY | `sys/cfg/flags.ts` | Add ENABLE_BOOT_UI flag |
| CREATE | `routes/splashscreen/+layout.svelte` | Splashscreen layout (no app chrome) |
| CREATE | `routes/splashscreen/+page.svelte` | Splashscreen page (mode switch) |
| CREATE | `routes/splashscreen/TechnicalBootView.svelte` | Dev mode renderer |
| CREATE | `routes/splashscreen/FriendlyBootView.svelte` | Production mode renderer |
| CREATE | `routes/splashscreen/boot-labels.ts` | DB friendly name mapping |

---

## QUESTIONS FOR OWNER

### Q1: Splashscreen Dimensions
Proposed: 480x360, centered, no decorations, transparent background. Acceptable?

### Q2: DevPulse Logo
Is there a logo/wordmark SVG for the splashscreen? Or use text only for now?

### Q3: Minimum Display Time
Proposed: 1 second minimum (avoid flash on warm boot). Or should warm boot skip splashscreen entirely?

### Q4: Error Recovery
Should production mode offer a "Retry" button that re-attempts Platform::boot()? Or just "Restart Application"?

### Q5: xtask Stage Unification
Currently dev mode shows TWO outputs (terminal + splashscreen). Future sprint to unify xtask stages into the splashscreen UI? Or is terminal + splashscreen the intended split?

### Q6: Additional Progress Steps
Future sprints will add: model download progress, database seeding, vector store init. Should the UI be designed now to accommodate an unknown number of steps, or hardcode the current 5?

---

## Parking Lot

- [ ] xtask stage → splashscreen unification (named pipe / IPC)
- [ ] Model download/loading progress in boot UI
- [ ] Database seeding progress visualization
- [ ] Animated transitions between steps (ColdLight motion tokens)
- [ ] Boot performance profiling (identify which step is slowest, show tips)
- [ ] Retry individual failed steps without full restart
- [ ] Custom splash themes (ColdLight recipe for splash)
