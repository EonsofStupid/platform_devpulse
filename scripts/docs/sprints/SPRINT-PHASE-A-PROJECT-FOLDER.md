# SPRINT: Phase A — Project Folder Persistence

> **Date**: 2026-04-20
> **Parent**: `SPRINT-WIZARD-FINISH.md`
> **Status**: READY (STOPs A/B/C answered — A1 libSQL column / B1 collapse / C2 Save & Continue)
> **Scope**: **M** — 6 files across backend + frontend.
> **Prerequisite**: Pre-Sprint Consolidation complete (`create_dev_profile` deleted).
> **Owner**: EonsofStupid

---

## What This Sprint Finishes

WelcomeView's project folder picker currently stores the selected path in local component state (`let projectPath = $state("")`). It's lost the moment the component unmounts.

This sprint makes it persistent:
- **Schema**: `profiles` table gains `project_path TEXT` column.
- **Backend**: `update_user_profile` takes a 4th arg (`project_path: Option<String>`), `UserProfile` struct gains the field, row mapper reads it.
- **Frontend**: `setupWizardOverlayState` owns `projectPath` as rune state. WelcomeView binds read-write. Commit happens in `applyAndAdvance()` (Save & Continue) alongside name/email/level — matches existing draft-commit pattern.

---

## Decisions Locked

| ID | Decision | Rationale |
|---|---|---|
| Q-A / A1 | `project_path` as a column on the existing `profiles` libSQL table | Single authoritative profile row. No JSON blob. No SurrealDB duplicate. |
| Q-B / B1 | Collapse — `create_dev_profile` deleted in Consolidation sprint | No more dual-writer drift. |
| Q-C / C2 | Persist on "Save & Continue" in ConfigView via `applyAndAdvance` | Matches existing draft/commit pattern. No first-click write. |

---

## SSOT Map

