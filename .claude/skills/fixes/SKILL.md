---
name: fixes
description: Execute implementation fixes from a sprint plan
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, TodoWrite, AskUserQuestion
argument-hint: "<sprint name or specific fix description>"
---

# Fixes — Sprint Implementation Executor

Execute: $ARGUMENTS

## Purpose

Implement changes defined in a sprint plan:
1. Follow the checklist exactly
2. Verify after each step
3. Maintain documentation
4. Commit when complete

## Protocol

### 1. Load Sprint Context
MANDATORY before any implementation:
```
[ ] Read sprint document completely
[ ] Read any associated research document
[ ] Read PARKING_LOT.md if exists
[ ] Verify prerequisites are met
```

### 2. Create Implementation Todos
Convert sprint checkboxes to TodoWrite:
- One todo per checkbox
- Preserve exact wording
- Add verification step after each

### 3. Execute Each Task
For EACH checkbox:

**Before:**
- [ ] Re-read sprint file (absorb current state)
- [ ] Read all files you will modify

**During:**
- [ ] Make the change
- [ ] Keep change minimal and focused

**After:**
- [ ] Run verification command
- [ ] If PASS → mark todo complete, continue
- [ ] If FAIL → enter `/corrections` mode

### 4. Handle Blockers
If any task is unclear or blocked:
1. STOP immediately
2. Invoke `/parkinglot` skill
3. Wait for decision
4. Resume only after decision is made

### 5. Final Verification
After all tasks complete:
```
[ ] Run full pre-commit hooks
[ ] All checks pass
[ ] Update sprint status to COMPLETE
```

### 6. Commit
Only after all verification passes:
```
[ ] Stage specific files (not git add -A)
[ ] Commit with conventional message
[ ] Include Co-Authored-By line
```

## Checkpoint Pattern

After every 3 tasks or at marked checkpoints:
1. Stop
2. Report status to user
3. Re-read sprint document
4. Continue only after confirmation

## Never

- Never skip reading files before editing
- Never skip verification after changes
- Never continue past a blocker
- Never commit with failing checks
- Never batch multiple tasks without verification
