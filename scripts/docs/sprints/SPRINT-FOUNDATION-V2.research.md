# Research: Foundation V2 — 7 Critical Fixes

**Date**: 2026-03-06
**Sprint**: SPRINT-FOUNDATION-V2
**Status**: COMPLETE (revised — splashscreen replaced with progressive hydration)

## Question/Goal
Fix the 7 broken/missing foundation items identified in full audit:
1. Async boot (was blocking setup, now: progressive hydration)
2. Structured logging (tracing + file rotation)
3. Lefthook installation verification
4. DB deps from git (latest sources)
5. RRO/Qdrant integration
6. Log persistence (last 3 sessions)
7. Boot progress in the REAL app UI (not a throwaway splashscreen)

## Architecture Decision: NO Splashscreen

### Why splashscreens are wrong for this platform
- Splashscreens are for toy apps. VS Code, Slack, Discord, Notion, Figma — none use them.
- A separate window that shows a spinner then swaps to the real window is amateur.
- For a massive hybrid platform with 4 embedded databases, AI orchestration, and
  online+local modes, the correct pattern is **progressive hydration**.

### What enterprise platforms do instead
1. **Single window, always visible** — main window opens instantly with the app shell
2. **App shell renders from static data** — topbar, sidebar, navigation, statusbar need zero backend
3. **Each panel shows loading/skeleton state** until its backing service is ready
4. **Subsystems hydrate independently** — Chat needs SurrealDB? It loads when SurrealDB is ready.
5. **StatusBar shows real-time system health** — dev mode: per-store detail, prod: clean progress

### What this means for DevPulse
- DELETE: `(splashscreen)/` route group, splashscreen window in tauri.conf.json
- KEEP: `bootState.svelte.ts` (repurposed — tracks subsystem readiness for the app shell)
- KEEP: `boot-labels.ts` (friendly name mapping — used by StatusBar in prod mode)
- KEEP: `TechnicalBootView` / `FriendlyBootView` concepts — rendered IN the StatusBar/content area
- UPGRADE: `health.svelte.ts` — merge boot progress + health into one reactive state
- UPGRADE: `StatusBar` — shows boot progress during init, transitions to health display

## Codebase Analysis

### Existing App Shell (ALREADY EXISTS — this is key)
- `Frame.svelte` — 6-zone CSS Grid: topbar, sidebar, content, context, statusbar, overlay
- `StatusBar.svelte` — exists, wired to `globalState`
- `TopBar.svelte` — exists
- `Sidebar.svelte` — exists
- `+layout.svelte` (root) — imports app.css, design system, starts health polling
- `(app)/+layout.svelte` — wraps in Frame, includes VPB debug panel

The shell ALREADY renders immediately. The problem is boot blocks setup(), so
nothing renders until boot completes. Fix async boot => shell appears instantly =>
StatusBar shows boot progress => panels hydrate as stores come online.

### Platform State Architecture (Current vs Needed)
**Current**: `AppState { platform: Arc<Platform> }` — all-or-nothing, set after full boot
**Needed**: `PlatformState` with per-subsystem readiness:
```rust
pub struct PlatformState {
    pub platform: RwLock<Option<Arc<Platform>>>,
    pub boot_status: RwLock<BootStatus>,
}

pub struct BootStatus {
    pub phase: BootPhase, // Initializing, Ready, Failed
    pub subsystems: Vec<SubsystemStatus>,
}

pub struct SubsystemStatus {
    pub name: String,
    pub role: StoreRole,
    pub state: SubsystemState, // Pending, Loading, Ready, Failed(String)
    pub latency_ms: Option<u64>,
}
```

### Frontend State (Current vs Needed)
**Current**: `bootState.svelte.ts` (splashscreen-only) + `health.svelte.ts` (polling after boot)
**Needed**: Single unified `platformState.svelte.ts`:
- Tracks boot phase: `initializing | ready | failed`
- Per-subsystem readiness: `pending | loading | ready | failed`
- Consumed by StatusBar for progress display
- Consumed by panels to show loading/skeleton until their store is ready
- After boot, transitions to health polling mode (same rune)

