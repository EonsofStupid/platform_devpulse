# SPRINT: Wizard Finish — Project Folder + Routing UI + Verification Gate

> **Date**: 2026-04-20
> **Owner**: EonsofStupid
> **Research**: `SPRINT-WIZARD-FINISH.research.md`
> **Status**: STOP gates answered 2026-04-20 (decisions doc). AUTHORING.
> **Preceded by**: `SPRINT-DOGFOOD-DAY-ONE.md` (most Phases DONE; Phase 4
>   and Phase 6-followup live here)
>
> **Decisions (locked 2026-04-20, see `SPRINT-WIZARD-FINISH.decisions.md`):**
> Q-A → A1 libSQL column · Q-B → B1 collapse · Q-C → C2 Save & Continue ·
> Q-D → D2 ConfigView 5th tab · Q-E → E1 draft · Q-F → F1 reuse ·
> Q-G → G1 cargo xtask verify · Q-H → H2 pre-push · Q-I → I2 aggregator

---

## Context: Why Phase 0 Comes First

16 days of little progress. 2 days with the app failing to boot. The wizard
work cannot proceed safely on a codebase we cannot observe while it runs.
Phase 0 is a one-time observability investment that turns every subsequent
hour of debugging from "guess and retry" into "read and fix."

Gaps identified in the current stack:
- `tracing-subscriber` + JSONL + DuckDB span layer + OTel are all wired,
  but hot-path async fns emit bare `info!` without `#[instrument]`, so no
  span tree, no timing, no auto-correlation.
- Command handlers return `Result<_, String>`, discarding the cause chain.
  Every error surfaces as "Failed to X" with no source frame.
- `tokio-console` would have caught the recent `RwLock` write-preferring
  deadlock in seconds. Not wired.
- No jq cookbook for tailing the session JSONL — owner reads the stream
  by eye instead of filtering.
- No human-facing worklog — session-to-session context lives in AI memory
  only, fragile to compaction.

Phase 0 closes those gaps. Additive. Opt-in where risky. Zero impact on
the default build.

---

## What This Sprint Finishes

Four items (Phase 0 pre-pended to the original three):

0. **Observability foundation** — `#[instrument]` on hot paths, typed
   errors with `anyhow::Context` at command boundaries, `tokio-console`
   behind an opt-in feature, JSONL cookbook, worklog folder.
1. **Project folder persistence** — WelcomeView's folder picker writes
   through to the `profiles` libSQL table via `update_user_profile`.
   `create_dev_profile` is deleted.
2. **Routing mode 3-way UI** — `RoutingModeRadio` component, ConfigView
   5th tab "Routing", draft-commit via `setupWizardOverlayState`,
   reused on settings page.
3. **One-command verification gate** — `cargo xtask verify` expanded,
   `cargo test --workspace --lib` added to lefthook pre-push, `VERIFICATION.md`.

Nothing else. No scope creep.

---

## Non-Negotiables

- Svelte stays DUMB. No frontend triggering of scans or auto-loads. All state
  flows from push events and explicit user clicks.
- DTCG / ColdLight tokens only. No raw hex, no raw px. Existing
  `--wizard-*` + `--accent-*` families.
- No kernel vocabulary outside `kernel/` (per `.claude/rules/ip-protection.md`).
- Per-slot Apply pattern preserved. Master "Save & Continue" does not load.
- No shims, no `// TODO` placeholders, no "deferred to next sprint" stubs
  for anything in this sprint's scope.
- Cargo + svelte-check + biome must be green before phase close.
- Logging on every action: `logInfo("wizard.{view}", "X clicked")`, errors
  through `logError` so the Rust tracing pipeline captures them.

---

## Phase 0 — Observability Foundation

**Scope**: **M** — five independent slices, all additive.
**Prerequisite**: None. Runs FIRST, before any consolidation or feature work.
**Risk posture**: Every change must be independently compilable and
  revertable. Opt-in where the change touches cargo features or rustflags.

### 0a — `#[instrument]` on hot-path async fns

**Why**: Bare `tracing::info!` calls log individual events. `#[instrument]`
auto-wraps the call in a span that records entry, exit, duration, all
recorded fields, and correlates with child spans. Free structured trace
tree without touching the body.

