# SPRINT: Boot + Shutdown Lifecycle Reauthor

**Date**: 2026-03-14
**Research**: [SPRINT-BOOT-LIFECYCLE.research.md](SPRINT-BOOT-LIFECYCLE.research.md)
**Priority**: CRITICAL — app cannot boot reliably without this
**Scope**: Cross-platform (Windows, Linux, macOS)

## Problem

On Tauri hot-reload, the old binary dies without closing database handles.
Windows holds file locks for up to 10 seconds.
The new binary starts immediately, fails to open DuckDB + SurrealDB, boot reports FAILED, blank screen.

DuckDB has ZERO retry. SurrealDB has a hand-rolled 1-retry that doesn't use the retry utility.
There is ZERO shutdown handling anywhere. No exit hooks, no close methods, no cleanup.

## SSOT Map

| Concern | SSOT Location |
|---------|---------------|
| Retry logic | `systems/devpulse-engine/src/platform/boot/retry.rs` |
| Boot config (retry params) | `systems/devpulse-engine/platform.default.toml` [windows] section |
| Store trait | `systems/devpulse-engine/src/platform/stores/mod.rs` |
| Platform facade | `systems/devpulse-engine/src/platform/mod.rs` |
| Tauri app lifecycle | `interfaces/desktop/src-tauri/src/lib.rs` |
| Adapter implementations | `kernel/devpulse-maestro/src/cortex/persistence/*.rs` |

---

## Phase 1: Retry on Startup (ALL stores)

Makes boot survive hot-reload on ALL platforms.

### 1.1 DuckDB: Add retry to boot_analytics
- [ ] Make `boot_analytics` async
- [ ] Use `retry_on_lock_async` (same as LibSQL)
- [ ] DuckDB `boot()` is sync — wrap in `tokio::spawn_blocking` inside the retry closure

### 1.2 SurrealDB: Replace hand-rolled retry
- [ ] In `boot/graph.rs`, delete `open_with_retry` function
- [ ] Use `retry::retry_on_lock_async` instead
- [ ] Same config (5 retries, 200ms base, exponential backoff)

### 1.3 Verify retry config is sufficient
- [ ] Current: 5 retries, 200ms base, 2x factor = 200+400+800+1600+3200 = 6.2s max wait
- [ ] Windows lock release is typically 1-5 seconds — this covers it

### DECIDED — Owner Decision (2026-03-14)
**Decision**: B — Per-store retry config in platform.default.toml with generous defaults.
Global base delay bumped to 500ms. Per-store overrides available for stores that need more time.

---

## Phase 2: Graceful Shutdown

Makes the OLD process release locks before dying.

### 2.1 Add `shutdown()` to Store trait
- [ ] Add `async fn shutdown(&self) -> Result<()>` with default impl (no-op)
- [ ] Each store overrides with explicit close logic

### 2.2 Add close methods to adapters
- [ ] `DuckDbAdapter::close()` — CHECKPOINT, then drop connection
- [ ] `LibSqlAdapter::close()` — PRAGMA wal_checkpoint(TRUNCATE), then drop
- [ ] `SurrealAdapter::close()` — drop the inner Surreal<Db> (triggers SurrealKV flush)
- [ ] Each logs the close with tracing

### 2.3 Add `Platform::shutdown()`
- [ ] Close stores in reverse boot order: graph → analytics → cache → relational
- [ ] Log each close with duration
- [ ] Set a 5-second deadline — if exceeded, log warning and drop everything

### 2.4 Wire into Tauri exit handler
- [ ] Change `.run(generate_context!()).expect(...)` to `.build(generate_context!())?.run(...)`
- [ ] Handle `RunEvent::Exit` — call `Platform::shutdown()` via managed state
- [ ] Log "Platform shutting down..." and "Platform shutdown complete (Xms)"

### DECIDED — Owner Decision (2026-03-14)
**Decision**: A — Block with 5s timeout. Guarantees clean shutdown.
Rationale: Shutdown only fires on exit. Nobody notices 5s when closing the app or during
hot-reload recompile (1-3 min). The timeout is a ceiling, not a sleep — if stores close
in 200ms, it returns in 200ms. Chrome, VS Code, Docker all use 5-10s shutdown deadlines.

---

## Phase 3: Verification

### 3.1 Test hot-reload cycle
- [ ] Start app with `cargo xtask run-dev`
- [ ] Make a Rust code change → Tauri recompiles and restarts
- [ ] Verify boot.log shows all stores READY (no lock errors)
- [ ] Repeat 3 times to confirm reliability

### 3.2 Test Ctrl+C shutdown
- [ ] Start app, wait for boot complete
- [ ] Ctrl+C
- [ ] Verify shutdown log entries appear
- [ ] Restart immediately — verify no lock errors

### 3.3 Verify no zombie processes
- [ ] After Ctrl+C, check `tasklist | grep devpulse` — should be empty
- [ ] After hot-reload, check only ONE devpulse-desktop-app process exists

---

## Files Modified

| File | What Changes |
|------|-------------|
| `systems/devpulse-engine/src/platform/stores/mod.rs` | Add `shutdown()` to Store trait |
| `systems/devpulse-engine/src/platform/mod.rs` | Add `Platform::shutdown()` |
| `systems/devpulse-engine/src/platform/boot/mod.rs` | DuckDB boot: async + retry |
| `systems/devpulse-engine/src/platform/boot/graph.rs` | SurrealDB: use retry utility |
| `interfaces/desktop/src-tauri/src/lib.rs` | RunEvent::Exit handler |
| `kernel/devpulse-maestro/src/cortex/persistence/duckdb.rs` | Add `close()` |
| `kernel/devpulse-maestro/src/cortex/persistence/libsql.rs` | Add `close()` |
| `kernel/devpulse-maestro/src/cortex/persistence/surreal.rs` | Add `close()` |

## NOT Touched
- Boot overlay UI (already working)
- platformState rune (already working)
- Tauri capabilities (already fixed)
- Zombie cleanup (already fixed)
- Token pipeline, ColdLight, recipes — nothing design-system related
