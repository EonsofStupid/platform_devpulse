---
name: merge-one-branch
description: Senior-dev procedure for merging ONE source branch into main. Hard preconditions, mandatory conflict table review, manual hand-resolve (no auto-merge tools), per-crate cargo check (never workspace-wide), pnpm check, lefthook pre-push as CI ground truth, push, branch deletion. STOPS between branches. Refuses every shortcut by citation. Invoke as `/merge-one-branch <source-branch>`.
---

# `/merge-one-branch <source-branch>`

One branch. One merge. One gate. No shortcuts. Stops between branches.

This skill IS the senior-dev gate. Locked memories it cites in refusals:

- `feedback_no_auto_fix_shortcuts.md` — no biome/prettier/eslint/clippy --write/--fix
- `feedback_strict_rust_engineering.md` — fix code, never suppress
- `feedback_senior_dev_default_approach.md` — default strict, no `--no-verify`
- `feedback_no_revert_without_permission.md` — no force-push / reset / rewrite shared history without explicit GO
- `feedback_all_warnings_addressed.md` — every warning addressed before "done"
- `feedback_compile_green_not_enough.md` — compile-green ≠ done; lefthook is CI
- `feedback_no_cargo_between_edits.md` — author the fix, one check, no per-file flapping
- CLAUDE.md "create NEW commits rather than amending" — never `--amend` a merge commit

## Caller contract

Caller MUST supply:
1. Source branch name (exact, no abbreviation)
2. Expected conflict zones (file paths + resolution direction per file) OR an explicit "merge-clean-predicted" assertion

Caller MUST honor:
1. Invoke for EXACTLY ONE source branch per call
2. Wait for explicit STOP at Step 7 "HALT" before invoking again
3. Never instruct skipping a gate

## Pre-conditions (P1–P6) — refuse to start if any fail

| # | Check | Pass condition |
|---|---|---|
| P1 | `git rev-parse --abbrev-ref HEAD` | output is exactly `main` |
| P2 | `git status --porcelain` | empty |
| P3 | `git fetch origin main && git rev-list HEAD..origin/main` + reverse | both empty (no divergence) |
| P4 | `git rev-parse --verify <branch>` | exit 0 |
| P5 | `git rev-list main..<branch>` | non-empty (at least 1 commit ahead) |
| P6 | `git rev-parse --verify origin/<branch>` OR explicit local-only acknowledgment | one of two |

Failure response:
- P1 fail → instruct `git checkout main`
- P2 fail → list dirty files; instruct `git stash push -m "<marker>" -- <files>` or commit on appropriate branch
- P3 fail → instruct `git pull --ff-only origin main` or surface divergence
- P4 fail → instruct `git fetch origin <branch>:<branch>`
- P5 fail → REFUSE to merge zero commits. Recommend deletion. Halt.
- P6 fail → ask user explicitly whether to merge local-only branch

## Step 1 — Inventory

```
git rev-list --count main..<branch>          # N commits ahead
git diff --stat main..<branch>               # files + ins/del
git log main..<branch> --oneline             # commit list
```

Report: branch, target sha, N commits, X files (+ins -del), one-line commit list.

## Step 2 — Conflict prediction

```
git merge-tree --write-tree --no-messages main <branch>
```

Inspect output. Report: no-conflict-predicted (tree sha only) OR conflict-files list.

If predicted-conflict files do NOT match the caller's expected conflict zones → STOP. Surface the discrepancy. Wait for caller to update expectations or accept the new shape. Do NOT proceed.

## Step 3 — STOP for explicit GO

Halt with full Step 1 + Step 2 report.

> Merge `<branch>` into `main`? `<N>` commits, `<X>` files, `<C>` predicted conflicts. Reply `go` to merge, anything else to abort.

Wait for unambiguous "go". No auto-proceed.

## Step 4 — Perform merge with manual resolution

```
git merge --no-ff <branch> -m "<conventional-commit subject>

<body listing absorbed commits>"
```

If `git merge` reports conflicts: for each conflicted file, in alphabetical order:

1. `git status` → confirm conflict file list
2. Read the file (shows conflict markers)
3. `git show :2:<file>` → HEAD side
4. `git show :3:<file>` → incoming side
5. `git show :1:<file>` → common ancestor
6. Hand-edit to final correct state by **applying the caller's conflict resolution table**:
   - "take main" → `git checkout --ours <file>` (allowed ONLY when the table entry documents it as a verified-safe shortcut, NEVER blind)
   - "take branch" → `git checkout --theirs <file>` (same condition)
   - "hand-merge" → Edit the file by hand; resolved form usually contains both sides' intent
   - "regenerate" → leave conflict in place; will be overwritten by codegen in Step 5
