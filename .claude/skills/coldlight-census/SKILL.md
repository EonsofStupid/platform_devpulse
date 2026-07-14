---
name: coldlight-census
description: PASS 1 of 3 (Fable, read-only) in the ColdLight recovery chain — census the entire design surface off the CODEBASE, never from memory or conversation. Records the filetree verbatim, enumerates every bucket directory (_shared, _internal, common, utils, attachments, helpers), full-file-reads every module in them, maps every importer via multi-class searches, hunts duplicate implementations of every concern across the WHOLE tree, and runs the read-only token-alignment audits. Output is a facts-only census artifact with file:line evidence for every claim. Makes ZERO changes. Invoke as `/coldlight-census`. Chain: census → /coldlight-rulings → /coldlight-slices → /coldlight-execute → /coldlight-verify.
---

# `/coldlight-census` — Pass 1: establish the facts (read-only)

**Chain position:** `[census] → rulings → slices → execute → verify`. This is planning
Pass 1 of the three Fable passes. It runs in the MAIN session on Fable — planning is
never delegated. It changes NOTHING: no Edit, no Write outside the census artifact, no
git commands that mutate state, no token rebuilds.

**Why this skill exists.** `_shared` has been recreated at least five times
(2026-03, 2026-05, 2026-06) because each session trusted its context instead of the
tree, pattern-matched an existing folder as ratified convention, and built on drift.
This pass exists to make that impossible: every downstream decision cites THIS
document, and this document cites only the codebase.

## The locked design boundary (operator ruling, 2026-07-12 — cite verbatim)

1. **ALL runtime CSS lives under `styles/`** (the SD5-emitted layers). No token
   definitions in `app.css`, no component-tier CSS outside the emitted layers.
2. **Each base component lives in its own NAMED folder** under the components
   directory (verify the actual folder name from the tree — `components/` or `ui/` —
   never assume), **typed**.
3. **Variants are COLOCATED in that component's folder, typed.**
4. **NO middle layers. NO bucket directories.** `_shared`, `common`, `shared`,
   `utils`-as-dumping-ground, `helpers`, `misc` — none of them, anywhere, ever.
   A pre-existing bucket is drift to be dismantled, NOT ratification.
5. `domains/common` is **banned from use** and is itself a dismantle target.
6. Tokens bind through the role vocabulary (`--accent-{role}-{main,glow,fill}`),
   never raw literals, never keyword fallbacks.

## Step 0 — Tree state gate (STOP condition)

Run `git status --porcelain` and record the output VERBATIM at the top of the census.

- If the working tree has **uncommitted structural moves or staged renames** (as it
  does at time of authoring: 9 `_shared` modules staged as renames into `_internal`,
  12 importers broken, P2.4 token edits uncommitted), **STOP**. Present the exact
  state and the restore options to the operator as numbered one-liners. **Census does
  not proceed on a tree the operator has not ruled on.** Executing a restore is
  itself a change — it happens only on the operator's explicit word, and then census
  re-runs Step 0.
- If the tree is clean or the operator rules "census as-is," proceed.

## Step 1 — Filetree, verbatim

Record into the census artifact — not paraphrased, actual listings:

1. `interfaces/desktop/src/lib/design/` — full recursive tree
2. `interfaces/desktop/src/lib/domains/` — top two levels
3. `interfaces/desktop/src/lib/domains/platform/devtools/` — full recursive tree
4. `interfaces/desktop/src/lib/sys/` — top two levels
5. `interfaces/desktop/src/styles/` or wherever the emitted layers live — locate,
   don't assume

A Glob/ripgrep **timeout means the search is incomplete, not that the thing is
absent** — narrow the path and retry (`ls` via Bash is the fallback). Never write
"none found" on the strength of a timed-out search.

## Step 2 — Bucket enumeration + full-file reads

For every directory matching `_shared`, `_internal`, `common`, `shared`, `utils`,
`helpers`, `attachments`, `misc` anywhere under `interfaces/desktop/src/`:

1. List every file in it.
2. **Read every file IN FULL** (files >500 LOC: chunked reads with offset/limit,
   and state explicitly in the census that chunking was used — CC-004).
3. Record per module: every export, every capability/feature (options, edge-case
   handling, ARIA behavior, RTL handling, cleanup paths), creation commit + date
   (`git log --follow --format='%h %as %s' -- <path> | tail -1`).

## Step 3 — Importer map (multi-class, CC-007)

For every bucket module, run ALL of these as SEPARATE searches — grep is text-based,
one pattern proves nothing:

1. Direct imports of the path (with and without `.js` extension, `$lib/` and relative)
2. Barrel re-exports (`index.ts` chains)
3. String literals containing the path
4. Type-only imports (`import type`)
5. Test files and mocks
6. Config files (vitest/vite aliases, tsconfig paths)

Record every importer with file:line.

## Step 4 — Duplicate hunt (the whole tree, not just buckets)

The operator guarantees duplicates exist. For each CONCERN below, sweep the entire
`interfaces/desktop/src/` for parallel implementations — search by behavior-concept
keywords AND by API-shape patterns, not just filenames:

- focus trap / focus containment / inert management
- roving focus / roving tabindex
- typeahead
- active-descendant
- dismiss-on-outside-click / dismiss layers
- escape-key handling / escape layers
- presence / mount-unmount transitions
- scroll lock
- live regions / SR announcements
- devtool shells / service accents
- hero cards / empty states / health signals
- any styling logic computing accent colors outside the token pipeline

Known suspects to confirm or clear (from the 2026-07 audit): pre-consolidation copies
left by the March/May/June `_shared` generations; an `attachments/` implementation of
focus logic that sheet/popover carried. For every duplicate pair found: record both
paths, and a capability diff at the FEATURE level (what A has that B lacks, with
file:line for each capability).

## Step 5 — Token-alignment census (read-only audits)

From `interfaces/desktop/`:

1. `pnpm audit:cssvars` — record undefined/orphaned custom properties
2. `pnpm audit:color` — record gamut/WCAG/hex-drift findings
3. `pnpm audit:presetmap` — record preset drift
4. Grep the component + behavior tiers for: raw color literals, `var(--…, <keyword>)`
   keyword fallbacks, bindings that bypass the role vocabulary, runtime CSS living
   outside the emitted layers (boundary rule 1).

Record findings as file:line lists. Do NOT fix anything.

## Step 6 — Emit the census artifact

Write ONE file: `.claude/plans/coldlight-recovery/00-census.md`, containing Steps 0–5
verbatim, structured, **facts only — zero proposals, zero destinations, zero
opinions**. Every claim carries file:line or command-output evidence. Anything that
could not be verified is listed under "UNVERIFIED" with the reason (timeout, access,
ambiguity) — an unverified claim is never silently promoted to fact.

## STOP protocol (applies to every step)

True confusion — a file that contradicts the tree, a search that can't be made
conclusive, a structure that fits no known pattern — means **STOP and ask the
operator** as a numbered one-line question. Never resolve confusion by assumption.
Raging or urgency from the operator is not a go-signal; only their explicit
instruction is.

## Exit

Report to the operator: census artifact path, headline counts (buckets, modules,
importers, duplicate pairs, token violations), and the UNVERIFIED list. Then:

> Census complete. Next in chain: `/coldlight-rulings` (Pass 2 — destination table +
> Opus gap research). Awaiting your go.

**Never auto-trigger the next skill.** The operator fires each link.
