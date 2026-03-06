# Sprint: Foundation V2 — Progressive Boot, Structured Logging, Dev Tooling

**Date**: 2026-03-06
**Research**: [SPRINT-FOUNDATION-V2.research.md](SPRINT-FOUNDATION-V2.research.md)
**Status**: IN PROGRESS — Phases 1-3 DONE, SurrealDB and LibSQL BROKEN, Phase 4+ NOT STARTED

## Goal
Replace the dead splashscreen with enterprise-grade progressive hydration.
Single window, always visible. Subsystems boot in the background. The app shell
renders instantly. StatusBar shows real-time boot progress. Structured logging
with file persistence. Dev tooling verified.

## Architecture: Progressive Hydration (NOT Splashscreen)

```
setup() returns instantly
    |
    v
Main window visible -- Shell renders (topbar, sidebar, statusbar)
    |                       |
    v                       v
spawn(boot_task)       StatusBar: "Initializing..."
    |
    +-- LibSQL ready ------> StatusBar: [Data Store: ready 12ms]
    +-- DuckDB ready ------> StatusBar: [Analytics: ready 45ms]
    +-- SurrealDB ready ----> StatusBar: [Knowledge Graph: ready 340ms]
    +-- Moka ready ---------> StatusBar: [Memory Cache: ready 1ms]
    |
    v
All ready ------------------> StatusBar transitions to health display
                              Content panels hydrate
```

## Prerequisites
- [x] Full codebase audit completed
- [x] External research: Tauri 2.0 async setup, tracing-subscriber, progressive hydration
- [x] Research document written with architecture decision documented

---

## Phase 1: Delete Splashscreen, Enable Main Window

### 1.1 Remove splashscreen window from Tauri config
- [x] Edit `interfaces/desktop/src-tauri/tauri.conf.json`:
  - DELETE the splashscreen window entry
  - Set main window `"visible": true`
- [x] Verify: only main + chat windows remain

### 1.2 Delete splashscreen route group
- [x] DELETE `interfaces/desktop/src/routes/(splashscreen)/+layout.svelte`
- [x] DELETE `interfaces/desktop/src/routes/(splashscreen)/splashscreen/+page.svelte`
- [x] DELETE `interfaces/desktop/src/routes/(splashscreen)/splashscreen/TechnicalBootView.svelte`
- [x] DELETE `interfaces/desktop/src/routes/(splashscreen)/splashscreen/FriendlyBootView.svelte`
- [x] MOVE `boot-labels.ts` to `$lib/sys/boot/boot-labels.ts` (reused by StatusBar)

### 1.3 Remove ENABLE_BOOT_UI flag
- [x] Remove `ENABLE_BOOT_UI` from `flags.ts` (no longer a separate feature -- boot UI IS the app)

---

## Phase 2: Rust Backend — Async Boot + Tracing

### 2.1 Add tracing dependencies
- [x] Add to workspace deps in root `Cargo.toml`:
  - `tracing = "0.1"`
  - `tracing-subscriber = { version = "0.3", features = ["json", "env-filter"] }`
  - `tracing-appender = "0.2"`
- [x] Add `tracing = { workspace = true }` to:
  - `systems/devpulse-engine/Cargo.toml`
  - `interfaces/desktop/src-tauri/Cargo.toml`
- [x] Add `tracing-subscriber = { workspace = true }` and `tracing-appender = { workspace = true }` to:
  - `interfaces/desktop/src-tauri/Cargo.toml`
- [x] `cargo check --workspace`

### 2.2 Engine: Make Platform::boot() callback Send-compatible
- [x] In `systems/devpulse-engine/src/platform/mod.rs`:
  - Change `on_event: impl Fn(InitEvent)` to `on_event: impl Fn(InitEvent) + Send + 'static`
- [x] `cargo check -p devpulse-engine`

### 2.3 Rewrite AppState to PlatformState
- [x] Rewrite `interfaces/desktop/src-tauri/src/state.rs`:
  ```rust
  pub struct PlatformState {
      pub platform: RwLock<Option<Arc<Platform>>>,
  }
  ```
- [x] PlatformState starts with `platform: RwLock::new(None)` -- filled after boot

### 2.4 Create tracing initialization module
- [x] Create `interfaces/desktop/src-tauri/src/logging.rs`:
  - `init(data_dir)` -- single-phase: stderr (compact) + JSON file in one registry, returns WorkerGuard
  - `init_stderr_only()` -- fallback if data_dir unavailable
  - `rotate_logs(data_dir)` -- scan `{data_dir}/logs/`, keep last 3, delete rest
  - Log filenames: `session-{YYYY-MM-DD-HHmmss}.jsonl`

