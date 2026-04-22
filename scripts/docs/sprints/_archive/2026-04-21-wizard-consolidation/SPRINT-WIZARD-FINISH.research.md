# Research: Wizard Sprint Finish — Three Deferred Items

**Date**: 2026-04-20
**Sprint**: `SPRINT-WIZARD-FINISH.md` (to be authored)
**Status**: IN_PROGRESS
**Context**: SurrealDB down — file-based research only. Preflight DB load skipped.

---

## Overview

Three items were deferred during the wizard absorption sprint:

1. Wire `create_dev_profile` for project folder picker in `WelcomeView`
2. A2UI / Claude subscription routing mode 3-way UI
3. Full verification beyond syntactic checks (one-command pre-commit gate)

This research maps SSOTs, identifies duplication risk, and flags STOP points
for the owner before implementation begins.

---

## Item 1 — Project Folder Persistence

### SSOT Map (dev_profile has THREE storage locations)

| Storage | File / Location | Written By | Read By | Shape |
|---|---|---|---|---|
| **A. libSQL user DB** | `{data_dir}/user/libsql/user.db` → `profiles` table | `commands/devpulse/profile.rs` via `update_user_profile(displayName, email, expertiseLevel)` | `fetch_user_profile`, `fetch_user_preferences`, future settings page | `{ id, display_name, email, hardware_profile, onboarding_complete, expertise_level }` |
| **B. preferences.json** | `{data_dir}/preferences.json` → `dev_profile` key | `commands/models/mod.rs:1553` `create_dev_profile(name, experience, projectPath)` | **UNKNOWN — grep found no readers** | `{ type: "dev", name, experience, project_path, created }` |
| **C. SurrealDB graph** | `global/knowledge/dev_profile` table | Preflight doctrine (`.claude/rules/preflight.md`) + `scripts/surrealdb/schema-global.surql:88` + `services/graph.rs:389` | Preflight AI orientation (reads at session start) | `{ category, key, value, confidence, source, notes, updated_at, created_at }` |

### Duplication

| Field | In A (libSQL) | In B (prefs.json) | In C (SurrealDB) |
|---|---|---|---|
| Name | `display_name` | `name` | `value` where `key = "display_name"` |
| Email | `email` | — | `value` where `key = "email"` |
| Experience | `expertise_level` (int 1/2/3) | `experience` (string) | `value` where `key = "expertise_level"` |
| Project path | — | `project_path` | — |

**Project path ONLY lives in B.** No other storage captures it.

### Grep confirms B has no live reader

```
d:\...\commands\models\mod.rs:1550  // "Uses the same preferences.json storage as `set_preference`"
d:\...\commands\models\mod.rs:1553  pub async fn create_dev_profile(...)
d:\...\commands\models\mod.rs:1582  prefs.insert("dev_profile".to_string(), profile.to_string());
```

No file reads `prefs["dev_profile"]` to drive any runtime behavior. The legacy
spec `SPRINT-ML-06-COMPLIANCE-VERIFICATION.md:86` references a planned
`checkDevProfile` that was never authored.

### Risk

Writing to B without a reader is theatre. If the owner wants the project
folder to feed a code-aware feature (indexing, `@file` completions, RAG
embedder, devforge workspace), that feature's reader needs to exist FIRST
or the write is dead code.

### STOP — Owner Decision Required

**Question A**: Where should `project_path` ultimately live?
- Option 1: **Column on `profiles` libSQL table** (add `project_path TEXT` column). Keep `update_user_profile` as the single profile API. Delete `create_dev_profile`. Clean SSOT.
- Option 2: **Keep preferences.json** (the current write target). Author the reader (whatever consumes `project_path`) before shipping the UI wire.
- Option 3: **SurrealDB dev_profile table** (the preflight canonical one). `project_path` becomes a row with `key = "project_path"`. Owner's preflight orientation already reads from this table.

**Question B**: Should `create_dev_profile` be collapsed into `update_user_profile`?
- Currently they overlap on `name` + `experience`. Duplicate writes mean drift is inevitable (which fires first?).
- If Option 1 is chosen, `create_dev_profile` becomes dead code → delete it.
- If Option 2 or 3 is chosen, the two APIs serve different storage targets → keep both but document the split clearly.

**Question C**: When does `project_path` get persisted?
- Option X: **On "Let's Go" click** (before advancing to system-check). Aligns with "profile first" mental model.
- Option Y: **On "Save & Continue" in Config view** (part of `applyAndAdvance`). Matches the draft/commit pattern already used for slot assignments.
- Option Z: **On both** — write name/email/experience at Let's Go (quick persist so it's in DB even if user bails), project path at Save & Continue.

### Dead-code concern

