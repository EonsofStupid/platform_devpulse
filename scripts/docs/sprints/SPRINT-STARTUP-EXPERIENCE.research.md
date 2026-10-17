# Research: Dual-Mode Startup Experience

**Date**: 2026-03-05
**Sprint**: SPRINT-STARTUP-EXPERIENCE
**Status**: COMPLETE

## Question/Goal

Design the dual-mode loading UI that shows real-time system initialization progress when the desktop app launches. Two modes:

- **Dev mode**: Technical/transparent — shows exactly what's happening (DB names, crate counts, latencies, raw events)
- **Production mode**: Layman-friendly — shows friendly names, grouped progress, simplified status

Feature-flagged via `sys/cfg/flags.ts`. Must work with the existing `Platform::boot()` callback system, Tauri event bridge, and ColdLight design system.

---

## Codebase Analysis

### A. Platform::boot() — Already Has Event System

**File**: `systems/devpulse-engine/src/platform/mod.rs:58-136`

The boot sequence already emits structured `InitEvent`s via a callback:

```rust
pub async fn boot(
    data_dir: PathBuf,
    on_event: impl Fn(InitEvent),
) -> Result<Self> {
    // Step 1: ensure_store_dirs
    // Step 2: Relational store (LibSQL) — on_event(Running) → on_event(Ok + latency)
    // Step 3: Analytics store (DuckDB) — same pattern
    // Step 4: Graph store (SurrealDB) — same pattern (SLOWEST: 60-90s cold)
    // Step 5: Cache store (Moka) — same pattern (instant)
}
```

**InitEvent** (`platform/init.rs`):
```typescript
// Already ts-rs exported
interface InitEvent {
    step: string;         // IP-safe name ("Relational store", "Graph store", etc.)
    status: InitStatus;   // "Running" | "Ok" | "Error" | "Skipped"
    message: string | null;
    latency_ms: number | null;
}
```

**CRITICAL**: The step names are already IP-safe via `ip_term!()`. The engine layer NEVER leaks "SurrealDB", "LibSQL", etc. It says "Relational store", "Graph store", "Analytics store", "Cache store".

### B. Tauri Setup Hook — Currently Stderr Only

**File**: `interfaces/desktop/src-tauri/src/lib.rs:21-95`

The setup hook boots the platform and prints to stderr:
```rust
.setup(|app| {
    let rt = tokio::runtime::Runtime::new()?;
    let platform = rt.block_on(async {
        Platform::boot(data_dir, |event| {
            // Currently: eprintln! only
            // PROBLEM: No way for frontend to see these events
        }).await
    })?;
    // Post-boot: health verification (also stderr only)
    app.manage(AppState { platform: Arc::new(platform) });
})
```

**KEY CONSTRAINT**: Boot happens inside `setup()` which runs BEFORE the webview loads. The main window doesn't exist yet when these events fire.

### C. Frontend Infrastructure

#### Feature Flags (`sys/cfg/flags.ts`)
```typescript
export const flags = {
    DEV_MODE: import.meta.env.DEV,  // Auto-true in dev
    ENABLE_OVERMIND: true,
    ENABLE_WIREDFRONT: true,
    // No boot UI flag yet
};
```

#### Health Rune (`sys/runes/health.svelte.ts`)
Pattern to follow: Svelte 5 class with `$state` fields, polling, IPC invoke. Singleton export.

#### Root Layout (`routes/+layout.svelte`)
Starts health polling on mount. This is where boot UI integration would go.

#### Generated Types (`sys/generated/health.types.ts`)
Already has `SystemHealth`, `SubsystemHealth`, `HealthStatus` — mirrors Rust types via ts-rs.

### D. xtask Pipeline — Terminal Experience to Mirror

**File**: `xtask/src/commands/dev.rs` (7 stages)

| Stage | What | Duration |
|-------|------|----------|
| 1. Banner | Print version | Instant |
| 2. Job Object | Windows child lifecycle | Instant |
| 3. Zombie cleanup | Kill stale processes | 0-5s |
| 4. Port check | Ensure :1420 free | Instant |
| 5. Pre-flight | Validate toolchain | 1-2s |
| 6. Backend compile | `cargo check -p devpulse_desktop_backend` | 2s (warm) - 12min (cold) |
| 7. Launch | `pnpm tauri dev` → which triggers Tauri setup → `Platform::boot()` | 60-120s (SurrealDB cold) |

**Observation**: The user currently experiences TWO boot sequences:
1. **xtask** (terminal): stages 1-7, visible as Stage output
2. **Platform::boot()** (also terminal via stderr): steps 1-5, only visible if you read stderr

In production (.exe/.dmg), there is NO xtask. Only `Platform::boot()` runs, and there's NO UI — just a blank window while SurrealDB takes 90 seconds to initialize.

### E. Existing Sprint Overlap