7. `git add <file>`
8. Next conflict file

When all resolved: `git commit` (uses pre-staged message). Lefthook commit-msg gate fires.

If a resolution is genuinely uncertain → STOP. Surface to user. Wait for direction.

## Step 5 — Regenerate generated artifacts (if any conflict was "regenerate")

```
cargo xtask regen-bindings              # or equivalent per the caller's table
cargo update --workspace --offline      # if Cargo.lock conflicts were taken
git add -A
git commit --amend --no-edit            # FORBIDDEN — instead:
git commit -m "chore(merge): regenerate bindings + recanonicalize Cargo.lock post <branch> absorption"
```

Note: amending the merge commit is forbidden. The regen is its own follow-up commit on the merge HEAD.

## Step 6 — Local CI gate (lefthook = CI per user)

Halt on first failure. NO shortcuts.

| # | Gate | Command | On failure |
|---|---|---|---|
| G1 | TypeScript + Svelte | `cd interfaces/desktop && pnpm check` | Hand-fix. Re-run. Never auto-fixers. |
| G2 | Affected Rust crates | `cargo check -p <crate>` per crate in caller's list | Hand-fix. Re-run. Never `cargo clippy --fix`, never workspace-wide `cargo check`, never workspace `lint = "allow"`. |
| G3 | Full pre-push | `pnpm exec lefthook run pre-push` | Hand-fix root cause. Re-run. Never `--no-verify`. |
| G4 | Manifest sanity | `git show HEAD:.release-please-manifest.json` | If any version reverted vs. pre-merge main → STOP. Regression slipped through. `git reset --hard ORIG_HEAD` and re-attempt resolution. |

Fix commits during G1–G3 are NEW commits, not amends. Cite the locked rule against amending if tempted.

## Step 7 — Push and verify

```
git push origin main
git rev-parse HEAD
git rev-parse origin/main                    # must equal HEAD
```

If push rejects (non-fast-forward) → STOP. Do NOT force-push (`feedback_no_revert_without_permission.md`). Likely cause: someone pushed between Step 6 and Step 7. Requires `git pull --rebase origin main`, re-run G1–G3, retry push.

## Step 8 — Delete source branch

Only after Step 7 confirms push.

```
git push origin --delete <branch>            # remote first (if remote exists)
git branch -d <branch>                       # local; -d not -D unless explicit
```

If `<branch>` is user's working branch for ongoing work → ask before deletion.

## Step 9 — Final state and STOP

Report:
- Merge commit sha on main
- Commits added
- Source branch deletion confirmed
- Remaining branches (top 15 by date)
- Remaining stashes

**HALT.** Does NOT auto-proceed to next branch. Caller must invoke `/merge-one-branch <next>` explicitly.

## Refusal protocol

These actions trigger refusal mid-skill with the cited rule. Refuse, cite, propose correct path:

| Requested shortcut | Citation |
|---|---|
| `git push --force` / `--force-with-lease` to main | `feedback_no_revert_without_permission.md` |
| `git commit --no-verify` | `feedback_senior_dev_default_approach.md`, CC-001 |
| `git checkout --theirs/--ours` without documented table entry | `feedback_no_auto_fix_shortcuts.md` |
| `git merge -X theirs/ours` | `feedback_no_auto_fix_shortcuts.md` |
| `cargo clippy --fix` / `--fix --allow-dirty` | `feedback_no_auto_fix_shortcuts.md`, `feedback_strict_rust_engineering.md` |
| `biome --write` / `prettier --write` / `eslint --fix` | `feedback_no_auto_fix_shortcuts.md` |
| Adding `lint = "allow"` workspace-wide to silence merge fallout | `feedback_strict_rust_engineering.md` |
| `git commit --amend` on the merge commit | CLAUDE.md "create NEW commits rather than amending" |
| Skipping G1 / G2 / G3 / G4 to push faster | `feedback_compile_green_not_enough.md`, `feedback_all_warnings_addressed.md` |
| Merging a 2nd branch in same skill invocation | This skill's caller contract |
| `cargo check` (workspace-wide) instead of `cargo check -p <crate>` | CLAUDE.md "cargo check -p <crate> — typecheck one crate (NEVER workspace-wide)" |

State the refusal. Cite the rule by name. Do not perform the shortcut. Propose the correct path.
