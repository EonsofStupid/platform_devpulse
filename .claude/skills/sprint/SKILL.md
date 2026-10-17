---
name: sprint
description: Execute a sprint plan end-to-end. Integrates audit, fixes, gate, and consolidation into one workflow.
user-invocable: true
disable-model-invocation: true
argument-hint: "<sprint number or name>"
---

# Sprint Executor

Execute sprint: $ARGUMENTS

## Workflow

A sprint is NOT "read the file and start coding." It's a pipeline:

```
/preflight → audit → /consolidate (if needed) → /fixes → /gate → commit
```

### Phase 0: Preflight
1. Run `/preflight` — loads SurrealDB context via curl (health → dev_profile → rejections → learnings → patterns → memories → decisions)
2. Read CLAUDE.md, ADR.md, active sprint doc
3. Verify disk state matches expectations
4. Report what you know and what you don't
5. Check rejections — do NOT proceed if sprint contradicts a locked rejection

### Phase 1: Audit (before writing any code)
1. Find and read the sprint file from `scripts/docs/sprints/`
2. Read `scripts/docs/.claude/MASTER_SPRINT_PLAN.md` for context
3. Identify all files the sprint will touch
4. Run audit checks on those files:
   - Any duplicate type definitions?
   - Any stale imports or re-exports?
   - Any competing SSOTs?
5. If audit finds issues → invoke `/consolidate` before proceeding
6. Report audit findings to owner

### Phase 2: Prerequisites
1. Verify all prerequisites listed in the sprint are met
2. Build SSOT map for all types/modules the sprint touches
3. If prerequisites are NOT met → STOP. Report what's missing.

### Phase 3: Execute
1. Create TodoWrite checklist from sprint tasks
2. Execute each task via `/fixes` protocol:
   - Read before edit
   - Import from SSOT
   - Compile after each change
   - Fix cascading errors forward (never revert)
3. At checkpoint boundaries, pause and report status
4. Never skip a task — if blocked, invoke `/parkinglot`

### Phase 4: Gate
1. Run `/gate` checks:
   - No duplicate definitions
   - No stale re-exports
   - No bandaid code
   - No `any` types
   - No deleted concept references
   - Compile passes with 0 errors
2. If gate fails → fix failures, re-run gate
3. Only proceed to commit when gate is CLEAR

### Phase 5: Commit (only when owner asks)
1. `git status` to review changes
2. `git diff` to verify what's staged
3. Stage specific files
4. Conventional commit message
5. Run gate one final time after commit hooks

## Sprint Integrity Rules

1. **No drift.** Do exactly what the sprint says. If you discover something that
   needs doing that's not in the sprint, add it to the parking lot — don't silently do it.
2. **No anti-patterns to unblock.** If a task can't be completed without writing bandaid
   code, STOP and report. The sprint is wrong, not the architecture.
3. **Compile after every task.** Not after every phase. After every single task.
4. **Re-read the sprint file at checkpoints.** Context compaction loses details.
   The sprint file is the ground truth.
5. **Owner approval gates phases.** Don't start Phase 3 without owner confirming
   Phase 2 prerequisites are met.

## Never

- Never start coding without completing Phase 1 (audit)
- Never skip prerequisites verification
- Never continue past a blocker
- Never weaken schemas to make tasks easier
- Never create duplicate definitions
- Never commit without passing gate
