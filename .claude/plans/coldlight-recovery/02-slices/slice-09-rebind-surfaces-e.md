# Slice 09 — WRONG-NAME rebinds, batch E (surfaces + warn signals)

## GOAL

Five files rebound to verified emitted surface/text/signal tokens (rulings §3.1).

## PRECONDITIONS

- Slices 01–08 DONE. Tree clean outside `.claude/plans/**`.
- Probe 1: `grep -rn -- "--surface-elevated\|--signal-warn\b" interfaces/desktop/src --include="*.svelte" | wc -l` → ≥2. Zero → STOP.
- Probe 2: `grep -n -- "--surface-raised\|--surface-subtle\|--surface-base" interfaces/desktop/src/lib/design/styles/semantic/surface.css` → ≥3 hits.

## FILES

1. `interfaces/desktop/src/lib/devtools/clyffy/ears/streaming-asr/feature/StreamingAsrDevtool.svelte` (~:128)
2. `interfaces/desktop/src/lib/devtools/clyffy/memory/intelligence/feature/IntelligenceDevtool.svelte` (~:155, ~:264)
3. `interfaces/desktop/src/lib/devtools/runtimes/orchestrator/slots/feature/SlotsDevtool.svelte` (~:1197)
4. `interfaces/desktop/src/lib/domains/chat/ui/ClyffyStatusOrb.svelte` (~:152)
5. `interfaces/desktop/src/lib/devtools/clyffy/reasoning/rrd/feature/RrdDevtool.svelte` (~:278)

## STEPS

Same -subtle rule as slice 08 (color-mix 18% transparent).

1. File 1: `var(--signal-warn` … `)` (with hex fallback `#d97706`) → `var(--signal-warning)` — DROP the hex fallback (rule 6); `var(--signal-warn-subtle` … `)` (fallback `#3b2a1a`) → `color-mix(in oklch, var(--signal-warning) 18%, transparent)`.
2. File 2: `var(--surface-muted)` → `var(--surface-subtle)` (~:155); `var(--surface-elevated)` → `var(--surface-raised)` (~:264).
3. File 3: `var(--surface-elevated)` → `var(--surface-raised)` (~:1197).
4. File 4: `var(--surface-void)` → `var(--surface-base)` (~:152).
5. File 5: `var(--text-tertiary)` → `var(--text-muted)` (~:278).

## IMPORT REPOINTS

None.

## VERIFY

- `grep -rn -- "--signal-warn\b\|--signal-warn-subtle\|--surface-elevated\|--surface-muted\|--surface-void\|--text-tertiary" interfaces/desktop/src --include="*.svelte"` → 0 hits.
- `cd interfaces/desktop && pnpm check` → 0 errors 0 warnings.
- `pnpm audit:cssvars` → those names leave UNDEFINED; no NEW names; no hex literals introduced (`pnpm audit:color` hex-drift stays 0).

## KNOWN REDS

Sheet/Checkbox pre-broken; Sonar react-hooks on `*.svelte.ts` false positive.

## ROLLBACK

`git checkout -- <the five files>`

## STOP CONDITIONS

Expected string absent → STOP + report which row. No other surface renames — the
LatestUpdateCard/CommunityFeedList `--surface-1/2` rows are PARKED (no verified
target; F8 revisits), do not touch them.
