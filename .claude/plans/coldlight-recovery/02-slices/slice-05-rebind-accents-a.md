# Slice 05 — WRONG-NAME rebinds, batch A (accent family)

## GOAL

Five consumer files reference accent tokens that don't exist; rebind each to the
verified existing token (rulings §3.1 / GAP-D). Line numbers are anchors from the
2026-07-12 audit; match by exact string, not line.

## PRECONDITIONS

- Slices 01–04 DONE. Tree clean outside `.claude/plans/**`.
- Probe 1: `grep -rn -- "--accent-positive-main" interfaces/desktop/src | wc -l` → ≥3 (KnowledgeCard, IntelligenceMemoryStream ×2, Sidebar). Zero → STOP (already fixed).
- Probe 2: `grep -n -- "--accent-success-main" interfaces/desktop/src/lib/design/styles/semantic/accent.css` → exactly 1 hit (target exists).
- Probe 3: `grep -n -- "--interaction-hover" interfaces/desktop/src/lib/design/styles/semantic/interaction.css` → ≥1 hit (target exists).

## FILES

1. `interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeCard.svelte` (~:264)
2. `interfaces/desktop/src/lib/devtools/clyffy/memory/intelligence/feature/IntelligenceMemoryStream.svelte` (~:307, ~:321)
3. `interfaces/desktop/src/lib/layouts/app/Sidebar.svelte` (~:118)
4. `interfaces/desktop/src/lib/domains/chat/feature/SuggestionDropdown.svelte` (~:43, ~:55, ~:57, ~:69)
5. `interfaces/desktop/src/lib/devtools/system/datastores/surrealdb/feature/SurrealdbDevtool.svelte` (~:311)

## STEPS

Exact-string replacements (whole var expression; if an inline fallback exists in the
`var(...)` being replaced, DROP the fallback — rule 6):

1. Files 1–3: every `var(--accent-positive-main` → `var(--accent-success-main` (expect 4 total occurrences across the 3 files).
2. File 4: `var(--accent-primary)` → `var(--accent-primary-main)` (~:69; expect 1 — the bare form only; do NOT touch any existing `--accent-primary-main`).
3. File 4: `var(--text-error` … `)` → `var(--signal-error)` (~:43; drop any fallback).
4. File 4: `var(--surface-hover` … `)` → `var(--interaction-hover)` (~:55 and ~:57; drop fallbacks).
5. File 5: `var(--accent-purple)` → `var(--accent-purple-main)` (~:311; bare form only).

## IMPORT REPOINTS

None (CSS var strings only).

## VERIFY

- `grep -rn -- "--accent-positive-main\|var(--accent-primary)\|var(--accent-purple)\|--text-error\|--surface-hover" interfaces/desktop/src --include="*.svelte"` → 0 hits.
- `cd interfaces/desktop && pnpm check` → 0 errors 0 warnings.
- `pnpm audit:cssvars` → UNDEFINED list drops `--accent-positive-main`, `--accent-primary`, `--accent-purple`, `--text-error`, `--surface-hover`; no NEW names.

## KNOWN REDS

Sheet/Checkbox tests pre-broken; Sonar react-hooks on `*.svelte.ts` false positive.

## ROLLBACK

`git checkout -- <the five files>`

## STOP CONDITIONS

Any expected string absent (already changed / moved) → STOP and report which. Never
substitute a different token than the table says. Touch nothing beyond the 5 files.
