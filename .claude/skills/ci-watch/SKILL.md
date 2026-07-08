---
name: ci-watch
description: CI follow-through discipline. After ANY push, PR open/update, or merge, watch GitHub Actions to completion, and if red, diagnose to ROOT CAUSE (step names lie — read the failed log), fix like a strict senior dev by hand, re-verify, and re-push until green. Never leave a red pipeline unattended, never claim "done" on unverified or red CI, and NEVER use an auto-fixer (`--fix`/`--write`/`--no-verify`/blind `checkout --ours/--theirs`) or delete tests/code to make red go away. Auto-fires after `git push`/`gh pr create`/merge, or when the operator asks about CI. Composes with `/merge-one-branch` and `/debug`.
---

# `/ci-watch [run-id | pr# | branch]`

Push is not the finish line. Green CI is. This skill makes "watch it, and if it breaks, work the problem like a senior dev" a repeatable, refuse-able discipline — so a push is never fire-and-forget and a red pipeline is never silently abandoned or papered over with an auto-fixer.

This skill exists because the operator has been burned by exactly this: a session claimed branches were "aligned" while CI was red for days, and a "Check formatting" failure was really a `cargo metadata` error the step name hid. Diligence means **you watch, you read the real log, and you work every failure to green — by hand.**

Locked memories this skill cites in refusals:

- [[feedback_no_auto_fix_shortcuts]] — no biome/prettier/eslint/clippy `--fix`/`--write`, no `--no-verify`; fix by hand.
- [[feedback_strict_rust_engineering]] — clippy/compile firing = fix the code, never suppress with `#[allow]` or workspace `lint=allow`.
- [[feedback_compile_green_not_enough]] — lefthook/GitHub CI is the source of truth; local green ≠ CI green; name the runtime signal.
- [[feedback_all_warnings_addressed]] — every warning addressed before "done."
- [[feedback_senior_dev_default_approach]] — uncertain between strict and quick → strict.
- [[feedback_no_revert_without_permission]] — no force-push, reset, or history rewrite of a pushed branch without explicit GO.
- [[feedback_unused_imports_signal_incomplete_work]] — a warning/unused import is missing work, not an auto-fix target.
- CLAUDE.md CC-001 — never report "Done" before verification passes.

## The one rule that overrides convenience

> **Never make red go green by removing the thing that went red.** Not by deleting a failing test, not by `#[allow]`-ing a lint, not by `--fix`/`--write` that silently rewrites or drops code, not by a blind `checkout --ours/--theirs`, not by `--no-verify`. Red means a real problem. Find it, understand it, fix the cause. If you cannot fix it, surface it — you do not hide it.

## Caller contract

Caller MUST honor:

1. **Watch every push.** After any `git push`, `gh pr create`, or merge to a branch with CI, this skill runs. No fire-and-forget.
2. **Read the log, not the step name.** A failed step's *name* is not its *cause*. Always pull `gh run view --log-failed` and read the actual error before proposing a fix.
3. **One root cause at a time.** Fix the first real failure, re-verify locally, re-push, re-watch. Do not batch speculative fixes.
4. **No auto-fixers, ever** (see refusal table). Hand-fixes only.
5. **Green means green.** Do not declare success until every required check passes. A skipped/cancelled required check is not a pass.

## Step 1 — Identify the run

```
gh run list --branch <branch> --limit 5          # or: gh pr checks <pr#>
```

Resolve the in-flight or latest run for the branch/PR just pushed. Note the run id + the job ids.

## Step 2 — Watch to completion (jq-free)

```
gh pr checks <pr#> --watch --interval 30          # PR context
gh run watch <run-id> --exit-status               # run context (exit code reflects success)
```

Do NOT hand-roll a `jq` poll loop — `jq` is not on the Git-Bash PATH here; it fails silently and spins. Use `gh`'s own watch. Arm it as a background waiter (Bash `run_in_background`) so you are notified on completion; do not block the session.

**Coverage:** the watcher must surface BOTH outcomes. `gh run watch --exit-status` returns non-zero on failure — check the exit code; a clean exit is not proof, read the final `gh pr checks` table.

## Step 3 — On green

Report the passing checks + the commit sha. Only now may downstream work proceed (merge, next phase, "done"). If this was a `/merge-one-branch` or a plan phase, hand back to it.

## Step 4 — On red: pull the REAL failure