| Layer | File | Current state | Phase A action |
|---|---|---|---|
| Schema | [systems/devpulse-engine/src/platform/services/relational.rs:179-189](systems/devpulse-engine/src/platform/services/relational.rs#L179-L189) | 9 columns, no `project_path` | Add `project_path TEXT` column after `expertise_level`. |
| Struct | [commands/devpulse/profile.rs:14-33](interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs#L14-L33) `UserProfile` | 9 public fields | Add `project_path: Option<String>` (after `last_active_at`). |
| Row mapper | [commands/devpulse/profile.rs:67-79](interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs#L67-L79) `row_to_profile` | 9 field reads, index 0-8 | Add index 9 read. |
| SELECT | [commands/devpulse/profile.rs:98](interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs#L98) `PROFILE_SELECT` | no project_path | Append `, project_path` to SELECT. |
| Command | [commands/devpulse/profile.rs:205-231](interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs#L205-L231) `update_user_profile` | 3 args: display_name, email, expertise_level | Add 4th arg: `project_path: Option<String>`. Extend UPDATE statement. |
| Rune state | [data-access/setup-wizard-overlay.state.svelte.ts:74-77](interfaces/desktop/src/lib/domains/app/models/data-access/setup-wizard-overlay.state.svelte.ts#L74-L77) | `profileName`, `profileEmail`, `profileLevel` | Add `projectPath = $state<string>("")`. Load from fetch in `loadProfileDraft`. Pass in `saveProfileDraft`. |
| View | [feature/setup-wizard/views/WelcomeView.svelte:71](interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/views/WelcomeView.svelte#L71) | `let projectPath = $state("")` local component state | Replace with `overlayState.projectPath`. Bind read-write to picker. |
| Bindings | `interfaces/desktop/src/lib/sys/generated/bindings.ts` | Auto-regen | `updateUserProfile` gains 4th arg. `UserProfile` type gains `projectPath?: string \| null`. |

## Duplication Scan

- `project_path` column does NOT exist elsewhere in libSQL (verified by grep for `project_path` across `systems/devpulse-engine/src/platform/services/`).
- `projects.root_path` exists in the `projects` table ([relational.rs:249](systems/devpulse-engine/src/platform/services/relational.rs#L249)) — that's a DIFFERENT concept (registered project root directories; many per user). `profiles.project_path` = single default workspace. Distinct.
- preferences.json `dev_profile.project_path` key — eliminated by Consolidation sprint.
- `pick_directory` IPC exists and works — no new file picker needed.

## Files (max 5, one commit per sub-phase)

**Sub-phase A.1 — Backend schema + struct + command:**
1. `systems/devpulse-engine/src/platform/services/relational.rs` — add column to `USER_SCHEMA`.
2. `interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs` — struct field + row mapper + SELECT + `update_user_profile` + `inner_update_user_profile` 4-arg signature.

**Sub-phase A.2 — Frontend state + view wire:**
3. `interfaces/desktop/src/lib/domains/app/models/data-access/setup-wizard-overlay.state.svelte.ts` — add `projectPath` rune + load + save paths.
4. `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/views/WelcomeView.svelte` — replace local `projectPath` with `overlayState.projectPath` binding.
5. (regen) `interfaces/desktop/src/lib/sys/generated/bindings.ts` — confirm 4-arg `updateUserProfile` + `UserProfile.projectPath` field.

## Execution Order

### A.1 — Backend

1. Add column:
   ```sql
   CREATE TABLE IF NOT EXISTS profiles (
       ...,
       expertise_level INTEGER DEFAULT 1,
       project_path TEXT,
       created_at INTEGER DEFAULT (unixepoch()),
       ...
   );
   ```
   Note: `IF NOT EXISTS` means existing DBs won't auto-add the column. For dev, owner can wipe `user.db` or we add an idempotent `ALTER TABLE IF EXISTS ADD COLUMN project_path TEXT` guarded against duplicate-column error — choose at implementation.

2. Update `UserProfile` struct:
   ```rust
   pub struct UserProfile {
       ...,
       pub expertise_level: i64,
       pub created_at: i64,
       pub updated_at: i64,
       pub last_active_at: Option<i64>,
       pub project_path: Option<String>,
   }
   ```

3. Update `row_to_profile` with index 9 read.

4. Update `PROFILE_SELECT`:
   ```rust
   const PROFILE_SELECT: &str = "SELECT id, display_name, email, hardware_profile, onboarding_complete, expertise_level, created_at, updated_at, last_active_at, project_path FROM profiles LIMIT 1";
   ```

5. Update `update_user_profile` + `inner_update_user_profile`:
   ```rust
   pub async fn update_user_profile(
       display_name: Option<String>,
       email: Option<String>,
       expertise_level: Option<i64>,
       project_path: Option<String>,
       state: State<'_, PlatformState>,
   ) -> std::result::Result<UserProfile, String> { ... }
   ```
   UPDATE statement gets `project_path = NULLIF(?, '')`.

6. `cargo check -p devpulse_desktop_backend` — green.

### A.2 — Frontend

1. In `setup-wizard-overlay.state.svelte.ts`:
   - Add `projectPath = $state("")`.
   - In `loadProfileDraft`: `this.projectPath = profile.projectPath ?? "";`.
   - In `saveProfileDraft`: pass `projectPath: this.projectPath.trim() || null` as 4th arg.

2. In `WelcomeView.svelte`:
   - Remove `let projectPath = $state("")`.
   - Replace picker assignment `projectPath = path` with `overlayState.projectPath = path`.
   - Replace readonly input `value={projectPath}` with `value={overlayState.projectPath}`.
   - Remove stale comment about `create_dev_profile` from `handleLetsGo`.

3. `pnpm check` — 0 errors.

## Verification Gate

- [ ] `cargo check -p devpulse_desktop_backend` — 0 errors, 0 warnings.
- [ ] `pnpm check` — 0 errors.
- [ ] Round-trip test:
  1. Open wizard, WelcomeView.
  2. Enter name, pick project folder `C:\Users\jessa\Projects\test`.
  3. Click Let's Go → SystemCheck → Config → Save & Continue → Validate → Done.
  4. Close wizard.
  5. Re-open wizard (or re-read via `fetch_user_profile` on startup) — path comes back.
- [ ] Session JSONL shows `update_user_profile` span with `err` field blank on success, fields capture.
- [ ] `lefthook run pre-commit` — passes.

## Do NOT Touch

- `projects` table — separate concept (multi-project registry).
- `ConfigView` / `ValidateView` / `DoneView` — no project-path UI there.
- `preferences.json` — `dev_profile` key already deleted in Consolidation.
- Any downstream indexer / RAG hook that might eventually consume `project_path` — NOT this sprint.
- `update_user_preferences` — separate fn, separate table.

## Anti-Pattern Risks

| Risk | Prevention |
|---|---|
| Writing the path before Save & Continue | C2 decision. Commit ONLY in `applyAndAdvance`. Let's Go just advances view. |
| Migration breaking existing DBs | Add `ALTER TABLE ... ADD COLUMN` idempotent migration OR document wipe-user.db. Choose explicitly in commit message. |
| Missing a call site for the now-4-arg `update_user_profile` | Grep before commit: `updateUserProfile` + `update_user_profile` across entire repo. |
| Forgetting to regen bindings | `pnpm check` will catch if the old 3-arg shape is cached. If it passes silently, manually delete `bindings.ts` and rebuild. |
| Empty-string vs NULL confusion | `NULLIF(?, '')` in UPDATE coerces empty string to NULL — matches `Option<String>` on Rust side. |

## Post-Sprint Cleanup

- Grep confirms `let projectPath = $state("")` no longer in WelcomeView.
- Grep confirms `create_dev_profile` is not referenced.
- Worklog entry: "Phase A — project_path persistence wired end-to-end."

## Links

- Parent: `SPRINT-WIZARD-FINISH.md`
- Depends on: `SPRINT-PHASE-CONSOLIDATION.md` (create_dev_profile deletion)
- Blocks: `SPRINT-PHASE-B-DEVTOOLS-CLAUDE.md` (no blocking dep — can run in parallel after A.1)