**Files** (max 5):
- `systems/devpulse-engine/src/platform/services/model_loader.rs` — instrument
  `initialize`, `scan_models`, `assign_slot`, `warm_slot`, `swap`, `unload`.
  `skip_all` + explicit `fields(slot_id = %slot_id)` to keep args out of logs
  but keep the slot ID searchable.
- `systems/devpulse-engine/src/platform/boot/model_loader.rs` — instrument
  the detached scan spawn so the background task shows up in traces.
- `kernel/devpulse-clyffy/src/cortex/persistence/libsql.rs` — instrument
  `open`, `execute`, `query` on the adapter. `#[instrument(skip(self, params), err)]`
  so failed SQL shows up with the query text attached.
- `kernel/model-loader/src/service.rs` — instrument the sub-struct mutation
  entry points (RegistryState, InferenceState). Kernel-internal, so vocabulary
  is unrestricted here.
- `interfaces/desktop/src-tauri/src/lib.rs` — instrument `run()` and any
  top-level Tauri setup handler that currently has bare `info!`.

**Verification**: `cargo check -p devpulse_desktop_backend` green after
each file. Run the app, open a session JSONL — entries now include a `span`
object with `name`, `fields`, and elapsed timing.

### 0b — `anyhow::Context` at command boundaries

**Why**: Nearly every Tauri command handler returns `Result<T, String>`
— `format!("Failed to X: {e}")` pattern. That discards the cause chain.
A cascade of 4 errors surfaces as a single "Failed to query profiles"
string with zero indication of the driver-level source. `anyhow::Error`
with `.context()` at each `?` gives you the full chain printed on RUST_BACKTRACE.

**Files** (max 5 per sub-phase — queued across multiple commits):
- `interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs` — convert
  return types from `Result<T, String>` to `Result<T, String>` BUT use
  `anyhow::Result<T>` internally + `.map_err(|e| format!("{e:#}"))` at the
  boundary so the serialized string contains the full chain via `{e:#}`
  (the `#` alt formatter walks `.source()`).
- `interfaces/desktop/src-tauri/src/commands/cloud/mod.rs` — same pattern.
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — same pattern.
- `interfaces/desktop/src-tauri/src/commands/knowledge.rs` — same pattern.
- `systems/devpulse-engine/src/platform/services/model_loader.rs` — internal
  fn signatures migrate to `anyhow::Result<T>` where they currently return
  String errors.

**Pattern** (applied consistently):
```rust
#[tauri::command]
#[specta::specta]
pub async fn do_thing(state: State<'_, PlatformState>) -> Result<Out, String> {
    inner_do_thing(&state).await.map_err(|e| format!("{e:#}"))
}
async fn inner_do_thing(state: &State<'_, PlatformState>) -> anyhow::Result<Out> {
    let adapter = get_adapter(state).await.context("fetch adapter")?;
    let rows = adapter.query(SQL, &[]).await.context("query X")?;
    Ok(rows.into())
}
```

Frontend still sees `Result<T, string>`. Rust side gets full chain. Tauri-specta
bindings unaffected — the public surface is identical.

**Verification**: Introduce a deliberate error (point a read at a bad path),
confirm the frontend toast text now shows `context: context: root error` instead
of `"Failed"`.

### 0c — `console-subscriber` opt-in feature

**Why**: `tokio-console` attaches to a running app and shows the live task
graph: who's spawned, who's blocked on what lock, which tasks have been
stuck > 200ms. Would have diagnosed the `RwLock` write-preferring deadlock
in under a minute.

**Risk**: Requires `tokio_unstable` cfg. Wired as OPT-IN behind the
`tokio-console` cargo feature so default `cargo run` / release builds
are unchanged.

**Files**:
- `interfaces/desktop/src-tauri/Cargo.toml` — add `console-subscriber` as
  optional dep, add `tokio-console = ["dep:console-subscriber"]` feature.
- `interfaces/desktop/src-tauri/src/logging.rs` — when feature enabled,
  add `ConsoleLayer::builder().spawn()` to the subscriber registry in
  `init()` and `init_stderr_only()`, guarded by `#[cfg(feature = "tokio-console")]`.
- `.cargo/config.toml` (root) — document a `[target.'cfg(tokio_unstable)']`
  rustflags entry OR add a shell snippet in `VERIFICATION.md` showing how
  to enable: `RUSTFLAGS="--cfg tokio_unstable" cargo run --features tokio-console`.

