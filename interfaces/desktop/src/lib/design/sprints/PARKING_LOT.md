# ColdLight Sprints — Parking Lot

## [2026-02-06T15:15:00Z] Blocker: coldlight-verify Pre-commit Failures

**Sprint**: SPRINT-TOKENS-PREFIX-FIX
**Task**: Commit the token prefix fix
**Status**: RESOLVED
**Decision**: Option B — Fix all architecture issues now
**Decided**: 2026-02-06T15:16:00Z

### Context
Attempting to commit the token prefix fix (removing `dp-` prefix from generated tokens). All other pre-commit hooks pass:
- ✅ biome-lint
- ✅ rust-fmt
- ✅ docs-preflight
- ✅ coldlight-docs
- ✅ svelte-check
- ✅ rust-check
- ❌ coldlight-verify

### The Problem
`coldlight-verify` hook fails with **pre-existing** architecture errors unrelated to the token changes:

```
[SPINE_MISMATCH] coldlight: Implementation at api/adapters/coldlight/ but no taxonomy at taxonomy/api/adapter/coldlight/
[PARITY_MISSING_FOLDER] alert-dialog, context-menu, dialog, dropdown-menu, hover-card, menubar, pin-input, popover, select, sheet, tabs, toggle-group, tooltip: Missing api/adapters/meltui/_internal/{kind}/
[CONTRACT_LOAD_FAILED] breadcrumb, card, command, navigation-menu, pagination, separator, slider: Contract files exist but fail to load
```

These are **not caused by the token changes** — they existed before this work started.

### Options Identified

1. **Option A: Temporarily disable coldlight-verify hook** — Comment out the hook in lefthook.yml, commit the token fix, then re-enable and fix the architecture issues in a separate sprint.
   - Tradeoff: Proper separation of concerns, but weakens pre-commit safety temporarily

2. **Option B: Fix all coldlight-verify errors now** — Create missing folders, fix contract load failures, complete the architecture before committing tokens.
   - Tradeoff: Scope creep, mixing unrelated changes in one commit, large PR

3. **Option C: Modify coldlight-verify to allow known issues** — Add an allowlist of known pre-existing errors that don't block commits.
   - Tradeoff: Technical debt, could mask new issues accidentally

4. **Option D: Commit with --no-verify flag** — Bypass hooks entirely for this one commit.
   - Tradeoff: Violates pre-commit discipline, but fastest path forward
