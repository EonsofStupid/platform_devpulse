# Slice 08 — WRONG-NAME rebinds, batch D (fonts/shadows/signals)

## GOAL

Five files: font-family names, the stories shadow scale, and the -subtle signal
pattern (rulings §3.1). Deterministic -subtle rule below.

## PRECONDITIONS

- Slices 01–07 DONE. Tree clean outside `.claude/plans/**`.
- Probe 1: `grep -rn -- "--shadow-z1\|--signal-error-subtle" interfaces/desktop/src | wc -l` → ≥3. Zero → STOP.
- Probe 2: `grep -n -- "--depth-z1" interfaces/desktop/src/lib/design/styles/primitives/shadow.css` → 1 hit.
- Probe 3 (the -subtle precedent): `grep -n "color-mix(in oklch, var(--signal-error) 18%, transparent)" interfaces/desktop/src/lib/devtools/_shared/HfSearchDialog.svelte` → 1 hit.

## FILES

1. `interfaces/desktop/src/lib/domains/app/models/feature/downloader/ui/BundleFileRow.svelte`
2. `interfaces/desktop/src/lib/sys/ErrorOverlay.svelte`
3. `interfaces/desktop/src/lib/design/components/*/Panel.stories.svelte` — locate by `grep -rln -- "--shadow-z1" interfaces/desktop/src`; expect exactly 1 file (report actual path)
4. `interfaces/desktop/src/lib/devtools/runtimes/inference/candle/feature/CandleDevtool.svelte` (~:505)
5. `interfaces/desktop/src/routes/(devtools)/devtools/runtimes/+page.svelte` (~:232)

## STEPS

Deterministic -subtle rule: `var(--signal-<x>-subtle)` ALWAYS becomes
`color-mix(in oklch, var(--signal-<x>) 18%, transparent)` (repo precedent, Probe 3).

1. File 1: every `var(--font-family-mono` … `)` → `var(--font-mono)`.
2. File 2: every `var(--font-family-mono` … `)` → `var(--font-mono)`; every `var(--font-family-sans` … `)` → `var(--font-sans)`.
3. File 3: `var(--shadow-z1)`→`var(--depth-z1)`, `z2`→`z2`, `z3`→`z3`, `z4`→`z4` (i.e. `--shadow-zN` → `--depth-zN`; ~:57–:60, :140, :164, :187; expect 7).
4. Files 4, 5: every `var(--signal-error-subtle)` → `color-mix(in oklch, var(--signal-error) 18%, transparent)` (expect 2 total).

## IMPORT REPOINTS

None.

## VERIFY

- `grep -rn -- "--shadow-z\|--signal-error-subtle\|--font-family-" interfaces/desktop/src --include="*.svelte" | grep -v ui-demo` → 0 hits.
- `cd interfaces/desktop && pnpm check` → 0 errors 0 warnings.

## KNOWN REDS

Sheet/Checkbox pre-broken; Sonar react-hooks on `*.svelte.ts` false positive.

## ROLLBACK

`git checkout -- <the five files>`

## STOP CONDITIONS

Probe-3 precedent missing → STOP (the -subtle rule loses its anchor; do not invent
another form). File 3 grep ≠1 file → STOP + report. Expected string absent → STOP.
