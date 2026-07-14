---
name: coldlight-verify
description: Checkpoint link of the ColdLight recovery chain — proves a slice series actually WORKS, not merely compiles. Re-runs the full gate set (pnpm check, targeted tests, token audits), re-runs the token-alignment probes on emitted CSS, and — for anything render-affecting — stops for the OPERATOR's own eyes on a running app (cargo xtask run-dev) against named visual checkpoints. Compile-green is necessary, never sufficient; only this skill's log marks slices DONE at checkpoint boundaries. Invoke as `/coldlight-verify` after checkpoint slices, or standalone anytime the operator wants ground truth. Chain: /coldlight-census → /coldlight-rulings → /coldlight-slices → /coldlight-execute → [verify].
---

# `/coldlight-verify` — the render-truth checkpoint

**Chain position:** `census → rulings → slices → execute → [verify]`. The chain's
exit gate. The five-times-recreated `_shared` and the months of "gates pass but the
UI is monochrome" happened because verification stopped at compile-green. This skill
is where that stops: **a render-affecting change is DONE when the operator has seen
it render, and not one moment before.**

## When it fires

- After any slice the INDEX marks as a checkpoint (minimum: end of every absorption
  series, end of every render-affecting series).
- Standalone, whenever the operator wants ground truth on the current tree.

## Step 1 — Gate battery (literal, from `interfaces/desktop/`)

Run each; record RAW summaries in the log — never paraphrase a failure:

1. `pnpm check` — expect 0 errors / 0 warnings
2. `pnpm vitest run` scoped to the touched behaviors/components per the slice files
3. `pnpm audit:cssvars` — expect no NEW undefined/orphaned vars vs the census
4. `pnpm audit:color` — expect no NEW gamut/WCAG/drift findings vs the census
5. `pnpm audit:presetmap` — expect no NEW drift vs the census

**Known reds, verbatim (do not chase, do not silence, check BEFORE investigating):**
Sheet.test.ts (5 failures) and Checkbox.test.ts (2) are baseline-verified pre-broken;
Sonar's React-hook rule on `*.svelte.ts` files is rule-scoping noise — hooks are
never renamed for it. Anything red that is NOT on this list is a finding: report it
with raw output; fixing it belongs to a slice, not to this checkpoint.

## Step 2 — Emitted-CSS probes

For every token-alignment slice since the last checkpoint, grep the EMITTED CSS
(the `styles/` output of `pnpm ds:tokens:build`) for the exact expected chain and
paste the matching line — e.g. `--preset-button-primary-background-color:
var(--accent-primary-main);`. The token source being right is not the proof; the
emission is.

## Step 3 — Operator render check (the only authority on "works")

For render-affecting series, hand the operator a SHORT checklist — concrete,
yes/no, one screen each — and **STOP until they answer.** Seed checklist (extend
from the slices under verification):

1. `cargo xtask run-dev` — app boots, no white/blank window.
2. Primary CTAs render BLUE (the primary role), not teal, not monochrome.
3. Route backdrops differ per hub (teal / purple / magenta / ember / cyber), visibly.
4. Destructive buttons render on the danger role (red family) with its glow.
5. No monochrome-teal wash anywhere on the main shells.
6. Focus rings / dialogs / sheets still open, trap, and dismiss correctly.

Their answers go in the log verbatim, pass or fail. **A "no" on any item is a
finding routed back to `/coldlight-slices` (plan fix) — never patched ad-hoc from
this skill.** This skill makes no code changes, ever.

## Step 4 — Log and close

Append to `.claude/plans/coldlight-recovery/03-verification-log.md`: date, tree SHA
(`git rev-parse --short HEAD` + dirty state), slices covered, gate battery results,
emitted-CSS probes, operator checklist answers. Then update `02-slices/INDEX.md`:
checkpoint slices flip from `DONE (pending checkpoint)` to `DONE` **only on a fully
green log including the operator's eyes.**

## Exit

Report: checkpoint verdict (GREEN / FINDINGS with the list), log path, and — from
the INDEX — what's next:

> Checkpoint <green|N findings>. Next per INDEX: `/coldlight-execute <MM>`
> <or: findings routed to /coldlight-slices for plan revision>. Awaiting your word.

**Never trigger the next link yourself. Committing the verified work is a separate,
explicit operator instruction — this skill never commits.**
