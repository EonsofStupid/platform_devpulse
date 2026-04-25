# Sprint: Foundation Pass — Close-out (2026-04-25)

Foundation pass shipped in four phases. Every subsequent sprint composes
over these primitives instead of re-rolling cards / error blocks /
poll loops / log tabs / state plumbing.

**Companion**: full sprint scope and per-phase checklist in
[`SPRINT-FOUNDATION-PASS.md`](./SPRINT-FOUNDATION-PASS.md).

---

## Commits (in landing order)

| Phase | SHA        | Title                                                              | Insertions / Deletions |
|-------|------------|--------------------------------------------------------------------|------------------------|
| F-1   | `839468f7` | refactor(desktop): unified CommandError + _util backend helpers    | +1273 / -492            |
| F-4   | `9551cf5d` | feat(xtask): tee dev-server stdio + frontend global error capture  | +971 / -10              |
| F-2   | `4b44439c` | feat(desktop): runes helpers — useTauriQuery / useTauriEvent / usePoll | +391 / -101         |
| F-3   | `fb0945fb` | feat(coldlight): devtool primitive components + library convention | +629 / -242             |

(F-1 / F-4 totals carry incidental drive-by fixes to unblock biome on
in-flight files. F-2 / F-3 are pure additions + targeted migrations.)

---

## What landed, by pillar

### Pillar 1 — Always capturing errors

- Backend: every Tauri command path that touched the vision/pixvix sprint
  now returns `Result<T, CommandError>` (specta-emitted discriminated
  union). 12 commands migrated in F-1 (pixvix monitor/window/webcam,
  providers, credentials, claude/register).
- Frontend: `hooks.client.ts` registers `unhandledrejection` and `error`
  window listeners that log through the existing `logError` →
  `invoke('log')` → backend tracing → session JSONL pipeline. Nothing
  the frontend throws or rejects escapes the JSONL.
- xtask: `pnpm tauri dev` stdio teed to `.userdata/logs/run-dev-stdio.log`
  via `spawn_tee_log_non_blocking` — no more disappearing vite/tauri
  output during a `cargo xtask run-dev` session.
- Backend panic hook was already in place (pre-pass).

### Pillar 2 — Layman-friendly devtool consistency

- F-3 component library under `lib/domains/platform/_shared/`:
  `DevtoolDescription` / `DevtoolStatBox` / `DevtoolEmptyState` /
  `DevtoolErrorPanel` / `DevtoolRefreshButton` / `DevtoolLogsTab`.
- `_shared/README.md` documents the convention (when-to-use table,
  patterns to follow, migration status table).
- `DevtoolErrorPanel` maps every `ErrorKind` to a Badge variant + display
  label so users can tell "rate-limited" from "auth-failed" at a glance —
  no more substring matching on error messages.
- All borders / fills via design tokens (`--border-width-hairline`,
  `--border-width-thin`, `--signal-error-subtle`) — no raw px / hex
  values per the `no-raw-values` lint hook.

### Pillar 3 — No duplication

Removed in F-1:
- 4 duplicate `now_ms()` (pixvix / autoregister / vision / providers) → `_util/time.rs`
- 3 duplicate `encode_png()` (pixvix monitor/window/webcam) → `_util/image.rs`
- 2 disjoint error-classification enums (`ProviderErrorKind`, `CaptureErrorKind`)
  + ad-hoc bare-`String` errors → unified `CommandError`

Removed in F-2:
- Per-devtool `let data = $state(null); let loading = $state(false); let
  error = $state(null);` pattern → `TauriQuery<T, E>` class
- Per-devtool `$effect(() => { void fetch(); const id = setInterval(...);
  return () => clearInterval(id); })` boilerplate → `PolledQuery<T, E>`
  (also adds visibility-aware pause)
- Per-devtool `onMount(async () => unlisten = await listen(...))` +
  matching `onDestroy(unlisten)` → `TauriEventStream<T>` with
  `$effect`-based auto-cleanup

Removed in F-3 (Claude + STT migrations):
- 129 lines of inline state / cards / log table from Claude devtool
- 73 lines of inline log-table plumbing from STT devtool
- Two disjoint level-color mapping functions → owned by `DevtoolLogsTab`

### Pillar 4 — Boring best-practice Svelte patterns

- Three named, generic, `$state`-backed rune classes in `lib/sys/runes/`
  — every devtool's "fetch / listen / poll" needs a rune-helper instance,
  not bespoke state plumbing.
- `okQuery()` adapter so legacy bare-promise commands (e.g.
  `getMcpStatus`) compose into the same shape as new `Result`-returning
  commands without forcing the legacy command to be migrated first.
- Six named devtool components in `_shared/` — every devtool's
  "stat / error / empty / refresh / logs" needs a component instance,
  not bespoke divs.

---

## Verification

