# SPRINT F3: Biome Lint Hygiene

> **Status**: IN PROGRESS
> **Scope**: `interfaces/desktop/` (TypeScript, scripts)
> **Depends On**: None
> **Tasks**: 8 tasks across 2 phases
> **Compact Checkpoint**: None required (small sprint)

---

## Goal

Fix all 19 biome lint errors blocking `git commit`. Every fix is mechanical — no architecture changes, no new features, no refactors. After this sprint, `pnpm biome check` passes clean and pre-commit hooks succeed.

---

## Current State (Audit: 2026-02-05)

### Blocking Errors by File

| File | Errors | Rule |
|------|--------|------|
| `scripts/test-schema.ts` | 12 | noConsole |
| `src/lib/design/api/adapters/coldlight/_internal/dialog/dialog.svelte.ts` | 1 | noUnusedPrivateClassMembers |
| `scripts/dev/inject-headers.ts` | 1 | noUnusedVariables (interface) |
| `src/lib/design/components/dialog/schema.ts` | 1 | noUnusedImports |
| `biome.json` | 1 | format (CRLF → LF) |
| `scripts/dev/inject-headers.ts` | 1 | format (CRLF → LF) |
| `scripts/test-schema.ts` | 1 | format (CRLF → LF) |
| `dialog.svelte.ts` | 1 | format (CRLF → LF) |
| **Total** | **19** | |

### Root Cause Analysis

1. **noConsole in scripts/**: `biome.json` has no override for `scripts/**/*.ts` to allow console.log in CLI scripts
2. **Unused #triggerEl**: Private field written but never read — attachTrigger action simplified too far
3. **Unused HeaderConfig**: Interface defined but never used — leftover from refactor
4. **Unused deriveSlotContract**: Import pulled in but never called

---

## Phase 1: Config + Unused Code (4 tasks)

### Task 1.1 — biome.json: add scripts override for noConsole
**File**: `interfaces/desktop/biome.json`
**Error**: `noConsole` triggers on all scripts/*.ts files
**Fix**: Add override to allow console in scripts:
```json
{
  "includes": ["scripts/**/*.ts"],
  "linter": {
    "rules": {
      "suspicious": {
        "noConsole": "off"
      }
    }
  }
}
```

### Task 1.2 — dialog.svelte.ts: remove unused #triggerEl
**File**: `src/lib/design/api/adapters/coldlight/_internal/dialog/dialog.svelte.ts:24`
**Error**: `noUnusedPrivateClassMembers` — #triggerEl written but never read
**Fix**: Remove line 24 (`#triggerEl: HTMLElement | null = null;`) and simplify `attachTrigger` to just return `{ destroy: () => {} }`

### Task 1.3 — inject-headers.ts: remove unused HeaderConfig interface
**File**: `scripts/dev/inject-headers.ts:26-30`
**Error**: `noUnusedVariables` — interface HeaderConfig unused
**Fix**: Delete the interface definition (lines 26-30)

### Task 1.4 — dialog/schema.ts: remove unused deriveSlotContract import
**File**: `src/lib/design/components/dialog/schema.ts:15`
**Error**: `noUnusedImports` — deriveSlotContract never used
**Fix**: Remove `deriveSlotContract` from import statement

---

## Phase 2: Format + Verify (4 tasks)

### Task 2.1 — Run biome format --write
**Command**: `pnpm biome format --write .`
**Expected**: Fixes CRLF → LF on all affected files

### Task 2.2 — Run biome check
**Command**: `pnpm biome check .`
**Expected**: 0 errors

### Task 2.3 — Run svelte-check
**Command**: `pnpm svelte-check`
**Expected**: 0 errors (warnings OK)

### Task 2.4 — Stage and verify pre-commit
**Command**: `git add -A && git commit -m "fix: biome lint hygiene"`
**Expected**: Pre-commit hooks pass

---

## File Inventory

### Modified Files (4)

```
interfaces/desktop/biome.json                                          — 1 fix (scripts override)
interfaces/desktop/src/lib/design/api/adapters/coldlight/_internal/dialog/dialog.svelte.ts — 1 fix (remove #triggerEl)
interfaces/desktop/scripts/dev/inject-headers.ts                       — 1 fix (remove HeaderConfig)
interfaces/desktop/src/lib/design/components/dialog/schema.ts          — 1 fix (remove unused import)
```

### New Files (0)
### Deleted Files (0)

---

## Execution Rules

1. Read every file before editing it
2. Fix one file at a time, verify with grep before moving to next
3. Run biome check after all edits
4. No architecture changes — this sprint is mechanical hygiene only
5. No new features, no refactors, no "improvements"
6. If a fix is ambiguous, stop and ask
