# Sprint: Foundation V2 — Progressive Boot, Structured Logging, Dev Tooling

**Date**: 2026-03-06
**Research**: [SPRINT-FOUNDATION-V2.research.md](SPRINT-FOUNDATION-V2.research.md)
**Status**: READY FOR APPROVAL

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
- [ ] Edit `interfaces/desktop/src-tauri/tauri.conf.json`:
  - DELETE the splashscreen window entry
  - Set main window `"visible": true`
- [ ] Verify: only main + chat windows remain

### 1.2 Delete splashscreen route group
- [ ] DELETE `interfaces/desktop/src/routes/(splashscreen)/+layout.svelte`
- [ ] DELETE `interfaces/desktop/src/routes/(splashscreen)/splashscreen/+page.svelte`
- [ ] DELETE `interfaces/desktop/src/routes/(splashscreen)/splashscreen/TechnicalBootView.svelte`
- [ ] DELETE `interfaces/desktop/src/routes/(splashscreen)/splashscreen/FriendlyBootView.svelte`
- [ ] MOVE `boot-labels.ts` to `$lib/sys/boot/boot-labels.ts` (reused by StatusBar)

### 1.3 Remove ENABLE_BOOT_UI flag
- [ ] Remove `ENABLE_BOOT_UI` from `flags.ts` (no longer a separate feature -- boot UI IS the app)

---

## Phase 2: Rust Backend — Async Boot + Tracing

### 2.1 Add tracing dependencies
- [ ] Add to workspace deps in root `Cargo.toml`:
  - `tracing = "0.1"`
  - `tracing-subscriber = { version = "0.3", features = ["json", "env-filter"] }`
  - `tracing-appender = "0.2"`
- [ ] Add `tracing = { workspace = true }` to:
  - `systems/devpulse-engine/Cargo.toml`
  - `interfaces/desktop/src-tauri/Cargo.toml`
- [ ] Add `tracing-subscriber = { workspace = true }` and `tracing-appender = { workspace = true }` to:
  - `interfaces/desktop/src-tauri/Cargo.toml`
- [ ] `cargo check --workspace`

### 2.2 Engine: Make Platform::boot() callback Send-compatible
- [ ] In `systems/devpulse-engine/src/platform/mod.rs`:
  - Change `on_event: impl Fn(InitEvent)` to `on_event: impl Fn(InitEvent) + Send + 'static`
- [ ] `cargo check -p devpulse-engine`

### 2.3 Rewrite AppState to PlatformState
- [ ] Rewrite `interfaces/desktop/src-tauri/src/state.rs`:
  ```rust
  pub struct PlatformState {
      pub platform: RwLock<Option<Arc<Platform>>>,
  }
  ```
- [ ] PlatformState starts with `platform: RwLock::new(None)` -- filled after boot

### 2.4 Create tracing initialization module
- [ ] Create `interfaces/desktop/src-tauri/src/logging.rs`:
  - `init_stderr()` -- pretty format, INFO level, called before builder
  - `init_file_layer(data_dir)` -- JSON format, DEBUG level, called in setup after data_dir known
  - `rotate_logs(data_dir)` -- scan `{data_dir}/logs/`, keep last 2, delete rest
  - Log filenames: `session-{YYYY-MM-DD-HHmmss}.jsonl`

### 2.5 Rewrite lib.rs — async boot with progressive events
- [ ] Rewrite `interfaces/desktop/src-tauri/src/lib.rs`:
  1. `logging::init_stderr()` -- first thing in `run()`
  2. In `setup()`:
     - Resolve data_dir
     - `logging::rotate_logs(&data_dir)` + `logging::init_file_layer(&data_dir)`
     - `app.manage(PlatformState { platform: RwLock::new(None) })`
     - `tauri::async_runtime::spawn(boot_task(app.handle().clone(), data_dir))`
     - Return `Ok(())` immediately
  3. `boot_task()`:
     - Emit `platform:boot-phase` with phase = "initializing"
     - Call `Platform::boot(data_dir, callback)`
     - Callback emits `platform:subsystem-status` per store (name, state, latency)
     - After boot: run health verification
     - Store `Arc<Platform>` in managed PlatformState
     - Emit `platform:boot-phase` with phase = "ready" (or "failed")
