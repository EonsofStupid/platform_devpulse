# Slice 10 — WRONG-NAME rebinds, batch F (text-default + interaction states)

## GOAL

Final rebind batch: the `--text-default` trio and the pressed-state fix
(rulings §3.1).

## PRECONDITIONS

- Slices 01–09 DONE. Tree clean outside `.claude/plans/**`.
- Probe 1: `grep -rn -- "--text-default" interfaces/desktop/src --include="*.svelte" | wc -l` → ≥3. Zero → STOP.
- Probe 2: `grep -n -- "--interaction-active" interfaces/desktop/src/lib/design/styles/semantic/interaction.css` → 1 hit (target exists).

## FILES

1. `interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeMultipleChoiceCard.svelte` (~:203)
2. `interfaces/desktop/src/lib/domains/clyffy/tools/ClyffyCollabView.svelte` (~:277)
3. `interfaces/desktop/src/lib/domains/clyffy/status/EndpointView.svelte` (~:421)
4. `interfaces/desktop/src/lib/domains/app/models/ui/ModelEventCard.svelte` (~:89)

(If a path differs, locate by `grep -rln -- "--text-default" interfaces/desktop/src` /
`grep -rln -- "--surface-pressed" interfaces/desktop/src`; report actual paths; the
batch is exactly those files.)

## STEPS

1. Files 1–3: every `var(--text-default)` → `var(--text-primary)` (expect 3 total).
2. File 4: `var(--surface-pressed` … `)` → `var(--interaction-active)` (~:89; DROP the inline color-mix fallback — rule 6; expect 1).

## IMPORT REPOINTS

None.

## VERIFY

- `grep -rn -- "--text-default\|--surface-pressed" interfaces/desktop/src --include="*.svelte"` → 0 hits.
- `cd interfaces/desktop && pnpm check` → 0 errors 0 warnings.
- `pnpm audit:cssvars` → both names leave UNDEFINED; no NEW names.

## KNOWN REDS

Sheet/Checkbox pre-broken; Sonar react-hooks on `*.svelte.ts` false positive.

## ROLLBACK

`git checkout -- <the four files>`

## STOP CONDITIONS

Expected string absent → STOP + report. Only these four files.