### 2.5 Rewrite lib.rs — async boot with progressive events
- [x] Rewrite `interfaces/desktop/src-tauri/src/lib.rs`:
  1. In `setup()`:
     - Resolve data_dir
     - `logging::rotate_logs(&data_dir)` + `logging::init(&data_dir)`
     - `std::mem::forget(guard)` to keep file logging alive for process lifetime
     - `app.manage(PlatformState { platform: RwLock::new(None) })`
     - `tauri::async_runtime::spawn(boot_task(app.handle().clone(), data_dir))`
     - Return `Ok(())` immediately
  2. `boot_task()`:
     - Emit `platform:boot-phase` with phase = "initializing"
     - Call `Platform::boot(data_dir, callback)`
     - Callback emits `platform:subsystem-status` per store (name, state, latency)
     - After boot: run health verification
     - Store `Arc<Platform>` in managed PlatformState
     - Emit `platform:boot-phase` with phase = "ready" (or "failed")
- [x] Update all IPC commands to handle `platform: None`:
  - Lock PlatformState, check if Some, return error if None (boot in progress)
- [x] `cargo check -p devpulse_desktop_backend`

### 2.6 Engine: Replace eprintln with tracing
- [x] Replace `eprintln!()` calls in `platform/mod.rs` with `tracing::info!()` / `tracing::warn!()`
- [x] Add structured fields: `step`, `status`, `latency_ms`
- [x] Keep InitEvent callback -- it serves the UI, tracing serves the log file
- [x] `cargo check -p devpulse-engine`

### 2.7 Desktop Backend: Replace eprintln with tracing
- [x] Replace all remaining `eprintln!()` in lib.rs with tracing macros
- [x] `cargo check -p devpulse_desktop_backend`

---

## Phase 3: Frontend — Progressive Boot State + StatusBar

### 3.1 Create unified platform state rune
- [x] Create `$lib/sys/runes/platformState.svelte.ts`:
  - Merges bootState + health into one reactive class
  - Tracks: `phase` (initializing | ready | failed)
  - Tracks: `subsystems` map (name -> { state, latency_ms, friendlyName })
  - Listens for Tauri events: `platform:boot-phase`, `platform:subsystem-status`
  - After boot complete: starts health polling (absorbs health.svelte.ts behavior)
  - Exposes: `isReady`, `isBooting`, `hasFailed`, `subsystemStatus(name)`, `progress`
- [x] DELETE `bootState.svelte.ts` (absorbed into platformState)
- [x] DELETE `health.svelte.ts` (absorbed into platformState)

### 3.2 Update generated types
- [x] Types defined inline in `platformState.svelte.ts` (BootPhase, SubsystemState, SubsystemInfo)
- [x] Uses existing `init.types.ts` for InitEvent, InitStatus

### 3.3 Update StatusBar with boot progress
- [x] Rewrite `StatusBar.svelte` with 3 modes:
  - Dev mode: per-subsystem badges with state dots and latencies
  - Prod mode: "Starting up... X of Y systems ready" / "All systems operational"
  - Health display: connection status, per-store detail (dev), uptime, version
- [x] CSS animations for loading state (pulse on loading dots)

### 3.4 Update root layout
- [x] In `+layout.svelte`: uses `platformState.init()` for event listeners + health polling

### 3.5 Content area loading states (convention, not enforcement)
- [x] Chat page checks `platformState.isReady`, `isBooting`, `hasFailed`
- [x] Shows degraded/booting banners
- [ ] **NOT DONE**: Loading skeletons, proper content-area states for other routes

---

## Phase 4: Dev Tooling