- [ ] Update all IPC commands to handle `platform: None`:
  - Lock PlatformState, check if Some, return error if None (boot in progress)
- [ ] `cargo check -p devpulse_desktop_backend`

### 2.6 Engine: Replace eprintln with tracing
- [ ] Replace `eprintln!()` calls in `platform/mod.rs` with `tracing::info!()` / `tracing::warn!()`
- [ ] Add structured fields: `step`, `status`, `latency_ms`
- [ ] Keep InitEvent callback -- it serves the UI, tracing serves the log file
- [ ] `cargo check -p devpulse-engine`

### 2.7 Desktop Backend: Replace eprintln with tracing
- [ ] Replace all remaining `eprintln!()` in lib.rs with tracing macros
- [ ] `cargo check -p devpulse_desktop_backend`

---

## Phase 3: Frontend — Progressive Boot State + StatusBar

### 3.1 Create unified platform state rune
- [ ] Create `$lib/sys/runes/platformState.svelte.ts`:
  - Merges bootState + health into one reactive class
  - Tracks: `phase` (initializing | ready | failed)
  - Tracks: `subsystems` map (name -> { state, latency_ms, friendlyName })
  - Listens for Tauri events: `platform:boot-phase`, `platform:subsystem-status`
  - After boot complete: starts health polling (absorbs health.svelte.ts behavior)
  - Exposes: `isReady`, `isBooting`, `hasFailed`, `subsystemStatus(name)`, `progress`
- [ ] Delete or deprecate `bootState.svelte.ts`
- [ ] Delete or deprecate `health.svelte.ts` (absorbed)

### 3.2 Update generated types
- [ ] Add to `$lib/sys/generated/init.types.ts`:
  ```typescript
  export type BootPhase = "initializing" | "ready" | "failed";
  export type SubsystemState = "pending" | "loading" | "ready" | "failed";
  export interface SubsystemStatusEvent {
      name: string;
      state: SubsystemState;
      latency_ms: number | null;
      message: string | null;
  }
  ```

### 3.3 Update StatusBar with boot progress
- [ ] Read current `StatusBar.svelte`
- [ ] Add boot progress display:
  - Dev mode (`flags.DEV_MODE`): per-subsystem status with latencies, store names
    - `[LibSQL: ready 12ms] [DuckDB: loading...] [SurrealDB: ready 340ms] [Moka: ready 1ms]`
  - Prod mode: clean progress
    - `Starting up... 3 of 4 systems ready` -> `All systems operational`
  - Uses `boot-labels.ts` for friendly names in prod mode
- [ ] After boot: StatusBar transitions to health display (uptime, connection status)

### 3.4 Update root layout
- [ ] In `+layout.svelte`: replace `platformHealth.startPolling()` with `platformState.init()`
  - `platformState.init()` sets up Tauri event listeners + starts health polling after boot

### 3.5 Content area loading states (convention, not enforcement)
- [ ] Each route page can check `platformState.isReady` or `platformState.subsystemStatus(name)`
- [ ] Show loading/skeleton when backing store not ready
- [ ] Document pattern for other pages to adopt progressively

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

## BLOCKER: SurrealDB Boot Crash

The app currently crashes during `GraphStore::boot()` -- after DuckDB succeeds but
before SurrealDB completes. Exit code `4294967295` (-1) = access violation / panic.

Root cause: SurrealDB 3.0 with `kv-surrealkv` backend crashing on existing data.
Possible version mismatch between stored data format and current SurrealDB version.

### Immediate fixes (required for Phases 2-3 to work):
- [ ] Wrap each store boot in `catch_unwind` or error recovery -- a failed store must
      show as "failed" in StatusBar, NOT crash the entire app
- [ ] Add `RUST_BACKTRACE=1` to xtask dev launch to capture actual panic
- [ ] Clear stale SurrealKV data at `{data_dir}/surreal/reasoning/` if version mismatch
- [ ] Ensure latest SurrealDB version (crates.io or git -- see Phase 5)

**Progressive hydration means: a failed store is a degraded state, not a crash.**

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
