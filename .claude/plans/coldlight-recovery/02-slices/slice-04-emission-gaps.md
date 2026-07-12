# Slice 04 — emit the authored-but-orphaned token families (z-index, scrollbar-size)

## GOAL

Two token families exist in SOURCE but never reach CSS because of sd.config.mjs
filter mismatches: the z-index scale (filter says `zIndex`, source key is `z-index`)
and scrollbar-size (scrollbar filters only match path[0]==='scrollbar'). Fix the
filters, regen, and both families finally emit — `useSticky`'s
`var(--z-index-sticky)` and app.css's `--scrollbar-size-*` become real.

## PRECONDITIONS

- Slices 01–03 DONE. Tree clean outside `.claude/plans/**`.
- Probe 1: `grep -rn -- "--z-index" interfaces/desktop/src/lib/design/styles/` → expect 0 hits (the gap).
- Probe 2: `grep -rn -- "--scrollbar-size-width" interfaces/desktop/src/lib/design/styles/` → expect 0 hits (the gap).
- Probe 3: `sed -n '1012p;1031p;1110p;1139p' interfaces/desktop/scripts/build/styledictionary/sd.config.mjs` → line 1012 contains `'zIndex'` inside a pathFilter with 'space','padding','size','breakpoint'; 1031 contains `cssFile('scrollbar.css', pathFilter('scrollbar')`; 1110 contains `themeFile('scrollbar.css', pathFilter('scrollbar')`; 1139 contains `typesFile('interaction.d.ts', pathFilter('interaction', 'overlay', 'scrollbar')`. Any line not matching → STOP (config drifted; line anchors invalid).

## FILES

1. `interfaces/desktop/scripts/build/styledictionary/sd.config.mjs` — 4 filter edits.
2. Regenerated outputs (generated, not counted): styles/primitives/spacing.css,
   styles/semantic/scrollbar.css, theme/*, types/*, token-manifest.json.

## STEPS

1. Line 1012: inside `pathFilter('space', 'padding', 'size', 'breakpoint', 'zIndex')`
   add `'z-index'` → `pathFilter('space', 'padding', 'size', 'breakpoint', 'zIndex', 'z-index')`.
   (Keep `'zIndex'` — unknown legacy key, removing it is out of scope.)
2. Line 1031: `pathFilter('scrollbar')` → `pathFilter('scrollbar', 'scrollbar-size')`.
3. Line 1110: `pathFilter('scrollbar')` → `pathFilter('scrollbar', 'scrollbar-size')`.
4. Line 1139: `pathFilter('interaction', 'overlay', 'scrollbar')` → `pathFilter('interaction', 'overlay', 'scrollbar', 'scrollbar-size')`.
5. `cd interfaces/desktop && pnpm ds:tokens:build` → exit 0.

## IMPORT REPOINTS

None.

## VERIFY

- `grep -n -- "--z-index-sticky\|--z-index-modal\|--z-index-dropdown" interfaces/desktop/src/lib/design/styles/primitives/spacing.css` → ≥3 hits (scale emitted).
- `grep -n -- "--scrollbar-size-width\|--scrollbar-size-height\|--scrollbar-size-radius" interfaces/desktop/src/lib/design/styles/semantic/scrollbar.css` → 3 hits.
- `cd interfaces/desktop && pnpm check` → 0 errors 0 warnings.
- `pnpm audit:cssvars` → `--z-dropdown` stays (separate consumer bug, F7), but `--scrollbar-size-*` leave the UNDEFINED list; no NEW undefined names.
- RENDER NOTE for V1: scrollbars pick up 6px width/3px radius; sticky elements get a real z-index.

## KNOWN REDS

Sheet/Checkbox tests pre-broken; Sonar react-hooks on `*.svelte.ts` false positive.

## ROLLBACK

`git checkout -- interfaces/desktop/scripts/build/styledictionary/sd.config.mjs && cd interfaces/desktop && pnpm ds:tokens:build`

## STOP CONDITIONS

Probe 3 mismatch (anchors moved) → STOP without editing. Build failure → ROLLBACK +
raw output. Never edit emitted CSS. Do not touch any other filter or line.
