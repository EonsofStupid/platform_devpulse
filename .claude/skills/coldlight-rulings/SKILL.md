---
name: coldlight-rulings
description: PASS 2 of 3 (Fable plans, Opus researches gaps) in the ColdLight recovery chain — turn the census facts into a destination table for dismantling _shared/common and aligning tokens to the locked design boundary. Every module gets a proposed home under the ratified structure; every duplicate pair gets an SSOT direction; every open or gap is dispatched to an Opus research agent for evidence, never guessed. Anything still ambiguous after Opus research is TRUE CONFUSION and stops for the operator's one-line ruling. Output is an operator-approval document — nothing downstream runs until the operator approves it. Invoke as `/coldlight-rulings`. Chain: /coldlight-census → [rulings] → /coldlight-slices → /coldlight-execute → /coldlight-verify.
---

# `/coldlight-rulings` — Pass 2: destinations + gap research (no changes)

**Chain position:** `census → [rulings] → slices → execute → verify`. Planning Pass 2
of three. Fable authors this in the MAIN session. Opus agents are dispatched for gap
research ONLY — they gather evidence and draft options; they never decide structure.
**Structure is decided by exactly one party: the operator.** This pass changes
nothing in the codebase; its sole output is one rulings document.

## Preconditions (verify, don't assume)

1. `.claude/plans/coldlight-recovery/00-census.md` exists. **Re-read it in full** —
   even if this session produced it. Context is not a source of truth; the artifact is.
2. If the census is missing, stale (tree changed since — check `git log -1` and
   `git status` against the census's recorded state), or has an UNVERIFIED list that
   blocks a destination decision → **STOP**: either re-run `/coldlight-census` (on
   the operator's word) or dispatch Opus to close the specific gap (below).

## The ratified structure (destinations must conform — no exceptions)

Per the operator's 2026-07-12 ruling:

1. ALL runtime CSS under `styles/` (the SD5-emitted layers; rebind in token sources).
2. Base component in its own NAMED folder under the components directory (use the
   folder name the tree actually has — verify, never assume), typed.
3. Variants colocated in that component's folder, typed.
4. NO bucket directories anywhere — `_shared`, `common`, `shared`, `_internal`,
   `utils`-as-bucket, `helpers`, `misc`. Dismantling one bucket into another bucket
   is FAILURE, not progress (the 2026-07-11 `_shared`→`_internal` move was exactly
   this mistake).
5. `domains/common` is banned from use and is itself dismantled.
6. Tokens bind through the role vocabulary; component styling flows from the emitted
   `--preset-*` / role chain, never raw literals.

If a module genuinely has no home under rules 1–6 (e.g. a cross-behavior primitive
consumed by 11 behaviors), that is NOT license to invent one — it is an **OPEN** that
goes on the rulings document as a numbered question with researched options. Naming a
new boundary is the operator's act alone.

## Step 1 — Destination table (Fable)

For EVERY module the census found in a bucket, one row:

| Module (path) | Capabilities (from census) | Importers (count + classes) | Proposed destination | Conforms to rule # | Duplicates involved | Confidence |

- `Proposed destination` must be a concrete path that exists in the tree or is
  explicitly flagged `NEW — needs operator naming` (which makes it an OPEN).
- `Confidence` is `RULED` (forced by rules 1–6, no judgment involved) or `OPEN`
  (any judgment call). **When uncertain between RULED and OPEN, it is OPEN.**

## Step 2 — Duplicate SSOT directions (Fable)

For every duplicate pair/cluster from the census, one row:

| Concern | Candidate files | Proposed SSOT | Capabilities the SSOT must ABSORB from each loser (file:line each) | Confidence |

The absorb list is written at FEATURE level from the census's full-file reads —
every option, edge case, ARIA behavior, and cleanup path the losers have that the
SSOT lacks. **Nothing is deleted at any point in this chain until its capabilities
are absorbed and verified** (locked rule: absorb-before-delete). If the census's
capability diff is not detailed enough to write this list, that is a GAP — dispatch
Opus, do not guess.

## Step 3 — Dispatch OPENS and GAPS to Opus

For every OPEN (judgment call) and every GAP (missing evidence), spawn an Opus
research agent (`Agent` tool, `model: "opus"`, read-only instructions):

- **GAP agents** get: the exact question, the census's relevant excerpt, the paths
  to read, and the instruction to return file:line evidence only — no
  recommendations.
- **OPEN agents** get: the question, the ratified rules 1–6 verbatim, and the
  instruction to return 2–3 options with evidence and trade-offs, drawn from how the
  EXISTING tree solves comparable problems — never from generic best practice, never
  by proposing new bucket directories.

Independent agents launch in parallel. Their findings are merged into the rulings
document with attribution (`[opus: <question>]`).

## Step 4 — TRUE CONFUSION stop

If after Opus research an OPEN still has no rule-forced answer, it stays a numbered
question. The rulings document's OPEN section is presented to the operator as
one-line questions with the researched options. **Do not proceed while any OPEN that
blocks a slice is unanswered. Do not pick a default. Do not "propose and proceed."**

## Step 5 — Emit the rulings document

Write ONE file: `.claude/plans/coldlight-recovery/01-rulings.md`:

1. Destination table (Step 1)
2. Duplicate SSOT directions (Step 2)
3. Token-alignment fix list (census Step 5 findings → which token source file each
   fix belongs to — rebind in SD5 sources, never in emitted CSS or app.css)
4. OPEN questions for the operator (numbered, one line each, options attached)
5. An explicit approval line: `APPROVED BY OPERATOR: ____ (date)`

## Exit — HARD GATE

Present to the operator: the table headline (N modules RULED, M OPEN, K duplicate
clusters), the OPEN questions, and the artifact path. Then:

> Rulings drafted. Nothing moves until you approve `01-rulings.md` (answer the OPENs,
> or redline any destination). On your approval: `/coldlight-slices` (Pass 3 —
> amnesia-grade slice plans). Awaiting your word.

**The approval is the operator writing/saying it explicitly. Silence, frustration,
or time passing are not approval. Never auto-trigger the next skill.**
