# Research: Boot + Shutdown Lifecycle Reauthor

**Date**: 2026-03-14
**Status**: COMPLETE

## SSOT Map

| What | Location | Status |
|------|----------|--------|
| Boot pipeline | `systems/devpulse-engine/src/platform/boot/mod.rs` | EXISTS — orchestrates all store boots |
| Store trait | `systems/devpulse-engine/src/platform/stores/mod.rs` | EXISTS — no `close()` method |
| Retry utility | `systems/devpulse-engine/src/platform/boot/retry.rs` | EXISTS — exponential backoff, Windows-aware |
| SurrealDB boot | `systems/devpulse-engine/src/platform/boot/graph.rs` | EXISTS — hand-rolled 1-retry, NOT using retry utility |
| Platform facade | `systems/devpulse-engine/src/platform/mod.rs` | EXISTS — no Drop impl, no shutdown method |
| Tauri app | `interfaces/desktop/src-tauri/src/lib.rs` | EXISTS — no exit handler, no shutdown hook |
| Tauri state | `interfaces/desktop/src-tauri/src/state.rs` | EXISTS — PlatformState holds Arc<Platform> |
| Boot config | `systems/devpulse-engine/platform.default.toml` | EXISTS — retry: 5 attempts, 200ms base delay |
| Zombie cleanup | `xtask/src/zombie.rs` | EXISTS — was missing `devpulse-desktop-app` in ZOMBIE_NAMES (FIXED) |
| BootOverlay UI | `interfaces/desktop/src/lib/layouts/app/BootOverlay.svelte` | EXISTS — shows boot progress |
| platformState rune | `interfaces/desktop/src/lib/sys/runes/platformState.svelte.ts` | EXISTS — connects to Tauri events |
| Tauri capabilities | `interfaces/desktop/src-tauri/capabilities/default.json` | JUST CREATED — was missing entirely |

No duplicates found.

## Problem Statement

On Tauri hot-reload (code change during dev), the old binary is killed and a new one starts.
On Windows, file locks from the dead process persist for up to 10 seconds.
The new binary starts immediately and fails to open DuckDB + SurrealDB because the locks are still held.
Boot reports FAILED, the app shows a blank screen.

## Codebase Analysis (VERIFIED — all files read)

### What exists:
1. **retry.rs** — Good retry utility with exponential backoff. Detects Windows lock errors (os error 32, 33, sharing violation). Used by LibSQL boot only.
2. **DuckDB boot** (`boot_analytics`) — Synchronous (not async). **ZERO retry**. Single attempt. Fails immediately on lock.
3. **SurrealDB boot** (`boot/graph.rs::open_with_retry`) — Hand-rolled 1-retry with 200ms delay. Does NOT use the retry utility.
4. **Platform struct** — No `Drop` impl. No `shutdown()` method. No `close()` on any store.
5. **Tauri lib.rs** — No `.on_exit()` callback. No `RunEvent::Exit` handler. When process dies, all Arc references drop, Rust Drop impls fire for inner types (Connection, Surreal<Db>), but there's no explicit ordering or logging.
6. **Store trait** — Only has `ping()` and `is_ready()`. No `close()` or `shutdown()`.
7. **Adapter internals**:
   - `DuckDbAdapter` wraps `Arc<Mutex<duckdb::Connection>>` — DuckDB releases on Drop
   - `LibSqlAdapter` wraps `Arc<RwLock<libsql::Connection>>` — libsql releases on Drop
   - `SurrealAdapter` wraps `Arc<RwLock<Surreal<Db>>>` — SurrealKV flushes on Drop
   - All rely on Rust Drop semantics — no explicit close

### What's missing:
1. **Graceful shutdown** — No mechanism to close stores in order before process exit
2. **DuckDB retry** — DuckDB is sync, doesn't use retry utility
3. **SurrealDB retry** — Uses own 1-retry, not the utility
4. **Exit hook** — Tauri `.run()` returns a `Result` but no `RunEvent` handler
5. **Store close logging** — No visibility into what happens during shutdown

### Root cause chain:
```
Tauri hot-reload kills process
→ Rust Drop fires in undefined order
→ DuckDB Connection::drop() releases file
→ SurrealKV::drop() flushes WAL + releases lock
→ Windows holds file handles for ~1-10 seconds after process death
→ New process starts immediately
→ DuckDB: "being used by another process" (0 retries)
→ SurrealDB: "os error 33" (1 retry, 200ms — not enough)
→ Boot reports FAILED
→ Blank screen (boot overlay shows error, but crashed before cap fix)
```

## Best Practices Research

### How enterprise apps handle this (VS Code, Docker, JetBrains):

1. **Explicit shutdown with timeout** — Register exit handler. Close resources in reverse-boot order. Log each close. Set a deadline (5s). If exceeded, force exit.

