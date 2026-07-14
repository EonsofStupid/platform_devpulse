# Slice 06 — WRONG-NAME rebinds, batch B (accents/surfaces/motion)

## GOAL

Five more consumer files rebound to verified existing tokens (rulings §3.1).

## PRECONDITIONS

- Slices 01–05 DONE. Tree clean outside `.claude/plans/**`.
- Probe 1: `grep -rn -- "--surface-glass-deep" interfaces/desktop/src --include="*.svelte" | wc -l` → ≥3. Zero → STOP.
- Probe 2: `grep -n -- "--glass-deep:" interfaces/desktop/src/lib/design/styles/primitives/surface.css` → 1 hit (target exists).
- Probe 3: `grep -n -- "--duration-normal" interfaces/desktop/src/lib/design/styles/primitives/motion.css` → ≥1 hit.

## FILES

1. `interfaces/desktop/src/lib/layouts/app/BootOverlay.svelte` (~:214)
2. `interfaces/desktop/src/lib/domains/app/projects/feature/ProjectReferences.svelte` (~:123, ~:214)
3. `interfaces/desktop/src/lib/layouts/app/Frame.svelte` (~:71, ~:80)
4. `interfaces/desktop/src/lib/domains/app/projects/feature/ProjectSwitcher.svelte` (~:174)
5. `interfaces/desktop/src/lib/domains/clyffy/learning/LoadingContentCard.svelte` (~:61)

## STEPS

1. File 1: `var(--accent-red-main` … `)` → `var(--accent-danger-main)` (~:214; drop the inline oklch fallback — rule 6; expect 1).
2. File 2: `var(--accent-warning)` → `var(--accent-warning-main)` (~:214; bare form; expect 1).
3. Files 2, 4, 5: every `var(--surface-glass-deep)` → `var(--glass-deep)` (expect 3 total).
4. File 3: every `var(--duration-md)` → `var(--duration-normal)` (~:71, ~:80; expect 2).

## IMPORT REPOINTS

None.

## VERIFY

- `grep -rn -- "--accent-red-main\|var(--accent-warning)\|--surface-glass-deep\|--duration-md" interfaces/desktop/src --include="*.svelte"` → 0 hits.
- `cd interfaces/desktop && pnpm check` → 0 errors 0 warnings.
- `pnpm audit:cssvars` → those 4 names leave UNDEFINED; no NEW names.

## KNOWN REDS

Sheet/Checkbox tests pre-broken; Sonar react-hooks on `*.svelte.ts` false positive.

## ROLLBACK

`git checkout -- <the five files>`

## STOP CONDITIONS

Expected string absent → STOP + report which. No substitutions beyond the table. No
other files.
