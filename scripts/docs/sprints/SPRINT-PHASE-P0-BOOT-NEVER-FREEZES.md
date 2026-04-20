# SPRINT: Phase P0 — Boot Never Freezes (UI-First, Lock-Free Async)

> **Date**: 2026-04-20
> **Parent**: `SPRINT-WIZARD-FINISH.md`
> **Status**: **P0 — BLOCKING EVERYTHING**
> **Scope**: **L** — architectural. Touches boot pipeline, platform state, persistence adapter.
> **Prerequisite**: None. This runs FIRST. Phase 0a observability already landed — we can SEE the freeze, now we eliminate it.
> **Owner**: EonsofStupid

---

## The Mandate (owner-stated, 2026-04-20)

> "WHEN I BUILD THIS APP IT CANNOT FUCKING FREEZE. THAT MEANS THERE IS NO FUCKING REASON FOR ANY LOCKS.
>  THE UI APPEARS UNTIL PROFILE EXISTS PROPERLY — SIMPLE.
>  THEN WE POINT IT TO DEVPULSE AND BECAUSE IT'S MY SYSTEM WE CAN HAVE IT AGGRESSIVELY INDEX INSTEAD OF WORRIED ABOUT COSTS."

The app has been failing to boot for 2 days. Authoring more features on a codebase that doesn't start is gaslighting. P0 fixes the root cause FIRST. Everything else waits.

## The Core Rule (LOCKED)

**No `tokio::sync::RwLock` or `tokio::sync::Mutex` held across `.await`.**

Allowed:
- `parking_lot::RwLock` / `parking_lot::Mutex` for **sync-only** scopes (never yields, never deadlocks across async).
- `Arc<T>` where `T` is immutable after init (most services fit this shape).
- `flume` channels (MPMC, the existing platform standard for signal routing).
- `tokio::broadcast` for fan-out (existing platform standard for events).
- `arc_swap::ArcSwap` for rare "swap whole state" patterns.

Forbidden:
- `.read().await` or `.write().await` on `tokio::sync::RwLock` held more than a few microseconds.
- Any lock scope that spans a `.await` point on a slow operation (SQL query, file I/O, model load, network call).
- Cross-service locking that could cycle.

---

## The Architecture (target state)

```
  ┌─────────────────────────────────────────────────────────┐
  │  Tauri lib.rs run()                                     │
  │                                                         │
  │  1. Init tracing (fast)                                 │
  │  2. SHOW WINDOW IMMEDIATELY                             │
  │  3. Spawn detached `boot_all()` task                    │
  │  4. Return                                              │
  └─────────────────────────────────────────────────────────┘
           │
           │ each service boots independently in its own task
           ▼
  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │ libSQL      │ │ SurrealDB   │ │ ModelLoader │ │ DuckDB      │
  │ (parallel)  │ │ (parallel)  │ │ (parallel)  │ │ (parallel)  │
  │ → channel   │ │ → channel   │ │ → channel   │ │ → channel   │
  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
  ┌─────────────────────────────────────────────────────────┐
  │  PlatformServices { libsql, surreal, loader, duck }     │
  │   — each field is `arc_swap::ArcSwapOption<Arc<Svc>>`    │
  │   — writes once per service, never re-written            │
  │   — reads are lock-free atomic loads                     │
  └──────────────────────────────┬──────────────────────────┘
                                 │
                                 │ emits `platform:service-ready` events
                                 ▼
                          Frontend rune state
                          UI lights up as services come online
```

Each service boot is:
1. An async fn that returns `anyhow::Result<Arc<Svc>>`.
2. On success → `services.libsql.store(Some(arc))` (lock-free atomic swap).
3. Emits `platform:service-ready` Tauri event with name + latency.
4. On failure → emits `platform:service-failed` with error, stores `None` so the frontend can show the specific service as failed.

The UI **never waits** for boot to complete before rendering. It renders the shell + a skeleton + a status line. Individual surfaces (chat, dashboard) show "waiting for X" cards until the relevant service lights up.

---

## The Profile + Project-Folder Lifecycle

Tied to the owner's stated flow:

```
Stage 1 — UI appears (profile may not exist yet)
    Frontend renders shell + WelcomeView with picker.

Stage 2 — libSQL comes online (detached, ~ms)
    `platform:service-ready libsql` event fires.
    Frontend fetches profile. If display_name is empty → welcome state.
                                 If present → known-user state.

Stage 3 — User completes wizard (name + project folder + slots)
    `update_user_profile(..., project_path)` writes to libSQL.
    `markSetupComplete` flips the flag.

Stage 4 — Aggressive indexing begins (post-wizard, detached)
    DevPulse kicks off a background indexer over `profile.project_path`.
    No cost gate — owner's machine, owner's choice.
    Indexer writes to SurrealDB (for graph) + vector store.
    Clyffy inherits full indexed context.
```

