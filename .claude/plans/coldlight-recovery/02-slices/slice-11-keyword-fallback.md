# Slice 11 — retire the last keyword fallback (ClyffyHeadshot)

## GOAL

The design tiers' single remaining `var(--x, <keyword>)` fallback violates rule 6.
`--surface-inset` is emitted (styles/semantic/surface.css:11) — the fallback is dead
weight that would silently mask a future emission break.

## PRECONDITIONS

- Slices 01–10 DONE. Tree clean outside `.claude/plans/**`.
- Probe 1: `grep -n "var(--surface-inset, transparent)" interfaces/desktop/src/lib/design/blocks/clyffy/ClyffyHeadshot.svelte` → 1 hit (~:162). Zero → STOP.
- Probe 2: `grep -n -- "--surface-inset:" interfaces/desktop/src/lib/design/styles/semantic/surface.css` → 1 hit (the token exists; if 0, STOP — dropping the fallback would break render).

## FILES

1. `interfaces/desktop/src/lib/design/blocks/clyffy/ClyffyHeadshot.svelte`

## STEPS

1. Replace `var(--surface-inset, transparent)` with `var(--surface-inset)` (1 occurrence).

## IMPORT REPOINTS

None.

## VERIFY

- `grep -rnE 'var\(--[a-z-]+, *(red|blue|green|teal|white|black|transparent|currentColor)\)' interfaces/desktop/src/lib/design/components interfaces/desktop/src/lib/design/behaviors interfaces/desktop/src/lib/design/blocks` → 0 hits (design tiers fully keyword-fallback-free).
- `cd interfaces/desktop && pnpm check` → 0 errors 0 warnings.

## KNOWN REDS

Sheet/Checkbox pre-broken; Sonar react-hooks on `*.svelte.ts` false positive.

## ROLLBACK

`git checkout -- interfaces/desktop/src/lib/design/blocks/clyffy/ClyffyHeadshot.svelte`

## STOP CONDITIONS

Probe 2 failing (token not emitted) → STOP; the fallback is load-bearing and the bug
is elsewhere — report, do not edit.

---

**After this slice: CHECKPOINT V1 — run `/coldlight-verify`.** Gate battery + the
operator's own eyes on `cargo xtask run-dev`: SVG accents alive (slice 02),
retro/stark presets token-bound (03), scrollbars sized + sticky z real (04), no
wrong-name grays anywhere (05–10), blue primary CTAs (P2.4, already committed),
per-hub backdrops intact. F2+ slices do not start until V1 is logged green.
