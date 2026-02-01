---
name: sprint
description: Execute a sprint plan from the sprint docs
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, Task, TodoWrite
argument-hint: "<sprint number or name>"
---

# Sprint Executor

Execute sprint: $ARGUMENTS

## Protocol

1. Find and read the sprint file from `scripts/docs/sprints/`
2. Read `scripts/docs/.claude/MASTER_SPRINT_PLAN.md` for context
3. Verify all prerequisites listed in the sprint are met
4. Create a TodoWrite checklist from the sprint tasks
5. Execute each task in order
6. After each task: verify it compiles (`pnpm svelte-check` or `cargo clippy`)
7. At checkpoint boundaries, pause and report status
8. Never skip a task — if blocked, report why
