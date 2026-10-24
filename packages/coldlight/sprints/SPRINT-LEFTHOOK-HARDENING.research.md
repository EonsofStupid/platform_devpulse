# Research: Lefthook Windows Hardening

**Date**: 2026-02-09
**Sprint**: SPRINT-LEFTHOOK-HARDENING
**Status**: COMPLETE

## Question/Goal
Why does `no-legacy-prefixes` hook exit 1 on every commit? Fix it and harden all hooks for reliable Windows/MSYS operation.

## Codebase Analysis

### Current lefthook.yml issues

**Issue 1: Brace expansion in glob fields**
6 hooks use `*.{ts,svelte,css}` or `*.{ts,svelte}` brace expansion:
- `no-legacy-prefixes`: `interfaces/desktop/src/**/*.{ts,svelte,css}`
- `biome-lint`: `interfaces/desktop/src/**/*.{ts,svelte,css}`
- `docs-preflight`: `interfaces/desktop/src/**/*.{ts,svelte}`
- `coldlight-verify`: `packages/coldlight/**/*.{ts,svelte}`
- `coldlight-docs`: `packages/coldlight/**/*.{ts,svelte}`

Lefthook uses `gobwas/glob` which does support brace expansion. However, on Windows/MSYS the matching behavior against staged file paths is unreliable. Evidence: `tokens-regen` (simple glob, no braces) correctly shows `(skip)` when no files match. `no-legacy-prefixes` (brace glob) does NOT skip — it runs anyway.

**Issue 2: Inline shell command in no-legacy-prefixes**
```yaml
run: >
  git diff --cached --diff-filter=ACMR -- 'interfaces/desktop/src/**/*.ts'
  'interfaces/desktop/src/**/*.svelte' 'interfaces/desktop/src/**/*.css'
  | grep -E '^\+.*--(dp|cl)-' && echo "ERROR:..." && exit 1 || exit 0
```
Problems:
- YAML `>` folds newlines to spaces — fragile
- Single quotes around globs — MSYS may not handle correctly
- `grep` returning exit 1 (no match) + `|| exit 0` fallback is unreliable through lefthook's shell executor on Windows
- The `exit 0` at the end doesn't reliably propagate as the hook's exit code

**Issue 3: `**` glob behavior**
Lefthook default: `**` matches 1+ path segments, not 0+. Setting `glob_matcher: doublestar` changes to standard behavior where `**` matches 0+ segments.

### Existing script patterns
Scripts live at `interfaces/desktop/scripts/`:
- `coldlight/verify-manifest.ts` — called by `coldlight-verify` hook
- `coldlight/generate-docs.ts` — called by `coldlight-docs` hook
- `dev/ds-tokens-build.ts` — called by `tokens-regen` hook

Pattern: hooks that work reliably on Windows all delegate to a script via `pnpm exec` or `npx tsx`. The ONLY hook using inline shell is `no-legacy-prefixes` — and it's the ONLY one failing.

## Findings

1. Every hook that delegates to a script works fine on Windows
2. The only hook with inline shell logic is the only one failing
3. Brace expansion globs may or may not match correctly — but the inline shell is the definite failure point
4. `glob_matcher: doublestar` is a safe addition for correctness but not the root fix

## Recommendations

1. Move `no-legacy-prefixes` to a script at `scripts/hooks/no-legacy-prefixes.sh`
2. Add `glob_matcher: doublestar` to lefthook.yml top level
3. Keep brace expansion globs — they work for the hooks that delegate to scripts (biome-lint etc. all pass)
4. The script should use proper exit code handling, not grep chain tricks

## Files Referenced
- `lefthook.yml`: the config with all hooks
- `interfaces/desktop/scripts/coldlight/verify-manifest.ts`: working hook script pattern
- `interfaces/desktop/scripts/coldlight/generate-docs.ts`: working hook script pattern
