# Sprint: Foundation Pass (F-1 → F-4)

**Goal**: Close the four worst quality gaps the vision sprint exposed — error classification drift, frontend rune-helper duplication, devtool component re-rolling, and uncaught frontend/dev-server errors. Ships a "smart people boring" baseline that every subsequent sprint composes over instead of re-rolling.

**Owner-approved decisions:**
- Foundation over fastest. No clever; one boring way to do each thing.
- Two real dev boxes treated as peers (i9 128GB desktop, i9 3080 laptop). sccache shared cache deferred until Wisconsin VM lands — not blocking this sprint.
- Pre-V-5 of the Vision + PixVix sprint. Vision sprint resumes (V-5 onward) on top of these primitives.

---

## Architectural contract

**One way to fail.** Every Tauri command returns `Result<T, CommandError>`. `CommandError` is a discriminated union (specta-emitted) the frontend can switch on without substring matching. Old `Result<T, String>` is deprecated; in-flight uses migrate as touched.

**One way to query.** Every "fetch from backend, hold result, surface loading + error" pattern in Svelte goes through `useTauriQuery`. No more ad-hoc `let data = $state(null); let loading = $state(false); ...` repeated per devtool.

**One way to listen.** Every `listen('platform:*-status')` subscription goes through `useTauriEvent`. Auto-cleanup via $effect return; no manual onMount/onDestroy plumbing.

**One way to poll.** `usePoll(query, intervalMs)` wraps the above. Manual `setInterval` in $effect is banned in new devtool code.

**One way to render a stat / error / empty / refresh.** Six named ColdLight-composed components in `_shared/`. No raw `<div style="background: var(--surface-base); ...">` cards in new devtool code.

**Nothing escapes the JSONL.** Frontend unhandled rejections + window errors → `logError` → `invoke('log')` → backend tracing → session JSONL. xtask `pnpm tauri dev` stdio teed to `.userdata/logs/run-dev-stdio.log`. Backend panic hook already in place.

**Specta contract.** Every new helper / DTO / error variant carries `#[derive(Serialize, Deserialize, Type)]` where it crosses the IPC boundary. Bindings regenerate via `cargo run -p devpulse_desktop_backend --bin export-bindings` from `interfaces/desktop/src-tauri/`.

---

## Phase checklist

### F-1 — Backend `_util` + classified `CommandError` (~200 LOC)

- [ ] New `interfaces/desktop/src-tauri/src/commands/_util/mod.rs` — barrel for the helpers below
- [ ] `_util/time.rs`: `now_ms() -> i64`, `now_iso() -> String`. Replaces 4+ duplicates across pixvix/autoregister/vision.
- [ ] `_util/image.rs`: `encode_png(&RgbaImage) -> Result<Vec<u8>, CommandError>`, `encode_jpeg(&RgbaImage, quality: u8) -> Result<Vec<u8>, CommandError>`, `data_url(mime: &str, bytes: &[u8]) -> String`. Replaces duplicates across pixvix monitor/window/webcam.
- [ ] `_util/error.rs`:
  - [ ] `CommandError { kind: ErrorKind, message: String, context: Option<String> }` — `#[derive(Serialize, Deserialize, Type)]`, `#[serde(rename_all = "camelCase")]`.
  - [ ] `ErrorKind` enum (kebab-case) — single union of every classification we have today: `AuthFailed | RateLimit | QuotaExhausted | Network | Server | Parse | NotConfigured | NotImplemented | PermissionDenied | NotFound | DeviceBusy | NotSupported | Internal`.
  - [ ] `From<std::io::Error>`, `From<serde_json::Error>`, `From<reqwest::Error>` impls so `?` works at call sites.
  - [ ] Helpers: `CommandError::not_found(msg)`, `::permission_denied(msg)`, etc. — one constructor per kind, no string matching at call sites.
- [ ] Migrate `commands/providers/dto.rs`: `ProviderErrorKind` becomes a thin wrapper / deprecation; commands return `CommandError` directly.
- [ ] Migrate `commands/pixvix/dto.rs`: `CaptureErrorKind` deleted; commands return `CommandError`. Drop the `[kind] message` string-tag hack.
- [ ] Migrate `commands/credentials/mod.rs` + `commands/claude/register.rs` to return `CommandError` instead of bare `String`.
- [ ] Specta bindings regenerated — `bindings.ts` carries `CommandError` discriminated-union type used by all migrated commands.
- [ ] Frontend Claude devtool (the loudest current consumer) updated to `switch (err.kind)` instead of substring matching the message.
- [ ] Tests:
  - [ ] `now_ms` recency, `now_iso` format
  - [ ] `encode_png` PNG signature, `encode_jpeg` JPEG signature
  - [ ] `data_url` shape
  - [ ] `CommandError` round-trips through serde JSON identical
  - [ ] `From<io::Error>` produces `Internal` kind by default
- [ ] `cargo check -p devpulse_desktop_backend` 0 errors / 0 warnings
- [ ] `cargo test -p devpulse_desktop_backend --lib commands::_util` all green
- [ ] `pnpm svelte-check` 0/0
- [ ] Commit `refactor(desktop): unified CommandError + _util backend helpers`

