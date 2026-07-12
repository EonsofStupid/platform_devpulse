# Slice 01 — delete dead `domains/common` + correct CLAUDE.md registry path

## GOAL

Remove the empty banned `domains/common` folder (rulings §1.1 RULED, rule 5) and fix
the stale devtool-registry path claim in the repo root CLAUDE.md.

## PRECONDITIONS

- `git status --porcelain` shows NOTHING outside `.claude/plans/**`. Otherwise STOP.
- No prior slices required.
- Probe 1: `grep -rn "domains/common" interfaces/desktop/src --include="*.ts" --include="*.svelte"` → expect EXACTLY 2 hits, both inside `interfaces/desktop/src/lib/domains/common/index.ts` (its own docblock, lines 2-3). Any hit in another file → STOP, report.
- Probe 2: `grep -n "domains/platform/_shared/devtool-registry" CLAUDE.md` → expect exactly 1 hit. Zero or 2+ → STOP.

## FILES

1. `interfaces/desktop/src/lib/domains/common/index.ts` — empty barrel (7 lines, zero exports, zero importers) — DELETED (with its folder).
2. `CLAUDE.md` (repo root) — stale registry path — one line corrected.

## STEPS

1. `git rm -r interfaces/desktop/src/lib/domains/common`
2. In `CLAUDE.md`, replace the exact substring
   `src/lib/domains/platform/_shared/devtool-registry.ts`
   with
   `src/lib/devtools/registry.ts`
   (one occurrence; the surrounding sentence "Devtool taxonomy SSOT: ..." stays).

## IMPORT REPOINTS

None — zero importers (verified twice: census Step 3 + Probe 1).

## VERIFY

- `cd interfaces/desktop && pnpm check` → `0 ERRORS 0 WARNINGS` (220±2 files).
- `grep -rn "domains/common" interfaces/desktop/src --include="*.ts" --include="*.svelte"` → 0 hits.
- `git status --porcelain` → exactly the deletion entries + `M CLAUDE.md`.

## KNOWN REDS

Sheet.test.ts (5) + Checkbox.test.ts (2) pre-broken — not run here, do not chase.

## ROLLBACK

`git checkout -- CLAUDE.md && git restore --staged --worktree interfaces/desktop/src/lib/domains/common`

## STOP CONDITIONS

If Probe 1 finds any external importer, or `pnpm check` reports errors after the
delete: run ROLLBACK, report the exact output, stop. Do not fix anything else. Do
not create any directory.
