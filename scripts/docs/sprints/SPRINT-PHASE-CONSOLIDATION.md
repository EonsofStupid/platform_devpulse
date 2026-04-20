# SPRINT: Pre-Sprint Consolidation — Dead Code + Alias Documentation

> **Date**: 2026-04-20
> **Parent**: `SPRINT-WIZARD-FINISH.md`
> **Status**: READY
> **Scope**: **XS** — deletions + a comment. Single commit.
> **Prerequisite**: Phase 0b complete (ensures we migrate-then-delete, not delete-then-regret).
> **Owner**: EonsofStupid

---

## What This Sprint Finishes

Three duplication issues identified in the research phase. Each blocks or confuses a downstream sprint if left.

1. **`create_dev_profile` dead write** — writes to `preferences.json`, has zero readers. Keeping it while Phase A introduces a real `profiles.project_path` column = two writers for the same concept. Resolve by **deleting**.
2. **`InferenceProvider` (Tauri) ↔ kernel `RoutingMode` aliasing** — two enums, one concept. Functional but a reader may assume `InferenceProvider` is the canonical type and re-alias a third time. Resolve with a **documented comment**, not a rename.
3. **`dev_profile` SSOT split** (libSQL profiles / preferences.json / SurrealDB) — already resolved by Q-A=A1 decision: libSQL profiles table wins. preferences.json dev_profile key is dead. SurrealDB dev_profile stays preflight-only.

---

## SSOT Map

| Concern | Current authoritative location | Competing surfaces | Phase Consolidation action |
|---|---|---|---|
| User profile data | [systems/devpulse-engine/src/platform/services/relational.rs:179-189](systems/devpulse-engine/src/platform/services/relational.rs#L179-L189) `profiles` table | preferences.json `dev_profile` key, SurrealDB `dev_profile` table | Confirm libSQL wins. Delete preferences.json writer. SurrealDB stays for preflight orientation only. |
| Routing mode enum | [kernel/model-loader/src/assistant/config.rs:254](kernel/model-loader/src/assistant/config.rs#L254) `RoutingMode` | [commands/cloud/mod.rs:18-43](interfaces/desktop/src-tauri/src/commands/cloud/mod.rs#L18-L43) `InferenceProvider` | Document the mirror relationship. No rename. |
| `create_dev_profile` command | [commands/models/mod.rs:1553](interfaces/desktop/src-tauri/src/commands/models/mod.rs#L1553) | — (no competitor) | DELETE. Migrate nothing — there are no readers. |

## Duplication Scan (verified before deletion)

Grep results (from research phase):
- `create_dev_profile` referenced ONLY at `commands/models/mod.rs:1553` (definition) + `bindings.ts:1448` (generated TS binding) + `lib.rs` command registration (indirect).
- No frontend call site — `grep "createDevProfile\|create_dev_profile" interfaces/desktop/src/` returns zero.
- `scripts/docs/sprints/SPRINT-ML-06-COMPLIANCE-VERIFICATION.md:86` mentions `checkDevProfile` as a planned reader — never shipped. That sprint is archivable.

## Files (3 edits, 1 commit)

1. `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — DELETE the `create_dev_profile` function (and its preflight-related helpers if unused elsewhere — verify by compile).
2. `interfaces/desktop/src-tauri/src/lib.rs` — REMOVE `create_dev_profile` from the `collect_commands![...]` specta registration.
3. `interfaces/desktop/src-tauri/src/commands/cloud/mod.rs` — already has the alias comment from Phase 0b. Confirm it says:
   ```rust
   //! # Type alias note
   //! `InferenceProvider` below is the specta-derived Tauri-boundary enum. It
   //! mirrors the kernel routing mode (private to `kernel/model-loader`) value
   //! for value. The kernel type is not re-exported here — engine facades call
   //! `set_routing_mode(String)` with the `as_str()` form of this enum to keep
   //! the kernel boundary one-way. Do NOT add a third alias anywhere.
   ```

## Regeneration

After the deletion:
- Rebuild specta bindings → `interfaces/desktop/src/lib/sys/generated/bindings.ts` no longer contains `createDevProfile` or `DevProfile` type.
- Confirm via `grep "createDevProfile" interfaces/desktop/src/` returns zero.

## Execution Order

1. Delete the Rust fn from `models/mod.rs`. Compile — expect an error at `lib.rs` command registration if not also removed.
2. Remove from `lib.rs` `collect_commands![...]`. Compile — green.
3. Regenerate bindings (by running the dev build once, or via whatever specta regen step the build uses).
4. Grep the frontend to confirm no orphaned `createDevProfile` import. Fix any that exist.
5. Archive `SPRINT-ML-06-COMPLIANCE-VERIFICATION.md` — move to `scripts/docs/sprints/_archive/` OR add a header banner `> Superseded by SPRINT-PHASE-A-PROJECT-FOLDER.md`.
6. Commit: `refactor(backend): delete dead create_dev_profile, document InferenceProvider alias (Consolidation)`.

## Verification Gate

- [ ] `cargo check -p devpulse_desktop_backend` — 0 errors.
- [ ] `grep -r "create_dev_profile\|createDevProfile" interfaces/` returns zero (outside `_archive/`).
- [ ] `grep -r "create_dev_profile\|createDevProfile" systems/` returns zero.
- [ ] Regenerated `bindings.ts` no longer contains `createDevProfile`.
- [ ] `pnpm check` — 0 errors.
- [ ] `lefthook run pre-commit` — passes (no kernel vocabulary leak, no raw values).

## Do NOT Touch

- SurrealDB `dev_profile` table schema — preflight uses it, leaving it is intentional.
- preferences.json schema itself — other keys (`hf_token`, etc.) still written to it. Only the `dev_profile` key writer is deleted.
- Kernel `RoutingMode` — stays internal, unchanged.
- Any archived sprint under `_archive/` — do not unarchive.

## Anti-Pattern Risks

| Risk | Prevention |
|---|---|
| Deleting `create_dev_profile` before Phase A authors the replacement | Phase A is strictly next. This sprint is the bridge. |
| Renaming `InferenceProvider` to match `RoutingMode` | Forbidden. Would propagate through specta bindings and break the frontend import. Alias comment is sufficient. |
| Leaving a `// TODO: remove when reader added` breadcrumb | Confirmed there are no planned readers. Clean delete, no breadcrumb. |
| Breaking tauri-specta bindings by mismatched command registration | Compile catches this — the order is delete fn → remove registration → compile. |

## Links

- Parent: `SPRINT-WIZARD-FINISH.md`
- Depends on: `SPRINT-PHASE-0B-ANYHOW-CONTEXT.md` (alias comment lands there)
- Blocks: `SPRINT-PHASE-A-PROJECT-FOLDER.md`
- Archives: `SPRINT-ML-06-COMPLIANCE-VERIFICATION.md` (superseded)
