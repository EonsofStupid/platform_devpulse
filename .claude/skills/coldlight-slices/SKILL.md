---
name: coldlight-slices
description: PASS 3 of 3 (Fable) in the ColdLight recovery chain — convert the operator-APPROVED rulings into execution slice plans written for a developer with anterograde amnesia. Every slice is ≤5 files, fully self-contained (absolute paths, literal commands, expected outputs, feature-level absorption matrices, enumerated import repoints, rollback command), cites the codebase for every claim, and never references conversation context. These plans are what Sonnet executes — a gap in a plan becomes a defect in the code, so plans have no gaps. Invoke as `/coldlight-slices` only after the operator has approved 01-rulings.md. Chain: /coldlight-census → /coldlight-rulings → [slices] → /coldlight-execute → /coldlight-verify.
---

# `/coldlight-slices` — Pass 3: amnesia-grade slice plans (no changes)

**Chain position:** `census → rulings → [slices] → execute → verify`. The final Fable
planning pass. This pass changes nothing in the codebase; it emits slice-plan files
that a different, smaller model (Sonnet) will execute verbatim. **The executor is
assumed to have anterograde amnesia: it has never seen this repo, remembers nothing
between slices, and will do exactly what the plan says and nothing else. Therefore
the plan cannot have gaps, cannot say "as discussed," cannot rely on judgment.**

## Preconditions (verify, don't assume)

1. `.claude/plans/coldlight-recovery/01-rulings.md` exists, **re-read in full**, and
   carries the operator's explicit approval (the `APPROVED BY OPERATOR:` line is
   filled, or the operator's approval is quoted verbatim in this session). If not
   approved → **STOP**. Drafting slices from unapproved rulings re-creates the
   2026-07-11 failure (structural moves off an inferred ruling).
2. Every OPEN that blocks a slice is answered. An unanswered OPEN excludes that
   module's slices from this pass — note the exclusion; never fill the gap yourself.
3. `git status` matches the state the rulings assumed. Drifted tree → STOP, report.

## Slice design rules

- **≤5 files touched per slice** (CC-002). Moving a module = the move + its import
  repoints; if repoints exceed the budget, the slice splits — repoint-only slices
  are normal and good.
- **One concern per slice.** Never mix a module move with a token rebind.
- **Dependency-ordered.** A slice may depend only on LOWER-numbered slices. The
  INDEX records the DAG.
- **Absorption before deletion, across slice boundaries.** The slice that deletes a
  duplicate must be numbered AFTER the slice that absorbs its capabilities into the
  SSOT and AFTER a verify checkpoint has confirmed the absorption. The delete slice
  opens by re-verifying the absorption evidence.
- **Verification inside every slice.** A slice ends with literal commands and their
  expected outcomes. Compile-green is necessary, not sufficient — render-affecting
  slices name the visual checkpoint the operator will confirm via `/coldlight-verify`.

## Required sections of every slice file

Each slice is `.claude/plans/coldlight-recovery/02-slices/slice-NN-<kebab-title>.md`:

1. **GOAL** — one sentence, plain language.
2. **PRECONDITIONS** — exact expected `git status` cleanliness, which slices must be
   DONE (by number), and 1–3 literal grep/read probes with expected output that
   prove the tree is in the assumed state. Probe fails → executor STOPS.
3. **FILES** — every file this slice touches, absolute repo-relative paths, with
   per-file: current role (one line) and what changes.
4. **STEPS** — numbered, literal. For edits: exact old→new content or a precise
   unambiguous description with anchors. For moves: the exact `git mv` command. For
   absorptions: the feature matrix — each capability, its source file:line in the
   loser, where it lands in the SSOT, and how the merged API stays typed.
5. **IMPORT REPOINTS** — every importer (from the census's multi-class search),
   file:line, old import → new import. "Search and replace" is not a step; the
   enumerated list is the step.
6. **VERIFY** — literal commands (`cd interfaces/desktop && pnpm check`, targeted
   `pnpm vitest run <path>`, `pnpm audit:cssvars`, …) with expected result stated
   ("0 errors", "N pre-existing known-red failures in Sheet/Checkbox tests and no
   others — see known-reds note below").
7. **KNOWN REDS** — the pre-existing failures the executor must NOT chase or "fix":
   Sheet.test.ts (5) and Checkbox.test.ts (2) are baseline-verified pre-broken;
   Sonar's React-hook rule on `*.svelte.ts` is a false positive — never rename hooks.
8. **ROLLBACK** — the literal command(s) restoring the pre-slice state.
9. **STOP CONDITIONS** — "if X is not exactly as stated, stop and report; do not
   improvise, do not fix adjacent problems, do not create any directory."

## Token-alignment slices

Rulings section 3 (token fixes) becomes its own slice series: every rebind happens in
the SD5 token SOURCES (`scripts/build/styledictionary/tokens/src/...`), followed by
`pnpm ds:tokens:build`, followed by a grep probe on the emitted CSS proving the
expected `--preset-*`/role chain. Never edit emitted CSS, never edit `app.css` to
define tokens (boundary rule 1).

## Step — Emit the INDEX

`.claude/plans/coldlight-recovery/02-slices/INDEX.md`: the ordered slice list, the
dependency DAG, which slices end at a `/coldlight-verify` checkpoint (minimum: after
every absorption series and every render-affecting series), and a status column
(`PENDING / IN-PROGRESS / DONE / BLOCKED`) that `/coldlight-execute` updates.

## Self-check before exit (the amnesia test)

Re-read each slice file cold and ask: could an executor who has NEVER seen this
conversation, this repo, or the census execute it with zero questions and zero
judgment calls? Any "it depends" found → fix the plan now. A plan that needs the
planner present has failed this skill.

## Exit — HARD GATE

Report: slice count, DAG shape, verify-checkpoint positions, and the INDEX path.
Then:

> Slices authored. Review `02-slices/` — on your approval, execution starts with
> `/coldlight-execute 01` (Sonnet, one slice per invocation, never auto-continuing).
> Awaiting your word.

**Never auto-trigger execution. The operator fires each slice.**