Every transition is event-driven. No stage blocks the UI thread or the boot task.

---

## What Is Currently Broken

| Spot | Problem | Fix |
|---|---|---|
| [state.rs `PlatformState`](interfaces/desktop/src-tauri/src/state.rs) (inferred — grep confirms `state.platform.read().await` pattern in every command) | `platform: Arc<tokio::sync::RwLock<Option<Platform>>>` — every command does `state.platform.read().await` before doing anything. Hundreds of yield points serialized on one lock. | Replace with `Arc<ArcSwapOption<Platform>>`. Reads become `state.platform.load_full()` — lock-free. |
| [kernel/devpulse-clyffy/src/cortex/persistence/libsql.rs:16](kernel/devpulse-clyffy/src/cortex/persistence/libsql.rs#L16) `conn: Arc<RwLock<libsql::Connection>>` | Every query takes a `.read().await` on the adapter's own RwLock, serializing all reads behind one mutex. | `libsql::Connection` is already `Send + Sync` in recent libsql versions AND cloneable via `db.connect()`. Remove the RwLock; keep an `Arc<libsql::Connection>` OR clone a new connection per query. Verify clone cost. |
| [kernel/model-loader/src/service.rs] 4-sub-struct RwLocks | Fine-grained but still `tokio::sync::RwLock`. | Audit: any `.read().await` / `.write().await` spans a slow op? Convert those to `parking_lot::RwLock` if the scope is sync-only, or to `ArcSwap` for read-heavy init-once patterns. |
| boot pipeline blocks on sequential services | `Platform::boot()` awaits libSQL → then SurrealDB → then loader — any hang in one blocks all. | Spawn each service boot as a detached task. Collect results into `ArcSwapOption` fields. |
| Window shown AFTER boot starts | If boot takes 20s, UI is blank for 20s. | Show window FIRST in lib.rs `run()` setup closure. Boot task is detached post-show. |

---

## Files (expected — confirm with reads during execution)

**Sub-phase P0.1 — Platform state: remove the outer RwLock**
1. `interfaces/desktop/src-tauri/src/state.rs` (read first — may be in a different location)
2. `interfaces/desktop/src-tauri/src/commands/**/*.rs` — every `state.platform.read().await` replaced with `state.platform.load_full()`. Grep confirms the call sites.

**Sub-phase P0.2 — libSQL adapter: drop the connection RwLock**
3. `kernel/devpulse-clyffy/src/cortex/persistence/libsql.rs`

**Sub-phase P0.3 — Boot pipeline: parallel service startup**
4. `systems/devpulse-engine/src/platform/mod.rs` OR wherever `Platform::boot` lives
5. `interfaces/desktop/src-tauri/src/lib.rs` boot_task — already spawns, confirm it detaches properly

**Sub-phase P0.4 — Frontend: event-driven service readiness**
6. `interfaces/desktop/src/lib/domains/app/platform/data-access/platform.state.svelte.ts` (create or extend) — rune state subscribing to `platform:service-ready` / `platform:service-failed` events.
7. WelcomeView / top-level route — show per-service status cards that flip green as events arrive. No blocking wait.

**Sub-phase P0.5 — Kernel model-loader audit**
8. `kernel/model-loader/src/service.rs` — locate every `RwLock`, classify each by "held across await" yes/no, convert the yes-cases.

---

## Execution Discipline

- **Max 5 files per sub-phase.** Commit between sub-phases.
- **Compile after every file** — `cargo check -p devpulse_desktop_backend`.
- **Before and after each sub-phase: boot the app** — must reach window-visible-with-spinner in under 2 seconds. Measure with a stopwatch.
- **Deliberate freeze test** — between sub-phases, introduce a known-slow operation (e.g. `tokio::time::sleep(Duration::from_secs(30))`) inside a service boot. Confirm:
  - Window still appears instantly.
  - Other services still light up.
  - Only the deliberately-slow service shows "waiting" indefinitely.
  - Remove the deliberate slowdown.

---

## Verification Gate (sprint close)

- [ ] `cargo check -p devpulse_desktop_backend` — 0 errors, 0 warnings.
- [ ] `pnpm check` — 0 errors.
- [ ] Measured cold boot: **window visible in <2 seconds** from `cargo run` to pixels.
- [ ] Deliberate slowdown test (above) passes.
- [ ] `grep -rn 'tokio::sync::RwLock' kernel/ systems/ interfaces/desktop/src-tauri/` — every remaining occurrence is documented (comment next to it) as "sync-only scope, does not cross await".
- [ ] `grep -rn '\.read\(\)\.await' interfaces/desktop/src-tauri/` — zero occurrences OR every occurrence is inside a block that demonstrably does NOT span a slow op.
- [ ] `tokio-console` (Phase 0c) shows zero tasks blocked >200ms during boot.
- [ ] Session JSONL boot timing: `register_slots_only` span <50ms, `libsql.open_with_schema` span <500ms, `boot_task` span <2s.
- [ ] Freeze-regression e2e: mash the UI while boot is in progress (move window, click around) — no freeze, no jank.

## Do NOT Touch

- Existing `parking_lot` usage (already correct — sync-only).
- `flume` channels (already correct — MPMC, non-blocking).
- `tokio::broadcast` (already correct — fan-out, non-blocking).
- Kernel vocabulary outside `kernel/`. The IP boundary is enforced.
- UI visual design — scope is purely "lights up as services boot", not a redesign.
- Aggressive indexing implementation — that's Stage 4 in the lifecycle above. Out of scope for P0 (tracked separately — P0 just makes sure nothing blocks it).

## Anti-Pattern Risks

| Risk | Prevention |
|---|---|
| Replacing `RwLock` with `Mutex` (same problem, fewer readers) | Rule is structural. `Mutex` across `.await` is forbidden too. |
| Converting to `std::sync::RwLock` and calling `.read().unwrap()` in async context | Forbidden. `std::sync::RwLock` blocks the executor thread. Use `parking_lot` (short sync scopes) or `ArcSwap` (init-once read-heavy). |
| Cloning `libsql::Connection` per query without measuring cost | Benchmark: 100 concurrent queries, cloned conn vs shared + `parking_lot`. Pick the winner. Document choice in the file. |
| Making boot "fully parallel" but one service depends on another | Services that truly depend (e.g. loader needs libSQL adapter) resolve via a channel: service A broadcasts ready, service B waits on the broadcast receiver — NOT on a lock. |
| Window showing before Tauri is initialized | Tauri `setup` closure receives the handle; `window.show()` there. Anything else slows it. |
| "Aggressive indexing" kicking off during boot and stealing the CPU | Indexer starts ONLY after `platform:service-ready surreal` AND profile `project_path` is non-null AND `onboarding_complete` is true. Gated by state, not by boot order. |
| Leaking `tokio::sync::RwLock` via a library dep (`tauri::State` internals) | `tauri::State<T>` internally uses `Mutex` only for `Manager` registration. Inner `T` is ours to design — so `T = Arc<ArcSwapOption<Platform>>` is fine. |

## Re-Ordering of Existing Sprint Plan

With P0 accepted, the master order becomes:

```
P0   Boot Never Freezes              ← THIS SPRINT
 ↓
0a   #[instrument] spans              [DONE]
0b   anyhow::Context                  [partial — profile.rs + cloud/mod.rs done, remainder queued]
0c   tokio-console feature            [blocks on P0 — the tool is how we validate P0]
0d   VERIFICATION.md                  [after P0 — doc reflects final boot invariants]
0e   Worklog                          [parallelizable anytime]
Consolidation                         [after P0 — safer to delete dead code with observability live]
A    project_path persistence         [after P0]
B    /devtools/claude wire            [after P0]
C    cargo xtask verify               [LAST — gates it all]
```

## Success Is

The app launches. The UI appears before the coffee finishes pouring. Profile check runs in the background. Every service reports ready or failed, visibly, in the UI. Nothing blocks. Then — and only then — the aggressive indexing kicks off, and Clyffy gets crazy powerful because it has the whole DevPulse codebase indexed locally, no API cost, no hesitation.

That's the target. Everything else in this sprint binder serves that target.

## Links

- Parent: `SPRINT-WIZARD-FINISH.md` (master order updated above)
- Research: boot freeze caused by `tokio::sync::RwLock` write-preferring semantics (prior debugging session 2026-04-07 per `.claude/mistakes.md` entries)
- Observability dependency: Phase 0a `#[instrument]` spans are what lets us VERIFY this sprint via JSONL timing.
- Future follow-up: "Aggressive Indexer" sprint (Stage 4 of the lifecycle) — post-P0, tracked separately.
