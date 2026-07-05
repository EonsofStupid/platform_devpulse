# SPRINT: Phase 0b — `anyhow::Context` at Command Boundaries

> **Date**: 2026-04-20
> **Parent**: `SPRINT-WIZARD-FINISH.md`
> **Status**: IN_PROGRESS — profile.rs + cloud/mod.rs committed (green compile)
> **Scope**: **M** — up to 5 command files. Pattern-first, expand opportunistically.
> **Prerequisite**: Phase 0a complete (`#[instrument]` pattern live).
> **Owner**: EonsofStupid

---

## What This Sprint Finishes

Tauri command handlers currently return `Result<T, String>`. The `format!("Failed to X: {e}")` pattern discards the cause chain. Every runtime error surfaces on the frontend as a single line with no driver-level source.

This sprint migrates internal helpers to `anyhow::Result<T>` with `.context(...)` at every `?`. Tauri command signatures stay identical (`Result<T, String>`) — the boundary converts via `format!("{e:#}")` whose `#` alternate formatter walks `.source()` and prints the full chain.

Frontend sees the same type. Rust side gets the full trace. Span `err` recording from Phase 0a now captures the chain automatically.

---

## The Pattern (locked, applied to every fn)

```rust
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn do_thing(
    arg: String,
    state: State<'_, PlatformState>,
) -> std::result::Result<Out, String> {
    inner_do_thing(arg, state).await.map_err(|e| format!("{e:#}"))
}

#[tracing::instrument(skip(state), err)]
async fn inner_do_thing(
    arg: String,
    state: State<'_, PlatformState>,
) -> anyhow::Result<Out> {
    let adapter = get_adapter(&state).await.context("do_thing: get adapter")?;
    let rows = adapter.query(SQL, &[]).await.context("do_thing: query")?;
    Ok(rows.into())
}
```

- Public fn: unchanged signature, pure boundary converter.
- Inner fn: `anyhow::Result<T>`, `.context(...)` at every `?`.
- `#[tracing::instrument(err)]` on inner fn — records the full error into the span.
- Helper fns (`get_adapter`, `ensure_profile`, etc.) migrate to `anyhow::Result` too.

---

## SSOT Map

| File | Current state | Phase 0b action |
|---|---|---|
| [commands/devpulse/profile.rs](interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs) | DONE — all 4 commands migrated, helpers converted, compile green | — |
| [commands/cloud/mod.rs](interfaces/desktop/src-tauri/src/commands/cloud/mod.rs) | DONE — `get_inference_provider` + `set_inference_provider` migrated, alias comment added | — |
| [commands/models/mod.rs](interfaces/desktop/src-tauri/src/commands/models/mod.rs) | 1800 LOC, heavy. Migrate ONLY the commands touching Phase A/B data paths: `complete_model_setup`, `get_loader`, `autoConfigure`, `testInference`, `markSetupComplete` | **TO DO** |
| [commands/credentials/mod.rs](interfaces/desktop/src-tauri/src/commands/credentials/mod.rs) | 4 commands: `store_api_key`, `get_api_key`, `delete_api_key`, `get_api_key_status` | **TO DO** |
| [commands/knowledge.rs](interfaces/desktop/src-tauri/src/commands/knowledge.rs) | Touched recently; check if error returns are still String | **TO DO** |

## Duplication Scan

- `inner_*` naming pattern confirmed unique — grep found only the 6 fns I authored in profile.rs + cloud/mod.rs.
- `anyhow::Context` already imported in many kernel persistence files ([libsql.rs](kernel/devpulse-clyffy/src/cortex/persistence/libsql.rs), etc.) — aligning, not introducing new style.
- No competing helper-then-boundary-convert wrapper pattern exists elsewhere.

## Files (max 5, one commit per file)

1. `commands/models/mod.rs` — migrate the 5 Phase-A/B-adjacent commands only. DO NOT touch the 20+ slot management commands (separate sprint if needed).
2. `commands/credentials/mod.rs` — 4 commands. Small file, full migration in one pass.
3. `commands/knowledge.rs` — audit only, migrate if `Result<_, String>` present.
4. (reserved) `commands/devpulse/` remaining siblings — only if Phase A work depends on them.
5. (reserved) — leave slot for a discovery during compile.

## Execution Order

1. models/mod.rs — migrate the 5 listed commands. Compile check after each inner_* pair.
2. credentials/mod.rs — full file migration. Compile check once at end.
3. knowledge.rs — audit. If already `anyhow::Result`, mark DONE with no change. If not, migrate.
4. Re-run full `cargo check -p devpulse_desktop_backend`. Zero warnings.
5. Commit with message: `refactor(backend): anyhow::Context at command boundaries (Phase 0b)`.

## Verification Gate

- [ ] `cargo check -p devpulse_desktop_backend --message-format short` — 0 errors, 0 warnings.
- [ ] Introduce a deliberate DB path error locally. Frontend toast now shows multi-line cause chain instead of `"Failed"`. Revert the deliberate change.
- [ ] Session JSONL: `{"fields":{"error":"..."}}` spans now include the full chain from the `err` derive on `#[instrument]`.
- [ ] `pnpm check` — 0 errors (no frontend surface change expected).

## Do NOT Touch

- Tauri command public signatures — they stay `Result<T, String>`.
- tauri-specta bindings — regen not required (no type shape change).
- Kernel crates — already use `anyhow::Result` internally.
- Slot management commands in models/mod.rs (20+ fns) — defer unless Phase A blocks on them.
- Frontend error-handling code — same String comes through, richer content is automatic.

## Anti-Pattern Risks

| Risk | Prevention |
|---|---|
| Migrating every command across the codebase in one go | Max 5 files this sprint. Stop at pattern-set threshold. |
| Leaking the `anyhow::Error` type through the Tauri boundary | Always end public fn with `.map_err(|e| format!("{e:#}"))`. Type signature stays `Result<T, String>`. |
| `{e}` instead of `{e:#}` in the boundary converter | `{e}` shows only the top error. `{e:#}` walks the chain. |
| Forgetting `.context(...)` at some `?` | Spot-check: every `.await?` inside the inner fn has a `.context(...)` call. |
| Wrapping tracing with double events | `#[instrument(err)]` already records the error. Don't also `tracing::error!` in the catch arm. |

## Links

- Parent: `SPRINT-WIZARD-FINISH.md`
- Pattern established: [commands/devpulse/profile.rs](interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs)
- Pattern reference: [commands/cloud/mod.rs](interfaces/desktop/src-tauri/src/commands/cloud/mod.rs)
