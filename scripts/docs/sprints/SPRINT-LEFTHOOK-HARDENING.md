# SPRINT: Lefthook Windows Hardening

> **Status**: READY
> **Priority**: BLOCKING
> **Goal**: Fix `no-legacy-prefixes` exit 1 and harden all hooks for Windows/MSYS
> **Research**: [SPRINT-LEFTHOOK-HARDENING.research.md](SPRINT-LEFTHOOK-HARDENING.research.md)

## Problem

`no-legacy-prefixes` hook fails with `exit status 1` on every commit. Root cause: it's the only hook using inline shell logic instead of delegating to a script. The grep/exit chain doesn't work reliably through lefthook's shell executor on Windows/MSYS.

All other hooks (biome-lint, coldlight-verify, coldlight-docs, svelte-check, rust-fmt, rust-check, docs-preflight) pass because they delegate to scripts or tools.

## Tasks

### Task 1: Create `no-legacy-prefixes` hook script
- [ ] Create `scripts/hooks/no-legacy-prefixes.sh`
- [ ] Logic: run `git diff --cached --diff-filter=ACMR` for `.ts`, `.svelte`, `.css` under `interfaces/desktop/src/`
- [ ] Grep for `--dp-` or `--` prefixes in added lines
- [ ] Exit 0 if clean, exit 1 with clear message if violations found
- [ ] Test: run script manually with no staged files → exit 0
- [ ] Test: stage a file with `--dp-test` → exit 1

### Task 2: Update `lefthook.yml`
- [ ] Add `glob_matcher: doublestar` at top level (under `pre-commit:` is fine too)
- [ ] Replace `no-legacy-prefixes` inline `run:` with: `run: bash scripts/hooks/no-legacy-prefixes.sh`
- [ ] No other hook changes needed — all others work

### Task 3: Verify
- [ ] Commit with no `interfaces/desktop/src/` files staged → hook skips or exits 0
- [ ] Commit with clean `interfaces/desktop/src/` files staged → hook passes
- [ ] All other hooks still pass (biome-lint, docs-preflight, coldlight-verify, coldlight-docs, svelte-check)
- [ ] Summary line shows all green

## Scope

**In scope**: Fix the one broken hook, add `glob_matcher: doublestar`
**Out of scope**: Refactoring other hooks, changing hook ordering, adding new hooks