| Check                                                   | Result            |
|---------------------------------------------------------|-------------------|
| `cargo check -p devpulse-engine`                        | 0/0 ✓             |
| `cargo check -p devpulse_desktop_backend`               | 0/0 ✓             |
| `cargo check -p xtask`                                  | 0/0 ✓             |
| `pnpm svelte-check` (interfaces/desktop)                | 220 / 0 / 0 / 0 ✓ |
| `biome check src/lib/sys/runes`                         | clean ✓           |
| `biome check src/lib/domains/platform/_shared`          | clean ✓           |
| `biome check src/routes/(devtools)/devtools/claude/+page.svelte` | clean ✓ |
| `biome check src/routes/(devtools)/devtools/stt/+page.svelte`   | clean ✓ |
| Pre-commit hooks (no-raw-values, no-legacy-prefixes, biome-lint, docs-preflight) | passed ✓ |

**Test suites** (run 2026-04-25 post-close-out):

| Suite                                                      | Result                          |
|------------------------------------------------------------|---------------------------------|
| `cargo test -p devpulse_desktop_backend --lib commands::_util` | 12 passed / 0 failed ✓        |
| `cargo test -p devpulse-engine --lib vision`               | 29 passed / 0 failed ✓ (no regression) |
| `cargo test -p xtask`                                      | 90 passed / 1 **pre-existing failure** |

The single xtask failure is `commands::model_manifest_backfill::tests::parameter_count_standard_b_suffix`
— a parser test in a module **none of F-1/F-2/F-3/F-4 touched** (F-4
modified only `xtask/src/workspace.rs` and `xtask/src/commands/dev.rs`).
It is pre-existing drift in the model-manifest parser, unrelated to the
foundation pass; tracked for the model-loader sprint.

**Specta bindings**: `bindings.ts` already carries `CommandError` +
`ErrorKind` from F-1's regen. F-2 and F-3 are pure-frontend changes
that consume those existing types — no IPC surface modified, no
bindings regen needed. **Verified empirically 2026-04-25**: ran
`cd interfaces/desktop/src-tauri && ../../../target/debug/export-bindings.exe`
post-close-out; `git diff` on `bindings.ts` showed zero changes.

**Runtime smoke**: deferred to owner. The four manual probes the
sprint spec calls for (boot / Promise.reject / throw / log file
populates) live in `SPRINT-FOUNDATION-PASS.md` § "Sanity test (5)".

---

## Closes-out specta cleanup

**202 commands still return `Result<T, string>`** in `bindings.ts`
(grep count). Per the sprint exit criteria, that's the expected state:

> No commands return `Result<T, String>` after this pass UNLESS they're
> commands authored before this pass that we deliberately defer migrating.

Lazy-migration policy: convert a command to `CommandError` on next
touch. The 12 commands migrated in F-1 are the ones the vision sprint
actually exercised (pixvix / providers / credentials / claude
register). Everything else (chat / settings / services / preferences /
action-logs / etc.) stays on `Result<T, string>` until the next sprint
that touches it.

---

## Devtools that still need migration to F-2 / F-3

| Devtool                         | F-2 (runes) | F-3 (components)            |
|---------------------------------|-------------|-----------------------------|
| `/devtools/claude`              | DONE (F-2)  | DONE (F-3, all 6 used)      |
| `/devtools/stt`                 | not yet     | partial — Logs tab via DevtoolLogsTab |
| `/devtools/cache`               | not yet     | not yet (uses ScopedLogPanel) |
| `/devtools/devforge`            | not yet     | not yet (uses ScopedLogPanel) |
| `/devtools/ollama_sidecar`      | not yet     | not yet (uses ScopedLogPanel) |
| `/devtools/surrealdb_sidecar`   | not yet     | not yet (uses ScopedLogPanel) |
| `/devtools/vision`              | not yet     | not yet (uses ScopedLogPanel) |

`ScopedLogPanel.svelte` stays in tree, tagged DEPRECATED in
`_shared/README.md`. Each remaining devtool migrates on next-touch.
None block resuming the vision sprint.

---

## Carry-overs into the vision sprint resumption (V-5 onward)

The four foundation primitives the vision sprint will compose over:

- **`CommandError`** — V-5's new ORT SigLip2 backend's error path.
- **`useTauriQuery` / `PolledQuery`** — V-7's config panel + per-source
  status polling.
- **`DevtoolStatBox` / `DevtoolEmptyState` / `DevtoolErrorPanel`** —
  V-7 / V-8's tile grids + camera-not-available state + capture errors.
- **`DevtoolLogsTab`** — V-8's Logs tab, four `extraTabs`. Replaces
  the Sprint-3 ad-hoc Claude pattern.
- **Global frontend error handlers** — V-7 / V-8 / V-9 frontend bugs
  land in JSONL automatically, no manual `try { ... } catch (e) {
  logError(...) }` boilerplate.

---

## Out of scope (intentionally deferred)

- Migrating the 5 untouched `ScopedLogPanel` consumers (cache /
  devforge / ollama_sidecar / surrealdb_sidecar / vision) — lazy on
  next touch.
- Migrating the 202 legacy `Result<T, string>` commands — lazy on
  next touch.
- sccache shared cache — waiting on Wisconsin VM standup.
- Toast / notification system — separate concern.
- `/devtools/errors` aggregator — flagged as worth doing later.
- Vitest coverage for the rune helpers — desktop vitest is browser-mode
  (Chromium via Playwright) not jsdom; needs Tauri shim/mocking infra
  before runes can be unit-tested in isolation. Runtime coverage comes
  from the Claude devtool migration.

---

*Foundation pass closed.*