**SPRINT-PLATFORM-WIRING** (Phase 5.4) already planned:
- `sys/runes/bootState.svelte.ts` — boot progress rune
- Wire Tauri setup hook to emit init events to frontend
- But it's a sub-task in a massive sprint, not a focused implementation

**SPRINT-XTASK-FOUNDATION-V2** mentions "dev-time visibility layer" but focuses on CLI commands.

---

## Architecture Design

### The Core Problem

```
CURRENT (dev):   xtask terminal → stderr events → user reads terminal → eventually window appears
CURRENT (prod):  double-click .exe → BLANK WINDOW for 60-90s → app appears
DESIRED (dev):   xtask terminal + LIVE UI PANEL showing same events → app appears
DESIRED (prod):  double-click .exe → LOADING SCREEN with friendly progress → app appears
```

### Solution: Tauri Splashscreen + Event Bridge

**Tauri 2.0 supports splashscreens natively**. The pattern:

1. **Declare two windows** in `tauri.conf.json`:
   - `splashscreen` — small, centered, no decorations, shows during boot
   - `main` — the real app, starts hidden

2. **Boot sequence** emits events to splashscreen via `app.emit()`:
   ```rust
   Platform::boot(data_dir, |event| {
       // Still print to stderr for terminal visibility
       eprintln!("  [{symbol}] {}{msg}{latency}", event.step);
       // ALSO emit to any listening webview
       let _ = app_handle.emit("platform:boot", &event);
   })
   ```

3. **Splashscreen page** listens for events and renders progress:
   ```svelte
   <script>
   import { listen } from '@tauri-apps/api/event';
   let steps = $state<InitEvent[]>([]);

   $effect(() => {
       const unlisten = listen('platform:boot', (e) => {
           steps.push(e.payload);
       });
       return () => unlisten.then(fn => fn());
   });
   </script>
   ```

4. **When boot completes**, the setup hook:
   ```rust
   app.emit("platform:boot-complete", &())?;
   // Show main window, close splashscreen
   app.get_webview_window("main").unwrap().show()?;
   app.get_webview_window("splashscreen").unwrap().close()?;
   ```

### Dual-Mode Rendering

The splashscreen page checks `flags.DEV_MODE` and renders differently:

#### Dev Mode (Technical)
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
  [...] Graph store: kv-surrealkv backend initializing
  [+] Graph store (1.2s)
  [>] Cache store: Initializing in-memory cache
  [+] Cache store (0ms)

--- Verification ---
  [+] Relational store (2ms)
  [+] Analytics store (1ms)
  [+] Graph store (3ms)
  [+] Cache store (0ms)
  Platform Healthy — 4 store(s) verified
```

This is literally the terminal output, but rendered in a styled window. Every raw event, every latency, every step name. Developers see exactly what's happening.

#### Production Mode (Layman)
```
Setting up DevPulse...

  ✓ Data Store          Ready
  ✓ Analytics Engine    Ready
  ◼ Knowledge Graph     Starting up...
  ○ Memory Cache        Waiting

  ━━━━━━━━━━━━━━━━━━━━━━ 60%
```

Friendly names. Progress bar. No technical details. No raw step names. Grouped into phases. The user sees a clean, professional loading experience.

### DB Name Mapping (Production Mode Only)

| Engine Step Name | Production Friendly Name | Icon |
|------------------|--------------------------|------|
| Data layer (Trinity) | System | gear |
| Relational store | Data Store | database |
| Analytics store | Analytics Engine | chart |
| Graph store | Knowledge Graph | brain/network |
| Cache store | Memory Cache | lightning |
| Vector store (future) | Search Engine | magnifying glass |
| Seed check (future) | First-time setup | sparkle |

This mapping lives in the frontend only — the Rust layer stays IP-safe with generic names. The frontend adds the friendly labels for production mode.

### Event Flow Architecture

```
Platform::boot()
    │
    ├── on_event(InitEvent) callback
    │       │
    │       ├── eprintln!() → terminal (dev only, always)
    │       │
    │       └── app_handle.emit("platform:boot", event) → Tauri event bus
    │               │
    │               └── Splashscreen webview
    │                       │
    │                       ├── bootState rune receives event
    │                       │
    │                       └── flags.DEV_MODE?
    │                           ├── true  → TechnicalBootView
    │                           └── false → FriendlyBootView
    │
    └── boot complete
            │
            ├── app_handle.emit("platform:boot-complete")
            ├── show main window
            └── close splashscreen
