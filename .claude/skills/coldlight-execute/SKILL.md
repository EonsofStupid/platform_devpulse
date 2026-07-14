---
name: coldlight-execute
description: Execution link of the ColdLight recovery chain — hands EXACTLY ONE approved slice plan to a Sonnet executor agent and reviews the result against the plan. Sonnet reads the slice file as its complete instruction set, re-reads every named file before editing, absorbs before deleting, runs the slice's literal verification commands, and reports raw output. Fable reviews as gatekeeper, updates the INDEX, and stops — the next slice is a fresh operator-triggered invocation. Any deviation, surprise, or confusion aborts the slice via its rollback; the PLAN gets fixed via /coldlight-slices, never improvised around. Invoke as `/coldlight-execute <NN>`. Chain: /coldlight-census → /coldlight-rulings → /coldlight-slices → [execute] → /coldlight-verify.
---

# `/coldlight-execute <NN>` — one slice, one Sonnet run, one review

**Chain position:** `census → rulings → slices → [execute] → verify`. This is the
ONLY link in the chain that changes product code, and it changes exactly what
slice NN says — nothing more. **Model routing is fixed: Sonnet executes, Fable
(main session) reviews. Fable does not author product code in this link; the plan
already contains the code decisions.**

## Preconditions (verify, don't assume)

1. `<NN>` was given by the OPERATOR. No slice number from the operator → STOP.
   "Continue" or "next" from the operator means the next PENDING slice in
   `02-slices/INDEX.md` — name it back to them in one line before dispatch.
2. Re-read `02-slices/INDEX.md`: slice NN is `PENDING`, and every slice it depends
   on is `DONE` (with verify checkpoints, where required, logged in
   `03-verification-log.md`). Otherwise → STOP, report which dependency is unmet.
3. Re-read `slice-NN-*.md` in full. If it fails the amnesia test on sight (a gap, an
   ambiguity, a stale path) → do NOT patch it inline; STOP and route back to
   `/coldlight-slices` to fix the plan, then seek the operator's re-approval for
   that slice.
4. `git status` is clean or matches the slice's stated precondition exactly.

## Step 1 — Mark and dispatch

Set slice NN `IN-PROGRESS` in the INDEX. Spawn ONE executor agent
(`Agent` tool, `model: "sonnet"`) whose prompt is, in this order:

1. The full text of `slice-NN-*.md` (the plan IS the instruction set).
2. The standing constraints, verbatim:
   - Execute the STEPS exactly. No improvisation. No adjacent fixes. No
     drive-by cleanups. No new directories, ever — if a step seems to require
     creating a directory the plan doesn't name, STOP and report.
   - Re-read every file in FULL immediately before editing it (>500 LOC: chunked).
     The plan's excerpts are anchors, not substitutes for the file.
   - Deletion steps: first re-verify the absorption evidence listed in the plan
     (grep the SSOT for each absorbed capability); any capability missing → STOP.
   - Run the slice's PRECONDITION probes first and its VERIFY commands last; paste
     RAW command output. Expected-vs-actual mismatch → run ROLLBACK, report, stop.
   - KNOWN REDS listed in the plan are pre-existing — do not chase, do not "fix",
     do not silence. Any NEW red → ROLLBACK and report.
   - No commits, no pushes, no `--fix`/`--write` flags, no `#[allow]`/lint
     suppressions, no stubs or TODOs.
   - Your final message is a report: steps completed (numbered), raw verify
     output, files changed (`git status --porcelain` + `git diff --stat`), and any
     deviation — even one you think is harmless.

## Step 2 — Fable reviews the report (gatekeeper, not author)

Against the slice file, check ALL of:

1. Every STEP is accounted for; every FILE touched is in the plan's list and no
   file outside it appears in `git diff --stat`.
2. VERIFY output matches the plan's expected results (known reds and nothing else).
3. Every IMPORT REPOINT landed — re-run one importer-class grep yourself as a spot
   probe.
4. For absorption slices: spot-verify one absorbed capability in the SSOT at
   file:line yourself.

Any check fails → the slice is NOT done: run/confirm ROLLBACK, set the INDEX row
back to `PENDING` with a note, and report the failure honestly — what the executor
did, what the plan missed, and whether the fix belongs in the plan
(`/coldlight-slices`) or in the rulings (`/coldlight-rulings`). **Never report a
failed or partial slice as progress.**

## Step 3 — Close the slice

All checks pass → set slice NN `DONE` in the INDEX. If the INDEX marks this slice as
a verify checkpoint, the slice is `DONE (pending checkpoint)` until
`/coldlight-verify` logs it. Report to the operator: slice title, diff stat, verify
summary (one line per command), and:

> Slice NN done. Next per INDEX: slice MM — `<title>`. Fire `/coldlight-execute MM`
> when ready<, or `/coldlight-verify` first — this was a checkpoint slice>.

**One invocation = one slice. Never chain to the next slice unprompted. Never
commit — committing is a separate operator instruction.**
