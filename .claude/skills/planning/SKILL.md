---
name: planning
description: Research and plan before implementation, creating accompanying documentation
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, WebSearch, WebFetch, Write, TodoWrite
argument-hint: "<topic or sprint to research>"
---

# Planning — Research & Documentation

Research topic: $ARGUMENTS

## Purpose

Before implementation or when parking lot requires research:
1. Investigate the problem space
2. Review existing patterns in codebase
3. Document findings
4. Create or update sprint plan

## Protocol

### 1. Create Research Document
In the sprint directory, create `{SPRINT-NAME}.research.md`:
```markdown
# Research: {topic}

**Date**: {YYYY-MM-DD}
**Sprint**: {associated sprint if any}
**Status**: IN_PROGRESS

## Question/Goal
{What we need to understand}

## Codebase Analysis
{What exists, patterns found, relevant files}

## External Research
{Best practices, documentation, examples}

## Findings
{Key takeaways}

## Recommendations
{Proposed approach with rationale}

## Files Referenced
- {file1}: {why relevant}
- {file2}: {why relevant}
```

### 2. Codebase Research
- Search for existing patterns: `Grep` for similar implementations
- Find related files: `Glob` for file structure
- Read key files: understand current architecture
- Document what you find — don't just read and forget

### 3. External Research (if needed)
- Search for best practices
- Find authoritative documentation
- Look for known solutions to the problem

### 4. Update Sprint Document
If sprint exists:
1. Read sprint file
2. Add `## Research Notes` section linking to research doc
3. Update tasks based on findings
4. Add any new prerequisites discovered

If no sprint exists:
1. Create sprint document following standard format
2. Include all checkboxes for implementation
3. Link research document

### 5. Present Findings
Summarize:
- What was learned
- Recommended approach
- Any remaining questions (→ parking lot)

## Output

Always produce:
1. Research document (detailed notes)
2. Updated/new sprint document (actionable plan)
3. Summary to user (key findings + recommendation)

## STOP Points — Owner Decision Protocol

**Sprints are DRY RUNS.** The owner is in charge — not the AI.

### Rules
1. **ZERO ASSUMPTIONS** — If you don't know, you STOP and ask. Period.
2. **STOP at every decision point** — Any place where the direction could go more than one way, you STOP and present options to the owner. You do NOT pick for them.
3. **STOP when you need answers** — Architecture choices, naming, scope, priority, approach — all require owner sign-off before proceeding.
4. **Mark STOP points explicitly** in sprint documents:
   ```markdown
   ### 🛑 STOP — Owner Decision Required
   **Question**: {what you need answered}
   **Options**: {A, B, C with tradeoffs}
   **Impact**: {what this decision affects downstream}
   ```
5. **Redo if needed** — If the owner says it's wrong, rewrite it. Second time, third time, doesn't matter. Get it right.
6. **No forward progress past a STOP** — Do NOT continue planning/coding past a STOP point until the owner answers. The sprint document captures where you stopped and why.
7. **Sprint phases gate on owner approval** — Each phase of a sprint ends with owner review. Next phase does not start without explicit go-ahead.

### What triggers a STOP
- Schema design choices (what fields, what types, what's required vs optional)
- Naming decisions (contract field names, function names, file paths)
- Architecture decisions (where code lives, what depends on what)
- Scope decisions (what's in this sprint vs deferred)
- Priority decisions (what order to build things)
- Any time you're about to assume what the owner wants
- Any time two valid approaches exist and the "right" one depends on owner intent

## Never

- Never start implementation during research
- Never skip documenting findings
- Never assume — verify in the codebase
- Never make architecture decisions without owner sign-off
- Never continue past a STOP point without owner answer
- Never treat a sprint as final until owner explicitly approves it