### F-2 — Frontend `$lib/sys/runes/` query / event / poll helpers (~250 LOC)

- [ ] New directory `interfaces/desktop/src/lib/sys/runes/`
- [ ] `useTauriQuery.svelte.ts`:
  - [ ] Class with `$state`-backed `data`, `error`, `loading`, `lastFetchedAt`
  - [ ] Methods: `refresh()`, `reset()`
  - [ ] Constructor takes `() => Promise<Result<T, CommandError>>` (Tauri's specta wrapper) and an optional `initialFetch: boolean` flag (default true)
  - [ ] Auto-fires on construction
- [ ] `useTauriEvent.svelte.ts`:
  - [ ] Class with `$state`-backed `value` (latest), `history` (last N), `subscribed`
  - [ ] Constructor takes event name + optional history capacity (default 32)
  - [ ] `$effect`-style auto-cleanup via Svelte's effect-root pattern
- [ ] `usePoll.svelte.ts`:
  - [ ] Wraps `useTauriQuery` + `setInterval` with cleanup
  - [ ] Pause/resume controls (pauses when document.visibilityState === 'hidden')
- [ ] `index.ts` barrel
- [ ] Migrate Claude devtool — proof of concept, replaces ~80 LOC of state + effect plumbing with three rune-helper instantiations
- [ ] Vitest tests where the rune lifecycle can be exercised in jsdom (data updates, cleanup runs)
- [ ] `pnpm svelte-check` 0/0, `biome check` clean
- [ ] Commit `feat(frontend): runes helpers — useTauriQuery / useTauriEvent / usePoll`

### F-3 — Devtool component library (~300 LOC)

- [ ] Add to `interfaces/desktop/src/lib/domains/platform/_shared/`:
  - [ ] `DevtoolStatBox.svelte` — props: `label`, `value`, optional `tone` for value color, optional `children` snippet for trailing badge. Uses `--surface-base` + `--border-subtle` via Card composition.
  - [ ] `DevtoolErrorPanel.svelte` — props: `error: CommandError | string | null`, optional `onDismiss`. Surfaces `error.kind` as a tone-colored badge + `error.message` + `error.context` (if present).
  - [ ] `DevtoolEmptyState.svelte` — props: `icon` (lucide component), `title`, `description`, optional `cta` snippet.
  - [ ] `DevtoolDescription.svelte` — props: `text`. The "what does this service do" intro chip.
  - [ ] `DevtoolRefreshButton.svelte` — props: `query: useTauriQuery`. Spinner-while-`query.loading`, label hidden during loading, accent matches `query.error` state if present.
  - [ ] `DevtoolLogsTab.svelte` — props: `targetPresets: { value: string, label: string }[]`, optional `defaultTarget`. Composes Sprint 3's `query_scoped_log` command + the rune helpers + level color mapping. Replaces the per-devtool re-rolled Logs panel.
- [ ] Update `_shared/index.ts` to re-export everything
- [ ] Add `_shared/README.md` describing the convention so the next devtool author doesn't re-roll
- [ ] Migrate Claude devtool fully (uses all six components)
- [ ] Migrate STT devtool's Logs tab as a second proof
- [ ] `pnpm svelte-check` 0/0, `biome check` clean
- [ ] Commit `feat(coldlight): devtool primitive components + library convention`

### F-4 — xtask tee + frontend global error handlers (~120 LOC)

- [ ] `xtask/src/workspace.rs`:
  - [ ] New `spawn_tee_log_non_blocking(dir, program, args, log_path) -> Result<TeeChild>` — like `exec_tee_log` but returns the `Child` + the drain thread handles instead of blocking. Caller `wait()`s the child themselves.
  - [ ] `TeeChild` struct holds `Child` + `JoinHandle<()>` for stdout drain + same for stderr.
  - [ ] `TeeChild::wait()` joins both drain threads then returns the `ExitStatus`.
- [ ] `xtask/src/commands/dev.rs`:
  - [ ] Replace `spawn_in_verbose` for `pnpm tauri dev` (line ~286) with `spawn_tee_log_non_blocking(..., .userdata/logs/run-dev-stdio.log)`.
  - [ ] Job Object assignment still happens on `child` member.
  - [ ] Same Ctrl+C semantics — TeeChild's wait still returns when the child dies.
- [ ] `interfaces/desktop/src/hooks.client.ts`:
  - [ ] On client load, register `window.addEventListener('unhandledrejection', e => logError('frontend.unhandledrejection', String(e.reason)))`
  - [ ] Register `window.addEventListener('error', e => logError('frontend.error', \`\${e.message} @ \${e.filename}:\${e.lineno}\`))`
  - [ ] Both go through existing `logError` helper — no new infra.
- [ ] Tests:
  - [ ] xtask: `cargo test -p xtask spawn_tee_log_non_blocking_drains_both_streams`
  - [ ] xtask: `cargo test -p xtask spawn_tee_log_non_blocking_writes_log_file`
- [ ] Manual smoke (in V-1 follow-up commit body):
  - [ ] `cargo xtask run-dev` — confirm `.userdata/logs/run-dev-stdio.log` populates with vite + tauri output in real time
  - [ ] In Tauri devtools console: `Promise.reject(new Error('synthetic'))` — confirm landing in `session-*.jsonl` with `target=frontend.unhandledrejection`
  - [ ] In console: `throw new Error('synthetic-throw')` — confirm landing with `target=frontend.error`
- [ ] `cargo check -p xtask`, `pnpm svelte-check` 0/0
- [ ] Commit `feat(devx): tee dev-server stdio + frontend global error capture`

---

## Sanity test (end-of-pass validation)

Run after F-4, before claiming the pass done. Same shape as the vision sprint sanity test.

1. **Build + tests**
   - [ ] `cargo check -p devpulse-engine` 0/0
   - [ ] `cargo check -p devpulse_desktop_backend` 0/0
   - [ ] `cargo check -p xtask` 0/0
   - [ ] `cargo test -p devpulse_desktop_backend --lib commands::_util` all green
   - [ ] `cargo test -p xtask` all green
   - [ ] `cargo test -p devpulse-engine --lib vision` still 29/29 (no regression)

2. **Specta bindings regen** (REQUIRED)
   - [ ] `cd interfaces/desktop/src-tauri && ../../../target/debug/export-bindings.exe`
   - [ ] `git diff src/lib/sys/generated/bindings.ts` confirms:
         - `CommandError` discriminated-union type now present
         - `ErrorKind` enum present with every variant
         - All migrated commands now return `Result<T, CommandError>` (not `Result<T, string>`)
         - No commands accidentally lost during regen — pixvix/providers/credentials/claude all still listed
   - [ ] No orphaned types: grep bindings.ts for `ProviderErrorKind` / `CaptureErrorKind` — these can stay as deprecated aliases or be removed cleanly; either way no half-state.

3. **Frontend typecheck + lint**
   - [ ] `pnpm svelte-check` 0/0/0 — every consumer of the migrated devtools type-checks against the new bindings
   - [ ] `pnpm exec biome check src/lib/sys/runes` clean
   - [ ] `pnpm exec biome check src/lib/domains/platform/_shared` clean
   - [ ] `pnpm exec biome check "src/routes/(devtools)/devtools/claude/+page.svelte"` clean (the migrated proof)

4. **IP-protection lint**
   - [ ] `lefthook run pre-commit` — no banned-term hits in any new file
   - [ ] No kernel vocab in `commands/_util/`, `lib/sys/runes/`, `lib/domains/platform/_shared/` additions

5. **Runtime smoke (`cargo xtask run-dev`)**
   - [ ] App boots with new global error handlers active
   - [ ] Open `/devtools/claude` (the migrated devtool) — every panel renders identically to pre-pass
   - [ ] Logs tab populates via `DevtoolLogsTab` — same data, different component
   - [ ] Click "Refresh" on the logs panel — `DevtoolRefreshButton` shows spinner during fetch, no flicker
   - [ ] Stop a service so a command errors — `DevtoolErrorPanel` renders with the kind badge + message
   - [ ] `Promise.reject(new Error('test'))` from devtools console — appears in `session-*.jsonl` within 1s
   - [ ] `throw new Error('test')` from devtools console — appears in `session-*.jsonl` within 1s
   - [ ] Confirm `.userdata/logs/run-dev-stdio.log` is populating in real time during the run

6. **Closes-out specta cleanup**
   - [ ] No commands return `Result<T, String>` after this pass UNLESS they're commands authored before this pass that we deliberately defer migrating
   - [ ] Add a note to `scripts/docs/sprints/SPRINT-FOUNDATION-PASS-COMPLETE.md` listing: final LOC, commit shas, devtools that still need migration to F-2/F-3 (their next-touch lift)

---

## Sprint exit criteria

All four phases committed, all sanity test boxes ticked, no compile/test/lint warnings introduced. Vision sprint resumes at V-5 with:
- `CommandError` available for the new `ort` SigLip2 backend's error path
- `useTauriQuery` available for V-7's config panel
- `DevtoolStatBox` / `DevtoolEmptyState` available for V-7/V-8
- `DevtoolLogsTab` available for V-8's Logs tab (replaces Sprint 3 ad-hoc Claude pattern)
- Global error handlers active so V-7/V-8/V-9's frontend bugs land in JSONL automatically

## Out of scope

- Migrating EVERY existing devtool to F-2/F-3 — happens lazily on next touch.
- sccache shared cache (deferred to Wisconsin VM standup).
- Toast / notification system (separate concern, not in scope).
- Crash reporter UI (`/devtools/errors` aggregator) — flagged as worth doing later, not this pass.

## Time estimate

Each phase is one focused commit with green tests. Total wall clock ~2-3 hours active work + cargo cycle time (which we know runs ~3-15 min per touch on the i9 desktop).
