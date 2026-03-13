---
name: fixes
description: Execute implementation fixes from a sprint plan. Pre-release — no shims, no backwards compat, fix root causes.
user-invocable: true
disable-model-invocation: false
argument-hint: "<sprint name or specific fix description>"
---

# Fixes — Sprint Implementation Executor

Execute: $ARGUMENTS

## Purpose

Implement changes defined in a sprint plan:
1. Follow the checklist exactly
2. Verify after each step
3. Fix root causes, never symptoms
4. Gate check before commit

## Pre-Release Rules (ACTIVE)

This project is in pre-release. These rules override any "minimal change" instinct:

1. **No backwards compatibility.** There are no external consumers. Change the interface.
2. **No shims.** If an import path changed, update the consumer. Don't add a re-export.
3. **No optional fields to avoid fixing data.** If the schema says required, fix the data.
4. **Merge duplicates on sight.** If you find the same type in two files, invoke `/consolidate`.
5. **Delete dead code.** If a file has zero importers after your change, delete it.
6. **One definition per concept.** If you're about to write `export type Foo` and Foo already
   exists somewhere, you're creating a duplicate. Stop and redirect.

## Protocol

### 1. Load Sprint Context

MANDATORY before any implementation:
```
[ ] Read sprint document completely
[ ] Read any associated research document
[ ] Verify prerequisites are met
[ ] Identify SSOTs for all types/modules this sprint touches
```

### 2. SSOT Map (do this before writing code)

Before touching any file, build a map of where things live:
```
Types I'll use:
  - {TypeName} → SSOT: {file}:{line}
  - {TypeName} → SSOT: {file}:{line}

Modules I'll import:
  - {module} → source: {file} (NOT a barrel re-export)

Schemas I'll validate against:
  - {SchemaName} → SSOT: {file}:{line}
```

If any SSOT is ambiguous or duplicated → invoke `/consolidate` FIRST.

### 3. Execute Each Task

For EACH sprint checkbox:

**Before:**
- [ ] Re-read sprint file
- [ ] Read ALL files you will modify
- [ ] Verify your imports point to SSOTs (not barrels, not duplicates)

**During:**
- [ ] Make the change
- [ ] Import from SSOT directly — never from a re-export barrel (except design/index.ts public API)
- [ ] If you need a type that doesn't exist: create it in the correct SSOT location, not in a local types.ts

**After:**
- [ ] Compile check: `npx svelte-check --threshold error`
- [ ] If errors cascade: fix the consumers, don't revert the change
- [ ] Mark todo complete

### 4. Handle Blockers

If any task is unclear or blocked:
1. STOP immediately
2. Invoke `/parkinglot`
3. Wait for decision
4. Resume only after decision is made

**Specifically STOP if:**
- You're about to create a file that duplicates an existing definition
- You're about to make a field optional to avoid fixing callers
- You're about to add `as any` or `as unknown`
- The compile error is demanding an anti-pattern to resolve
- You're about to restore a deleted file

### 5. Final Verification

After all tasks complete:
```bash
cd interfaces/desktop && npx svelte-check --threshold error
```

Then run `/gate` checks:
- [ ] No new duplicate type definitions
- [ ] No new re-export barrels
- [ ] No `as any` or `as unknown`
- [ ] No references to deleted concepts
- [ ] No bandaid/temporary code

### 6. Commit (only when owner asks)

After all verification passes:
- Stage specific files (not `git add -A`)
- Conventional commit message
- Include `Co-Authored-By` line

## Checkpoint Pattern

After every 3 tasks or at marked checkpoints:
1. Stop and report status
2. Re-read sprint document
3. Run compile check
4. Continue only after confirmation

## Never

- Never skip reading files before editing
- Never skip verification after changes
- Never continue past a blocker
- Never commit with failing checks
- Never create backwards-compat shims
- Never restore deleted files to fix imports
- Never make schemas weaker to avoid fixing data
- Never batch tasks without verifying each one