**Verification**: `cargo check -p devpulse_desktop_backend` green with and
without the feature. With feature: `tokio-console` connects to `127.0.0.1:6669`,
shows live task list.

### 0d — `VERIFICATION.md` cookbook

**Why**: Owner needs a reference card for the observability stack that
already exists and the new pieces Phase 0 adds. Single doc, copy-pasteable
commands.

**File**:
- `scripts/docs/VERIFICATION.md` — NEW. Sections:
  - 4-pane dev loop (cargo watch · pnpm check watch · jq tail · tokio-console)
  - jq filter cookbook for session JSONL (last errors, slot state changes,
    slow spans, boot phase timing)
  - How to run `cargo xtask verify` (Phase C output)
  - How to enable `tokio-console` feature (Phase 0c)
  - Environment variables: `RUST_LOG`, `DEVPULSE_LOG_LEVEL`, `RUSTFLAGS`
  - Worklog protocol (Phase 0e)

### 0e — Human worklog

**Why**: AI memory (`MEMORY.md`) is for the assistant. The owner needs a
human-facing append-only log of what happened each session — what was tried,
what broke, what was learned. Survives context compaction; survives conversations.

**Files**:
- `scripts/docs/worklog/README.md` — NEW. Protocol: one file per day,
  three-bullet template, 30-second end-of-session discipline.
- `scripts/docs/worklog/2026-04-20.md` — NEW. Today's entry covering the
  planning + Phase 0 kickoff.

### Phase 0 verification gate (sprint-close)

- [ ] `cargo check -p devpulse_desktop_backend` green.
- [ ] `cargo check -p devpulse_desktop_backend --features tokio-console` green
      (requires `RUSTFLAGS=--cfg tokio_unstable`).
- [ ] `pnpm check` green (no frontend side-effects from Phase 0).
- [ ] Session JSONL contains `span` objects with names matching the
      instrumented fns.
- [ ] Deliberate failure (e.g. wrong DB path) surfaces a multi-line cause
      chain in the Tauri frontend toast, not "Failed".
- [ ] `tokio-console` connects when the feature is enabled.

### Phase 0 — Do NOT touch

- Kernel vocabulary in public logs (`#[instrument(name = "...")]` must use
  public registry names for engine-side code; kernel-side is unrestricted).
- `logInfo`/`logError` contract on the frontend — stays identical.
- Existing DuckDB span layer + OTel layer — they already consume spans
  from `tracing::Subscriber`, so `#[instrument]` feeds them automatically.
- JSONL rotation — already works.

---

## Pre-Sprint Consolidation (blocks Phase A)

Three duplicates identified in research. Resolve or document first:

1. **`dev_profile` SSOT split** across three storages — blocks Phase A
   entirely until owner picks one.
2. **`create_dev_profile` vs `update_user_profile` overlap** on
   `name` + `experience`. Delete-or-document decision depends on (1).
3. **`cloud::InferenceProvider` vs kernel `RoutingMode`** — two aliases for
   the same enum. Functional but confusing. Not a blocker.

---

## STOP Gates — Owner Decision Required

No coding starts until these are answered. Each STOP is flagged with an ID
so answers can be linked back.

### STOP 1 (Q-A) — Where does `project_path` live?
**Options**:
- **A1**: `profiles` libSQL table — new `project_path TEXT` column. `update_user_profile` takes a 4th arg. `create_dev_profile` is deleted.
- **A2**: `preferences.json` (status quo). Author a reader that actually consumes the path (indexer hook, `@file` completer, etc.) before shipping.
- **A3**: SurrealDB `dev_profile` table per preflight canon. Project path becomes a row with `key = "project_path"`.

**Impact**: Determines which backend surface the WelcomeView folder picker calls. Determines whether `create_dev_profile` lives or dies.

### STOP 2 (Q-B) — Collapse profile APIs?
**Options**:
- **B1**: Collapse `create_dev_profile` into `update_user_profile` (requires A1). Single profile API. Best for clean SSOT.
- **B2**: Keep both — document that `create_dev_profile` serves A2 or A3 only. Dual APIs, risk of drift.

**Impact**: Code surface. Drift risk.