```

---

## Findings

### 1. Infrastructure Is 80% Ready
- `InitEvent` + `InitStatus` types exist and are ts-rs exported
- `Platform::boot()` already has the callback pattern
- The callback already gets called for every step
- Health types exist in TypeScript
- The health rune pattern is established

### 2. Existing ColdLight Components to Compose

The design system already has loading primitives — DO NOT rebuild these:

- **LoadingOverlay** (`components/loading-overlay/`) — full-screen, 3 slots (root, spinner, label), `role="alert"`, `aria-busy`, show/hide methods. NOT yet exported from public API.
- **Spinner** (`components/spinner/`) — sm/md/lg animated indicator. Exported at `$lib/design/index.ts:49`.
- **Progress** (`components/progress/`) — determinate + indeterminate, `role="progressbar"`, `aria-valuenow`. Exported at `$lib/design/index.ts:60`.
- **Skeleton** (`components/skeleton/`) — content placeholder. Exported at `$lib/design/index.ts:50`.

The FriendlyBootView should compose Progress (determinate, step-based) + Spinner (for currently-running step). The TechnicalBootView is text-only (no ColdLight components needed — it's a terminal log).

### 3. Missing Pieces (What This Sprint Builds)
- **Tauri splashscreen window declaration** (tauri.conf.json)
- **Event bridge in setup hook** (`app.emit()` in the on_event callback)
- **`bootState.svelte.ts`** — Svelte 5 rune that collects InitEvents
- **Boot complete signal** — setup hook emits completion + swaps windows
- **Splashscreen SvelteKit route** — `/splashscreen` or separate HTML
- **Dual-mode renderer** — TechnicalBootView + FriendlyBootView
- **DB friendly name map** — frontend-only mapping
- **Feature flag** — `ENABLE_BOOT_UI` in flags.ts
- **Generated InitEvent type** in `sys/generated/init.types.ts`

### 3. Critical Constraint: Tauri Splashscreen Timing
Tauri splashscreen is a **separate webview** that loads a simple HTML/page while setup() runs. The main window stays hidden until setup() calls `show()`. This is the correct pattern for our use case — the splashscreen can receive Tauri events while `Platform::boot()` is running in the setup hook.

### 4. Dev Mode Captures BOTH Boot Phases
In dev mode, the user sees:
- **xtask stages** in the terminal (zombie cleanup, port check, preflight, cargo compile)
- **Platform::boot() stages** in the splashscreen window (store initialization, health checks)

This means the dev startup experience is split across two outputs. Future enhancement: xtask could also emit events to a named pipe or socket that the splashscreen reads, unifying both into one view. But that's a parking lot item — for now, terminal + splashscreen is fine.

### 5. Production Mode Is the Primary Motivation
The user's actual pain: launching the .exe/.dmg gives a blank window for 60-90s while SurrealDB initializes. This is unacceptable. The splashscreen solves it completely.

---

## Recommendations

### Sprint Structure

**Phase 1**: Tauri infrastructure (Rust side)
- Add `app_handle` to the on_event closure so it can emit events
- Declare splashscreen window in tauri.conf.json
- Emit `platform:boot` events during setup
- Emit `platform:boot-complete` when done
- Window swap logic (show main, close splashscreen)

**Phase 2**: Frontend boot state (TypeScript side)
- Generate `InitEvent` / `InitStatus` types (ts-rs already exports them)
- Create `bootState.svelte.ts` rune
- Create `/splashscreen` route or standalone HTML
- Wire Tauri event listener to bootState rune

**Phase 3**: Dev mode view
- TechnicalBootView.svelte — renders raw events like terminal output
- Monospace font, stage brackets, latencies, raw step names
- Scrolling log output with timestamps

**Phase 4**: Production mode view
- FriendlyBootView.svelte — renders friendly names with progress
- DB name mapping constant
- Progress bar (step count / total count)
- Icon per subsystem
- ColdLight-styled (uses design tokens)

**Phase 5**: Feature flag + integration
- Add `ENABLE_BOOT_UI` to flags.ts
- Root layout checks flag before showing splashscreen route
- Verify both modes work end-to-end

### What This Sprint Does NOT Cover
- xtask event unification (xtask stages in the UI) — parking lot
- Model loading progress — needs model download system first
- System health detail panel — already in SPRINT-PLATFORM-WIRING Phase 5.5
- Database seeding progress — already in SPRINT-PLATFORM-WIRING Phase 4.5

---

## Files Referenced

- `systems/devpulse-engine/src/platform/mod.rs` — Platform::boot() with on_event callback
- `systems/devpulse-engine/src/platform/init.rs` — InitEvent, InitStatus types
- `interfaces/desktop/src-tauri/src/lib.rs` — Tauri setup hook, current stderr printing
- `interfaces/desktop/src-tauri/src/state.rs` — AppState structure
- `interfaces/desktop/src/lib/sys/cfg/flags.ts` — Feature flags (DEV_MODE)
- `interfaces/desktop/src/lib/sys/runes/health.svelte.ts` — Pattern for boot rune
- `interfaces/desktop/src/lib/sys/generated/health.types.ts` — Generated TS types
- `interfaces/desktop/src/routes/+layout.svelte` — Root layout (health polling start)
- `xtask/src/commands/dev.rs` — 7-stage pipeline to mirror
- `xtask/src/stage.rs` — Stage reporting pattern
- `scripts/docs/sprints/SPRINT-PLATFORM-WIRING.md` — Related sprint with bootState rune planned