2. **Retry on startup with exponential backoff** — ALL file-based stores retry. Not just one. Typical: 5 retries, 200ms base, 2x factor = max wait ~6.4s. This covers the Windows lock release window.

3. **Lockfile protocol** — Write a PID to a `.lock` file. On startup, check if PID is alive. If alive, wait for it to die. If dead, delete the lockfile and proceed. This is complementary to retry, not a replacement.

4. **Cross-platform**:
   - **Windows**: File locks persist after process death. Use retry. No signals (SIGTERM doesn't exist). Console handler (Ctrl+C) works via `SetConsoleCtrlHandler` but Tauri handles this.
   - **Linux/Mac**: File locks released immediately on process death. Retry still useful for edge cases (NFS, antivirus). SIGTERM gives ~5s before SIGKILL.
   - The retry approach works on ALL platforms. Graceful shutdown works on all platforms via Tauri's RunEvent::Exit.

### Tauri 2.0 exit handling:
```rust
.build(tauri::generate_context!())?
.run(|_app, event| {
    if let tauri::RunEvent::Exit = event {
        // Cleanup here
    }
});
```
This replaces `.run(generate_context!()).expect(...)` — gives us the exit hook.

## Findings

1. The retry utility in `retry.rs` is well-written and cross-platform correct. It just needs to be used by ALL stores.
2. DuckDB boot is sync — needs to be made async (wrap in `spawn_blocking`) or use a sync retry variant.
3. SurrealDB's hand-rolled retry should be replaced with the utility.
4. The 200ms base delay with 5 retries gives: 200, 400, 800, 1600, 3200 = 6.2s total wait. This should cover Windows lock release.
5. Graceful shutdown via `RunEvent::Exit` is the right place to close stores. Drop the `Arc<Platform>` explicitly so all inner Arcs go to refcount 0 and databases flush.
6. A lockfile is overkill for this stage — retry covers the hot-reload case.

## Anti-Pattern Risks

1. **Bandaid**: Adding `sleep(5000)` before boot — DON'T. Use proper retry with backoff.
2. **Bandaid**: Making stores non-critical to avoid the error — DON'T. They ARE critical.
3. **Over-engineering**: Full distributed locking protocol — DON'T. Retry + graceful shutdown is sufficient.
4. **Ignoring DuckDB's sync nature**: Wrapping in tokio::spawn_blocking is correct, not a hack.

## Files That Need Changes

| File | Change |
|------|--------|
| `systems/devpulse-engine/src/platform/stores/mod.rs` | Add `async fn shutdown(&self) -> Result<()>` to Store trait |
| `systems/devpulse-engine/src/platform/mod.rs` | Add `Platform::shutdown()` that closes stores in reverse order |
| `systems/devpulse-engine/src/platform/boot/mod.rs` | DuckDB boot: make async, use retry utility |
| `systems/devpulse-engine/src/platform/boot/graph.rs` | SurrealDB: replace hand-rolled retry with retry utility |
| `systems/devpulse-engine/src/platform/boot/retry.rs` | Add sync retry variant for DuckDB (or make DuckDB async) |
| `interfaces/desktop/src-tauri/src/lib.rs` | Add RunEvent::Exit handler that calls Platform::shutdown() |
| `kernel/devpulse-maestro/src/cortex/persistence/duckdb.rs` | Add `close()` method (explicit checkpoint + connection close) |
| `kernel/devpulse-maestro/src/cortex/persistence/surreal.rs` | Add `close()` method (explicit flush) |
| `kernel/devpulse-maestro/src/cortex/persistence/libsql.rs` | Add `close()` method (WAL checkpoint) |

## Files Referenced
- `systems/devpulse-engine/src/platform/boot/mod.rs`: Boot pipeline orchestration
- `systems/devpulse-engine/src/platform/boot/graph.rs`: SurrealDB boot with hand-rolled retry
- `systems/devpulse-engine/src/platform/boot/retry.rs`: Retry utility (good, underused)
- `systems/devpulse-engine/src/platform/mod.rs`: Platform facade (no shutdown)
- `systems/devpulse-engine/src/platform/stores/mod.rs`: Store trait (no close)
- `systems/devpulse-engine/src/platform/config.rs`: Boot config with retry settings
- `systems/devpulse-engine/platform.default.toml`: Default retry: 5/200ms
- `interfaces/desktop/src-tauri/src/lib.rs`: Tauri app (no exit handler)
- `interfaces/desktop/src-tauri/src/state.rs`: PlatformState (holds Arc<Platform>)
- `kernel/devpulse-maestro/src/cortex/persistence/duckdb.rs`: DuckDB adapter (no close)
- `kernel/devpulse-maestro/src/cortex/persistence/libsql.rs`: LibSQL adapter (no close)
- `kernel/devpulse-maestro/src/cortex/persistence/surreal.rs`: SurrealDB adapter (no close)
- `xtask/src/zombie.rs`: Zombie cleanup (FIXED: added devpulse-desktop-app)