```
gh run view <run-id> --job <job-id>               # which STEP failed
gh run view --log-failed --job <job-id>           # the actual error lines
```

Read the error. **Distrust the step name.** Real examples from this repo:
- "Check formatting" red → actually `cargo metadata` failed to load a workspace member (a path-dep into a sibling repo missing on CI). Formatting was never the problem.
- "Svelte check" red → real TS type errors + a generated-bindings drift, masked locally by stale `.svelte-kit`.

Classify the cause (cite [[feedback_compile_green_not_enough]] — CI is truth): dependency/manifest, type error, lint, test failure, generated-artifact drift, secret/auth, or flake.

## Step 5 — Fix the cause like a senior dev (by hand)

- **Dependency/manifest** (e.g. path-dep unavailable on CI): retarget to a proper git/published dep; add the private-fetch config; pin a rev. Do not vendor-fork the SSOT without surfacing the trade-off.
- **Type error / compile / clippy:** fix the code. Never `#[allow]`, never `clippy --fix`, never workspace `lint=allow` ([[feedback_strict_rust_engineering]]).
- **Generated-artifact drift** (bindings/tokens): regenerate via the sanctioned command (`cargo xtask regen-bindings`, `pnpm ds:tokens:build`) and commit the result — never hand-edit a generated file to match.
- **Test failure:** fix the code or the test's incorrect expectation — after understanding why it fails. Never delete/skip/`.only` a test to green the run.
- **Secret/auth** (private dep token, deploy token): author the CI config + flag the secret for the operator to set via Infisical ([[feedback_use_infisical_for_gha_secrets]]). Never `gh secret set` by hand.
- **Flake:** re-run once (`gh run rerun <id> --failed`). If it re-fails, it is not a flake — treat as real.

Re-verify locally with the exact CI gate before re-pushing: `cargo check -p <crate>` (never workspace-wide), `cargo fmt --check`, `cd interfaces/desktop && pnpm check`, `cargo deny check advisories`, `pnpm exec lefthook run pre-push`. Local green is necessary, not sufficient — CI may hold state (secrets, clean checkout) your machine hides.

## Step 6 — Re-push and re-watch

Commit the hand-fix as a NEW commit (never `--amend` a pushed commit, never `--no-verify`). Push. Return to Step 2. Loop until green. Each iteration: one root cause, verified, then the next.

## Step 7 — Record what CI caught

If CI caught a class of failure local checks did not (clean-checkout dep, secret, drift), note it — a line in the boundary's spec or a `reference` memory — so the local pre-push gate can be tightened to catch it next time. This is how the pipeline stops re-teaching the same lesson.

## Refusal protocol

Refuse with citation if any of these is requested or tempting to make red go green:

| Requested shortcut | Citation |
|---|---|
| `cargo clippy --fix` / `--fix --allow-dirty` | [[feedback_no_auto_fix_shortcuts]], [[feedback_strict_rust_engineering]] |
| `biome --write` / `prettier --write` / `eslint --fix` | [[feedback_no_auto_fix_shortcuts]] |
| `git commit --no-verify` / bypass lefthook | [[feedback_senior_dev_default_approach]], CC-001 |
| Delete / skip / `.only` a failing test to green the run | The one rule (Step 0) |
| `#[allow(...)]` or workspace `lint = "allow"` to silence a CI lint | [[feedback_strict_rust_engineering]] |
| Blind `git checkout --ours/--theirs` / `merge -X ours/theirs` | [[feedback_no_auto_fix_shortcuts]] |
| `git push --force` / `--force-with-lease` to a shared branch to reset CI | [[feedback_no_revert_without_permission]] |
| Hand-edit a generated file (bindings/tokens) to match CI | Step 5 (regenerate, don't forge) |
| `gh secret set` a deploy token by hand | [[feedback_use_infisical_for_gha_secrets]] |
| Claim "done" / merge while a required check is red or skipped | [[feedback_compile_green_not_enough]], CC-001 |
| Trust the failed step's NAME instead of reading its log | Step 4 |

State the refusal. Cite the rule by name. Read the log, work the real problem, drive to green.

## Related skills

- `/merge-one-branch <branch>` — hands off to this skill after the push in Step 7.
- `/debug <signal>` — for a CI failure whose root cause needs a full fault-trace, run `/debug` inside Step 5.
- `/spec-first <boundary>` — Step 7's convention-growth writes back through it.
