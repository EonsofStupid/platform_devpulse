# Slice 02 — fix the SVG accent prefix mismatch (SOURCE + regen)

## GOAL

SVG style presets reference `var(--cl-svg-accent-*)` but the pipeline defines
`--svg-accent-*` — every SVG preset color resolves to NOTHING. Fix the token
SOURCE and regenerate, so SVG accents render.

## PRECONDITIONS

- Slice 01 DONE. `git status --porcelain` clean outside `.claude/plans/**`.
- Probe 1: `grep -c "cl-svg-accent" interfaces/desktop/scripts/build/styledictionary/tokens/src/svg-presets.json` → expect ≥1 (nonzero). Zero → already fixed, STOP and report.
- Probe 2: `grep -n -- "--svg-accent-main" interfaces/desktop/src/lib/design/svg/svg-accent-defaults.css` → expect 1 hit at line 9 (the defined namespace).
- Probe 3: `grep -rn "cl-svg-accent" interfaces/desktop/src/lib/design/svg/presets/svg-presets.generated.css | head -3` → expect hits (the broken emission).

## FILES

1. `interfaces/desktop/scripts/build/styledictionary/tokens/src/svg-presets.json` —
   the SVG preset token SOURCE; every `var(--cl-svg-accent-main|glow|fill)` value
   string changes to `var(--svg-accent-main|glow|fill)`.
2. Regenerated outputs (expected, generated — not counted): svg-presets.generated.css,
   token-manifest.json, possibly types.

## STEPS

1. In `svg-presets.json`, replace ALL occurrences of the exact substring
   `--cl-svg-accent-` with `--svg-accent-` (no other change; JSON structure
   untouched). Count replacements; report the number.
2. `cd interfaces/desktop && pnpm ds:tokens:build` → expect success (exit 0).

## IMPORT REPOINTS

None (CSS var rename inside one source file).

## VERIFY

- `grep -c "cl-svg-accent" interfaces/desktop/scripts/build/styledictionary/tokens/src/svg-presets.json` → 0.
- `grep -c "cl-svg-accent" interfaces/desktop/src/lib/design/svg/presets/svg-presets.generated.css` → 0.
- `grep -c -- "var(--svg-accent-main)" interfaces/desktop/src/lib/design/svg/presets/svg-presets.generated.css` → ≥1.
- `cd interfaces/desktop && pnpm check` → 0 errors 0 warnings.
- `pnpm audit:cssvars` → the UNDEFINED list no longer contains `--cl-svg-accent-*` (was 3 rows) and no NEW undefined names appear.
- RENDER CHECKPOINT NOTE for V1: SVG surfaces (orbs, wizard art, status glyphs) pick up accent color instead of falling to currentColor/transparent.

## KNOWN REDS

Sheet/Checkbox tests pre-broken; Sonar react-hooks on `*.svelte.ts` false positive.

## ROLLBACK

`git checkout -- interfaces/desktop/scripts/build/styledictionary/tokens/src/svg-presets.json && cd interfaces/desktop && pnpm ds:tokens:build`

## STOP CONDITIONS

If `ds:tokens:build` fails, or any verify grep returns unexpected counts: ROLLBACK,
paste raw output, stop. Do not edit generated CSS directly under any circumstance.