### 4.1 Lefthook preflight check
- [ ] Add `check_lefthook()` to `xtask/src/commands/preflight.rs`
- [ ] Check: `which lefthook` resolves
- [ ] If missing: warn with install instructions (`cargo install lefthook` or `winget install lefthook`)
- [ ] Not fatal -- warn only (CI doesn't use lefthook)
- [ ] `cargo check -p xtask`

### 4.2 Verify lefthook is working
- [ ] Install lefthook if not present
- [ ] Run `lefthook install` to ensure hooks are current
- [ ] Test: make a commit, verify hooks fire

---

## Phase 5: DB Git Deps (NEEDS OWNER DECISION)

### Option A: Keep crates.io (recommended for stability)
- Current: `libsql = "0.9"`, `duckdb = "1.1"`, `surrealdb = "3.0"`
- Pros: stable APIs, faster builds, reproducible
- Cons: not bleeding edge

### Option B: Switch to git
- `libsql = { git = "https://github.com/tursodatabase/libsql" }`
- `surrealdb = { git = "https://github.com/surrealdb/surrealdb" }`
- `duckdb = { git = "https://github.com/duckdb/duckdb-rs" }`
- Pros: latest code
- Cons: API breaks, 10x longer builds, DuckDB C++ compile from source

### Option C: Pin git to release tags
- Best of both: latest release but from source
- `surrealdb = { git = "...", tag = "v3.0.0" }`

**Decision needed from owner before executing Phase 5.**

---

## Phase 6: RRO Integration (Cortex — IP Sensitive)

RRO = Reason Ready Object. Part of the AI reasoning system. IP-sensitive.

### Architecture Placement
- Lives in `kernel/devpulse-maestro/cortex/` alongside existing persistence adapters
- `wal` = Write-Ahead Log for RRO (Qdrant fork foundation)
- `rro` = Reason Ready Object engine (vector reasoning layer)
- `tar-rs` = Archive support for RRO state serialization
- Consumed by: `devpulse-maestro/cortex/persistence/` as a new adapter type
- Exposed through: `devpulse-engine/platform/stores/` as a new `StoreRole::Reasoning`

### 6.1 Wire RRO into maestro cortex
- [ ] Create `kernel/devpulse-maestro/src/cortex/persistence/rro.rs` -- RRO adapter
- [ ] Add `RroAdapter` implementing `PersistenceAdapter` (like SurrealAdapter)
- [ ] Wire `wal` + `rro` dependencies in maestro's Cargo.toml (already in workspace)
- [ ] `cargo check -p devpulse-maestro`

### 6.2 Expose through engine platform
- [ ] Add `StoreRole::Reasoning` to `stores/mod.rs`
- [ ] Create `stores/reasoning.rs` -- wraps RRO adapter like other stores
- [ ] Add to `PlatformBootConfig` as `stores.reasoning` entry
- [ ] Add to `Platform::boot()` initialization sequence
- [ ] `cargo check -p devpulse-engine`

### 6.3 Update platform.default.toml
- [ ] Add `[stores.reasoning]` section with enabled/path/kind defaults

---

## BLOCKER: SurrealDB Fails on Fresh Install

**Status**: STILL BROKEN as of 2026-03-06

SurrealDB fails to open even on a BRAND NEW empty directory. The resilient boot
catches the error (no longer crashes), but SurrealDB is ALWAYS None (degraded).

What was done:
- [x] Resilient boot wraps every store in match — failed = None, not crash
- [x] Auto-recovery: clears stale data dir, retries once
- [ ] **STILL BROKEN**: Even fresh directory fails

Suspected root cause: `SurrealKv` backend path handling.
The path logged: `surrealkv://C:\Users\jessa\AppData\Roaming\com.devpulse.desktop\surreal\reasoning`
Windows backslashes in a URI scheme may cause SurrealKV to choke.

### Fix needed:
- [ ] In `surreal.rs`: change `.context("Failed to open SurrealDB")` to expose FULL error chain
- [ ] Log the exact path being passed to `Surreal::new::<SurrealKv>(path)`
- [ ] Convert path to forward slashes or use `path.to_string_lossy().replace('\\', '/')` before passing to SurrealKV
- [ ] Test on clean data directory

---

## Verification Checklist
- [ ] `cargo check --workspace` passes
- [ ] `cargo xtask run-dev`:
  - Main window appears IMMEDIATELY with app shell
  - StatusBar shows per-subsystem boot progress in real time
  - Content area shows loading state during boot
  - StatusBar transitions to health display after all stores ready
- [ ] `cargo xtask verify` -- svelte-check + cargo check pass
- [ ] Log files created in `{data_dir}/logs/`
- [ ] Previous session logs preserved (up to 3)
- [ ] `pnpm svelte-check` passes (no splashscreen import errors)
- [ ] Lefthook hooks fire on commit

## Execution Order
1. Phase 1 (delete splashscreen) -- clean slate
2. Phase 2.1-2.2 (deps + Send callback) -- foundation
3. Phase 2.3-2.5 (state + tracing + async boot) -- core rewrite
4. Phase 2.6-2.7 (tracing migration) -- logging
5. Phase 3.1-3.4 (frontend state + StatusBar) -- progressive UI
6. Phase 4 (lefthook) -- dev tooling
7. Verification checklist
8. Phases 5-6 after owner decisions