### Boot Event Flow (Revised)
1. `setup()` => resolve data_dir => init tracing => manage PlatformState => spawn boot => return Ok(())
2. Main window visible immediately. Shell renders. StatusBar shows "Initializing..."
3. Boot task emits per-subsystem events: `platform:subsystem-status`
4. Frontend `platformState` rune updates per event
5. StatusBar shows: `[LibSQL: ready 12ms] [DuckDB: loading...] [SurrealDB: ready] [Moka: ready]`
6. When all subsystems ready => emit `platform:ready` => StatusBar transitions to health display
7. If any subsystem fails => StatusBar shows error + retry option

### tauri.conf.json Changes
- DELETE splashscreen window entry
- Set main window `"visible": true` (was false)
- Keep chat window as-is

## External Research

### Tauri 2.0 Async Setup Pattern
Source: tauri-apps/tauri-docs

Key pattern — setup returns immediately, work spawned:
```rust
.setup(|app| {
    tauri::async_runtime::spawn(setup(app.handle().clone()));
    Ok(())
})
```

Managed state with `Mutex<Option<T>>` for data that arrives after setup.

### Tracing + File Rotation
Source: tracing-subscriber docs

Layered approach:
- Layer 1: stderr (pretty format, INFO level)
- Layer 2: file (JSON format, DEBUG level)
- `tracing-appender` for rolling file output
- Two-phase init: stderr first (before data_dir known), add file layer in setup

### Progressive Hydration References
- VS Code: workspace loads shell => extensions activate progressively => statusbar shows extension status
- Slack: app frame loads => channels load => messages hydrate per channel
- Notion: navigation loads => page skeleton => blocks hydrate

## Findings

### What to delete
- `(splashscreen)/` route group (layout, page, TechnicalBootView, FriendlyBootView)
- Splashscreen window from tauri.conf.json
- Window swap code from lib.rs (close splash, show main)

### What to keep and repurpose
- `bootState.svelte.ts` => rename/merge into `platformState.svelte.ts`
- `boot-labels.ts` => keep, move to `$lib/sys/`, consumed by StatusBar for friendly names
- `init.types.ts` => keep, add subsystem status types
- `health.svelte.ts` => merge into `platformState.svelte.ts`

### What to create
- `PlatformState` Rust struct (replaces `AppState`)
- `platformState.svelte.ts` (unified boot + health rune)
- Tracing initialization module
- Log rotation utility
- StatusBar boot progress display (dev + prod mode)
- Lefthook preflight check in xtask

## Files Referenced
- `interfaces/desktop/src-tauri/src/lib.rs`: Boot sequence (REWRITE)
- `interfaces/desktop/src-tauri/src/state.rs`: AppState (REWRITE to PlatformState)
- `interfaces/desktop/src-tauri/tauri.conf.json`: Window config (MODIFY)
- `interfaces/desktop/src-tauri/Cargo.toml`: Add tracing deps
- `systems/devpulse-engine/src/platform/mod.rs`: Platform::boot() (MODIFY signature)
- `systems/devpulse-engine/src/platform/init.rs`: InitEvent types (KEEP)
- `systems/devpulse-engine/Cargo.toml`: Add tracing dep
- `interfaces/desktop/src/lib/layouts/app/Frame.svelte`: App shell (KEEP, no changes)
- `interfaces/desktop/src/lib/layouts/app/StatusBar.svelte`: Boot progress display (MODIFY)
- `interfaces/desktop/src/lib/sys/runes/bootState.svelte.ts`: Merge into platformState
- `interfaces/desktop/src/lib/sys/runes/health.svelte.ts`: Merge into platformState
- `interfaces/desktop/src/lib/sys/cfg/flags.ts`: DEV_MODE drives status detail level
- `interfaces/desktop/src/routes/(splashscreen)/`: DELETE entire group
- `xtask/src/commands/preflight.rs`: Add lefthook check
- `Cargo.toml` (root): Workspace deps
