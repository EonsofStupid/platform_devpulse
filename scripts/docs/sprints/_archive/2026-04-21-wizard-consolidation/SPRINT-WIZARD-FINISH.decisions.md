# SPRINT-WIZARD-FINISH — Locked Decisions (Q-A through Q-I)

| Status | Extracted from notes |
|---|---|
| Source | `SPRINT-WIZARD-FINISH.md` + `SPRINT-WIZARD-FINISH.research.md` |
| Nature | Decision log — owner-confirmed answers to the 9 STOP questions |
| Parent sprint | `SPRINT-DOGFOOD-DAY-ONE.md` |
| Supersedes | `SPRINT-WIZARD-OVERLAY-ABSORPTION.md` (step flow abandoned) |
| Completion | **All 9 answered 2026-04-20 — ready to execute** |


---

## Locked answers

| # | ID | Question | Decision | Rationale (from notes) |
|---|----|----------|----------|------------------------|
| 1 | **Q-A** | Where does `project_path` live? (libSQL / preferences.json / SurrealDB) | **A1** — libSQL column on `profiles` table | Clean SSOT. `preferences.json` currently has no reader; `create_dev_profile` writes to dead storage. SurrealDB option requires preflight table. Column add is cheapest viable path. |
| 2 | **Q-B** | Collapse `create_dev_profile` into `update_user_profile`? | **B1** — collapse (requires A1) | Single profile API. `create_dev_profile` becomes dead code once A1 lands — delete it with its call site. |
| 3 | **Q-C** | When does `project_path` persist? (Let's Go / Save & Continue / both) | **C2** — Save & Continue | Matches draft/commit pattern already used by slot assignments. "Save & Continue is the only commit" rule preserved. |
| 4 | **Q-D** | Routing UI location? (Welcome / Config-tab / new view / settings-only) | **D2** — ConfigView 5th tab "Routing" | Lives alongside slot config. Matches LM Studio backend toggle pattern. Research recommendation. |
| 5 | **Q-E** | Routing draft-commit or instant-write? | **E1** — draft | Adds `pendingRoutingMode` to `setupSessionState`, commits inside `applyPendingSelections`. Matches slot pattern. Consistent draft/commit mental model. |
| 6 | **Q-F** | Settings routing component: reuse or separate? | **F1** — reuse for now | Same `<RoutingModeRadio>` component in both wizard and settings. Fork only if settings gains divergent behaviour. |
| 7 | **Q-G** | Verification gate entry point? (xtask / pnpm / repo-root) | **G1** — `cargo xtask verify` | Matches existing xtask pattern. One entry, any terminal. Rust-hosted. |
| 8 | **Q-H** | `cargo test` in pre-commit or pre-push? | **H2** — pre-push | Velocity over friction. Clippy + typecheck + tests all gate pre-push. Pre-commit stays under 30s budget. |
| 9 | **Q-I** | Is existing lefthook enough? | **I2** — build the aggregator, lefthook calls it | Single source of truth. `cargo xtask verify` (from G1) IS the gate. Lefthook pre-push invokes it. No drift between "manual verify" and "hook verify" — they're the same command. Best practice: one entry point, composable, terminal-agnostic. |

---

## All 9 answered — execution checklist

Every checkbox in `SPRINT-WIZARD-FINISH.md` §282-297 is now unblocked. Files to touch, grouped by locked answer:

### A1 + B1 — Profile SSOT collapse

- `systems/devpulse-engine/src/platform/services/relational.rs` — `USER_SCHEMA` gains `project_path TEXT` column
- `interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs` — `update_user_profile` takes a 4th arg (`project_path: Option<String>`)
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — **DELETE** `create_dev_profile` function
- `interfaces/desktop/src-tauri/src/lib.rs` — **DELETE** `create_dev_profile` from command registration
- `interfaces/desktop/src/lib/sys/generated/bindings.ts` — regenerate via specta
- `interfaces/desktop/src/lib/domains/app/models/data-access/setup-wizard-overlay.state.svelte.ts` — `saveProfileDraft` takes 4th arg

### C2 — Persist `project_path` at Save & Continue (not Let's Go)

- `setupSessionState.pendingProjectPath` drafted while user edits
- Commit path is `applyPendingSelections` → calls `update_user_profile(displayName, email, expertiseLevel, projectPath)`
- "Let's Go" click does NOT persist project path (it only advances the view)

### D2 + E1 — ConfigView 5th tab "Routing"

- `views/ConfigView.svelte` — add `"routing"` to `RoleTab` union, new 5th tab rendering `<RoutingModeRadio>`
- Tab copy: *"Choose whether Clyffy stays purely local or can lean on Claude."*
- `WizardHelpTip` + `WizardInfoPopup` explaining the three routing modes
- `setupSessionState.pendingRoutingMode` — drafts the radio selection
- `applyPendingSelections` — commits routing via `set_inference_provider` alongside slot writes

### F1 — Settings routing component

- `<RoutingModeRadio>` lives in shared component location, imported by both wizard ConfigView 5th tab and settings routing page
- Settings page wraps it with its own save semantics (no wizard session state there)

### G1 + H2 + I2 — Verification gate (the aggregator IS the gate)

- `xtask/src/commands/verify.rs` — NEW file. Sequences:
  1. `cargo fmt --all -- --check`
  2. `cargo clippy --workspace -- -D warnings`
  3. `cargo test --workspace --lib`
  4. `cd interfaces/desktop && pnpm check && pnpm lint && pnpm test:run && pnpm check:ipc`
- `xtask/src/main.rs` — register `verify` subcommand under the existing clap dispatcher
- `lefthook.yml` — pre-push step invokes `cargo xtask verify` (replacing any individual cargo/pnpm steps that currently live there for the same concerns)
- `lefthook.yml` — pre-commit keeps fast checks only (rust-fmt, svelte-check, biome-lint, ip-boundary-check, tokens-regen, coldlight-verify, coldlight-docs) — no tests, stays <30s
- `scripts/docs/VERIFICATION.md` — NEW doc. States `cargo xtask verify` as the canonical one-command gate. Explains what lefthook invokes when. Documents the 30s pre-commit / 5min pre-push budgets.
- `CONTRIBUTING.md` (or `README.md`) — link to `VERIFICATION.md`

### Time budgets (from research §258)

| Hook | Budget | With these decisions |
|---|---|---|
| Pre-commit | <30s incremental | ✅ No tests, only fast lint/format/typecheck |
| Pre-push | <5min | ✅ Full `cargo xtask verify` — clippy + workspace tests + all frontend checks |

### Do NOT touch (explicit exclusions)

- Claude subscription OAuth flow — separate sprint
- Code indexer consuming `project_path` — downstream, separate sprint
- Council arbitration rules configuration UI — separate sprint
- Model swap UX — separate from wizard

---

## Revision history

- **2026-04-20 am** — Initial extraction with H2 (owner answers supplied).
- **2026-04-20 mid** — H2 → H1 applied on owner instruction "pre-commit?".
- **2026-04-20 later** — Owner typo correction, reverted to H2 (pre-push).
- **2026-04-20 close** — I2 confirmed ("best practice"). **Sprint fully locked.**

*Decision extract complete. Every answer traces to either `SPRINT-WIZARD-FINISH.md` option lines or the owner answer stream. No invented content.*