### STOP 3 (Q-C) — When does project path persist?
**Options**:
- **C1**: On "Let's Go" click (before advancing to System Check). Profile in DB even if user closes the wizard early.
- **C2**: On "Save & Continue" in ConfigView (part of `applyAndAdvance`). Matches draft/commit pattern for slots.
- **C3**: Both — quick name/email/experience save at Let's Go, project path at Save & Continue.

**Impact**: User's mental model of "when is my data saved."

### STOP 4 (Q-D) — Routing mode UI location
**Options**:
- **D1**: WelcomeView inline radio group under experience level.
- **D2** (research recommendation): ConfigView 5th tab "Routing". Lives alongside slot config — matches LM Studio backend toggle pattern.
- **D3**: New dedicated view between Config and Validate.
- **D4**: Settings-only (defer from wizard — not recommended given DOGFOOD Phase 4 requires wizard UI).

**Impact**: Wizard flow structure. Whether ConfigView gains a tab.

### STOP 5 (Q-E) — Draft-commit or instant-write for routing
**Options**:
- **E1**: Draft via `setupSessionState.pendingRoutingMode` — commits inside `applyAndAdvance`. Matches slot pattern.
- **E2**: Instant — every radio click fires `set_inference_provider`. Faster feel, violates "Save = only commit" rule.

**Impact**: Consistency of the draft/commit mental model.

### STOP 6 (Q-F) — Settings routing component
**Options**:
- **F1**: Reuse the wizard radio component in settings. DRY.
- **F2**: Settings gets a richer component (quota display, API key status, council arbitration explanation).

**Impact**: Settings page scope.

### STOP 7 (Q-G) — Verification gate entry point
**Options**:
- **G1** (research recommendation): `cargo xtask verify` — matches existing xtask pattern. One entry, any terminal.
- **G2**: `pnpm verify` scoped to `interfaces/desktop`. Simpler but JS-only.
- **G3**: Repo-root `pnpm verify:all` via turbo or workspace script.

**Impact**: Where the entry lives. Cross-platform behavior.

### STOP 8 (Q-H) — `cargo test` in pre-commit or pre-push?
**Options**:
- **H1**: Pre-commit. Safer. ~15s extra per commit.
- **H2**: Pre-push. Faster commits. Broken state can sit locally.

**Impact**: Developer velocity vs safety trade-off.

### STOP 9 (Q-I) — Is existing lefthook sufficient?
**Options**:
- **I1**: Yes — document "run `lefthook run pre-commit`" and call the sprint done on Item 3.
- **I2**: No — build V1/V2/V3 aggregator per Q-G.

**Impact**: Whether Phase C is docs-only or new-tool.

---

## Phase A — Project Folder Persistence (depends on STOP 1-3)

**Scope**: **S to M** depending on answers to STOP 1-3.
**Prerequisite**: STOP 1, 2, 3 answered.

### Files (contingent)

**If A1 chosen** (libSQL column + collapse):
- `systems/devpulse-engine/src/platform/services/relational.rs` — USER_SCHEMA gains `project_path TEXT`
- `interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs` — `update_user_profile` signature + body
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — DELETE `create_dev_profile` + call site in `lib.rs` command registration
- `interfaces/desktop/src/lib/sys/generated/bindings.ts` — regenerate
- `interfaces/desktop/src/lib/domains/app/models/data-access/setup-wizard-overlay.state.svelte.ts` — `saveProfileDraft` takes the 4th arg
- `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/views/WelcomeView.svelte` — wire `projectPath` into draft state

**If A2 chosen** (preferences.json + reader):
- Author the reader (owner picks which feature consumes it — might be scope creep)
- `WelcomeView.svelte` — wire `projectPath` into state, call `create_dev_profile` at STOP 3's chosen time

**If A3 chosen** (SurrealDB table):
- `systems/devpulse-engine/src/platform/services/graph.rs` — helper write function
- `interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs` — new surreal-backed setter
- WelcomeView wiring

### Verification gate (all options)

- `cargo check -p devpulse_desktop_backend` — 0 errors
- `pnpm check` — 0 errors
- Round-trip test: set path via UI → close wizard → reopen settings → path is visible.

### Do NOT touch

- `chat.brain`, slot registration, kernel model-loader code.
- `setupSessionState.pendingSelections` (slot draft state — stays separate).
- Any view other than WelcomeView + settings profile page.

---

