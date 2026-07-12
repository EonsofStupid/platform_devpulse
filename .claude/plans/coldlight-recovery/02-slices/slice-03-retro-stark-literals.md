# Slice 03 — retro/stark preset sources: 12 raw oklch literals → token refs

## GOAL

The retro and stark preset families still carry 12 raw `oklch(...)` literals
(audit:presetmap, ΔE 6–13 from their nearest tokens). Rebind each to its mapped
token in the SOURCE json, preserving alpha via the repo's relative-color pattern.

## PRECONDITIONS

- Slices 01–02 DONE. Tree clean outside `.claude/plans/**`.
- Probe 1: `grep -c "oklch(0" interfaces/desktop/scripts/build/styledictionary/tokens/src/presets/retro.tokens.json` → ≥1. Zero → STOP (already fixed).
- Probe 2: same grep on `presets/stark.tokens.json` → ≥1.
- Probe 3 (pattern precedent exists): `grep -n "oklch(from {color.black} l c h" interfaces/desktop/scripts/build/styledictionary/tokens/src/presets/button.tokens.json` → ≥1 hit (the alpha-preserving reference syntax this slice reuses).

## FILES

1. `interfaces/desktop/scripts/build/styledictionary/tokens/src/presets/retro.tokens.json`
2. `interfaces/desktop/scripts/build/styledictionary/tokens/src/presets/stark.tokens.json`
3. Regenerated outputs (generated, not counted).

## STEPS

Replacement rule (deterministic): a literal WITHOUT alpha becomes the bare ref
`{token.ref}`; a literal WITH `/ α` becomes `oklch(from {token.ref} l c h / α)`.
Apply exactly these 12 rows (find the literal as a `$value` string; replace the
whole oklch literal only, leaving any surrounding shadow syntax intact):

| File | Preset property | Literal (find) | Replace with |
| --- | --- | --- | --- |
| retro | retro-glow-hover.color | `oklch(0.95 0.25 330)` | `{color.rose.50}` |
| retro | retro-glow-hover.box-shadow | `oklch(0.8 0.28 330 / 0.5)` | `oklch(from {color.rose.200} l c h / 0.5)` |
| retro | retro-glow-hover.box-shadow | `oklch(0.8 0.28 330 / 0.2)` | `oklch(from {color.rose.200} l c h / 0.2)` |
| retro | retro-glow-hover.border-color | `oklch(0.85 0.28 330)` | `{color.rose.200}` |
| retro | retro-glow-disabled.color | `oklch(0.4 0.05 330)` | `{color.magenta.700}` |
| retro | retro-muted-hover.color | `oklch(0.65 0.03 200)` | `{color.frost.400}` |
| stark | stark-deep.color | `oklch(0.92 0.04 180)` | `{color.teal.100}` |
| stark | stark-deep-disabled.border-color | `oklch(0.4 0.02 180)` | `{color.void.700}` |
| stark | stark-glow.color | `oklch(0.92 0.08 25)` | `{color.ember.100}` |
| stark | stark-glow-hover.border-color | `oklch(0.7 0.25 25 / 0.7)` | `oklch(from {accent.salmon.glow} l c h / 0.7)` |
| stark | stark-glow-disabled.color | `oklch(0.55 0.02 25)` | `{color.neutral.500}` |
| stark | stark-glow-disabled.border-color | `oklch(0.4 0.05 25 / 0.25)` | `oklch(from {color.ember.700} l c h / 0.25)` |

Then: `cd interfaces/desktop && pnpm ds:tokens:build` → exit 0.

## IMPORT REPOINTS

None.

## VERIFY

- `grep -c "oklch(0" interfaces/desktop/scripts/build/styledictionary/tokens/src/presets/retro.tokens.json` → 0; same for stark.tokens.json → 0.
- `pnpm ds:tokens:build` exit 0; `pnpm check` → 0 errors 0 warnings.
- `pnpm audit:presetmap` → retro/stark rows GONE from the raw-literal tail; no new rows.

## KNOWN REDS

Sheet/Checkbox tests pre-broken; Sonar react-hooks on `*.svelte.ts` false positive.

## ROLLBACK

`git checkout -- interfaces/desktop/scripts/build/styledictionary/tokens/src/presets/retro.tokens.json interfaces/desktop/scripts/build/styledictionary/tokens/src/presets/stark.tokens.json && cd interfaces/desktop && pnpm ds:tokens:build`

## STOP CONDITIONS

A literal from the table not found verbatim → STOP, report which row (do not fuzzy-
match). Build failure → ROLLBACK + raw output. Touch no other preset value.
