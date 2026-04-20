# SPRINT: Phase 0c — `tokio-console` Opt-In Feature

> **Date**: 2026-04-20
> **Parent**: `SPRINT-WIZARD-FINISH.md`
> **Status**: READY
> **Scope**: **S** — 3 files, isolated behind feature flag.
> **Prerequisite**: Phase 0a complete (tracing layer pattern established).
> **Owner**: EonsofStupid

---

## What This Sprint Finishes

`tokio-console` attaches at runtime and renders the live task graph: which tasks are spawned, who's blocked on what lock, whether any task has been stuck >200ms, who is holding `RwLock`s. It would have diagnosed the model-loader write-preferring deadlock in under a minute.

Wired as **opt-in** cargo feature. Default builds are unchanged. Enable only when debugging:
```
RUSTFLAGS="--cfg tokio_unstable" cargo run --features tokio-console
```

---

## Why Opt-In (not default)

- `console-subscriber` requires `tokio_unstable` cfg — not a normal production flag.
- Adds a runtime task + binds `127.0.0.1:6669` by default — overhead in release builds.
- Release binaries should not carry it.

## SSOT Map

| File | Current state | Phase 0c action |
|---|---|---|
| [interfaces/desktop/src-tauri/Cargo.toml](interfaces/desktop/src-tauri/Cargo.toml) | `tracing-subscriber` workspace dep, 3 features (`inference`, `internal`, `default = ["inference"]`) | Add optional `console-subscriber` dep, add `tokio-console` feature. |
| [interfaces/desktop/src-tauri/src/logging.rs](interfaces/desktop/src-tauri/src/logging.rs) | 4-layer subscriber: OTel + stderr + JSONL + DuckDB. `init()` + `init_stderr_only()`. | Add `#[cfg(feature = "tokio-console")]` branch that inserts `console_subscriber::ConsoleLayer::builder().spawn()` at the top of the registry chain. |
| NEW `scripts/docs/TOKIO-CONSOLE.md` | — | Quick-start doc: how to enable, how to connect, what to look for. |

## Duplication Scan

- No existing `console-subscriber` reference in the codebase (grep).
- No existing `tokio-console` feature or cfg flag.
- `tracing_subscriber::registry()` composition chain in logging.rs has room for one more `.with(...)` call — append-only.
- Does NOT conflict with the `OTel` layer — both are independent `Layer<Registry>` implementors.

## Files (max 3)

1. `interfaces/desktop/src-tauri/Cargo.toml`:
   ```toml
   [dependencies]
   console-subscriber = { version = "0.4", optional = true }

   [features]
   tokio-console = ["dep:console-subscriber"]
   ```

2. `interfaces/desktop/src-tauri/src/logging.rs`:
   ```rust
   // Inside init():
   let registry = tracing_subscriber::registry()
       .with(otel_layer)
       .with(filter)
       .with(fmt::layer().with_target(true).compact())
       .with(fmt::layer().json()...)
       .with(DuckDbLayer::new(span_tx));

   #[cfg(feature = "tokio-console")]
   let registry = registry.with(console_subscriber::ConsoleLayer::builder().spawn());

   registry.init();
   ```
   Same pattern in `init_stderr_only()`.

3. `scripts/docs/TOKIO-CONSOLE.md` — quick-start (see §Doc body below).

## Execution Order

1. Add the optional dep + feature to Cargo.toml. `cargo check --features tokio-console` compiles cleanly.
2. Extend logging.rs with the cfg-gated layer. Compile both with and without the feature.
3. Write TOKIO-CONSOLE.md.
4. Commit: `feat(backend): tokio-console opt-in feature (Phase 0c)`.

## Verification Gate

- [ ] `cargo check -p devpulse_desktop_backend` — 0 errors, 0 warnings (default features).
- [ ] `RUSTFLAGS="--cfg tokio_unstable" cargo check -p devpulse_desktop_backend --features tokio-console` — 0 errors, 0 warnings.
- [ ] Run with the feature: `cargo install tokio-console` then in another terminal `tokio-console` connects to `127.0.0.1:6669`, shows the task list including `model_loader.bg_finalize` span from Phase 0a.
- [ ] Without the feature: `cargo run` is byte-identical to before Phase 0c (confirm binary hash unchanged).

## Do NOT Touch

- DuckDB span layer — untouched.
- OTel layer — untouched.
- JSONL file layer — untouched.
- Default cargo features — `console-subscriber` is NOT added to `default = [...]`.
- `.cargo/config.toml` — do not persist `tokio_unstable` globally. User opts in per-run.

## Doc body for TOKIO-CONSOLE.md

```markdown
# tokio-console

Attach to a running DevPulse backend and inspect the live tokio task graph.

## One-time setup
    cargo install tokio-console

## Run the app with the feature
    RUSTFLAGS="--cfg tokio_unstable" cargo run -p devpulse_desktop_backend --features tokio-console

Windows (pwsh):
    $env:RUSTFLAGS="--cfg tokio_unstable"; cargo run ...

## Connect
In a second terminal:
    tokio-console

Default address: 127.0.0.1:6669.

## What to look for
- `tasks` tab: tasks stuck >200ms show red.
- `resources` tab: RwLocks held by which task, for how long.
- If a task is blocked on a lock held by another task that's idle, that's a deadlock.

## Finding spans from #[instrument]
tokio-console shows spans by name. Phase 0a instrumented:
- `model_loader.bg_finalize`
- `register_slots_only`
- `finalize_registry`
- `set_routing_mode`
- `boot_task`
- `open_with_schema`, `ping`, SQL `query` / `execute` / `execute_batch`
```

## Anti-Pattern Risks

| Risk | Prevention |
|---|---|
| Making tokio-console a default dependency | Keep `default = ["inference"]`. `tokio-console` stays opt-in. |
| Persisting `--cfg tokio_unstable` in `.cargo/config.toml` | Do NOT. User sets per-shell via `RUSTFLAGS`. |
| Binding `console-subscriber` to 0.0.0.0 | Default 127.0.0.1 is fine — never expose externally. |
| Using the feature in release | Release builds should NEVER ship with it. Strictly a dev debugging tool. |

## Links

- Parent: `SPRINT-WIZARD-FINISH.md`
- Phase 0a (prerequisite spans): [systems/devpulse-engine/src/platform/services/model_loader.rs](systems/devpulse-engine/src/platform/services/model_loader.rs)
- Logging stack: [interfaces/desktop/src-tauri/src/logging.rs](interfaces/desktop/src-tauri/src/logging.rs)