## Phase B — Routing Mode 3-Way UI (depends on STOP 4-6)

**Scope**: **S** (backend exists, only UI).
**Prerequisite**: STOP 4, 5, 6 answered.

### Files (contingent)

**Shared (all Q-D options)**:
- `interfaces/desktop/src/lib/domains/app/models/data-access/routing.state.svelte.ts` — NEW, dumb bucket for current routing mode. Subscribes to `provider:changed` event, exposes a `$state` rune.
- `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/components/RoutingModeRadio.svelte` — NEW, 3-radio component. Props: `value`, `onSelect`, `disabled`. DTCG tokens. Each option has WizardHelpTip explaining what the mode does.

**If D1 (WelcomeView)**:
- `views/WelcomeView.svelte` — add `<RoutingModeRadio>` below experience level

**If D2 (ConfigView 5th tab — recommended)**:
- `views/ConfigView.svelte` — add `"routing"` to `RoleTab` union, 5th tab rendering `<RoutingModeRadio>`, WizardHelpTip + WizardInfoPopup explaining the three modes
- Description text for routing tab: "Choose whether Clyffy stays purely local or can lean on Claude."

**If D3 (new view)**:
- `views/RoutingView.svelte` — NEW, holds the radio
- `setup-wizard-overlay.state.svelte.ts` — add `"routing"` to `SetupWizardView` union
- `SetupWizardOverlay.svelte` — render branch
- Flow: config → routing → validate → done

**If E1 (draft)**:
- `setupSessionState` — add `pendingRoutingMode`, `applyPendingSelections` commits via `set_inference_provider`
- Radio onSelect writes to `pendingRoutingMode`, does NOT call IPC

**If E2 (instant)**:
- Radio onSelect calls `commands.setInferenceProvider(mode)` directly
- `applyAndAdvance` does NOT touch routing

### Settings page (STOP 6)

- `interfaces/desktop/src/routes/(app)/devpulse/settings/+page.svelte` — add routing section. F1 = reuse `RoutingModeRadio`. F2 = bigger component.

### Verification gate

- `pnpm check` — 0 errors.
- Radio round-trip: select LocalClaudeSubscription → close wizard → `get_inference_provider` returns it. `provider:changed` event fires.
- If E1: routing does NOT change until Save & Continue.
- If E2: routing DOES change immediately on radio click.

### Do NOT touch