If the owner chooses a path that orphans `create_dev_profile`, it must be
deleted with the call site (don't leave stubs). Same for `checkDevProfile`
references in the sprint doc — those never shipped.

---

## Item 2 — Routing Mode 3-Way UI

### SSOT Map

| Layer | File | Status |
|---|---|---|
| **Kernel enum** | `kernel/model-loader/src/assistant/config.rs:254` `RoutingMode` (LocalFirst / LocalClaudeSubscription / LocalClaudeApiCouncil) | Exists ✓ |
| **Kernel persist** | `assistant/config.rs:492` `set_routing_mode(&mut self, path, mode_str)` | Exists ✓ |
| **Engine facade** | `systems/devpulse-engine/src/platform/services/model_loader.rs` `set_routing_mode(String)` passthrough | Exists ✓ |
| **Tauri enum** | `interfaces/desktop/src-tauri/src/commands/cloud/mod.rs:18` `InferenceProvider` (mirrors kernel RoutingMode) | Exists ✓ |
| **Tauri read** | `cloud/mod.rs:50` `get_inference_provider` | Exists ✓ |
| **Tauri write** | `cloud/mod.rs:69` `set_inference_provider` → emits `provider:changed` event | Exists ✓ |
| **Generated binding** | `src/lib/sys/generated/bindings.ts` | Exists ✓ |
| **Frontend state** | *none* | **MISSING** |
| **Frontend UI** | *none* | **MISSING** |
| **Settings page binding** | *none* | **MISSING** |

### The backend is fully wired. Only the Svelte UI and state rune are missing.

### Duplication concern — `cloud/` module naming

The routing commands live under `commands/cloud/` but they control more than
"cloud" — LocalFirst is purely local. The name is a legacy artifact from when
"Local vs Cloud" was the entire model. Leaving the commands in `cloud/` is
fine mechanically, but user-facing code importing from `cloud/` implies
cloud usage, which is wrong for LocalFirst users. Low-risk but worth noting
— potential renames into `commands/routing/` or `commands/assistant/`.

### UX placement decision

The wizard has 5 views: `welcome | system-check | config | validate | done`.
Routing mode is a global assistant setting, not per-slot. Candidate locations:

- Option P: **In WelcomeView** as a radio group below experience level. Pros: captured upfront, user sees Claude option before picking brain. Cons: user hasn't hit System Check or Config yet — decision is out of context.
- Option Q: **In ConfigView as a 5th tab "Routing"**. Pros: lives alongside slot configuration, contextually correct, matches mental model that routing is part of model plumbing. Cons: slightly overloads ConfigView's role-group tabs.
- Option R: **In a new dedicated view between Config and Validate**. Pros: isolates the decision. Cons: adds a 6th view, user has to click through more.
- Option S: **Only in Settings page** (post-setup). Pros: out of the wizard critical path. Cons: user doesn't know they can enable Claude during setup.

The cleanest analog pattern is LM Studio's "Backend" toggle (local vs remote)
and Jan's "Provider" selector — both live ALONGSIDE model config, not in a
separate step. That aligns with **Option Q**.

### Draft vs instant-write

`setupSessionState` implements the draft pattern for slot assignments
(commits on Save & Continue via `applyPendingSelections`). Routing mode
could follow the same pattern OR be instant-write.

- **Draft** (aligns with slot pattern): add `pendingRoutingMode` to `setupSessionState`, commit in `applyPendingSelections`. Consistent mental model.
- **Instant-write**: call `set_inference_provider` on every radio click. Simpler, but violates the "Save & Continue is the only commit" rule.

DOGFOOD-DAY-ONE Phase 3 verification says:
> - Assistant config round-trips the mode.
> - Reloading the app restores the chosen mode.

Silent on draft vs instant — but Phase 5 is clear:
> 1. Persist profile changes.
> 2. Persist assistant routing mode.
> 3. Apply slot assignments.
> 4. Mark setup complete.

"Persist assistant routing mode" is explicitly listed in the Apply action.
Draft-pattern aligns.

### STOP — Owner Decision Required

**Question D**: Where does the 3-mode UI live in the wizard?
- Option P: WelcomeView inline radio group
- Option Q: ConfigView 5th tab "Routing"  ← research recommendation
- Option R: New dedicated view between Config and Validate
- Option S: Settings-only (defer from wizard)

**Question E**: Draft-commit or instant-write on radio click?
- Option 1: **Draft** via `setupSessionState.pendingRoutingMode` — matches slot pattern, fires `set_inference_provider` inside `applyAndAdvance`.
- Option 2: **Instant** — every radio click calls `set_inference_provider` directly. Faster feel, but "Save & Continue" loses meaning for routing.

**Question F**: In settings (post-wizard), same component or different?
- Reuse wizard component → DRY.
- Different component → settings can be richer (show Claude quota status, API key status, council arbitration rules).

---

## Item 3 — One-Command Verification Gate

### SSOT Map — what verification exists today

**Rust per-crate:**
- `cargo check -p <crate>` — typecheck only
- `cargo test -p model-loader --test real_loader_smoke` — real model load smoke
- `cargo test -p devpulse-clyffy knowledge_smoke` — knowledge module tests (8 tests)
- `cargo clippy -p <crate>` — lint
- `cargo fmt --all -- --check` — format check

**Frontend (pnpm scripts, verified):**
- `pnpm check` → `svelte-check --tsconfig ./tsconfig.json` — type + Svelte diagnostics
- `pnpm lint` → `biome check src/` — biome
- `pnpm test` → `vitest` (watch)
- `pnpm test:run` → `vitest run` (one-shot)
- `pnpm test:ci` → `CI=true vitest run`
- `pnpm test:e2e` → `playwright test`
- `pnpm test:all` → `vitest run && playwright test`
- `pnpm ds:tokens:build` — SD5 token build
- `pnpm coldlight:verify` — manifest validation
- `pnpm check:ipc` — custom script `check-no-raw-invoke.mjs`

**Lefthook pre-commit:**
- rust-fmt, rust-check (workspace), svelte-check, ip-boundary-check, no-legacy-prefixes, biome-lint, no-raw-values, docs-preflight, tokens-regen, coldlight-verify, coldlight-docs

**Lefthook pre-push:**
- clippy (workspace, `-D warnings`), cargo deny check advisories, svelte-check

**Lefthook commit-msg:**
- commitlint

### What's missing

- **No single entry point** that runs everything. Owner has to either trigger a git commit (which triggers lefthook) or manually sequence the commands.
- **No xtask aggregator** command for "run every gate locally".
- **cargo test suite** is not run by lefthook at all — not pre-commit, not pre-push. Only `cargo check` and `cargo clippy` run. The smoke tests are on-demand only.
- **pnpm test / vitest** is not run by lefthook either. No unit tests are gated.
- **pnpm test:e2e / playwright** — requires a running app + state setup, not suitable for pre-commit but should be a pre-merge gate.

### Options for a one-command gate

- Option V1: **`cargo xtask verify`** (Rust xtask) that sequences `cargo fmt --check`, `cargo clippy --workspace -- -D warnings`, `cargo test --workspace`, then shells out to `pnpm check && pnpm lint && pnpm test:run`. Canonical pattern — works from any terminal.
- Option V2: **`pnpm verify`** script in `interfaces/desktop/package.json` that does the same. Requires the frontend dir but simpler.
- Option V3: **`pnpm verify:all`** at repo root, orchestrating via a root `package.json` or `turbo`. Most aligned with a monorepo but introduces turbo as a dep.

### Test selection

For the initial gate, the required tests:

| Target | Why | Runtime |
|---|---|---|
| `cargo fmt --all -- --check` | Format drift | <1s |
| `cargo clippy --workspace -- -D warnings` | Lint drift | ~2 min (first run) / ~5s (incremental) |
| `cargo test -p model-loader --lib` | Unit tests (slot registry, registry scan, etc.) | ~10s |
| `cargo test -p devpulse-clyffy knowledge` | Knowledge module smoke | ~5s |
| `pnpm check` | Svelte/TS diagnostics | ~10s verbose |
| `pnpm lint` | Biome | ~3s |
| `pnpm test:run` | Vitest unit | depends on test count |
| `pnpm check:ipc` | No raw invoke() | <1s |

**NOT included in pre-commit gate (too slow or needs app):**
- `cargo test -p model-loader --test real_loader_smoke` — requires models/ dir with real files
- `pnpm test:e2e` — requires running app
- `cargo deny check advisories` — network fetch

### STOP — Owner Decision Required

**Question G**: Which tool runs the aggregated gate?
- Option V1: `cargo xtask verify` (Rust-hosted)  ← research recommendation for consistency with existing xtask
- Option V2: `pnpm verify` (JS-hosted, scoped to interfaces/desktop)
- Option V3: `pnpm verify:all` at repo root (monorepo task runner)

**Question H**: Should `cargo test` be included in pre-commit or pre-push only?
- Pre-commit: ~15s extra on every commit. Slower feedback for trivial changes.
- Pre-push: faster commits, but a broken commit can sit locally unnoticed.

**Question I**: Is the existing lefthook config good enough?
- If yes, the task is simply "run `lefthook run pre-commit`" or "run `lefthook run pre-push`" when the owner wants a manual gate. No new tool needed.
- If no, author V1/V2/V3 above.

---

## Pre-Sprint Consolidation — DO NOT SKIP

These duplications exist TODAY and will cause drift during this sprint if not
resolved first:

1. **`dev_profile` SSOT split** across preferences.json / libSQL / SurrealDB.
   Item 1 cannot proceed cleanly until the owner picks ONE.
2. **`create_dev_profile` vs `update_user_profile` overlap** on `name` + `experience`.
   Resolve alongside (1).
3. **`commands/cloud/InferenceProvider` vs kernel `RoutingMode`** — two type
   aliases for the same enum. Not strictly a bug (the Tauri-side enum adds
   specta derive), but worth documenting so nobody authors a THIRD alias.

Flag: `SPRINT-DOGFOOD-DAY-ONE.md` Phase 3 status should update after Item 2
lands — it currently says "Assistant config persistence: DONE" but the UI
binding is missing. Phase 4 is the one that lands the UI.

---

## Anti-Pattern Risks

If implementation is rushed, these are the likely anti-patterns:

| Risk | Symptom | Prevention |
|---|---|---|
| **Project path as dead write** | `create_dev_profile` called but nothing reads `project_path` | Owner picks storage target (Q-A) and auto-authoring of the reader is part of scope, not deferred |
| **3rd dev_profile shim** | Owner avoids the decision → new `dev_profile.v2` somewhere | STOP gate on Q-A. No forward progress without answer |
| **Routing mode via `cloud/`** | UI module imports from `cloud/` even when LocalFirst | Export a re-alias from `commands/assistant/` OR rename the module. Decide in Q-D |
| **Draft/instant inconsistency** | Routing is instant-write but slots are draft → user confused about what "Save" covers | Answer Q-E unambiguously. Document in SetupWizardOverlay comment |
| **Gate added but not enforced** | `cargo xtask verify` exists but nobody runs it | Wire into lefthook OR add a CI job. Decide in Q-I |
| **Test snapshots locked before tests green** | `pnpm test:run` fails on a new test case that nobody wrote, blocks commits | Item 3 Phase C is "audit + make existing tests green" before gate enforcement |

---

## Files Referenced

### Item 1
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs:1553` — `create_dev_profile`
- `interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs` — `update_user_profile`
- `interfaces/desktop/src-tauri/src/commands/sys/config.rs` — `get_preference` / `set_preference`
- `scripts/surrealdb/schema-global.surql:88` — SurrealDB `dev_profile` table
- `systems/devpulse-engine/src/platform/services/graph.rs:389` — engine-side surreal schema
- `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/views/WelcomeView.svelte` — current picker
- `.claude/rules/preflight.md:30,129` — preflight's expectation that dev_profile lives in SurrealDB

### Item 2
- `kernel/model-loader/src/assistant/config.rs:254` — kernel `RoutingMode` enum
- `kernel/model-loader/src/assistant/config.rs:492` — kernel `set_routing_mode` persist
- `interfaces/desktop/src-tauri/src/commands/cloud/mod.rs:18,69,50` — Tauri layer
- `interfaces/desktop/src/lib/sys/generated/bindings.ts` — typed bindings
- `interfaces/desktop/src/lib/domains/app/models/data-access/setup-session.state.svelte.ts` — draft pattern reference
- `interfaces/desktop/src/routes/(app)/devpulse/settings/+page.svelte` — settings page target
- `scripts/docs/sprints/SPRINT-DOGFOOD-DAY-ONE.md` Phases 3 + 4

### Item 3
- `lefthook.yml` — existing hook surface
- `interfaces/desktop/package.json` scripts
- `kernel/model-loader/tests/real_loader_smoke.rs` — smoke test
- `kernel/devpulse-clyffy/src/cortex/knowledge/tests.rs` — knowledge smoke
- `Cargo.toml` `[workspace]` — workspace member list (xtask location)

---

## Recommendations

1. **STOP and get owner answers on Q-A through Q-I before ANY coding starts.**
   Every one of these can cascade if implemented against the wrong target.
2. **Resolve dev_profile SSOT first.** Even if Item 1 is parked, the conflict is
   a latent bug for anything touching profile persistence.
3. **Item 2 is the shortest.** Backend is fully wired — it's just a radio
   group, a state field, and a settings binding. Scope: S.
4. **Item 3 is owner-preference.** If the existing lefthook is sufficient,
   just document "run `lefthook run pre-commit` before you're ready to commit."
   If the owner wants a single `cargo xtask verify` entry point, build it.
   Scope: XS (docs) to M (new xtask target).
5. **Item 1 is the biggest.** After owner picks storage, scope is S-M depending
   on whether a reader needs authoring too.

---

## Deferred Beyond This Sprint

Do NOT absorb into this sprint:
- Model swap flow UX (separate sprint)
- Telemetry spans around wizard events (follow-up)
- A2UI agent component trees (kernel work, out of scope)
- Claude subscription OAuth flow (separate sprint)
- Code indexer that would consume `project_path` (separate sprint)