- Kernel `RoutingMode` enum (already exists, canonical).
- `cloud/mod.rs` backend — functional, don't re-plumb.
- Slot cards (they're not related).

---

## Phase C — Verification Gate (depends on STOP 7-9)

**Scope**: **XS** (docs-only) to **M** (new aggregator).
**Prerequisite**: STOP 7, 8, 9 answered.

### Files (contingent)

**If I1 (lefthook sufficient)**:
- `scripts/docs/VERIFICATION.md` — NEW doc: "Run `lefthook run pre-commit` for the full gate. Run `lefthook run pre-push` for clippy + typecheck."
- `CONTRIBUTING.md` or `README.md` — link to VERIFICATION.md

**If I2 + G1 (`cargo xtask verify`)**:
- `xtask/src/commands/verify.rs` — NEW. Shells out in sequence:
  1. `cargo fmt --all -- --check`
  2. `cargo clippy --workspace -- -D warnings`
  3. Cargo tests (STOP 8 decides which)
  4. `cd interfaces/desktop && pnpm check && pnpm lint && pnpm test:run && pnpm check:ipc`
- `xtask/src/main.rs` — register the subcommand
- `scripts/docs/VERIFICATION.md` — documents `cargo xtask verify`

**If I2 + G2 (`pnpm verify`)**:
- `interfaces/desktop/package.json` — add `"verify": "pnpm check && pnpm lint && pnpm test:run && pnpm check:ipc"`
- `scripts/docs/VERIFICATION.md`

**If I2 + G3 (repo-root aggregator)**:
- `package.json` (root) — NEW, with `"verify": "..."`
- Turbo or similar — NEW dep, more weight

### Test inclusion (Q-H)

- **H1**: Add `cargo test --workspace --lib` to lefthook pre-commit.
- **H2**: Add `cargo test --workspace --lib` to lefthook pre-push only.

### Verification gate

- `cargo xtask verify` (or chosen entry) exits 0 on a clean tree.
- Introducing a known-bad change (e.g. `let x: i32 = "string";`) causes exit 1.
- Time budget: pre-commit <30s on incremental, pre-push <5min.

### Do NOT touch

- The broader xtask surface (beyond adding `verify` subcommand).
- CI pipeline (out of scope — that's a follow-up).

---

## Execution Order (owner-ordered 2026-04-20)

Execution is now GATED on P0 because the app has been failing to boot for
2 days. No feature work ships on a codebase that doesn't start.

| # | Sprint | Sprint doc | Scope | Status |
|---|---|---|---|---|
| **P0** | **Boot Never Freezes — UI-first, lock-free async** | `SPRINT-PHASE-P0-BOOT-NEVER-FREEZES.md` | **L** | **BLOCKING ALL** |
| 0a | `#[instrument]` on boot + persistence + model_loader | (inline above + commits) | S | **DONE** |
| 0b | `anyhow::Context` at command boundaries | `SPRINT-PHASE-0B-ANYHOW-CONTEXT.md` | M | partial (profile.rs + cloud/mod.rs done) |
| 0c | `tokio-console` opt-in feature | `SPRINT-PHASE-0C-TOKIO-CONSOLE.md` | S | blocks on P0 (tool validates P0) |
| 0d | `VERIFICATION.md` cookbook | `SPRINT-PHASE-0D-VERIFICATION-COOKBOOK.md` | XS | after P0 |
| 0e | Human worklog | `SPRINT-PHASE-0E-WORKLOG.md` | XS | parallelizable |
| — | Pre-Sprint Consolidation (delete dead code + alias doc) | `SPRINT-PHASE-CONSOLIDATION.md` | XS | after P0 |
| A | `project_path` libSQL column + wizard wire | `SPRINT-PHASE-A-PROJECT-FOLDER.md` | M | after Consolidation |
| B | `/devtools/claude` Default Brain + auto-fallback routing | `SPRINT-PHASE-B-DEVTOOLS-CLAUDE.md` | S-M | after P0 (parallelizable with A) |
| C | `cargo xtask verify` expansion + lefthook pre-push | `SPRINT-PHASE-C-VERIFY-GATE.md` | M | LAST (gates it all) |

Rules of engagement:
1. **P0 first. Nothing else merges until P0 is green.**
2. Single commit per sub-slice within each sprint.
3. Compile after every file edit.
4. Measured cold-boot time must be <2 seconds once P0 lands — this is the
   structural invariant everything downstream depends on.
5. Phase C (`cargo xtask verify`) is intentionally last so A and B aren't
   gated on a tool that doesn't yet cover them.

---

## Verification Checklist (sprint close)

- [ ] STOP 1-9 answered and recorded (sprint frontmatter or commit body).
- [ ] Pre-Sprint Consolidation done (dead code gone, aliases documented).
- [ ] Phase A: project path round-trips (set in wizard → persists → readable).
- [ ] Phase A: chosen `dev_profile` storage target has a real reader, not a dead write.
- [ ] Phase B: radio group commits (E1 via Save & Continue; E2 instantly).
- [ ] Phase B: reopening the wizard or settings shows the persisted choice.
- [ ] Phase B: `provider:changed` event fires on change.
- [ ] Phase C: one-command gate exists, documented, and catches a deliberate
      type error.
- [ ] All three: `cargo check -p devpulse_desktop_backend` passes.
- [ ] All three: `pnpm check --output human-verbose` passes with 0/0.
- [ ] All three: `lefthook run pre-commit` passes.
- [ ] No new files under `_archive/` or `steps/` (those are archived).
- [ ] No kernel terms leaked outside `kernel/` (lefthook ip-boundary-check
      must pass on the diff).

---

## Deferred (NOT in this sprint)

- Claude subscription OAuth flow
- Code indexer consuming `project_path`
- Council arbitration rules configuration UI
- Model swap UX separate to wizard
- CI pipeline integration
- A2UI agent component trees (kernel work)

---

## Links

- Research: `SPRINT-WIZARD-FINISH.research.md`
- Parent: `SPRINT-DOGFOOD-DAY-ONE.md`
- Superseded: `SPRINT-WIZARD-OVERLAY-ABSORPTION.md` (step flow abandoned in
  favour of 5-view + draft/commit pattern)
